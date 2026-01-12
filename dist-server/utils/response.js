export const sendSuccess = (res, data = null, message, status = 200) => {
    return res.status(status).json({
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
    });
};
export const sendError = (res, message = 'Erro interno no servidor', status = 500, details) => {
    return res.status(status).json({
        success: false,
        error: message,
        details: details || null,
        timestamp: new Date().toISOString()
    });
};
