# Script para reiniciar os serviços Docker do LiveGo

Write-Host "🔄 Parando e removendo containers..." -ForegroundColor Yellow
docker-compose down -v

Write-Host "🏗️  Construindo e iniciando serviços..." -ForegroundColor Yellow
docker-compose up --build

Write-Host "✅ Processo concluído!" -ForegroundColor Green