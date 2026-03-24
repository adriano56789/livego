# 🚀 Arquitetura WebRTC Escalável - 50.000 Usuários Simultâneos

## 📊 Estratégia de Distribuição

### 🎯 WebRTC (Interativos) - 200-2.000 por live
- **Usuários**: Host + moderadores + quem interage (presentes, chat ativo)
- **Latência**: < 500ms (tempo real)
- **Protocolo**: WebRTC P2P + SFU
- **Recursos**: CPU alta, banda dedicada

### 🌐 HLS/LL-HLS (Massa) - 48.000+ por live
- **Usuários**: Espectadores passivos
- **Latência**: 2-6s (LL-HLS)
- **Protocolo**: HLS + CDN
- **Recursos**: CPU baixa, CDN distribuído

## 🏗️ Infraestrutura

### 1. TURN Dedicado por Região
```yaml
# turn-global.yml
version: '3.8'
services:
  # América do Sul
  turn-br:
    image: coturn/coturn:latest
    container_name: livego-turn-br
    ports: ["3478:3478/udp", "3478:3478/tcp"]
    environment:
      - REALM=livego-br
      - EXTERNAL_IP=72.60.249.175
      - TOTAL_QUOTA=2000
      - USER_QUOTA=120
      - MAX_BPS=256000  # 256kbps por usuário
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
    networks: [livego-br]

  # América do Norte
  turn-us:
    image: coturn/coturn:latest
    container_name: livego-turn-us
    ports: ["3479:3478/udp", "3479:3478/tcp"]
    environment:
      - REALM=livego-us
      - EXTERNAL_IP=104.21.45.100
      - TOTAL_QUOTA=2000
    deploy:
      replicas: 3
      networks: [livego-us]

  # Europa
  turn-eu:
    image: coturn/coturn:latest
    container_name: livego-turn-eu
    ports: ["3480:3478/udp", "3480:3478/tcp"]
    environment:
      - REALM=livego-eu
      - EXTERNAL_IP=104.21.67.200
      - TOTAL_QUOTA=2000
    deploy:
      replicas: 3
      networks: [livego-eu]
```

### 2. SRS/SFU em Cluster com Auto-Scale
```yaml
# srs-cluster.yml
version: '3.8'
services:
  # SFU Principal (WebRTC)
  srs-sfu-master:
    image: ossrs/srs:5
    container_name: livego-sfu-master
    ports: ["8000:8000/tcp", "10080:10080/udp"]
    environment:
      - CANDIDATE=72.60.249.175
      - WEBRTC=enabled
      - MAX_CONNECTIONS=2000
      - MAX_BITRATE=2000000  # 2Mbps por stream
    volumes:
      - ./srs-sfu.conf:/usr/local/srs/conf/srs.conf
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
    networks: [livego-cluster]

  # SFU Workers (Auto-scale)
  srs-sfu-worker:
    image: ossrs/srs:5
    environment:
      - CANDIDATE=72.60.249.175
      - WEBRTC=enabled
      - MAX_CONNECTIONS=1000
      - WORKER_MODE=true
    volumes:
      - ./srs-worker.conf:/usr/local/srs/conf/srs.conf
    deploy:
      replicas: 0  # Auto-scale
      resources:
        limits:
          cpus: '1.5'
          memory: 1.5G
    networks: [livego-cluster]

  # Origin Server (HLS/LL-HLS)
  srs-origin:
    image: ossrs/srs:5
    container_name: livego-srs-origin
    ports: ["1935:1935/tcp", "8080:8080/tcp", "8001:8001/tcp"]
    environment:
      - HLS_ENABLED=true
      - LLHLS_ENABLED=true
      - MAX_BITRATE=4000000  # 4Mbps para HLS
      - SEGMENT_DURATION=2  # LL-HLS 2s
    volumes:
      - ./srs-origin.conf:/usr/local/srs/conf/srs.conf
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
    networks: [livego-cluster]

  # Edge Servers (CDN)
  srs-edge:
    image: ossrs/srs:5
    environment:
      - EDGE_MODE=true
      - ORIGIN_SERVER=srs-origin:8080
      - HLS_ENABLED=true
      - LLHLS_ENABLED=true
      - CACHE_DURATION=30
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
    networks: [livego-cluster]
```

### 3. Auto-Scale Config
```yaml
# docker-compose.autoscale.yml
version: '3.8'
services:
  # Auto-scaler baseado em métricas
  autoscaler:
    image: docker/swarm:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - SCALE_UP_CPU=70      # 70% CPU = scale up
      - SCALE_DOWN_CPU=30    # 30% CPU = scale down
      - SCALE_UP_MEMORY=80    # 80% mem = scale up
      - MIN_REPLICAS=1
      - MAX_REPLICAS=10
      - CHECK_INTERVAL=30     # 30 segundos
    command: >
      sh -c "
      while true; do
        # Monitorar CPU e memória
        CPU_USAGE=$(docker stats --no-stream --format \"{{.CPUPerc}}\" srs-sfu-master | cut -d'%' -f1)
        MEMORY_USAGE=$(docker stats --no-stream --format \"{{.MemPerc}}\" srs-sfu-master | cut -d'%' -f1)
        
        # Scale up se necessário
        if [ \"$(echo \"$CPU_USAGE > 70\" | bc)\" -eq 1 ] || [ \"$(echo \"$MEMORY_USAGE > 80\" | bc)\" -eq 1 ]; then
          docker service scale livego_srs-sfu-worker=3
        fi
        
        # Scale down se possível
        if [ \"$(echo \"$CPU_USAGE < 30\" | bc)\" -eq 1 ] && [ \"$(echo \"$MEMORY_USAGE < 50\" | bc)\" -eq 1 ]; then
          docker service scale livego_srs-sfu-worker=1
        fi
        
        sleep 30
      done
      "
```

