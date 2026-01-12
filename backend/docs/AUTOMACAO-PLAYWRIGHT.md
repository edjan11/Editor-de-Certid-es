# 🤖 AUTOMAÇÃO PLAYWRIGHT - Geração de Certidões TJSE

## 🎯 Objetivo

Automatizar **100%** do processo de geração de certidões no TJSE usando os JSONs já salvos pelos UserScripts.

---

## 📊 Fluxo Atual (Manual)

```
1. Usuário acessa TJSE manualmente
2. Clica em "Carregar arquivo"
3. Seleciona JSON salvo pelo UserScript
4. Clica em "Importar"
5. Sistema TJSE carrega dados
6. Usuário vincula selo manualmente
7. Usuário clica "Gerar certidão"
8. Certidão é emitida
```

**Tempo:** ~3-5 minutos por certidão

---

## 🚀 Fluxo Automatizado (Playwright)

```
1. Backend consulta registros com status="pendente"
2. Playwright abre TJSE (sessão salva)
3. Para cada registro:
   ├─ Localiza JSON na pasta (File System API)
   ├─ Acessa página de upload do TJSE
   ├─ Clica botão "Carregar arquivo"
   ├─ Seleciona JSON automaticamente
   ├─ Clica "Importar"
   ├─ Aguarda formulário preencher
   ├─ Busca selo disponível no backend
   ├─ Preenche campos de selo
   ├─ Clica "Gerar certidão"
   ├─ Aguarda emissão
   ├─ Captura número da certidão
   ├─ Atualiza backend → status="emitido"
   └─ Screenshot da certidão
4. Gera relatório final
```

**Tempo:** ~30 segundos por certidão

---

## 🗂️ Estrutura de Dados

### JSON salvo pelo UserScript:

```json
{
  "certidao": {
    "plataformaId": "certidao-eletronica",
    "tipo_registro": "casamento",
    "tipo_certidao": "Breve relato",
    "cartorio_cns": "110742",
    "selo": "",
    "cod_selo": "",
    "modalidade": "eletronica"
  },
  "registro": {
    "conjuges": [
      {
        "nome_atual_habilitacao": "JOYCE DE OLIVEIRA",
        "cpf": "123.456.789-00",
        "novo_nome": "JOYCE DE OLIVEIRA SANTOS",
        "data_nascimento": "22/08/1995",
        "nacionalidade": "BRASILEIRA",
        "municipio_naturalidade": "ARACAJU",
        "uf_naturalidade": "SE"
      },
      {
        "nome_atual_habilitacao": "CARLOS SANTOS",
        "cpf": "987.654.321-00",
        "novo_nome": "CARLOS SANTOS",
        "data_nascimento": "15/03/1990"
      }
    ],
    "matricula": "110742202501010000012345678901",
    "data_celebracao": "10/01/2025",
    "regime_bens": "COMUNHÃO PARCIAL DE BENS",
    "data_registro": "11/01/2025"
  }
}
```

### Registro no Backend:

```json
{
  "id": 42,
  "crc_id": "87654321",
  "tipo_certidao": "casamento",
  "nome_registrado": "JOYCE DE OLIVEIRA E CARLOS SANTOS",
  "termo": "100",
  "oficio": 9,
  "status": "pendente",
  "json_path": "2025-01-11/JOYCE_OLIVEIRA_CARLOS_SANTOS_casamento.json"
}
```

---

## 🧩 Campos do Formulário TJSE

### Botão de Upload:

```html
<input type="file" id="arquivoJSONCertidao" name="arquivoJSONCertidao">
```

### Botão de Importar:

```html
<a class="btn btn-success" onclick="javascript:uploadJSONCertidao();">Importar</a>
```

### Campos de Selo (preenchimento após importação):

```javascript
// Seletores Playwright
const campoSelo = 'input[name="numeroSelo"]';
const campoCodigo = 'input[name="codigoSelo"]';
const btnGerar = 'button:has-text("Gerar Certidão")';
```

---

## 🎬 Script Playwright

### Estrutura básica:

