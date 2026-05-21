#!/bin/bash

# Script de Inicialização - App de Cardápio para Café
# Use: bash setup.sh (em Linux/Mac) ou setup.bat (em Windows)

echo "=========================================="
echo "☕ Setup - App de Cardápio para Café"
echo "=========================================="
echo ""

# 1. Verificar se Node.js está instalado
echo "✓ Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale em https://nodejs.org"
    exit 1
fi
echo "✓ Node.js encontrado: $(node -v)"
echo ""

# 2. Instalar dependências backend
echo "✓ Instalando dependências do backend..."
cd cafe-app-backend
npm install
cd ..
echo "✓ Dependências instaladas"
echo ""

# 3. Instruções para configurar PostgreSQL
echo "=========================================="
echo "⚠️  PRÓXIMO PASSO: Configurar PostgreSQL"
echo "=========================================="
echo ""
echo "Execute os comandos abaixo no PostgreSQL:"
echo ""
echo "1. Conecte ao PostgreSQL:"
echo "   psql -U postgres"
echo ""
echo "2. Crie o banco de dados:"
echo "   CREATE DATABASE cafe_app;"
echo ""
echo "3. Execute o script SQL:"
echo "   psql -U postgres -d cafe_app -f SETUP_DATABASE.sql"
echo ""
echo "4. Ou copie e cole o conteúdo de SETUP_DATABASE.sql"
echo "   na ferramenta pgAdmin"
echo ""
echo "=========================================="
echo ""
echo "✓ Setup preparado!"
echo ""
echo "Para iniciar:"
echo "  1. Configure o PostgreSQL (veja acima)"
echo "  2. cd cafe-app-backend"
echo "  3. npm start"
echo ""
echo "Acesse:"
echo "  - Cliente:   file://C:/Users/lucas/Desktop/Projetos/café/frontend-cliente.html"
echo "  - Atendente: file://C:/Users/lucas/Desktop/Projetos/café/frontend-atendente.html"
echo ""
