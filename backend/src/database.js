/**
 * CONEXÃO COM POSTGRESQL (Neon)
 * 
 * Pool de conexões reutilizável.
 * Segue boas práticas de concursos públicos:
 * - Pool para performance
 * - Tratamento de erros
 * - Logs rastreáveis
 */

const { Pool } = require('pg');
require('dotenv').config();

// Validação básica
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada no .env');
  process.exit(1);
}

// Pool de conexões (reutiliza conexões abertas)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessário para Neon.tech
  },
  max: 20,                    // Máximo de conexões simultâneas
  idleTimeoutMillis: 30000,   // Fecha conexões ociosas após 30s
  connectionTimeoutMillis: 5000 // Timeout de 5s para novas conexões
});

// Log de conexão inicial
pool.on('connect', () => {
  console.log('✅ Conexão PostgreSQL estabelecida');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool PostgreSQL:', err);
});

// Função auxiliar para queries com log
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`🔍 Query executada em ${duration}ms:`, { text: text.substring(0, 100), rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Erro na query:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

// Função para transações (importante para operações atômicas)
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  transaction
};
