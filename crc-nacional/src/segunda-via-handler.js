const { shell } = require('electron');
const https = require('https');

/**
 * Handler para buscar 2ª Via no TJSE
 * Usa o Chrome com sessão ativa do usuário
 */

const URLS = {
  nascimento: 'https://www.tjse.jus.br/scc/paginas/segundaVia/nascimento/ConsultaSegundaViaNascimento.jsp',
  casamento: 'https://www.tjse.jus.br/scc/paginas/segundaVia/casamento/ConsultaSegundaViaCasamento.jsp',
  obito: 'https://www.tjse.jus.br/scc/paginas/segundaVia/obitoNascidoVivo/ConsultaSegundaViaObitoNascidoVivo.jsp'
};

/**
 * Busca 2ª Via no TJSE
 * Por enquanto retorna dados mockados para teste da interface
 * TODO: Implementar scraping automático via Puppeteer ou injeção de script
 */
async function buscarSegundaVia(dados) {
  console.log('🔍 [Handler] Buscando 2ª Via:', JSON.stringify(dados, null, 2));

  const url = URLS[dados.tipo];
  if (!url) {
    console.error('❌ [Handler] Tipo de registro inválido:', dados.tipo);
    throw new Error('Tipo de registro inválido');
  }

  console.log('⏳ [Handler] Simulando delay de 1s...');
  // Simula delay da requisição
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Retorna dados mockados para teste
  const resultados = mockResultados(dados);
  console.log(`✅ [Handler] Retornando ${resultados.length} resultado(s)`);
  
  if (resultados.length === 0) {
    console.log('💡 [Handler] Dica: Para abrir o TJSE manualmente, use o botão do menu');
  }

  return resultados;
}

/**
 * Mock de resultados para teste
 * TODO: Remover quando implementar busca real
 */
function mockResultados(dados) {
  console.log('📋 [Mock] Gerando resultados para:', JSON.stringify(dados, null, 2));

  // Dados de exemplo por termo
  const mockData = {
    '333': [
      {
        id: 60220,
        termo: '333',
        data: '21/10/1970',
        nome: 'ANA CRISTINA DE JESUS',
        mae: 'MARIA RAIMUNDA DE JESUS',
        pai: ''
      },
      {
        id: 269905,
        termo: '333',
        data: '19/06/1990',
        nome: 'MARLUCE MAYARA OLIVEIRA SANTOS',
        mae: 'MARCOS ANTONIO ALVES SANTOS',
        pai: 'LUCIA SANTOS OLIVEIRA'
      },
      {
        id: 25939,
        termo: '333',
        data: '20/12/1967',
        nome: 'ROSANGELA GOMES DE SOUZA',
        mae: 'ANGELINA GOMES DOS SANTOS',
        pai: 'LUIZ PEDRO DE SOUZA'
      }
    ],
    '100': [
      {
        id: 10001,
        termo: '100',
        data: '07/08/1985',
        nome: 'ANDERSON DA SILVA PORTO',
        mae: 'MARIA EUNICE DA SILVA',
        pai: 'JOÃO DOS SANTOS PORTO'
      },
      {
        id: 10002,
        termo: '100',
        data: '15/04/1985',
        nome: 'JOYCE DE OLIVEIRA',
        mae: 'RITA DE CASSIA DE OLIVEIRA',
        pai: ''
      },
      {
        id: 10003,
        termo: '100',
        data: '24/08/1997',
        nome: 'MARINA BISPO SANTOS',
        mae: 'MARINALVA BISPO DA LUZ',
        pai: 'ANTONIO SERGIO SOUZA SANTOS'
      },
      {
        id: 10004,
        termo: '100',
        data: '27/02/2004',
        nome: 'NATALY VITÓRIA OLIVEIRA DOS SANTOS',
        mae: 'CLEIDE JANE OLIVEIRA',
        pai: 'DENECLAN MOTA RODRIGUES DOS SANTOS'
      },
      {
        id: 10005,
        termo: '100',
        data: '10/06/1986',
        nome: 'REGIVALDO PEREIRA GAMA',
        mae: 'MARIA HELENA PEREIRA',
        pai: 'REGINALDO DE JESUS GAMA'
      },
      {
        id: 10006,
        termo: '100',
        data: '09/04/1949',
        nome: 'ROSA NOGUEIRA DA SILVA',
        mae: 'MARIA JOSEFA NOGUEIRA DA SILVA',
        pai: ''
      },
      {
        id: 10007,
        termo: '100',
        data: '14/06/1983',
        nome: 'SHISLEMY MARIA RIBEIRO BOMFIM',
        mae: 'ANA ELIANA RIBEIRO',
        pai: 'JOSÉ DE SOUZA BOMFIM'
      },
      {
        id: 10008,
        termo: '100',
        data: '27/06/1919',
        nome: 'STENTOR DE VASCONCELLOS RÊGO',
        mae: 'EDITH DE VASCONCELLOS REGO',
        pai: 'ARISTIDES NOBREGA DE VASCONCELLOS RÊGO'
      }
    ]
  };

  console.log('🔎 [Mock] Buscando termo:', dados.termo);
  console.log('🔎 [Mock] Termos disponíveis:', Object.keys(mockData));

  // Busca por termo exato
  if (dados.termo && mockData[dados.termo]) {
    console.log(`✅ [Mock] Encontrado ${mockData[dados.termo].length} resultado(s) para termo "${dados.termo}"`);
    return mockData[dados.termo];
  }

  // Busca por nome (case insensitive, parcial)
  if (dados.nome) {
    const nomeBusca = dados.nome.toLowerCase();
    console.log('🔎 [Mock] Buscando por nome:', nomeBusca);
    const todosResultados = Object.values(mockData).flat();
    const filtrados = todosResultados.filter(r => 
      r.nome.toLowerCase().includes(nomeBusca)
    );
    if (filtrados.length > 0) {
      console.log(`✅ [Mock] Encontrado ${filtrados.length} resultado(s) por nome`);
      return filtrados;
    }
  }

  // Nenhum resultado encontrado
  console.log('⚠️ [Mock] Nenhum resultado encontrado');
  console.log('💡 [Mock] Tente termo "333" ou "100" para ver resultados de teste');
  return [];
}

/**
 * Busca dados completos de um registro específico
 */
async function buscarDadosCompletos(id, tipo) {
  console.log('📄 Buscando dados completos:', id, tipo);

  // TODO: Implementar busca real via scraping
  // Por enquanto retorna mock
  return {
    id,
    tipo,
    // ... todos os campos do formulário
  };
}

module.exports = {
  buscarSegundaVia,
  buscarDadosCompletos
};
