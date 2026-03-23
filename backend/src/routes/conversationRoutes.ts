import express from 'express';
import { Chat, ChatMessage, User } from '../models/index';

const router = express.Router();

// GET /api/conversations - Listar todas as conversas do usuário
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false,
                error: 'userId é obrigatório' 
            });
        }

        console.log(`🔍 Buscando conversas para usuário: ${userId}`);

        // Buscar chats onde o usuário participa
        const chats = await Chat.find({ 
            participants: userId, 
            isActive: true 
        }).sort({ 'lastMessage.timestamp': -1 });

        // Enriquecer com detalhes dos participantes
        const chatsWithDetails = await Promise.all(
            chats.map(async (chat) => {
                const otherParticipants = chat.participants.filter((p: any) => p !== userId);
                const participantDetails = await User.find({ 
                    id: { $in: otherParticipants } 
                }).select('id name avatarUrl');

                const unreadCount = await ChatMessage.countDocuments({
                    conversationId: chat.id,
                    receiverId: userId,
                    isRead: false
                });

                return {
                    id: chat.id,
                    type: chat.type,
                    title: chat.title,
                    participants: participantDetails,
                    lastMessage: chat.lastMessage,
                    unreadCount,
                    isActive: chat.isActive,
                    createdAt: chat.createdAt,
                    updatedAt: chat.updatedAt
                };
            })
        );

        res.json({
            success: true,
            data: chatsWithDetails,
            count: chatsWithDetails.length
        });

    } catch (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao buscar conversas',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// GET /api/conversations/:id - Buscar conversa específica
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ 
                success: false,
                error: 'userId é obrigatório' 
            });
        }

        console.log(`🔍 Buscando conversa: ${id} para usuário: ${userId}`);

        const chat = await Chat.findOne({ 
            id, 
            participants: userId, 
            isActive: true 
        });

        if (!chat) {
            return res.status(404).json({ 
                success: false,
                error: 'Conversa não encontrada' 
            });
        }

        // Buscar detalhes dos participantes
        const participantDetails = await User.find({ 
            id: { $in: chat.participants } 
        }).select('id name avatarUrl');

        const unreadCount = await ChatMessage.countDocuments({
            conversationId: chat.id,
            receiverId: userId,
            isRead: false
        });

        const chatWithDetails = {
            id: chat.id,
            type: chat.type,
            title: chat.title,
            participants: participantDetails,
            lastMessage: chat.lastMessage,
            unreadCount,
            isActive: chat.isActive,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt
        };

        res.json({
            success: true,
            data: chatWithDetails
        });

    } catch (error) {
        console.error('❌ Erro ao buscar conversa:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao buscar conversa',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// GET /api/conversations/:id/messages - Buscar mensagens de uma conversa
router.get('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, page = 1, limit = 50 } = req.query;

        if (!userId) {
            return res.status(400).json({ 
                success: false,
                error: 'userId é obrigatório' 
            });
        }

        console.log(`🔍 Buscando mensagens da conversa: ${id} para usuário: ${userId}`);

        // Verificar se usuário tem acesso à conversa
        const chat = await Chat.findOne({ 
            id, 
            participants: userId, 
            isActive: true 
        });

        if (!chat) {
            return res.status(404).json({ 
                success: false,
                error: 'Conversa não encontrada' 
            });
        }

        // Calcular offset para paginação
        const offset = (Number(page) - 1) * Number(limit);

        // Buscar mensagens
        const messages = await ChatMessage.find({ 
            conversationId: id 
        })
        .sort({ sentAt: -1 })
        .skip(offset)
        .limit(Number(limit));

        // Buscar detalhes dos remetentes
        const messagesWithSenders = await Promise.all(
            messages.map(async (message) => {
                const sender = await User.findOne({ id: message.senderId }).select('id name avatarUrl');
                
                return {
                    id: message.id,
                    conversationId: message.conversationId,
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    content: message.content,
                    messageType: message.messageType,
                    isRead: message.isRead,
                    readAt: message.readAt,
                    sentAt: message.sentAt,
                    sender: sender || { id: message.senderId, name: 'Usuário', avatarUrl: '' }
                };
            })
        );

        // Inverter ordem para mostrar mais recentes por último
        const orderedMessages = messagesWithSenders.reverse();

        // Marcar mensagens não lidas como lidas
        await ChatMessage.updateMany(
            {
                conversationId: id,
                receiverId: userId,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({
            success: true,
            data: {
                messages: orderedMessages,
                chat: {
                    id: chat.id,
                    type: chat.type,
                    title: chat.title,
                    participants: chat.participants
                },
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    offset,
                    hasMore: messages.length === Number(limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao buscar mensagens',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// POST /api/conversations - Criar nova conversa
router.post('/', async (req, res) => {
    try {
        const { userId, participantIds, type = 'private', title } = req.body;

        if (!userId || !participantIds || participantIds.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'userId e participantIds são obrigatórios' 
            });
        }

        console.log(`💬 Criando conversa: ${type} com ${participantIds.length} participantes`);

        // Verificar se já existe conversa privada entre os participantes
        if (type === 'private' && participantIds.length === 1) {
            const existingChat = await Chat.findOne({
                type: 'private',
                participants: { $all: [userId, ...participantIds] },
                isActive: true
            });

            if (existingChat) {
                return res.json({
                    success: true,
                    data: existingChat,
                    message: 'Conversa já existe'
                });
            }
        }

        // Criar nova conversa com upsert automático
        const participants = [userId, ...participantIds];
        const chatId = `chat_${type}_${userId}_${participantIds.join('_')}_${Date.now()}`;

        const newChat = await Chat.findOneAndUpdate(
            { id: chatId },
            {
                id: chatId,
                participants,
                type,
                title: type === 'group' ? title : undefined,
                isActive: true
            },
            { 
                upsert: true, // Criar se não existir
                new: true
            }
        );

        console.log(`✅ Conversa criada: ${chatId}`);

        res.status(201).json({
            success: true,
            data: newChat,
            message: 'Conversa criada com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao criar conversa:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao criar conversa',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// DELETE /api/conversations/:id - Arquivar conversa (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ 
                success: false,
                error: 'userId é obrigatório' 
            });
        }

        console.log(`🗑️ Arquivando conversa: ${id} para usuário: ${userId}`);

        const chat = await Chat.findOneAndUpdate(
            { id, participants: userId },
            { isActive: false, updatedAt: new Date() },
            { new: true }
        );

        if (!chat) {
            return res.status(404).json({ 
                success: false,
                error: 'Conversa não encontrada' 
            });
        }

        res.json({
            success: true,
            message: 'Conversa arquivada com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao arquivar conversa:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao arquivar conversa',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

export default router;
