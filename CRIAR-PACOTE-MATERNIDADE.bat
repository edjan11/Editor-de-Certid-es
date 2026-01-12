@echo off
chcp 65001 >nul
color 0E
title 📦 EMPACOTAR MATERNIDADE PARA CARTÓRIOS

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║        CRIAR PACOTE STANDALONE DA MATERNIDADE              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set "DESTINO=%USERPROFILE%\Desktop\Maternidade-Standalone"
set "ORIGEM=%~dp0maternidade-tjse"

echo 📁 Origem: %ORIGEM%
echo 📦 Destino: %DESTINO%
echo.
echo [1/4] 🗑️ Limpando pasta destino...

if exist "%DESTINO%" (
    rd /s /q "%DESTINO%"
)
mkdir "%DESTINO%"

echo [2/4] 📋 Copiando arquivos essenciais...

REM Criar estrutura de pastas
mkdir "%DESTINO%\src"
mkdir "%DESTINO%\icons"

REM Copiar arquivos principais
copy "%ORIGEM%\package.json" "%DESTINO%\" >nul
copy "%ORIGEM%\iniciar-maternidade.bat" "%DESTINO%\" >nul
copy "%ORIGEM%\iniciar-windows.bat" "%DESTINO%\" >nul
copy "%ORIGEM%\INICIAR-COM-WINDOWS.md" "%DESTINO%\" >nul
copy "%ORIGEM%\README.md" "%DESTINO%\" >nul
copy "%ORIGEM%\LEIA-ME-PRIMEIRO.txt" "%DESTINO%\" >nul

REM Copiar pasta src
xcopy "%ORIGEM%\src\*" "%DESTINO%\src\" /E /I /Y >nul

REM Copiar ícones
xcopy "%ORIGEM%\icons\*" "%DESTINO%\icons\" /E /I /Y >nul

echo [3/4] 📝 Criando guia de instalação...

(
echo ╔════════════════════════════════════════════════════════════╗
echo ║       INSTALAÇÃO RÁPIDA - MATERNIDADE TJSE                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🚀 PASSO 1: Instalar Node.js
echo    └─ Se ainda não tiver, baixe em: https://nodejs.org
echo.
echo 🚀 PASSO 2: Copiar esta pasta para o PC do cartório
echo    └─ Sugestão: C:\Automacao\maternidade-tjse\
echo.
echo 🚀 PASSO 3: Executar iniciar-maternidade.bat
echo    └─ Clique duplo no arquivo
echo    └─ Aguarde instalação automática ^(1-2 min^)
echo.
echo 🚀 PASSO 4: Configurar startup automático ^(opcional^)
echo    └─ Executar: iniciar-windows.bat
echo.
echo ✅ PRONTO! O Chrome abrirá automaticamente.
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 💡 DICAS:
echo    • Não precisa de backend/banco de dados
echo    • Funciona offline ^(só precisa internet para TJSE^)
echo    • Cada cartório usa suas próprias credenciais
echo.
echo 🐛 PROBLEMAS?
echo    Leia: README.md ou README-INSTALACAO-CARTORIO.md
echo.
) > "%DESTINO%\INSTALACAO-RAPIDA.txt"

REM Copiar documentação adicional
copy "%~dp0README-INSTALACAO-CARTORIO.md" "%DESTINO%\" >nul

echo [4/4] 📦 Criando arquivo README de instalação...

(
echo # 🏥 MATERNIDADE TJSE - PACOTE STANDALONE
echo.
echo ## ✅ O QUE ESTÁ INCLUÍDO
echo.
echo - ✅ Código completo da Maternidade
echo - ✅ Scripts de inicialização
echo - ✅ Configuração de startup automático
echo - ✅ Documentação completa
echo - ✅ Ícones
echo.
echo ## ❌ O QUE NÃO ESTÁ INCLUÍDO ^(NÃO É NECESSÁRIO^)
echo.
echo - ❌ node_modules ^(será instalado automaticamente^)
echo - ❌ Backend
echo - ❌ Banco de dados
echo - ❌ CRC Nacional
echo.
echo ## 🚀 INSTALAÇÃO EM 3 PASSOS
echo.
echo ### 1. Verificar Node.js
echo ```powershell
echo node --version
echo # Se não existir, instalar de: https://nodejs.org
echo ```
echo.
echo ### 2. Copiar pasta para o cartório
echo ```
echo C:\Automacao\maternidade-tjse\
echo ```
echo.
echo ### 3. Executar
echo ```batch
echo iniciar-maternidade.bat
echo ```
echo.
echo ## 📚 DOCUMENTAÇÃO
echo.
echo - `LEIA-ME-PRIMEIRO.txt` - Guia visual rápido
echo - `INSTALACAO-RAPIDA.txt` - Passo a passo resumido
echo - `README-INSTALACAO-CARTORIO.md` - Documentação completa
echo - `INICIAR-COM-WINDOWS.md` - Startup automático
echo.
echo ## 🎯 RESULTADO
echo.
echo Após instalação:
echo - ✅ Chrome abre automaticamente
echo - ✅ Ícone 🏥 na bandeja
echo - ✅ Sistema TJSE carregado
echo - ✅ ^(Opcional^) Inicia com Windows
echo.
echo ## 📞 SUPORTE
echo.
echo Em caso de problemas, consulte `README-INSTALACAO-CARTORIO.md`
) > "%DESTINO%\README-STANDALONE.md"

echo.
echo ✅ PACOTE CRIADO COM SUCESSO!
echo.
echo 📁 Localização: %DESTINO%
echo.
echo 📋 Arquivos incluídos:
dir /b "%DESTINO%"
echo.
echo 💡 PRÓXIMOS PASSOS:
echo    1. Copie a pasta "%DESTINO%" para pendrive/nuvem
echo    2. Leve para o cartório
echo    3. Siga as instruções em LEIA-ME-PRIMEIRO.txt
echo.
pause
