/**
 * PRELOAD SCRIPT PARA WEBVIEW
 * Este script é executado ANTES do conteúdo da página carregar
 * Garante que o Explorer Selos seja injetado com segurança
 */

const fs = require('fs');
const path = require('path');

// Assim que o DOM estiver pronto, injeta o Explorer Selos
window.addEventListener('DOMContentLoaded', () => {
    console.log('[PRELOAD] DOMContentLoaded - carregando Explorer Selos...');
    
    try {
        // Carrega o script do Explorer Selos
        const scriptPath = path.join(__dirname, 'explorer-selos.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        
        // Cria uma função para executar o script no contexto da página
        const executeScript = new Function(scriptContent);
        executeScript();
        
        console.log('[PRELOAD] ✅ Explorer Selos carregado com sucesso!');
        console.log('[PRELOAD] 💡 Pressione Shift+S para abrir o painel');
        
        // Adiciona atalhos globais
        document.addEventListener('keydown', (e) => {
            // Ctrl+Q para Imprimir (atalho do userscript antigo)
            if (e.ctrlKey && e.key.toLowerCase() === 'q') {
                e.preventDefault();
                const btnImprimir = document.querySelector('input[type="button"][value="Imprimir"].botao');
                if (btnImprimir) {
                    btnImprimir.click();
                    console.log('[PRELOAD] ⚡ Ctrl+Q → Imprimir acionado');
                }
            }
            
            // Ctrl+B para Buscar (atalho do userscript antigo)
            if (e.ctrlKey && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                const btnBuscar = document.querySelector('input[type="button"][value="Buscar"].botao');
                if (btnBuscar) {
                    btnBuscar.click();
                    console.log('[PRELOAD] 🔍 Ctrl+B → Buscar acionado');
                }
            }
        });
        
    } catch (error) {
        console.error('[PRELOAD] ❌ Erro ao carregar Explorer Selos:', error);
    }
});

// Expõe informações úteis no console
console.log(`
╔════════════════════════════════════════════════════════════╗
║  EXPLORER SELOS CRC - Electron Edition                    ║
╠════════════════════════════════════════════════════════════╣
║  Atalhos Disponíveis:                                      ║
║  • Shift + S   → Abre/Fecha Explorer Selos                 ║
║  • Ctrl + Q    → Busca Primeira Certidão                   ║
║  • Ctrl + B    → Abre Busca Avançada                       ║
║  • Alt + P     → Verifica Pendentes                        ║
║  • Ctrl+Space  → Auto-Emissão                              ║
╚════════════════════════════════════════════════════════════╝
`);
