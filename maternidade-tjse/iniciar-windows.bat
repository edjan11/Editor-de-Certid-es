@echo off
REM ========================================
REM   Monitor Maternidade TJSE - RCPN
REM   Inicializacao Automatica Windows
REM ========================================

cd /d "%~dp0"

echo Iniciando Monitor Maternidade TJSE em segundo plano...

REM Inicia o Electron em modo silencioso
start /min "" npm start

REM Aguarda 3 segundos para garantir que iniciou
timeout /t 3 /nobreak >nul

echo Monitor iniciado com sucesso!
echo Verifique o icone na bandeja do sistema (canto inferior direito).

REM Fecha esta janela automaticamente
exit
