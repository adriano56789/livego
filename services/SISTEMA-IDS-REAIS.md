# 🎯 Sistema de IDs Reais - LiveGo

## 📋 Como Funciona

### 1. IDs Únicos por Usuário
Cada usuário tem um ID real que nunca muda:
```typescript
// ID do usuário
user_1234567890_abc

// ID do stream quando entra ao vivo
stream_user_1234567890_abc_timestamp_random

// ID da sala
room_user_1234567890_abc_timestamp_random
```

### 2. Nome para Exibição
O nome sempre mostra o usuário + ID para identificação:
```typescript
// Exemplo
"João Silva (user_12345678)"

// No frontend
displayName: "João Silva (user_12345678)"
```

### 3. URLs Reais
Todas as URLs usam o ID real do stream:
```typescript
// WebRTC
webrtc://72.60.249.175/live/stream_user_1234567890_abc_1a2b3c_x4y5z

// HLS
http://72.60.249.175:8000/live/stream_user_1234567890_abc_1a2b3c_x4y5z.m3u8

// FLV
http://72.60.249.175:8088/live/stream_user_1234567890_abc_1a2b3c_x4y5z.flv
```

## 🔧 Como Usar

### Backend - Criar Stream:
```typescript
// Em liveRoutes.ts
const realUserId = `user_${hostId}`;
const streamId = `stream_${realUserId}_${timestamp}_${random}`;
const displayName = `${user.name} (${realUserId})`;

const newStreamer = new Streamer({
  id: streamId,                    // ID real do stream
  hostId: realUserId,              // ID real do usuário
  name: displayName,               // Nome + ID
  roomId: roomId,                  // ID da sala
  displayName: displayName,       // Nome para exibição
  realUserId: realUserId,          // ID real do usuário
  // ... outros campos
});
```

### Frontend - Usar IDs:
```typescript
// Em PDVideoPlayer.tsx
const urls = RealIDGenerator.generateStreamURLs(streamer.id, streamer.displayName);

console.log('Display Name:', streamer.displayName);     // "João (user_123)"
console.log('Stream ID:', streamer.id);               // "stream_user_123_..."
console.log('Room ID:', streamer.roomId);             // "room_user_123_..."
console.log('WebRTC URL:', urls.webrtc);              // URL real
console.log('HLS URL:', urls.hls);                    // URL real
```

## 📱 Exemplo Prático

### Usário entra ao vivo:
1. **User ID**: `user_1773115965799`
2. **Nome**: "Adriano"
3. **Display Name**: "Adriano (user_1773115965799)"
4. **Stream ID**: `stream_user_1773115965799_1a2b3c_x4y5z`
5. **Room ID**: `room_user_1773115965799_1a2b3c_x4y5z`

### URLs Geradas:
```
WebRTC: webrtc://72.60.249.175/live/stream_user_1773115965799_1a2b3c_x4y5z
HLS:    http://72.60.249.175:8000/live/stream_user_1773115965799_1a2b3c_x4y5z.m3u8
FLV:    http://72.60.249.175:8088/live/stream_user_1773115965799_1a2b3c_x4y5z.flv
```

## 🎯 Benefícios

✅ **ID Real**: Cada usuário tem ID único e identificável
✅ **Nome + ID**: Fácil identificar quem está na live
✅ **Sala Única**: Cada live tem sua própria sala
✅ **URLs Reais**: Links funcionais e únicos
✅ **Rastreável**: Possível identificar usuário pelo ID
✅ **Sem Conflito**: Ninguém usa ID de outro

## 🔄 Fluxo Completo

1. **Usuário cria conta**: ID `user_123` gerado
2. **Entra ao vivo**: Stream `stream_user_123_abc_xyz` criado
3. **Sala criada**: Room `room_user_123_abc_xyz` criada
4. **URLs geradas**: Links reais funcionais
5. **Espectadores entram**: Usam IDs reais para conectar

**Sistema completo de IDs reais implementado!** 🎥🚀
