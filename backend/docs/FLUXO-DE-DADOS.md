# 🔄 FLUXO DE DADOS - Sistema CRC/TJSE

Este documento mostra **como os dados fluem** pelo sistema em cada operação.

---

## 📥 FLUXO 1: Coleta de Registros (CRC → Backend)

### Passo a passo:

```
1. Usuário acessa CRC (browser)
   ↓
2. Skylight detecta pedidos na página
   ↓
3. Skylight extrai dados:
   - crc_id, nome, mãe, pai, termo
   ↓
4. Skylight valida formato (cliente)
   ↓
5. Skylight → HTTP POST /registros → Backend
   ↓
6. Backend valida dados (Zod schema)
   ✅ Se válido → continua
   ❌ Se inválido → retorna erro 400
   ↓
7. Backend → INSERT INTO registros → PostgreSQL
   ↓
8. Backend → INSERT INTO logs → PostgreSQL
   (acao: 'registro_criado', origem: 'skylight')
   ↓
9. Backend ← SELECT * RETURNING → PostgreSQL
   ↓
10. Backend → HTTP 201 Created → Skylight
   {
     "sucesso": true,
     "dados": { "id": 42, "crc_id": "123", ... }
   }
   ↓
11. Skylight mostra notificação: "✅ Registro criado"
```

### Dados em trânsito:

**Skylight → Backend (JSON):**
```json
{
  "crc_id": "87654321",
  "nome_registrado": "JOYCE DE OLIVEIRA",
  "nome_mae": "ANA OLIVEIRA DOS SANTOS",
  "tipo_certidao": "nascimento",
  "oficio": 9,
  "origem": "skylight"
}
```

**Backend → PostgreSQL (SQL):**
```sql
INSERT INTO registros 
  (crc_id, nome_registrado, nome_mae, tipo_certidao, oficio, status) 
VALUES 
  ('87654321', 'JOYCE DE OLIVEIRA', 'ANA OLIVEIRA DOS SANTOS', 'nascimento', 9, 'pendente');
```

**PostgreSQL → Backend:**
```
id: 42
crc_id: 87654321
nome_registrado: JOYCE DE OLIVEIRA
status: pendente
criado_em: 2026-01-11 15:30:45
```

---

## 📤 FLUXO 2: Importação de Selos (TJ → Backend)

### Passo a passo:

```
1. Skylight detecta página de selos do TJ
   ↓
2. Skylight extrai lista de selos:
   - selo_numero, selo_codigo, nome_registrado
   ↓
3. Skylight agrupa em array JSON
   ↓
4. Skylight → HTTP POST /selos → Backend
   (array com 10-50 selos)
   ↓
5. Backend valida CADA selo (Zod)
   ↓
6. Backend inicia TRANSAÇÃO
   ↓
7. Para cada selo:
   Backend → INSERT INTO selos_disponiveis → PostgreSQL
   (ON CONFLICT DO NOTHING - ignora duplicados)
   ↓
8. Se TODOS passarem → COMMIT
   Se 1 falhar → ROLLBACK (desfaz tudo)
   ↓
9. Backend → HTTP 201 Created → Skylight
   {
     "sucesso": true,
     "mensagem": "45 selos importados"
   }
```

### Por que transação?

**Sem transação (❌):**
- 45 selos enviados
- 30 inseridos
- Erro no 31º
- Dados inconsistentes (faltam 15 selos)

**Com transação (✅):**
- 45 selos enviados
- Erro no 31º
- ROLLBACK: NENHUM inserido
- Usuário reenvia (tudo ou nada)

---

## 🔍 FLUXO 3: Busca de Selo Disponível (Backend → Skylight)

### Passo a passo:

