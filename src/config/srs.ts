interface SRSConfig {
  rtmpUrl: string;
  webrtcUrl: string;
  apiUrl: string;
  hlsUrl: string;
  dashboardUrl: string;
}

const SRS_CONFIG: SRSConfig = {
  rtmpUrl: import.meta.env.VITE_SRS_RTMP_URL || 'rtmp://localhost:1935/live',
  webrtcUrl: import.meta.env.VITE_SRS_WEBRTC_URL || 'webrtc://localhost:1985/live',
  apiUrl: import.meta.env.VITE_SRS_API_URL || 'http://localhost:1985',
  hlsUrl: (import.meta.env.VITE_SRS_HTTP_URL || 'http://localhost:8080') + '/live',
  dashboardUrl: (import.meta.env.VITE_SRS_API_URL || 'http://localhost:1985') + '/console/'
};

export default SRS_CONFIG;
