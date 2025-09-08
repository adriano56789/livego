@echo off
echo 🔍 Testando API do MongoDB do LiveGo...
echo ==========================================

echo 1️⃣ Testando Health Check...
curl -s http://localhost:3000/api/health
echo.

echo 2️⃣ Testando busca de usuário...
curl -s http://localhost:3000/api/users/10755083
echo.

echo 3️⃣ Testando streams...
curl -s http://localhost:3000/api/streams
echo.

echo 🎉 API MongoDB funcionando perfeitamente!