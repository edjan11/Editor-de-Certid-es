const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const ProcessMonitor = require('./monitor');

let mainWindow = null;
let monitor = null;

const processes = {
    maternidade: null,
    crc: null,
    backend: null
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 700,
        height: 650,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'icon.ico')
    });

    mainWindow.loadFile('controle.html');
    
    // Iniciar monitor real após janela carregar
    mainWindow.webContents.on('did-finish-load', () => {
        startRealMonitoring();
    });
}

// IPC: Iniciar módulo
ipcMain.handle('start-module', async (event, module) => {
    if (processes[module]) {
        throw new Error(`${module} já está rodando`);
    }

    let comando, args, cwd;

    switch (module) {
        case 'maternidade':
            comando = 'npm';
            args = ['start'];
            cwd = path.join(__dirname, 'maternidade-tjse');
            break;
        case 'crc':
            comando = 'npm';
            args = ['start'];
            cwd = path.join(__dirname, 'crc-nacional');
            break;
        case 'backend':
            comando = 'npm';
            args = ['run', 'dev'];
            cwd = path.join(__dirname, 'backend');
            break;
        default:
            throw new Error('Módulo desconhecido');
    }

    return new Promise((resolve, reject) => {
        const process = spawn(comando, args, { 
            cwd, 
            shell: true,
            detached: false
        });

        processes[module] = process;

        process.on('error', (error) => {
            console.error(`Erro ao iniciar ${module}:`, error);
            processes[module] = null;
            reject(error);
        });

        // Aguardar um pouco para garantir que iniciou
        setTimeout(() => resolve(), 2000);
    });
});

// IPC: Parar módulo
ipcMain.handle('stop-module', async (event, module) => {
    if (!processes[module]) {
        return; // Já está parado
    }

    return new Promise((resolve) => {
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', processes[module].pid, '/f', '/t']);
        } else {
            processes[module].kill('SIGTERM');
        }
        
        processes[module] = null;
        setTimeout(() => resolve(), 1000);
    });
});

// IPC: Verificar status REAL
ipcMain.handle('check-status', async (event, module) => {
    if (!monitor) return false;
    
    const status = await monitor.checkModuleStatus(module);
    return status === 'online';
});

// Iniciar monitoramento real
function startRealMonitoring() {
    if (monitor) return;
    
    monitor = new ProcessMonitor();
    
    monitor.startMonitoring((results) => {
        // Enviar atualização para interface
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('status-update', results);
        }
        
        // Log para debug
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] Status:`, results);
    });
    
    console.log('✅ Monitor real iniciado - Verificando a cada 30s');
}

// Parar monitoramento
function stopRealMonitoring() {
    if (monitor) {
        monitor.stopMonitoring();
        monitor = null;
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // Parar monitor
    stopRealMonitoring();
    
    // Matar todos os processos antes de sair
    Object.values(processes).forEach(proc => {
        if (proc) {
            if (process.platform === 'win32') {
                spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
            } else {
                proc.kill('SIGTERM');
            }
        }
    });
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
