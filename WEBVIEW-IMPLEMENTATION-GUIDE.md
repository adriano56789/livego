# WebView Streaming Implementation Guide

## 🎯 OBJETIVO
Implementar streaming de vídeo otimizado para WebView (Android/iOS) usando tecnologia web padrão.

## 📱 ARQUITETURA WEBVIEW

### Como Funciona:
1. **WebView** = Container nativo que carrega página web
2. **Site** = Aplicação web React/Vite
3. **APK** = Basicamente um navegador com seu site
4. **Streaming** = HTML5 video + HLS.js/WebRTC

### Vantagens:
- ✅ **Código único**: Same codebase para web e app
- ✅ **Atualizações instantâneas**: Basta atualizar o site
- ✅ **Manutenção simples**: Uma base de código
- ✅ **Compatibilidade**: Padrões web abertos

## 🎥 COMPONENTES DE STREAMING

### 1. WebViewStreamPlayer (Principal)
```typescript
// Otimizado para WebView
- HTML5 video element
- HLS.js para reprodução
- WebRTC para broadcast
- Fallbacks múltiplos
- Indicadores de status
```

### 2. WebVideoPlayer (Alternativa)
```typescript
// Mais completo, com mais opções
- Configurações avançadas de HLS
- Debug mode
- Tratamento robusto de erros
```

## 🔧 IMPLEMENTAÇÃO

### Para Broadcaster (quem transmite):
```typescript
// 1. Capturar câmera
const mediaStream = await navigator.mediaDevices.getUserMedia({
  video: { width: 1280, height: 720 },
  audio: true
});

// 2. Exibir preview
videoRef.current.srcObject = mediaStream;

// 3. Enviar via WebRTC
await webRTCService.startPublish(webrtcUrl, streamKey);
```

### Para Viewer (quem assiste):
```typescript
// 1. Obter URL HLS
const hlsUrl = `https://livego.store:8000/live/${streamId}.m3u8`;

// 2. Usar HLS.js
const hls = new Hls();
hls.loadSource(hlsUrl);
hls.attachMedia(videoElement);

// 3. Fallbacks
- HLS.js (primeira opção)
- HLS nativo (Safari/iOS)
- Streaming direto (fallback)
```

## 🌐 URLs E PROTOCOLOS

### WebRTC (Broadcast):
```
Local: wss://localhost:8000/live/streamId
Produção: wss://livego.store:8000/live/streamId
```

### HLS (View):
```
Local: http://localhost:8000/live/streamId.m3u8
Produção: https://livego.store:8000/live/streamId.m3u8
```

### STUN/TURN:
```
STUN: stun:livego.store:3478
TURN: turn:livego.store:3478
```

## 📋 CONFIGURAÇÃO WEBVIEW

### Android (WebView):
```java
// Habilitar WebRTC e media
webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
webView.getSettings().setAllowFileAccessFromFileURLs(true);
webView.getSettings().setAllowUniversalAccessFromFileURLs(true);

// Permissões necessárias
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

### iOS (WKWebView):
```swift
// Habilitar media
configuration.mediaTypesRequiringUserActionForPlayback = []
configuration.allowsInlineMediaPlayback = true

// Permissões necessárias
NSCameraUsageDescription
NSMicrophoneUsageDescription
```

## 🔄 FLUXO DE STREAMING

### 1. Iniciar Transmissão (Broadcaster):
```
1. Usuário clica "Go Live"
2. Solicitar permissão de câmera/microfone
3. Capturar mídia local
4. Conectar ao SRS via WebRTC
5. Iniciar streaming
6. Exibir preview local
```

### 2. Assistir (Viewer):
```
1. Usuário entra na sala
2. Obter URL HLS da stream
3. Tentar HLS.js
4. Fallback para HLS nativo
5. Fallback para streaming direto
6. Reproduzir vídeo
```

## 🛠️ TROUBLESHOOTING

### Problemas Comuns:

#### Câmera não funciona:
```javascript
// Verificar suporte
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  console.error('Câmera não suportada');
}

// Solicitar permissão
try {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
} catch (error) {
  console.error('Permissão negada:', error);
}
```

#### Vídeo não reproduz:
```javascript
// Tentar com muted
videoElement.muted = true;
await videoElement.play();

// Adicionar listener para interação
document.addEventListener('click', async () => {
  await videoElement.play();
}, { once: true });
```

#### WebRTC não conecta:
```javascript
// Verificar se URL está correta
if (!webrtcUrl.startsWith('wss://')) {
  console.error('URL WebRTC inválida');
}

// Verificar se TURN server está online
fetch('https://livego.store:3478')
  .then(() => console.log('TURN online'))
  .catch(() => console.error('TURN offline'));
```

## 📱 MELHORIAS PARA WEBVIEW

### 1. Otimizações:
- Reduzir uso de memória
- Minimizar requisições de rede
- Cache agressivo
- Lazy loading

### 2. Performance:
- Hardware acceleration
- Video codecs otimizados
- Resolução adaptativa
- Bitrate dinâmico

### 3. UX:
- Indicadores de loading
- Botão de retry
- Fallbacks visuais
- Mensagens de erro claras

## 🚀 DEPLOY

### 1. Backend:
```bash
# Usar script de deploy
./deploy-streaming-vps.ps1
```

### 2. Frontend:
```bash
# Build para produção
npm run build

# Otimizado para WebView
npm run build:webview
```

### 3. WebView:
```bash
# Gerar APK
# (Depende da plataforma de WebView)
```

## 📊 MONITORAMENTO

### Logs importantes:
```javascript
// WebRTC connection
console.log('WebRTC connected:', pc.connectionState);

// HLS playback
console.log('HLS level:', hls.currentLevel);

// Video metrics
console.log('Video dimensions:', videoElement.videoWidth, videoElement.videoHeight);
```

### Métricas:
- Latência de WebRTC
- Buffer level do HLS
- Taxa de frames
- Conexão network

## 🎯 CONCLUSÃO

Esta implementação foca em:
- **Compatibilidade máxima** com WebView
- **Performance otimizada** para mobile
- **Fallbacks robustos** para diferentes cenários
- **UX amigável** com indicadores claros
- **Manutenção simples** com código web padrão

O resultado é um streaming que funciona tanto no browser quanto no WebView com a mesma base de código! 🎉
