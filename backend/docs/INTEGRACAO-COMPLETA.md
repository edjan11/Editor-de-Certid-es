# 🔗 INTEGRAÇÃO COMPLETA - UserScripts → Backend → Playwright

## 🎯 Visão Geral

Sistema completo que automatiza desde a **captura de dados no TJSE** até a **geração automática de certidões**.

---

## 📊 FLUXO COMPLETO DE PONTA A PONTA

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1: CAPTURA DE DADOS (UserScripts)                        │
└─────────────────────────────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  UserScript detecta certidão no TJSE     │
    │  • TJSE Certidão Casamento.user.js       │
    │  • Painel Selo v6.user.js                │
    └──────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  Salva JSON local (File System API)      │
    │  📁 C:/JSONs/2025-01-11/JOYCE_CARLOS.json│
    └──────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  Indexa no localStorage                  │
    │  • indexJSONsCRC                         │
    │  • PSA_v1:index                          │
    └──────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FASE 2: SINCRONIZAÇÃO (Skylight → Backend)                    │
└─────────────────────────────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  Skylight lê localStorage                │
    │  • Detecta novos JSONs                   │
    │  • Monta objeto padrão                   │
    └──────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  HTTP POST /registros → Backend          │
    │  {                                       │
    │    "crc_id": "87654321",                │
    │    "nome_registrado": "JOYCE E CARLOS", │
    │    "tipo_certidao": "casamento",        │
    │    "oficio": 9,                         │
    │    "json_path": "2025-01-11/JOYCE..."   │
    │  }                                       │
    └──────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  Backend valida (Zod)                    │
    │  • Verifica campos obrigatórios          │
    │  • Converte datas                        │
    └──────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  INSERT INTO registros (PostgreSQL)      │
    │  • id: 42                                │
    │  • status: "pendente"                    │
    │  • json_path: salvo                      │
    └──────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  INSERT INTO logs                        │
    │  • acao: "registro_criado"               │
    │  • origem: "skylight"                    │
    └──────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FASE 3: AUTOMAÇÃO (Playwright)                                │
└─────────────────────────────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  CRON dispara às 08:30 (segunda-sexta)  │
    │  node playwright/gerar-certidoes-tjse.js │
    └──────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  GET /registros?status=pendente          │
    │  Backend retorna lista de registros      │
    └──────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  Para cada registro:                     │
    │  1. Localiza JSON (usando json_path)     │
    │  2. Abre TJSE com sessão salva           │
    │  3. Upload do JSON                       │
    │  4. Clica "Importar"                     │
    │  5. Busca selo disponível no backend     │
    │  6. Preenche selo                        │
    │  7. Clica "Gerar Certidão"               │
    │  8. Captura screenshot                   │
    └──────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  PUT /registros/:id/status               │
    │  {                                       │
    │    "status": "emitido",                 │
    │    "selo_numero": "SE-001234",          │
    │    "selo_codigo": "ABC123"              │
    │  }                                       │
    └──────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  Backend atualiza PostgreSQL             │
    │  • status: "emitido"                     │
    │  • selo_numero: vinculado                │
    │  • atualizado_em: NOW()                  │
    └──────────────────────────────────────────┘
                            ▼
    ┌──────────────────────────────────────────┐
    │  Relatório gerado                        │
    │  📊 50 certidões processadas             │
    │  ✅ 48 sucesso                           │
    │  ❌ 2 erros                              │
    └──────────────────────────────────────────┘
```

---

## 🗂️ ESTRUTURA DE ARQUIVOS

```
C:\Users\Pichau\Desktop\
├── JSONs\                              # UserScripts salvam aqui
│   ├── 2025-01-10\
│   │   ├── JOYCE_OLIVEIRA_CARLOS_SANTOS_casamento.json
│   │   ├── ANDERSON_SILVA_nascimento.json
│   │   └── ...
│   ├── 2025-01-11\
│   │   ├── MARINA_SANTOS_nascimento.json
│   │   └── ...
│   ├── screenshots\                   # Playwright salva aqui
│   │   ├── 87654321.png
│   │   └── ...
│   └── relatorios\                    # Playwright gera aqui
│       ├── relatorio-1736615234567.json
│       └── ...
│
└── Projetos\Centralizador\
    ├── backend\                       # Backend Node.js
    │   ├── src\
    │   │   └── server.js              # API REST
    │   └── database\
    │       └── schema.sql             # PostgreSQL
    │
    ├── playwright\                    # Automação
    │   ├── .auth\
    │   │   └── tjse.json              # Sessão salva
    │   ├── gerar-certidoes-tjse.js    # Script principal
    │   └── salvar-sessao-tjse.js      # Autenticação
    │
    └── skylight\                      # UserScripts (futuro)
        ├── painel-certidoes-v2.user.js
        └── explorer-selos-v2.user.js
