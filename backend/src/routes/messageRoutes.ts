import express from 'express';
import { ChatMessage, User } from '../models/index';
import { getIO } from '../server';

const router = express.Router();

// GET /api/messages - Buscar mensagens do usuário logado
router.get('/', async (req, res) => {
    try {
        const { userId, limit = 50, offset = 0 } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId é obrigatório' });
        }
        
        console.log(`🔍 Buscando mensagens para usuário ${userId}`);

        // Buscar todas as mensagens onde o usuário participa
        const messages = await ChatMessage.find({ 
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string));

        // Marcar mensagens recebidas como lidas
        await ChatMessage.updateMany(
            { 
                receiverId: userId,
                isRead: false
            },
            { isRead: true }
        );

        // Notificar sobre mensagens lidas
        const io = getIO();
        io.to(`user_${userId}`).emit('messages_read', {
            userId,
            timestamp: new Date()
        });

        res.json({
            success: true,
            messages: messages.reverse(), // Ordenar por timestamp crescente
            total: messages.length
        });

    } catch (error: any) {
        console.error('❌ Erro ao buscar mensagens:', error);
        res.status(500).json({ error: 'Erro interno ao buscar mensagens' });
    }
});

// GET /api/chats/:userId/messages - Rota para buscar mensagens de um chat específico
router.get('/chats/:userId/messages', async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentUserId } = req.query;
        const { limit = 50, offset = 0 } = req.query;
        
        // Validar se o userId do usuário logado foi fornecido
        if (!currentUserId) {
            return res.status(400).json({ error: 'currentUserId é obrigatório' });
        }
        
        console.log(`🔍 Buscando mensagens entre usuários ${currentUserId} e ${userId}`);

        // Buscar todas as mensagens onde os usuários participam
        const messages = await ChatMessage.find({ 
            $or: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId }
            ]
        })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string));

        // Marcar mensagens recebidas como lidas
        await ChatMessage.updateMany(
            { 
                senderId: userId,
                receiverId: currentUserId,
                isRead: false
            },
            { isRead: true }
        );

        // Notificar sobre mensagens lidas
        const io = getIO();
        io.to(`user_${currentUserId}`).emit('messages_read', {
            userId: currentUserId,
            timestamp: new Date()
        });

        res.json({
            success: true,
            messages: messages.reverse(), // Ordenar por timestamp crescente
            total: messages.length
        });

    } catch (error: any) {
        console.error('❌ Erro ao buscar mensagens do usuário:', error);
        res.status(500).json({ error: 'Erro interno ao buscar mensagens' });
    }
});

// POST /api/messages - Enviar nova mensagem
router.post('/', async (req, res) => {
    try {
        const { conversationId, senderId, receiverId, content, type = 'text' } = req.body;
        
        if (!conversationId || !senderId || !receiverId || !content) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        console.log(`📨 Nova mensagem de ${senderId} para ${receiverId}`);

        // Criar mensagem
        const message = await ChatMessage.create({
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId,
            senderId,
            receiverId,
            content,
            type,
            timestamp: new Date(),
            isRead: false
        });

        // Buscar detalhes do remetente
        const sender = await User.findOne({ id: senderId }).select('id name avatarUrl');

        // Enviar via WebSocket em tempo real
        const io = getIO();
        
        // Notificar receptor
        io.to(`user_${receiverId}`).emit('new_message', {
            ...message.toJSON(),
            sender: sender
        });

        // Notificar todos na conversa
        io.to(`conversation_${conversationId}`).emit('conversation_update', {
            conversationId,
            lastMessage: {
                content,
                senderId,
                timestamp: new Date()
            }
        });

        res.json({
            success: true,
            message: message
        });

    } catch (error: any) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Erro interno ao enviar mensagem' });
    }
});

export default router;
