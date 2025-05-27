# Estágio de construção
FROM node:18-alpine AS builder

# Criar diretório da aplicação
WORKDIR /usr/src/app

# Copiar arquivos de definição de dependências
COPY package*.json ./

COPY yarn.lock ./


# Instalar dependências
RUN yarn install --frozen-lockfile

# Copiar código-fonte
COPY . .

# Estágio de produção
FROM node:18-alpine

WORKDIR /usr/src/app

# Copiar node_modules e código-fonte do estágio de construção
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app .

# Expor a porta da aplicação
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["yarn", "dev"]
