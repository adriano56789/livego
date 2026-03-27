#!/bin/bash

# Script para iniciar SRS com autenticação HTTP API
# Seguindo documentação oficial: https://ossrs.io/lts/en-us/docs/v6/doc/http-api#authentication

echo "🚀 Iniciando SRS com autenticação HTTP API..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Iniciando Docker Desktop..."
    start "" "C:\Program Files\Docker\Docker Desktop.exe"
    echo "⏳ Aguardando Docker Desktop iniciar..."
    sleep 10
fi

# Criar diretórios necessários
mkdir -p srs-config srs-logs

# Iniciar servidor SRS com Docker
echo "📡 Iniciando servidor SRS..."
docker run -d \
    --name srs-server \
    --restart unless-stopped \
    -p "1935:1935/tcp" \
    -p "1985:1985/tcp" \
    -p "8080:8080/tcp" \
    -p "8000:8000/udp" \
    -p "9000:9000/tcp" \
    -p "5060:5060/tcp" \
    -p "10080:10080/udp" \
    -v "$(pwd)/srs.conf:/usr/local/srs/conf/srs.conf" \
    -v "$(pwd)/srs-config:/usr/local/srs/conf" \
    -v "$(pwd)/srs-logs:/usr/local/srs/objs/logs" \
    -e SRS_DAEMON=off \
    -e SRS_IN_DOCKER=on \
    -e TURN_SERVER_URL=turn:72.60.249.175:3478 \
    -e TURN_USERNAME=livego \
    -e TURN_PASSWORD=adriano123 \
    ossrs/srs:5

# Aguardar SRS iniciar
echo "⏳ Aguardando SRS iniciar..."
sleep 5

# Verificar se o container está rodando
if docker ps | grep srs-server > /dev/null; then
    echo "✅ SRS Server iniciado com sucesso!"
    echo "📡 API HTTP: http://localhost:1985"
    echo "🔗 RTMP: rtmp://localhost:1935/live"
    echo "🌐 HTTP: http://localhost:8080"
    echo "🔗 WebRTC: webrtc://localhost:8000/live"
    echo ""
    echo "🔐 Testando API com autenticação:"
    echo "curl -u admin:admin http://localhost:1985/api/v1/versions"
    echo ""
    echo "📊 Status do servidor:"
    docker logs srs-server --tail 20
else
    echo "❌ Erro ao iniciar SRS Server"
    docker logs srs-server
fi