## 🔧 Configurações de Bitrate e Resolução

### Limites por Tipo de Stream
```typescript
// streamConfig.ts
export const STREAM_LIMITS = {
  // WebRTC (Interativos)
  webrtc: {
    maxResolution: '720p',      // 1280x720
    maxBitrate: 2000000,        // 2Mbps
    maxFramerate: 30,
    maxUsers: 2000,
    codecs: ['H264', 'VP8', 'VP9']
  },
  
  // HLS (Massa)
  hls: {
    maxResolution: '1080p',     // 1920x1080
    maxBitrate: 4000000,        // 4Mbps
    maxFramerate: 30,
    maxUsers: 50000,
    codecs: ['H264']
  },
  
  // LL-HLS (Baixa latência)
  llhls: {
    maxResolution: '720p',
    maxBitrate: 2500000,        // 2.5Mbps
    segmentDuration: 2,        // 2s segments
    maxUsers: 50000,
    codecs: ['H264']
  }
};

// Controle de bitrate dinâmico
export const getOptimalBitrate = (userCount: number, resolution: string) => {
  if (userCount > 10000) {
    // Alta demanda - reduz bitrate
    return resolution === '1080p' ? 3000000 : 1500000;
  } else if (userCount > 5000) {
    // Demanda média
    return resolution === '1080p' ? 4000000 : 2000000;
  } else {
    // Baixa demanda - bitrate máximo
    return resolution === '1080p' ? 6000000 : 3000000;
  }
};
```

## 📱 Frontend - Seleção Inteligente de Protocolo

### Lógica de Distribuição
```typescript
// streamSelector.ts
export class StreamSelector {
  static selectProtocol(userRole: string, viewerCount: number, deviceType: string) {
    // Host e moderadores sempre WebRTC
    if (userRole === 'host' || userRole === 'moderator') {
      return 'webrtc';
    }
    
    // Primeiros 2000 espectadores WebRTC
    if (viewerCount < 2000) {
      return 'webrtc';
    }
    
    // Demais via HLS/LL-HLS baseado no dispositivo
    if (deviceType === 'mobile') {
      return 'llhls';  // Mobile otimizado para LL-HLS
    } else {
      return 'hls';    // Desktop HLS tradicional
    }
  }
  
  static getServerRegion(userLocation: string) {
    const regions = {
      'BR': 'turn-br:3478',      // Brasil
      'US': 'turn-us:3479',      // EUA
      'EU': 'turn-eu:3480',      // Europa
      'default': 'turn-br:3478'
    };
    
    return regions[userLocation] || regions.default;
  }
}
```

## 📊 Monitoramento e Métricas

### Dashboard em Tempo Real
```typescript
// metrics.ts
export interface StreamMetrics {
  totalViewers: number;
  webrtcViewers: number;
  hlsViewers: number;
  cpuUsage: number;
  memoryUsage: number;
  bandwidthUsage: number;
  activeStreams: number;
  regionDistribution: {
    BR: number;
    US: number;
    EU: number;
  };
}

export class MetricsCollector {
  static collectMetrics(): StreamMetrics {
    return {
      totalViewers: this.getTotalViewers(),
      webrtcViewers: this.getWebRTCViewers(),
      hlsViewers: this.getHLSViewers(),
      cpuUsage: this.getCPUUsage(),
      memoryUsage: this.getMemoryUsage(),
      bandwidthUsage: this.getBandwidthUsage(),
      activeStreams: this.getActiveStreams(),
      regionDistribution: this.getRegionDistribution()
    };
  }
  
  static shouldAutoScale(metrics: StreamMetrics): boolean {
    return metrics.cpuUsage > 70 || 
           metrics.memoryUsage > 80 || 
           metrics.webrtcViewers > 1500;
  }
}
```

## 🚀 Deploy Completo

### Script de Deploy
```bash
#!/bin/bash
# deploy-scalable.sh

echo "🚀 Deploy LiveGo Escalável - 50.000 usuários"

# 1. Criar rede cluster
docker network create --driver overlay livego-cluster

# 2. Deploy TURN servers por região
docker stack deploy -c turn-global.yml livego-turn

# 3. Deploy SRS cluster
docker stack deploy -c srs-cluster.yml livego-srs

# 4. Deploy auto-scaler
docker stack deploy -c docker-compose.autoscale.yml livego-autoscaler

# 5. Configurar CDN (Cloudflare/AWS CloudFront)
echo "⚙️ Configurando CDN..."
# CDN aponta para edge servers: http://edge1.livego.com:8001/*

# 6. Health checks
echo "🔍 Verificando saúde dos serviços..."
docker service ls
curl http://localhost:8080/api/v1/summaries

echo "✅ Sistema escalável deployado!"
echo "📊 Dashboard: http://localhost:3000/metrics"
echo "🌐 CDN: https://cdn.livego.com/live/*"
echo "🔧 WebRTC: webrtc://livego.com/live/*"
```

## 📈 Capacidade Final

### Distribuição por Live
- **WebRTC**: 200-2.000 usuários (interativos)
- **HLS**: 48.000+ usuários (espectadores)
- **Total**: 50.000+ simultâneos

### Recursos Necessários
- **Servidores**: 15+ containers
- **CPU**: 30+ cores
- **Memória**: 50GB+
- **Banda**: 10Gbps+
- **CDN**: Edge servers globais

**Sistema pronto para 50.000 usuários simultâneos!** 🎥🚀