```
1. Usuário está preenchendo certidão no TJ
   ↓
2. Skylight captura nome do registrado: "JOYCE DE OLIVEIRA"
   ↓
3. Skylight → HTTP GET /selos/disponiveis?nome=JOYCE → Backend
   ↓
4. Backend → Query no PostgreSQL:
   SELECT * FROM selos_disponiveis
   WHERE usado = FALSE
     AND LOWER(nome_registrado) LIKE LOWER('%JOYCE%')
   ORDER BY importado_em DESC;
   ↓
5. PostgreSQL retorna 0-N selos
   ↓
6. Backend → HTTP 200 OK → Skylight
   {
     "sucesso": true,
     "total": 2,
     "dados": [
       { "selo_numero": "SE-001234", "selo_codigo": "ABC", ... },
       { "selo_numero": "SE-001235", "selo_codigo": "DEF", ... }
     ]
   }
   ↓
7. Skylight calcula similaridade de nome (Levenshtein)
   ↓
8. Skylight escolhe selo com maior similaridade
   ↓
9. Skylight preenche formulário do TJ automaticamente
```

### Algoritmo de similaridade:

```javascript
// Nome na página TJ
const nomePagina = "JOYCE DE OLIVEIRA";

// Selos retornados
const selos = [
  { nome: "JOYCE DE OLIVEIRA", similaridade: ??? },
  { nome: "JOYCE OLIVEIRA", similaridade: ??? },
  { nome: "MARIA JOYCE", similaridade: ??? }
];

// Calcular similaridade (0.0 a 1.0)
selos.forEach(selo => {
  selo.similaridade = calcularLevenshtein(nomePagina, selo.nome);
});

// Ordenar (maior primeiro)
selos.sort((a, b) => b.similaridade - a.similaridade);

// Escolher melhor match
const melhor = selos[0];

if (melhor.similaridade >= 0.90) {
  // Auto-preencher
  preencherSelo(melhor);
} else {
  // Pedir confirmação
  confirmar(`Usar selo de ${melhor.nome}? (${melhor.similaridade*100}%)`);
}
```

---

## ✅ FLUXO 4: Atualização de Status (Skylight → Backend)

### Cenário: Certidão foi impressa

```
1. Skylight detecta que certidão foi impressa
   ↓
2. Skylight captura crc_id do pedido: "87654321"
   ↓
3. Skylight → HTTP PUT /registros/87654321/status → Backend
   {
     "status": "impresso"
   }
   ↓
4. Backend valida status (enum permitido)
   ↓
5. Backend → UPDATE registros → PostgreSQL
   UPDATE registros 
   SET status = 'impresso', atualizado_em = NOW()
   WHERE crc_id = '87654321';
   ↓
6. Backend → INSERT INTO logs → PostgreSQL
   (acao: 'status_atualizado', detalhes: { anterior: 'emitido', novo: 'impresso' })
   ↓
7. Backend → HTTP 200 OK → Skylight
   {
     "sucesso": true,
     "mensagem": "Status atualizado"
   }
```

---

## 🔄 FLUXO 5: Automação Completa (Playwright - Futuro)

### Cenário: Bot processa tudo sozinho

```
1. CRON dispara execução às 08:00
   ↓
2. Playwright abre CRC (sessão salva)
   ↓
3. Playwright extrai TODOS pedidos pendentes
   ↓
4. Playwright → HTTP POST /registros (lote) → Backend
   ↓
5. Backend retorna lista de IDs criados
   ↓
6. Para cada ID:
   ↓
   6.1. Playwright → HTTP GET /registros/:id → Backend
   ↓
   6.2. Backend → SELECT * FROM registros → PostgreSQL
   ↓
   6.3. Playwright → HTTP GET /selos/disponiveis?nome=X → Backend
   ↓
   6.4. Backend → SELECT * FROM selos_disponiveis → PostgreSQL
   ↓
   6.5. Playwright abre TJ, preenche formulário, gera certidão
   ↓
   6.6. Playwright → HTTP PUT /registros/:id/status → Backend
        { "status": "emitido", "selo_numero": "SE-123", "selo_codigo": "ABC" }
   ↓
   6.7. Backend → UPDATE registros + UPDATE selos_disponiveis (usado=TRUE) → PostgreSQL
   ↓
7. Playwright gera relatório TXT/PDF
   ↓
8. Playwright → HTTP POST /logs → Backend
   (acao: 'automacao_concluida', detalhes: { total: 50, sucesso: 48, erro: 2 })
   ↓
9. Playwright envia notificação Telegram
   "✅ 48/50 certidões processadas"
```

