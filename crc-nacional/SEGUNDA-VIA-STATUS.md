# 📋 Sistema de 2ª Via - TJSE

## ✅ O que foi implementado:

### 1️⃣ **Nova Janela de Consulta**
- Interface visual para buscar 2ª Via (Nascimento/Casamento/Óbito)
- Campos: Termo, Data, Nº Declaração, Nome, Nome da Mãe, Nome do Pai
- Seletor de tipo de registro

### 2️⃣ **Integração com Painel Principal**
- Botão "📋 2ª Via TJSE" no painel
- Opção no menu do tray
- Atalho rápido

### 3️⃣ **Estrutura Criada**
```
src/
├── renderer/
│   ├── index.html          (painel principal - ATUALIZADO)
│   └── segunda-via.html    (NOVO - consulta)
├── electron-main.js        (ATUALIZADO - handlers)
└── segunda-via-handler.js  (NOVO - lógica de busca)
```

---

## 🚀 Como Usar:

### **Opção 1: Pelo Painel**
1. Clique no ícone da bandeja (duplo clique)
2. Clique no botão "📋 2ª Via TJSE"
3. Preencha os campos de busca
4. Clique em "🔍 Buscar no TJSE"

### **Opção 2: Pelo Menu do Tray**
1. Clique direito no ícone da bandeja
2. Clique em "📋 2ª Via TJSE"

---

## 📊 Status Atual:

### ✅ Implementado:
- Interface de consulta completa
- Seletor de tipo (Nascimento/Casamento/Óbito)
- Validação de campos
- Loading e tratamento de erros
- Mock de resultados para teste

### 🚧 Próximos Passos:

#### **Fase 2: Busca Real no TJSE**
```javascript
// Opções técnicas:
1. Scraping via Puppeteer (complexo, mas automático)
2. Injeção de script no Chrome (simples, usa sessão ativa)
3. Híbrido: usuário consulta, sistema captura resultado
```

#### **Fase 3: Formulário Completo**
- Criar `formulario.html`
- Pré-preencher dados do registro selecionado
- Botões de ofício (6º, 9º, 12º, 13º, 14º, 15º)
- Geração de XML com observação

#### **Fase 4: Geração de XML**
- Integrar com webhook DeMaria
- Injetar observação de averbação
- Forçar `<CodigoCNJ>` correto
- Salvar na pasta fixa

---

## 🧪 Testando Agora:

### **Mock de Dados:**
Se você buscar pelo termo `333`, vai retornar 3 resultados de exemplo:
- ANA CRISTINA DE JESUS
- MARLUCE MAYARA OLIVEIRA SANTOS
- ROSANGELA GOMES DE SOUZA

**Esses são dados mockados** para você testar a interface enquanto implementamos a busca real.

---

## 🔧 Próxima Decisão:

Para implementar a **busca real**, escolha uma opção:

### **A) Scraping Automático (Puppeteer)**
```javascript
// Pros: Totalmente automático
// Contras: Mais complexo, precisa gerenciar sessão
// Tempo: ~2-3 horas
```

### **B) Injeção de Script (Chrome)**
```javascript
// Pros: Usa sua sessão ativa, mais simples
// Contras: Precisa do Chrome aberto
// Tempo: ~1 hora
```

### **C) Híbrido (Recomendado para MVP)**
```javascript
// 1. Sistema abre TJSE no Chrome
// 2. Você faz a consulta manualmente
// 3. Sistema detecta resultados na página
// 4. Clica no resultado escolhido
// 5. Busca dados completos automaticamente
// Tempo: ~30 minutos
```

---

## 💡 Recomendação:

Começar com **Opção C (Híbrido)** porque:
- ✅ Funciona imediatamente
- ✅ Não precisa lidar com autenticação
- ✅ Usa sua sessão já logada
- ✅ Mais estável (não quebra se mudarem o site)

Depois, quando estiver funcionando bem, podemos evoluir para scraping automático.

---

**Status:** 🟢 **Fase 1 Concluída - Pronto para testar a interface!**

Abra o painel e clique em "2ª Via TJSE" para ver a nova janela! 🎉
