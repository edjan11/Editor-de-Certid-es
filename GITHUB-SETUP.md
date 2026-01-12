# 🚀 GUIA DE PUBLICAÇÃO NO GITHUB

## 📋 Checklist Antes de Publicar

- [x] Código limpo e refatorado
- [x] Monitor real de processos implementado
- [x] Interface gráfica funcional
- [x] Documentação atualizada
- [x] .gitignore configurado
- [x] LICENSE criada (MIT)
- [x] README.md profissional

## 🔧 Passos para Publicar

### 1. Criar Repositório no GitHub

1. Acesse https://github.com/new
2. Nome: `centralizador-cartorios` (ou similar)
3. Descrição: "Sistema centralizado de automação para cartórios com monitoramento real"
4. Público ou Privado: Escolha conforme necessidade
5. **NÃO** inicialize com README (já temos)
6. Clique em "Create repository"

### 2. Configurar Git Local

```bash
cd "C:\Users\Pichau\Desktop\Projetos\Centralizador"

# Inicializar repositório
git init

# Adicionar remote (SUBSTITUA SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/centralizador-cartorios.git

# Verificar
git remote -v
```

### 3. Primeiro Commit

```bash
# Adicionar todos os arquivos
git add .

# Verificar o que será commitado
git status

# Fazer primeiro commit
git commit -m "🎉 Initial commit - Sistema completo com monitor real"

# Configurar branch principal
git branch -M main
```

### 4. Push para GitHub

```bash
# Enviar código
git push -u origin main
```

### 5. Verificar no GitHub

Acesse: `https://github.com/SEU-USUARIO/centralizador-cartorios`

Deve aparecer:
- ✅ README.md renderizado
- ✅ 13 arquivos na raiz
- ✅ 3 pastas (backend, crc-nacional, maternidade-tjse)
- ✅ LICENSE
- ✅ .gitignore

## 📁 O Que Será Enviado

### Arquivos Raiz:
```
✅ CONTROLE.bat
✅ main.js
✅ monitor.js (NOVO - Monitor real)
✅ controle.html
✅ package.json
✅ README.md (atualizado)
✅ START.md
✅ README-INSTALACAO-CARTORIO.md
✅ CRIAR-PACOTE-MATERNIDADE.bat
✅ LICENSE
✅ .gitignore
```

### Pastas:
```
✅ backend/ (completo)
✅ crc-nacional/ (completo)
✅ maternidade-tjse/ (completo)
```

### O Que NÃO Será Enviado:
```
❌ node_modules/ (no .gitignore)
❌ package-lock.json (no .gitignore)
❌ .env (no .gitignore)
❌ *.log (no .gitignore)
```

## 🎨 Melhorar Repositório (Opcional)

### Adicionar Badges

No README.md, as badges já estão incluídas:
- License MIT
- Node.js 18+
- Electron 28+

### Adicionar Topics

No GitHub, clique em "⚙️ Settings" → "Topics" e adicione:
- `automation`
- `electron`
- `nodejs`
- `windows`
- `cartorio`
- `registry`
- `process-monitor`

### Adicionar Screenshot

1. Tire print da interface do CONTROLE
2. Salve como `screenshot.png` na raiz
3. Adicione no README.md:

```markdown
## 🖼️ Interface

![Screenshot](screenshot.png)
```

Commit:
```bash
git add screenshot.png README.md
git commit -m "📸 Adiciona screenshot da interface"
git push
```

## 🔐 Segurança

**ATENÇÃO:** Antes de fazer push, verifique:

```bash
# Procurar por credenciais
git grep -i "password"
git grep -i "secret"
git grep -i "token"

# Verificar .env não está sendo commitado
git status
```

Se encontrar algo sensível:
1. Remova do código
2. Use variáveis de ambiente
3. Adicione ao .gitignore

## 📝 Commits Futuros

Use commits semânticos:

```bash
# Feature nova
git commit -m "✨ feat: Adiciona verificação de porta do Backend"

# Bug fix
git commit -m "🐛 fix: Corrige monitoramento do Chrome"

# Documentação
git commit -m "📝 docs: Atualiza guia de instalação"

# Refatoração
git commit -m "♻️ refactor: Simplifica lógica do monitor"

# Performance
git commit -m "⚡️ perf: Reduz intervalo de verificação para 15s"
```

## 🌿 Branches

Para desenvolver features:

```bash
# Criar branch
git checkout -b feature/nova-funcionalidade

# Fazer alterações
git add .
git commit -m "feat: Nova funcionalidade"

# Push da branch
git push origin feature/nova-funcionalidade

# No GitHub, criar Pull Request
```

## 🚀 Deploy/Release

Para criar release:

```bash
# Criar tag
git tag -a v1.0.0 -m "Release v1.0.0 - Sistema completo"

# Push da tag
git push origin v1.0.0
```

No GitHub:
1. Vá em "Releases"
2. "Draft a new release"
3. Escolha a tag v1.0.0
4. Adicione release notes
5. Anexe binários (opcional)

## ✅ Verificação Final

Antes de publicar, teste:

```bash
# Clone em pasta temporária
cd C:\temp
git clone https://github.com/SEU-USUARIO/centralizador-cartorios.git
cd centralizador-cartorios

# Instalar e testar
npm install
npm start

# Deve funcionar perfeitamente!
```

## 📞 Suporte

Após publicar:
- Configure GitHub Issues
- Adicione CONTRIBUTING.md (opcional)
- Configure GitHub Actions para CI/CD (opcional)

---

**Pronto para publicar!** 🎉

Execute os comandos do passo 2-4 e seu código estará no GitHub!
