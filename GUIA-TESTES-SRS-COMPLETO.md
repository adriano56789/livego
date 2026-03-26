# Guia Completo de Testes Locais SRS - LiveGo

## Configuração Atual
- **RTMP**: rtmp://localhost:1935/live
- **HTTP API**: http://localhost:1985
- **HLS/HTTP-FLV**: http://localhost:8080
- **WebRTC**: UDP 8000
- **IP Público**: 72.60.249.175

## 1. Teste RTMP com OBS (Transmissão)

### Configurar OBS:
1. **Fonte de Vídeo**: Webcam ou captura de tela
2. **Configurações > Stream**:
   - Serviço: Personalizado
   - Servidor: `rtmp://localhost:1935/live`
   - Chave de Stream: `test123`
3. Clique em "Iniciar Transmissão"

### Verificar no Terminal:
```bash 
curl http://localhost:1985/api/v1/summaries
```

## 2. Teste WebRTC (Visualização no Browser)

### Players WebRTC Disponíveis:
- **Player Principal**: http://localhost:8080/players/rtc_player.html
- **Publisher**: http://localhost:8080/players/rtc_publisher.html

### Para assistir stream RTMP via WebRTC:
1. Abra: http://localhost:8080/players/rtc_player.html
2. URL: `webrtc://localhost/live/test123`
3. Clique "Play"

### Para publicar via WebRTC:
1. Abra: http://localhost:8080/players/rtc_publisher.html
2. URL: `webrtc://localhost/live/webrtc_test`
3. Permitir câmera/microfone
4. Clique "Publish"

## 3. Teste HLS (iOS/Android)

### URLs HLS:
- **Stream OBS**: http://localhost:8080/live/test123.m3u8
- **Stream WebRTC**: http://localhost:8080/live/webrtc_test.m3u8

### Testar em:
- Safari (iOS/Mac)
- VLC Player
- Chrome (com extensão HLS)

## 4. Teste HTTP-FLV (Flash Alternative)

### URLs FLV:
- **Stream OBS**: http://localhost:8080/live/test123.flv
- **Stream WebRTC**: http://localhost:8080/live/webrtc_test.flv

### Testar com:
- VLC Player
- Players FLV online

## 5. Teste com FFmpeg (Linha de Comando)

### Enviar stream de teste:
```bash
ffmpeg -re -i video.mp4 -c copy -f flv rtmp://localhost:1935/live/ffmpeg_test
```

### Stream de teste (se não tiver vídeo):
```bash
ffmpeg -re -f lavfi -i testsrc=duration=300:size=320x240:rate=30 -c:v libx264 -preset veryfast -f flv rtmp://localhost:1935/live/testsrc
```

## 6. Teste com SRT (Protocolo Robusto)

### Enviar via SRT:
```bash
ffmpeg -re -i video.mp4 -c copy -f mpegts 'srt://localhost:10080?streamid=#!::r=live/srt_test'
```

## 7. Verificação de Status

### API Endpoints:
```bash
# Status geral
curl http://localhost:1985/api/v1/summaries

# Streams ativos
curl http://localhost:1985/api/v1/streams

# Detalhes de stream específico
curl http://localhost:1985/api/v1/streams/live/test123
```

## 8. Teste Completo - Fluxo Integrado

### Passo 1: Iniciar SRS
```bash
docker run --rm -it -p 1935:1935 -p 8080:8080 -p 1985:1985 -p 8000:8000/udp -v $(pwd)/srs.conf:/conf/srs.conf ossrs/srs:5
```

### Passo 2: Iniciar transmissão OBS
- Servidor: `rtmp://localhost:1935/live`
- Chave: `live_test`

### Passo 3: Verificar em múltiplos players
1. **WebRTC**: http://localhost:8080/players/rtc_player.html → `webrtc://localhost/live/live_test`
2. **HLS**: http://localhost:8080/live/live_test.m3u8 (Safari/VLC)
3. **FLV**: http://localhost:8080/live/live_test.flv (VLC)

### Passo 4: Testar chat e interação
- Acessar frontend LiveGo
- Entrar na sala como espectador
- Enviar presentes e mensagens

## 9. Teste de Latência

### Latência Esperada:
- **RTMP → WebRTC**: 150-400ms
- **RTMP → HLS**: 3-10s
- **RTMP → FLV**: 1-3s

### Como medir:
1. Mostrar relógio na câmera
2. Cronometrar tempo até aparecer no player
3. Comparar diferentes protocolos

## 10. Troubleshooting

### Stream não aparece?
```bash
# Verificar se stream está ativo
curl http://localhost:1985/api/v1/streams

# Verificar logs do SRS
docker logs [container_id]
```

### WebRTC não conecta?
1. Verificar se porta UDP 8000 está aberta
2. Verificar IP candidato no config
3. Testar com IP local: `candidate 192.168.3.12`

### OBS não conecta?
1. Verificar firewall na porta 1935
2. Testar com: `telnet localhost 1935`
3. Verificar se SRS está rodando

## 11. URLs de Teste Rápidas

### Transmissão:
- OBS: `rtmp://localhost:1935/live` + chave `quick_test`

### Visualização:
- WebRTC: http://localhost:8080/players/rtc_player.html → `webrtc://localhost/live/quick_test`
- HLS: http://localhost:8080/live/quick_test.m3u8
- FLV: http://localhost:8080/live/quick_test.flv

### Status:
- API: http://localhost:1985/api/v1/summaries
- Streams: http://localhost:1985/api/v1/streams

## 12. Teste com IP Local vs IP Público

### Para testes locais (rede interna):
- Mudar candidate para: `192.168.3.12`
- Usar: `webrtc://192.168.3.12/live/test`

### Para testes externos:
- Manter candidate: `72.60.249.175`
- Usar: `webrtc://72.60.249.175/live/test`

## 13. Integração com LiveGo Frontend

### No frontend LiveGo:
1. Configurar URLs no .env:
   ```
   REACT_APP_SRS_API_URL=http://localhost:1985
   REACT_APP_SRS_RTMP_URL=rtmp://localhost:1935/live
   REACT_APP_SRS_HTTP_URL=http://localhost:8080/live
   ```

2. Testar transmissão completa:
   - Criar sala no LiveGo
   - Transmitir via OBS
   - Assistir via interface LiveGo
   - Testar presentes e chat

---

## Resumo dos Testes Essenciais

1. ✅ **OBS → RTMP**: `rtmp://localhost:1935/live` + `test123`
2. ✅ **WebRTC Player**: http://localhost:8080/players/rtc_player.html → `webrtc://localhost/live/test123`
3. ✅ **HLS Player**: http://localhost:8080/live/test123.m3u8
4. ✅ **API Status**: http://localhost:1985/api/v1/streams
5. ✅ **Integração LiveGo**: Frontend + Backend + SRS

Este guia cobre todos os testes reais possíveis com SRS localmente, sem simulações!
