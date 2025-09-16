@echo off
echo 🚀 Configurando ambiente para importação de convênios...
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não está instalado. Instale Node.js primeiro.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
node --version

REM Verificar se npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm não está instalado. Instale npm primeiro.
    pause
    exit /b 1
)

echo ✅ npm encontrado
npm --version

REM Instalar dependências
echo.
echo 📦 Instalando dependências...
npm install csv-parser @supabase/supabase-js

if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências.
    pause
    exit /b 1
)

echo ✅ Dependências instaladas com sucesso!

REM Verificar se os arquivos CSV existem
echo.
echo 📋 Verificando arquivos CSV...

if exist "convenios_precos.csv" (
    echo ✅ convenios_precos.csv encontrado
) else (
    echo ⚠️  convenios_precos.csv não encontrado - coloque na pasta scripts/
)

if exist "convenios_unidades.csv" (
    echo ✅ convenios_unidades.csv encontrado
) else (
    echo ⚠️  convenios_unidades.csv não encontrado - coloque na pasta scripts/
)

REM Verificar se o arquivo de configuração existe
if exist "config.js" (
    echo ✅ config.js encontrado
) else (
    echo ❌ config.js não encontrado - configure as credenciais do Supabase
    pause
    exit /b 1
)

echo.
echo 🎉 Configuração concluída!
echo.
echo 📋 Próximos passos:
echo    1. Coloque os arquivos CSV na pasta scripts/ (se ainda não colocou)
echo    2. Execute: node test-connection.js
echo    3. Execute: node test-mapping.js (opcional)
echo    4. Execute: node import-convenios.js
echo    5. Execute: node verify-import.js
echo.
echo 🚀 Pronto para importar os convênios!
pause
