# 🧪 Como Testar o Fluxo WebRTC Implementado

## ✅ **Implementação Completa**

Todos os debugs e middleware foram implementados para identificar o problema do "vídeo invisível".

---

## 🚀 **Passos para Testar**

### **1. Preparar o Ambiente**

#### **Iniciar Docker Desktop:**
- Abra o Docker Desktop
- Aguarde ele inicializar completamente

#### **Subir os Serviços:**
```bash
# No diretório do projeto
docker-compose up -d --build
```

#### **Verificar se Tudo Subiu:**
```bash
# Verificar containers
docker ps

# Verificar logs
docker-compose logs -f
```

---

### **2. Acessar a Aplicação**

#### **Iniciar o Frontend:**
```bash
# No diretório do projeto
npm run dev
# ou
yarn dev
```

#### **Acessar no Navegador:**
- Abra: `http://localhost:3000`
- Faça login com sua conta
- Crie uma nova stream

---

### **3. Testar o Publisher (Transmissão)**

#### **No Console do Navegador:**
```javascript
// Carregar o script de teste
const script = document.createElement('script');
script.src = './test-webrtc-debug.js';
document.head.appendChild(script);

// Executar o teste
testWebRTCFlow();
```

#### **Logs Esperados no Publisher:**
```
✅ [GoLive] Publicando com streamKey real: stream_1234567890_abc123
✅ [PUBLISHER CAPTURA] { videoTracks: 1, audioTracks: 1, videoEnabled: true, audioEnabled: true }
✅ [PUBLISHER TRACKS] { totalSenders: 2, videoSenders: 1, audioSenders: 1 }
✅ [PUBLISHER SDP] { candidates: 4, videoLines: 1, audioLines: 1, iceState: complete }
✅ [PUBLISH] usuario123 publishing to webrtc://72.60.249.175/live/stream_1234567890_abc123
✅ [PUBLISH DEBUG] { streamId: "stream_1234567890_abc123", hostId: "usuario123", streamKey: "stream_1234567890_abc123" }
✅ [PUBLISH] SRS Response { code: 0, hasSdp: true, candidates: 8, success: true }
✅ [WebRTC Service] Publish connection established successfully.
```

---

### **4. Verificar se SRS Recebeu**

#### **Enquanto Publisher Estiver Ativo:**
```bash
# Verificar streams no SRS
curl http://72.60.249.175:1985/api/v1/streams/

# Verificar stream específica
curl http://72.60.249.175:1985/api/v1/streams/stream_1234567890_abc123

# Verificar status do SRS
curl http://72.60.249.175:1985/api/v1/summaries/
```

#### **Resultado Esperado:**
- Stream deve aparecer na lista do SRS
- Code deve ser 0 (sucesso)
- Candidates devem estar presentes

---

### **5. Testar o Viewer (Recepção)**

#### **Em Outra Aba/Anônima:**
```javascript
// Entrar na mesma stream como viewer
testViewerPlay('stream_1234567890_abc123');
```

#### **Logs Esperados no Viewer:**
```
✅ [VIEWER TRACK RECEBIDA] { kind: "video", enabled: true, muted: false, readyState: "live", streamId: "rtc-xxxx", totalStreams: 1 }
✅ [VIEWER STREAM ATUALIZADO] { totalTracks: 1, videoTracks: 1, audioTracks: 0 }
✅ [VIDEO ELEMENT] { videoWidth: 1280, videoHeight: 720, readyState: 4, streamTracks: 1, isPlaying: true }
```

---

## 🐛 **Diagnóstico dos Problemas**

### **Se ALGUM Log Falhar:**

#### **Publisher não captura vídeo:**
- `[PUBLISHER CAPTURA]` videoTracks: 0
- **Causa:** `getUserMedia` falhou
- **Solução:** Verificar permissões da câmera

#### **Publisher não adiciona tracks:**
- `[PUBLISHER TRACKS]` videoSenders: 0
- **Causa:** `addTrack` falhou
- **Solução:** Verificar se PC está null

#### **SRS não recebe:**
- `[PUBLISH] SRS Response` code != 0
- **Causa:** URL incorreta ou middleware bloqueando
- **Solução:** Verificar streamKey e formato da URL

#### **Viewer não recebe tracks:**
- `[VIEWER TRACK RECEBIDA]` não aparece "video"
- **Causa:** SRS não enviando ou ICE falhando
- **Solução:** Verificar conexão ICE e estado do SRS

#### **Video element não exibe:**
- `[VIDEO ELEMENT]` videoWidth: 0
- **Causa:** Stream não chegou ao elemento
- **Solução:** Verificar ontrack e srcObject

---

## 📋 **Checklist de Sucesso**

- [ ] Docker Desktop rodando
- [ ] Serviços sobem sem erros
- [ ] Frontend acessível em localhost:3000
- [ ] Publisher captura câmera (videoTracks: 1)
- [ ] Publisher adiciona tracks (videoSenders: 1)
- [ ] SRS recebe stream (code: 0)
- [ ] Viewer recebe track (kind: "video")
- [ ] Video element exibe vídeo (videoWidth > 0)

---

## 🎯 **Resultado Final**

Se todos os itens acima forem ✅, o problema de "vídeo invisível" está resolvido!

Se algum item for ❌, os logs detalhados vão mostrar exatamente onde está o problema.

**A implementação completa permite diagnosticar e corrigir qualquer problema no fluxo WebRTC!** 🚀
