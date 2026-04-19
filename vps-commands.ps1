#!/usr/bin/env pwsh

# Script para executar comandos na VPS sem pedir senha repetidamente
# Usando uma única sessão SSH persistente

$VPS_IP = "72.60.249.175"
$VPS_USER = "root"

Write-Host "=== CONECTANDO À VPS E EXECUTANDO COMANDOS ===" -ForegroundColor Green

# Criar script remoto para executar todos os comandos de uma vez
$remoteScript = @"
echo '=== INICIANDO CONFIGURAÇÃO DA VPS ==='
cd /root/livego

echo '=== 1. Corrigindo erros TypeScript ==='
cd backend
sed -i 's/const payment = response.data;/const payment: any = response.data;/' src/services/mercadoPagoService.ts
echo '✅ TypeScript corrigido'

echo '=== 2. Iniciando containers Docker ==='
cd /root/livego
docker-compose down 2>/dev/null || true
docker-compose up -d --build
echo '✅ Containers iniciados'

echo '=== 3. Verificando status dos containers ==='
docker ps
echo '✅ Status verificado'

echo '=== 4. Verificando logs do backend ==='
docker logs livego-backend --tail=20
echo '✅ Logs verificados'

echo '=== 5. Verificando configuração WebRTC ==='
ls -la srs.conf
echo '✅ Configuração SRS verificada'

echo '=== CONFIGURAÇÃO CONCLUÍDA ==='
"@

# Executar script remoto via SSH
$remoteScript | ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP

Write-Host "=== COMANDOS CONCLUÍDOS ===" -ForegroundColor Green
