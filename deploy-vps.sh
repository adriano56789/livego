#!/bin/bash

# Script de Deploy Completo para VPS - LiveGO
# Domínios: livego.store e api.livego.store

set -e  # Para em caso de erro

echo "=========================================="
echo "INICIANDO DEPLOY COMPLETO LIVEGO"
echo "=========================================="

# Variáveis
REPO_URL="https://github.com/adriano56789/livego.git"
PROJECT_DIR="/var/www/livego"
DOMAIN="livego.store"
API_DOMAIN="api.livego.store"
EMAIL="admin@livego.store"  # Altere para seu email

# 1. ATUALIZAR SISTEMA
echo "1. Atualizando sistema..."
apt update && apt upgrade -y

# 2. INSTALAR DEPENDÊNCIAS BÁSICAS
echo "2. Instalando dependências básicas..."
apt install -y git curl wget nginx certbot python3-certbot-nginx

# 3. INSTALAR NODE.js VIA NODESOURCE
echo "3. Instalando Node.js..."
# Remover instalações existentes
apt remove -y nodejs npm || true
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 4. INSTALAR PM2
echo "4. Instalando PM2..."
npm install -g pm2

# 5. CLONAR REPOSITÓRIO
echo "5. Clonando repositório..."
if [ -d "$PROJECT_DIR" ]; then
    rm -rf "$PROJECT_DIR"
fi
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"
git clone "$REPO_URL" .

# 6. CONFIGURAR BACKEND
echo "6. Configurando backend..."
cd "$PROJECT_DIR/backend"

# Instalar dependências do backend
npm install

# Instalar axios que está faltando
npm install axios

# Build do backend
npm run build

# Usar arquivos .env existentes (backend e frontend)

# 7. CONFIGURAR PM2 PARA BACKEND
echo "7. Configurando PM2 para backend..."
pm2 stop livego-backend 2>/dev/null || true
pm2 delete livego-backend 2>/dev/null || true
pm2 start dist/server.js --name "livego-backend"
pm2 save
pm2 startup

# 8. CONFIGURAR FRONTEND
echo "8. Configurando frontend..."
cd "$PROJECT_DIR"

# Instalar dependências do frontend
npm install

# Build de produção do frontend
npm run build

# 9. CONFIGURAR NGINX
echo "9. Configurando Nginx..."
cat > /etc/nginx/sites-available/livego << 'EOF'
# Configuração LiveGO - Frontend + Backend
server {
    listen 80;
    server_name livego.store api.livego.store;
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name livego.store;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/livego.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/livego.store/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Frontend - Servir arquivos estáticos
    root /var/www/livego/dist;
    index index.html;

    # Forçar HTTPS
    if ($host != "livego.store") {
        return 301 https://livego.store$request_uri;
    }

    # Configuração para React Router
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy reverso para API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS Headers
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
        add_header Access-Control-Expose-Headers "Content-Length,Content-Range";
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # WebSocket support para Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Configuração para subdomínio API (opcional - redireciona para main)
server {
    listen 443 ssl http2;
    server_name api.livego.store;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/livego.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/livego.store/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Redirecionar API calls para o backend diretamente
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 10. INSTALAR CERTIFICADO SSL
echo "10. Instalando certificado SSL Let's Encrypt..."
# Parar nginx para liberar porta 80
systemctl stop nginx
# Instalar certificado sem nginx
certbot certonly --standalone -d "$DOMAIN" -d "$API_DOMAIN" --email "$EMAIL" --agree-tos --non-interactive

# 11. ATIVAR SITE NGINX
echo "11. Ativando site Nginx..."
ln -sf /etc/nginx/sites-available/livego /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração Nginx
nginx -t

# Configurar nginx com SSL
certbot --nginx -d "$DOMAIN" -d "$API_DOMAIN" --email "$EMAIL" --agree-tos --non-interactive --redirect

# 12. REINICIAR SERVIÇOS
echo "12. Reiniciando serviços..."
systemctl restart nginx
pm2 restart livego-backend

# 13. CONFIGURAR FIREWALL
echo "13. Configurando firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

# 14. VERIFICAR SERVIÇOS
echo "14. Verificando serviços..."
echo "=== Status PM2 ==="
pm2 status

echo "=== Status Nginx ==="
systemctl status nginx --no-pager

echo "=== Portas em uso ==="
netstat -tlnp | grep -E ':(80|443|3000|22)'

# 15. TESTE DE CONEXÃO
echo "15. Testando conexões..."
sleep 5

# Testar backend
if curl -f http://localhost:3000/api/health 2>/dev/null; then
    echo "Backend: OK"
else
    echo "Backend: FALHOU (pode ser normal se não tiver endpoint /health)"
fi

# Testar frontend
if [ -f "$PROJECT_DIR/dist/index.html" ]; then
    echo "Frontend build: OK"
else
    echo "Frontend build: FALHOU"
fi

echo "=========================================="
echo "DEPLOY CONCLUÍDO!"
echo "=========================================="
echo "Seu site está disponível em:"
echo "- Frontend: https://livego.store"
echo "- API: https://livego.store/api"
echo "- API direta: https://api.livego.store"
echo ""
echo "Comandos úteis:"
echo "- Ver logs PM2: pm2 logs livego-backend"
echo "- Reiniciar backend: pm2 restart livego-backend"
echo "- Reiniciar nginx: systemctl restart nginx"
echo "- Renovar SSL: certbot renew"
echo ""
echo "Arquivos importantes:"
echo "- Config Nginx: /etc/nginx/sites-available/livego"
echo "- Projeto: $PROJECT_DIR"
echo "- Logs PM2: ~/.pm2/logs/"
echo "=========================================="