```javascript
// playwright/gerar-certidoes-tjse.js

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Config
const BACKEND_URL = 'http://localhost:3100';
const TJSE_URL = 'https://www.tjse.jus.br/scc/paginas/segundaVia/casamento/';
const JSON_BASE_DIR = 'C:/Users/Pichau/Desktop/JSONs'; // Pasta onde UserScripts salvam

async function buscarRegistrosPendentes() {
  const res = await fetch(`${BACKEND_URL}/registros?status=pendente&tipo=casamento`);
  const { dados } = await res.json();
  return dados;
}

async function buscarSeloDisponivel(nomeRegistrado) {
  const res = await fetch(
    `${BACKEND_URL}/selos/disponiveis?nome=${encodeURIComponent(nomeRegistrado)}`
  );
  const { dados } = await res.json();
  return dados[0]; // Primeiro selo disponível
}

async function atualizarStatus(crc_id, status, selo = null) {
  const body = { status };
  if (selo) {
    body.selo_numero = selo.selo_numero;
    body.selo_codigo = selo.selo_codigo;
  }
  
  await fetch(`${BACKEND_URL}/registros/${crc_id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function processarCertidao(page, registro) {
  console.log(`📄 Processando: ${registro.nome_registrado}`);
  
  try {
    // 1. Navegar para página de upload
    await page.goto(TJSE_URL);
    await page.waitForLoadState('networkidle');
    
    // 2. Localizar JSON
    const jsonPath = path.join(JSON_BASE_DIR, registro.json_path);
    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    
    if (!jsonExists) {
      throw new Error(`JSON não encontrado: ${jsonPath}`);
    }
    
    // 3. Upload do JSON
    const fileInput = await page.locator('#arquivoJSONCertidao');
    await fileInput.setInputFiles(jsonPath);
    
    // 4. Clicar em "Importar"
    await page.click('a.btn-success:has-text("Importar")');
    await page.waitForTimeout(2000); // Aguarda formulário preencher
    
    // 5. Buscar selo disponível
    const selo = await buscarSeloDisponivel(registro.nome_registrado);
    
    if (!selo) {
      throw new Error('Nenhum selo disponível');
    }
    
    console.log(`🏷️ Usando selo: ${selo.selo_numero}`);
    
    // 6. Preencher selo
    await page.fill('input[name="numeroSelo"]', selo.selo_numero);
    await page.fill('input[name="codigoSelo"]', selo.selo_codigo);
    
    // 7. Gerar certidão
    await page.click('button:has-text("Gerar Certidão")');
    await page.waitForTimeout(3000);
    
    // 8. Capturar número da certidão (se houver)
    const numeroCertidao = await page.locator('.numero-certidao').textContent();
    console.log(`✅ Certidão gerada: ${numeroCertidao}`);
    
    // 9. Screenshot
    const screenshotPath = path.join(
      JSON_BASE_DIR, 
      'screenshots', 
      `${registro.crc_id}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // 10. Atualizar backend
    await atualizarStatus(registro.crc_id, 'emitido', selo);
    
    return { sucesso: true, certidao: numeroCertidao };
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${registro.crc_id}:`, error.message);
    
    // Marcar como erro no backend
    await atualizarStatus(registro.crc_id, 'erro');
    
    return { sucesso: false, erro: error.message };
  }
}

async function main() {
  console.log('🚀 Iniciando automação TJSE...');
  
  // 1. Buscar registros pendentes
  const registros = await buscarRegistrosPendentes();
  console.log(`📋 ${registros.length} certidões pendentes`);
  
  if (registros.length === 0) {
    console.log('✅ Nenhuma certidão pendente');
    return;
  }
  
  // 2. Abrir browser
  const browser = await chromium.launch({
    headless: false, // Mostra browser para debug
    channel: 'chrome' // Usa Chrome instalado
  });
  
  // 3. Usar contexto salvo (sessão TJSE)
  const context = await browser.newContext({
    storageState: 'playwright/.auth/tjse.json' // Sessão salva
  });
  
  const page = await context.newPage();
  
  // 4. Processar cada certidão
  const resultados = [];
  
  for (const registro of registros) {
    const resultado = await processarCertidao(page, registro);
    resultados.push({ ...registro, ...resultado });
    
    // Pausa entre certidões (evita sobrecarga)
    await page.waitForTimeout(2000);
  }
  
  // 5. Fechar browser
  await browser.close();
  
  // 6. Relatório
  const sucesso = resultados.filter(r => r.sucesso).length;
  const erros = resultados.length - sucesso;
  
  console.log('\n📊 RELATÓRIO FINAL');
  console.log(`✅ Sucesso: ${sucesso}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📝 Total: ${resultados.length}`);
  
  // 7. Salvar relatório em arquivo
  const relatorio = {
    timestamp: new Date().toISOString(),
    total: resultados.length,
    sucesso,
    erros,
    detalhes: resultados
  };
  
  await fs.writeFile(
    `relatorios/relatorio-${Date.now()}.json`,
    JSON.stringify(relatorio, null, 2)
  );
  
  console.log('✅ Automação concluída!');
}

// Executar
main().catch(console.error);
```

---

## 🔐 Salvar Sessão TJSE

### Script para autenticar uma vez:

```javascript
// playwright/salvar-sessao-tjse.js

const { chromium } = require('playwright');

async function salvarSessao() {
  console.log('🔐 Salvando sessão TJSE...');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 1. Abrir página de login
  await page.goto('https://www.tjse.jus.br/scc/login.jsp');
  
  console.log('👉 Faça login manualmente no browser...');
  console.log('👉 Após logar, pressione Enter aqui no terminal');
  
  // Aguarda input do usuário
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
  
  // 2. Salvar estado da sessão
  await context.storageState({ path: 'playwright/.auth/tjse.json' });
  
  console.log('✅ Sessão salva!');
  console.log('📁 Arquivo: playwright/.auth/tjse.json');
  
  await browser.close();
}

salvarSessao();
```

**Uso:**
```bash
node playwright/salvar-sessao-tjse.js
# Faz login manualmente
# Pressiona Enter
# Sessão salva e reutilizável por 30+ dias
```

---

## 📁 Estrutura de Pastas

```
C:\Users\Pichau\Desktop\JSONs\
├── 2025-01-10\
│   ├── JOYCE_OLIVEIRA_CARLOS_SANTOS_casamento.json
│   ├── ANDERSON_SILVA_nascimento.json
│   └── ...
├── 2025-01-11\
│   └── ...
├── screenshots\
│   ├── 87654321.png
│   └── ...
└── relatorios\
    ├── relatorio-1736615234567.json
    └── ...
```

---

## 🔧 Integração com Backend

### Adicionar campo `json_path` ao criar registro:

```javascript
// Skylight envia:
{
  "crc_id": "87654321",
  "nome_registrado": "JOYCE DE OLIVEIRA E CARLOS SANTOS",
  "tipo_certidao": "casamento",
  "oficio": 9,
  "origem": "skylight",
  "json_path": "2025-01-11/JOYCE_OLIVEIRA_CARLOS_SANTOS_casamento.json"
}
```

### Backend salva esse caminho no banco:

```sql
ALTER TABLE registros ADD COLUMN json_path VARCHAR(500);
```

---

## ⚙️ Configuração

### Arquivo `playwright/config.js`:

```javascript
module.exports = {
  backend: {
    url: 'http://localhost:3100'
  },
  tjse: {
    url: 'https://www.tjse.jus.br/scc/',
    sessionPath: 'playwright/.auth/tjse.json'
  },
  pastas: {
    jsons: 'C:/Users/Pichau/Desktop/JSONs',
    screenshots: 'C:/Users/Pichau/Desktop/JSONs/screenshots',
    relatorios: 'C:/Users/Pichau/Desktop/JSONs/relatorios'
  },
  timeouts: {
    upload: 5000,
    importacao: 3000,
    geracao: 5000
  }
};
```

---

## 🚀 Execução

### Manual:
```bash
node playwright/gerar-certidoes-tjse.js
```

### Agendado (Windows Task Scheduler):
```batch
REM executar-certidoes.bat
@echo off
cd C:\Users\Pichau\Desktop\Projetos\Centralizador\playwright
node gerar-certidoes-tjse.js
pause
```

**Agendar para rodar:**
- Segunda a sexta, 08:30
- Processa certidões pendentes do dia anterior

---

## 📊 Monitoramento

### Query SQL para acompanhar:

```sql
-- Estatísticas do dia
SELECT 
  status,
  COUNT(*) as total
FROM registros
WHERE DATE(criado_em) = CURRENT_DATE
GROUP BY status;

-- Certidões com erro
SELECT 
  crc_id,
  nome_registrado,
  json_path,
  atualizado_em
FROM registros
WHERE status = 'erro'
ORDER BY atualizado_em DESC;

-- Últimas 10 certidões emitidas
SELECT 
  crc_id,
  nome_registrado,
  selo_numero,
  atualizado_em
FROM registros
WHERE status = 'emitido'
ORDER BY atualizado_em DESC
LIMIT 10;
```

---

## 🐛 Tratamento de Erros

### Erros comuns:

| Erro | Causa | Solução |
|------|-------|---------|
| JSON não encontrado | Caminho errado | Verificar `json_path` no banco |
| Sessão expirada | Login TJSE expirou | Executar `salvar-sessao-tjse.js` |
| Selo indisponível | Estoque vazio | Importar mais selos |
| Timeout | TJSE lento | Aumentar timeouts no config |

### Log detalhado:

```javascript
// Em cada etapa:
console.log(`[${new Date().toISOString()}] 📤 Fazendo upload do JSON...`);
console.log(`[${new Date().toISOString()}] ⏳ Aguardando importação...`);
console.log(`[${new Date().toISOString()}] 🏷️ Preenchendo selo...`);
console.log(`[${new Date().toISOString()}] ⚙️ Gerando certidão...`);
console.log(`[${new Date().toISOString()}] ✅ Certidão emitida!`);
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Instalar Playwright: `npm install playwright`
- [ ] Criar pasta `playwright/.auth/`
- [ ] Executar `salvar-sessao-tjse.js` (login uma vez)
- [ ] Adicionar coluna `json_path` na tabela `registros`
- [ ] Criar script `gerar-certidoes-tjse.js`
- [ ] Testar com 1 certidão pendente
- [ ] Validar screenshot e status no banco
- [ ] Processar lote de 10 certidões
- [ ] Agendar execução diária

---

## 🎯 PRÓXIMOS PASSOS

1. **Hoje:** Adicionar `json_path` ao schema SQL
2. **Amanhã:** Criar script básico Playwright
3. **Semana 1:** Testar com 10-20 certidões
4. **Semana 2:** Agendar execução automática
5. **Mês 1:** Processar 100+ certidões/dia sem intervenção

---

## 💡 VANTAGENS

- ⏱️ **10x mais rápido** (30s vs 5min por certidão)
- 🤖 **0% intervenção humana**
- 📊 **Rastreabilidade total** (logs + screenshots)
- 🔄 **Reprocessamento** automático em caso de erro
- 📈 **Escalável** (10 certidões ou 100, mesmo esforço)

**Resultado:** Sistema completamente automatizado do início ao fim. 🚀
