#!/bin/bash

echo "🔧 CORREÇÃO COMPLETA DO STREAMING - VPS"
echo "=========================================="

# 1. Parar todos os serviços
echo "🛑 Parando serviços..."
pkill -f "node"
pkill -f "srs"
pkill -f "turnserver"

# 2. Configurar variáveis de ambiente para VPS
echo "🌍 Configurando ambiente VPS..."
cat > .env << EOF
VITE_API_BASE_URL=https://livego.store
VITE_WS_URL=wss://livego.store
VITE_USE_MOCK=false
VITE_SRS_API_URL=https://livego.store:1985
VITE_SRS_WEBRTC_URL=wss://livego.store:8000/live
VITE_SRS_RTMP_URL=rtmp://livego.store:1935/live
VITE_SRS_HTTP_URL=https://livego.store:8080/live
VITE_SRS_HLS_URL=https://livego.store:8000/live
VITE_STUN_SERVER_URL=stun:livego.store:3478
VITE_TURN_SERVER_URL=turn:livego.store:3478
VITE_TURN_USERNAME=livego
VITE_TURN_CREDENTIAL=livego123secret
EOF

# 3. Corrigir URLs de WebRTC (remover webrtc://)
echo "🔧 Corrigindo URLs WebRTC..."
find services -name "*.ts" -exec sed -i 's/webrtc:\/\//wss:\/\//g' {} \;
find components -name "*.tsx" -exec sed -i 's/webrtc:\/\//wss:\/\//g' {} \;
find backend -name "*.ts" -exec sed -i 's/webrtc:\/\//wss:\/\//g' {} \;

# 4. Iniciar SRS
echo "📡 Iniciando SRS..."
docker run -d --name srs \
  -p 1935:1935 \
  -p 8080:8080 \
  -p 1985:1985 \
  -p 8000:8000 \
  -v $(pwd)/srs.conf:/usr/local/srs/conf/srs.conf \
  ossrs/srs:5

# 5. Iniciar TURN Server
echo "🔄 Iniciando TURN Server..."
docker run -d --name coturn \
  -p 3478:3478 \
  -p 3478:3478/udp \
  -p 5349:5349 \
  -v $(pwd)/turnserver.conf:/etc/coturn/turnserver.conf \
  coturn/coturn

# 6. Iniciar Backend
echo "🖥️ Iniciando Backend..."
cd backend && npm start &

echo "✅ Sistema de streaming corrigido!"
echo "📋 Serviços ativos:"
echo "   - SRS: https://livego.store:1985"
echo "   - TURN: livego.store:3478"
echo "   - Backend: https://livego.store"
echo "   - Frontend: https://livego.store"
