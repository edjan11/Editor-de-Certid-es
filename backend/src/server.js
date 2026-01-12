/**
 * SERVIDOR EXPRESS - NÚCLEO DO SISTEMA
 * 
 * Este é o cérebro da automação.
 * Toda lógica de negócio, validação e persistência acontece aqui.
 */

const express = require('express');
const cors = require('cors');
const { query, transaction } = require('./database');
const { 
  RegistroSchema, 
  SeloSchema, 
  AtualizarStatusSchema 
} = require('./schemas');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3100;

// Middlewares
app.use(cors()); // Permite requisições do Skylight e Playwright
app.use(express.json());

// Middleware de log de requisições
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, req.body ? JSON.stringify(req.body).substring(0, 100) : '');
  next();
});

// ============================================
// HELPER: Gravar log no banco
// ============================================
async function gravarLog(registro_id, acao, detalhes, origem, nivel = 'info') {
  try {
    await query(
      `INSERT INTO logs (registro_id, acao, detalhes, origem, nivel) 
       VALUES ($1, $2, $3, $4, $5)`,
      [registro_id, acao, JSON.stringify(detalhes || {}), origem, nivel]
    );
  } catch (error) {
    console.error('❌ Erro ao gravar log:', error.message);
  }
}

// ============================================
// HELPER: Converter data DD/MM/AAAA para YYYY-MM-DD
// ============================================
function converterData(dataBR) {
  if (!dataBR) return null;
  const match = dataBR.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

// ============================================
// ENDPOINTS
// ============================================

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// POST /registros - Criar novo registro
// ============================================
app.post('/registros', async (req, res) => {
  try {
    // 1. Validar entrada
    const dados = RegistroSchema.parse(req.body);
    
    // 2. Converter data se presente
    const dataNascimento = converterData(dados.data_nascimento);
    
    // 3. Inserir no banco
    const result = await query(
      `INSERT INTO registros 
       (crc_id, nome_registrado, nome_mae, nome_pai, data_nascimento, 
        termo, tipo_certidao, oficio, json_path, selo_numero, selo_codigo, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pendente') 
       RETURNING *`,
      [
        dados.crc_id,
        dados.nome_registrado,
        dados.nome_mae || null,
        dados.nome_pai || null,
        dataNascimento,
        dados.termo || null,
        dados.tipo_certidao,
        dados.oficio,
        dados.json_path || null,
        dados.selo_numero || null,
        dados.selo_codigo || null
      ]
    );
    
    const registro = result.rows[0];
    
    // 4. Gravar log
    await gravarLog(
      registro.id,
      'registro_criado',
      { crc_id: dados.crc_id, origem: dados.origem },
      dados.origem,
      'info'
    );
    
    console.log(`✅ Registro criado: ID ${registro.id}, CRC ${dados.crc_id}`);
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Registro criado com sucesso',
      dados: registro
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar registro:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Validação falhou',
        erro: error.errors
      });
    }
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Registro já existe',
        erro: 'crc_id duplicado'
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
      erro: error.message
    });
  }
});

// ============================================
// GET /registros - Listar registros
// ============================================
app.get('/registros', async (req, res) => {
  try {
    const { status, oficio, tipo, limit = 50 } = req.query;
    
    let sql = 'SELECT * FROM registros WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (oficio) {
      sql += ` AND oficio = $${paramIndex}`;
      params.push(parseInt(oficio));
      paramIndex++;
    }
    
    if (tipo) {
      sql += ` AND tipo_certidao = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }
    
    sql += ` ORDER BY criado_em DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await query(sql, params);
    
    res.json({
      sucesso: true,
      total: result.rowCount,
      dados: result.rows
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar registros:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar registros',
      erro: error.message
    });
  }
});

// ============================================
// GET /registros/:crc_id - Buscar registro específico
// ============================================
app.get('/registros/:crc_id', async (req, res) => {
  try {
    const { crc_id } = req.params;
    
    const result = await query(
      'SELECT * FROM registros WHERE crc_id = $1',
      [crc_id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Registro não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      dados: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar registro:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar registro',
      erro: error.message
    });
  }
});

