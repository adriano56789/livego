// Configuração STUN/TURN para serviço SRS - Servidores Próprios
export const SRS_ICE_CONFIG = {
  // Configuração ICE para SRS - Apenas servidores próprios
  getIceServers: (): RTCIceServer[] => {
    return [
      // Servidor STUN próprio para SRS
      {
        urls: import.meta.env?.VITE_STUN_URL || 'stun:72.60.249.175:3478'
      },
      // Servidor TURN próprio para SRS (comentado se não for usar)
      // {
      //   urls: import.meta.env?.VITE_TURN_URL || 'turn:72.60.249.175:3478',
      //   username: import.meta.env?.VITE_TURN_USER || 'livego',
      //   credential: import.meta.env?.VITE_TURN_PASS || 'livego123'
      // }
    ];
  },
  
  // Configuração otimizada para mobile
  getMobileIceConfig: (): RTCConfiguration => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return {
      iceServers: SRS_ICE_CONFIG.getIceServers(),
      iceCandidatePoolSize: isMobile ? 4 : 10,
      iceTransportPolicy: isMobile ? 'relay' : 'all',
      bundlePolicy: isMobile ? 'max-bundle' : 'balanced',
      rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
    };
  },
  
  // Configuração para desktop
  getDesktopIceConfig: (): RTCConfiguration => {
    return {
      iceServers: SRS_ICE_CONFIG.getIceServers(),
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'negotiate' as RTCRtcpMuxPolicy
    };
  },
  
  // URLs específicas do SRS
  getWebRTCHost: () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'localhost';
    }
    return '72.60.249.175';
  },
  
  getWebRTCUrl: (streamId: string) => {
    const host = SRS_ICE_CONFIG.getWebRTCHost();
    return `webrtc://${host}/live/${streamId}`;
  },
  
  getHlsUrl: (streamId: string) => {
    const baseUrl = import.meta.env?.VITE_SRS_HTTP_URL || 'http://72.60.249.175:8080/live';
    return `${baseUrl}/${streamId}.m3u8`;
  },
  
  getFlvUrl: (streamId: string) => {
    const baseUrl = import.meta.env?.VITE_SRS_HTTP_URL || 'http://72.60.249.175:8080/live';
    return `${baseUrl}/${streamId}.flv`;
  }
};

export default SRS_ICE_CONFIG;
