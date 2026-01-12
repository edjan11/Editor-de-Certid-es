@echo off
REM ============================================
REM INICIALIZADOR DO BACKEND CRC/TJSE
REM ============================================

echo.
echo ========================================
echo  BACKEND CRC/TJSE - Sistema Centralizado
echo ========================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Instale Node.js: https://nodejs.org
    pause
    exit /b 1
)

REM Verificar versão do Node
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% detectado
echo.

REM Verificar se .env existe
if not exist ".env" (
    echo [AVISO] Arquivo .env nao encontrado
    echo.
    echo Copiando .env.example para .env...
    copy .env.example .env >nul
    echo.
    echo [IMPORTANTE] Edite o arquivo .env e configure DATABASE_URL
    echo.
    echo Abrir .env agora? [S/N]
    choice /c SN /n
    if errorlevel 2 goto skip_edit
    notepad .env
    :skip_edit
    echo.
)

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo [INSTALANDO] Dependencias do projeto...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERRO] Falha na instalacao das dependencias
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas
    echo.
)

REM Iniciar servidor
echo ========================================
echo  INICIANDO SERVIDOR...
echo ========================================
echo.
echo Backend rodando em: http://localhost:3100
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

npm run dev
