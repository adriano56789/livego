# 🧪 Testar WebRTC no App Real

## 📋 Ambiente Configurado

### Arquivos de Configuração
- ✅ `.env.localdev` - Configurações locais (localhost)
- ✅ `.env.test` - Configurações VPS (produção)
- ✅ `testar-webrtc-no-app.js` - Script de teste

### Configurações Locais
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_SRS_API_URL=http://localhost:1985
VITE_SRS_RTMP_URL=rtmp://localhost:1935/live
VITE_SRS_HTTP_URL=http://localhost:8080/live
VITE_SRS_WEBRTC_URL=webrtc://localhost/live
VITE_STUN_SERVER_URL=stun:localhost:3478
VITE_TURN_SERVER_URL=turn:localhost:3478
VITE_TURN_USERNAME=livego
VITE_TURN_PASSWORD=livego123
```

## 🚀 Como Testar

### 1. Subir Infraestrutura Local
```bash
docker-compose up -d
```

### 2. Usar Configuração Local
```bash
# Copiar configuração local
cp .env.localdev .env.local

# Ou configurar manualmente no Vite
```

### 3. Iniciar Frontend
```bash
npm run dev
# Vite vai carregar .env.local automaticamente
```

### 4. Testar WebRTC no App

#### Opção A: Via Console do Navegador
1. Abrir o app LiveGo em `http://localhost:5173`
2. Abrir console (F12)
3. Copiar e colar o conteúdo de `testar-webrtc-no-app.js`
4. Executar: `testarWebRTC()`

#### Opção B: Pelo App Interface
1. Ir na tela "Go Live"
2. Preencher dados da stream
3. Clicar em "Start Streaming"
4. Permitir câmera/microfone
5. Abrir outra aba para testar viewer

## 🔧 Fluxo de Teste Completo

### Publisher (Host)
1. **Criar Stream**: POST `/api/streams`
2. **Iniciar WebRTC**: `webrtcService.startPublish()`
3. **Capturar Mídia**: Câmera + microfone
4. **Conectar SRS**: STUN/TURN + SDP handshake

### Viewer (Espectador)
1. **Entrar na Live**: POST `/api/streams/:id/join`
2. **Iniciar Playback**: `webrtcService.startPlay()`
3. **Receber Tracks**: Vídeo + áudio em tempo real

## 🐛 Troubleshooting

### Erros Comuns

#### TypeScript: "Não é possível localizar módulo"
```bash
# Reiniciar servidor de desenvolvimento
npm run dev

# Limpar cache
rm -rf node_modules/.vite
npm run dev
```

#### WebRTC: "ICE connection failed"
```bash
# Verificar se coturn está rodando
docker ps | grep coturn

# Verificar portas
netstat -tulpn | grep 3478
```

#### SRS: "Handshake failed"
```bash
# Verificar logs do SRS
docker logs srs-server

# Testar API do SRS
curl http://localhost:1985/api/v1/streams
```

## 📊 Logs Importantes

### Publisher Deve Mostrar:
```
[WebRTC Service] Mídia local capturada com sucesso
[WebRTC Service] Offer gerado com ICE candidates
[WebRTC Service] Conexão de publish estabelecida
```

### Viewer Deve Mostrar:
```
[WebRTC Service] Track recebido: video
[WebRTC Service] Track recebido: audio
[WebRTC Service] Conexão de playback estabelecida
```

## ✅ Checklist de Validação

- [ ] Docker containers rodando
- [ ] Configuração .env.local ativa
- [ ] TypeScript sem erros
- [ ] WebRTC service importando
- [ ] Câmera sendo capturada
- [ ] STUN/TURN conectando
- [ ] SRS handshake funcionando
- [ ] Viewer recebendo vídeo
- [ ] Áudio sincronizado

## 🌐 Testar em Diferentes Redes

### Rede Local
- STUN deve funcionar
- TURN opcional

### Rede Externa
- STUN + TURN obrigatório
- Testar NAT traversal

### Rede Corporativa
- TURN essencial
- Verificar firewall

## 🚀 Para Produção

Quando tudo estiver funcionando localmente:

1. **Mudar para configuração VPS**:
   ```bash
   cp .env.test .env.local
   ```

2. **Testar com servidor real**:
   - Usar URLs da VPS
   - Validar conectividade

3. **Subir para produção**:
   - Deploy na VPS
   - Configurar domínio
   - Testar final

---

**Ambiente local pronto para testes reais no app! 🎯**
