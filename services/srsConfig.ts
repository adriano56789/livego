// Configuração centralizada do SRS
export const SRS_CONFIG = {
  // URLs do servidor SRS
  getApiUrl: () => {
    // Em desenvolvimento local, usa localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:1985';
    }
    // Em produção, usa o servidor real
    return 'http://72.60.249.175:1985';
  },
  
  getWebRTCHost: () => {
    // Em desenvolvimento local, usa localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'localhost';
    }
    // Em produção, usa o servidor real
    return '72.60.249.175';
  },
  
  getRTMPUrl: () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'rtmp://localhost:1935/live';
    }
    return 'rtmp://72.60.249.175:1935/live';
  },
  
  getHttpUrl: () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080';
    }
    return 'http://72.60.249.175:8080';
  },
  
  // Constrói URL WebRTC para publicação
  getPublishUrl: (streamId: string) => {
    const host = SRS_CONFIG.getWebRTCHost();
    return `webrtc://${host}/live/${streamId}`;
  },
  
  // Constrói URL WebRTC para reprodução
  getPlayUrl: (streamId: string) => {
    const host = SRS_CONFIG.getWebRTCHost();
    return `webrtc://${host}/live/${streamId}`;
  }
};

export default SRS_CONFIG;
