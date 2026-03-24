#!/bin/bash

# Script para iniciar serviços WebRTC (STUN/TURN/SRS)
echo "🚀 Iniciando serviços WebRTC para LiveGo..."

# Criar diretórios necessários
mkdir -p logs
mkdir -p ssl-certs

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instale Docker Compose primeiro."
    exit 1
fi

# Parar serviços existentes
echo "🛑 Parando serviços existentes..."
docker-compose down 2>/dev/null

# Limpar containers antigos
echo "🧹 Limpando containers antigos..."
docker system prune -f

# Construir e iniciar serviços
echo "🔧 Construindo e iniciando serviços..."
docker-compose up -d --build

# Aguardar serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos serviços
echo "📊 Verificando status dos serviços..."
docker-compose ps

# Testar STUN
echo "🧪 Testando servidor STUN..."
timeout 5 docker exec livego-coturn turnutils_uclient -T -u livego -w livego123 72.60.249.175:3478 || echo "⚠️ STUN test failed"

# Testar SRS API
echo "🧪 Testando API SRS..."
curl -f http://localhost:8080/api/v1/summaries 2>/dev/null && echo "✅ SRS API OK" || echo "❌ SRS API failed"

# Testar WebRTC
echo "🧪 Testando WebRTC..."
curl -f http://localhost:8080/api/v1/rtc 2>/dev/null && echo "✅ WebRTC OK" || echo "❌ WebRTC failed"

echo ""
echo "🎉 Serviços WebRTC iniciados!"
echo ""
echo "📋 Endpoints disponíveis:"
echo "  📍 STUN/TURN: 72.60.249.175:3478"
echo "  📍 RTMP: rtmp://72.60.249.175:1935/live"
echo "  📍 HLS: http://72.60.249.175:8000/live/"
echo "  📍 FLV: http://72.60.249.175:8088/live/"
echo "  📍 WebRTC: webrtc://72.60.249.175/live/"
echo "  📍 API SRS: http://72.60.249.175:8080/api/"
echo ""
echo "📋 Logs:"
echo "  📝 STUN/TURN: docker logs livego-coturn"
echo "  📝 SRS: docker logs livego-srs"
echo ""
echo "📋 Comandos úteis:"
echo "  🔄 Reiniciar: docker-compose restart"
echo "  🛑 Parar: docker-compose down"
echo "  📊 Status: docker-compose ps"
echo "  📝 Logs: docker-compose logs -f"
