# Configuração dos Servidores de Streaming - LiveGo

## 1. SRS (Simple Realtime Server)

### Instalação
```bash
# Clonar repositório
git clone https://github.com/ossrs/srs.git
cd srs

# Compilar
./configure --with-http-api --with-ssl --with-hls --with-dvr
make
sudo make install
```

### Configuração Principal (srs.conf)
```bash
listen              1935;
max_connections     1000;
srs_log_tank        file;
srs_log_file        ./objs/srs.log;

http_server {
    enabled         on;
    listen          8080;
    dir             ./objs/nginx/html;
}

http_api {
    enabled         on;
    listen          1985;
}

vhost __defaultVhost__ {
    hls {
        enabled         on;
        hls_path        ./objs/nginx/html;
        hls_fragment    10;
        hls_window      60;
    }
    
    http_remux {
        enabled     on;
        mount       [vhost]/[app]/[stream].flv;
    }
    
    dvr {
        enabled     on;
        dvr_path    ./objs/nginx/html;
        dvr_plan    session;
    }
}
```

### Rotas API do SRS
```
POST   http://localhost:1985/api/v1/streams/
GET    http://localhost:1985/api/v1/streams/
DELETE http://localhost:1985/api/v1/streams/{streamId}
POST   http://localhost:1985/api/v1/streams/{streamId}/publish
POST   http://localhost:1985/api/v1/streams/{streamId}/unpublish
GET    http://localhost:1985/api/v1/streams/{streamId}/stat
```

### Endpoints de Streaming
```
# RTMP Ingest
rtmp://your-vps:1935/live/{streamKey}
rtmp://your-vps:1935/app/{streamKey}

# HLS Playback
http://your-vps:8080/live/{streamKey}/playlist.m3u8
http://your-vps:8080/app/{streamKey}/playlist.m3u8

# HTTP-FLV Playback
http://your-vps:8080/live/{streamKey}.flv
http://your-vps:8080/app/{streamKey}.flv
```

### Webhooks do SRS
```bash
# Configurar no srs.conf
http_hooks {
    enabled         on;
    on_publish      http://localhost:3000/webhooks/srs/on_publish;
    on_unpublish    http://localhost:3000/webhooks/srs/on_unpublish;
    on_play         http://localhost:3000/webhooks/srs/on_play;
    on_stop         http://localhost:3000/webhooks/srs/on_stop;
}
```

---

## 2. RootEncoder (FFmpeg com Configurações Otimizadas)

### Instalação FFmpeg
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install epel-release
sudo yum install ffmpeg

# Compilar do source (recomendado para performance)
git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg
cd ffmpeg
./configure --enable-gpl --enable-libx264 --enable-libx265
make
sudo make install
```

### Script de Encoding (encoder.sh)
```bash
#!/bin/bash

STREAM_KEY=$1
RTMP_SERVER="rtmp://localhost:1935/live"
OUTPUT_HLS="/var/www/html/hls/${STREAM_KEY}"
OUTPUT_FLV="/var/www/html/flv/${STREAM_KEY}.flv"

# Criar diretórios
mkdir -p $OUTPUT_HLS
mkdir -p /var/www/html/flv

# Multi-bitrate encoding com FFmpeg
ffmpeg -i rtmp://localhost:1935/live/$STREAM_KEY \
-c:v libx264 -c:a aac \
-b:v 1000k -b:a 128k \
-vf "scale=1280:720" \
-tune zerolatency \
-preset veryfast \
-g 50 \
-keyint_min 25 \
-sc_threshold 0 \
-f hls \
-hls_time 6 \
-hls_list_size 10 \
-hls_flags delete_segments \
-hls_segment_filename "$OUTPUT_HLS/segment%03d.ts" \
"$OUTPUT_HLS/playlist.m3u8" \
-c:v libx264 -c:a copy \
-b:v 500k \
-vf "scale=854:480" \
-f flv \
"$OUTPUT_FLV" &
```

### Configurações de Qualidade
```bash
# 1080p60
ffmpeg -i input -c:v libx264 -preset fast -b:v 4500k -maxrate 4500k -bufsize 9000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k output1080p60

# 720p30  
ffmpeg -i input -c:v libx264 -preset fast -b:v 2500k -maxrate 2500k -bufsize 5000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k output720p

# 480p30
ffmpeg -i input -c:v libx264 -preset fast -b:v 1000k -maxrate 1000k -bufsize 2000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 96k output480p
```

### Serviço Systemd para Encoder
```ini
[Unit]
Description=RootEncoder Service
After=network.target

