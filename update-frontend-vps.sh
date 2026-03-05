#!/bin/bash

# Script para atualizar frontend na VPS com configuração correta

echo "🔄 Atualizando Frontend na VPS..."

# 1. Atualizar variáveis de ambiente
cd /var/www/livego

cat > .env << 'EOF'
# --- Configuração do Frontend (Vite) ---
VITE_API_BASE_URL=https://livego.store
VITE_WS_URL=wss://livego.store
VITE_USE_MOCK=false
VITE_SRS_RTC_URL=webrtc://livego.store/live
EOF

echo "✅ Variáveis de ambiente atualizadas"

# 2. Rebuild frontend
echo "🔨 Buildando frontend..."
npm run build

# 3. Copiar para frontend-build
echo "📁 Copiando arquivos para Nginx..."
mkdir -p frontend-build
cp -r dist/* frontend-build/

# 4. Corrigir permissões
chown -R www-data:www-data /var/www/livego/frontend-build
chmod -R 755 /var/www/livego/frontend-build

# 5. Reiniciar PM2
echo "🔄 Reiniciando frontend com PM2..."
cd /var/www/livego
pm2 restart livego-frontend

# 6. Aguardar um momento
sleep 3

# 7. Verificar status
echo "📊 Status do PM2:"
pm2 status

echo "✅ Frontend atualizado com sucesso!"
echo ""
echo "🌐 Acesse: https://livego.store"
echo "📊 Status:"
echo "   Frontend: https://livego.store"
echo "   API: https://livego.store/api"
echo "   WebSocket: wss://livego.store"
echo ""
echo "🔧 Configurações aplicadas:"
echo "   VITE_API_BASE_URL=https://livego.store (sem /api no final)"
echo "   VITE_WS_URL=wss://livego.store"
echo "   VITE_SRS_RTC_URL=webrtc://livego.store/live"
