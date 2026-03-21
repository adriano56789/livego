import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import { User, Message, Follow, Friendship, Streamer } from './models/index';
import userRoutes from './routes/userRoutes';
import profileRoutes from './routes/profileRoutes';
import walletRoutes from './routes/walletRoutes';
import checkoutRoutes from './routes/checkoutRoutes';
import adminRoutes from './routes/adminRoutes';
import metadataRoutes from './routes/metadataRoutes';
import settingsRoutes from './routes/settingsRoutes';
import liveRoutes from './routes/liveRoutes';
import pkRoutes from './routes/pkRoutes';
import interactionRoutes from './routes/interactionRoutes';
import authRoutes from './routes/authRoutes';
import mediaRoutes from './routes/mediaRoutes';
import chatRoutes from './routes/chatRoutes';
import profilePhotoRoutes from './routes/profilePhotoRoutes';
import conversationRoutes from './routes/conversationRoutes';
import searchRoutes from './routes/searchRoutes';
import messageRoutes from './routes/messageRoutes';
import statusRoutes from './routes/statusRoutes';
import followersRoutes from './routes/followersRoutes';
import friendshipRoutes from './routes/friendshipRoutes';
import blockRoutes from './routes/blockRoutes';
import locationRoutes from './routes/locationRoutes';
import shopRoutes from './routes/shopRoutes';
import frameRoutes from './routes/frameRoutes';
import contributionRoutes from './routes/contributionRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import uploadRoutes from './routes/uploadRoutes';
import manualRoutes from './routes/manualRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { blockBase64Middleware } from './middleware/blockBase64';

dotenv.config({ path: '.env.production' });

const app = express();
app.set('etag', false); // Desabilitar ETag para sempre retornar 200 em vez de 304
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Aceitar qualquer origem
        methods: ['GET', 'POST']
    }
});
const port = parseInt(process.env.PORT || '3000');
const wsPort = parseInt(process.env.WS_PORT || '3001');

connectDB();

// Middleware CORS - configurado antes de tudo
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://livego.store'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Origin', 'Accept', 'cache-control', 'pragma'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
}));

// Middleware para headers adicionais
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept, Cache-Control, Pragma, cache-control, pragma');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');

    // Log de acesso para debug
    console.log(`🌍 [ACESSO] ${req.method} ${req.path} - IP: ${req.ip || req.socket.remoteAddress || 'unknown'} - Origin: ${req.headers.origin || 'any'}`);

    // Responder imediatamente para requisições OPTIONS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware global para bloquear URLs Base64
app.use('/api', blockBase64Middleware);

// Rotas da API PRIMEIRO (antes dos arquivos estáticos)
app.use('/api/auth', authRoutes);
app.use('/api/accounts', authRoutes); // Alias for /api/accounts/google/connected etc.
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/perfil', profileRoutes);
app.use('/api/wallet', walletRoutes); // handles /api/wallet/earnings, /api/wallet/purchases
app.use('/api/checkout', checkoutRoutes);
app.use('/api/payment', checkoutRoutes); // groups pix/credit-card
app.use('/api/purchase', purchaseRoutes); // dedicated purchase routes
app.use('/api/admin', adminRoutes);
app.use('/api/chats', chatRoutes); // Rotas de chat
app.use('/api/users', profilePhotoRoutes); // Rotas de fotos de perfil
app.use('/api/conversations', conversationRoutes); // Rotas de conversas
app.use('/api/search', searchRoutes); // Rotas de busca de usuários
app.use('/api/messages', messageRoutes); // Rotas de mensagens
app.use('/api/status', statusRoutes); // Rotas de status online/offline
app.use('/api/followers', followersRoutes); // Rotas de seguidores
app.use('/api/friends', friendshipRoutes); // Rotas de amizades
app.use('/api/blocks', blockRoutes); // Rotas de bloqueios
app.use('/api/location', locationRoutes); // Rotas de localização
app.use('/api/shop', shopRoutes); // Rotas da loja
app.use('/api', frameRoutes); // Rotas de frames (quadros de avatar)
app.use('/api', contributionRoutes); // Rotas de ranking de contribuição
app.use('/api/upload', uploadRoutes); // Rotas de upload de arquivos
app.use('/api', manualRoutes); // Rotas do manual de transmissão
app.use('/api/payments', paymentRoutes); // Rotas do Mercado Pago
// Disponibilizar io para as rotas
app.set('io', io);

