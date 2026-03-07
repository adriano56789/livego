import express from 'express';
import { Chat, ChatMessage, User } from '../models/index';

const router = express.Router();

// GET /api/chats - Listar todos os chats do usuário
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId é obrigatório' });
        }

        console.log(`🔍 Buscando chats para usuário: ${userId}`);

        // Buscar chats onde o usuário participa
        const chats = await Chat.find({
            participants: userId,
            isActive: true
        }).sort({ 'lastMessage.timestamp': -1 });

        console.log(`📊 Encontrados ${chats.length} chats para usuário ${userId}`);

        // Para cada chat, buscar informações adicionais
        const chatsWithDetails = await Promise.all(
            chats.map(async (chat) => {
                // Buscar informações dos outros participantes
                const otherParticipants = chat.participants.filter((p: any) => p !== userId);
                const participantDetails = await User.find({
                    id: { $in: otherParticipants }
                }).select('id name avatarUrl');

                // Contar mensagens não lidas
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
                    metadata: chat.metadata,
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
        console.error('❌ Erro ao buscar chats:', error);
        res.status(500).json({
            error: 'Erro ao buscar chats',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// GET /api/chats/:id/messages - Buscar mensagens de um chat específico
router.get('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, page = 1, limit = 50 } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId é obrigatório' });
        }

        console.log(`🔍 Buscando mensagens do chat ${id} para usuário ${userId}`);

        // Verificar se o usuário tem acesso ao chat
        const chat = await Chat.findOne({
            id,
            participants: userId,
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat não encontrado ou sem permissão' });
        }

        // Buscar mensagens paginadas
        const skip = (Number(page) - 1) * Number(limit);

        const messages = await ChatMessage.find({
            conversationId: id
        })
            .sort({ sentAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        // Buscar detalhes dos remetentes
        const senderIds = [...new Set(messages.map((m: any) => m.senderId))];
        const senders = await User.find({
            id: { $in: senderIds }
        }).select('id name avatarUrl');

        const senderMap = senders.reduce((acc: any, sender) => {
            acc[sender.id] = sender;
            return acc;
        }, {});

        // Formatar mensagens com detalhes dos remetentes
        const formattedMessages = messages.map((message: any) => ({
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            receiverId: message.receiverId,
            content: message.content,
            messageType: message.messageType,
            isRead: message.isRead,
            readAt: message.readAt,
            sentAt: message.sentAt,
            sender: senderMap[message.senderId] || { id: message.senderId, name: 'Usuário', avatarUrl: '' }
        })).reverse(); // Ordem cronológica (mais antiga primeiro)

        console.log(`📊 Encontradas ${formattedMessages.length} mensagens`);

        res.json({
            success: true,
            data: {
                messages: formattedMessages,
                chat: {
                    id: chat.id,
                    type: chat.type,
                    title: chat.title,
                    participants: chat.participants,
                    metadata: chat.metadata
                },
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: formattedMessages.length,
                    hasMore: formattedMessages.length === Number(limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        res.status(500).json({
            error: 'Erro ao buscar mensagens',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// POST /api/chats - Criar novo chat
router.post('/', async (req, res) => {
    try {
        const { participants, type = 'private', title } = req.body;

        if (!participants || participants.length < 2) {
            return res.status(400).json({ error: 'Pelo menos 2 participantes são necessários' });
        }

        // Verificar se já existe chat privado entre os mesmos participantes
        if (type === 'private' && participants.length === 2) {
            const existingChat = await Chat.findOne({
                participants: { $all: participants },
                type: 'private',
                isActive: true
            });

            if (existingChat) {
                return res.json({
                    success: true,
                    data: existingChat,
                    message: 'Chat já existe'
                });
            }
        }

        // Criar novo chat
        const newChat = await Chat.create({
            id: `chat_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            participants,
            type,
            title: type === 'group' ? title : undefined,
            isActive: true,
            metadata: type === 'group' ? { groupId: `group_${Date.now()}` } : {}
        });

        console.log(`✅ Chat criado: ${newChat.id}`);

        res.status(201).json({
            success: true,
            data: newChat,
            message: 'Chat criado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao criar chat:', error);
        res.status(500).json({
            error: 'Erro ao criar chat',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// POST /api/chats/send - Enviar mensagem (rota simplificada)
router.post('/send', async (req, res) => {
    try {
        console.log('🔍 Body recebido:', JSON.stringify(req.body, null, 2));

        const { from, to, text, imageUrl, tempId } = req.body;

        if (!from || !to || (!text && !imageUrl)) {
            return res.status(400).json({ error: 'from, to e text ou imageUrl são obrigatórios' });
        }

        console.log(`📨 Enviando mensagem de ${from} para ${to}: ${text || '[imagem]'}`);

        // Criar ID da conversa (ordenado para manter consistência)
        const conversationId = `chat_private_${[from, to].sort().join('_')}`;
        const messageType = imageUrl ? 'image' : 'text';
        const content = imageUrl || text;

        // Criar nova mensagem
        const newMessage = await ChatMessage.create({
            id: tempId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId,
            senderId: from,
            receiverId: to,
            content: content,
            messageType,
            isRead: false,
            sentAt: new Date()
        });

        // Buscar detalhes do remetente
        const sender = await User.findOne({ id: from }).select('id name avatarUrl');

        // Formatar resposta no formato Message esperado pelo frontend
        const frontendMessage = {
            id: newMessage.id,
            chatId: conversationId,
            from: newMessage.senderId,
            to: newMessage.receiverId,
            text: messageType !== 'image' ? (newMessage.content || '') : '',
            imageUrl: messageType === 'image' ? newMessage.content : undefined,
            timestamp: newMessage.sentAt?.toISOString() || new Date().toISOString(),
            status: 'sent',
        };

        // Enviar via WebSocket em tempo real
        const io = req.app.get('io');

        // Notificar receptor
        io.to(`user_${to}`).emit('newMessage', {
            ...frontendMessage,
            sender: sender || { id: from, name: 'Usuário', avatarUrl: '' }
        });

        // Notificar remetente sobre sucesso
        io.to(`user_${from}`).emit('message_sent', {
            tempId,
            messageId: newMessage.id,
            success: true
        });

        res.json({
            success: true,
            message: frontendMessage
        });

    } catch (error: any) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({
            error: 'Erro ao enviar mensagem',
            details: error.message
        });
    }
});

// POST /api/chats/:id/messages - Enviar nova mensagem
router.post('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const { senderId, receiverId, content, messageType = 'text' } = req.body;

        if (!senderId || !content) {
            return res.status(400).json({ error: 'senderId e content são obrigatórios' });
        }

        // Verificar se o usuário tem acesso ao chat
        const chat = await Chat.findOne({
            id,
            participants: senderId,
            isActive: true
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat não encontrado ou sem permissão' });
        }

        // Criar nova mensagem
        const newMessage = await ChatMessage.create({
            id: `msg_${id}_${senderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId: id,
            senderId,
            receiverId: receiverId || senderId, // Para grupos, usar o próprio senderId
            content,
            messageType,
            isRead: false,
            sentAt: new Date()
        });

        // Atualizar última mensagem do chat
        await Chat.findOneAndUpdate(
            { id },
            {
                lastMessage: {
                    content: newMessage.content,
                    senderId: newMessage.senderId,
                    timestamp: newMessage.sentAt,
                    messageType: newMessage.messageType
                },
                updatedAt: new Date()
            }
        );

        console.log(`✅ Mensagem enviada no chat ${id}: ${content.substring(0, 50)}...`);

        res.status(201).json({
            success: true,
            data: newMessage,
            message: 'Mensagem enviada com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({
            error: 'Erro ao enviar mensagem',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// PUT /api/messages/:id/read - Marcar mensagem como lida
router.put('/messages/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId é obrigatório' });
        }

        // Verificar se a mensagem pertence ao usuário
        const message = await ChatMessage.findOne({
            id,
            receiverId: userId
        });

        if (!message) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }

        // Marcar como lida
        await ChatMessage.findOneAndUpdate(
            { id },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        console.log(`✅ Mensagem ${id} marcada como lida`);

        res.json({
            success: true,
            message: 'Mensagem marcada como lida'
        });

    } catch (error) {
        console.error('❌ Erro ao marcar mensagem como lida:', error);
        res.status(500).json({
            error: 'Erro ao marcar mensagem como lida',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

export default router;
