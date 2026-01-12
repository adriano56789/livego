import { Response } from 'express';
import { TransactionModel } from '../models/Transaction.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

export const mercadoPagoController = {
    createPreference: async (req: AuthRequest, res: Response) => {
        try {
            const { details } = req.body;
            const { diamonds, price } = details;
            const userId = req.userId;

            if (!userId || !diamonds || typeof price === 'undefined') {
                return sendError(res, "Dados da preferência inválidos.", 400);
            }

            const preferenceId = `mp-pref-${Date.now()}-${userId}`;

            await TransactionModel.create({
                id: preferenceId,
                userId: userId,
                type: 'recharge',
                amountDiamonds: diamonds,
                amountBRL: price,
                status: 'pending',
                details: { method: 'mercadopago', preferenceId }
            });

            return sendSuccess(res, { preferenceId });

        } catch (err) {
            console.error("[MercadoPago] Erro ao criar preferência:", err);
            return sendError(res, "Falha ao criar preferência de pagamento.");
        }
    },
};