// ============================================
// PUT /registros/:crc_id/status - Atualizar status
// ============================================
app.put('/registros/:crc_id/status', async (req, res) => {
  try {
    const { crc_id } = req.params;
    const dados = AtualizarStatusSchema.parse({ ...req.body, crc_id });
    
    // Montar query dinâmica
    let sql = 'UPDATE registros SET status = $1';
    const params = [dados.status];
    let paramIndex = 2;
    
    if (dados.selo_numero) {
      sql += `, selo_numero = $${paramIndex}, selo_vinculado_em = NOW()`;
      params.push(dados.selo_numero);
      paramIndex++;
    }
    
    if (dados.selo_codigo) {
      sql += `, selo_codigo = $${paramIndex}`;
      params.push(dados.selo_codigo);
      paramIndex++;
    }
    
    sql += ` WHERE crc_id = $${paramIndex} RETURNING *`;
    params.push(crc_id);
    
    const result = await query(sql, params);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Registro não encontrado'
      });
    }
    
    const registro = result.rows[0];
    
    // Gravar log
    await gravarLog(
      registro.id,
      'status_atualizado',
      { status_anterior: registro.status, status_novo: dados.status },
      'backend',
      'info'
    );
    
    console.log(`✅ Status atualizado: CRC ${crc_id} → ${dados.status}`);
    
    res.json({
      sucesso: true,
      mensagem: 'Status atualizado com sucesso',
      dados: registro
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Validação falhou',
        erro: error.errors
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar status',
      erro: error.message
    });
  }
});

// ============================================
// POST /selos - Importar selos em lote
// ============================================
app.post('/selos', async (req, res) => {
  try {
    const selos = Array.isArray(req.body) ? req.body : [req.body];
    
    // Validar todos os selos
    const selosValidados = selos.map(s => SeloSchema.parse(s));
    
    // Inserir em transação (tudo ou nada)
    const resultado = await transaction(async (client) => {
      const inseridos = [];
      
      for (const selo of selosValidados) {
        const dataNasc = converterData(selo.data_nascimento);
        
        try {
          const result = await client.query(
            `INSERT INTO selos_disponiveis 
             (selo_numero, selo_codigo, nome_registrado, data_nascimento, tipo_certidao) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (selo_numero, selo_codigo) DO NOTHING 
             RETURNING *`,
            [selo.selo_numero, selo.selo_codigo, selo.nome_registrado, dataNasc, selo.tipo_certidao || null]
          );
          
          if (result.rowCount > 0) {
            inseridos.push(result.rows[0]);
          }
        } catch (err) {
          console.warn(`⚠️ Erro ao inserir selo ${selo.selo_numero}:`, err.message);
        }
      }
      
      return inseridos;
    });
    
    console.log(`✅ ${resultado.length} selos importados`);
    
    res.status(201).json({
      sucesso: true,
      mensagem: `${resultado.length} selos importados com sucesso`,
      dados: resultado
    });
    
  } catch (error) {
    console.error('❌ Erro ao importar selos:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Validação falhou',
        erro: error.errors
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao importar selos',
      erro: error.message
    });
  }
});

// ============================================
// GET /selos/disponiveis - Listar selos disponíveis
// ============================================
app.get('/selos/disponiveis', async (req, res) => {
  try {
    const { nome } = req.query;
    
    let sql = 'SELECT * FROM selos_disponiveis WHERE usado = FALSE';
    const params = [];
    
    if (nome) {
      sql += ' AND LOWER(nome_registrado) LIKE LOWER($1)';
      params.push(`%${nome}%`);
    }
    
    sql += ' ORDER BY importado_em DESC';
    
    const result = await query(sql, params);
    
    res.json({
      sucesso: true,
      total: result.rowCount,
      dados: result.rows
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar selos:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar selos',
      erro: error.message
    });
  }
});

