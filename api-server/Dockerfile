FROM node:18-alpine

WORKDIR /app

# Instala netcat para verificar a disponibilidade do MongoDB
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./

RUN yarn install

# Copiar o arquivo .env
COPY .env ./

COPY . .

# Torna o script executável
RUN chmod +x /app/startup.sh

EXPOSE 3000

# Usa o script de inicialização
CMD ["/app/startup.sh"]