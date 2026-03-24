@echo off
echo 🚀 Iniciando serviços WebRTC para LiveGo...

REM Criar diretórios necessários
if not exist logs mkdir logs
if not exist ssl-certs mkdir ssl-certs

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker não encontrado. Instale Docker primeiro.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose não encontrado. Instale Docker Compose primeiro.
    pause
    exit /b 1
)

REM Parar serviços existentes
echo 🛑 Parando serviços existentes...
docker-compose down 2>nul

REM Construir e iniciar serviços
echo 🔧 Construindo e iniciando serviços...
docker-compose up -d --build

REM Aguardar serviços iniciarem
echo ⏳ Aguardando serviços iniciarem...
timeout /t 10 /nobreak >nul

REM Verificar status dos serviços
echo 📊 Verificando status dos serviços...
docker-compose ps

echo.
echo 🎉 Serviços WebRTC iniciados!
echo.
echo 📋 Endpoints disponíveis:
echo   📍 STUN/TURN: 72.60.249.175:3478
echo   📍 RTMP: rtmp://72.60.249.175:1935/live
echo   📍 HLS: http://72.60.249.175:8000/live/
echo   📍 FLV: http://72.60.249.175:8088/live/
echo   📍 WebRTC: webrtc://72.60.249.175/live/
echo   📍 API SRS: http://72.60.249.175:8080/api/
echo.
echo 📋 Logs:
echo   📝 STUN/TURN: docker logs livego-coturn
echo   📝 SRS: docker logs livego-srs
echo.
echo 📋 Comandos úteis:
echo   🔄 Reiniciar: docker-compose restart
echo   🛑 Parar: docker-compose down
echo   📊 Status: docker-compose ps
echo   📝 Logs: docker-compose logs -f
pause
