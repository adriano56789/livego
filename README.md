# 🎥 LiveGo - Plataforma de Live Streaming com Docker

Sistema completo de transmissão ao vivo com MongoDB, APIs funcionais, integrações SRS/LiveKit, sistema de PK e roleta, tudo containerizado com Docker.

## 🚀 Status do Projeto

**✅ SISTEMA 100% FUNCIONAL - PRONTO PARA PRODUÇÃO**

- ✅ MongoDB local containerizado
- ✅ APIs CRUD completas funcionando
- ✅ Integração SRS e LiveKit
- ✅ Sistema de PK (Player Kill) implementado
- ✅ Sistema de Roleta implementado
- ✅ Docker Compose configurado
- ✅ Testes realizados em todas as funcionalidades

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** + Express
- **MongoDB** (containerizado)
- **Socket.IO** (WebSocket em tempo real)
- **LiveKit** (streaming WebRTC)
- **SRS** (Simple Realtime Server)

### Frontend
- **React** + TypeScript
- **Tailwind CSS**
- **Vite** (build tool)
- **Nginx** (servidor de produção)

### DevOps
- **Docker** + Docker Compose
- **Health Checks** automáticos
- **Multi-stage builds**
- **Volume persistence**

## 📋 Funcionalidades Implementadas

### ✅ Sistema de Usuários
- CRUD completo de usuários
- Autenticação e perfis
- Sistema de seguir/seguidores
- Carteira de diamantes

### ✅ Sistema de Live Streaming
- Configuração de transmissão
- Integração com LiveKit e SRS
- Categorias de live
- Visualização de lives ativas
- WebRTC para baixa latência

### ✅ Sistema de PK (Player Kill)
- **Convites de Batalha**: Streamers podem desafiar outros
- **Batalhas em Tempo Real**: Sistema de pontuação ao vivo
- **Notificações WebSocket**: Atualizações instantâneas
- **Expiração Automática**: Convites expiram em 30 segundos
- **Determinação de Vencedor**: Algoritmo automático

### ✅ Sistema de Roleta
- **Criação de Roletas**: Apenas hosts podem criar
- **Sistema de Apostas**: Apostas com diamantes
- **Sorteio Justo**: Algoritmo baseado em peso das apostas
- **Distribuição de Prêmios**: 90% para vencedores, 10% casa
- **Finalização Automática**: Por tempo ou manual

### ✅ APIs Implementadas
1. **Usuários**: `/api/users/*` - CRUD completo
2. **Streams**: `/api/streams/*` - Gerenciamento de lives
3. **PK System**: `/api/pk/*` - Sistema de batalhas
4. **Roleta**: `/api/roulette/*` - Sistema de apostas
5. **Presentes**: `/api/gifts/*` - Sistema de presentes
6. **Busca**: `/api/users/search` - Busca de usuários
7. **Configurações**: `/api/users/*/settings` - Preferências

## 🐳 Deploy com Docker

### Pré-requisitos
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM mínimo
- 10GB espaço em disco

### 1. Clone o repositório
```bash
git clone https://github.com/adriano56789/livego.git
cd livego
```

### 2. Execute com Docker Compose
```bash
# Subir todos os serviços
docker-compose up -d

# Verificar status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f api
```

### 3. Acesse o sistema
- **Frontend**: http://localhost (porta 80)
- **API**: http://localhost:3000
- **MongoDB**: localhost:27017
- **SRS**: http://localhost:8080
- **LiveKit**: http://localhost:7880

### 4. Health Checks
```bash
# Verificar saúde da API
curl http://localhost:3000/api/health

# Verificar MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Verificar SRS
curl http://localhost:1985/api/v1/summaries

# Verificar LiveKit
curl http://localhost:7880/
```

## 📊 Estrutura dos Containers

```
livego/
├── mongodb/          # Banco de dados MongoDB
├── api/             # Backend Node.js + Express
├── frontend/        # Frontend React + Nginx
├── srs/            # Simple Realtime Server
└── livekit/        # LiveKit WebRTC Server
```

