const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');
const execPromise = util.promisify(exec);

/**
 * MONITOR REAL DE PROCESSOS E SERVIÇOS
 * Verifica se os módulos estão realmente ativos e respondendo
 */

class ProcessMonitor {
    constructor() {
        this.processes = {
            maternidade: {
                name: 'Maternidade TJSE',
                processName: 'chrome.exe',
                url: 'https://www.tjse.jus.br/registrocivil/seguro/maternidade',
                checkInterval: 30000, // 30s
                lastCheck: null,
                status: 'offline'
            },
            crc: {
                name: 'CRC Nacional',
                processName: 'electron.exe',
                url: 'https://sistema.registrocivil.org.br',
                checkInterval: 30000,
                lastCheck: null,
                status: 'offline'
            },
            backend: {
                name: 'Backend API',
                processName: 'node.exe',
                url: 'http://localhost:3100/health',
                checkInterval: 10000, // 10s (mais frequente)
                lastCheck: null,
                status: 'offline'
            }
        };
        
        this.monitoring = false;
    }

    /**
     * Verificar se processo está rodando no Windows
     */
    async checkProcess(processName) {
        try {
            const { stdout } = await execPromise(`tasklist /FI "IMAGENAME eq ${processName}" /NH`);
            return stdout.toLowerCase().includes(processName.toLowerCase());
        } catch (error) {
            console.error(`Erro ao verificar processo ${processName}:`, error.message);
            return false;
        }
    }

    /**
     * Verificar se URL responde
     */
    async checkUrl(url, timeout = 5000) {
        try {
            const response = await axios.get(url, {
                timeout,
                validateStatus: (status) => status < 500 // Aceita até 4xx
            });
            return response.status < 500;
        } catch (error) {
            // Timeout ou erro de conexão = offline
            return false;
        }
    }

    /**
     * Verificar se Chrome com perfil específico está rodando
     */
    async checkChromeWithProfile() {
        try {
            const { stdout } = await execPromise('wmic process where "name=\'chrome.exe\'" get commandline');
            
            // Verifica se existe instância com o perfil da maternidade ou TJSE na URL
            const hasTJSE = stdout.toLowerCase().includes('tjse.jus.br') || 
                           stdout.toLowerCase().includes('maternidade');
            
            return hasTJSE;
        } catch (error) {
            console.error('Erro ao verificar Chrome:', error.message);
            return false;
        }
    }

    /**
     * Verificar status completo de um módulo
     */
    async checkModuleStatus(moduleKey) {
        const module = this.processes[moduleKey];
        if (!module) return 'offline';

        let status = 'offline';

        // 1. Verificar se processo existe
        const processExists = await this.checkProcess(module.processName);
        
        if (!processExists) {
            module.status = 'offline';
            module.lastCheck = new Date();
            return 'offline';
        }

        // 2. Para Maternidade, verificar Chrome específico
        if (moduleKey === 'maternidade') {
            const chromeActive = await this.checkChromeWithProfile();
            status = chromeActive ? 'online' : 'offline';
        }
        // 3. Para Backend, verificar endpoint
        else if (moduleKey === 'backend') {
            const urlResponds = await this.checkUrl(module.url);
            status = urlResponds ? 'online' : 'offline';
        }
        // 4. Para CRC, verificar processo Electron
        else if (moduleKey === 'crc') {
            // Electron rodando = online (pode melhorar verificando porta específica)
            status = processExists ? 'online' : 'offline';
        }

        module.status = status;
        module.lastCheck = new Date();
        return status;
    }

    /**
     * Verificar todos os módulos
     */
    async checkAll() {
        const results = {};
        
        for (const key of Object.keys(this.processes)) {
            results[key] = await this.checkModuleStatus(key);
        }
        
        return results;
    }

    /**
     * Iniciar monitoramento contínuo
     */
    startMonitoring(callback) {
        if (this.monitoring) return;
        
        this.monitoring = true;
        console.log('🔍 Monitor iniciado - Verificando processos a cada 30s');

        // Verificação inicial
        this.checkAll().then(callback);

        // Verificações periódicas
        this.intervalId = setInterval(async () => {
            const results = await this.checkAll();
            callback(results);
        }, 30000); // 30 segundos
    }

    /**
     * Parar monitoramento
     */
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.monitoring = false;
        console.log('🛑 Monitor parado');
    }

    /**
     * Obter status atual de um módulo
     */
    getStatus(moduleKey) {
        return this.processes[moduleKey]?.status || 'offline';
    }

    /**
     * Obter todos os status
     */
    getAllStatus() {
        const status = {};
        for (const [key, module] of Object.entries(this.processes)) {
            status[key] = {
                name: module.name,
                status: module.status,
                lastCheck: module.lastCheck
            };
        }
        return status;
    }

    /**
     * Keep-alive para Backend (enviar ping)
     */
    async keepAliveBackend() {
        try {
            await axios.get('http://localhost:3100/health', { timeout: 3000 });
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = ProcessMonitor;
