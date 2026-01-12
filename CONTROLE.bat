@echo off
title Centralizador - Controle
cd /d "%~dp0"

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo 📦 Instalando dependências pela primeira vez...
    call npm install
    if errorlevel 1 (
        echo ❌ Erro na instalação!
        pause
        exit /b 1
    )
)

echo 🚀 Iniciando Centralizador...
npm start
