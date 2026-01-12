import { sendSuccess } from '../utils/response.js';
export const adminController = {
    getAdminWithdrawalHistory: async (req, res, next) => {
        try {
            const mockHistory = [
                { id: 'wh-admin-1', userId: 'admin', amountBRL: 500.00, status: 'Concluído', type: 'withdrawal', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), description: 'Saque PIX Admin' },
            ];
            return sendSuccess(res, mockHistory);
        }
        catch (error) {
            next(error);
        }
    },
    requestWithdrawal: async (req, res, next) => {
        try {
            return sendSuccess(res, { success: true }, "Solicitação de saque de admin registrada.");
        }
        catch (error) {
            next(error);
        }
    },
    saveWithdrawalMethod: async (req, res, next) => {
        try {
            return sendSuccess(res, { success: true }, "Método de saque de admin salvo.");
        }
        catch (error) {
            next(error);
        }
    }
};
