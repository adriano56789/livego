# LiveGo API

API para o sistema de streaming ao vivo LiveGo, fornecendo autenticação, gerenciamento de usuários e funcionalidades de streaming.

## 📋 Requisitos

- Node.js 18+
- MongoDB 6.0+
- Yarn ou NPM
- Servidor SMTP (para envio de emails)
- Conta no Cloudinary (para upload de imagens)

## 🚀 Configuração do Ambiente

1. **Clonar o repositório**
   ```bash
   git clone [URL_DO_REPOSITÓRIO]
   cd live_go/site/api
   ```

2. **Instalar dependências**
   ```bash
   yarn install
   # ou
   npm install
   ```

3. **Configurar variáveis de ambiente**
   - Copie o arquivo `.env.example` para `.env`
   - Preencha as variáveis necessárias:
     ```env
     # Servidor
     NODE_ENV=development
     PORT=3000
     
       # Banco de Dados
     MONGO_URI=mongodb://localhost:27017/livego
     
       # Autenticação
     JWT_SECRET=seu_jwt_secret_aqui
     JWT_EXPIRE=30d
     JWT_COOKIE_EXPIRE=30
     
       # Email
     SMTP_HOST=smtp.exemplo.com
     SMTP_PORT=587
     SMTP_EMAIL=seu@email.com
     SMTP_PASSWORD=sua_senha
     FROM_EMAIL=noreply@livego.com
     FROM_NAME=LiveGo
     
       # Frontend
     FRONTEND_URL=http://localhost:3001
     
       # Cloudinary
     CLOUDINARY_CLOUD_NAME=seu_cloud_name
     CLOUDINARY_API_KEY=sua_api_key
     CLOUDINARY_API_SECRET=sua_api_secret
     ```

## 🛠 Executando o Projeto

### Desenvolvimento
```bash
# Modo desenvolvimento com hot-reload
yarn dev

# Ou execute diretamente
node src/index.js
```

### Produção
```bash
# Construir para produção
yarn build

# Iniciar em produção
node dist/index.js
```

A API estará disponível em `http://localhost:3000`

## 📚 Documentação da API

### Autenticação

#### `POST /api/auth/register`
Registra um novo usuário

**Body:**
```json
{
  "username": "usuario123",
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta de sucesso (201):**
```json
{
  "success": true,
  "token": "jwt.token.aqui",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "username": "usuario123",
    "email": "usuario@exemplo.com",
    "role": "user"
  }
}
```

#### `POST /api/auth/login`
Autentica um usuário

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "token": "jwt.token.aqui"
}
```

#### `GET /api/auth/me`
Obtém os dados do usuário autenticado

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "username": "usuario123",
    "email": "usuario@exemplo.com",
    "avatar": "https://res.cloudinary.com/...",
    "bio": "Olá, sou novo aqui!",
    "social": {},
    "role": "user",
    "status": "active",
    "streamKey": "stream_123456789",
    "followersCount": 0,
    "followingCount": 0
  }
}
```

### Usuários

#### `GET /api/users/:id`
Obtém o perfil de um usuário

**Parâmetros de URL:**
- `id` - ID do usuário

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "username": "usuario123",
    "avatar": "https://res.cloudinary.com/...",
    "bio": "Streamer apaixonado por jogos",
    "social": {
      "youtube": "youtube.com/usuario123",
      "twitter": "twitter.com/usuario123"
    },
    "isLive": false,
    "streamTitle": "Jogando o jogo mais difícil do mundo",
    "streamDescription": "Venha se divertir comigo!",
    "followersCount": 42,
    "followingCount": 15
  }
}
```

#### `PUT /api/users/me`
Atualiza o perfil do usuário autenticado

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
Content-Type: multipart/form-data
```

**Body (form-data):**
- `username` (opcional) - Novo nome de usuário
- `email` (opcional) - Novo email
- `bio` (opcional) - Nova biografia
- `social` (opcional, JSON) - Redes sociais
- `avatar` (opcional, file) - Nova foto de perfil

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "username": "novousuario123",
    "email": "novoemail@exemplo.com",
    "bio": "Nova biografia aqui",
    "avatar": "https://res.cloudinary.com/..."
  },
  "message": "Perfil atualizado com sucesso"
}
```

#### `POST /api/users/me/regenerate-stream-key`
Gera uma nova chave de stream para o usuário

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "data": {
    "streamKey": "stream_987654321"
  },
  "message": "Chave de stream atualizada com sucesso"
}
```

#### `POST /api/users/me/follow/:userId`
Segue ou deixa de seguir um usuário

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Parâmetros de URL:**
- `userId` - ID do usuário a ser seguido/deixado de seguir

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "data": {
    "isFollowing": true,
    "followersCount": 43
  },
  "message": "Usuário seguido com sucesso"
}
```

#### `GET /api/users/me/followers`
Lista os seguidores do usuário autenticado

**Headers:**
```
Authorization: Bearer [JWT_TOKEN]
```

**Parâmetros de consulta:**
- `page` (opcional) - Número da página (padrão: 1)
- `limit` (opcional) - Itens por página (padrão: 10)

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "60d21b4667d0d8992e610c86",
      "username": "seguidor1",
      "avatar": "https://res.cloudinary.com/...",
      "isFollowingBack": true
    },
    {
      "id": "60d21b4667d0d8992e610c87",
      "username": "seguidor2",
      "avatar": "https://res.cloudinary.com/...",
      "isFollowingBack": false
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "pages": 5,
    "limit": 10
  }
}
```

## 🛡️ Middlewares

### `auth.js`
Verifica se o usuário está autenticado e adiciona os dados do usuário ao objeto `req`

### `errorHandler.js`
Middleware para tratamento de erros global

### `upload.js`
Middleware para upload de arquivos usando multer

## 📧 Sistema de Email

A API envia emails para:
- Confirmação de cadastro
- Redefinição de senha
- Notificações de segurança
- Atualização de chave de stream

## 📦 Dependências Principais

- **Express** - Framework web
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação via token
- **Bcrypt** - Hash de senhas
- **Nodemailer** - Envio de emails
- **Cloudinary** - Armazenamento de mídia
- **Validator** - Validação de dados
- **Cors** - Middleware de segurança
- **Dotenv** - Gerenciamento de variáveis de ambiente

## 🧪 Testes

Para executar os testes:

```bash
yarn test
# ou
npm test
```

## 🚀 Deploy

1. Configure as variáveis de ambiente de produção
2. Construa o projeto:
   ```bash
   yarn build
   ```
3. Inicie o servidor em produção:
   ```bash
   NODE_ENV=production node dist/index.js
   ```

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
- `DELETE /api/follow/:userId` - Deixar de seguir um usuário
- `GET /api/follow/check/:userId` - Verificar se está seguindo um usuário

## Variáveis de Ambiente

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| PORT | Porta do servidor | 3000 |
| NODE_ENV | Ambiente de execução | development |
| MONGODB_URI | URI de conexão com o MongoDB | mongodb://mongo:27017/livego |
| JWT_SECRET | Chave secreta para JWT | livego_jwt_secret_key |
| JWT_EXPIRE | Tempo de expiração do token | 30d |
| SRS_API | URL da API do SRS | http://srs:1985/api/v1 |

## Docker

Para executar com Docker:

```bash
# Construir a imagem
docker-compose build

# Iniciar os containers
docker-compose up -d
```

## Testes

```bash
yarn test
```

## Licença

MIT
