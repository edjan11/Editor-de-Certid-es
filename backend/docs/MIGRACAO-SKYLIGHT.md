# 🔄 Migração Skylight → Backend

## 🎯 Objetivo

Transformar os UserScripts do Tampermonkey em **coletores** que enviam dados para o backend via HTTP.

---

## 📊 Antes vs Depois

### ❌ ANTES (Arquitetura Frágil)
```
Tampermonkey Script (Cérebro + Coletor)
    ↓ localStorage
Browser Storage (Fonte da Verdade)
    ↓ Manual
TXT Export
```

**Problemas:**
- Lógica espalhada no browser
- Dados presos no localStorage
- Sem rastreabilidade
- Quebra quando site muda
- Não compartilha entre máquinas

### ✅ DEPOIS (Arquitetura Correta)
```
Skylight (Coletor)
    ↓ HTTP POST
Backend (Cérebro)
    ↓ SQL
PostgreSQL (Fonte da Verdade)
```

**Vantagens:**
- Lógica centralizada no backend
- Dados persistidos em banco relacional
- Logs rastreáveis
- Fácil manutenção
- Compartilhável entre máquinas

---

## 🔧 Passo 1: Instalar HTTP Client no Skylight

### Adicionar ao UserScript:
```javascript
// ==UserScript==
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

const BACKEND_URL = 'http://localhost:3100';

// Helper para fazer requisições
async function enviarParaBackend(endpoint, dados) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'POST',
      url: `${BACKEND_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(dados),
      onload: (response) => {
        try {
          const result = JSON.parse(response.responseText);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      onerror: reject
    });
  });
}
```

---

## 🔧 Passo 2: Adaptar "Painel Certidões"

### ANTES (localStorage):
```javascript
// Salva no localStorage
localStorage.setItem('certidoesStatusTJSE', JSON.stringify(dados));
```

### DEPOIS (Backend):
```javascript
// Extrai dados da página
const dados = {
  crc_id: extrairCRCId(),
  nome_registrado: extrairNome(),
  nome_mae: extrairMae(),
  tipo_certidao: 'nascimento',
  oficio: 9,
  origem: 'skylight'
};

// Envia para backend
try {
  const resposta = await enviarParaBackend('/registros', dados);
  console.log('✅ Registro criado:', resposta.dados.id);
} catch (error) {
  console.error('❌ Erro ao enviar:', error);
  // Fallback: salva no localStorage temporariamente
  localStorage.setItem('pendente_envio', JSON.stringify(dados));
}
```

---

## 🔧 Passo 3: Adaptar "Explorer Selos"

### ANTES (localStorage + backend SQLite local):
```javascript
localStorage.setItem('indexJSONsCRC_cache', JSON.stringify(selos));
```

### DEPOIS (Backend central):
```javascript
// Importar selos para backend
const selos = extrairSelosDaPagina();

try {
  const resposta = await enviarParaBackend('/selos', selos);
  console.log(`✅ ${resposta.dados.length} selos importados`);
} catch (error) {
  console.error('❌ Erro ao importar selos:', error);
}
```

### Buscar selo disponível:
```javascript
// ANTES: busca no localStorage
const seloLocal = localStorage.getItem('selos').find(s => s.nome === nome);

// DEPOIS: busca no backend
const resposta = await fetch(`${BACKEND_URL}/selos/disponiveis?nome=${encodeURIComponent(nome)}`);
const { dados } = await resposta.json();
const selo = dados[0]; // Primeiro resultado
```

---

## 🔧 Passo 4: Atualizar Status

### Quando certidão é impressa:
```javascript
// ANTES
statusMap[crc_id] = { impresso: true, data: new Date() };
localStorage.setItem('certidoesStatusTJSE', JSON.stringify(statusMap));

// DEPOIS
await enviarParaBackend(`/registros/${crc_id}/status`, {
  status: 'impresso'
});
```

---

## 🔧 Passo 5: Sincronização Offline (Opcional)

### Caso backend esteja offline:
```javascript
async function enviarComFallback(endpoint, dados) {
  try {
    return await enviarParaBackend(endpoint, dados);
  } catch (error) {
    console.warn('⚠️ Backend offline, salvando localmente');
    
    // Salva fila de pendentes
    const fila = JSON.parse(localStorage.getItem('fila_pendente') || '[]');
    fila.push({ endpoint, dados, timestamp: Date.now() });
    localStorage.setItem('fila_pendente', JSON.stringify(fila));
    
    return { sucesso: false, erro: 'Backend offline' };
  }
}

