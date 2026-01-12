/**
 * CONTRATO JSON PADRÃO DO SISTEMA
 * 
 * Este é o único formato aceito pelo backend.
 * Qualquer entrada (Skylight, Playwright, manual) DEVE seguir este schema.
 * 
 * Validação feita com JSON Schema ou Zod.
 */

// ============================================
// REGISTRO DE SERVIÇO (entrada principal)
// ============================================
const RegistroSchema = {
  // Identificador único da CRC
  crc_id: "string REQUIRED",           // ex: "12345678"
  
  // Dados do registrado
  nome_registrado: "string REQUIRED",  // ex: "ANDERSON DA SILVA PORTO"
  nome_mae: "string OPTIONAL",         // ex: "MARIA DA SILVA"
  nome_pai: "string OPTIONAL",         // ex: "JOSÉ PORTO"
  data_nascimento: "string OPTIONAL",  // ex: "15/03/1990" (será convertido para DATE)
  
  // Dados do livro
  termo: "string OPTIONAL",            // ex: "100"
  livro: "string OPTIONAL",            // ex: "A-55"
  folha: "string OPTIONAL",            // ex: "123"
  
  // Classificação
  tipo_certidao: "string REQUIRED",    // nascimento | casamento | obito
  oficio: "number REQUIRED",           // 6, 9, 12, 13, 14, 15
  
  // Selo (pode vir preenchido ou ser atribuído depois)
  selo_numero: "string OPTIONAL",      // ex: "SE-001234-2026"
  selo_codigo: "string OPTIONAL",      // ex: "ABC123XYZ"
  
  // Origem da coleta (rastreabilidade)
  origem: "string REQUIRED"            // skylight | playwright | manual
};

// Exemplo de registro válido vindo do Skylight:
const exemploSkylight = {
  "crc_id": "87654321",
  "nome_registrado": "JOYCE DE OLIVEIRA",
  "nome_mae": "ANA OLIVEIRA DOS SANTOS",
  "nome_pai": "CARLOS OLIVEIRA",
  "data_nascimento": "22/08/1995",
  "termo": "100",
  "tipo_certidao": "nascimento",
  "oficio": 9,
  "origem": "skylight"
};

// Exemplo de registro com selo já vinculado (Playwright):
const exemploPlaywright = {
  "crc_id": "87654321",
  "nome_registrado": "JOYCE DE OLIVEIRA",
  "nome_mae": "ANA OLIVEIRA DOS SANTOS",
  "data_nascimento": "22/08/1995",
  "termo": "100",
  "tipo_certidao": "nascimento",
  "oficio": 9,
  "selo_numero": "SE-001234-2026",
  "selo_codigo": "ABC123XYZ",
  "origem": "playwright"
};


// ============================================
// SELO DISPONÍVEL (importação do TJ)
// ============================================
const SeloSchema = {
  selo_numero: "string REQUIRED",      // ex: "SE-001234-2026"
  selo_codigo: "string REQUIRED",      // ex: "ABC123XYZ"
  nome_registrado: "string REQUIRED",  // ex: "ANDERSON DA SILVA PORTO"
  data_nascimento: "string OPTIONAL",  // ex: "15/03/1990"
  tipo_certidao: "string OPTIONAL"     // nascimento | casamento | obito
};

// Exemplo de importação em lote:
const exemploImportacaoSelos = [
  {
    "selo_numero": "SE-001234-2026",
    "selo_codigo": "ABC123XYZ",
    "nome_registrado": "ANDERSON DA SILVA PORTO",
    "data_nascimento": "15/03/1990",
    "tipo_certidao": "nascimento"
  },
  {
    "selo_numero": "SE-001235-2026",
    "selo_codigo": "DEF456UVW",
    "nome_registrado": "JOYCE DE OLIVEIRA",
    "data_nascimento": "22/08/1995",
    "tipo_certidao": "nascimento"
  }
];


// ============================================
// LOG (gerado automaticamente pelo backend)
// ============================================
const LogSchema = {
  timestamp: "timestamp AUTOMATIC",     // gerado automaticamente
  registro_id: "number OPTIONAL",       // FK para registros.id
  acao: "string REQUIRED",              // ex: "registro_criado"
  detalhes: "object OPTIONAL",          // JSON livre com contexto
  origem: "string REQUIRED",            // skylight | playwright | backend | manual
  nivel: "string REQUIRED"              // debug | info | warning | error | critical
};

// Exemplo de log automático:
const exemploLog = {
  "timestamp": "2026-01-11T15:30:45.123Z",
  "registro_id": 42,
  "acao": "selo_vinculado",
  "detalhes": {
    "selo_numero": "SE-001234-2026",
    "selo_codigo": "ABC123XYZ",
    "similaridade": 0.95,
    "automatico": true
  },
  "origem": "playwright",
  "nivel": "info"
};


// ============================================
// RESPOSTA PADRÃO DO BACKEND
// ============================================
const RespostaBackend = {
  sucesso: "boolean",
  mensagem: "string",
  dados: "object OPTIONAL",  // dados retornados (ex: registro criado)
  erro: "string OPTIONAL"    // detalhes do erro se sucesso=false
};

// Exemplo de resposta bem-sucedida:
const respostaSucesso = {
  "sucesso": true,
  "mensagem": "Registro criado com sucesso",
  "dados": {
    "id": 42,
    "crc_id": "87654321",
    "status": "pendente"
  }
};

// Exemplo de resposta com erro:
const respostaErro = {
  "sucesso": false,
  "mensagem": "Validação falhou",
  "erro": "Campo 'nome_registrado' é obrigatório"
};


module.exports = {
  RegistroSchema,
  SeloSchema,
  LogSchema,
  RespostaBackend
};
