import express from 'express';
import { Message, User, Photo, Streamer, Followers, Friendship, Invitation, Visitor } from '../models';
import { getUserIdFromToken } from '../middleware/auth';

const router = express.Router();

router.get('/presents/live/:id', async (req, res) => res.json([]));
router.post('/streams/:id/private-invite', async (req, res) => res.json({ success: true }));
router.get('/streams/:id/access-check', async (req, res) => {
    try {
        const { id: streamId } = req.params;
        const { userId } = req.query;
        
        if (!userId) {
            return res.json({ canJoin: false, reason: 'User ID required' });
        }
        
        // Buscar stream e host
        const stream = await Streamer.findOne({ id: streamId });
        if (!stream) {
            return res.json({ canJoin: false, reason: 'Stream not found' });
        }
        
        // Se não for privada, pode entrar
        if (!stream.isPrivate) {
            return res.json({ canJoin: true });
        }
        
        // Buscar configurações de privacidade do host
        const host = await User.findOne({ id: stream.hostId });
        if (!host || !host.privateStreamSettings) {
            return res.json({ canJoin: false, reason: 'Host settings not found' });
        }
        
        const settings = host.privateStreamSettings;
        const requestingUser = userId;
        
        console.log(`🔐 Checking access for user ${requestingUser} to stream ${streamId}`);
        console.log(`🔒 Stream settings:`, settings);
        
        let canJoin = false;
        let reason = '';
        
        // Verificar se é o próprio host
        if (requestingUser === stream.hostId) {
            canJoin = true;
        }
        // Verificar configuração de followers only
        else if (settings.followersOnly) {
            const isFollowing = await Followers.findOne({
                followerId: requestingUser,
                followingId: stream.hostId,
                isActive: true
            });
            canJoin = !!isFollowing;
            reason = canJoin ? '' : 'Only followers can join this stream';
        }
        // Verificar configuração de fans only
        else if (settings.fansOnly) {
            const isFan = await Followers.findOne({
                followerId: requestingUser,
                followingId: stream.hostId,
                isActive: true
            });
            canJoin = !!isFan;
            reason = canJoin ? '' : 'Only fans can join this stream';
        }
        // Verificar configuração de friends only
        else if (settings.friendsOnly) {
            const friendship = await Friendship.findOne({
                $or: [
                    { userId1: requestingUser, userId2: stream.hostId },
                    { userId1: stream.hostId, userId2: requestingUser }
                ],
                isActive: true
            });
            canJoin = !!friendship;
            reason = canJoin ? '' : 'Only friends can join this stream';
        }
        // Se não houver restrições específicas, pode entrar
        else {
            canJoin = true;
        }
        
        console.log(`🔓 Access result for user ${requestingUser}: ${canJoin}, reason: ${reason}`);
        
        res.json({ canJoin, reason });
    } catch (error: any) {
        console.error('Error checking stream access:', error);
        res.status(500).json({ canJoin: false, reason: 'Server error' });
    }
});
// POST /api/interactions/friends/invite - Enviar convite de amizade
router.post('/friends/invite', async (req, res) => {
    try {
        const { fromUserId, toUserId, message } = req.body;
        
        if (!fromUserId || !toUserId) {
            return res.status(400).json({ error: 'fromUserId e toUserId são obrigatórios' });
        }
        
        if (fromUserId === toUserId) {
            return res.status(400).json({ error: 'Não pode enviar convite para si mesmo' });
        }
        
        // Verificar se usuários existem
        const [fromUser, toUser] = await Promise.all([
            User.findOne({ id: fromUserId }),
            User.findOne({ id: toUserId })
        ]);
        
        if (!fromUser || !toUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Verificar se já são amigos
        const existingFriendship = await require('../models').Friendship.findOne({
            $or: [
                { userId1: fromUserId, userId2: toUserId },
                { userId1: toUserId, userId2: fromUserId }
            ],
            isActive: true
        });
        
        if (existingFriendship) {
            return res.status(400).json({ error: 'Já são amigos' });
        }
        
        // Verificar se já existe convite pendente
        const existingInvite = await require('../models').Friendship.findOne({
            $or: [
                { userId1: fromUserId, userId2: toUserId },
                { userId1: toUserId, userId2: fromUserId }
            ],
            isActive: false // Convites pendentes
        });
        
        if (existingInvite) {
            return res.status(400).json({ error: 'Já existe um convite pendente' });
        }
        
        // Criar convite de amizade (inativo até ser aceito)
        const invite = await require('../models').Friendship.create({
            id: `friend_invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId1: fromUserId,
            userId2: toUserId,
            initiatedBy: fromUserId,
            friendshipStartedAt: new Date(),
            isActive: false, // Pendente
            message: message || ''
        });
        
        // Notificar via WebSocket
        const io = require('../server').getIO();
        if (io) {
            io.to(`user_${toUserId}`).emit('friend_invite_received', {
                inviteId: invite.id,
                fromUser: {
                    id: fromUser.id,
                    name: fromUser.name,
                    avatarUrl: fromUser.avatarUrl
                },
                message,
                timestamp: new Date()
            });
        }
        
        console.log(`📨 Convite de amizade enviado: ${fromUserId} → ${toUserId}`);
        
        res.json({
            success: true,
            invite,
            fromUser: {
                id: fromUser.id,
                name: fromUser.name,
                avatarUrl: fromUser.avatarUrl
            },
            toUser: {
                id: toUser.id,
                name: toUser.name,
                avatarUrl: toUser.avatarUrl
            }
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao enviar convite de amizade:', error);
        res.status(500).json({ error: 'Erro interno ao enviar convite' });
    }
});

// POST /api/interactions/streams/:id/interactions - Registrar interação na stream
router.post('/streams/:id/interactions', async (req, res) => {
    try {
        const streamId = req.params.id;
        const { userId, type, data } = req.body;
        
        if (!userId || !type) {
            return res.status(400).json({ error: 'userId e type são obrigatórios' });
        }
        
        // Verificar se stream existe
        const stream = await Streamer.findOne({ id: streamId });
        if (!stream) {
            return res.status(404).json({ error: 'Stream não encontrada' });
        }
        
        // Verificar se usuário existe
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Registrar interação (poderia ser em uma coleção separada)
        const interaction = {
            id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            streamId,
            userId,
            type, // 'like', 'share', 'comment', 'join', etc.
            data: data || {},
            timestamp: new Date()
        };
        
        // Notificar via WebSocket
        const io = require('../server').getIO();
        if (io) {
            io.to(`stream_${streamId}`).emit('stream_interaction', {
                ...interaction,
                user: {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl
                }
            });
        }
        
        console.log(`🎯 Interação registrada: ${type} por ${userId} na stream ${streamId}`);
        
        res.json({
            success: true,
            interaction
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao registrar interação:', error);
        res.status(500).json({ error: 'Erro interno ao registrar interação' });
    }
});

// POST /api/interactions/invitations/send - Enviar convite geral
router.post('/invitations/send', async (req, res) => {
    try {
        const { toUserId, type, message, data } = req.body;
        const fromUserId = getUserIdFromToken(req) || req.body.fromUserId;
        
        if (!fromUserId || !toUserId || !type) {
            return res.status(400).json({ error: 'fromUserId, toUserId e type são obrigatórios' });
        }
        
        // Verificar se usuários existem
        const [fromUser, toUser] = await Promise.all([
            User.findOne({ id: fromUserId }),
            User.findOne({ id: toUserId })
        ]);
        
        if (!fromUser || !toUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Criar convite
        const invitation = {
            id: `invitation_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            fromUserId,
            toUserId,
            type, // 'stream', 'friend', 'private_chat', etc.
            message: message || '',
            data: data || {},
            status: 'pending',
            createdAt: new Date()
        };
        
        // Notificar via WebSocket
        const io = require('../server').getIO();
        if (io) {
            io.to(`user_${toUserId}`).emit('invitation_received', {
                ...invitation,
                fromUser: {
                    id: fromUser.id,
                    name: fromUser.name,
                    avatarUrl: fromUser.avatarUrl
                }
            });
        }
        
        console.log(`📩 Convite enviado: ${type} de ${fromUserId} para ${toUserId}`);
        
        res.json({
            success: true,
            invitation
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao enviar convite:', error);
        res.status(500).json({ error: 'Erro interno ao enviar convite' });
    }
});

// GET /api/interactions/invitations/received - Listar convites recebidos
router.get('/invitations/received', async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId é obrigatório' });
        }
        
        console.log(`🔍 Buscando convites recebidos por: ${userId}`);
        
        // Buscar do banco de dados
        const invitations = await Invitation.find({ 
            toUserId: userId,
            status: 'pending'
        }).sort({ createdAt: -1 });

        // Enriquecer com dados do remetente
        const fromUserIds = [...new Set(invitations.map(i => i.fromUserId))];
        const fromUsers = await User.find({ id: { $in: fromUserIds } });
        const userMap = fromUsers.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {} as Record<string, any>);

        const enrichedInvitations = invitations.map(invitation => ({
            ...invitation.toJSON(),
            fromUser: userMap[invitation.fromUserId] ? {
                id: userMap[invitation.fromUserId].id,
                name: userMap[invitation.fromUserId].name,
                avatarUrl: userMap[invitation.fromUserId].avatarUrl
            } : null
        }));
        
        res.json(enrichedInvitations);
        
    } catch (error: any) {
        console.error('❌ Erro ao buscar convites:', error);
        res.status(500).json({ error: 'Erro interno ao buscar convites' });
    }
});
router.get('/rooms/:id', async (req, res) => {
    // In a real scenario, this gets Room/Streamer by ID
    const room = await import('../models').then(m => m.Streamer).then(S => S.findOne({ id: req.params.id }));
    res.json(room || {});
});
router.post('/rooms/:id/join', async (req, res) => {
    // Basic permissions logic simulation
    res.json({ success: true, canJoin: true });
});
router.get('/rooms', async (req, res) => {
    const rooms = await import('../models').then(m => m.Streamer).then(S => S.find());
    res.json(rooms);
});

