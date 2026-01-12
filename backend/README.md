# 🏛️ Backend Centralizado - Sistema CRC/TJSE

## 🎯 Arquitetura

Este é o **núcleo do sistema**. Toda lógica de negócio, validação e persistência acontece aqui.

```
Browser (Skylight/Playwright) → Backend → PostgreSQL
          [Coletor]           [Cérebro]  [Verdade]
```

## 📚 Conceitos de Concurso Aplicados

### 1. **Arquitetura Cliente-Servidor**
- Backend atua como servidor centralizado
- Clientes (Skylight, Playwright) enviam requisições HTTP
- Separação clara de responsabilidades

### 2. **Banco de Dados Relacional (PostgreSQL)**
- Modelagem com chaves primárias e estrangeiras
- Constraints para integridade referencial
- Índices para otimização de buscas
- Views para queries complexas

### 3. **Transações ACID**
- Operações atômicas (tudo ou nada)
- Consistência garantida por constraints
- Isolamento entre operações concorrentes
- Durabilidade com PostgreSQL

### 4. **Rastreabilidade e Auditoria**
- Tabela `logs` registra TODAS as operações
- Campos `criado_em` e `atualizado_em` em registros
- Trigger automático para `atualizado_em`

### 5. **Validação de Dados**
- Schema Zod valida ANTES de tocar no banco
- Tratamento de erros padronizado
- Respostas JSON uniformes

## 🚀 Setup

### 1. Criar conta no Neon.tech (PostgreSQL gratuito)
```
1. Acesse: https://neon.tech
2. Crie conta (GitHub login)
3. Crie projeto: "certidoes-crc"
4. Copie a CONNECTION STRING
```

### 2. Executar schema.sql no Neon
```sql
-- Cole o conteúdo de database/schema.sql
-- no SQL Editor do Neon e execute
```

### 3. Configurar ambiente
```bash
cd backend
npm install
cp .env.example .env
# Edite .env e cole sua DATABASE_URL do Neon
```

### 4. Iniciar servidor
```bash
npm run dev   # Com hot-reload
# ou
npm start     # Produção
```

## 📡 Endpoints

### Healthcheck
```http
GET /health
```

### Criar Registro
```http
POST /registros
Content-Type: application/json

{
  "crc_id": "87654321",
  "nome_registrado": "JOYCE DE OLIVEIRA",
  "nome_mae": "ANA OLIVEIRA DOS SANTOS",
  "data_nascimento": "22/08/1995",
  "termo": "100",
  "tipo_certidao": "nascimento",
  "oficio": 9,
  "origem": "skylight"
}
```

### Listar Registros
```http
GET /registros?status=pendente&oficio=9&limit=50
```

### Buscar Registro Específico
```http
GET /registros/87654321
```

### Atualizar Status
```http
PUT /registros/87654321/status
Content-Type: application/json

{
  "status": "selo_vinculado",
  "selo_numero": "SE-001234-2026",
  "selo_codigo": "ABC123XYZ"
}
```

### Importar Selos (lote)
```http
POST /selos
Content-Type: application/json

[
  {
    "selo_numero": "SE-001234-2026",
    "selo_codigo": "ABC123XYZ",
    "nome_registrado": "ANDERSON DA SILVA PORTO",
    "data_nascimento": "15/03/1990",
    "tipo_certidao": "nascimento"
  }
]
```

### Listar Selos Disponíveis
```http
GET /selos/disponiveis?nome=anderson
```

### Consultar Logs
```http
GET /logs?registro_id=42&nivel=info&limit=100
```

## 🔍 Queries SQL Úteis

### Registros pendentes com selo disponível
```sql
SELECT * FROM v_pendentes_com_selo;
```

### Estatísticas por status
```sql
SELECT status, COUNT(*) as total
FROM registros
GROUP BY status
ORDER BY total DESC;
```

### Últimas operações (auditoria)
```sql
SELECT 
  l.timestamp,
  l.acao,
  l.origem,
  r.crc_id,
  r.nome_registrado
FROM logs l
LEFT JOIN registros r ON l.registro_id = r.id
ORDER BY l.timestamp DESC
LIMIT 50;
```

### Selos mais usados por tipo
```sql
SELECT 
  tipo_certidao,
  COUNT(*) as total_usado
FROM selos_disponiveis
WHERE usado = TRUE
GROUP BY tipo_certidao;
```

## 🧪 Testando o Backend

### Com cURL
```bash
# Healthcheck
curl http://localhost:3100/health

# Criar registro
curl -X POST http://localhost:3100/registros \
  -H "Content-Type: application/json" \
  -d '{"crc_id":"12345","nome_registrado":"TESTE","tipo_certidao":"nascimento","oficio":9,"origem":"manual"}'

# Listar registros
curl http://localhost:3100/registros
```

### Com Postman/Insomnia
Importe a coleção de requisições (criar arquivo separado se necessário).

## 📊 Monitoramento

### Logs do servidor
```bash
npm run dev  # Mostra todos os logs coloridos
```

### Logs no banco
```sql
SELECT * FROM logs WHERE nivel IN ('error', 'critical');
```

## 🔐 Segurança (futuro)

- [ ] Autenticação JWT
- [ ] Rate limiting
- [ ] HTTPS em produção
- [ ] Validação de origem (CORS restrito)

## 📖 Próximos Passos

1. ✅ Backend funcional com PostgreSQL
2. 🔄 Conectar Skylight ao backend
3. 🔄 Criar Playwright para automação completa
4. ⏳ Dashboard web para visualização
5. ⏳ Deploy em produção (Render/Railway)

## 🎓 Por que essa arquitetura?

- **Concursos públicos**: Cobram modelagem relacional, SQL, transações
- **Cartórios**: Precisam rastreabilidade total (logs)
- **Manutenção**: Lógica centralizada = fácil debugar
- **Escalabilidade**: Backend pode servir múltiplos clientes
- **Profissionalismo**: Padrão da indústria, não gambiarra
