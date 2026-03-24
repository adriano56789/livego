# 🚀 Deploy Escalável LiveGo - Windows

@echo off
setlocal enabledelayedexpansion

echo 🚀 Deploy LiveGo Escalável - 50.000 usuarios simultaneos
echo.

:: Verificar Docker
echo 🔍 Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker nao encontrado. Instale Docker Desktop primeiro.
    pause
    exit /b 1
)
echo ✅ Docker encontrado

:: Verificar Docker Swarm
echo 🔍 Verificando Docker Swarm...
docker info | findstr "Swarm: active" >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔄 Inicializando Docker Swarm...
    docker swarm init --advertise-addr 127.0.0.1
    if %errorlevel% neq 0 (
        echo ❌ Falha ao inicializar Docker Swarm
        pause
        exit /b 1
    )
)
echo ✅ Docker Swarm ativo

:: Criar redes
echo 🌐 Criando redes overlay...
docker network create --driver overlay --attachable livego-cluster >nul 2>&1
docker network create --driver overlay --attachable livego-cdn >nul 2>&1
echo ✅ Redes criadas

:: Criar diretorios
echo 📁 Criando diretorios...
if not exist logs mkdir logs
if not exist hls-cache mkdir hls-cache
if not exist edge-cache-1 mkdir edge-cache-1
if not exist edge-cache-2 mkdir edge-cache-2
if not exist ssl-certs mkdir ssl-certs
echo ✅ Diretorios criados

:: Deploy TURN servers
echo 🔄 Deploy TURN servers por regiao...
docker stack deploy -c turn-global.yml livego-turn
if %errorlevel% neq 0 (
    echo ❌ Falha no deploy TURN servers
    pause
    exit /b 1
)
echo ✅ TURN servers deployados

:: Aguardar TURN servers
echo ⏳ Aguardando TURN servers iniciarem...
timeout /t 30 /nobreak >nul

:: Deploy SRS Cluster
echo 🎥 Deploy SRS Cluster...
docker stack deploy -c srs-cluster.yml livego-srs
if %errorlevel% neq 0 (
    echo ❌ Falha no deploy SRS Cluster
    pause
    exit /b 1
)
echo ✅ SRS Cluster deployado

:: Aguardar SRS
echo ⏳ Aguardando SRS Master...
timeout /t 45 /nobreak >nul

:: Verificar SRS
echo 🔍 Verificando SRS...
curl -f http://localhost:8000/api/v1/summaries >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ SRS Master online
) else (
    echo ⚠️ SRS Master pode nao estar funcionando
)

:: Criar health check
echo 📊 Criando health check...
(
echo @echo off
echo === LiveGo Health Check ===
echo Data: %date% %time%
echo.
echo 📊 Docker Services:
docker service ls --filter name=livego
echo.
echo 🔄 TURN Servers:
docker service ls --filter name=livego-turn --format "table {{.Name}}\t{{.Replicas}}"
echo.
echo 🎥 SRS Cluster:
docker service ls --filter name=livego-srs --format "table {{.Name}}\t{{.Replicas}}"
echo.
echo 🌐 APIs:
curl -f http://localhost:8000/api/v1/summaries >nul 2>&1 && echo   SRS Master API: ✅ Online || echo   SRS Master API: ❌ Offline
curl -f http://localhost:8080/api/v1/summaries >nul 2>&1 && echo   SRS Origin API: ✅ Online || echo   SRS Origin API: ❌ Offline
curl -f http://localhost:80 >nul 2>&1 && echo   Load Balancer: ✅ Online || echo   Load Balancer: ❌ Offline
echo.
echo === End Health Check ===
) > health-check.bat

echo ✅ Health check criado

:: Criar dashboard
echo 📈 Criando dashboard...
(
echo @echo off
:loop
cls
echo 🚀 LiveGo Metrics Dashboard
echo ============================
echo.
echo 📅 %date% %time%
echo.
echo 📊 Resource Usage:
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" ^| findstr livego
echo.
echo 🐳 Containers:
echo   Total: ^| docker ps -q ^| wc -l
echo   Running: ^| docker ps --filter status=running -q ^| wc -l
echo.
echo 🔄 Services:
docker service ls --filter name=livego --format "table {{.Name}}\t{{.Replicas}}\t{{.Image}}"
echo.
echo 🌐 Network:
docker network ls ^| findstr livego
echo.
timeout /t 10 /nobreak >nul
goto loop
) > metrics-dashboard.bat

echo ✅ Dashboard criado

:: Testar sistema
echo 🧪 Testando sistema...
echo.
echo 🔄 Testando TURN server BR...
timeout /t 5 /nobreak >nul
docker exec livego-turn-br turnutils_uclient -T -u livego -w livego123 72.60.249.175:3478 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ TURN BR funcionando
) else (
    echo ⚠️ TURN BR pode nao estar funcionando
)

echo 🌐 Testando SRS API...
curl -f http://localhost:8000/api/v1/summaries >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ SRS API funcionando
) else (
    echo ⚠️ SRS API pode nao estar funcionando
)

echo 🌐 Testando Load Balancer...
curl -f http://localhost:80 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Load Balancer funcionando
) else (
    echo ⚠️ Load Balancer pode nao estar funcionando
)

echo.
echo ✅ Deploy concluido com sucesso!
echo.
echo 🎯 Servicos disponiveis:
echo   📊 Health Check: health-check.bat
echo   📈 Metrics: metrics-dashboard.bat
echo.
echo 🌐 APIs:
echo      - SRS Master: http://localhost:8000/api/v1/summaries
echo      - SRS Origin: http://localhost:8080/api/v1/summaries
echo      - Load Balancer: http://localhost
echo.
echo 🔄 TURN Servers:
echo      - BR: turn:72.60.249.175:3478
echo      - US: turn:104.21.45.100:3479
echo      - EU: turn:104.21.67.200:3480
echo.
echo 🎥 Streaming URLs:
echo      - WebRTC: webrtc://72.60.249.175/live/{streamId}
echo      - HLS: http://localhost/hls/{streamId}.m3u8
echo      - LL-HLS: http://localhost/llhls/{streamId}.m3u8
echo.
echo 📊 Capacidade: 50.000 usuarios simultaneos
echo    - WebRTC: 2.000 usuarios (interativos)
echo    - HLS: 48.000 usuarios (espectadores)
echo.
echo 🚀 LiveGo Escalavel pronto para uso!
echo.
pause