router.get('/streams/:id/messages', async (req, res) => {
    res.json(await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 }));
});

router.get('/feed/photos', async (req, res) => {
    try {
        // Fetch photos and populate user details manually based on userId
        const photos = await Photo.find().sort({ createdAt: -1 }).limit(50);

        const userIds = [...new Set(photos.map(p => p.userId))];
        const users = await User.find({ id: { $in: userIds } });
        const userMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {} as Record<string, any>);

        const photosWithUsers = photos.map(photo => {
            const photoJson = photo.toJSON();
            return {
                ...photoJson,
                photoUrl: photoJson.url, // Map url to photoUrl as expected by frontend
                user: userMap[photoJson.userId] || { id: photoJson.userId, name: 'UnknownUser', avatarUrl: '' }
            };
        });

        res.json(photosWithUsers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/photos/:id/like', async (req, res) => {
    try {
        const userId = req.body.userId || '10755083'; // TODO dynamically get userId
        const photoId = req.params.id;

        const photo = await Photo.findOne({ id: photoId });
        if (!photo) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        let newLikes = photo.likes || 0;
        let isLiked = false;

        // Simple toggle logic since we don't have a likes table yet
        // In a real scenario we would check `Like` collection mapping userId to photoId
        // We'll invert the provided value or assume a +1 action.
        if (req.body.action === 'unlike') {
            newLikes = Math.max(0, newLikes - 1);
            isLiked = false;
        } else {
            newLikes += 1;
            isLiked = true;
        }

        photo.likes = newLikes;
        await photo.save();

        res.json({ success: true, likes: newLikes, isLiked });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/photos/upload', async (req, res) => {
    try {
        const { userId, photoUrl, description } = req.body;

        if (!userId || !photoUrl) {
            return res.status(400).json({ error: 'Missing userId or photoUrl' });
        }

        const newPhoto = await Photo.create({
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            userId,
            url: photoUrl,
            caption: description || '',
            likes: 0,
            isLiked: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Retornar no formato esperado pelo frontend
        res.json({ 
            success: true, 
            url: newPhoto.url,
            photo: newPhoto
        });
    } catch (error: any) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/visitors/list/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Buscar visitantes do banco de dados
        const visitors = await Visitor.find({ visitedId: id }).sort({ visitedAt: -1 }).limit(20);
        
        if (visitors.length === 0) {
            return res.json([]);
        }

        const visitorIds = [...new Set(visitors.map(v => v.visitorId))];
        const users = await User.find({ id: { $in: visitorIds } });
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar visitantes' });
    }
});

router.post('/visitors/record', async (req, res) => {
    try {
        const { visitorId, visitedId } = req.body;
        
        if (!visitorId || !visitedId || visitorId === visitedId) {
            return res.status(400).json({ error: 'Invalid visitor data' });
        }

        // Atualizar ou criar registro de visita
        await Visitor.findOneAndUpdate(
            { visitorId, visitedId },
            { visitedAt: new Date() },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar visita' });
    }
});
router.delete('/visitors/clear/:id', async (req, res) => res.json({ success: true }));
router.get('/chats/:id/messages', async (req, res) => {
    try {
        const otherUserId = req.params.id;
        const currentUserId = req.query.currentUserId as string || getUserIdFromToken(req);
        
        if (!currentUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const currentUser = { id: currentUserId };

        // Garantir que ambos os usuários existam
        const models = await import('../models');

        // Criar usuário de suporte se não existir
        if (otherUserId === 'support-livercore') {
            let supportUser = await models.User.findOne({ id: 'support-livercore' });
            if (!supportUser) {
                console.log('🔧 Criando usuário de suporte para chat');
                supportUser = await models.User.create({
                    id: 'support-livercore',
                    name: 'Support',
                    avatarUrl: 'https://picsum.photos/seed/support/200/200.jpg',
                    diamonds: 0,
                    level: 1,
                    xp: 0,
                    fans: 0,
                    following: 0,
                    isOnline: true,
                    lastSeen: new Date().toISOString()
                });
            }
        }

        // Criar chatKey consistente (ordem alfabética para garantir o mesmo chatId)
        const userIds = [currentUser.id, otherUserId].sort();
        const chatKey = `chat_${userIds[0]}_${userIds[1]}`;

        console.log(`🔍 Buscando mensagens para chatKey: ${chatKey}`);

        let messages = await Message.find({ chatId: chatKey }).sort({ createdAt: 1 });

        console.log(`📝 Encontradas ${messages.length} mensagens`);

        res.json(messages);
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        res.json([]); // Retornar array vazio em caso de erro
    }
});

router.put('/streams/:id/quality', async (req, res) => res.json({ success: true, stream: {} }));
router.post('/streams/:id/toggle-mic', async (req, res) => res.json({}));
router.post('/streams/:id/toggle-sound', async (req, res) => res.json({}));
router.post('/streams/:id/toggle-auto-follow', async (req, res) => res.json({}));
router.post('/streams/:id/toggle-auto-invite', async (req, res) => res.json({}));

const avatarFrames: Record<string, { price: number, durationDays: number, name: string }> = {
    'FrameDiamondIcon': { price: 500, durationDays: 7, name: 'Diamond' },
    'FrameNeonPinkIcon': { price: 750, durationDays: 7, name: 'Neon Pink' },
    'FrameFloralWreathIcon': { price: 1000, durationDays: 14, name: 'Floral Wreath' },
    'FramePinkGemIcon': { price: 1250, durationDays: 14, name: 'Pink Gem' },
    'FrameGoldenFloralIcon': { price: 1500, durationDays: 30, name: 'Golden Floral' },
    'FramePurpleFloralIcon': { price: 2000, durationDays: 30, name: 'Purple Floral' },
    'FrameBlueCrystalIcon': { price: 1750, durationDays: 21, name: 'Blue Crystal' },
    'FrameBlueFireIcon': { price: 1600, durationDays: 21, name: 'Blue Fire' },
    'FrameSilverThornIcon': { price: 1800, durationDays: 21, name: 'Silver Thorn' },
    'FrameNeonDiamondIcon': { price: 2200, durationDays: 45, name: 'Neon Diamond' },
    'FrameRoseHeartIcon': { price: 2500, durationDays: 45, name: 'Rose Heart' },
    'FrameOrnateBronzeIcon': { price: 1900, durationDays: 21, name: 'Ornate Bronze' },
    'FramePinkLaceIcon': { price: 2000, durationDays: 30, name: 'Pink Lace' },
    'FrameMagentaWingsIcon': { price: 2400, durationDays: 45, name: 'Magenta Wings' },
    'FrameSilverBeadedIcon': { price: 2100, durationDays: 30, name: 'Silver Beaded' },
    'FrameRegalPurpleIcon': { price: 1850, durationDays: 21, name: 'Regal Purple' },
    'FrameIcyWingsIcon': { price: 2300, durationDays: 45, name: 'Icy Wings' },
    'FrameBlazingSunIcon': { price: 2600, durationDays: 60, name: 'Blazing Sun' }
};

// GET /api/effects/frames - Buscar frames disponíveis
router.get('/effects/frames', async (req, res) => {
    try {
        const framesWithDetails = Object.entries(avatarFrames).map(([id, data]) => ({
            id,
            name: data.name,
            price: data.price,
            duration: data.durationDays
        }));
        res.json(framesWithDetails);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch frames' });
    }
});

router.post('/effects/purchase-frame/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { frameId } = req.body;

        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const frameData = avatarFrames[frameId];
        if (!frameData) return res.status(400).json({ error: 'Invalid frame ID' });

        if (user.diamonds < frameData.price) {
            return res.status(400).json({ error: 'Insufficient diamonds' });
        }

        // Deduct diamonds
        user.diamonds -= frameData.price;

        // Add or update frame in inventory
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + frameData.durationDays);

        const existingFrameIndex = user.ownedFrames.findIndex(f => f.frameId === frameId);
        if (existingFrameIndex >= 0) {
            user.ownedFrames[existingFrameIndex].expirationDate = expirationDate.toISOString();
        } else {
            user.ownedFrames.push({ frameId, expirationDate: expirationDate.toISOString() });
        }

        await user.save();
        res.json({ success: true, user });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/effects/purchase/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { giftId } = req.body; // Actually gift name is passed here from api.ts

        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Fetch real gift data if possible, for now we will hardcode a standard effect price or assume the frontend validated it.
        // In a real scenario we must validate against the Gift collection.
        const gift = await import('../models').then(m => m.Gift).then(G => G.findOne({ name: giftId }));
        const price = gift ? (gift.price || 0) : 500; // fallback price

        if (user.diamonds < price) {
            return res.status(400).json({ error: 'Insufficient diamonds' });
        }

        user.diamonds -= price;
        await user.save();
        res.json({ success: true, user });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/vip/subscribe/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const VIP_PRICE = 3000;
        if (user.diamonds < VIP_PRICE) {
            return res.status(400).json({ error: 'Insufficient diamonds for VIP' });
        }

        user.diamonds -= VIP_PRICE;
        user.isVIP = true;
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 30);
        user.vipExpirationDate = expDate.toISOString();

        await user.save();
        res.json({ success: true, user });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/chats/mark-read', async (req, res) => res.json({}));
router.post('/chats/send', async (req, res) => {
    await Message.create({ id: Date.now().toString(), ...req.body, chatId: req.body.to });
    res.json({});
});
router.post('/streams/:id/kick', async (req, res) => res.json({}));
router.post('/streams/:id/moderator', async (req, res) => res.json({}));
router.get('/notifications', async (req, res) => res.json([]));
router.patch('/notifications/:id/read', async (req, res) => res.json({ success: true }));

export default router;
