#!/bin/sh

# Função para lidar com sinais
cleanup() {
    echo "Recebido sinal para parar o servidor..."
    if [ ! -z "$NODE_PID" ]; then
        kill -TERM "$NODE_PID" 2>/dev/null
        wait "$NODE_PID"
    fi
    exit 0
}

# Capturar sinais SIGTERM e SIGINT
trap cleanup SIGTERM SIGINT

# Aguarda o MongoDB estar pronto
echo "Verificando conexão com o MongoDB..."
until nc -z mongodb 27017; do
  echo "Aguardando o MongoDB estar disponível..."
  sleep 2
done
echo "MongoDB está disponível!"

# Aguarda um pouco mais para garantir que o MongoDB esteja completamente inicializado
sleep 5

# Inicia o servidor Node.js em background
echo "Iniciando servidor Node.js..."
node index.js &
NODE_PID=$!

# Aguarda o processo do Node.js
wait "$NODE_PID"
