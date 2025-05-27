# Documentação Técnica - LiveGo Backend

## 📌 Índice
1. [Visão Geral](#-visão-geral)
2. [Estrutura do Projeto](#-estrutura-do-projeto)
3. [Modelo de Dados](#-modelo-de-dados)
4. [Autenticação](#-autenticação)
5. [Endpoints da API](#-endpoints-da-api)
6. [Sistema de Email](#-sistema-de-email)
7. [Upload de Mídia](#-upload-de-mídia)
8. [Tratamento de Erros](#-tratamento-de-erros)
9. [Segurança](#-segurança)
10. [Variáveis de Ambiente](#-variáveis-de-ambiente)

## 🌐 Visão Geral

O backend do LiveGo é uma API RESTful desenvolvida em Node.js com Express, projetada para fornecer todas as funcionalidades necessárias para uma plataforma de streaming ao vivo. A API utiliza MongoDB como banco de dados e implementa autenticação baseada em JWT.

## 📁 Estrutura do Projeto

```
src/
├── config/           # Configurações do servidor e banco de dados
├── controllers/      # Lógica dos controladores
│   ├── auth.controller.js
│   └── user.controller.js
├── middleware/       # Middlewares personalizados
│   ├── auth.js
│   └── errorHandler.js
├── models/          # Modelos do MongoDB
│   └── User.js
├── routes/          # Definição de rotas
│   ├── auth.routes.js
│   └── user.routes.js
├── utils/           # Utilitários e helpers
│   ├── cloudinary.js
│   ├── email.js
│   └── errorResponse.js
└── views/           # Templates de email
    └── emails/
        ├── account-locked.ejs
        ├── password-reset.ejs
        ├── stream-key-updated.ejs
        └── welcome.ejs
```

## 🗃️ Modelo de Dados

### Usuário (User)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `username` | String | Nome de usuário único |
| `email` | String | Email do usuário (único) |
| `password` | String | Hash da senha |
| `role` | String | Papel do usuário (user, admin) |
| `status` | String | Status da conta (active, suspended) |
| `avatar` | String | URL da imagem de perfil |
| `bio` | String | Biografia do usuário |
| `social` | Object | Links para redes sociais |
| `streamKey` | String | Chave única para streaming |
| `isLive` | Boolean | Indica se o usuário está transmitindo |
| `streamTitle` | String | Título da transmissão atual |
| `streamDescription` | String | Descrição da transmissão |
| `followers` | Array | Lista de IDs de seguidores |
| `following` | Array | Lista de IDs de usuários seguidos |
| `blockedUsers` | Array | Lista de IDs de usuários bloqueados |

## 🔐 Autenticação

A autenticação é feita via JWT (JSON Web Tokens). O token deve ser enviado no header `Authorization` no formato:
```
Authorization: Bearer <token>
```

### Fluxo de Autenticação
1. **Registro**: `POST /api/auth/register`
   - Cria um novo usuário
   - Retorna token JWT

2. **Login**: `POST /api/auth/login`
   - Valida credenciais
   - Retorna token JWT

3. **Acesso Protegido**:
   - Todas as rotas protegidas verificam o token JWT
   - O token expira após o tempo definido em `JWT_EXPIRE`

## 🌐 Endpoints da API

### Autenticação

#### `POST /api/auth/register`
Registra um novo usuário.

**Corpo da Requisição:**
```json
{
  "username": "novousuario",
  "email": "usuario@exemplo.com",
  "password": "senhasegura123"
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "token": "jwt.token.aqui",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "username": "novousuario",
    "email": "usuario@exemplo.com"
  }
}
```

#### `POST /api/auth/login`
Autentica um usuário.

**Corpo da Requisição:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senhasegura123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "token": "jwt.token.aqui"
}
```

### Usuários

#### `GET /api/users/me`
Obtém os dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "username": "usuario123",
    "email": "usuario@exemplo.com",
    "avatar": "https://res.cloudinary.com/...",
    "bio": "Streamer apaixonado por jogos",
    "streamKey": "stream_123456789",
    "isLive": false,
    "followersCount": 42,
    "followingCount": 15
  }
}
```

#### `PUT /api/users/me/avatar`
Atualiza o avatar do usuário.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (form-data):**
- `avatar`: Arquivo de imagem

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "avatar": "https://res.cloudinary.com/..."
  },
  "message": "Avatar atualizado com sucesso"
}
```

#### `POST /api/users/me/regenerate-stream-key`
Gera uma nova chave de stream.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "streamKey": "stream_987654321"
  },
  "message": "Chave de stream atualizada com sucesso"
}
```

## ✉️ Sistema de Email

A API envia emails para:
- Boas-vindas após registro
- Redefinição de senha
- Atualização de chave de stream
- Notificações de segurança

### Templates de Email

1. **Bem-vindo** (`welcome.ejs`)
   - Enviado após registro
   - Inclui instruções iniciais

2. **Redefinição de Senha** (`password-reset.ejs`)
   - Inclui link para redefinir senha
   - Válido por 1 hora

3. **Chave de Stream Atualizada** (`stream-key-updated.ejs`)
   - Notifica sobre alteração na chave de stream
   - Inclui a nova chave

4. **Conta Bloqueada** (`account-locked.ejs`)
   - Enviado após várias tentativas de login falhas
   - Inclui instruções para desbloqueio

## 📤 Upload de Mídia

O upload de arquivos (como avatares) é feito através do Cloudinary. O fluxo é:

1. Cliente envia o arquivo como `multipart/form-data`
2. Servidor faz upload para o Cloudinary
3. URL pública é retornada e salva no banco de dados

**Limitações:**
- Tipos permitidos: JPG, PNG, GIF
- Tamanho máximo: 5MB
- Dimensões máximas: 2000x2000px

## ⚠️ Tratamento de Erros

A API retorna erros padronizados no formato:

```json
{
  "success": false,
  "error": "Mensagem de erro descritiva",
  "code": "CODIGO_DO_ERRO"
}
```

### Códigos de Erro Comuns

| Código | Descrição | Status HTTP |
|--------|-----------|-------------|
| `AUTH_001` | Credenciais inválidas | 401 |
| `AUTH_002` | Token inválido ou expirado | 401 |
| `AUTH_003` | Acesso não autorizado | 403 |
| `USER_001` | Usuário não encontrado | 404 |
| `USER_002` | Email já em uso | 400 |
| `USER_003` | Nome de usuário já em uso | 400 |
| `VALIDATION_001` | Dados inválidos | 400 |
| `SERVER_001` | Erro interno do servidor | 500 |

## 🔒 Segurança

### Medidas Implementadas

1. **Proteção contra XSS**
   - Headers de segurança habilitados
   - Sanitização de entrada

2. **Proteção contra CSRF**
   - Uso de tokens JWT em cabeçalhos HTTP
   - Validação de origem das requisições

3. **Segurança de Senhas**
   - Hash com bcrypt
   - Força mínima de senha exigida

4. **Proteção contra Força Bruta**
   - Limite de tentativas de login
   - Bloqueio temporário de conta

5. **Segurança em Headers**
   - CORS configurado
   - Headers de segurança HTTP
   - HSTS habilitado

## ⚙️ Variáveis de Ambiente

| Variável | Obrigatório | Descrição | Valor Padrão |
|----------|-------------|-----------|--------------|
| `NODE_ENV` | Sim | Ambiente de execução | `development` |
| `PORT` | Sim | Porta do servidor | `3000` |
| `MONGO_URI` | Sim | URI de conexão com MongoDB | - |
| `JWT_SECRET` | Sim | Chave secreta para JWT | - |
| `JWT_EXPIRE` | Não | Tempo de expiração do token | `30d` |
| `SMTP_HOST` | Sim | Servidor SMTP | - |
| `SMTP_PORT` | Sim | Porta SMTP | `587` |
| `SMTP_EMAIL` | Sim | Email do remetente | - |
| `SMTP_PASSWORD` | Sim | Senha do email | - |
| `CLOUDINARY_CLOUD_NAME` | Sim | Nome da conta Cloudinary | - |
| `CLOUDINARY_API_KEY` | Sim | API Key do Cloudinary | - |
| `CLOUDINARY_API_SECRET` | Sim | API Secret do Cloudinary | - |

## 📦 Dependências Principais

- **express**: Framework web
- **mongoose**: ODM para MongoDB
- **jsonwebtoken**: Autenticação JWT
- **bcryptjs**: Hash de senhas
- **cloudinary**: Upload de mídia
- **nodemailer**: Envio de emails
- **cors**: Middleware CORS
- **dotenv**: Gerenciamento de variáveis de ambiente
- **express-rate-limit**: Limitação de taxa
- **helmet**: Segurança HTTP
- **morgan**: Logging de requisições

## 🚀 Implantação

### Requisitos para Produção

1. Servidor Node.js (recomendado: v18+)
2. Banco de dados MongoDB (recomendado: Atlas MongoDB)
3. Conta no Cloudinary para armazenamento de mídia
4. Serviço de email (SMTP)

### Passos para Implantação

1. **Configuração do Ambiente**
   ```bash
   # Instalar dependências
   npm install --production
   
   # Construir o projeto (se necessário)
   npm run build
   ```

2. **Configurar Variáveis de Ambiente**
   - Criar arquivo `.env` com as configurações de produção
   - Garantir que todas as variáveis necessárias estejam definidas

3. **Iniciar o Servidor**
   ```bash
   # Modo produção
   NODE_ENV=production node src/index.js
   
   # Ou usando PM2 (recomendado)
   pm2 start src/index.js --name "livego-api"
   ```

4. **Configurar Proxy Reverso (Nginx/Apache)**
   - Configurar SSL/TLS
   - Configurar balanceamento de carga (se necessário)
   - Configurar cache e compressão

## 📝 Notas de Atualização

### v1.0.0 (2025-05-26)
- Versão inicial da API
- Autenticação JWT
- Gerenciamento de usuários
- Upload de mídia com Cloudinary
- Sistema de emails transacionais
- Documentação completa

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para obter mais detalhes.
