import { sendSuccess, sendError } from '../utils/response.js';
export const miscController = {
    translate: async (req, res, next) => {
        try {
            const { text } = req.body;
            if (!text) {
                return sendError(res, "O campo 'text' é obrigatório.", 400);
            }
            return sendSuccess(res, { translatedText: `(Traduzido) ${text}` });
        }
        catch (error) {
            next(error);
        }
    }
};
