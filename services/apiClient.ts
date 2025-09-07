import { apiLogger } from './apiLogger';

// Configuração da URL base da API
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : 'https://3000-iutlks2qb2rjvz6y0nuke-501e7ed6.manusvm.computer';

/**
 * Cliente da API que faz chamadas reais para o backend Express.js.
 * Registra automaticamente todas as requisições e respostas no ApiViewer via apiLogger.
 * @param path O caminho do endpoint da API (ex: '/api/users/1').
 * @param options O objeto RequestInit padrão (method, body, etc.).
 * @returns Uma promise que resolve com os dados da resposta.
 */
export const apiClient = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const method = options?.method || 'GET';
    const url = `${API_BASE_URL}${path}`;
    
    const requestTitle = `${method} ${path}`;

    try {
        // Configurar headers padrão
        const headers = {
            'Content-Type': 'application/json',
            ...options?.headers
        };

        // Fazer a requisição real para o backend
        const response = await fetch(url, {
            ...options,
            method,
            headers
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();

        apiLogger.log(requestTitle, path, {
            request: { method, path, body: options?.body ? JSON.parse(options.body as string) : null },
            response: responseData,
        });
        
        return responseData;
    } catch (error) {
        apiLogger.log(requestTitle, path, {
            request: { method, path, body: options?.body ? JSON.parse(options.body as string) : null },
            error: error instanceof Error ? error.message : String(error),
        });
        
        throw error;
    }
};