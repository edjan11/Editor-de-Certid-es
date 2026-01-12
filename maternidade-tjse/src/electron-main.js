const { app, Tray, Menu, nativeImage, Notification, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const fs = require('fs');

// Desabilita avisos de segurança
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let tray = null;
let isChecking = false;
let lastNotificationCount = 0;
let checkInterval = null;

// Configurações
const CONFIG = {
  targetUrl: "https://www.tjse.jus.br/registrocivil/seguro/maternidade/solicitacaoExterna/consultaSolicitacaoExterna.tjse",
  chromeExePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  chromeProfile: "Default",
  checkIntervalMs: 3 * 60 * 1000, // 3 minutos (verificação mais frequente)
  testMode: false // DESATIVADO - Só notifica quando for real
};

// Carrega ícone .ICO
function getTrayIcon(status) {
  const iconsDir = path.join(__dirname, '..', 'icons');
  let iconFile;
  
  if (status === 'offline') {
    iconFile = 'maternidade-offline.ico';
  } else if (status === 'new') {
    iconFile = 'maternidade-nova-solicitacao.ico';
  } else {
    iconFile = 'maternidade-ok.ico';
  }
  
  const iconPath = path.join(iconsDir, iconFile);
  
  if (fs.existsSync(iconPath)) {
    console.log(`✓ Ícone carregado: ${iconFile}`);
    return nativeImage.createFromPath(iconPath);
  }
  
  console.log(`⚠ Ícone não encontrado: ${iconFile}`);
  return nativeImage.createEmpty();
}

// Abre o Chrome no TJSE
function openTJSE() {
  const args = [
    `--profile-directory=${CONFIG.chromeProfile}`,
    '--no-first-run',
    '--disable-features=Translate',
    CONFIG.targetUrl
  ];
  
  spawn(CONFIG.chromeExePath, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  }).unref();
  
  console.log('[Maternidade TJSE] Chrome aberto');
  
  new Notification({
    title: '🚀 Maternidade TJSE Aberto',
    body: 'Sistema de solicitações aberto com sucesso',
  }).show();
}

