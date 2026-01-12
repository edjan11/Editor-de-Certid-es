# 🏥 INSTALAÇÃO MATERNIDADE TJSE - CARTÓRIOS

## 📋 GUIA RÁPIDO PARA INSTALAÇÃO NOS CARTÓRIOS

### ✅ PRÉ-REQUISITOS

**Antes de ir ao cartório, certifique-se:**

1. **Node.js instalado** (v18 ou superior)
   - Download: https://nodejs.org
   - Verificar: `node --version` no PowerShell

2. **Pasta do projeto copiada** para pendrive/nuvem
   - Apenas a pasta `maternidade-tjse` é necessária
   - Tamanho: ~50MB

---

## 🚀 INSTALAÇÃO RÁPIDA (3 MINUTOS)

### Opção A: Instalador Automático (Recomendado)

1. **Copie a pasta** `maternidade-tjse` para o PC do cartório
   ```
   C:\Automacao\maternidade-tjse
   ```

2. **Execute o instalador**
   - Clique duplo em: `INSTALAR-MODULAR.bat`
   - Escolha opção **[1] Maternidade TJSE**
   - Aguarde instalação (1-2 minutos)

3. **Pronto!** Um atalho será criado na área de trabalho

### Opção B: Instalação Manual

```powershell
# 1. Abrir PowerShell na pasta
cd C:\Automacao\maternidade-tjse

# 2. Instalar dependências
npm install

# 3. Testar
npm start
```

---

## 📁 ESTRUTURA NECESSÁRIA

Copie **APENAS** esta pasta para o cartório:

```
📁 maternidade-tjse/
   ├── 📄 package.json
   ├── 📄 iniciar-maternidade.bat     ← Atalho principal
   ├── 📄 iniciar-windows.bat         ← Startup automático
   ├── 📁 src/
   │   ├── electron-main.js
   │   ├── simple-start.js
   │   ├── launchChrome.js
   │   └── config.js
   ├── 📁 icons/
   │   └── maternidade-ok.ico
   └── 📄 README.md
```

**NÃO É NECESSÁRIO:**
- ❌ Backend
- ❌ CRC Nacional
- ❌ Banco de dados PostgreSQL

---

## ⚙️ CONFIGURAÇÕES PÓS-INSTALAÇÃO

### 1. Inicialização Automática (Opcional)

Para iniciar automaticamente com o Windows:

```batch
# Execute uma vez:
maternidade-tjse\iniciar-windows.bat
```

Isso cria uma tarefa no Agendador do Windows.

### 2. Verificar Funcionamento

- ✅ Ícone na bandeja (🏥 verde = OK)
- ✅ Chrome abre automaticamente
- ✅ Sistema TJSE carrega

### 3. Atalhos de Teclado

Funcionam **dentro do Chrome**:
- `Ctrl + Shift + M` → Foco no Chrome da Maternidade
- `F5` → Recarregar página
- `Alt + F4` → Fechar

---

## 🐛 TROUBLESHOOTING

### Problema: "npm não é reconhecido"

**Solução:** Instalar Node.js
1. Baixar: https://nodejs.org/dist/v18.20.0/node-v18.20.0-x64.msi
2. Executar instalador (Next, Next, Finish)
3. Reiniciar PowerShell
4. Testar: `node --version`

### Problema: "Erro ao instalar dependências"

**Solução:** Executar como Administrador
1. Botão direito em `iniciar-maternidade.bat`
2. "Executar como Administrador"

### Problema: Chrome não abre

**Solução:** Verificar caminho do Chrome
Edite `src/config.js`:
```javascript
CHROME_PATH: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
```

Caminhos comuns:
- `C:\Program Files\Google\Chrome\Application\chrome.exe`
- `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`

### Problema: Ícone não aparece na bandeja

**Solução:** Verificar ícone
1. Certifique-se que `icons\maternidade-ok.ico` existe
2. Se não existir, o app funciona mesmo sem ícone

---

## 📊 CHECKLIST DE INSTALAÇÃO

Use este checklist no cartório:

- [ ] Node.js instalado (verificar: `node --version`)
- [ ] Pasta `maternidade-tjse` copiada para `C:\Automacao\`
- [ ] Executado `npm install` (ou instalador automático)
- [ ] Testado `npm start` → Chrome abre
- [ ] Atalho criado na área de trabalho
- [ ] (Opcional) Configurado inicialização automática
- [ ] Testado reiniciar PC → App inicia sozinho

---

## 🔄 ATUALIZAÇÃO FUTURA

Para atualizar a Maternidade:

1. **Baixar nova versão** da pasta `maternidade-tjse`
2. **Substituir arquivos** (manter `node_modules`)
3. **Reiniciar** o app

Ou execute:
```powershell
cd C:\Automacao\maternidade-tjse
git pull  # Se usar Git
npm install  # Atualizar dependências se mudaram
```

---

## 📞 SUPORTE

Se algo der errado:

1. **Verificar logs:**
   - Abrir Developer Tools: `Ctrl + Shift + I` no Chrome
   - Procurar mensagens de erro (vermelho)

2. **Testar manualmente:**
   ```powershell
   cd C:\Automacao\maternidade-tjse
   npm start
   ```

3. **Enviar informações:**
   - Print do erro
   - Versão do Node.js: `node --version`
   - Sistema operacional: Windows 10/11

---

## 🎯 RESUMO EXECUTIVO

**Tempo total:** 3-5 minutos por PC

**Passos:**
1. Copiar pasta `maternidade-tjse` (30 seg)
2. Executar `INSTALAR-MODULAR.bat` → Opção 1 (2 min)
3. Testar atalho na área de trabalho (30 seg)
4. Configurar startup automático (opcional - 1 min)

**Resultado:**
- ✅ App funciona standalone (sem backend)
- ✅ Inicia com Windows (se configurado)
- ✅ Ícone na bandeja
- ✅ Chrome abre automaticamente no TJSE

---

## 📌 NOTAS IMPORTANTES

⚠️ **A Maternidade funciona INDEPENDENTE** do Backend e CRC
- Não precisa de PostgreSQL
- Não precisa de servidor Express
- Não precisa de internet (apenas para acessar TJSE)

✅ **É totalmente standalone** → Perfeito para instalação rápida em cartórios

🔐 **Credenciais do TJSE** → Cada cartório usa as próprias

📅 **Atualização manual** → Copiar nova versão quando necessário
