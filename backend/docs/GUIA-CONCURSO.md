# 📚 GUIA DE ESTUDO - Conceitos de Concurso Aplicados

## 🎯 Objetivo

Este documento mapeia cada decisão técnica do sistema aos conceitos cobrados em **concursos públicos** (TJ, TRF, Receita Federal, Banco Central, etc).

---

## 1️⃣ ARQUITETURA CLIENTE-SERVIDOR

### O que é cobrado em concursos:
- Diferença entre cliente e servidor
- Comunicação via protocolos (HTTP, HTTPS)
- Requisições e respostas
- Stateless vs Stateful

### Como está aplicado no sistema:
```
Skylight/Playwright (CLIENTE)
    ↓ HTTP POST/GET
Backend Express (SERVIDOR)
    ↓ SQL
PostgreSQL (BANCO DE DADOS)
```

**Perguntas típicas de prova:**
- Q: "Em uma arquitetura cliente-servidor, quem inicia a comunicação?"
- R: O cliente (Skylight) envia requisição HTTP para o servidor (backend).

- Q: "O que caracteriza um protocolo stateless?"
- R: HTTP é stateless - cada requisição é independente. O estado fica no banco.

---

## 2️⃣ BANCO DE DADOS RELACIONAL

### O que é cobrado:
- Modelo Entidade-Relacionamento (ER)
- Chaves primárias e estrangeiras
- Normalização (1FN, 2FN, 3FN)
- Integridade referencial
- Índices e otimização

### Como está aplicado:

#### Tabela `registros`
```sql
CREATE TABLE registros (
    id SERIAL PRIMARY KEY,           -- Chave primária auto-incremento
    crc_id VARCHAR(50) UNIQUE,       -- Chave natural única
    nome_registrado VARCHAR(200),
    status VARCHAR(30) NOT NULL,
    CONSTRAINT check_status CHECK (status IN (...))  -- Integridade
);
```

**Conceitos aplicados:**
- `SERIAL PRIMARY KEY`: Chave sintética (boa prática)
- `UNIQUE`: Garante que `crc_id` não repete
- `CHECK`: Constraint de domínio (só valores válidos)
- `NOT NULL`: Obrigatório

#### Tabela `selos_disponiveis`
```sql
CREATE TABLE selos_disponiveis (
    usado_por_registro_id INTEGER REFERENCES registros(id)  -- FK
);
```

**Conceitos aplicados:**
- `REFERENCES`: Chave estrangeira (integridade referencial)
- `ON DELETE SET NULL`: Ação em cascata

#### Tabela `logs`
```sql
CREATE TABLE logs (
    registro_id INTEGER REFERENCES registros(id) ON DELETE SET NULL
);
```

**Conceitos aplicados:**
- Auditoria: toda operação gera log
- `ON DELETE SET NULL`: se registro for deletado, log permanece

---

## 3️⃣ SQL - LINGUAGEM ESTRUTURADA

### O que é cobrado:
- DDL (CREATE, ALTER, DROP)
- DML (SELECT, INSERT, UPDATE, DELETE)
- Joins (INNER, LEFT, RIGHT)
- Agregações (COUNT, SUM, AVG)
- Subconsultas

### Exemplos aplicados no sistema:

#### INSERT com RETURNING (DML)
```sql
INSERT INTO registros (...) VALUES (...) RETURNING *;
```
**Por quê?** Retorna o registro criado (inclui `id` gerado automaticamente).

#### SELECT com JOIN (consulta complexa)
```sql
SELECT r.nome_registrado, s.selo_numero
FROM registros r
LEFT JOIN selos_disponiveis s 
  ON s.nome_registrado LIKE r.nome_registrado || '%'
WHERE s.usado = FALSE;
```
**Conceitos:**
- `LEFT JOIN`: retorna todos registros mesmo sem selo
- `LIKE`: busca por similaridade
- `WHERE`: filtro

#### VIEW (abstração)
```sql
CREATE VIEW v_pendentes_com_selo AS
SELECT r.id, r.crc_id, s.selo_numero
FROM registros r
LEFT JOIN selos_disponiveis s ON (...)
WHERE r.status = 'pendente';
```
**Por quê?** Simplifica consultas complexas (muito cobrado em provas).

