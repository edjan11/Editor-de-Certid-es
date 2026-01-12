const { spawn } = require('child_process');
const path = require('path');
const CONFIG = require('./config');

/**
 * Abre o Chrome com perfil salvo (suas credenciais 2FA)
 * + injeta os userscripts automaticamente
 */
function openCRC() {
  const userDataDir = path.join(
    process.env.LOCALAPPDATA,
    'Google',
    'Chrome',
    'User Data'
  );

  // Lê os 2 userscripts para injetar
  const fs = require('fs');
  const scriptsDir = path.join(__dirname, '..', 'userscripts');
  
  const scripts = [
    fs.readFileSync(path.join(scriptsDir, 'ctrl-q-imprimir.js'), 'utf8'),
    fs.readFileSync(path.join(scriptsDir, 'ctrl-b-busca.js'), 'utf8')
  ];

  // Combina todos os scripts
  const combinedScript = scripts.join('\n\n');
  
  // Salva temporariamente para injeção
  const tempScriptPath = path.join(scriptsDir, '_combined.js');
  fs.writeFileSync(tempScriptPath, combinedScript);

  const args = [
    `--user-data-dir=${userDataDir}`,
    `--profile-directory=${CONFIG.chromeProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    CONFIG.CRC_HOME
  ];

  console.log('🌐 Abrindo CRC Nacional no Chrome...');
  console.log(`📂 Perfil: ${CONFIG.chromeProfile}`);
  console.log(`🔑 Login: Use suas credenciais 2FA salvas`);
  console.log('');

  const chromeProcess = spawn(CONFIG.chromePath, args, {
    detached: true,
    stdio: 'ignore'
  });

  chromeProcess.unref();

  return chromeProcess;
}

// Se executado diretamente
if (require.main === module) {
  openCRC();
  console.log('✅ Chrome aberto! Scripts Tampermonkey serão injetados automaticamente.');
}

module.exports = { openCRC };
