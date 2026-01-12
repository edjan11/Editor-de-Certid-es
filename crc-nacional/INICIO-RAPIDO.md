# 🚀 INÍCIO RÁPIDO - CRC Nacional

## 📦 1. Instalar (apenas uma vez):

```powershell
cd C:\Users\Pichau\Desktop\Projetos\Centralizador\crc-nacional
npm install
```

---

## ▶️ 2. Iniciar Sistema:

### Opção A - Arquivo .bat (MAIS FÁCIL):
Clique duplo em: `iniciar-crc.bat`

### Opção B - Terminal:
```powershell
npm start
```

---

## ✅ 3. O que vai acontecer:

1. 🔷 **Ícone aparece** na bandeja do Windows (canto inferior direito)
2. 🌐 **Chrome abre** automaticamente na página do CRC Nacional
3. 🔑 **Faça login** com suas credenciais + autenticação 2FA
4. ⚡ **Sistema mantém** sua sessão ativa automaticamente (08h-17h)
5. 🎯 **Scripts funcionam** automaticamente (Ctrl+Q, Ctrl+B, Ctrl+Y)

---

## 🎨 4. Usar o Painel:

- **Duplo clique** no ícone da bandeja → Abre painel visual
- **Clique direito** → Menu com opções rápidas

### Botões do Painel:
- 🔍 **Buscar Registro** - Abre busca de registros
- 📄 **Buscar CPF** - Consulta CPF na Receita Federal
- 🏷️ **Selo Digital** - Abre sistema de selo TJSE
- 🔄 **Refresh Manual** - Atualiza sessão manualmente

---

## ⌨️ 5. Atalhos de Teclado:

| Tecla | Ação |
|-------|------|
| `Ctrl+Q` | Aciona botão "Imprimir" |
| `Ctrl+B` | Abre busca de registro |
| `Ctrl+Y` | Abre selo TJSE |

**Funcionam automaticamente** em qualquer página do CRC!

---

## 🔄 6. Keep-Alive Automático:

```
📅 Das 08:00 às 17:00
⏱️ Refresh a cada 5 minutos
🔄 Mantém sessão ativa sem você fazer nada
```

**Você só precisa fazer login UMA VEZ por dia!**

---

## 🛑 7. Parar o Sistema:

- **Clique direito** no ícone da bandeja
- Clique em **"Sair"**

Ou pelo terminal:
```powershell
Stop-Process -Name electron -Force
```

---

## ⚙️ 8. Configurar (Opcional):

Edite `src/config.js` para alterar:

```javascript
refreshInterval: 5,     // Minutos entre refresh (padrão: 5)
horarioInicio: 8,       // Horário início (padrão: 08h)
horarioFim: 17,         // Horário fim (padrão: 17h)
chromeProfile: 'Default' // Perfil do Chrome
```

---

## 📊 9. Verificar Status:

### Pelo Painel:
- **Status da Sessão:** 🟢 Ativa / 🔴 Inativa
- **Último Refresh:** Horário da última atualização
- **Horário de Funcionamento:** 08:00 - 17:00

### Pelo Terminal:
Logs aparecem automaticamente mostrando:
- ✅ Refresh bem-sucedido
- ⚠️ Avisos de timeout
- ❌ Erros de conexão

---

## 🎯 10. Fluxo de Trabalho Ideal:

```
1. ▶️  Iniciar sistema (início do dia)
2. 🔑 Fazer login no CRC (2FA)
3. 💼 Trabalhar normalmente
4. ⌨️  Usar atalhos quando necessário
5. 🎉 Sistema mantém tudo funcionando
6. 🛑 Sair ao fim do expediente
```

---

## 💡 Dicas:

✅ **Deixe o Chrome aberto** - O sistema precisa dele rodando  
✅ **Não feche a aba do CRC** - Sistema usa ela para refresh  
✅ **Use os atalhos** - Ctrl+B, Ctrl+Q, Ctrl+Y agilizam muito  
✅ **Verifique o ícone** - Mostra se está tudo funcionando  

---

## 🆘 Problemas Comuns:

### ❌ "Sessão expirada"
→ Faça login novamente no Chrome  
→ Reduza o intervalo de refresh em `config.js`

### ❌ "Scripts não funcionam"
→ Certifique-se de que abriu pelo sistema  
→ Recarregue a página (F5)

### ❌ "Ícone não aparece"
→ Verifique a bandeja do Windows (seta para cima)  
→ Adicione um ícone `.ico` na pasta `icons/`

---

**🎉 Pronto! Agora é só usar. O sistema cuida do resto!**

---

## 📞 Resumo dos Comandos:

```powershell
# Instalar (uma vez)
npm install

# Iniciar
npm start

# Parar
Stop-Process -Name electron -Force
```

---

**Desenvolvido para Edjan Santos Melo**  
Mantém CRC Nacional ativo automaticamente 🏛️