[Service]
Type=forking
User=root
ExecStart=/usr/local/bin/encoder.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 3. LiveKit Server

### Instalação
```bash
# Baixar binário
wget https://github.com/livekit/livekit/releases/download/v1.5.0/livekit-server-linux-amd64.tar.gz
tar -xzf livekit-server-linux-amd64.tar.gz
sudo cp livekit-server /usr/local/bin/

# Ou via Docker
docker pull livekit/livekit-server
```

### Configuração (livekit.yaml)
```yaml
port: 7880
redis:
  address: localhost:6379
keys:
  APIKEY123: SECRETKEY456
room:
  enabled: true
  max_participants: 100
  empty_timeout: 5m
webhook:
  url: http://localhost:3000/webhooks/livekit
  api_key: APIKEY123
logging:
  level: info
  pion_level: warn
```

### Comando de Execução
```bash
livekit-server --config livekit.yaml --keys "APIKEY123:SECRETKEY456"
```

---

## 4. LiveKit Server SDK (Node.js)

### Instalação no Projeto
```bash
npm install livekit-server-sdk
```

### Configuração do Cliente LiveKit
```typescript
import { LiveKitClient, Room } from 'livekit-client';

class LiveGoStreaming {
  private client: LiveKitClient;
  private room: Room;

  constructor() {
    this.client = new LiveKitClient({
      websocketUrl: 'ws://localhost:7880',
    });
    this.room = new Room();
  }

  async startStream(streamKey: string) {
    try {
      // Conectar à sala
      await this.room.connect('ws://localhost:7880', await this.getToken(streamKey));
      
      // Publicar vídeo e áudio
      await this.room.localParticipant.publishTracks([
        await this.createVideoTrack(),
        await this.createAudioTrack()
      ]);

      console.log('Stream iniciado com sucesso');
    } catch (error) {
      console.error('Erro ao iniciar stream:', error);
    }
  }

  private async getToken(streamKey: string): Promise<string> {
    // Requisitar token ao backend
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamKey })
    });
    
    const { token } = await response.json();
    return token;
  }

  private async createVideoTrack(): Promise<MediaStreamTrack> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    });
    return stream.getVideoTracks()[0];
  }

  private async createAudioTrack(): Promise<MediaStreamTrack> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    return stream.getAudioTracks()[0];
  }

  async endStream() {
    await this.room.disconnect();
    console.log('Stream encerrado');
  }
}
```

### API Backend para LiveKit
```typescript
// routes/livekit.ts
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';

const router = express.Router();

router.post('/token', async (req, res) => {
  const { streamKey, roomName } = req.body;
  
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: streamKey,
      name: roomName || `stream_${streamKey}`,
    }
  );

  at.addGrant({
    room: roomName || `stream_${streamKey}`,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  const token = at.toJwt();
  res.json({ token });
});

router.post('/room/create', async (req, res) => {
  const { roomName, streamKey } = req.body;
  
  // Criar sala via LiveKit Server API
  try {
    const response = await fetch('http://localhost:7880/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LIVEKIT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: roomName,
        emptyTimeout: 300,
        maxParticipants: 100
      })
    });
    
    const room = await response.json();
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 5. Integração Completa

### Fluxo de Streaming
```
1. App mobile -> RTMP para SRS (1935)
2. SRS -> Processa e distribui HLS/FLV
3. SRS -> Webhook para Backend API
4. Backend -> Criar sala LiveKit
5. Viewers -> Conectam via LiveKit WebRTC
6. RootEncoder -> Transcodificação multi-bitrate
```

### Configuração de Portas
```bash
# SRS
1935  - RTMP
8080  - HLS/HTTP-FLV
1985  - API Admin

# LiveKit
7880  - WebRTC/WebSocket

# Backend API
3000  - REST API

# Nginx (Reverse Proxy)
80/443 - Frontend/CDN
```

### Serviços Systemd
```bash
# srs.service
# livekit.service  
# rootencoder.service
# livego-api.service
```

### Monitoramento
```bash
# Verificar status dos serviços
sudo systemctl status srs
sudo systemctl status livekit
sudo systemctl status rootencoder
sudo systemctl status livego-api

# Logs
tail -f /var/log/srs/srs.log
tail -f /var/log/livekit/livekit.log
tail -f /var/log/nginx/access.log
```

Esta configuração garante streaming de baixa latência com WebRTC (LiveKit) e alta compatibilidade com HLS/FLV (SRS), além de transcodificação otimizada com FFmpeg.
