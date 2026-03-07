// Configuração centralizada da API
export const API_CONFIG = {
  // Retorna URL base da API baseada no ambiente
  getBaseUrl: () => {
    // Prioridade: variável de ambiente > detecção automática
    if (import.meta.env?.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL;
    }
    
    // Em desenvolvimento local, usa localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    // Em produção, usa o servidor real
    return 'http://72.60.249.175:3000';
  },
  
  // URLs específicas para diferentes ambientes
  getApiUrl: (path: string) => {
    const baseUrl = API_CONFIG.getBaseUrl();
    // Remove barras duplicadas
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/${cleanPath}`;
  },
  
  // Para uso direto no axios
  getBaseUrlForAxios: () => {
    return API_CONFIG.getBaseUrl();
  }
};

export default API_CONFIG;
