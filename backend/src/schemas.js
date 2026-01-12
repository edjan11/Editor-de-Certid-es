/**
 * VALIDAÇÃO DE DADOS COM ZOD
 * 
 * Define schemas Zod que espelham o contrato JSON.
 * Valida ANTES de tocar no banco.
 */

const { z } = require('zod');

// Schema de Registro (entrada principal)
const RegistroSchema = z.object({
  crc_id: z.string().min(1, 'crc_id é obrigatório'),
  
  nome_registrado: z.string().min(3, 'nome_registrado deve ter pelo menos 3 caracteres'),
  nome_mae: z.string().optional(),
  nome_pai: z.string().optional(),
  data_nascimento: z.string().optional(), // formato: DD/MM/AAAA
  
  termo: z.string().optional(),
  livro: z.string().optional(),
  folha: z.string().optional(),
  
  tipo_certidao: z.enum(['nascimento', 'casamento', 'obito'], {
    errorMap: () => ({ message: 'tipo_certidao deve ser: nascimento, casamento ou obito' })
  }),
  
  oficio: z.number().int().min(1).max(20, 'oficio deve ser um número válido'),
  
  json_path: z.string().optional(), // caminho do JSON salvo (ex: "2025-01-11/JOYCE_OLIVEIRA_casamento.json")
  
  selo_numero: z.string().optional(),
  selo_codigo: z.string().optional(),
  
  origem: z.enum(['skylight', 'playwright', 'manual', 'backend'], {
    errorMap: () => ({ message: 'origem deve ser: skylight, playwright, manual ou backend' })
  })
});

// Schema de Selo (importação)
const SeloSchema = z.object({
  selo_numero: z.string().min(1, 'selo_numero é obrigatório'),
  selo_codigo: z.string().min(1, 'selo_codigo é obrigatório'),
  nome_registrado: z.string().min(3, 'nome_registrado deve ter pelo menos 3 caracteres'),
  data_nascimento: z.string().optional(),
  tipo_certidao: z.enum(['nascimento', 'casamento', 'obito']).optional()
});

// Schema de Log (criado automaticamente, mas pode ser validado)
const LogSchema = z.object({
  registro_id: z.number().int().optional(),
  acao: z.string().min(1, 'acao é obrigatória'),
  detalhes: z.record(z.any()).optional(),
  origem: z.enum(['skylight', 'playwright', 'backend', 'manual']),
  nivel: z.enum(['debug', 'info', 'warning', 'error', 'critical']).default('info')
});

// Schema de atualização de status
const AtualizarStatusSchema = z.object({
  crc_id: z.string().min(1),
  status: z.enum(['pendente', 'selo_vinculado', 'emitido', 'impresso', 'erro']),
  selo_numero: z.string().optional(),
  selo_codigo: z.string().optional()
});

module.exports = {
  RegistroSchema,
  SeloSchema,
  LogSchema,
  AtualizarStatusSchema
};
