import express from 'express';
import { ChatMessage, User } from '../models/index';

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
            .sort({ sentAt: -1 })
            .limit(parseInt(limit as string))
            .skip(parseInt(offset as string));

        // Buscar dados únicos dos remetentes
        const senderIds = [...new Set(messages.map(msg => msg.senderId))];
        const senders = await User.find({ id: { $in: senderIds } }).select('id name avatarUrl age level identification birthday');
        const senderMap = new Map(senders.map(sender => [sender.id, sender]));

        // Mapear para o formato Message esperado pelo frontend com dados do remetente
        const mappedMessages = messages.reverse().map((msg: any) => {
            const sender = senderMap.get(msg.senderId);
            const senderData = sender ? {
                senderName: sender.name,
                senderAvatar: sender.avatarUrl,
                senderAge: sender.age,
                senderLevel: sender.level,
                senderIdentification: sender.identification,
                senderBirthday: sender.birthday
            } : {};

            return {
                id: msg.id,
                chatId: msg.conversationId || `chat_${[msg.senderId, msg.receiverId].sort().join('_')}`,
                from: msg.senderId,
                to: msg.receiverId,
                text: msg.content || '',
                imageUrl: msg.messageType === 'image' ? msg.content : undefined,
                timestamp: msg.sentAt?.toISOString() || new Date().toISOString(),
                status: msg.isRead ? 'read' : 'delivered',
                ...senderData
            };
        });

        res.json({
            success: true,
            messages: mappedMessages,
            total: mappedMessages.length
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
            .sort({ sentAt: 1 }) // Ordem cronológica ascendente
            .limit(parseInt(limit as string))
            .skip(parseInt(offset as string));

        // Buscar dados únicos dos remetentes
        const senderIds = [...new Set(messages.map(msg => msg.senderId))];
        const senders = await User.find({ id: { $in: senderIds } }).select('id name avatarUrl age level identification');
        const senderMap = new Map(senders.map(sender => [sender.id, sender]));

        // Mapear para o formato Message esperado pelo frontend com dados do remetente
        const mappedMessages = messages.map((msg: any) => {
            const sender = senderMap.get(msg.senderId);
            const senderData = sender ? {
                senderName: sender.name,
                senderAvatar: sender.avatarUrl,
                senderAge: sender.age,
                senderLevel: sender.level,
                senderIdentification: sender.identification,
                senderBirthday: sender.birthday
            } : {};

            return {
                id: msg.id,
                chatId: msg.conversationId || `chat_${[msg.senderId, msg.receiverId].sort().join('_')}`,
                from: msg.senderId,
                to: msg.receiverId,
                text: msg.messageType !== 'image' ? (msg.content || '') : '',
                imageUrl: msg.messageType === 'image' ? msg.content : undefined,
                timestamp: msg.sentAt?.toISOString() || new Date().toISOString(),
                status: msg.isRead ? 'read' : 'delivered',
                ...senderData
            };
        });

        console.log(`📊 Encontradas ${mappedMessages.length} mensagens`);

        // Marcar mensagens recebidas como lidas (em segundo plano)
        ChatMessage.updateMany(
            {
                senderId: userId,
                receiverId: currentUserId,
                isRead: false
            },
            { isRead: true }
        ).catch(console.error);

        // Notificar sobre mensagens lidas via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${currentUserId}`).emit('messages_read', {
                userId: currentUserId,
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            messages: mappedMessages,
            total: mappedMessages.length
        });

    } catch (error: any) {
        console.error('❌ Erro ao buscar mensagens do usuário:', error);
        res.status(500).json({ error: 'Erro interno ao buscar mensagens' });
    }
});

// POST /api/messages - Enviar nova mensagem
router.post('/', async (req, res) => {
    try {
        const { conversationId, senderId, receiverId, content, messageType = 'text', imageUrl } = req.body;

        if (!conversationId || !senderId || !receiverId || (!content && !imageUrl)) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        console.log(`📨 Nova mensagem de ${senderId} para ${receiverId} - Tipo: ${messageType}`);

        // Criar mensagem
        const message = await ChatMessage.create({
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId,
            senderId,
            receiverId,
            content: messageType === 'image' ? imageUrl : content,
            messageType,
            sentAt: new Date(),
            isRead: false
        });

        // Buscar detalhes do remetente
        const sender = await User.findOne({ id: senderId }).select('id name avatarUrl age level identification birthday');

        // Preparar mensagem para frontend
        const messageData = {
            id: message.id,
            chatId: conversationId,
            from: senderId,
            to: receiverId,
            text: messageType !== 'image' ? (content || '') : '',
            imageUrl: messageType === 'image' ? imageUrl : undefined,
            timestamp: message.sentAt?.toISOString() || new Date().toISOString(),
            status: 'sent',
            senderName: sender?.name,
            senderAvatar: sender?.avatarUrl,
            senderAge: sender?.age,
            senderLevel: sender?.level,
            senderIdentification: sender?.identification,
            senderBirthday: sender?.birthday
        };

        // Enviar via WebSocket em tempo real
        const io = req.app.get('io');
        if (io) {
            // Notificar receptor
            io.to(`user_${receiverId}`).emit('new_message', messageData);

            // Notificar todos na conversa
            io.to(`conversation_${conversationId}`).emit('conversation_update', {
                conversationId,
                lastMessage: {
                    content: messageType === 'image' ? '[Imagem]' : content,
                    senderId,
                    timestamp: new Date()
                }
            });

            // Adicionar notificação ao histórico do receptor
            io.to(`user_${receiverId}`).emit('chat_notification', {
                type: 'new_message',
                from: senderId,
                fromName: sender?.name,
                fromAvatar: sender?.avatarUrl,
                message: messageType === 'image' ? '[Imagem]' : (content || ''),
                timestamp: new Date().toISOString(),
                conversationId
            });
        }

        res.json({
            success: true,
            message: messageData
        });

    } catch (error: any) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Erro interno ao enviar mensagem' });
    }
});

// DELETE /api/messages/:messageId - Apagar mensagem específica
router.delete('/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userId } = req.query;

        if (!messageId) {
            return res.status(400).json({ error: 'messageId é obrigatório' });
        }

        console.log(`🗑️ Apagando mensagem ${messageId} pelo usuário ${userId}`);

        // Buscar a mensagem para verificar se o usuário tem permissão
        const message = await ChatMessage.findOne({ id: messageId });

        if (!message) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }

        // Verificar se o usuário é o remetente ou o destinatário da mensagem
        if (message.senderId !== userId && message.receiverId !== userId) {
            return res.status(403).json({ error: 'Sem permissão para apagar esta mensagem' });
        }

        // Apagar a mensagem
        await ChatMessage.deleteOne({ id: messageId });

        console.log(`✅ Mensagem ${messageId} apagada com sucesso`);

        res.json({
            success: true,
            message: 'Mensagem apagada com sucesso'
        });

    } catch (error: any) {
        console.error('❌ Erro ao apagar mensagem:', error);
        res.status(500).json({ error: 'Erro interno ao apagar mensagem' });
    }
});

export default router;
