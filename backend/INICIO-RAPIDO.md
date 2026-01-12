# ⚡ INÍCIO RÁPIDO - Primeiros 15 Minutos

Este guia te leva do zero ao backend rodando em **15 minutos**.

---

## ✅ PRÉ-REQUISITOS

- [ ] Windows 10/11
- [ ] Node.js instalado ([baixar aqui](https://nodejs.org))
- [ ] Navegador web
- [ ] Editor de texto (VS Code recomendado)

---

## 🚀 PASSO A PASSO

### 1️⃣ Criar Conta no Neon (5min)

```
1. Acesse: https://neon.tech
2. Clique em "Sign Up"
3. Escolha "Continue with GitHub" (mais rápido)
4. Autorize o acesso
5. Na dashboard, clique em "New Project"
6. Nome: certidoes-crc
7. Região: US East (Ohio) - us-east-2
8. PostgreSQL Version: 16 (padrão)
9. Clique em "Create Project"
```

**Resultado:** Você terá um banco PostgreSQL gratuito rodando na nuvem.

---

### 2️⃣ Executar Schema SQL (2min)

```
1. No Neon, clique na aba "SQL Editor" (ícone de terminal)
2. Abra o arquivo: backend/database/schema.sql
3. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
4. Cole no SQL Editor do Neon (Ctrl+V)
5. Clique em "Run" (ou Ctrl+Enter)
6. Aguarde mensagem de sucesso
```

**Resultado:** Tabelas criadas (registros, selos_disponiveis, logs).

---

### 3️⃣ Copiar Connection String (1min)

```
1. No Neon, clique na aba "Connection Details"
2. Certifique-se que "Connection string" está selecionado
3. Clique no botão "Copy" ao lado da string
4. Salve em algum lugar (vamos usar já já)
```

**Exemplo do que você copiou:**
```
postgresql://usuario:senha@ep-abc123.us-east-2.aws.neon.tech/certidoes_crc?sslmode=require
```

---

### 4️⃣ Configurar Backend (3min)

```powershell
# 1. Abra PowerShell na pasta do projeto
cd C:\Users\Pichau\Desktop\Projetos\Centralizador\backend

# 2. Instalar dependências
npm install

# 3. Copiar arquivo de configuração
copy .env.example .env

# 4. Editar .env (abre no Notepad)
notepad .env
```

**No Notepad:**
```env
PORT=3100
DATABASE_URL=cole_aqui_a_connection_string_do_neon
NODE_ENV=development
```

Salve e feche (Ctrl+S, Alt+F4).

---

### 5️⃣ Iniciar Servidor (1min)

```powershell
# Ainda no PowerShell:
npm run dev
```

**Saída esperada:**
```
🚀 Backend rodando em http://localhost:3100
📊 Ambiente: development
🗄️ Banco: PostgreSQL (Neon)

✅ Sistema pronto para receber requisições
✅ Conexão PostgreSQL estabelecida
```

Se viu isso: **PARABÉNS!** Backend está rodando. ✅

---

### 6️⃣ Testar API (3min)

Abra **OUTRO** PowerShell (deixe o primeiro rodando) e teste:

```powershell
# Healthcheck
curl http://localhost:3100/health

# Criar registro de teste
curl -X POST http://localhost:3100/registros `
  -H "Content-Type: application/json" `
  -d '{\"crc_id\":\"12345\",\"nome_registrado\":\"TESTE SISTEMA\",\"tipo_certidao\":\"nascimento\",\"oficio\":9,\"origem\":\"manual\"}'

# Listar registros
curl http://localhost:3100/registros
```

**Resultado esperado:**
```json
{
  "sucesso": true,
  "mensagem": "Registro criado com sucesso",
  "dados": {
    "id": 1,
    "crc_id": "12345",
    "nome_registrado": "TESTE SISTEMA",
    "status": "pendente",
    ...
  }
}
```

---

## 🎉 SUCESSO!

Se chegou até aqui, você tem:
- ✅ Banco PostgreSQL na nuvem
- ✅ Backend Node.js rodando
- ✅ API REST funcional
- ✅ Primeiro registro criado

---

## 🔍 VERIFICAR NO BANCO

Volte no Neon → SQL Editor e execute:

```sql
-- Ver registros
SELECT * FROM registros;

-- Ver logs
SELECT * FROM logs ORDER BY timestamp DESC;

-- Estatísticas
SELECT status, COUNT(*) as total
FROM registros
GROUP BY status;
```

---

## 🐛 PROBLEMAS COMUNS

### "Node.js não é reconhecido"
**Solução:** Instale Node.js ([baixar aqui](https://nodejs.org)) e reinicie PowerShell.

### "npm não encontrado"
**Solução:** Reinicie PowerShell após instalar Node.js.

### "Connection timeout"
**Solução:** Verifique se DATABASE_URL está correta no `.env`.

### "EADDRINUSE: address already in use"
**Solução:** Porta 3100 já está em uso. Mude PORT=3200 no `.env`.

### "Cannot find module 'express'"
**Solução:** Execute `npm install` novamente.

---

## 📚 PRÓXIMOS PASSOS

Agora que backend está rodando:

1. **Entender o código:**
   - Leia `backend/README.md`
   - Estude `backend/docs/GUIA-CONCURSO.md`

2. **Explorar a API:**
   - Teste todos os endpoints com cURL
   - Use Postman/Insomnia para facilitar

3. **Migrar Skylight:**
   - Siga `backend/docs/MIGRACAO-SKYLIGHT.md`
   - Adapte UserScripts para enviar dados ao backend

4. **Ver roadmap completo:**
   - Leia `backend/ROADMAP.md`
   - Planeje próximas fases

---

## 💡 DICAS

### Manter backend rodando:
```powershell
# PowerShell 1: Backend
npm run dev

# PowerShell 2: Testes e comandos
curl http://localhost:3100/health
```

### Ver logs em tempo real:
Backend já mostra logs coloridos. Cada requisição aparece no console.

### Parar backend:
Pressione `Ctrl+C` no PowerShell onde backend está rodando.

### Reiniciar backend:
```powershell
# Parar (Ctrl+C)
# Iniciar novamente
npm run dev
```

---

## 📞 SUPORTE

### Documentação:
- `backend/README.md` - Visão geral técnica
- `backend/docs/GUIA-CONCURSO.md` - Conceitos explicados
- `backend/docs/MIGRACAO-SKYLIGHT.md` - Próximo passo
- `backend/ROADMAP.md` - Plano completo

### Recursos:
- Node.js: https://nodejs.org/docs
- Express: https://expressjs.com
- PostgreSQL: https://www.postgresql.org/docs
- Neon: https://neon.tech/docs

---

## ✅ CHECKLIST FINAL

Antes de prosseguir, confirme:

- [ ] Backend rodando em http://localhost:3100
- [ ] Healthcheck respondendo `{"status":"ok"}`
- [ ] Consegui criar registro de teste via cURL
- [ ] Consigo ver registro no SQL Editor do Neon
- [ ] Logs aparecem na tabela `logs`

**Tudo OK?** Você está pronto para Fase 2 (Migração Skylight). 🚀

---

## 🎓 O QUE VOCÊ APRENDEU

Em 15 minutos você:
- Criou banco PostgreSQL na nuvem (Neon)
- Executou SQL para criar tabelas
- Configurou backend Node.js + Express
- Testou API REST
- Validou persistência de dados

**Isso é exatamente o tipo de conhecimento cobrado em concursos.**

Parabéns! 🎉