---

## 4️⃣ TRANSAÇÕES E ACID

### O que é cobrado:
- Atomicidade: tudo ou nada
- Consistência: banco sempre válido
- Isolamento: transações não interferem
- Durabilidade: dado gravado não se perde

### Como está aplicado:

```javascript
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');      // Inicia transação
    const result = await callback(client);
    await client.query('COMMIT');     // Confirma tudo
    return result;
  } catch (error) {
    await client.query('ROLLBACK');   // Desfaz tudo se erro
    throw error;
  } finally {
    client.release();
  }
}
```

**Exemplo real:**
Ao importar 100 selos, se o 50º falhar, TODOS os 100 são descartados (ROLLBACK).

**Pergunta típica:**
- Q: "O que acontece se uma transação falha no meio?"
- R: ROLLBACK desfaz todas as operações, mantendo consistência.

---

## 5️⃣ ÍNDICES E OTIMIZAÇÃO

### O que é cobrado:
- Por que usar índices
- Quando NÃO usar índices
- Tipos de índices (B-tree, Hash)
- Custo de manutenção

### Como está aplicado:

```sql
CREATE INDEX idx_registros_status ON registros(status);
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
```

**Por quê?**
- Consultas por `status='pendente'` ficam rápidas
- Logs ordenados por data são acessados frequentemente

**Trade-off:**
- ✅ SELECT mais rápido
- ❌ INSERT/UPDATE mais lento (atualiza índice)

**Pergunta típica:**
- Q: "Quando um índice NÃO é recomendado?"
- R: Tabelas pequenas ou com muitas escritas (custo de manutenção).

---

## 6️⃣ TRIGGERS (Gatilhos Automáticos)

### O que é cobrado:
- Conceito de trigger
- BEFORE vs AFTER
- Uso para auditoria

### Como está aplicado:

```sql
CREATE TRIGGER update_registros_modtime
    BEFORE UPDATE ON registros
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
```

**Função do trigger:**
Atualiza automaticamente `atualizado_em` sempre que registro muda.

**Pergunta típica:**
- Q: "Qual a diferença entre BEFORE e AFTER trigger?"
- R: BEFORE executa antes da operação (pode modificar dados), AFTER executa depois.

---

## 7️⃣ API REST

### O que é cobrado:
- Verbos HTTP (GET, POST, PUT, DELETE)
- Status codes (200, 201, 400, 404, 500)
- Idempotência
- Stateless

### Como está aplicado:

| Verbo  | Endpoint              | Ação                  | Idempotente? |
|--------|-----------------------|-----------------------|--------------|
| GET    | /registros            | Listar registros      | ✅ Sim       |
| POST   | /registros            | Criar registro        | ❌ Não       |
| GET    | /registros/:id        | Buscar específico     | ✅ Sim       |
| PUT    | /registros/:id/status | Atualizar status      | ✅ Sim       |

**Idempotência:**
- GET /registros/123 → sempre retorna o mesmo registro
- POST /registros → cada chamada cria novo registro (não idempotente)
- PUT /registros/123 → atualiza para mesmo estado (idempotente)

**Status codes aplicados:**
```javascript
res.status(201).json(...)  // 201 Created
res.status(400).json(...)  // 400 Bad Request (validação)
res.status(404).json(...)  // 404 Not Found
res.status(409).json(...)  // 409 Conflict (duplicado)
res.status(500).json(...)  // 500 Internal Server Error
```

---

## 8️⃣ VALIDAÇÃO E SEGURANÇA

### O que é cobrado:
- Validação no cliente vs servidor
- SQL Injection
- Sanitização de entrada

### Como está aplicado:

#### Validação com Zod (antes do banco)
```javascript
const RegistroSchema = z.object({
  crc_id: z.string().min(1),
  nome_registrado: z.string().min(3),
  tipo_certidao: z.enum(['nascimento', 'casamento', 'obito'])
});

const dados = RegistroSchema.parse(req.body);  // Valida ou lança erro
```

#### Proteção contra SQL Injection
```javascript
// ❌ ERRADO (vulnerável)
await query(`SELECT * FROM registros WHERE crc_id = '${req.params.id}'`);

// ✅ CORRETO (parametrizado)
await query('SELECT * FROM registros WHERE crc_id = $1', [req.params.id]);
```