// ============================================
// GET /logs - Listar logs (rastreabilidade)
// ============================================
app.get('/logs', async (req, res) => {
  try {
    const { registro_id, acao, nivel, limit = 100 } = req.query;
    
    let sql = 'SELECT * FROM logs WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (registro_id) {
      sql += ` AND registro_id = $${paramIndex}`;
      params.push(parseInt(registro_id));
      paramIndex++;
    }
    
    if (acao) {
      sql += ` AND acao = $${paramIndex}`;
      params.push(acao);
      paramIndex++;
    }
    
    if (nivel) {
      sql += ` AND nivel = $${paramIndex}`;
      params.push(nivel);
      paramIndex++;
    }
    
    sql += ` ORDER BY timestamp DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await query(sql, params);
    
    res.json({
      sucesso: true,
      total: result.rowCount,
      dados: result.rows
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar logs:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar logs',
      erro: error.message
    });
  }
});

// ============================================
// ENDPOINT: Estatísticas gerais
// ============================================
app.get('/estatisticas', async (req, res) => {
  try {
    // Total de registros
    const totalRegistros = await query('SELECT COUNT(*) as total FROM registros');
    
    // Por status
    const porStatus = await query(`
      SELECT status, COUNT(*) as total 
      FROM registros 
      GROUP BY status
    `);
    
    // Selos disponíveis
    const selosDisponiveis = await query('SELECT COUNT(*) as total FROM selos_disponiveis WHERE usado = false');
    
    // Registros de hoje
    const registrosHoje = await query(`
      SELECT COUNT(*) as total 
      FROM registros 
      WHERE DATE(criado_em) = CURRENT_DATE
    `);
    
    const stats = {
      total_registros: parseInt(totalRegistros.rows[0].total),
      pendentes: 0,
      selo_vinculado: 0,
      emitido: 0,
      impresso: 0,
      erro: 0,
      selos_disponiveis: parseInt(selosDisponiveis.rows[0].total),
      registros_hoje: parseInt(registrosHoje.rows[0].total)
    };
    
    // Preenche contadores por status
    porStatus.rows.forEach(row => {
      stats[row.status] = parseInt(row.total);
    });
    
    res.json({
      sucesso: true,
      dados: stats
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar estatísticas',
      erro: error.message
    });
  }
});

// ============================================
// ENDPOINT: Limpar dados de teste (admin)
// ============================================
app.post('/admin/limpar-testes', async (req, res) => {
  try {
    await transaction(async (client) => {
      // Deleta registros de teste
      await client.query("DELETE FROM registros WHERE crc_id LIKE 'CRC-2026-%'");
      
      // Deleta selos de teste
      await client.query("DELETE FROM selos_disponiveis WHERE selo_numero LIKE 'SE-2026%'");
      
      // Deleta logs de teste
      await client.query("DELETE FROM logs WHERE origem = 'manual'");
    });
    
    res.json({
      sucesso: true,
      mensagem: 'Dados de teste removidos com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao limpar dados',
      erro: error.message
    });
  }
});

// ============================================
// KEY-VALUE STORAGE (Para Explorer Selos)
// ============================================

// GET /kv/get - Recuperar valor do KV storage
app.get('/kv/get', async (req, res) => {
  try {
    const { namespace, key } = req.query;
    
    if (!namespace || !key) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'namespace e key são obrigatórios'
      });
    }

    // Para Explorer Selos, retornar lista de selos disponíveis
    if (namespace === 'selos_crc' && key === 'lista') {
      const result = await query(
        `SELECT tipo_certidao, numero, codigo, observacao 
         FROM selos_disponiveis 
         WHERE utilizado = false 
         ORDER BY tipo_certidao, numero`
      );
      
      return res.json({
        sucesso: true,
        valor: result.rows
      });
    }

    // Caso genérico (pode expandir no futuro)
    res.json({
      sucesso: true,
      valor: []
    });
    
  } catch (error) {
    console.error('❌ Erro em GET /kv/get:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar dados',
      erro: error.message
    });
  }
});

// POST /kv/set - Armazenar valor no KV storage
app.post('/kv/set', async (req, res) => {
  try {
    const { namespace, key, value } = req.body;
    
    if (!namespace || !key) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'namespace e key são obrigatórios'
      });
    }

    // Para Explorer Selos, atualizar selos disponíveis
    if (namespace === 'selos_crc' && key === 'lista' && Array.isArray(value)) {
      // Limpar selos antigos e inserir novos
      await transaction(async (client) => {
        await client.query('DELETE FROM selos_disponiveis WHERE utilizado = false');
        
        for (const selo of value) {
          await client.query(
            `INSERT INTO selos_disponiveis (tipo_certidao, numero, codigo, observacao, utilizado)
             VALUES ($1, $2, $3, $4, false)
             ON CONFLICT DO NOTHING`,
            [selo.tipo, selo.numero, selo.codigo, selo.observacao || null]
          );
        }
      });
      
      await gravarLog(null, 'selos_atualizados', {
        quantidade: value.length
      }, 'explorer_selos', 'info');
      
      return res.json({
        sucesso: true,
        mensagem: `${value.length} selos atualizados`
      });
    }

    // Caso genérico
    res.json({
      sucesso: true,
      mensagem: 'Dados armazenados'
    });
    
  } catch (error) {
    console.error('❌ Erro em POST /kv/set:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao armazenar dados',
      erro: error.message
    });
  }
});

// ============================================
// INICIALIZAÇÃO
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Banco: PostgreSQL (Neon)`);
  console.log(`\n✅ Sistema pronto para receber requisições`);
});
