#!/usr/bin/env pwsh

$VPS_IP = "72.60.249.175"
$VPS_USER = "root"

Write-Host "=== INICIANDO CONTAINERS DOCKER ===" -ForegroundColor Green

$startScript = @"
cd /root/livego

echo '=== 1. Parando containers existentes ==='
docker-compose down 2>/dev/null || true

echo '=== 2. Iniciando containers ==='
docker-compose up -d --build

echo '=== 3. Verificando status ==='
docker ps

echo '=== 4. Verificando logs do backend ==='
docker logs livego-backend --tail=20 2>/dev/null || echo 'Backend ainda não iniciado'

echo '=== 5. Verificando logs do SRS ==='
docker logs srs-server --tail=10 2>/dev/null || echo 'SRS ainda não iniciado'

echo '=== 6. Testando conectividade ==='
curl -s http://localhost:1985/api/v1/summaries 2>/dev/null || echo 'SRS API não disponível ainda'

echo '=== CONTAINERS INICIADOS ==='
"@

$startScript | ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP

Write-Host "=== VERIFICAÇÃO CONCLUÍDA ===" -ForegroundColor Green
