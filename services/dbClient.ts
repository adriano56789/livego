// This file acts as a thin client that forwards requests to the centralized mock API server logic.

import { handleApiRequest } from './api';

// --- CONFIGURAÇÃO SIMULADA DO BANCO DE DADOS ---
// Em um ambiente de produção, essas variáveis viriam de um arquivo .env (process.env)
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'livego_user',
  password: 'secretpassword',
  name: 'livego_db',
};

// --- INITIALIZATION ---
console.log(`[DB Client] Simulating connection to ${dbConfig.name} at ${dbConfig.host}:${dbConfig.port}...`);

// --- EXPORTED CLIENT ---
// The methods here now simply delegate to the centralized API handler.
export const dbClient = {
    get: (path: string, query: URLSearchParams) => handleApiRequest('GET', path, null, query),
    post: (path: string, body: any) => handleApiRequest('POST', path, body, new URLSearchParams()),
    patch: (path: string, body: any) => handleApiRequest('PATCH', path, body, new URLSearchParams()),
    put: (path: string, body: any) => handleApiRequest('PATCH', path, body, new URLSearchParams()), // Alias PUT to PATCH for simplicity
    delete: (path: string) => handleApiRequest('DELETE', path, null, new URLSearchParams()),
};