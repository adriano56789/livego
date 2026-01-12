import { sendSuccess, sendError } from '../utils/response.js';
import { ConversationModel } from '../models/Conversation.js';
import { UserModel } from '../models/User.js';
export const chatController = {
    getConversations: async (req, res) => {
        try {
            const userId = req.userId;
            let conversations = await ConversationModel.find({
                participants: userId
            }).lean();
            if (conversations.length === 0) {
                conversations = [{
                        id: 'conv-support',
                        friend: {
                            id: 'support-livercore',
                            name: 'Suporte LiveGo',
                            avatarUrl: 'https://picsum.photos/seed/support/200',
                            isOnline: true,
                            level: 99
                        },
                        lastMessage: 'Bem-vindo ao LiveGo! Como podemos ajudar?',
                        unreadCount: 1,
                        updatedAt: new Date().toISOString()
                    }];
            }
            return sendSuccess(res, conversations);
        }
        catch (err) {
            return sendSuccess(res, []);
        }
    },
    sendMessageToStream: async (req, res, next) => {
        try {
            const { roomId } = req.params;
            const messagePayload = req.body;
            if (!roomId || !messagePayload || !messagePayload.message) {
                return sendError(res, 'Dados da mensagem inválidos.', 400);
            }
            if (req.io) {
                req.io.to(roomId).emit('newStreamMessage', {
                    ...messagePayload,
                    id: Date.now()
                });
            }
            return sendSuccess(res, null, "Mensagem enviada.");
        }
        catch (error) {
            next(error);
        }
    },
    start: async (req, res, next) => {
        try {
            // Mock implementation: simply returns success
            return sendSuccess(res, { success: true }, "Conversa iniciada.");
        }
        catch (error) {
            next(error);
        }
    },
    getFriends: async (req, res) => {
        try {
            const friends = await UserModel.find({ id: { $ne: req.userId } }).limit(10);
            return sendSuccess(res, friends);
        }
        catch (err) {
            return sendSuccess(res, []);
        }
    },
    getRanking: async (req, res) => {
        try {
            const topUsers = await UserModel.find().sort({ diamonds: -1 }).limit(20);
            const formattedRanking = topUsers.map((u, index) => ({
                ...u.toJSON(),
                rank: index + 1,
                value: (Number(u.diamonds) || 0) * 10
            }));
            return sendSuccess(res, formattedRanking);
        }
        catch (err) {
            return sendSuccess(res, []);
        }
    }
};
