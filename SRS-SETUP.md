# Configuração SRS - Instruções de Teste

## Configuração Implementada

Seguindo estritamente a documentação oficial do SRS (ossrs/srs:6)

### 1. Docker Compose Corrigido
- Usando imagem oficial `ossrs/srs:6`
- Portas conforme documentação: 1935 (RTMP), 1985 (API), 8080 (HTTP), 8000 (WebRTC)
- Variável `CANDIDATE` configurada para IP externo
- WebRTC habilitado com RTMP-to-RTC e RTC-to-RTMP

### 2. APIs SRS Corretas
- Publish: `POST /rtc/v1/publish`
- Play: `POST /rtc/v1/play`  
- Stop: `POST /rtc/v1/stop`
- URLs base: `http://srs-server:1985` (Docker) / `http://localhost:1985` (local)

### 3. Configuração WebRTC
- TURN: `turn:coturn-server:3478`
- STUN: `stun:coturn-server:3478`
- SRS WebRTC: `webrtc://srs-server:8000/live`
- HLS: `http://srs-server:8080/live`

## Como Testar

### 1. Subir os Serviços
```bash
docker-compose up -d
```

### 2. Verificar SRS
```bash
# Verificar logs do SRS
docker logs srs-server

# Verificar API do SRS
curl http://localhost:1985/api/v1/summaries
```

### 3. Testar Publicação (FFmpeg)
```bash
ffmpeg -re -i ./video-teste.mp4 -c copy -f flv rtmp://localhost/live/teststream
```

### 4. Testar WebRTC
- Publicar: http://localhost:1985/rtc/v1/whip/?app=live&stream=teststream
- Assisti: http://localhost:1985/rtc/v1/whep/?app=live&stream=teststream

### 5. Testar HLS
```bash
curl http://localhost:8080/live/teststream.m3u8
```

## URLs de Teste no Navegador

### WebRTC Player
- http://localhost:1985/players/whep.html?autostart=true&app=live&stream=teststream

### HTTP-FLV Player  
- http://localhost:8080/players/srs_player.html?autostart=true&stream=teststream.flv

### HLS Player
- http://localhost:8080/players/srs_player.html?autostart=true&stream=teststream.m3u8

## Verificação de Conectividade

### 1. Verificar Portas
```bash
# Portas SRS
netstat -tulpn | grep :1935  # RTMP
netstat -tulpn | grep :1985  # API  
netstat -tulpn | grep :8080  # HTTP
netstat -tulpn | grep :8000  # WebRTC UDP

# Portas TURN
netstat -tulpn | grep :3478
```

### 2. Verificar WebRTC
```bash
# Testar API WebRTC
curl -X POST http://localhost:1985/rtc/v1/play \
  -H "Content-Type: application/json" \
  -d '{"streamurl":"webrtc://localhost:8000/live/teststream","sdp":""}'
```

## Configuração para Produção

1. **IP Externo**: Alterar `SRS_CANDIDATE` no `.env` para o IP público real
2. **HTTPS**: Configurar certificado SSL para WebRTC em produção
3. **Firewall**: Liberar portas 1935, 1985, 8080, 8000/udp, 3478

## Troubleshooting

### SRS não inicia
- Verificar se as portas estão em uso
- Verificar variável CANDIDATE no .env
- Verificar logs: `docker logs srs-server`

### WebRTC não conecta
- Verificar porta 8000/udp aberta
- Verificar configuração CANDIDATE
- Testar com ferramentas SRS

### TURN não funciona
- Verificar contêiner coturn-server
- Testar com cliente STUN/TURN

## Documentação Oficial

- SRS WebRTC: https://ossrs.net/lts/en-us/docs/v5/doc/webrtc
- SRS Docker: https://awesome-docker-compose.com/srs
- SRS GitHub: https://github.com/ossrs/srs
