@echo off
REM Script para parar todos os serviços do LiveGo

echo.
echo ========================================
echo     Parando Serviços do LiveGo
echo ========================================
echo.

echo [INFO] Parando todos os serviços do LiveGo...

REM Parar todos os possíveis containers
docker compose down >nul 2>&1
docker compose -f docker-compose-basic.yml down >nul 2>&1
docker compose -f docker-compose-simple.yml down >nul 2>&1

echo [SUCESSO] Todos os serviços foram parados!

echo.
echo [INFO] Status atual dos containers:
docker ps

echo.
echo Pressione qualquer tecla para sair...
pause >nul