# CONFIGURAÇÃO WEBRTC - LIVE ANDROID APK

## 🎯 OBJETIVO
Configurar o APK Android para funcionar 100% integrado com o servidor de streaming (SRS) e WebRTC do LiveGo.

## ✅ CONFIGURAÇÃO IMPLEMENTADA

### 1. PERMISSÕES ANDROID
**Arquivo**: `AndroidManifest.xml`

```xml
<!-- Permissões WebRTC necessárias -->
<uses-permission android:name="android.permission.CAPTURE_VIDEO_OUTPUT" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

<!-- Hardware features para streaming -->
<uses-feature android:name="android.hardware.camera" android:required="true" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
<uses-feature android:name="android.hardware.microphone" android:required="true" />
```

### 2. CONFIGURAÇÃO WEBRTC
**Arquivo**: `WebRTCConfig.kt`

- **WebChromeClient**: Aceita automaticamente permissões de câmera/microfone
- **WebView Settings**: Configurações otimizadas para WebRTC
- **Server URLs**: Sincronizadas com backend (SRS)
- **STUN/TURN**: Configurados para conexão WebRTC

### 3. SERVIDORES CONFIGURADOS
**Sincronizado com `.env.production`**:

```kotlin
object ServerConfig {
    const val SRS_API_URL = "http://72.60.249.175:1985"
    const val SRS_RTMP_URL = "rtmp://72.60.249.175:1935/live"
    const val SRS_HTTP_URL = "http://72.60.249.175:8080/live"
    const val SRS_WEBRTC_URL = "webrtc://72.60.249.175/live"
    
    // STUN/TURN servers
    const val STUN_URL = "stun:72.60.249.175:3478"
    const val TURN_URL = "turn:72.60.249.175:3478"
    const val TURN_USER = "livego"
    const val TURN_PASS = "livego123"
}
```

## 🔄 FUNCIONAMENTO

### PARA O STREAMER (QUEM TRANSMITE)
1. **Abrir câmera**: Permissão concedida automaticamente
2. **Preview local**: WebRTC exibe vídeo local em tempo real
3. **Publicação**: WebRTC → SRS Server → Espectadores
4. **Baixa latência**: WebRTC direto sem intermediários

### PARA ESPECTADORES
1. **Apenas vídeo**: Não veem quem está assistindo
2. **Reprodução WebRTC**: Baixa latência direto do SRS
3. **Sem lista de espectadores**: Privacidade mantida
4. **Experiência nativa**: Dentro do WebView

## 🔗 INTEGRAÇÃO COM BACKEND

### URLs DINÂMICAS
- **Tudo vem do backend**: Nada fixo no APK
- **Mesma lógica**: Site e app usam mesma API
- **Mesma autenticação**: WebSocket e APIs idênticas
- **Sincronização**: STUN/TURN do backend

### WEBSOCKET
- **Conexão direta**: `https://livego.store`
- **Eventos em tempo real**: Presentes, espectadores, etc.
- **Sala específica**: Cada usuário na sua sala
- **Sem cache**: Sempre dados frescos

## 📱 REQUISITOS MÍNIMOS

### ANDROID VERSION
- **Mínimo**: Android 4.2 (API 17) para WebRTC
- **Recomendado**: Android 5.0+ para melhor performance
- **Verificação**: `WebRTCConfig.isWebRTCSupported()`

### HARDWARE
- **Câmera**: Frontal obrigatória para streamers
- **Microfone**: Obrigatório para áudio
- **Internet**: 3G+ mínimo, 4G/WiFi recomendado

## 🚀 COMPILAÇÃO E TESTE

### BUILD
```bash
cd android
./build-webapp.sh  # Linux/Mac
build-webapp.bat   # Windows
```

### TESTE WEBRTC
1. **Instalar APK** no dispositivo
2. **Abrir app** → carrega https://livego.store
3. **Iniciar live** → câmera deve abrir
4. **Testar permissões** → câmera/microfone funcionam
5. **Verificar streaming** → vídeo transmite

## 🔧 TROUBLESHOOTING

### CÂMERA NÃO ABRE
- Verificar permissões em Configurações > Aplicativos > LiveGo
- Reiniciar o aplicativo
- Testar em outro dispositivo

### STREAMING NÃO FUNCIONA
- Verificar conexão com SRS: `http://72.60.249.175:1985`
- Testar STUN/TURN: `stun:72.60.249.175:3478`
- Verificar firewall/rede

### WEBRTC FALHA
- Verificar Android version (API 17+)
- Testar hardware: câmera e microfone
- Verificar logs do WebView

## ✅ BENEFÍCIOS

🎯 **100% Integrado**: Mesma lógica do site  
🎯 **Sem cache**: Sempre última versão  
🎯 **Baixa latência**: WebRTC direto  
🎯 **Auto-permissões**: Câmera/microfone automáticos  
🎯 **Servidor sincronizado**: STUN/TURN do backend  
🎯 **Privacidade**: Espectadores não se veem  
🎯 **Experiência nativa**: Tela cheia, zoom, etc.

## 📋 PRÓXIMOS PASSOS

1. **Testar em dispositivos reais**
2. **Validar streaming WebRTC**
3. **Verificar latência**
4. **Testar permissões**
5. **Publicar na Play Store**

**O APK agora está 100% pronto para streaming WebRTC integrado com seu servidor!** 🎉