app.use('/api', metadataRoutes); // handles /api/ranking, /api/gifts, /api/regions, /api/history
app.use('/api', settingsRoutes); // handles /api/settings, /api/notifications/settings, /api/permissions
app.use('/api', liveRoutes); // handles /api/live, /api/streams, /api/rtc, /api/lives
app.use('/api/pk', pkRoutes);
app.use('/api/interactions', interactionRoutes); // handles /api/interactions/presents, /api/interactions/streams

// Fallback para API - retornar 404 para endpoints não encontrados
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
});

// Servir avatares enviados
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir arquivos estáticos do frontend DEPOIS das rotas da API
app.use(express.static('../dist'));

// Fallback para frontend - servir index.html para SPA com redirecionamento HTTPS
app.get('*', (req, res) => {
    // Se for acesso via HTTP, redirecionar para HTTPS
    if (req.protocol === 'http') {
        const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
        console.log(`🔒 Redirecionando HTTP para HTTPS: ${httpsUrl}`);
        return res.redirect(301, httpsUrl);
    }

    // Servir o arquivo index.html para SPA
    res.sendFile('index.html', { root: '../dist' });
});

// --- WebSocket Logic ---
// Map baseado em userId para evitar duplicatas e controlar múltiplas conexões
const onlineUsers = new Map<string, {
    userId: string;
    streamId: string;
    socketIds: Set<string>;
    lastSeen: Date;
    firstConnectionTime: Date;
}>();
// Map para rastrear qual socket pertence a qual usuário
const socketToUser = new Map<string, string>();

