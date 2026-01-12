@echo off
chcp 65001 >nul
color 0B
title 🚀 Publicar no GitHub

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              PUBLICAR CENTRALIZADOR NO GITHUB              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar se Git está instalado
where git >nul 2>&1
if errorlevel 1 (
    echo ❌ Git não encontrado!
    echo.
    echo 📥 Baixe e instale: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git encontrado
echo.

REM Perguntar URL do repositório
echo 📋 Crie um repositório no GitHub primeiro:
echo    https://github.com/new
echo.
set /p REPO_URL="Cole a URL do repositório (ex: https://github.com/usuario/repo.git): "

if "%REPO_URL%"=="" (
    echo ❌ URL não pode ser vazia!
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                 INICIALIZANDO REPOSITÓRIO                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Inicializar Git
if not exist ".git" (
    echo [1/6] Inicializando repositório Git...
    git init
) else (
    echo [1/6] Repositório já inicializado
)

REM Adicionar remote
echo [2/6] Configurando remote...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

REM Verificar arquivos
echo [3/6] Verificando arquivos...
git status

REM Adicionar todos os arquivos
echo [4/6] Adicionando arquivos...
git add .

REM Fazer commit
echo [5/6] Criando commit inicial...
git commit -m "🎉 Initial commit - Sistema completo com monitor real de processos"

REM Configurar branch
git branch -M main

REM Push
echo [6/6] Enviando para GitHub...
echo.
echo ⚠️ Você pode precisar fazer login no GitHub
echo.
git push -u origin main

if errorlevel 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║                  ✅ PUBLICADO COM SUCESSO!                 ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo 🌐 Acesse: %REPO_URL:.git=%
    echo.
) else (
    echo.
    echo ❌ Erro ao fazer push
    echo.
    echo 💡 Possíveis soluções:
    echo    1. Verifique suas credenciais do GitHub
    echo    2. Configure Git: git config --global user.name "Seu Nome"
    echo    3. Configure Git: git config --global user.email "seu@email.com"
    echo    4. Use Git Credential Manager
    echo.
)

pause
