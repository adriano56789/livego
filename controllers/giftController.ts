
import { GiftModel } from '../models/Gift.js';
import { UserModel } from '../models/User.js';
import { TransactionModel } from '../models/Transaction.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { Response, NextFunction } from 'express';

export const giftController = {
    getAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { category } = req.query;
            const query = category ? { category: category as string } : {};
            const gifts = await GiftModel.find(query).sort({ price: 1 });
            return sendSuccess(res, gifts);
        } catch (err: any) {
            next(err);
        }
    },

    getGallery: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const mockGallery = await GiftModel.find().limit(5);
            const galleryWithCount = mockGallery.map(g => ({ ...g.toObject(), count: Math.floor(Math.random() * 10) + 1 }));
            return sendSuccess(res, galleryWithCount);
        } catch (error) {
            next(error);
        }
    },

    sendGift: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { giftName, amount, toUserId, streamId } = req.body;
            const fromUserId = req.userId; 

            const sender = await UserModel.findOne({ id: fromUserId });
            const gift = await GiftModel.findOne({ name: giftName });
            const receiver = toUserId ? await UserModel.findOne({ id: toUserId }) : null;


            if (!sender || !gift) return sendError(res, "Dados de transação inválidos.", 404);

            const totalCost = (gift as any).price * amount;
            if ((sender as any).diamonds < totalCost) {
                return sendError(res, "Saldo de diamantes insuficiente.", 400);
            }

            const updatedSender = await UserModel.findOneAndUpdate(
                { id: fromUserId },
                { $inc: { diamonds: -totalCost, xp: totalCost } },
                { new: true }
            );

            if (toUserId) {
                const earningsForReceiver = Math.floor(totalCost * 0.5);
                await UserModel.findOneAndUpdate(
                    { id: toUserId },
                    { $inc: { earnings: earningsForReceiver } }
                );
            }

            await TransactionModel.create({
                id: `gift-${Date.now()}`,
                userId: fromUserId,
                type: 'gift',
                amountDiamonds: totalCost,
                status: 'completed',
                details: { giftName, recipientId: toUserId, quantity: amount }
            });
            
            if ((req as any).io && streamId) {
                const giftPayload = {
                    fromUser: updatedSender,
                    toUser: { id: toUserId, name: (receiver as any)?.name || 'Streamer' },
                    gift: gift,
                    quantity: amount,
                    roomId: streamId 
                };
                (req as any).io.to(streamId).emit('newStreamGift', giftPayload);
            }

            return sendSuccess(res, {updatedSender}, "Presente enviado com sucesso.");
        } catch (error: any) {
            next(error);
        }
    },

    sendBackpackGift: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { giftId, amount, toUserId, streamId } = req.body;
            const fromUserId = req.userId;

            // Mock implementation: Assume user has the gift and send success
            const updatedSender = await UserModel.findOne({ id: fromUserId });
            const gift = await GiftModel.findOne({ id: giftId });
            const receiver = await UserModel.findOne({ id: toUserId });
            
            if ((req as any).io && streamId) {
                 const giftPayload = {
                    fromUser: updatedSender,
                    toUser: { id: toUserId, name: receiver?.name || 'Streamer' },
                    gift: gift,
                    quantity: amount,
                    roomId: streamId 
                };
                (req as any).io.to(streamId).emit('newStreamGift', giftPayload);
            }

            return sendSuccess(res, { success: true, updatedSender });
        } catch (error) {
            next(error);
        }
    }
};
