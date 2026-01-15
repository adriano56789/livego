/**
 * Configurações do servidor SRS (Simple Realtime Server)
 */

export const SRS_CONFIG = {
  // URL base do servidor SRS WebRTC
  WEBRTC_URL: import.meta.env.VITE_SRS_WEBRTC_URL || 'http://72.60.249.175:1985',
  
  // URL do servidor SRS para RTMP
  RTMP_URL: import.meta.env.VITE_SRS_RTMP_URL || 'rtmp://72.60.249.175:1935/live',
  
  // URL para HLS
  HLS_URL: import.meta.env.VITE_SRS_HLS_URL || 'https://72.60.249.175/live',
  
  // URL para WebRTC
  WS_URL: import.meta.env.VITE_SRS_WS_URL || 'ws://72.60.249.175:1985/rtc/v1/whip/'
};

// Função para obter a configuração do SRS
export const getSRSConfig = () => {
  return SRS_CONFIG;
};

// Tipos para o SRS
export interface SRSStreamInfo {
  streamKey: string;
  rtmpUrl: string;
  hlsUrl: string;
  webRTCUrl: string;
}

// Função para gerar URLs de stream
export const generateStreamUrls = (streamKey: string): SRSStreamInfo => {
  return {
    streamKey,
    rtmpUrl: `${SRS_CONFIG.RTMP_URL}/${streamKey}`,
    hlsUrl: `${SRS_CONFIG.HLS_URL}/${streamKey}.m3u8`,
    webRTCUrl: `${SRS_CONFIG.WS_URL}${streamKey}`
  };
};