io.on('connection', (socket) => {
    console.log(`🔌 New WebSocket connection: ${socket.id}`);

    socket.on('join_stream', async (data: { userId: string; streamId: string }) => {
        try {
            const { userId, streamId } = data;

            // VALIDAÇÃO CRÍTICA: Evitar processamento duplicado
            if (!userId || !streamId) {
                console.warn('⚠️ join_stream: dados inválidos', { userId, streamId });
                return;
            }

            // Verificar se este socket já está associado a este usuário nesta stream
            const currentUserId = socketToUser.get(socket.id);
            if (currentUserId === userId) {
                const userEntry = onlineUsers.get(userId);
                if (userEntry && userEntry.streamId === streamId && userEntry.socketIds.has(socket.id)) {
                    console.warn(`🛑 Socket ${socket.id} já está na stream ${streamId} como usuário ${userId} - IGNORANDO`);
                    return;
                }
            }

            console.log(`👤 Usuário ${userId} entrando na stream ${streamId} via WebSocket (socket: ${socket.id})`);

            // Mapear socket para usuário
            socketToUser.set(socket.id, userId);

            // Verificar se usuário já está online
            let userEntry = onlineUsers.get(userId);
            const isFirstConnection = !userEntry;
            const isChangingStream = userEntry && userEntry.streamId !== streamId;

            if (!userEntry) {
                // Novo usuário online
                userEntry = {
                    userId,
                    streamId,
                    socketIds: new Set([socket.id]),
                    lastSeen: new Date(),
                    firstConnectionTime: new Date()
                };
                onlineUsers.set(userId, userEntry);
            } else {
                // Usuário já online, adicionar socket e atualizar stream se necessário
                if (!userEntry.socketIds.has(socket.id)) {
                    userEntry.socketIds.add(socket.id);
                }
                if (isChangingStream) {
                    console.log(`🔄 Usuário ${userId} mudando da stream ${userEntry.streamId} para ${streamId}`);
                    userEntry.streamId = streamId;
                }
                userEntry.lastSeen = new Date();
            }

            // Entrar na sala do Socket.IO
            socket.join(streamId);

            // Atualizar status no banco (apenas na primeira conexão ou mudança de stream)
            if (isFirstConnection || isChangingStream) {
                const models = await import('./models');
                await models.User.findOneAndUpdate({ id: userId }, {
                    isOnline: true,
                    currentStreamId: streamId,
                    lastSeen: new Date().toISOString()
                });
            }

            // DESABILITADO: Eventos user_joined/user_left causando spam
            // Apenas online_users_updated é suficiente para atualizar UI
            // if (isFirstConnection || isChangingStream) {
            //     socket.to(streamId).emit('user_joined', { userId, streamId });
            // }

            // Enviar lista atualizada de usuários online para todos na stream
            const onlineUsersInStream = Array.from(onlineUsers.values())
                .filter(user => user.streamId === streamId)
                .map(user => ({ userId: user.userId, lastSeen: user.lastSeen }));

            io.to(streamId).emit('online_users_updated', {
                streamId,
                users: onlineUsersInStream,
                count: onlineUsersInStream.length
            });

            console.log(`✅ Usuário ${userId} conectado à stream ${streamId} (sockets: ${userEntry.socketIds.size})`);
        } catch (error) {
            console.error('❌ Erro ao entrar na stream via WebSocket:', error);
        }
    });

    socket.on('leave_stream', async (data: { userId: string; streamId: string }) => {
        try {
            const { userId, streamId } = data;

            // VALIDAÇÃO CRÍTICA: Evitar processamento duplicado
            if (!userId || !streamId) {
                console.warn('⚠️ leave_stream: dados inválidos', { userId, streamId });
                return;
            }

            // Verificar se este socket está realmente associado a este usuário
            const currentUserId = socketToUser.get(socket.id);
            if (currentUserId !== userId) {
                console.warn(`� Socket ${socket.id} não está associado ao usuário ${userId} - IGNORANDO`);
                return;
            }

            console.log(`�👤 Usuário ${userId} saindo da stream ${streamId} via WebSocket (socket: ${socket.id})`);

            const userEntry = onlineUsers.get(userId);
            if (!userEntry) {
                console.warn(`⚠️ Usuário ${userId} não encontrado na lista de online users`);
                socketToUser.delete(socket.id);
                socket.leave(streamId);
                return;
            }

            // Verificar se o usuário está realmente nesta stream
            if (userEntry.streamId !== streamId) {
                console.warn(`⚠️ Usuário ${userId} está na stream ${userEntry.streamId}, não na ${streamId} - IGNORANDO`);
                return;
            }

            // Remover este socket da lista
            userEntry.socketIds.delete(socket.id);

            // Se ainda tiver sockets, não remover usuário da lista nem emitir evento
            if (userEntry.socketIds.size > 0) {
                console.log(`🔄 Usuário ${userId} ainda tem ${userEntry.socketIds.size} conexões ativas - mantendo online`);
                socketToUser.delete(socket.id);
                socket.leave(streamId);
                return;
            }

            // Remover usuário completamente se não tiver mais sockets
            onlineUsers.delete(userId);

            // Remover mapeamento de socket
            socketToUser.delete(socket.id);

            // Sair da sala do Socket.IO
            socket.leave(streamId);

            // Atualizar status no banco
            const models = await import('./models');
            await models.User.findOneAndUpdate({ id: userId }, {
                isOnline: false,
                currentStreamId: null,
                lastSeen: new Date().toISOString()
            });

            // DESABILITADO: Evento user_left causando spam
            // Apenas online_users_updated é suficiente para atualizar UI
            // socket.to(streamId).emit('user_left', { userId, streamId });

            // Enviar lista atualizada de usuários online
            const onlineUsersInStream = Array.from(onlineUsers.values())
                .filter(user => user.streamId === streamId)
                .map(user => ({ userId: user.userId, lastSeen: user.lastSeen }));

            io.to(streamId).emit('online_users_updated', {
                streamId,
                users: onlineUsersInStream,
                count: onlineUsersInStream.length
            });

            console.log(`✅ Usuário ${userId} desconectado da stream ${streamId}`);
        } catch (error) {
            console.error('❌ Erro ao sair da stream via WebSocket:', error);
        }
    });

    // Heartbeat para manter conexão ativa
    socket.on('heartbeat', () => {
        const userId = socketToUser.get(socket.id);
        if (userId) {
            const userEntry = onlineUsers.get(userId);
            if (userEntry) {
                userEntry.lastSeen = new Date();
            }
        }
    });

    socket.on('disconnect', async () => {
        try {
            const userId = socketToUser.get(socket.id);

            if (userId) {
                // Marcar usuário como offline no banco
                const { User } = await import('./models/index');
                await User.findOneAndUpdate(
                    { id: userId },
                    {
                        isOnline: false,
                        lastSeen: new Date().toISOString()
                    }
                );

                // Notificar todos sobre mudança de status
                io.emit('user_status_changed', {
                    userId,
                    isOnline: false,
                    lastSeen: new Date().toISOString()
                });

                console.log(`🔴 Usuário ${userId} offline (socket: ${socket.id})`);
            }

            // VALIDAÇÃO CRÍTICA: Se não há usuário associado, apenas limpar
            if (!userId) {
                console.log(`🔌 Socket ${socket.id} desconectado sem usuário associado`);
                return;
            }

            const userEntry = onlineUsers.get(userId);

            // VALIDAÇÃO: Se não há entrada para este usuário, apenas limpar
            if (!userEntry) {
                console.log(`🔌 Socket ${socket.id} desconectado (usuário ${userId} não encontrado em onlineUsers)`);
                socketToUser.delete(socket.id);
                return;
            }

            // VALIDAÇÃO: Se este socket não está na lista do usuário, apenas limpar
            if (!userEntry.socketIds.has(socket.id)) {
                console.log(`🔌 Socket ${socket.id} não encontrado na lista do usuário ${userId}`);
                socketToUser.delete(socket.id);
                return;
            }

            // Remover este socket da lista
            userEntry.socketIds.delete(socket.id);

            console.log(`🔌 Socket ${socket.id} desconectado (usuário ${userId}, sockets restantes: ${userEntry.socketIds.size})`);

            // Se ainda tiver sockets ativos, não marcar como offline nem emitir eventos
            if (userEntry.socketIds.size > 0) {
                console.log(`🔄 Usuário ${userId} ainda tem ${userEntry.socketIds.size} conexões ativas - mantendo online sem eventos`);
                socketToUser.delete(socket.id);
                return;
            }

            // Se não tiver mais sockets, remover usuário completamente
            console.log(`👋 Usuário ${userId} não tem mais conexões - marcando como offline`);
            onlineUsers.delete(userId);

            // Marcar como offline no banco se não estiver em live
            const models = await import('./models');
            const activeStreams = await models.Streamer.find({
                hostId: userId,
                isLive: true
            });

            if (!activeStreams || activeStreams.length === 0) {
                await models.User.findOneAndUpdate({ id: userId }, {
                    isOnline: false,
                    currentStreamId: null,
                    lastSeen: new Date().toISOString()
                });

                // Notificar outros usuários na stream sobre saída
                if (userEntry.streamId) {
                    io.to(userEntry.streamId).emit('user_left', {
                        userId: userId,
                        streamId: userEntry.streamId
                    });

                    // Enviar lista atualizada de usuários online
                    const onlineUsersInStream = Array.from(onlineUsers.values())
                        .filter(user => user.streamId === userEntry.streamId)
                        .map(user => ({ userId: user.userId, lastSeen: user.lastSeen }));

                    io.to(userEntry.streamId).emit('online_users_updated', {
                        streamId: userEntry.streamId,
                        users: onlineUsersInStream,
                        count: onlineUsersInStream.length
                    });
                }
            }

            // Limpar mapeamento de socket
            socketToUser.delete(socket.id);

        } catch (error) {
            console.error('❌ Erro ao processar disconnect:', error);
        }
    });

    // Eventos para status online/offline
    socket.on('user_status_update', async (data: { userId: string; isOnline: boolean }) => {
        try {
            await User.findOneAndUpdate({ id: data.userId }, {
                isOnline: data.isOnline,
                lastSeen: data.isOnline ? undefined : new Date().toISOString()
            });

            // Broadcast para todos os usuários
            io.emit('user_status_changed', {
                userId: data.userId,
                isOnline: data.isOnline,
                lastSeen: data.isOnline ? undefined : new Date().toISOString()
            });

            console.log(`🔔 Status atualizado: ${data.userId} -> ${data.isOnline ? 'online' : 'offline'}`);
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
        }
    });

    // Eventos para mensagens de chat (atualizado para novas coleções)
    socket.on('send_chat_message', async (data: { chatId: string; senderId: string; receiverId: string; content: string; messageType?: string }) => {
        try {
            const { chatId, senderId, receiverId, content, messageType = 'text' } = data;

            // Verificar se o usuário tem acesso ao chat
            const { Chat, ChatMessage, User } = await import('./models/index');
            const chat = await Chat.findOne({
                id: chatId,
                participants: senderId,
                isActive: true
            });

            if (!chat) {
                socket.emit('error', { message: 'Chat não encontrado ou sem permissão' });
                return;
            }

            // Criar mensagem na nova coleção
            const message = await ChatMessage.create({
                id: `msg_${chatId}_${senderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                conversationId: chatId,
                senderId,
                receiverId: receiverId || senderId,
                content,
                messageType,
                isRead: false,
                sentAt: new Date()
            });

            // Atualizar última mensagem do chat
            await Chat.findOneAndUpdate(
                { id: chatId },
                {
                    lastMessage: {
                        content: message.content,
                        senderId: message.senderId,
                        timestamp: message.sentAt,
                        messageType: message.messageType
                    },
                    updatedAt: new Date()
                }
            );

            // Buscar detalhes do remetente
            const sender = await User.findOne({ id: senderId }).select('id name avatarUrl');

            // Formatar mensagem para envio
            const formattedMessage = {
                id: message.id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                receiverId: message.receiverId,
                content: message.content,
                messageType: message.messageType,
                isRead: message.isRead,
                sentAt: message.sentAt,
                sender: sender || { id: senderId, name: 'Usuário', avatarUrl: '' }
            };

            // Enviar para todos os participantes do chat
            chat.participants.forEach((participantId: string) => {
                io.to(`user_${participantId}`).emit('new_chat_message', formattedMessage);

                // Enviar notificação se não for o remetente
                if (participantId !== senderId) {
                    io.to(`user_${participantId}`).emit('chat_notification', {
                        type: 'new_message',
                        chatId,
                        message: formattedMessage,
                        sender: sender,
                        timestamp: new Date()
                    });
                }
            });

            console.log(`💬 Mensagem enviada via WebSocket: ${senderId} -> chat ${chatId}`);
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem via WebSocket:', error);
            socket.emit('error', { message: 'Erro ao enviar mensagem' });
        }
    });

    // Evento para marcar mensagem como lida
    socket.on('mark_message_read', async (data: { messageId: string; userId: string }) => {
        try {
            const { messageId, userId } = data;

            const { ChatMessage, Chat } = await import('./models/index');
            const message = await ChatMessage.findOne({
                id: messageId,
                receiverId: userId
            });

            if (!message) {
                socket.emit('error', { message: 'Mensagem não encontrada' });
                return;
            }

            // Marcar como lida
            await ChatMessage.findOneAndUpdate(
                { id: messageId },
                {
                    isRead: true,
                    readAt: new Date()
                }
            );

            // Notificar outros participantes
            const chat = await Chat.findOne({ id: message.conversationId });
            if (chat) {
                chat.participants.forEach((participantId: string) => {
                    if (participantId !== userId) {
                        io.to(`user_${participantId}`).emit('message_read', {
                            messageId,
                            userId,
                            timestamp: new Date()
                        });
                    }
                });
            }

            console.log(`✅ Mensagem ${messageId} marcada como lida por ${userId}`);
        } catch (error) {
            console.error('❌ Erro ao marcar mensagem como lida:', error);
            socket.emit('error', { message: 'Erro ao marcar mensagem como lida' });
        }
    });

    // Evento para usuário entrar em um chat
    socket.on('join_chat', async (data: { userId: string; chatId: string }) => {
        try {
            const { userId, chatId } = data;

            // Verificar se usuário tem acesso ao chat
            const models = await import('./models');
            const chat = await models.Chat.findOne({
                id: chatId,
                participants: userId,
                isActive: true
            });

            if (!chat) {
                socket.emit('error', { message: 'Chat não encontrado ou sem permissão' });
                return;
            }

            // Entrar na sala do usuário
            socket.join(`user_${userId}`);
            socket.join(`chat_${chatId}`);

            // Atualizar status online no chat
            socket.to(`chat_${chatId}`).emit('user_joined_chat', {
                userId,
                chatId,
                timestamp: new Date()
            });

            console.log(`👤 Usuário ${userId} entrou no chat ${chatId}`);
        } catch (error) {
            console.error('❌ Erro ao entrar no chat:', error);
            socket.emit('error', { message: 'Erro ao entrar no chat' });
        }
    });

    // Evento para usuário sair de um chat
    socket.on('leave_chat', async (data: { userId: string; chatId: string }) => {
        try {
            const { userId, chatId } = data;

            socket.leave(`chat_${chatId}`);

            // Notificar outros participantes
            socket.to(`chat_${chatId}`).emit('user_left_chat', {
                userId,
                chatId,
                timestamp: new Date()
            });

            console.log(`� Usuário ${userId} saiu do chat ${chatId}`);
        } catch (error) {
            console.error('❌ Erro ao sair do chat:', error);
        }
    });

    // Evento para usuário está digitando
    socket.on('typing', async (data: { userId: string; chatId: string; isTyping: boolean }) => {
        try {
            const { userId, chatId, isTyping } = data;

            // Verificar se usuário tem acesso ao chat
            const models = await import('./models');
            const chat = await models.Chat.findOne({
                id: chatId,
                participants: userId,
                isActive: true
            });

            if (!chat) return;

            // Notificar outros participantes
            chat.participants.forEach((participantId: string) => {
                if (participantId !== userId) {
                    io.to(`user_${participantId}`).emit('user_typing', {
                        userId,
                        chatId,
                        isTyping,
                        timestamp: new Date()
                    });
                }
            });

        } catch (error) {
            console.error('❌ Erro ao notificar digitação:', error);
        }
    });

    // Eventos para follow/unfollow
    socket.on('user_followed', async (data: { followerId: string; followingId: string }) => {
        try {
            // Broadcast para todos os usuários sobre o novo follow
            io.emit('user_followed_notification', {
                followerId: data.followerId,
                followingId: data.followingId,
                timestamp: new Date().toISOString()
            });

            console.log(`🔔 Novo follow: ${data.followerId} -> ${data.followingId}`);
        } catch (error) {
            console.error('❌ Erro ao notificar follow:', error);
        }
    });

    socket.on('user_unfollowed', async (data: { followerId: string; followingId: string }) => {
        try {
            // Broadcast para todos os usuários sobre o unfollow
            io.emit('user_unfollowed_notification', {
                followerId: data.followerId,
                followingId: data.followingId,
                timestamp: new Date().toISOString()
            });

            console.log(`🔔 Unfollow: ${data.followerId} -> ${data.followingId}`);
        } catch (error) {
            console.error('❌ Erro ao notificar unfollow:', error);
        }
    });

    // Eventos para amizades
    socket.on('friendship_created', async (data: { userId1: string; userId2: string; initiatedBy: string }) => {
        try {
            // Broadcast para ambos os usuários sobre a nova amizade
            io.emit('friendship_notification', {
                userId1: data.userId1,
                userId2: data.userId2,
                initiatedBy: data.initiatedBy,
                timestamp: new Date().toISOString()
            });

            console.log(`🤝 Nova amizade: ${data.userId1} <-> ${data.userId2} (iniciado por ${data.initiatedBy})`);
        } catch (error) {
            console.error('❌ Erro ao notificar amizade:', error);
        }
    });

    // Legados - manter para compatibilidade
    socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room ${roomId}`);
    });

    socket.on('send_message', (data: { roomId: string, message: any }) => {
        socket.to(data.roomId).emit('receive_message', data.message);
    });

    socket.on('send_gift', (data: { roomId: string, gift: any }) => {
        io.to(data.roomId).emit('gift_received', data.gift);
    });

    // Eventos para atualizações em tempo real
    socket.on('update_user_stats', async (data: { userId: string; stats: any }) => {
        try {
            const { User } = await import('./models/index');
            await User.findOneAndUpdate({ id: data.userId }, data.stats);

            // Notificar todos os clientes sobre a atualização
            io.emit('user_stats_updated', {
                userId: data.userId,
                stats: data.stats,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas do usuário:', error);
        }
    });

    socket.on('follow_user', async (data: { followerId: string; followedId: string; streamId?: string }) => {
        try {
            const { User, Followers, Friendship } = await import('./models/index');

            // Atualizar contadores
            const follower = await User.findOne({ id: data.followerId });
            const followed = await User.findOne({ id: data.followedId });

            if (follower && followed) {
                // Verificar se já são amigos (seguimento mútuo)
                const isAlreadyFollowing = await Followers.findOne({
                    followerId: data.followerId,
                    followedId: data.followedId
                });

                const isFollowedBack = await Followers.findOne({
                    followerId: data.followedId,
                    followedId: data.followerId
                });

                if (!isAlreadyFollowing) {
                    // Criar relação de follow
                    await Followers.create({
                        id: `follow_${data.followerId}_${data.followedId}_${Date.now()}`,
                        followerId: data.followerId,
                        followedId: data.followedId,
                        createdAt: new Date()
                    });

                    // Atualizar contadores
                    follower.following += 1;
                    followed.fans += 1;
                    await follower.save();
                    await followed.save();
                }

                // Se for follow mútuo, criar amizade
                if (isFollowedBack && !isAlreadyFollowing) {
                    await Friendship.create({
                        id: `friend_${data.followerId}_${data.followedId}_${Date.now()}`,
                        userId1: data.followerId,
                        userId2: data.followedId,
                        createdAt: new Date()
                    });

                    // Atualizar listas de amigos
                    follower.friendsList = [...(follower.friendsList || []), data.followedId];
                    followed.friendsList = [...(followed.friendsList || []), data.followerId];
                    await follower.save();
                    await followed.save();

                    // Notificar sobre nova amizade
                    io.emit('friendship_created', {
                        userId1: data.followerId,
                        userId2: data.followedId,
                        user1: follower,
                        user2: followed,
                        timestamp: new Date()
                    });
                }

                // Notificar sobre novo follow
                io.emit('user_followed', {
                    followerId: data.followerId,
                    followedId: data.followedId,
                    follower: follower,
                    followed: followed,
                    timestamp: new Date()
                });

                // Atualizar estatísticas em tempo real
                io.emit('user_stats_updated', {
                    userId: data.followerId,
                    stats: { following: follower.following, friendsList: follower.friendsList }
                });

                io.emit('user_stats_updated', {
                    userId: data.followedId,
                    stats: { fans: followed.fans, friendsList: followed.friendsList }
                });
            }
        } catch (error) {
            console.error('❌ Erro ao processar follow:', error);
        }
    });

    socket.on('update_diamonds', async (data: { userId: string; diamonds: number; change: number }) => {
        try {
            const { User } = await import('./models/index');
            const user = await User.findOneAndUpdate(
                { id: data.userId },
                { diamonds: data.diamonds },
                { new: true }
            );

            if (user) {
                // Notificar sobre atualização de diamantes
                io.emit('diamonds_updated', {
                    userId: data.userId,
                    diamonds: data.diamonds,
                    change: data.change,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar diamantes:', error);
        }
    });

    // --- Chat e Status Events ---
    socket.on('set_user_online', async (data: { userId: string }) => {
        try {
            const { userId } = data;
            if (!userId) return;

            // Associar socket ao usuário
            socket.data.userId = userId;
            socketToUser.set(socket.id, userId);
            socket.join(`user_${userId}`);

            // Atualizar status no banco
            const { User } = await import('./models/index');
            await User.findOneAndUpdate(
                { id: userId },
                {
                    isOnline: true,
                    lastSeen: new Date().toISOString()
                }
            );

            // Notificar todos sobre mudança de status
            io.emit('user_status_changed', {
                userId,
                isOnline: true,
                lastSeen: new Date().toISOString()
            });

            console.log(`🟢 Usuário ${userId} online (socket: ${socket.id})`);
        } catch (error) {
            console.error('❌ Erro ao setar usuário online:', error);
        }
    });

    socket.on('join_conversation', (data: { conversationId: string }) => {
        try {
            const { conversationId } = data;
            if (!conversationId) return;

            socket.join(`conversation_${conversationId}`);
            console.log(`💬 Socket ${socket.id} entrou na conversa ${conversationId}`);
        } catch (error) {
            console.error('❌ Erro ao entrar na conversa:', error);
        }
    });

    socket.on('leave_conversation', (data: { conversationId: string }) => {
        try {
            const { conversationId } = data;
            if (!conversationId) return;

            socket.leave(`conversation_${conversationId}`);
            console.log(`💬 Socket ${socket.id} saiu da conversa ${conversationId}`);
        } catch (error) {
            console.error('❌ Erro ao sair da conversa:', error);
        }
    });

    // Removidos eventos duplicados de join/leave stream para evitar conflitos
    // A lógica principal está no início do arquivo com controle adequado de múltiplas conexões

    socket.on('send_notification', async (data: { userId: string; type: string; message: string; data?: any }) => {
        try {
            // Enviar notificação para usuário específico
            io.to(`user_${data.userId}`).emit('notification', {
                id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: data.userId,
                type: data.type,
                message: data.message,
                data: data.data,
                timestamp: new Date(),
                read: false
            });

            // Notificar sobre notificação não lida
            io.to(`user_${data.userId}`).emit('unread_notification', {
                userId: data.userId,
                count: 1, // Aqui poderia buscar do banco o total
                timestamp: new Date()
            });

        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error);
        }
    });

    socket.on('mark_notification_read', async (data: { notificationId: string; userId: string }) => {
        try {
            // Notificar sobre notificação lida
            io.to(`user_${data.userId}`).emit('notification_read', {
                notificationId: data.notificationId,
                userId: data.userId,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('❌ Erro ao marcar notificação como lida:', error);
        }
    });
});

export const getIO = () => io;

// 🚀 LIMPEZA AUTOMÁTICA DE LIVES INATIVAS (a cada 5 minutos)
const cleanupInactiveStreams = async () => {
    try {
        console.log('🧹 [LIMPEZA] Verificando streams inativas...');
        
        // Limpar streams com 0 viewers há mais de 5 minutos
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const result = await Streamer.updateMany(
            {
                isLive: true,
                streamStatus: 'active',
                viewers: 0,
                updatedAt: { $lt: fiveMinutesAgo }
            },
            {
                $set: {
                    isLive: false,
                    streamStatus: 'ended',
                    endedAt: new Date()
                }
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`🧹 [LIMPEZA] ${result.modifiedCount} streams inativas marcadas como encerradas`);
        }
        
    } catch (error) {
        console.error('❌ [LIMPEZA] Erro ao limpar streams inativas:', error);
    }
};

// Iniciar limpeza automática
setInterval(cleanupInactiveStreams, 5 * 60 * 1000); // 5 minutos

server.listen(port, '0.0.0.0', () => {
    console.log(`🌍 ACESSO GLOBAL LIBERADO - API Server started on http://0.0.0.0:${port}`);
    console.log(`📱 Celular/computador: http://192.168.3.12:${port}`);
    console.log(`🔗 API endpoints: http://192.168.3.12:${port}/api/*`);
    console.log(`🌐 ACESSO LIBERADO PARA QUALQUER IP DE QUALQUER LUGAR`);
    console.log(`🔌 WebSocket server rodando na mesma porta ${port}`);
});
