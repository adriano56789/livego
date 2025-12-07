// Utilitário de segurança para gerenciamento de bloqueio de dispositivos

// Chave para armazenar o status de bloqueio no localStorage
const BLOCKED_DEVICE_KEY = 'device_blocked';
const SECURITY_VIOLATION_KEY = 'security_violations';
const MAX_VIOLATIONS = 3; // Número máximo de violações antes de bloquear o dispositivo

/**
 * Verifica se o dispositivo está bloqueado
 */
export const isDeviceBlocked = (): boolean => {
    if (typeof window === 'undefined') return false;
    

    return localStorage.getItem(BLOCKED_DEVICE_KEY) !== null;
};

/**
 * Registra uma violação de segurança
 */
export const logSecurityViolation = (reason: string, details?: any): void => {
    if (typeof window === 'undefined') return;
    
    // Obtém o histórico de violações
    const violations = JSON.parse(localStorage.getItem(SECURITY_VIOLATION_KEY) || '[]');
    
    // Adiciona a nova violação
    const violation = {
        timestamp: Date.now(),
        reason,
        details: details || {},
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    violations.push(violation);
    localStorage.setItem(SECURITY_VIOLATION_KEY, JSON.stringify(violations));
    
    // Se exceder o número máximo de violações, bloqueia o dispositivo
    if (violations.length >= MAX_VIOLATIONS) {
        blockDevice('Número máximo de violações de segurança excedido');
    }
};

/**
 * Bloqueia o dispositivo
 */
export const blockDevice = (reason: string): void => {
    if (typeof window === 'undefined') return;
    
    const blockData = {
        timestamp: Date.now(),
        reason,
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    localStorage.setItem(BLOCKED_DEVICE_KEY, JSON.stringify(blockData));
    
    // Força o redirecionamento para a página de login
    window.dispatchEvent(new CustomEvent('security:deviceBlocked', { detail: blockData }));
    
    // Se estiver em um ambiente de navegador, redireciona para a página de login
    if (typeof window !== 'undefined') {
        // Limpa os dados de autenticação existentes
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        // Redireciona para a página de login com um parâmetro de consulta
        window.location.href = '/login?blocked=true';
    }
};

/**
 * Verifica e aplica o bloqueio do dispositivo se necessário
 */
export const checkDeviceStatus = (): boolean => {
    if (isDeviceBlocked()) {
        if (typeof window !== 'undefined') {
            // Se já estiver na página de login, não redireciona novamente
            if (!window.location.pathname.includes('login')) {
                window.location.href = '/login?blocked=true';
            }
        }
        return true;
    }
    return false;
};

/**
 * Limpa o status de bloqueio (apenas para fins de desenvolvimento)
 */
export const clearDeviceBlock = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(BLOCKED_DEVICE_KEY);
        localStorage.removeItem(SECURITY_VIOLATION_KEY);
    }
};

// Verifica o status do dispositivo ao carregar o módulo
if (typeof window !== 'undefined') {
    checkDeviceStatus();
}
