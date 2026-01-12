@echo off
title CRC Nacional - Keep Alive
color 0A

echo.
echo ========================================
echo   CRC NACIONAL - KEEP ALIVE ATIVO
echo ========================================
echo.
echo Inicializando sistema...
echo.

cd /d "%~dp0"
start /min "" cmd /c "npm start"

timeout /t 3 /nobreak >nul
exit
