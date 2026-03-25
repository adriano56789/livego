/**
 * Utilitário para mascarar dados sensíveis em logs
 * Protege emails, userIds e outras informações privadas
 */

// Função principal para mascarar dados sensíveis
export const maskSensitiveData = (data: any): any => {
    if (!data) return data;
    
    // Se for string, verificar se contém dados sensíveis
    if (typeof data === 'string') {
        return maskSensitiveString(data);
    }
    
    // Se for objeto, mascarar campos específicos recursivamente
    if (typeof data === 'object' && data !== null) {
        return maskSensitiveObject(data);
    }
    
    return data;
};

// Mascara dados sensíveis em strings
const maskSensitiveString = (str: string): string => {
    if (!str || typeof str !== 'string') return str;
    
    // Mascarar email - ocultar completamente o nome do usuário
    if (str.includes('@')) {
        const emailMatch = str.match(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)/);
        if (emailMatch) {
            const domain = emailMatch[2];
            return `*********@${domain}`;
        }
    }
    
    // Mascarar userId (padrão: sequência de números)
    const userIdMatch = str.match(/\b(\d{8,})\b/);
    if (userIdMatch) {
        const userId = userIdMatch[1];
        return str.replace(userId, userId.substring(0, 2) + '*'.repeat(userId.length - 2));
    }
    
    return str;
};

// Mascara dados sensíveis em objetos (recursivo)
const maskSensitiveObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Se for array, mascarar cada elemento
    if (Array.isArray(obj)) {
        return obj.map(item => maskSensitiveObject(item));
    }
    
    // Criar cópia para não modificar o original
    const masked = { ...obj };
    
    // Lista de campos sensíveis para mascarar
    const sensitiveFields = [
        'email', 'userId', 'user_id', 'pixKey', 'pix_key', 
        'identification', 'id', 'token', 'password'
    ];
    
    // Mascarar campos diretos
    sensitiveFields.forEach(field => {
        if (masked[field] && typeof masked[field] === 'string') {
            if (field === 'email' || field.includes('pix')) {
                // Email e chave PIX: mascarar completamente
                const emailMatch = masked[field].match(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)/);
                if (emailMatch) {
                    const domain = emailMatch[2];
                    masked[field] = `*********@${domain}`;
                } else if (masked[field].length > 4) {
                    // Chave PIX não-email (CPF, telefone, etc)
                    masked[field] = masked[field].substring(0, 2) + '*'.repeat(masked[field].length - 4) + masked[field].substring(masked[field].length - 2);
                }
            } else if (field.includes('id') && !field.includes('room')) {
                // IDs: manter apenas 2 primeiros caracteres
                if (masked[field].length > 2) {
                    masked[field] = masked[field].substring(0, 2) + '*'.repeat(masked[field].length - 2);
                } else {
                    masked[field] = '***';
                }
            } else if (field === 'password' || field === 'token') {
                // Senhas e tokens: mascarar completamente
                masked[field] = '***';
            }
        }
    });
    
    // Mascarar campos aninhados
    Object.keys(masked).forEach(key => {
        if (typeof masked[key] === 'object' && masked[key] !== null) {
            masked[key] = maskSensitiveObject(masked[key]);
        } else if (typeof masked[key] === 'string') {
            masked[key] = maskSensitiveString(masked[key]);
        }
    });
    
    return masked;
};

// Função específica para logs de console
export const safeLog = (message: string, data?: any) => {
    if (data) {
        console.log(message, maskSensitiveData(data));
    } else {
        console.log(maskSensitiveString(message));
    }
};

// Função específica para logs de erro
export const safeError = (message: string, error?: any) => {
    if (error) {
        console.error(message, maskSensitiveData(error));
    } else {
        console.error(maskSensitiveString(message));
    }
};

// Função específica para logs de aviso
export const safeWarn = (message: string, data?: any) => {
    if (data) {
        console.warn(message, maskSensitiveData(data));
    } else {
        console.warn(maskSensitiveString(message));
    }
};
