
/**
 * PROTECTION AGENT (AGENTE DE PROTEÇÃO)
 * 
 * Este serviço atua como um guardião de integridade para a API e o Banco de Dados.
 * Ele intercepta requisições para garantir que dados críticos não sejam apagados
 * e que a estrutura das rotas permaneça íntegra.
 */

// Lista de operações 'DELETE' que são funcionais (estado) e não destruição de dados críticos.
// Tudo que NÃO estiver aqui será bloqueado se o método for DELETE.
const ALLOWED_DELETE_OPERATIONS = [
    '/unblock',       // Permitir desbloquear usuário (alteração de status)
    '/rtc/v1/stop',   // Permitir parar stream (controle de sessão)
];

export const ProtectionAgent = {
    /**
     * Valida se uma requisição é segura para ser processada.
     * @returns {boolean} True se permitida, False se bloqueada.
     */
    validateAction: (method: string, path: string, body?: any): boolean => {
        // 1. Bloqueio Geral de Deleção de Dados Críticos
        if (method === 'DELETE') {
            const isAllowed = ALLOWED_DELETE_OPERATIONS.some(op => path.includes(op));
            
            if (!isAllowed) {
                ProtectionAgent.logBlock(method, path, "Tentativa de apagar dados críticos do banco de dados.");
                return false;
            }
        }

        // 2. Bloqueio de Alteração de Definições de Rota (Simulação)
        // Se alguém tentar enviar um comando para alterar configurações de sistema via API exposta
        if (path.includes('/api/system') || path.includes('/api/config/routes')) {
             ProtectionAgent.logBlock(method, path, "Tentativa de alteração estrutural da API.");
             return false;
        }

        // 3. Proteção de Integridade de Usuário (Evitar overwrite total de Admin)
        if (method === 'PUT' && path.includes('/users/10755083')) { // ID do Admin/CurrentUser
             // Verifica se está tentando zerar saldo ou remover status crítico
             if (body && (body.diamonds === 0 || body.level === 0)) {
                 ProtectionAgent.logBlock(method, path, "Tentativa de corromper dados do usuário principal.");
                 return false;
             }
        }

        return true;
    },

    /**
     * Gera um log visual agressivo no console para alertar sobre a ação bloqueada.
     */
    logBlock: (method: string, path: string, reason: string) => {
        const timestamp = new Date().toLocaleTimeString();
        console.group(`%c⛔ [AGENTE DE PROTEÇÃO] AÇÃO BLOQUEADA - ${timestamp}`, 'background: #7f1d1d; color: #fff; padding: 4px; border-radius: 4px; font-weight: bold; font-size: 12px;');
        console.error(`%cRota Alvo: ${method} ${path}`, 'font-weight: bold;');
        console.warn(`%cMotivo: ${reason}`, 'color: #fca5a5;');
        console.log(`%cO agente impediu que esta operação afetasse o banco de dados.`, 'color: #e5e7eb;');
        console.groupEnd();
    }
};
