import { sendError } from '../utils/response.js';
export const globalErrorHandler = (err, req, res, next) => {
    console.error(`[REST_API_EXCEPTION] ${req.method} ${req.path}:`, err);
    if (err.name === 'ValidationError') {
        return sendError(res, 'Falha de validação nos dados enviados.', 400, err.errors);
    }
    if (err.name === 'CastError') {
        return sendError(res, 'ID de recurso inválido ou mal formatado.', 400);
    }
    if (err.code === 11000) {
        return sendError(res, 'Dado duplicado detectado (E-mail ou ID já existe).', 409);
    }
    if (err.name === 'JsonWebTokenError') {
        return sendError(res, 'Token de segurança inválido.', 401);
    }
    return sendError(res, err.message || 'Erro inesperado na intermediação de dados.', err.status || 500);
};