// Reaproveita fila quando backend voltar
async function sincronizarPendentes() {
  const fila = JSON.parse(localStorage.getItem('fila_pendente') || '[]');
  
  for (const item of fila) {
    try {
      await enviarParaBackend(item.endpoint, item.dados);
      console.log('✅ Sincronizado:', item.dados.crc_id);
    } catch (error) {
      console.error('❌ Erro ao sincronizar:', item.dados.crc_id);
      break; // Para na primeira falha
    }
  }
  
  // Limpa fila sincronizada
  localStorage.removeItem('fila_pendente');
}
```

---

## 📝 Exemplo Completo: Script Migrado

```javascript
// ==UserScript==
// @name         CRC Painel (Backend Integration)
// @match        https://sistema.registrocivil.org.br/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function() {
  'use strict';
  
  const BACKEND_URL = 'http://localhost:3100';
  
  // ========================================
  // HTTP CLIENT
  // ========================================
  
  async function post(endpoint, dados) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'POST',
        url: `${BACKEND_URL}${endpoint}`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(dados),
        onload: (res) => {
          const result = JSON.parse(res.responseText);
          result.sucesso ? resolve(result) : reject(result);
        },
        onerror: reject
      });
    });
  }
  
  async function get(endpoint) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: `${BACKEND_URL}${endpoint}`,
        onload: (res) => {
          const result = JSON.parse(res.responseText);
          resolve(result);
        },
        onerror: reject
      });
    });
  }
  
  // ========================================
  // COLETA DE DADOS
  // ========================================
  
  function extrairDadosPagina() {
    // Extrai dados da página CRC/TJSE
    const trs = document.querySelectorAll('tr');
    const registros = [];
    
    trs.forEach(tr => {
      const link = tr.querySelector('a[href*="solicitacao2aViaVisualizar"]');
      if (!link) return;
      
      const url = new URL(link.href);
      const crc_id = url.searchParams.get('id');
      
      const tds = tr.querySelectorAll('td');
      
      registros.push({
        crc_id,
        nome_registrado: tds[2]?.innerText.trim(),
        nome_mae: tds[3]?.innerText.trim(),
        tipo_certidao: 'nascimento', // Detectar dinamicamente
        oficio: 9, // Detectar dinamicamente
        origem: 'skylight'
      });
    });
    
    return registros;
  }
  
  // ========================================
  // ENVIO PARA BACKEND
  // ========================================
  
  async function sincronizarRegistros() {
    const registros = extrairDadosPagina();
    
    console.log(`📤 Enviando ${registros.length} registros...`);
    
    let sucessos = 0;
    let erros = 0;
    
    for (const registro of registros) {
      try {
        await post('/registros', registro);
        sucessos++;
      } catch (error) {
        if (error.mensagem?.includes('já existe')) {
          console.log(`⚠️ Registro ${registro.crc_id} já existe`);
        } else {
          console.error(`❌ Erro:`, error);
          erros++;
        }
      }
    }
    
    alert(`✅ ${sucessos} enviados | ⚠️ ${erros} erros`);
  }
  
  // ========================================
  // UI
  // ========================================
  
  const btn = document.createElement('button');
  btn.textContent = '🔄 Sincronizar com Backend';
  btn.style = 'position:fixed;top:10px;right:10px;z-index:9999;padding:10px;';
  btn.onclick = sincronizarRegistros;
  document.body.appendChild(btn);
  
})();
```

---

## ✅ Checklist de Migração

### Painel Certidões:
- [ ] Substituir `localStorage.setItem` por `POST /registros`
- [ ] Substituir `localStorage.getItem` por `GET /registros`
- [ ] Atualizar status via `PUT /registros/:id/status`
- [ ] Testar fluxo completo (coletar → enviar → consultar)

### Explorer Selos:
- [ ] Importar selos via `POST /selos`
- [ ] Buscar selos via `GET /selos/disponiveis`
- [ ] Marcar selo como usado via `PUT /selos/:id`
- [ ] Testar busca por similaridade de nome

### CRC Atalhos:
- [ ] Mantém como está (atalhos de teclado não precisam backend)

---

## 🧪 Como Testar

1. Iniciar backend: `cd backend && npm run dev`
2. Abrir DevTools do navegador (F12)
3. Executar script migrado no Tampermonkey
4. Verificar console: requisições HTTP sendo feitas
5. Consultar banco: `SELECT * FROM registros;`
6. Verificar logs: `SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10;`

---

## 🚨 Erros Comuns

### "Failed to fetch"
- Backend não está rodando → `npm run dev`
- Porta errada → verificar `PORT` no `.env`

### "CORS error"
- Backend precisa ter `app.use(cors())` ✅ Já tem

### "Validation failed"
- JSON não segue schema → verificar `docs/contrato-json.js`
- Campo obrigatório faltando → adicionar no script

---

## 🎯 Próximo Passo

Depois que Skylight estiver sincronizando com backend, implementar **Playwright** para automação completa (login + coleta + vinculação de selo).
