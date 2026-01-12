# 🎛️ Centralizador - Automação de Cartórios

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-28+-blue.svg)](https://www.electronjs.org/)

Sistema centralizado de automação para cartórios com **monitoramento real de processos** e interface gráfica moderna.

## ✨ Características

- 🔍 **Monitoramento Real** - Verifica processos Windows e conexões HTTP a cada 30s
- 🎮 **Interface Gráfica** - Controle visual com status em tempo real
- 🏥 **Maternidade TJSE** - Automação standalone para certidões de nascimento
- 📋 **CRC Nacional** - Sistema de registro civil
- �️ **Backend API** - REST API com PostgreSQL
- 🔄 **Keep-Alive** - Mantém conexões ativas automaticamente
- 📦 **Modular** - Cada módulo funciona independentemente

## 🚀 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/centralizador.git
cd centralizador

# Instale dependências
npm install

# Inicie o controle
npm start
```

Ou simplesmente clique duplo em: **`CONTROLE.bat`**

## 📋 Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Windows** 10/11
- **Chrome** (para módulo Maternidade)
- **PostgreSQL** (opcional, só para Backend)

## 🎮 Como Usar

### Interface Principal

Execute `CONTROLE.bat` e você verá:

```
┌─────────────────────────────────────┐
│  🏥 Maternidade TJSE                │
│  Status: 🟢 Online                  │
│  [Parar]                            │
├─────────────────────────────────────┤
│  📋 CRC Nacional                    │
│  Status: ⚪ Offline                 │
│  [Iniciar]                          │
├─────────────────────────────────────┤
│  🗄️ Backend API                     │
│  Status: 🟢 Online                  │
│  [Parar]                            │
└─────────────────────────────────────┘
   [▶️ Iniciar Tudo]  [⏹️ Parar Tudo]
```

- **Status real** atualizado automaticamente a cada 30 segundos
- **Bolinhas verdes** = módulo realmente ativo e respondendo
- **Bolinhas cinzas** = módulo offline ou sem resposta

### Monitoramento Inteligente

O sistema verifica:

1. **Maternidade**: Processo Chrome + URL do TJSE ativa
2. **CRC**: Processo Electron rodando
3. **Backend**: Endpoint `/health` respondendo em `localhost:3100`

## � Estrutura do Projeto

```
centralizador/
├── CONTROLE.bat              # Atalho principal
├── main.js                   # Electron (gerenciador)
├── monitor.js                # Monitor real de processos
├── controle.html             # Interface gráfica
├── package.json
│
├── maternidade-tjse/         # 🏥 Módulo Maternidade (standalone)
│   ├── iniciar-maternidade.bat
│   ├── src/
│   │   ├── electron-main.js
│   │   ├── launchChrome.js
│   │   └── config.js
│   └── icons/
│
├── crc-nacional/             # 📋 Módulo CRC
│   ├── iniciar-crc.bat
│   └── src/
│
└── backend/                  # 🗄️ API REST
    ├── iniciar-backend.bat
    ├── src/
    │   ├── server.js
    │   ├── database.js
    │   └── schemas.js
    └── database/
```

## 🏥 Instalar Apenas Maternidade (Cartórios)

Para instalar **apenas** o módulo Maternidade em cartórios:

1. **Copie** a pasta `maternidade-tjse/` completa
2. **Cole** no PC do cartório em `C:\Automacao\`
3. **Execute** `iniciar-maternidade.bat`

✅ **Funciona standalone** - não precisa de Backend, CRC ou banco de dados!

## 🔧 Configuração

### Backend (Opcional)

Se for usar o Backend:

```bash
cd backend
cp .env.example .env
# Edite .env com sua string de conexão PostgreSQL
npm install
npm run dev
```

### Maternidade

Edite `maternidade-tjse/src/config.js`:

```javascript
export const config = {
  targetUrl: "https://www.tjse.jus.br/...",
  chromeExePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  chromeProfileDirectory: "Default",
  checkIntervalMinutes: 5
};
```

## � Monitor de Processos

O módulo `monitor.js` implementa verificações reais:

```javascript
// Verifica se processo existe no Windows
await checkProcess('chrome.exe')

// Verifica se URL responde
await checkUrl('http://localhost:3100/health')

// Verifica Chrome com perfil específico
await checkChromeWithProfile()
```

**Intervalo:** 30 segundos (configurável)  
**Timeout:** 5 segundos por requisição  
**Keep-alive:** Ping automático no backend

## 🐛 Troubleshooting

### Módulo não inicia

```bash
cd <pasta-do-modulo>
npm install
```

### Status sempre offline

- Verifique se o processo está realmente rodando no Gerenciador de Tarefas
- Para Backend: teste `curl http://localhost:3100/health`
- Para Maternidade: verifique se Chrome abriu com perfil correto

### "npm não reconhecido"

Instale o Node.js: https://nodejs.org/

## 📄 Licença

MIT - veja [LICENSE](LICENSE) para detalhes

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📞 Suporte

- 📖 Documentação: [START.md](START.md)
- 🏥 Instalação Cartórios: [README-INSTALACAO-CARTORIO.md](README-INSTALACAO-CARTORIO.md)
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/centralizador/issues)

---

**Desenvolvido para otimizar processos de cartórios** 🏛️

## 📁 ESTRUTURA

```
Centralizador/
├── CONTROLE.bat         ← CLIQUE AQUI
├── main.js              ← Electron
├── controle.html        ← Interface
├── package.json         
│
├── maternidade-tjse/    ← Standalone (funciona sozinho)
├── crc-nacional/        ← Requer backend
└── backend/             ← API + PostgreSQL
```

## 🏥 INSTALAR SÓ MATERNIDADE (CARTÓRIOS)

1. Copie **APENAS** a pasta `maternidade-tjse/`
2. Cole no PC do cartório: `C:\Automacao\`
3. Execute: `iniciar-maternidade.bat`
4. Pronto! ✅

Não precisa:
- ❌ Backend
- ❌ Banco de dados
- ❌ CRC Nacional

## 🐛 PROBLEMAS?

**Módulo não inicia:**
- Instale Node.js: https://nodejs.org
- Execute `npm install` na pasta do módulo

**Backend não conecta:**
- Configure `backend/.env` com string PostgreSQL

**Interface não abre:**
- Execute: `npm install` na pasta raiz
- Tente: `npm start`

## 🧹 LIMPEZA FEITA

Removido toda a bagunça:
- ❌ 5+ scripts .bat confusos
- ❌ 10+ documentações obsoletas
- ❌ Menus terminais ruins

Agora:
- ✅ 1 interface gráfica limpa
- ✅ 1 README objetivo
- ✅ Tudo centralizado
