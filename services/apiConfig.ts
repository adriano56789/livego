// Configuração centralizada da API
export const API_CONFIG = {
  // Retorna URL base da API baseada no ambiente
  getBaseUrl: () => {
    // Prioridade: variável de ambiente > API real
    if (import.meta.env?.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL;
    }
    
    // Sempre usar API real - remover localhost de teste
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