```

---

## 📋 TABELA DE RESPONSABILIDADES

| Componente | Responsabilidade | Tecnologia |
|------------|------------------|------------|
| **UserScripts** | Capturar dados do TJSE + Salvar JSON local | Tampermonkey |
| **localStorage** | Cache temporário + Indexação | Browser API |
| **Skylight** | Sincronizar localStorage → Backend | GM_xmlhttpRequest |
| **Backend** | Validar + Persistir + API REST | Node.js + Express |
| **PostgreSQL** | Fonte da verdade + Rastreabilidade | Neon.tech |
| **Playwright** | Automação TJSE + Upload JSON + Gerar certidão | Playwright |
| **File System** | Armazenar JSONs + Screenshots + Relatórios | Windows FS |

---

## 🔄 DADOS EM CADA ETAPA

### 1️⃣ UserScript captura:

```javascript
// Painel Selo v6
{
  tipo: 'CASAMENTO',
  nome: 'JOYCE DE OLIVEIRA E CARLOS SANTOS',
  nascimento: '', // não tem em casamento
  selo: '',
  codigo: '',
  createdAt: 1736615234567,
  capturedAt: 0
}
```

### 2️⃣ JSON salvo localmente:

```json
{
  "certidao": {
    "tipo_registro": "casamento",
    "cartorio_cns": "110742",
    "selo": "",
    "cod_selo": ""
  },
  "registro": {
    "conjuges": [
      { "nome_atual_habilitacao": "JOYCE DE OLIVEIRA", ... },
      { "nome_atual_habilitacao": "CARLOS SANTOS", ... }
    ],
    "matricula": "110742202501010000012345678901",
    "data_celebracao": "10/01/2025"
  }
}
```

### 3️⃣ Skylight envia ao backend:

```json
{
  "crc_id": "87654321",
  "nome_registrado": "JOYCE DE OLIVEIRA E CARLOS SANTOS",
  "tipo_certidao": "casamento",
  "oficio": 9,
  "json_path": "2025-01-11/JOYCE_OLIVEIRA_CARLOS_SANTOS_casamento.json",
  "origem": "skylight"
}
```

### 4️⃣ Backend salva no PostgreSQL:

```sql
INSERT INTO registros (
  crc_id, nome_registrado, tipo_certidao, oficio, 
  json_path, status, criado_em
) VALUES (
  '87654321', 
  'JOYCE DE OLIVEIRA E CARLOS SANTOS', 
  'casamento', 
  9, 
  '2025-01-11/JOYCE_OLIVEIRA_CARLOS_SANTOS_casamento.json',
  'pendente',
  '2025-01-11 15:30:45'
);
```

### 5️⃣ Playwright consulta backend:

```http
GET /registros?status=pendente&tipo=casamento

Response:
{
  "sucesso": true,
  "total": 5,
  "dados": [
    {
      "id": 42,
      "crc_id": "87654321",
      "nome_registrado": "JOYCE DE OLIVEIRA E CARLOS SANTOS",
      "json_path": "2025-01-11/JOYCE_OLIVEIRA_CARLOS_SANTOS_casamento.json",
      "status": "pendente"
    }
  ]
}
```

### 6️⃣ Playwright localiza JSON:

```javascript
const jsonPath = path.join(
  'C:/Users/Pichau/Desktop/JSONs',
  registro.json_path
);
// Resultado: C:/Users/Pichau/Desktop/JSONs/2025-01-11/JOYCE_OLIVEIRA_CARLOS_SANTOS_casamento.json
```

### 7️⃣ Playwright busca selo:

```http
GET /selos/disponiveis?nome=JOYCE DE OLIVEIRA

Response:
{
  "sucesso": true,
  "dados": [
    {
      "id": 123,
      "selo_numero": "SE-20250111-001234",
      "selo_codigo": "ABC123XYZ",
      "nome_registrado": "JOYCE DE OLIVEIRA",
      "usado": false
    }
  ]
}
```

### 8️⃣ Playwright atualiza status:

```http
PUT /registros/87654321/status

Body:
{
  "status": "emitido",
  "selo_numero": "SE-20250111-001234",
  "selo_codigo": "ABC123XYZ"
}
```

### 9️⃣ Backend grava log:

```sql
INSERT INTO logs (
  registro_id, acao, detalhes, origem, nivel, timestamp
) VALUES (
  42,
  'certidao_emitida',
  '{"selo": "SE-20250111-001234", "automatico": true}',
  'playwright',
  'info',
  '2025-01-11 15:35:12'
);
```

---

## ⏱️ TIMELINE TÍPICA

```
T+0s   | UserScript detecta certidão no TJSE
T+1s   | JSON salvo localmente
T+2s   | Indexado no localStorage
       |
