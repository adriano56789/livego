import { Request, Response, NextFunction } from 'express';

// Middleware para bloquear URLs Base64 em todo o sistema
export const blockBase64Middleware = (req: Request, res: Response, next: NextFunction) => {
    const body = req.body;
    
    // Função para verificar se objeto contém URLs Base64
    const containsBase64 = (obj: any): boolean => {
        if (!obj || typeof obj !== 'object') return false;
        
        for (const key in obj) {
            const value = obj[key];
            if (typeof value === 'string' && value.startsWith('data:image')) {
                return true;
            }
            if (typeof value === 'object' && containsBase64(value)) {
                return true;
            }
        }
        return false;
    };
    
    // Verificar se o corpo da requisição contém URLs Base64
    if (containsBase64(body)) {
        console.log('🚫 [BLOCKED] Tentativa de usar URL Base64:', {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        
        return res.status(400).json({
            success: false,
            error: 'URLs Base64 não são permitidas. Use o upload de arquivos via /api/upload/avatar/:userId',
            code: 'BASE64_BLOCKED'
        });
    }
    
    next();
};
