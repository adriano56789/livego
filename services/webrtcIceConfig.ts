// Configuração STUN/TURN para serviço WebRTC - Servidores Próprios
export const WEBRTC_ICE_CONFIG = {
  // Configuração ICE para WebRTC - Apenas servidores próprios
  getIceServers: (): RTCIceServer[] => {
    return [
      // Servidor STUN próprio para WebRTC
      {
        urls: import.meta.env?.VITE_STUN_URL || 'stun:72.60.249.175:3478'
      },
      // Servidor TURN próprio para WebRTC (comentado se não for usar)
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
      iceServers: WEBRTC_ICE_CONFIG.getIceServers(),
      iceCandidatePoolSize: isMobile ? 4 : 10,
      iceTransportPolicy: isMobile ? 'relay' : 'all',
      bundlePolicy: isMobile ? 'max-bundle' : 'balanced',
      rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
    };
  },
  
  // Configuração para desktop
  getDesktopIceConfig: (): RTCConfiguration => {
    return {
      iceServers: WEBRTC_ICE_CONFIG.getIceServers(),
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'negotiate' as RTCRtcpMuxPolicy
    };
  }
};

export default WEBRTC_ICE_CONFIG;