// Verifica status do site
async function checkSiteStatus() {
  return new Promise((resolve) => {
    const req = https.get(CONFIG.targetUrl, { timeout: 10000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Verifica novas solicitações REAIS na página do TJSE
async function checkNewRecords() {
  if (CONFIG.testMode) {
    const fakeNew = Math.random() > 0.5 ? 1 : 0;
    if (fakeNew > 0) console.log('🧪 [TESTE] Simulando nova solicitação!');
    return fakeNew;
  }
  
  // Verificação REAL: busca status "SOLICITADO" na página
  return new Promise((resolve) => {
    try {
      https.get(CONFIG.targetUrl, { timeout: 10000 }, (res) => {
        let html = '';
        
        res.on('data', (chunk) => {
          html += chunk.toString();
        });
        
        res.on('end', () => {
          // Procura por opções com value="SOLICITADO" selecionadas ou linhas na tabela
          // que indicam status "Solicitada" (feminino no HTML, mas é SOLICITADO no value)
          const solicitadoMatch = html.match(/value="SOLICITADO"/gi);
          const tabelaMatch = html.match(/>\s*Solicitada\s*</gi);
          
          // Conta quantas vezes aparece (indica número de solicitações pendentes)
          const count = (solicitadoMatch ? solicitadoMatch.length : 0) + 
                       (tabelaMatch ? tabelaMatch.length : 0);
          
          if (count > 0) {
            console.log(`✓ Detectadas ${count} solicitações com status SOLICITADO`);
          }
          
          resolve(count);
        });
      }).on('error', () => {
        console.log('⚠ Erro ao verificar solicitações');
        resolve(0);
      });
    } catch (err) {
      console.log('⚠ Erro na verificação:', err.message);
      resolve(0);
    }
  });
}

// Atualiza ícone da bandeja
function updateTrayIcon(status) {
  if (!tray) return;
  
  let iconStatus, tooltip;
  
  if (status.offline) {
    iconStatus = 'offline';
    tooltip = '❌ Maternidade TJSE - Offline';
  } else if (status.newRecords > 0) {
    iconStatus = 'new';
    tooltip = `🔔 Maternidade TJSE - ${status.newRecords} NOVA SOLICITAÇÃO!`;
  } else {
    iconStatus = 'online';
    tooltip = '✅ Maternidade TJSE - Online - Sem novidades';
  }
  
  tray.setImage(getTrayIcon(iconStatus));
  tray.setToolTip(tooltip);
}

// Verificação periódica
async function performCheck() {
  if (isChecking) return;
  isChecking = true;
  
  try {
    const online = await checkSiteStatus();
    const newRecords = online ? await checkNewRecords() : 0;
    
    const status = {
      offline: !online,
      newRecords,
      lastCheck: new Date().toLocaleTimeString('pt-BR')
    };
    
    // Atualiza ícone (verde → amarelo quando tem nova)
    updateTrayIcon(status);
    
    // NOTIFICAÇÃO COM DESTAQUE quando houver nova solicitação
    if (newRecords > 0 && newRecords !== lastNotificationCount) {
      const notification = new Notification({
        title: '🔔 NOVA SOLICITAÇÃO DE MATERNIDADE!',
        body: `${newRecords} solicitação pendente no Registro Civil.\nClique para abrir o sistema.`,
        urgency: 'critical',
        timeoutType: 'never',
        silent: false
      });
      
      notification.on('click', () => {
        openTJSE();
      });
      
      notification.show();
      
      // Faz o ícone piscar chamando atenção
      let blinkCount = 0;
      const blinkInterval = setInterval(() => {
        tray.setImage(blinkCount % 2 === 0 ? getTrayIcon('new') : getTrayIcon('online'));
        blinkCount++;
        if (blinkCount > 6) clearInterval(blinkInterval); // Para de piscar após 3 ciclos
      }, 500);
      
      lastNotificationCount = newRecords;
      console.log(`🔔 NOTIFICAÇÃO ENVIADA: ${newRecords} nova(s) solicitação(ões)`);
    }
    
    // Notifica se o site caiu
    if (!online) {
      new Notification({
        title: '⚠️ Maternidade TJSE Indisponível',
        body: 'O sistema não está respondendo. Verifique sua conexão.',
        urgency: 'critical'
      }).show();
    }
    
    console.log(`[${status.lastCheck}] Status: ${online ? '🟢' : '🔴'} | Novas: ${newRecords}`);
    
  } catch (error) {
    console.error('Erro na verificação:', error);
  } finally {
    isChecking = false;
  }
}

// Cria o menu do tray
function createTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: '🚀 Abrir Maternidade TJSE',
      click: openTJSE
    },
    { type: 'separator' },
    {
      label: '🔄 Verificar Novas Solicitações',
      click: performCheck
    },
    { type: 'separator' },
    {
      label: CONFIG.testMode ? '🧪 Modo Teste: ATIVO' : '✅ Modo Produção',
      enabled: false
    },
    {
      label: `⏱️ Intervalo: ${CONFIG.checkIntervalMs / 60000} min`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: '❌ Sair do Monitor',
      click: () => app.quit()
    }
  ]);
}

// Inicializa o aplicativo
app.whenReady().then(() => {
  // Cria o tray com ícone verde
  tray = new Tray(getTrayIcon('online'));
  tray.setToolTip('Monitor Maternidade TJSE - Carregando...');
  tray.setContextMenu(createTrayMenu());
  
  // Clique duplo abre o TJSE
  tray.on('double-click', openTJSE);
  
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  🔍 Monitor Maternidade TJSE - RCPN      ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log('✅ Ícone adicionado à bandeja do sistema');
  console.log('🖱️  Clique direito: Menu completo');
  console.log('🖱️  Clique duplo: Abrir Maternidade TJSE');
  
  if (CONFIG.testMode) {
    console.log('\n🧪 MODO TESTE ATIVO - Simulando notificações fake');
    console.log('   Para desativar: CONFIG.testMode = false\n');
  }
  
  // Primeira verificação
  performCheck();
  
  // Inicia verificações periódicas
  checkInterval = setInterval(performCheck, CONFIG.checkIntervalMs);
});

// Impede que o app feche
app.on('window-all-closed', (e) => e.preventDefault());

// Limpa ao sair
app.on('before-quit', () => {
  if (checkInterval) clearInterval(checkInterval);
  if (tray) tray.destroy();
});
