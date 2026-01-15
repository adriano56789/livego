// Configurações da API
export const API_CONFIG = {
  BASE_URL: 'https://livego.store/api',
  WS_URL: 'wss://livego.store',
  API_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const AUTH_CONFIG = {
  TOKEN_KEY: 'auth_token',
  USER_KEY: 'user_data',
  TOKEN_REFRESH_INTERVAL: 15 * 60 * 1000, // 15 minutos
};