@echo off
REM Script de Inicialização - App de Cardápio para Café (Windows)
REM Use: setup.bat

echo.
echo ==========================================
echo. ☕ Setup - App de Cardápio para Café
echo ==========================================
echo.

REM 1. Verificar Node.js
echo. ✓ Verificando Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo. ❌ Node.js não encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo. ✓ Node.js encontrado: %NODE_VERSION%
echo.

REM 2. Instalar dependências
echo. ✓ Instalando dependências do backend...
cd cafe-app-backend
call npm install
cd ..
echo. ✓ Dependências instaladas
echo.

REM 3. Instruções
echo. ==========================================
echo. ⚠  PRÓXIMO PASSO: Configurar PostgreSQL
echo. ==========================================
echo.
echo. Execute os comandos abaixo no PostgreSQL:
echo.
echo. 1. Conecte ao PostgreSQL:
echo.    psql -U postgres
echo.
echo. 2. Crie o banco de dados:
echo.    CREATE DATABASE cafe_app;
echo.
echo. 3. Execute o script SQL:
echo.    psql -U postgres -d cafe_app -f SETUP_DATABASE.sql
echo.
echo. 4. Ou copie e cole o conteúdo de SETUP_DATABASE.sql
echo.    na ferramenta pgAdmin
echo.
echo. ==========================================
echo.
echo. ✓ Setup preparado!
echo.
echo. Para iniciar:
echo.   1. Configure o PostgreSQL (veja acima)
echo.   2. cd cafe-app-backend
echo.   3. npm start
echo.
echo. Acesse:
echo.   - Cliente:   file:///C:/Users/lucas/Desktop/Projetos/café/frontend-cliente.html
echo.   - Atendente: file:///C:/Users/lucas/Desktop/Projetos/café/frontend-atendente.html
echo.
pause
