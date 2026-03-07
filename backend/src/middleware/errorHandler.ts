import { Request, Response, NextFunction } from 'express';

/**
 * Middleware global para padronizar respostas de erro
 * Garante que todas as APIs retornem status 200 com formato consistente
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Global Error Handler]', {
        error: err.message || err,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query
    });

    // Sempre retornar status 200 com formato padrão
    res.json({
        success: false,
        error: err.message || 'Internal server error',
        data: null
    });
};

/**
 * Wrapper para async routes - captura erros e padroniza resposta
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Função utilitária para respostas de erro padronizadas
 */
export const sendErrorResponse = (res: Response, message: string, data: any = null) => {
    console.error('[API Error]', { message, data });
    res.json({
        success: false,
        error: message,
        data
    });
};

/**
 * Função utilitária para respostas de sucesso padronizadas
 */
export const sendSuccessResponse = (res: Response, data: any, message?: string) => {
    res.json({
        success: true,
        data,
        message
    });
};
