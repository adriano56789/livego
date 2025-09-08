# LiveGo - Guia de Deployment e Configuração

## 📋 Visão Geral

Este documento contém todas as instruções necessárias para configurar e executar o projeto LiveGo em ambiente real, incluindo frontend React, backend Express.js, MongoDB e WebSockets para atualizações em tempo real.

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    MongoDB      │
│   React + Vite  │◄──►│  Express.js +   │◄──►│   Database      │
│   Port: 5173    │    │   Socket.IO     │    │   Port: 27017   │
│                 │    │   Port: 3000    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- MongoDB 7.0+
- npm ou yarn
- Git

### 1. Clonar o Repositório

```bash
git clone https://github.com/adriano56789/livego.git
cd livego
```

### 2. Configurar o Backend

```bash
cd api-server
npm install
```

**Arquivo: `api-server/package.json`**
```json
{
  "name": "livego-backend",
  "version": "1.0.0",
  "description": "Backend API for LiveGo streaming platform",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "mongodb": "^6.3.0",
    "socket.io": "^4.7.4",
    "dotenv": "^16.3.1",
    "body-parser": "^1.20.2"
  }
}
```

### 3. Configurar o Frontend

```bash
cd ..
npm install
npm install socket.io-client
```

### 4. Configurar o MongoDB

#### Ubuntu/Debian:
```bash
# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Iniciar serviço
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```env
# Backend
MONGO_URI=mongodb://localhost:27017/livego
NODE_ENV=development
PORT=3000

# Frontend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### Configuração do Backend

O backend está configurado em `api-server/index.js` com:

- **Express.js** para APIs REST
- **Socket.IO** para WebSocket/tempo real
- **MongoDB** para persistência de dados
- **CORS** habilitado para frontend

### Configuração do Frontend

O frontend está configurado com:

- **React + TypeScript**
- **Vite** como bundler
- **Socket.IO Client** para WebSocket
- **API Client** para comunicação com backend

## 🐳 Docker (Opcional)

### docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./api-server
    container_name: livego-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      MONGO_URI: mongodb://mongodb:27017/livego
    depends_on:
      - mongodb

  frontend:
    build: .
    container_name: livego-frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### Executar com Docker

```bash
docker-compose up --build -d
```

## 🚀 Executar o Sistema

### 1. Iniciar MongoDB
```bash
sudo systemctl start mongod
```

### 2. Iniciar Backend
```bash
cd api-server
npm start
```

### 3. Iniciar Frontend
```bash
cd ..
npm run dev
```

### 4. Acessar a Aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## 📡 APIs Disponíveis

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Status do servidor |
| GET | `/api/streams` | Lista streams ativas |
| GET | `/api/streams/:id` | Detalhes de uma stream |
| POST | `/api/streams` | Criar nova stream |
| POST | `/api/streams/:id/join` | Entrar em stream |
| POST | `/api/streams/:id/leave` | Sair de stream |
| GET | `/api/streams/:id/chat` | Mensagens do chat |
| POST | `/api/streams/:id/chat` | Enviar mensagem |
| GET | `/api/users/:id` | Dados do usuário |
| GET | `/api/gifts` | Lista de presentes |
| POST | `/api/gifts/send` | Enviar presente |

### WebSocket Events

| Event | Descrição |
|-------|-----------|
| `new-stream` | Nova stream criada |
| `viewer-joined` | Usuário entrou na stream |
| `viewer-left` | Usuário saiu da stream |
| `new-chat-message` | Nova mensagem no chat |
| `gift-sent` | Presente enviado |

## 🗄️ Estrutura do Banco de Dados

### Collections

#### users
```javascript
{
  id: Number,
  name: String,
  email: String,
  avatar_url: String,
  nickname: String,
  wallet_diamonds: Number,
  wallet_earnings: Number,
  // ... outros campos
}
```

#### streams
```javascript
{
  id: String,
  user_id: Number,
  titulo: String,
  nome_streamer: String,
  thumbnail_url: String,
  current_viewers: Array,
  categoria: String,
  ao_vivo: Boolean,
  // ... outros campos
}
```

#### chat_messages
```javascript
{
  id: String,
  userId: Number,
  message: String,
  timestamp: String,
  streamId: String
}
```

## 🔧 Migração para Produção

### 1. Configurar VPS

```bash
# Instalar dependências
sudo apt update
sudo apt install -y nodejs npm mongodb-org nginx

# Clonar projeto
git clone https://github.com/adriano56789/livego.git
cd livego
```

### 2. Configurar URLs de Produção

**Frontend (`services/apiClient.ts`):**
```typescript
const API_BASE_URL = 'https://api.seudominio.com';
```

**Frontend (`services/websocketClient.ts`):**
```typescript
const WEBSOCKET_URL = 'https://api.seudominio.com';
```

### 3. Build de Produção

```bash
# Frontend
npm run build

# Backend
cd api-server
npm install --production
```

### 4. Configurar Nginx

```nginx
server {
    listen 80;
    server_name seudominio.com;

    # Frontend
    location / {
        root /path/to/livego/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 5. Configurar SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

### 6. Configurar PM2 (Process Manager)

```bash
npm install -g pm2

# Backend
cd api-server
pm2 start index.js --name "livego-backend"

# Salvar configuração
pm2 save
pm2 startup
```

## 🔍 Monitoramento e Logs

### Logs do Backend
```bash
pm2 logs livego-backend
```

### Logs do MongoDB
```bash
sudo tail -f /var/log/mongodb/mongod.log
```

### Logs do Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Erro de conexão MongoDB**
   ```bash
   sudo systemctl status mongod
   sudo systemctl restart mongod
   ```

2. **CORS Error**
   - Verificar configuração CORS no backend
   - Verificar URLs no frontend

3. **WebSocket não conecta**
   - Verificar configuração do proxy
   - Verificar firewall

4. **Build falha**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs do sistema
2. Consultar documentação das dependências
3. Verificar issues no GitHub do projeto

---

**Projeto LiveGo - Plataforma de Streaming ao Vivo**
*Desenvolvido com React, Express.js, MongoDB e Socket.IO*

