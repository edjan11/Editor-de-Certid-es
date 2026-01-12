// ========================================
// 📋 CONFIGURAÇÃO CRC NACIONAL
// ========================================

const CONFIG = {
  // URLs do sistema
  CRC_HOME: 'https://home.registrocivil.org.br/',
  CRC_SISTEMA: 'https://sistema.registrocivil.org.br/indexFrame.cfm',
  CRC_BUSCA_REGISTRO: 'https://sistema.registrocivil.org.br/buscas/buscaRegistros.cfm',
  CRC_BUSCA_CPF: 'https://sistema.registrocivil.org.br/receitaFederal/buscarCPF.cfm',
  
  // Horário de funcionamento (08h-17h)
  horarioInicio: 8,  // 08:00
  horarioFim: 17,    // 17:00
  
  // Intervalo de refresh para manter sessão ativa (em minutos)
  // Recomendado: 5-10 minutos
  refreshInterval: 5,
  
  // Configurações do Chrome
  chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  chromeProfile: 'Default', // ou 'Profile 1', 'Profile 2', etc.
  
  // Atalhos de teclado (informativo)
  atalhos: {
    'Ctrl+Q': 'Imprimir',
    'Ctrl+B': 'Busca de Registro'
  }
};

module.exports = CONFIG;