---

## 📊 FLUXO 6: Consulta de Logs (Auditoria)

### Cenário: Chefe pede relatório

```
1. Usuário acessa dashboard (futuro) ou executa query SQL
   ↓
2. Backend/SQL → SELECT * FROM logs → PostgreSQL
   WHERE acao = 'registro_criado'
     AND timestamp >= '2026-01-01'
   ORDER BY timestamp DESC;
   ↓
3. PostgreSQL retorna registros
   ↓
4. Backend/SQL formata dados
   ↓
5. Exibe relatório:
   - Total: 150 registros criados em janeiro
   - Origem: 120 skylight, 30 playwright
   - Erros: 5 (validação falhou)
```

### Exemplo de log:

```json
{
  "id": 789,
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
}
```

---

## 🛡️ FLUXO 7: Validação e Segurança

### Camadas de validação:

```
1. Skylight (Cliente):
   - Formato básico (nome não vazio, oficio entre 1-20)
   ↓
2. Backend (Zod):
   - Schema completo (tipos, tamanhos, enums)
   - Validação ANTES de tocar no banco
   ↓
3. PostgreSQL (Constraints):
   - CHECK (status IN (...))
   - UNIQUE (crc_id)
   - NOT NULL (campos obrigatórios)
   - FOREIGN KEY (integridade referencial)
```

### Prevenção de SQL Injection:

**❌ VULNERÁVEL:**
```javascript
const query = `SELECT * FROM registros WHERE crc_id = '${req.params.id}'`;
```

**✅ SEGURO:**
```javascript
const query = 'SELECT * FROM registros WHERE crc_id = $1';
const params = [req.params.id];
await pool.query(query, params);
```

---

## 📈 FLUXO 8: Escalabilidade

### 1 usuário:
```
Skylight → Backend (localhost) → PostgreSQL (Neon)
```

### 10 usuários (futuro):
```
Skylight (usuário 1) ┐
Skylight (usuário 2) ├→ Backend (cloud) → PostgreSQL (Neon)
...                  │
Playwright (bot)     ┘
```

**Por quê funciona?**
- PostgreSQL suporta múltiplas conexões simultâneas
- Backend usa Pool (20 conexões reutilizáveis)
- Cada requisição é independente (stateless)

---

## 🎯 RESUMO DOS FLUXOS

| Fluxo | Origem | Destino | Método | Ação |
|-------|--------|---------|--------|------|
| 1 | Skylight | Backend | POST /registros | Criar registro |
| 2 | Skylight | Backend | POST /selos | Importar selos |
| 3 | Skylight | Backend | GET /selos/disponiveis | Buscar selo |
| 4 | Skylight | Backend | PUT /registros/:id/status | Atualizar status |
| 5 | Playwright | Backend | Multiple | Automação completa |
| 6 | Dashboard | Backend | GET /logs | Consultar auditoria |

---

## 🔍 ONDE ESTÁ CADA LÓGICA

| Lógica | Local | Por quê |
|--------|-------|---------|
| Extração de dados da página | Skylight | Só ele tem acesso ao DOM |
| Validação de formato | Backend (Zod) | Fonte única da verdade |
| Persistência | PostgreSQL | Banco relacional |
| Similaridade de nomes | Skylight | Performance (evita carga no backend) |
| Logs de auditoria | Backend → PostgreSQL | Rastreabilidade |
| Automação completa | Playwright | Controle total do browser |

---

## ✅ CHECKLIST DE ENTENDIMENTO

Você entendeu se consegue responder:

- [ ] Por que validar no backend E no cliente?
- [ ] O que acontece se um selo da lista falhar?
- [ ] Como o sistema evita SQL Injection?
- [ ] Por que usar transação na importação de selos?
- [ ] Onde fica a lógica de similaridade de nomes?
- [ ] Como o sistema sabe que certidão foi impressa?
- [ ] O que é gravado na tabela logs?
- [ ] Por que PostgreSQL e não localStorage?

**Acertou 7/8?** Você domina o fluxo de dados. 🎯