### Portas Utilizadas
- **80**: Frontend (Nginx)
- **3000**: Backend API
- **27017**: MongoDB
- **1935**: SRS RTMP
- **1985**: SRS HTTP API
- **8080**: SRS HTTP/HLS
- **7880**: LiveKit WebSocket
- **7881**: LiveKit RTC TCP

## 🔧 Configuração Avançada

### Variáveis de Ambiente
```bash
# Backend (.env)
NODE_ENV=production
MONGO_URI=mongodb://root:rootpassword@mongodb:27017/livego?authSource=admin
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_WS_URL=ws://livekit:7880
SRS_API_URL=http://srs:1985/api/v1
SRS_HTTP_URL=http://srs:8080
```

### Volumes Persistentes
- **mongodb_data**: Dados do MongoDB
- **./srs.conf**: Configuração do SRS
- **./livekit.yaml**: Configuração do LiveKit

## 🧪 Testes e Validação

### Executar Testes das APIs
```bash
# Testar todas as APIs
curl http://localhost:3000/api/health
curl http://localhost:3000/api/users
curl http://localhost:3000/api/streams
curl http://localhost:3000/api/pk/battles/active
curl http://localhost:3000/api/streams/1/roulettes/active
```

### Testar Funcionalidades
1. **Acesse**: http://localhost
2. **Navegue** pelas páginas
3. **Teste** o sistema de PK
4. **Teste** o sistema de roleta
5. **Verifique** as notificações em tempo real

## 🚨 Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs [service_name]

# Reconstruir containers
docker-compose build --no-cache
docker-compose up -d
```

### MongoDB não conecta
```bash
# Verificar se o container está rodando
docker-compose ps mongodb

# Testar conexão
docker-compose exec mongodb mongosh
```

### API retorna 500
```bash
# Ver logs da API
docker-compose logs api

# Verificar saúde do MongoDB
curl http://localhost:3000/api/health
```

## 📈 Monitoramento

### Logs em Tempo Real
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f api
docker-compose logs -f mongodb
```

### Métricas dos Containers
```bash
# Uso de recursos
docker stats

# Informações dos containers
docker-compose ps
```

## 🔄 Atualizações

### Atualizar o Sistema
```bash
# Parar containers
docker-compose down

# Atualizar código
git pull origin main

# Reconstruir e subir
docker-compose build
docker-compose up -d
```

### Backup do Banco
```bash
# Backup do MongoDB
docker-compose exec mongodb mongodump --out /backup

# Restaurar backup
docker-compose exec mongodb mongorestore /backup
```

## 🌐 Deploy em Produção

### VPS/Servidor Dedicado
1. **Instalar Docker** e Docker Compose
2. **Clonar** o repositório
3. **Configurar** variáveis de ambiente
4. **Executar** `docker-compose up -d`
5. **Configurar** proxy reverso (Nginx/Apache)
6. **Configurar** SSL/HTTPS

### Configuração de Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📚 Documentação das APIs

### Endpoints Principais
- `GET /api/health` - Status do sistema
- `GET /api/users` - Listar usuários
- `POST /api/pk/invite` - Criar convite PK
- `POST /api/streams/:id/roulette/start` - Iniciar roleta
- `GET /api/pk/battles/active` - Batalhas ativas
- `GET /api/streams/:id/roulettes/active` - Roletas ativas

### WebSocket Events
- `pk-invite-received` - Convite de PK recebido
- `pk-battle-started` - Batalha iniciada
- `roulette-started` - Roleta iniciada
- `roulette-bet-placed` - Aposta realizada
- `roulette-finished` - Roleta finalizada

## 🤝 Contribuição

Sistema desenvolvido e testado completamente. Pronto para uso em produção.

## 📄 Licença

MIT License - Veja o arquivo LICENSE para detalhes.

---

**🎯 Sistema LiveGo - Streaming profissional com Docker**

**Status: PRONTO PARA PRODUÇÃO** 🚀

