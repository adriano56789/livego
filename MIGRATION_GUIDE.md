# 🚀 Guia de Migração para Produção - LiveGo

## 📋 Checklist de Migração

### ✅ Pré-requisitos na VPS

- [ ] Ubuntu 20.04+ ou CentOS 8+
- [ ] Node.js 18+ instalado
- [ ] MongoDB 7.0+ instalado e configurado
- [ ] Nginx instalado
- [ ] Domínio configurado (DNS apontando para VPS)
- [ ] Certificado SSL (Let's Encrypt recomendado)

### ✅ Passos de Migração

#### 1. Preparar o Ambiente

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y curl git nginx

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

#### 2. Instalar MongoDB

```bash
# Importar chave pública
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Adicionar repositório
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Instalar
sudo apt update
sudo apt install -y mongodb-org

# Iniciar e habilitar
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 3. Clonar e Configurar Projeto

```bash
# Clonar repositório
cd /var/www
sudo git clone https://github.com/adriano56789/livego.git
sudo chown -R $USER:$USER livego
cd livego

# Instalar dependências do frontend
npm install

# Instalar dependências do backend
cd api-server
npm install
cd ..
```

#### 4. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
sudo nano /var/www/livego/.env
```

**Conteúdo do .env:**
```env
# Produção
NODE_ENV=production
MONGO_URI=mongodb://localhost:27017/livego
PORT=3000

# URLs de produção (substituir pelo seu domínio)
FRONTEND_URL=https://seudominio.com
BACKEND_URL=https://seudominio.com
```

#### 5. Atualizar URLs no Frontend

**Arquivo: `services/apiClient.ts`**
```typescript
// Substituir por:
const API_BASE_URL = 'https://seudominio.com';
```

**Arquivo: `services/websocketClient.ts`**
```typescript
// Substituir por:
const WEBSOCKET_URL = 'https://seudominio.com';
```

#### 6. Build de Produção

```bash
# Build do frontend
npm run build

# Verificar se dist/ foi criado
ls -la dist/
```

#### 7. Configurar Nginx

```bash
# Criar configuração do site
sudo nano /etc/nginx/sites-available/livego
```

**Conteúdo da configuração:**
```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com www.seudominio.com;

    # Certificados SSL (serão configurados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Frontend (arquivos estáticos)
    location / {
        root /var/www/livego/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache para arquivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket
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

    # Logs
    access_log /var/log/nginx/livego_access.log;
    error_log /var/log/nginx/livego_error.log;
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/livego /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

#### 8. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado (substituir seudominio.com)
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Testar renovação automática
sudo certbot renew --dry-run
```

#### 9. Configurar PM2 para o Backend

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Criar arquivo de configuração
nano /var/www/livego/ecosystem.config.js
```

**Conteúdo do ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'livego-backend',
    script: '/var/www/livego/api-server/index.js',
    cwd: '/var/www/livego/api-server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGO_URI: 'mongodb://localhost:27017/livego'
    },
    error_file: '/var/log/pm2/livego-error.log',
    out_file: '/var/log/pm2/livego-out.log',
    log_file: '/var/log/pm2/livego-combined.log'
  }]
};
```

```bash
# Criar diretório de logs
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Iniciar aplicação
cd /var/www/livego
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar inicialização automática
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

#### 10. Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH, HTTP e HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Verificar status
sudo ufw status
```

#### 11. Configurar Backup do MongoDB

```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-livego.sh
```

**Conteúdo do script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
DB_NAME="livego"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Fazer backup
mongodump --db $DB_NAME --out $BACKUP_DIR/backup_$DATE

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -type d -name "backup_*" -mtime +7 -exec rm -rf {} \;

echo "Backup concluído: $BACKUP_DIR/backup_$DATE"
```

```bash
# Tornar executável
sudo chmod +x /usr/local/bin/backup-livego.sh

# Configurar cron para backup diário
sudo crontab -e

# Adicionar linha (backup às 2h da manhã):
0 2 * * * /usr/local/bin/backup-livego.sh
```

## 🔍 Verificação Pós-Migração

### 1. Testar URLs

```bash
# Health check da API
curl https://seudominio.com/api/health

# Verificar frontend
curl -I https://seudominio.com
```

### 2. Verificar Logs

```bash
# Logs do PM2
pm2 logs livego-backend

# Logs do Nginx
sudo tail -f /var/log/nginx/livego_access.log
sudo tail -f /var/log/nginx/livego_error.log

# Logs do MongoDB
sudo tail -f /var/log/mongodb/mongod.log
```

### 3. Monitorar Performance

```bash
# Status do PM2
pm2 status

# Uso de recursos
pm2 monit

# Status dos serviços
sudo systemctl status mongod
sudo systemctl status nginx
```

## 🛠️ Manutenção

### Atualizações

```bash
# Atualizar código
cd /var/www/livego
git pull origin main

# Reinstalar dependências se necessário
npm install
cd api-server && npm install && cd ..

# Rebuild frontend
npm run build

# Reiniciar backend
pm2 restart livego-backend

# Recarregar Nginx se necessário
sudo systemctl reload nginx
```

### Monitoramento

```bash
# Verificar espaço em disco
df -h

# Verificar uso de memória
free -h

# Verificar processos
top

# Logs em tempo real
pm2 logs livego-backend --lines 50
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Site não carrega**
   - Verificar se Nginx está rodando: `sudo systemctl status nginx`
   - Verificar configuração: `sudo nginx -t`
   - Verificar logs: `sudo tail -f /var/log/nginx/error.log`

2. **API não responde**
   - Verificar se backend está rodando: `pm2 status`
   - Verificar logs: `pm2 logs livego-backend`
   - Reiniciar: `pm2 restart livego-backend`

3. **Banco de dados não conecta**
   - Verificar MongoDB: `sudo systemctl status mongod`
   - Verificar logs: `sudo tail -f /var/log/mongodb/mongod.log`
   - Reiniciar: `sudo systemctl restart mongod`

4. **WebSocket não funciona**
   - Verificar configuração do proxy no Nginx
   - Verificar se porta 3000 está acessível internamente
   - Verificar logs do backend

### Comandos Úteis

```bash
# Reiniciar todos os serviços
sudo systemctl restart mongod
pm2 restart all
sudo systemctl reload nginx

# Verificar portas em uso
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :3000

# Verificar certificado SSL
sudo certbot certificates

# Renovar certificado SSL
sudo certbot renew
```

---

**🎉 Parabéns! Seu LiveGo está agora rodando em produção!**

Lembre-se de:
- Monitorar logs regularmente
- Fazer backups do banco de dados
- Manter o sistema atualizado
- Monitorar performance e recursos

