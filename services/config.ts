/**
 * CONFIGURAÇÃO DE CONEXÃO DA API
 * Detecta automaticamente o ambiente (desenvolvimento vs. produção) para apontar para a API correta.
 */

// Vite substitui `process.env.NODE_ENV` por 'production' durante o build (`npm run build`)
// e 'development' ao rodar o servidor de desenvolvimento (`npm run dev`).
const isProduction = process.env.NODE_ENV === 'production';

// Domínio público da sua aplicação em produção.
const PRODUCTION_DOMAIN = 'https://livego.store';

// Em produção, usamos a URL absoluta para garantir que o cliente sempre chame o domínio correto.
// Em desenvolvimento, usamos um caminho relativo ('') para que o proxy do Vite intercepte as chamadas.
const backendHost = isProduction ? PRODUCTION_DOMAIN : '';
const wsHost = isProduction ? PRODUCTION_DOMAIN.replace(/^http/, 'ws') : '';

export const API_CONFIG = {
    /**
     * URL base para chamadas HTTP (fetch).
     * - Em Produção: 'https://livego.store/api'
     * - Em Desenvolvimento: '/api' (redirecionado pelo proxy do Vite para http://localhost:3000/api)
     */
    BASE_URL: `${backendHost}/api`,
    
    /**
     * URL para a conexão WebSocket.
     * - Em Produção: 'wss://livego.store'
     * - Em Desenvolvimento: '' (conecta ao mesmo host/porta do frontend, redirecionado pelo proxy do Vite)
     */
    WS_URL: wsHost,
};