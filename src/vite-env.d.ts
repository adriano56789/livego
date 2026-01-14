/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_USE_MOCK: string;
  readonly VITE_SRS_API_URL: string;
  readonly VITE_SRS_RTMP_URL: string;
  readonly VITE_SRS_WEBRTC_URL: string;
  readonly VITE_SRS_HTTP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
