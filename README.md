# Live Streaming Platform

Plataforma de streaming ao vivo construída com SRS (Simple Realtime Server).

## Estrutura do Projeto

```
site/
├── public/                 # Arquivos estáticos
│   ├── css/               # Folhas de estilo
│   ├── js/                # JavaScript do cliente
│   ├── img/               # Imagens
│   └── fonts/             # Fontes
├── src/                   # Código-fonte
│   ├── server/            # Lógica do servidor
│   └── clients/           # Clientes (web, mobile, etc)
├── config/                # Arquivos de configuração
│   └── srs.conf           # Configuração do SRS
└── docker/                # Configurações do Docker
```

## Como Executar

1. Certifique-se de ter o Docker instalado
2. Inicie o contêiner do SRS:
   ```bash
   docker run -d --name srs -p 1935:1935 -p 1985:1985 -p 8080:8080 -p 8000:8000/udp -p 10080:10080/udp -e CANDIDATE=SEU_IP_LOCAL ossrs/srs:5
   ```
3. Inicie o servidor web local:
   ```bash
   node src/server/simple-server.js
   ```
4. Acesse a aplicação em `http://localhost:3000`

## Portas Utilizadas

- **1935**: RTMP (ingestão de stream)
- **1985**: HTTP API
- **8080**: HTTP Server (player e console)
- **8000/udp**: WebRTC
- **10080/udp**: SRT

## Desenvolvimento

Para desenvolvimento, você pode editar os arquivos em `public/` e `src/` conforme necessário. O servidor web local irá recarregar automaticamente as alterações.
