// Configurações de Streaming Escalável - LiveGo 50.000 usuários

export interface StreamLimits {
  maxResolution: string;
  maxBitrate: number;
  maxFramerate: number;
  maxUsers: number;
  codecs: string[];
}

export interface StreamConfig {
  webrtc: StreamLimits;
  hls: StreamLimits;
  llhls: StreamLimits;
}

// Limites por tipo de stream
export const STREAM_LIMITS: StreamConfig = {
  // WebRTC (Interativos) - 200-2.000 usuários
  webrtc: {
    maxResolution: '720p',      // 1280x720
    maxBitrate: 2000000,        // 2Mbps por usuário
    maxFramerate: 30,
    maxUsers: 2000,
    codecs: ['H264', 'VP8', 'VP9']
  },
  
  // HLS (Massa) - 48.000+ usuários
  hls: {
    maxResolution: '1080p',     // 1920x1080
    maxBitrate: 4000000,        // 4Mbps por usuário
    maxFramerate: 30,
    maxUsers: 50000,
    codecs: ['H264']
  },
  
  // LL-HLS (Baixa latência) - Mobile otimizado
  llhls: {
    maxResolution: '720p',
    maxBitrate: 2500000,        // 2.5Mbps por usuário
    maxFramerate: 30,
    maxUsers: 50000,
    codecs: ['H264']
  }
};

// Controle de bitrate dinâmico baseado na demanda
export const getOptimalBitrate = (userCount: number, resolution: string): number => {
  if (userCount > 10000) {
    // Alta demanda - reduz bitrate para economizar banda
    switch (resolution) {
      case '1080p': return 3000000;  // 3Mbps
      case '720p': return 1500000;   // 1.5Mbps
      case '480p': return 800000;    // 800kbps
      default: return 1000000;       // 1Mbps
    }
  } else if (userCount > 5000) {
    // Demanda média
    switch (resolution) {
      case '1080p': return 4000000;  // 4Mbps
      case '720p': return 2000000;   // 2Mbps
      case '480p': return 1000000;   // 1Mbps
      default: return 1500000;       // 1.5Mbps
    }
  } else {
    // Baixa demanda - bitrate máximo
    switch (resolution) {
      case '1080p': return 6000000;  // 6Mbps
      case '720p': return 3000000;   // 3Mbps
      case '480p': return 1500000;   // 1.5Mbps
      default: return 2000000;       // 2Mbps
    }
  }
};

