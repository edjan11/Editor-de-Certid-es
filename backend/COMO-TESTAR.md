# 🧪 COMO TESTAR O SISTEMA

O backend precisa da senha correta no arquivo `.env` para conectar no Neon.

## 🔧 OPÇÃO 1: Testar direto no Neon (MAIS FÁCIL)

1. Acesse: https://console.neon.tech
2. Clique no projeto "Automoção CRC"
3. Clique em "Editor SQL"
4. Abra o arquivo: `backend/database/queries-teste.sql`
5. Copie e cole as queries no SQL Editor
6. Execute cada bloco (Ctrl+Enter ou botão Run)

### Ordem de execução:

```sql
-- 1º Execute o schema (se ainda não executou)
--    Arquivo: backend/database/schema.sql

-- 2º Crie os registros de teste
--    Copie queries 1, 2, 3 do queries-teste.sql

-- 3º Importe os selos
--    Copie query 4 do queries-teste.sql

-- 4º Veja os resultados
SELECT * FROM registros;
SELECT * FROM selos_disponiveis;
```

### 🎯 O que você vai ver:

```
registros:
+----+-------------+---------------------------+---------------+----------+
| id | crc_id      | nome_registrado           | tipo_certidao | status   |
+----+-------------+---------------------------+---------------+----------+
| 1  | CRC-2026-001| MARIA JOSE DA SILVA       | nascimento    | pendente |
| 2  | CRC-2026-002| JOYCE DE OLIVEIRA E ...   | casamento     | pendente |
| 3  | CRC-2026-003| ANTONIO PEREIRA DOS ...   | obito         | pendente |
+----+-------------+---------------------------+---------------+----------+

selos_disponiveis:
+----+--------------------+-----------+-----------------------+-------+
| id | selo_numero        | selo_codigo| nome_registrado       | usado |
+----+--------------------+-----------+-----------------------+-------+
| 1  | SE-20260111-001234 | ABC123XYZ | MARIA JOSE DA SILVA   | false |
| 2  | SE-20260111-001235 | DEF456UVW | JOYCE DE OLIVEIRA     | false |
| 3  | SE-20260111-001236 | GHI789RST | ANTONIO PEREIRA ...   | false |
| 4  | SE-20260111-001237 | JKL012MNO | CARLOS SANTOS         | false |
+----+--------------------+-----------+-----------------------+-------+
```

---

## 🔧 OPÇÃO 2: Testar via Backend API (requer senha no .env)

### Passo 1: Corrigir o .env

1. No Neon, clique em "Mostrar senha" (ícone de olho)
2. Clique em "Copiar trecho" para copiar a connection string completa
3. Abra `backend/.env`
4. Cole a connection string COM A SENHA
5. Salve o arquivo (Ctrl+S)

### Passo 2: Executar o schema

```powershell
# Abra um terminal PowerShell e execute:
cd C:\Users\Pichau\Desktop\Projetos\Centralizador\backend

# Se tiver o CLI do Neon:
npx neonctl sql-editor --file database/schema.sql

# OU copie manualmente no SQL Editor do Neon
```

### Passo 3: Iniciar o backend

```powershell
npm run dev
```

**Saída esperada:**
```
🚀 Backend rodando em http://localhost:3100
📊 Ambiente: development
🗄️ Banco: PostgreSQL (Neon)

✅ Sistema pronto para receber requisições
```

### Passo 4: Testar os endpoints

Abra **OUTRO** terminal PowerShell (deixe o primeiro rodando):

```powershell
# Teste 1: Healthcheck
Invoke-RestMethod -Uri "http://localhost:3100/health" -Method Get

# Teste 2: Criar registro
$registro = @{
    crc_id = "CRC-2026-001"
    nome_registrado = "MARIA JOSE DA SILVA"
    tipo_certidao = "nascimento"
    oficio = 9
    origem = "manual"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3100/registros" -Method Post -Body $registro -ContentType "application/json"

# Teste 3: Listar registros
Invoke-RestMethod -Uri "http://localhost:3100/registros" -Method Get
```

---

## 📊 EXEMPLO COMPLETO DE TESTE

### No SQL Editor do Neon:

```sql
-- 1. Criar registro
INSERT INTO registros (crc_id, nome_registrado, tipo_certidao, oficio, status, criado_em, atualizado_em)
VALUES ('CRC-2026-001', 'MARIA JOSE DA SILVA', 'nascimento', 9, 'pendente', NOW(), NOW());

-- 2. Criar selo
INSERT INTO selos_disponiveis (selo_numero, selo_codigo, nome_registrado, usado)
VALUES ('SE-001234', 'ABC123', 'MARIA JOSE DA SILVA', false);

-- 3. Buscar selo disponível
SELECT * FROM selos_disponiveis WHERE usado = false AND nome_registrado ILIKE '%MARIA%';

-- 4. Vincular selo
UPDATE registros 
SET selo_numero = 'SE-001234', selo_codigo = 'ABC123', status = 'selo_vinculado'
WHERE crc_id = 'CRC-2026-001';

-- 5. Confirmar
SELECT * FROM registros WHERE crc_id = 'CRC-2026-001';
```

**Resultado esperado:**
```
 id |    crc_id    |   nome_registrado   | tipo_certidao | oficio | selo_numero |    status      
----+--------------+---------------------+---------------+--------+-------------+----------------
  1 | CRC-2026-001 | MARIA JOSE DA SILVA | nascimento    |      9 | SE-001234   | selo_vinculado
```

---

## ✅ CHECKLIST

Antes de prosseguir, confirme:

- [ ] Executou `schema.sql` no Neon
- [ ] Conseguiu criar registro manualmente no SQL Editor
- [ ] Conseguiu criar selo manualmente no SQL Editor
- [ ] Conseguiu vincular selo ao registro
- [ ] Vê os dados nas tabelas

**Tudo OK?** Sistema está funcionando! ✅

**Próximo passo:** Corrigir o `.env` e testar via API REST.

---

## 🐛 PROBLEMAS COMUNS

### "Senha incorreta no .env"
- Clique em "Mostrar senha" no Neon
- Copie a connection string COMPLETA
- Cole no `.env` substituindo tudo

### "Tabelas não existem"
- Execute `backend/database/schema.sql` no SQL Editor do Neon
- Verifique se executou sem erros

### "Backend não inicia"
- Verifique se `npm install` foi executado
- Verifique se `.env` existe
- Verifique se a porta 3100 está livre

---

## 📚 ARQUIVOS IMPORTANTES

- `backend/database/schema.sql` - Cria as tabelas
- `backend/database/queries-teste.sql` - Queries de teste prontas
- `backend/.env` - Configuração (precisa da senha correta)
- `backend/src/server.js` - API REST

---

**Dica:** Comece testando direto no Neon (OPÇÃO 1). É mais fácil e garante que o banco está funcionando!