**Por quê?** Parâmetros são escapados automaticamente pelo driver PostgreSQL.

---

## 9️⃣ LOGS E AUDITORIA

### O que é cobrado:
- Rastreabilidade
- Níveis de log (DEBUG, INFO, ERROR)
- Logs estruturados

### Como está aplicado:

```javascript
await gravarLog(
  registro_id,              // A quem se refere
  'registro_criado',        // O que aconteceu
  { crc_id, origem },       // Detalhes (JSON)
  'skylight',               // Quem fez
  'info'                    // Severidade
);
```

**Tabela de logs:**
```sql
SELECT * FROM logs 
WHERE nivel = 'error' 
ORDER BY timestamp DESC;
```

**Pergunta típica:**
- Q: "Por que é importante registrar logs em sistemas críticos?"
- R: Rastreabilidade, detecção de fraudes, análise forense, conformidade legal.

---

## 🔟 NORMALIZAÇÃO

### O que é cobrado:
- 1FN, 2FN, 3FN
- Anomalias (inserção, exclusão, atualização)
- Desnormalização (quando justificada)

### Análise das tabelas:

#### Tabela `registros` (3FN)
- ✅ Todos os campos são atômicos (1FN)
- ✅ Não há dependências parciais (2FN)
- ✅ Não há dependências transitivas (3FN)

#### Tabela `selos_disponiveis` (3FN)
- ✅ Normalizada
- ⚠️ `nome_registrado` é denormalizado (também está em `registros`)
- **Justificativa:** Performance - busca de selos por nome fica mais rápida

**Pergunta típica:**
- Q: "Quando a desnormalização é justificada?"
- R: Quando o ganho de performance compensa a redundância (consultas muito frequentes).

---

## 📊 RESUMO PARA REVISÃO

| Conceito                  | Aplicação no Sistema              | Onde Estudar         |
|---------------------------|-----------------------------------|----------------------|
| Chave primária            | `id SERIAL PRIMARY KEY`           | `schema.sql`         |
| Chave estrangeira         | `REFERENCES registros(id)`        | `schema.sql`         |
| Índices                   | `CREATE INDEX idx_...`            | `schema.sql`         |
| Transações                | `BEGIN/COMMIT/ROLLBACK`           | `database.js`        |
| Triggers                  | `update_registros_modtime`        | `schema.sql`         |
| Validação                 | Zod schemas                       | `schemas.js`         |
| API REST                  | GET/POST/PUT                      | `server.js`          |
| SQL Injection             | Queries parametrizadas            | `server.js`          |
| Auditoria                 | Tabela `logs`                     | `schema.sql`         |
| Views                     | `v_pendentes_com_selo`            | `schema.sql`         |

---

## 🎓 MATERIAIS COMPLEMENTARES

### Livros recomendados:
- "Sistemas de Banco de Dados" - Elmasri & Navathe
- "Introdução a Sistemas de Banco de Dados" - C.J. Date
- "RESTful Web Services" - Leonard Richardson

### SQL prático:
- https://www.postgresql.org/docs/
- https://sqlzoo.net/ (exercícios interativos)
- https://use-the-index-luke.com/ (otimização)

### Tópicos avançados (pós-básico):
- [ ] Stored Procedures
- [ ] Materialized Views
- [ ] Particionamento de tabelas
- [ ] Replicação
- [ ] Backup e Recovery

---

## ✅ CHECKLIST DE ESTUDO

- [ ] Sei explicar a diferença entre chave primária e estrangeira
- [ ] Sei escrever JOINs (INNER, LEFT, RIGHT)
- [ ] Entendo o que é uma transação ACID
- [ ] Sei quando usar índices (e quando NÃO usar)
- [ ] Conheço os verbos HTTP e seus usos
- [ ] Sei prevenir SQL Injection
- [ ] Entendo normalização até 3FN
- [ ] Sei criar triggers e views
- [ ] Conheço os status codes HTTP principais
- [ ] Sei explicar cliente-servidor com exemplo real

**Meta:** Responder 90% correto em questões de BD e Arquitetura.
