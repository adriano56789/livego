import { Response } from 'express';

export const sendSuccess = (res: Response, data: any = null, message?: string, status = 200) => {
    return res.status(status).json({
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
    });
};

export const sendError = (res: Response, message: string = 'Erro interno no servidor', status = 500, details?: any) => {
    return res.status(status).json({
        success: false,
        error: message,
        details: details || null,
        timestamp: new Date().toISOString()
    });
};
