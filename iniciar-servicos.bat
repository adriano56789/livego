@echo off
REM Script simples para iniciar todos os serviços do LiveGo
REM Criado para usuários que preferem arquivos .bat

setlocal EnableDelayedExpansion

echo.
echo ========================================
echo    Iniciando Serviços do LiveGo
echo ========================================
echo.

REM Verificar se o Docker está rodando
echo [INFO] Verificando Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker não está rodando! Por favor, inicie o Docker Desktop.
    pause
    exit /b 1
)
echo [SUCESSO] Docker está funcionando

REM Parar serviços existentes
echo.
echo [INFO] Parando serviços existentes...
docker compose down >nul 2>&1
docker compose -f docker-compose-basic.yml down >nul 2>&1
docker compose -f docker-compose-simple.yml down >nul 2>&1
echo [SUCESSO] Serviços existentes parados

REM Escolher perfil
echo.
echo Escolha o perfil de serviços:
echo 1. Básico (MongoDB + Backend API)
echo 2. Simples (MongoDB + Backend + LiveKit)
echo 3. Completo (Todos os serviços)
echo.
set /p opcao="Digite sua opcao (1-3) [padrão: 1]: "

if "%opcao%"=="" set opcao=1
if "%opcao%"=="1" (
    set COMPOSE_FILE=docker-compose-basic.yml
    set PROFILE_NAME=Básico
)
if "%opcao%"=="2" (
    set COMPOSE_FILE=docker-compose-simple.yml
    set PROFILE_NAME=Simples
)
if "%opcao%"=="3" (
    set COMPOSE_FILE=docker-compose.yml
    set PROFILE_NAME=Completo
)

echo.
echo [INFO] Usando perfil: !PROFILE_NAME!
echo [INFO] Arquivo de configuração: !COMPOSE_FILE!

REM Verificar se o arquivo existe
if not exist "!COMPOSE_FILE!" (
    echo [ERRO] Arquivo de configuração '!COMPOSE_FILE!' não encontrado!
    pause
    exit /b 1
)

REM Construir imagens se necessário
echo.
echo [INFO] Construindo imagens Docker se necessário...
docker compose -f "!COMPOSE_FILE!" build
if errorlevel 1 (
    echo [AVISO] Possível erro ao construir imagens
)

REM Iniciar serviços
echo.
echo [INFO] Iniciando serviços...
docker compose -f "!COMPOSE_FILE!" up -d
if errorlevel 1 (
    echo [ERRO] Falha ao iniciar serviços!
    echo [INFO] Verificando logs...
    docker compose -f "!COMPOSE_FILE!" logs --tail=20
    pause
    exit /b 1
)

echo [SUCESSO] Serviços iniciados com sucesso!

REM Aguardar um pouco e verificar status
echo.
echo [INFO] Aguardando serviços iniciarem...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo         Status dos Serviços
echo ========================================
docker compose -f "!COMPOSE_FILE!" ps

echo.
echo ========================================
echo         URLs dos Serviços
echo ========================================
echo • API Backend: http://localhost:3000
echo • API Health Check: http://localhost:3000/api/health
echo • MongoDB: mongodb://localhost:27017
echo • WebSocket: ws://localhost:3000

if "%opcao%" NEQ "1" (
    echo • LiveKit: ws://localhost:7880
)

if "%opcao%"=="3" (
    echo • SRS RTMP: rtmp://localhost:1935
    echo • SRS HTTP API: http://localhost:1985
    echo • SRS HLS: http://localhost:8080
)

echo.
echo ========================================
echo         Comandos Úteis
echo ========================================
echo • Parar serviços: docker compose -f !COMPOSE_FILE! down
echo • Ver logs: docker compose -f !COMPOSE_FILE! logs -f
echo • Ver status: docker compose -f !COMPOSE_FILE! ps
echo • Reiniciar: execute este script novamente

echo.
echo [SUCESSO] Inicialização completa!
echo.

REM Perguntar se quer ver logs
set /p ver_logs="Deseja ver os logs em tempo real? (s/N): "
if /i "%ver_logs%"=="s" (
    echo.
    echo [INFO] Mostrando logs... Pressione Ctrl+C para parar
    docker compose -f "!COMPOSE_FILE!" logs -f
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul