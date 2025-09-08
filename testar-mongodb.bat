@echo off
REM Script para testar conexão com MongoDB do LiveGo

echo.
echo ========================================
echo    TESTE DE CONEXAO COM MONGODB
echo ========================================
echo.

REM Verificar se o Node.js está instalado
echo [INFO] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado!
    echo [INFO] Instalando dependencias via Docker...
    goto docker_test
)

echo [SUCESSO] Node.js encontrado

REM Verificar se as dependências estão instaladas
echo [INFO] Verificando dependencias...
if not exist "node_modules\mongodb" (
    echo [INFO] Instalando dependencia mongodb...
    npm install mongodb
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias
        echo [INFO] Tentando teste via Docker...
        goto docker_test
    )
)

echo [SUCESSO] Dependencias verificadas

REM Executar teste com Node.js local
echo.
echo [INFO] Executando teste de conexao...
node testar-mongodb.js
if errorlevel 1 (
    echo.
    echo [ERRO] Teste falhou! Tentando via Docker...
    goto docker_test
)

echo.
echo [SUCESSO] Teste concluido com sucesso!
goto end

:docker_test
echo.
echo [INFO] Executando teste via Docker...
REM Criar um container temporário para testar
docker run --rm --network livego-1_livego-network -v "%cd%":/app -w /app node:18-alpine sh -c "npm install mongodb && node testar-mongodb.js"

if errorlevel 1 (
    echo [ERRO] Teste via Docker tambem falhou!
    echo.
    echo [INFO] Verificacoes sugeridas:
    echo 1. Execute: docker compose -f docker-compose-basic.yml up -d
    echo 2. Aguarde alguns segundos para o MongoDB inicializar
    echo 3. Execute este script novamente
) else (
    echo [SUCESSO] Teste via Docker concluido!
)

:end
echo.
echo Pressione qualquer tecla para sair...
pause >nul