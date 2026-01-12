const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const https = require('https');
const { openCRC } = require('./launchChrome');
const CONFIG = require('./config');
const { buscarSegundaVia, buscarDadosCompletos } = require('./segunda-via-handler');

let tray = null;
let mainWindow = null;
let segundaViaWindow = null;
let formWindow = null;
let refreshInterval = null;
let lastRefreshTime = null;
let sessionActive = false;

// ============================================
// SISTEMA DE TRAY
// ============================================

function createTray() {
  const iconPath = path.join(__dirname, '..', 'icons', 'crc-icon.ico');
  const fs = require('fs');
  
  try {
    // Verifica se o ícone existe
    if (fs.existsSync(iconPath)) {
      tray = new Tray(iconPath);
      console.log('✅ Ícone da bandeja carregado');
    } else {
      // Usa ícone padrão do Electron (nativeImage vazio funciona no Windows)
      const { nativeImage } = require('electron');
      const icon = nativeImage.createEmpty();
      tray = new Tray(icon);
      console.log('⚠️ Usando ícone padrão (adicione crc-icon.ico na pasta icons/)');
    }
  } catch (error) {
    console.error('❌ Erro ao criar tray:', error.message);
    // Tenta criar sem ícone
    const { nativeImage } = require('electron');
    const icon = nativeImage.createEmpty();
    tray = new Tray(icon);
  }

  updateTrayTooltip('CRC Nacional - Aguardando...');
  
  // Duplo clique: abre painel
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createMainWindow();
    }
  });

  createTrayMenu();
}

function createTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🏛️ CRC Nacional',
      enabled: false
    },
    { type: 'separator' },
    {
      label: '📊 Abrir Painel',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createMainWindow();
        }
      }
    },
    {
      label: '🌐 Abrir CRC no Chrome',
      click: () => openCRC()
    },
    { type: 'separator' },
    {
      label: '� 2ª Via TJSE',
      click: () => createSegundaViaWindow()
    },
    {
      label: '�🔍 Buscar Registro',
      click: () => shell.openExternal(CONFIG.CRC_BUSCA_REGISTRO)
    },
    {
      label: '📄 Buscar CPF',
      click: () => shell.openExternal(CONFIG.CRC_BUSCA_CPF)
    },
    { type: 'separator' },
    {
      label: '🔄 Refresh Manual',
      click: () => performRefresh()
    },
    {
      label: `⏰ Horário: ${CONFIG.horarioInicio}h-${CONFIG.horarioFim}h`,
      enabled: false
    },
    {
      label: `⚡ Refresh: ${CONFIG.refreshInterval} min`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: '❌ Sair',
      click: () => {
        if (refreshInterval) clearInterval(refreshInterval);
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function updateTrayTooltip(text) {
  if (tray) {
    tray.setToolTip(text);
  }
}

// ============================================
// JANELA DE 2ª VIA
// ============================================

function createSegundaViaWindow() {
  if (segundaViaWindow) {
    segundaViaWindow.show();
    return;
  }

  segundaViaWindow = new BrowserWindow({
    width: 850,
    height: 700,
    resizable: true,
    frame: true,
    parent: mainWindow,
    modal: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '..', 'icons', 'crc-icon.ico')
  });

  segundaViaWindow.loadFile(path.join(__dirname, 'renderer', 'segunda-via.html'));

  segundaViaWindow.on('closed', () => {
    segundaViaWindow = null;
  });
}

// ============================================
// JANELA DE FORMULÁRIO 2ª VIA
// ============================================

function createFormularioWindow(dadosIniciais = null) {
  if (formWindow) {
    formWindow.show();
    if (dadosIniciais) {
      formWindow.webContents.send('preencher-formulario', dadosIniciais);
    }
    return;
  }

  formWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    resizable: true,
    frame: true,
    modal: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '..', 'icons', 'crc-icon.ico')
  });

  formWindow.loadFile(path.join(__dirname, 'renderer', 'formulario-segunda-via.html'));

  formWindow.on('closed', () => {
    formWindow = null;
  });

  // Envia dados iniciais depois que a página carregar
  if (dadosIniciais) {
    formWindow.webContents.on('did-finish-load', () => {
      formWindow.webContents.send('preencher-formulario', dadosIniciais);
    });
  }
}

// ============================================
// JANELA PRINCIPAL (PAINEL)
// ============================================

