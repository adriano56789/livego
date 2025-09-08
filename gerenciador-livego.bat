@echo off
setlocal EnableDelayedExpansion

:menu
cls
echo.
echo ==========================================
echo          LIVEGO - GERENCIADOR
echo ==========================================
echo.
echo 1. Iniciar serviços básicos (MongoDB + API)
echo 2. Iniciar serviços simples (+ LiveKit)
echo 3. Iniciar serviços completos (+ SRS)
echo 4. Parar todos os serviços
echo 5. Ver status dos serviços
echo 6. Ver logs em tempo real
echo 7. Reconstruir e iniciar
echo 8. Sair
echo.
set /p opcao="Escolha uma opção (1-8): "

if "%opcao%"=="1" goto basico
if "%opcao%"=="2" goto simples
if "%opcao%"=="3" goto completo
if "%opcao%"=="4" goto parar
if "%opcao%"=="5" goto status
if "%opcao%"=="6" goto logs
if "%opcao%"=="7" goto rebuild
if "%opcao%"=="8" goto sair

echo Opção inválida! Pressione qualquer tecla para tentar novamente.
pause >nul
goto menu

:basico
echo.
echo [INFO] Iniciando serviços básicos...
call iniciar-servicos.bat
pause
goto menu

:simples
echo.
echo [INFO] Iniciando serviços simples...
powershell -ExecutionPolicy Bypass -File iniciar-servicos.ps1 -Profile simples
pause
goto menu

:completo
echo.
echo [INFO] Iniciando serviços completos...
powershell -ExecutionPolicy Bypass -File iniciar-servicos.ps1 -Profile completo
pause
goto menu

:parar
echo.
echo [INFO] Parando todos os serviços...
docker compose down >nul 2>&1
docker compose -f docker-compose-basic.yml down >nul 2>&1
docker compose -f docker-compose-simple.yml down >nul 2>&1
echo [SUCESSO] Serviços parados!
pause
goto menu

:status
echo.
echo ==========================================
echo           STATUS DOS SERVIÇOS
echo ==========================================
docker ps
echo.
echo Containers do LiveGo:
docker ps --filter "name=livego" --filter "name=mongodb" --filter "name=livekit" --filter "name=srs"
pause
goto menu

:logs
echo.
echo [INFO] Qual serviço você quer ver os logs?
echo 1. Todos
echo 2. API Backend
echo 3. MongoDB
echo 4. LiveKit
echo 5. SRS
echo.
set /p log_opcao="Escolha (1-5): "

if "%log_opcao%"=="1" docker compose logs -f
if "%log_opcao%"=="2" docker compose logs -f api
if "%log_opcao%"=="3" docker compose logs -f mongodb
if "%log_opcao%"=="4" docker compose logs -f livekit
if "%log_opcao%"=="5" docker compose logs -f srs

pause
goto menu

:rebuild
echo.
echo [INFO] Qual perfil reconstruir?
echo 1. Básico
echo 2. Simples  
echo 3. Completo
echo.
set /p rebuild_opcao="Escolha (1-3): "

if "%rebuild_opcao%"=="1" powershell -ExecutionPolicy Bypass -File iniciar-servicos.ps1 -Profile basico -Rebuild
if "%rebuild_opcao%"=="2" powershell -ExecutionPolicy Bypass -File iniciar-servicos.ps1 -Profile simples -Rebuild
if "%rebuild_opcao%"=="3" powershell -ExecutionPolicy Bypass -File iniciar-servicos.ps1 -Profile completo -Rebuild

pause
goto menu

:sair
echo.
echo Saindo do gerenciador do LiveGo...
exit /b 0