T+5s   | Skylight lê localStorage
T+6s   | Skylight envia HTTP POST ao backend
T+7s   | Backend valida e salva no PostgreSQL
T+8s   | Log gravado
       |
[aguarda CRON 08:30]
       |
T+08:30:00 | Playwright inicia
T+08:30:01 | Consulta registros pendentes
T+08:30:02 | Localiza JSON
T+08:30:05 | Faz upload no TJSE
T+08:30:08 | Clica "Importar"
T+08:30:12 | Formulário preenchido
T+08:30:13 | Busca selo no backend
T+08:30:15 | Preenche selo
T+08:30:18 | Clica "Gerar Certidão"
T+08:30:23 | Certidão emitida
T+08:30:24 | Screenshot capturado
T+08:30:25 | Status atualizado no backend
T+08:30:26 | Próxima certidão...
```

**Tempo por certidão:** ~30 segundos
**50 certidões:** ~25 minutos (vs 4+ horas manual)

---

## 🎯 PONTOS DE FALHA E RECUPERAÇÃO

| Ponto | Falha Possível | Recuperação |
|-------|----------------|-------------|
| UserScript | JSON não salvo | Reprocessar página manualmente |
| localStorage | Dados perdidos | Reimportar JSON via Painel de Selos |
| Backend | API offline | Fila local no Skylight (fallback) |
| PostgreSQL | Conexão perdida | Reconecta automaticamente (Pool) |
| Playwright | TJSE offline | Marca como "erro", retenta amanhã |
| File System | JSON não encontrado | Log de erro, pula certidão |

**Estratégia:** Cada etapa é independente. Se falhar, não quebra as outras.

---

## ✅ VALIDAÇÕES EM CADA CAMADA

### UserScript:
- ✅ Página contém dados válidos
- ✅ JSON gerado tem estrutura correta

### Skylight:
- ✅ localStorage tem novos itens
- ✅ Backend está respondendo
- ✅ Formato JSON válido

### Backend:
- ✅ Schema Zod valida campos
- ✅ CRC_ID não duplicado
- ✅ Tipo de certidão válido

### PostgreSQL:
- ✅ Constraints (UNIQUE, CHECK, NOT NULL)
- ✅ Foreign keys íntegras
- ✅ Tipos de dados corretos

### Playwright:
- ✅ JSON existe no disco
- ✅ Selo disponível no backend
- ✅ TJSE aceita upload
- ✅ Certidão gerada com sucesso

---

## 📊 MÉTRICAS DE SUCESSO

### Por dia:
- 📥 **Capturas:** ~50-100 certidões (UserScript)
- 💾 **Sincronizadas:** 100% enviadas ao backend
- 🤖 **Automatizadas:** 90%+ processadas pelo Playwright
- ⏱️ **Tempo economizado:** 3-4 horas/dia

### Por mês:
- 📈 **Volume:** 1.000-2.000 certidões
- 🎯 **Taxa de sucesso:** 95%+
- 📉 **Intervenção manual:** <5%
- 💰 **ROI:** Incalculável (tempo poupado)

---

## 🚀 EVOLUÇÃO FUTURA

### Fase 1 (Atual):
- ✅ Backend centralizado
- ✅ PostgreSQL como fonte da verdade
- ✅ Documentação completa

### Fase 2 (Próxima semana):
- 🔄 Skylight sincronizando
- 🔄 Playwright processando

### Fase 3 (Próximo mês):
- ⏳ Dashboard web
- ⏳ Notificações Telegram
- ⏳ Relatórios automáticos

### Fase 4 (Médio prazo):
- ⏳ Deploy em cloud
- ⏳ Múltiplos usuários
- ⏳ Mobile app

---

## 💡 LIÇÕES APRENDIDAS

### ✅ O que funcionou:
- Backend como núcleo (decisão certa)
- PostgreSQL em vez de localStorage
- File System API para JSONs
- Playwright para automação

### ⚠️ O que ajustar:
- Tratamento de erros mais robusto
- Retry automático em falhas
- Backup mais frequente
- Monitoramento em tempo real

### 🎓 O que aprendemos:
- Arquitetura cliente-servidor na prática
- SQL relacional hands-on
- API REST profissional
- Automação web escalável

**Conclusão:** Sistema profissional, rastreável e escalável. 🎯