function createMainWindow() {
  if (mainWindow) {
    mainWindow.show();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 420,
    height: 580,
    resizable: false,
    frame: true,
    skipTaskbar: false,
    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '..', 'icons', 'crc-icon.ico')
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  // Envia status inicial
  sendStatusUpdate();
}

// ============================================
// KEEP-ALIVE AUTOMÁTICO
// ============================================

function isWorkingHours() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= CONFIG.horarioInicio && hour < CONFIG.horarioFim;
}

function performRefresh() {
  if (!isWorkingHours()) {
    console.log('🕐 Fora do horário de funcionamento');
    sessionActive = false;
    updateTrayTooltip('CRC Nacional - Fora do horário (08h-17h)');
    sendStatusUpdate();
    return;
  }

  console.log('🔄 Realizando refresh da sessão...');

  // Faz requisição para manter sessão ativa
  https.get(CONFIG.CRC_SISTEMA, (res) => {
    const now = new Date();
    lastRefreshTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (res.statusCode === 200) {
      console.log(`✅ Sessão mantida ativa - ${lastRefreshTime}`);
      sessionActive = true;
      updateTrayTooltip(`CRC Nacional - Sessão Ativa (${lastRefreshTime})`);
    } else {
      console.warn('⚠️ Possível timeout - faça login novamente');
      sessionActive = false;
      updateTrayTooltip('CRC Nacional - Sessão expirada! Faça login');
    }
    
    sendStatusUpdate();
  }).on('error', (err) => {
    console.error('❌ Erro ao fazer refresh:', err.message);
    sessionActive = false;
    updateTrayTooltip('CRC Nacional - Erro de conexão');
    sendStatusUpdate();
  });
}

function startKeepAlive() {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   🏛️  CRC NACIONAL - KEEP ALIVE ATIVO    ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`⏰ Horário de funcionamento: ${CONFIG.horarioInicio}h - ${CONFIG.horarioFim}h`);
  console.log(`⚡ Refresh automático: a cada ${CONFIG.refreshInterval} minutos`);
  console.log('');
  console.log('📋 Scripts Tampermonkey ativos:');
  console.log('   • Ctrl+Q - Imprimir');
  console.log('   • Ctrl+B - Busca Registro');
  console.log('');
  console.log('✅ Sistema iniciado! Ícone na bandeja do Windows.');
  console.log('');

  // Primeiro refresh imediato
  performRefresh();

  // Refresh periódico
  const intervalMs = CONFIG.refreshInterval * 60 * 1000;
  refreshInterval = setInterval(() => {
    performRefresh();
  }, intervalMs);
}

function sendStatusUpdate() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', {
      sessionActive,
      lastRefresh: lastRefreshTime || 'Aguardando...'
    });
  }
}

// ============================================
// IPC HANDLERS (comunicação com painel)
// ============================================

ipcMain.on('open-url', (event, url) => {
  shell.openExternal(url);
});

ipcMain.on('manual-refresh', () => {
  performRefresh();
});

ipcMain.on('open-segunda-via', () => {
  createSegundaViaWindow();
});

ipcMain.handle('buscar-segunda-via', async (event, dados) => {
  console.log('📨 [IPC] Recebido buscar-segunda-via:', dados);
  try {
    const resultados = await buscarSegundaVia(dados);
    console.log(`📨 [IPC] Retornando ${resultados.length} resultado(s)`);
    return resultados;
  } catch (error) {
    console.error('❌ [IPC] Erro ao buscar 2ª via:', error);
    throw error;
  }
});

ipcMain.on('abrir-formulario', (event, dados) => {
  console.log('📄 Abrindo formulário para:', dados);
  createFormularioWindow(dados);
});

// Handler para salvar no TJSE (será implementado depois)
ipcMain.handle('salvar-segunda-via-tjse', async (event, dados) => {
  console.log('💾 [IPC] Recebido salvar-segunda-via-tjse:', dados);
  
  // TODO: Implementar integração real com TJSE
  // Por enquanto, simula salvamento
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    sucesso: true,
    mensagem: 'Certidão salva com sucesso (MOCK)',
    termo: dados.termo
  };
});

// ============================================
// INICIALIZAÇÃO DO APP
// ============================================

app.whenReady().then(() => {
  createTray();
  startKeepAlive();
  
  // Abre Chrome automaticamente
  setTimeout(() => {
    console.log('🌐 Abrindo Chrome com CRC Nacional...');
    openCRC();
  }, 2000);
});

app.on('window-all-closed', (e) => {
  e.preventDefault(); // Não fecha o app quando fecha a janela
});

app.on('before-quit', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