// Seleção de protocolo baseado no usuário e demanda
export class StreamSelector {
  static selectProtocol(userRole: string, viewerCount: number, deviceType: string): string {
    // Host e moderadores sempre WebRTC (interação em tempo real)
    if (userRole === 'host' || userRole === 'moderator') {
      return 'webrtc';
    }
    
    // Primeiros 2000 espectadores WebRTC (interativos)
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
  
  static getServerRegion(userLocation: string): string {
    const regions = {
      'BR': 'turn-br:3478',      // Brasil
      'US': 'turn-us:3479',      // EUA
      'EU': 'turn-eu:3480',      // Europa
      'AS': 'turn-br:3478',      // Ásia (usa BR)
      'default': 'turn-br:3478'  // Default
    };
    
    return regions[userLocation] || regions.default;
  }
  
  static getOptimalServer(viewerCount: number): string {
    if (viewerCount < 500) {
      return 'srs-sfu-master:8000';  // SFU principal
    } else if (viewerCount < 2000) {
      return 'srs-sfu-worker:8000'; // SFU worker
    } else {
      return 'nginx-lb:80';          // Load balancer (HLS)
    }
  }
}

// Configurações de TURN por região
export const TURN_CONFIGS = {
  BR: {
    urls: ['turn:72.60.249.175:3478'],
    username: 'livego',
    credential: 'livego123',
    maxConnections: 2000
  },
  US: {
    urls: ['turn:104.21.45.100:3479'],
    username: 'livego',
    credential: 'livego123',
    maxConnections: 2000
  },
  EU: {
    urls: ['turn:104.21.67.200:3480'],
    username: 'livego',
    credential: 'livego123',
    maxConnections: 2000
  }
};

// Configurações de CDN
export const CDN_CONFIG = {
  edgeServers: [
    'https://cdn1.livego.com',
    'https://cdn2.livego.com',
    'https://cdn3.livego.com'
  ],
  cacheDuration: 30, // 30 segundos
  cacheTTL: 86400,    // 24 horas
  geoBlocking: ['CU', 'IR', 'KP'], // Países bloqueados
  rateLimit: {
    requests: 1000,    // 1000 requisições por minuto
    burst: 100         // 100 burst
  }
};

// Métricas de streaming
export interface StreamMetrics {
  totalViewers: number;
  webrtcViewers: number;
  hlsViewers: number;
  llhlsViewers: number;
  cpuUsage: number;
  memoryUsage: number;
  bandwidthUsage: number;
  activeStreams: number;
  regionDistribution: {
    BR: number;
    US: number;
    EU: number;
    AS: number;
  };
  averageBitrate: number;
  bufferHealth: number;
  errorRate: number;
}

export class MetricsCollector {
  static collectMetrics(): StreamMetrics {
    // Implementação real coletaria das APIs dos serviços
    return {
      totalViewers: this.getTotalViewers(),
      webrtcViewers: this.getWebRTCViewers(),
      hlsViewers: this.getHLSViewers(),
      llhlsViewers: this.getLLHLSViewers(),
      cpuUsage: this.getCPUUsage(),
      memoryUsage: this.getMemoryUsage(),
      bandwidthUsage: this.getBandwidthUsage(),
      activeStreams: this.getActiveStreams(),
      regionDistribution: this.getRegionDistribution(),
      averageBitrate: this.getAverageBitrate(),
      bufferHealth: this.getBufferHealth(),
      errorRate: this.getErrorRate()
    };
  }
  
  static shouldAutoScale(metrics: StreamMetrics): boolean {
    return (
      metrics.cpuUsage > 70 || 
      metrics.memoryUsage > 80 || 
      metrics.webrtcViewers > 1500 ||
      metrics.bandwidthUsage > 8000000000 // 8Gbps
    );
  }
  
  static shouldScaleDown(metrics: StreamMetrics): boolean {
    return (
      metrics.cpuUsage < 30 && 
      metrics.memoryUsage < 50 && 
      metrics.webrtcViewers < 500 &&
      metrics.bandwidthUsage < 2000000000 // 2Gbps
    );
  }
  
  // Métodos simulados - implementação real conectaria às APIs
  private static getTotalViewers(): number { return 0; }
  private static getWebRTCViewers(): number { return 0; }
  private static getHLSViewers(): number { return 0; }
  private static getLLHLSViewers(): number { return 0; }
  private static getCPUUsage(): number { return 0; }
  private static getMemoryUsage(): number { return 0; }
  private static getBandwidthUsage(): number { return 0; }
  private static getActiveStreams(): number { return 0; }
  private static getRegionDistribution(): any { return {}; }
  private static getAverageBitrate(): number { return 0; }
  private static getBufferHealth(): number { return 0; }
  private static getErrorRate(): number { return 0; }
}

// Configurações de qualidade adaptativa
export const ADAPTIVE_BITRATE = {
  profiles: [
    { resolution: '1080p', bitrate: 4000000, framerate: 30 },
    { resolution: '720p', bitrate: 2000000, framerate: 30 },
    { resolution: '480p', bitrate: 1000000, framerate: 30 },
    { resolution: '360p', bitrate: 600000, framerate: 25 }
  ],
  switchThreshold: {
    bandwidthUp: 0.8,    // 80% do bitrate atual
    bandwidthDown: 0.4,  // 40% do bitrate atual
    bufferLow: 0.3,      // 30% do buffer
    bufferHigh: 0.8      // 80% do buffer
  }
};

export default {
  STREAM_LIMITS,
  StreamSelector,
  TURN_CONFIGS,
  CDN_CONFIG,
  MetricsCollector,
  ADAPTIVE_BITRATE,
  getOptimalBitrate
};
