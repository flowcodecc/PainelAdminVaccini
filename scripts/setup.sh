#!/bin/bash

echo "🚀 Configurando ambiente para importação de convênios..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Instale Node.js primeiro."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado. Instale npm primeiro."
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install csv-parser @supabase/supabase-js

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
else
    echo "❌ Erro ao instalar dependências."
    exit 1
fi

# Verificar se os arquivos CSV existem
echo ""
echo "📋 Verificando arquivos CSV..."

if [ -f "convenios_precos.csv" ]; then
    echo "✅ convenios_precos.csv encontrado"
else
    echo "⚠️  convenios_precos.csv não encontrado - coloque na pasta scripts/"
fi

if [ -f "convenios_unidades.csv" ]; then
    echo "✅ convenios_unidades.csv encontrado"
else
    echo "⚠️  convenios_unidades.csv não encontrado - coloque na pasta scripts/"
fi

# Verificar se o arquivo de configuração existe
if [ -f "config.js" ]; then
    echo "✅ config.js encontrado"
else
    echo "❌ config.js não encontrado - configure as credenciais do Supabase"
    exit 1
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Coloque os arquivos CSV na pasta scripts/ (se ainda não colocou)"
echo "   2. Execute: node test-connection.js"
echo "   3. Execute: node test-mapping.js (opcional)"
echo "   4. Execute: node import-convenios.js"
echo "   5. Execute: node verify-import.js"
echo ""
echo "🚀 Pronto para importar os convênios!"
