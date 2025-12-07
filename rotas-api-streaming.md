# Rotas API dos Servidores de Streaming - LiveGo

## 1. SRS API Routes

### Streams Management
```
POST   http://localhost:1985/api/v1/streams/
GET    http://localhost:1985/api/v1/streams/
GET    http://localhost:1985/api/v1/streams/{streamId}
DELETE http://localhost:1985/api/v1/streams/{streamId}
```

### Stream Control
```
POST   http://localhost:1985/api/v1/streams/{streamId}/publish
POST   http://localhost:1985/api/v1/streams/{streamId}/unpublish
GET    http://localhost:1985/api/v1/streams/{streamId}/stat
```

### Server Info
```
GET    http://localhost:1985/api/v1/server/info
GET    http://localhost:1985/api/v1/server/summaries
```

### DVR Management
```
GET    http://localhost:1985/api/v1/dvr/summaries
DELETE http://localhost:1985/api/v1/dvr/{streamId}
```

### Webhooks (SRS -> Backend)
```
POST   /webhooks/srs/on_publish
POST   /webhooks/srs/on_unpublish  
POST   /webhooks/srs/on_play
POST   /webhooks/srs/on_stop
POST   /webhooks/srs/on_dvr
```

---

## 2. RootEncoder API Routes

### Encoding Control
```
POST   /api/encoder/start
POST   /api/encoder/stop
GET    /api/encoder/status
POST   /api/encoder/restart
```

### Stream Configuration
```
POST   /api/encoder/config
GET    /api/encoder/config/{streamKey}
PUT    /api/encoder/config/{streamKey}
DELETE /api/encoder/config/{streamKey}
```

### Quality Profiles
```
GET    /api/encoder/profiles
POST   /api/encoder/profiles
PUT    /api/encoder/profiles/{profileId}
DELETE /api/encoder/profiles/{profileId}
```

### Encoding Jobs
```
GET    /api/encoder/jobs
GET    /api/encoder/jobs/{jobId}
POST   /api/encoder/jobs/{jobId}/cancel
```

### Monitoring
```
GET    /api/encoder/stats
GET    /api/encoder/logs
GET    /api/encoder/health
```

---

## 3. LiveKit Server API Routes

### Token Management
```
POST   /api/token/generate
POST   /api/token/validate
POST   /api/token/refresh
GET    /api/token/info
```

### Room Management
```
POST   /api/rooms
GET    /api/rooms
GET    /api/rooms/{roomId}
DELETE /api/rooms/{roomId}
POST   /api/rooms/{roomId}/start
POST   /api/rooms/{roomId}/end
```

### Participant Management
```
GET    /api/rooms/{roomId}/participants
GET    /api/rooms/{roomId}/participants/{participantId}
DELETE /api/rooms/{roomId}/participants/{participantId}
POST   /api/rooms/{roomId}/participants/{participantId}/mute
POST   /api/rooms/{roomId}/participants/{participantId}/unmute
```

### Track Management
```
GET    /api/rooms/{roomId}/tracks
POST   /api/rooms/{roomId}/tracks/{trackId}/enable
POST   /api/rooms/{roomId}/tracks/{trackId}/disable
DELETE /api/rooms/{roomId}/tracks/{trackId}
```

### WebRTC Signaling
```
WebSocket: /signal/{roomId}
POST   /api/signal/offer
POST   /api/signal/answer
POST   /api/signal/ice-candidate
```

### Recording
```
POST   /api/recording/start
POST   /api/recording/stop
GET    /api/recording/status/{roomId}
GET    /api/recording/list
```

### Server Stats
```
GET    /api/stats/server
GET    /api/stats/rooms
GET    /api/stats/participants
```

---

## 4. LiveKit Server SDK API Routes

### Authentication
```
POST   /api/livekit/auth/login
POST   /api/livekit/auth/refresh
POST   /api/livekit/auth/logout
```

### Stream Management
```
POST   /api/livekit/stream/create
GET    /api/livekit/stream/{streamId}
PUT    /api/livekit/stream/{streamId}
DELETE /api/livekit/stream/{streamId}
POST   /api/livekit/stream/{streamId}/start
POST   /api/livekit/stream/{streamId}/stop
```

### Room Operations
```
POST   /api/livekit/room/create
GET    /api/livekit/room/{roomId}
POST   /api/livekit/room/{roomId}/join
POST   /api/livekit/room/{roomId}/leave
```

### Token Operations
```
POST   /api/livekit/token/generate
POST   /api/livekit/token/validate
GET    /api/livekit/token/{tokenId}
```

### Webhook Handlers
```
POST   /webhooks/livekit/room_created
POST   /webhooks/livekit/room_deleted
POST   /webhooks/livekit/participant_joined
POST   /webhooks/livekit/participant_left
POST   /webhooks/livekit/track_published
POST   /webhooks/livekit/track_unpublished
```

### Configuration
```
GET    /api/livekit/config
PUT    /api/livekit/config
GET    /api/livekit/config/regions
```

### Analytics
```
GET    /api/livekit/analytics/rooms
GET    /api/livekit/analytics/participants
GET    /api/livekit/analytics/bandwidth
GET    /api/livekit/analytics/quality
```

---

## 5. Backend Integration API Routes

### Stream Orchestration
```
POST   /api/stream/orchestrate/start
POST   /api/stream/orchestrate/stop
GET    /api/stream/orchestrate/status
```

### Multi-Server Coordination
```
POST   /api/coordination/srs/start
POST   /api/coordination/livekit/create-room
POST   /api/coordination/encoder/start-transcode
```

### Health Checks
```
GET    /health/srs
GET    /health/livekit
GET    /health/encoder
GET    /health/backend
```

### Configuration Sync
```
POST   /api/config/sync/srs
POST   /api/config/sync/livekit
POST   /api/config/sync/encoder
```

---

## Portas por Servidor

### SRS
```
1935  - RTMP Ingest
8080  - HLS/HTTP-FLV Playback
1985  - Admin API
```

### RootEncoder
```
9001  - Encoder API
9002  - Monitoring API
```

### LiveKit Server
```
7880  - WebRTC/WebSocket
7881  - Admin API
```

### LiveKit SDK
```
3001  - SDK API
3002  - Webhook Receiver
```

### Backend Integration
```
4000  - Orchestration API
4001  - Health Check API
```

---

## Exemplo de Fluxo Completo

```
1. POST /api/stream/orchestrate/start
2. POST /api/coordination/srs/start
3. POST /api/coordination/livekit/create-room
4. POST /api/coordination/encoder/start-transcode
5. POST /api/livekit/stream/create
6. POST /api/livekit/token/generate
7. WebSocket /signal/{roomId}
```

---

## Headers Necessários

### Autenticação
```
Authorization: Bearer {token}
X-API-Key: {api_key}
```

### Content-Type
```
Content-Type: application/json
Content-Type: multipart/form-data (uploads)
```

### Rate Limiting
```
X-Rate-Limit-Limit: 1000
X-Rate-Limit-Remaining: 999
X-Rate-Limit-Reset: 1640995200
```
