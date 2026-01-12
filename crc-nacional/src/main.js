const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');

// ============================================
// CONFIGURAÇÃO
// ============================================
const CONFIG = {
  BACKEND_URL: 'http://localhost:3100',
  BACKEND_PORT: 3100,
  CRC_URL: 'https://sistema.registrocivil.org.br',
  WINDOW_WIDTH: 1400,
  WINDOW_HEIGHT: 900,
  TRAY_CHECK_INTERVAL: 60000 // 1 minuto
};

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let mainWindow = null;
let tray = null;
let backendCheckInterval = null;

// ============================================
// CRIAR JANELA PRINCIPAL COM ABAS
// ============================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: CONFIG.WINDOW_WIDTH,
    height: CONFIG.WINDOW_HEIGHT,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, '../icons/crc-icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      enableRemoteModule: true
    },
    title: 'Centralizador CRC - Sistema Completo',
    backgroundColor: '#1a1d24'
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Abre DevTools apenas em desenvolvimento
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Não fechar ao clicar X, minimiza para bandeja
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// ============================================
// CRIAR TRAY (BANDEJA DO SISTEMA)
// ============================================
function createTray() {
  const iconPath = path.join(__dirname, '../icons/crc-icon.ico');
  
  try {
    tray = new Tray(iconPath);
  } catch (error) {
    console.error('❌ Erro ao criar tray:', error);
    const { nativeImage } = require('electron');
    tray = new Tray(nativeImage.createEmpty());
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📊 Abrir Centralizador',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: '🌐 Abrir Backend (navegador)',
      click: () => shell.openExternal(CONFIG.BACKEND_URL)
    },
    {
      label: '⚙️ Reiniciar Backend',
      click: () => {
        exec('taskkill /F /IM node.exe && timeout /t 2 && cd C:\\Users\\Pichau\\Desktop\\Projetos\\Centralizador && INICIAR-TUDO.bat', (err) => {
          if (err) console.error('Erro ao reiniciar:', err);
        });
      }
    },
    { type: 'separator' },
    {
      label: '❌ Sair',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Centralizador CRC');

  // Duplo clique: abrir janela
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });

  // Verificar status do backend periodicamente
  checkBackendStatus();
  backendCheckInterval = setInterval(checkBackendStatus, CONFIG.TRAY_CHECK_INTERVAL);
}

// ============================================
// VERIFICAR STATUS DO BACKEND
// ============================================
async function checkBackendStatus() {
  try {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: CONFIG.BACKEND_PORT,
      path: '/health',
      method: 'GET',
      timeout: 2000
    };

    http.get(options, (res) => {
      if (res.statusCode === 200) {
        tray.setToolTip('✅ Centralizador CRC - Backend Online');
      } else {
        tray.setToolTip('⚠️ Centralizador CRC - Backend com problemas');
      }
    }).on('error', () => {
      tray.setToolTip('❌ Centralizador CRC - Backend Offline');
    });
  } catch (error) {
    console.error('Erro ao checar backend:', error);
  }
}

// ============================================
// HANDLERS IPC (comunicação com renderer)
// ============================================

// Abrir link externo no navegador padrão
ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

// Reiniciar backend
ipcMain.handle('reiniciar-backend', async () => {
  return new Promise((resolve) => {
    exec('cd C:\\Users\\Pichau\\Desktop\\Projetos\\Centralizador\\backend && npm run dev', (error) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// Parar backend
ipcMain.handle('parar-backend', async () => {
  return new Promise((resolve) => {
    exec('taskkill /F /IM node.exe /T', (error) => {
      if (error && error.code !== 128) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// Abrir logs
ipcMain.handle('abrir-logs', async () => {
  const logsPath = path.join(__dirname, '../../backend/logs/backend.log');
  shell.openPath(logsPath);
});

// Verificar status do backend
ipcMain.handle('verificar-backend', async () => {
  return new Promise((resolve) => {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: CONFIG.BACKEND_PORT,
      path: '/health',
      method: 'GET',
      timeout: 2000
    };

    http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ online: true, data: json });
        } catch {
          resolve({ online: false });
        }
      });
    }).on('error', () => {
      resolve({ online: false });
    });
  });
});

// ============================================
// INICIALIZAÇÃO DO APP
// ============================================
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // No macOS é comum apps ficarem ativos até o usuário sair explicitamente
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (backendCheckInterval) {
    clearInterval(backendCheckInterval);
  }
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', promise, 'razão:', reason);
});
