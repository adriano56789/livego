@echo off
echo 🚀 DEPLOY PRODUCAO - LIVEGO
echo ============================

echo.
echo 1. INICIANDO SRS...
docker run -d --name srs -p 1935:1935 -p 8080:8080 -p 1985:1985 -p 8000:8000 -v "%cd%\srs.conf:/usr/local/srs/conf/srs.conf" --restart unless-stopped ossrs/srs:5

echo.
echo 2. INICIANDO TURN SERVER...
docker run -d --name coturn -p 3478:3478 -p 3478:3478/udp -p 5349:5349 -v "%cd%\turnserver.conf:/etc/coturn/turnserver.conf" --restart unless-stopped coturn/coturn

echo.
echo 3. INICIANDO BACKEND...
cd backend
start /B npm start

echo.
echo 4. AGUARDANDO SERVICOS...
timeout /t 15 /nobreak >nul

echo.
echo 5. VERIFICANDO PORTAS...
netstat -an | findstr ":1935 :1985 :8000 :8080 :3478 :3000"

echo.
echo ✅ SISTEMA ONLINE!
echo ===================
echo SRS: https://livego.store:1985
echo TURN: livego.store:3478  
echo BACKEND: https://livego.store
echo FRONTEND: https://livego.store
echo.
echo 🎯 STREAMING REAL PRONTO!

cd ..
pause
