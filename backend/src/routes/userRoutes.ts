import express from 'express';
import { User, Streamer, Gift, Message, PurchaseRecord, Order, Photo, Follow, Friendship, Followers, Block } from '../models';
import { getUserIdFromToken, protect } from '../middleware/auth';
import { standardizeUserResponse, standardizeUsersList } from '../utils/userResponse';
import { blockProtection } from '../middleware/appOwnerProtection';

export const UserRoutes = express.Router();

// Importar io para eventos WebSocket
declare global {
    var io: any;
}

UserRoutes.get('/me', protect, async (req, res) => {
    try {
        // Get user ID from authenticated request (middleware protect already decoded token)
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User ID not found in token' });
        }

        // Find user by ID from token (forçar leitura fresh do banco)
        let user = await User.findOne({ id: userId }).lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(standardizeUserResponse(user));
    } catch (error) {
        console.error('Error in /api/users/me:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
UserRoutes.get('/', async (req, res) => { res.json(standardizeUsersList(await User.find())); });
UserRoutes.get('/:id', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    if (user) return res.json(standardizeUserResponse(user));
    res.status(404).json({ error: 'User not found' });
});

UserRoutes.get('/:id/status', async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findOne({ id: userId });

        // Se for o usuário de suporte e não existir, criar automaticamente
        if (!user && userId === 'support-livercore') {
            console.log('🔧 Criando usuário de suporte automaticamente');
            user = await User.findOneAndUpdate(
                { id: 'support-livercore' },
                {
                    id: 'support-livercore',
                    name: 'Support',
                    avatarUrl: '', // Generic avatar
                    diamonds: 0,
                    level: 1,
                    xp: 0,
                    fans: 0,
                    following: 0,
                    isOnline: true,
                    lastSeen: new Date().toISOString()
                },
                { 
                    upsert: true, // Criar se não existir
                    new: true
                }
            );
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            isOnline: user.isOnline || false,
            lastSeen: user.lastSeen || new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting user status:', error);
        res.status(500).json({ error: 'Failed to get user status' });
    }
});
UserRoutes.delete('/:id', async (req, res) => {
    await User.deleteOne({ id: req.params.id });
    res.json({ success: true });
});
UserRoutes.patch('/:id', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (user && req.body.avatarUrl) {
        const io = req.app.get('io');
        if (io) io.emit('avatar_updated', { userId: user.id, avatarUrl: user.avatarUrl, timestamp: new Date().toISOString() });
    }
    res.json({ success: !!user, user: standardizeUserResponse(user) });
});

// DELETE /api/users/:userId/photos/:photoId - Remover foto das obras do usuário (User.obras)
UserRoutes.delete('/:userId/photos/:photoId', async (req, res) => {
    try {
        const { userId, photoId } = req.params;
        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

        const obras = Array.isArray(user.obras) ? user.obras : [];
        const newObras = obras.filter((o: any) => o && o.id !== photoId);
        if (newObras.length === obras.length) {
            return res.status(404).json({ success: false, error: 'Foto não encontrada' });
        }

        const newAvatarUrl = newObras.length > 0 && newObras[0]?.url ? newObras[0].url : '';
        const updated = await User.findOneAndUpdate(
            { id: userId },
            { $set: { obras: newObras, avatarUrl: newAvatarUrl } },
            { new: true }
        );

        // Emitir avatar_updated para atualização em tempo real na UI
        const io = req.app.get('io');
        if (io && updated) io.emit('avatar_updated', { userId: updated.id, avatarUrl: newAvatarUrl, timestamp: new Date().toISOString() });

        res.json({ success: true, message: 'Foto removida com sucesso' });
    } catch (error: any) {
        console.error('Erro ao remover foto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

UserRoutes.post('/:id/toggle-follow', async (req, res) => {
    try {
        const followerId = getUserIdFromToken(req);
        if (!followerId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const followingId = req.params.id;

        if (followerId === followingId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        // Verificar se já existe um follow
        const existingFollow = await Followers.findOne({
            followerId,
            followingId,
            isActive: true
        });

        if (existingFollow) {
            // Dar unfollow
            await Followers.findOneAndUpdate(
                { followerId, followingId, isActive: true },
                {
                    isActive: false,
                    unfollowedAt: new Date()
                }
            );

            // Atualizar contadores E listas
            await User.findOneAndUpdate({ id: followerId }, {
                $inc: { following: -1 },
                $pull: { followingList: followingId }
            });
            await User.findOneAndUpdate({ id: followingId }, {
                $inc: { fans: -1 },
                $pull: { followersList: followerId },
                isFollowed: false
            });

            res.json({
                success: true,
                isFollowing: false,
                message: 'Unfollowed successfully'
            });
        } else {
            // Dar follow
            // Verificar se já existe um follow inativo para reativar
            const inactiveFollow = await Followers.findOne({
                followerId,
                followingId,
                isActive: false
            });

            if (inactiveFollow) {
                // Reativar follow existente
                await Followers.findOneAndUpdate(
                    { followerId, followingId, isActive: false },
                    {
                        isActive: true,
                        followedAt: new Date(),
                        unfollowedAt: undefined
                    }
                );
            } else {
                // Criar novo follow
                await Followers.create({
                    id: `followers_${followerId}_${followingId}`,
                    followerId,
                    followingId,
                    followedAt: new Date(),
                    isActive: true
                });
            }

            // Verificar se a pessoa já segue de volta (follow recíproco)
            const reciprocalFollow = await Followers.findOne({
                followerId: followingId,
                followingId: followerId,
                isActive: true
            });

            let isFriendship = false;

            // Se houver follow recíproco, criar amizade
            if (reciprocalFollow) {
                // Verificar se amizade já existe
                const existingFriendship = await Friendship.findOne({
                    $or: [
                        { userId1: followerId, userId2: followingId },
                        { userId1: followingId, userId2: followerId }
                    ],
                    isActive: true
                });

                if (!existingFriendship) {
                    // Criar nova amizade
                    await Friendship.create({
                        id: `friendship_${followerId}_${followingId}_${Date.now()}`,
                        userId1: followerId,
                        userId2: followingId,
                        initiatedBy: followerId,
                        friendshipStartedAt: new Date(),
                        isActive: true
                    });

                    // Atualizar friendsList de ambos os usuários
                    await User.findOneAndUpdate({ id: followerId }, {
                        $push: { friendsList: followingId }
                    });
                    await User.findOneAndUpdate({ id: followingId }, {
                        $push: { friendsList: followerId }
                    });

                    isFriendship = true;
                }
            }

            // Atualizar contadores E listas
            await User.findOneAndUpdate({ id: followerId }, {
                $inc: { following: 1 },
                $push: { followingList: followingId }
            });
            await User.findOneAndUpdate({ id: followingId }, {
                $inc: { fans: 1 },
                $push: { followersList: followerId },
                isFollowed: true
            });

            res.json({
                success: true,
                isFollowing: true,
                isFriendship,
                message: isFriendship ? 'Followed and became friends!' : 'Followed successfully'
            });
        }
    } catch (error: any) {
        console.error('Error in toggle-follow:', error);
        res.status(500).json({ error: error.message });
    }
});
UserRoutes.post('/:id/block', blockProtection(), async (req, res) => {
    try {
        const blockerId = '10755083'; // ID fixo para demonstração - pegar do token em produção
        const blockedId = req.params.id;
        const { reason } = req.body;

        if (blockerId === blockedId) {
            return res.status(400).json({ error: 'Cannot block yourself' });
        }

        // Verificar se já existe um bloqueio ativo
        const existingBlock = await Block.findOne({
            blockerId,
            blockedId,
            isActive: true
        });

        if (existingBlock) {
            return res.status(400).json({ error: 'User already blocked' });
        }

        // Verificar se usuários existem
        const blocker = await User.findOne({ id: blockerId });
        const blocked = await User.findOne({ id: blockedId });

        if (!blocker || !blocked) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Criar bloqueio
        await Block.create({
            id: `block_${blockerId}_${blockedId}_${Date.now()}`,
            blockerId,
            blockedId,
            blockedAt: new Date(),
            isActive: true,
            reason: reason || ''
        });

        // Adicionar à lista de bloqueados do usuário
        await User.findOneAndUpdate(
            { id: blockerId },
            { $push: { blockedUsers: blockedId } }
        );

        // Remover follow se existir
        await Followers.findOneAndUpdate(
            { followerId: blockedId, followingId: blockerId, isActive: true },
            { isActive: false, unfollowedAt: new Date() }
        );

        await Followers.findOneAndUpdate(
            { followerId: blockerId, followingId: blockedId, isActive: true },
            { isActive: false, unfollowedAt: new Date() }
        );

        // Atualizar contadores
        await User.findOneAndUpdate(
            { id: blockerId },
            { $inc: { following: -1 }, $pull: { followingList: blockedId } }
        );

        await User.findOneAndUpdate(
            { id: blockedId },
            { $inc: { fans: -1 }, $pull: { followersList: blockerId } }
        );

        res.json({ success: true, message: 'User blocked successfully' });
    } catch (error: any) {
        console.error('Error blocking user:', error);
        res.status(500).json({ error: error.message });
    }
});

UserRoutes.delete('/:id/unblock', async (req, res) => {
    try {
        const blockerId = '10755083'; // ID fixo para demonstração - pegar do token em produção
        const blockedId = req.params.id;

        // Verificar se existe um bloqueio ativo
        const existingBlock = await Block.findOne({
            blockerId,
            blockedId,
            isActive: true
        });

        if (!existingBlock) {
            return res.status(400).json({ error: 'User is not blocked' });
        }

        // Desbloquear
        await Block.findOneAndUpdate(
            { blockerId, blockedId, isActive: true },
            {
                isActive: false,
                unblockedAt: new Date()
            }
        );

        // Remover da lista de bloqueados
        await User.findOneAndUpdate(
            { id: blockerId },
            { $pull: { blockedUsers: blockedId } }
        );

        res.json({ success: true, message: 'User unblocked successfully' });
    } catch (error: any) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ error: error.message });
    }
});
UserRoutes.post('/:id/report', async (req, res) => res.json({ success: true }));
UserRoutes.get('/:id/fans', async (req, res) => {
    try {
        const userId = req.params.id;

        // Buscar follows ativos onde este usuário é seguido
        const follows = await Followers.find({
            followingId: userId,
            isActive: true
        });

        // Extrair IDs dos seguidores
        const followerIds = follows.map((follow: any) => follow.followerId);

        // Buscar dados completos dos seguidores
        const fans = await User.find({
            id: { $in: followerIds }
        }).select('id name avatarUrl level fans following isLive isOnline lastSeen');

        res.json(fans);
    } catch (error: any) {
        console.error('Error getting fans:', error);
        res.status(500).json({ error: error.message });
    }
});
UserRoutes.get('/:id/following', async (req, res) => {
    try {
        const userId = req.params.id;

        // Buscar follows ativos do usuário
        const follows = await Followers.find({
            followerId: userId,
            isActive: true
        });

        // Extrair IDs dos usuários seguidos
        const followingIds = follows.map((follow: any) => follow.followingId);

        // Buscar dados completos dos usuários seguidos
        const followingUsers = await User.find({
            id: { $in: followingIds }
        }).select('id name avatarUrl level fans following isLive isOnline lastSeen');

        res.json(followingUsers);
    } catch (error: any) {
        console.error('Error getting following users:', error);
        res.status(500).json({ error: error.message });
    }
});
UserRoutes.get('/:id/friends', async (req, res) => {
    try {
        const userId = req.params.id;

        // Buscar amizades ativas do usuário
        const friendships = await Friendship.find({
            $or: [
                { userId1: userId, isActive: true },
                { userId2: userId, isActive: true }
            ]
        });

        // Extrair IDs dos amigos
        const friendIds = friendships.map((friendship: any) =>
            friendship.userId1 === userId ? friendship.userId2 : friendship.userId1
        );

        // Buscar dados completos dos amigos
        const friends = await User.find({
            id: { $in: friendIds }
        }).select('id name avatarUrl level fans following isLive isOnline lastSeen');

        res.json(friends);
    } catch (error: any) {
        console.error('Error getting friends:', error);
        res.status(500).json({ error: error.message });
    }
});
UserRoutes.get('/:id/messages', async (req, res) => {
    try {
        const userId = req.params.id;

        // Importar ChatMessage dinamicamente para evitar dependência circular
        const { ChatMessage } = await import('../models/index');

        // Buscar todas as mensagens onde o usuário participou
        const messages = await ChatMessage.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        }).sort({ sentAt: -1 });

        // Extrair IDs únicos dos interlocutores (a outra pessoa em cada conversa)
        const partnerIds = new Set<string>();
        const lastMessageByPartner = new Map<string, any>();

        messages.forEach((msg: any) => {
            const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            if (partnerId && partnerId !== userId) {
                partnerIds.add(partnerId);
                // Guardar apenas a mensagem mais recente por parceiro
                if (!lastMessageByPartner.has(partnerId)) {
                    lastMessageByPartner.set(partnerId, msg);
                }
            }
        });

        if (partnerIds.size === 0) {
            return res.json([]);
        }

        // Buscar dados dos parceiros
        const partners = await User.find({ id: { $in: Array.from(partnerIds) } });

        // Contar mensagens não lidas por parceiro
        const unreadCounts = await Promise.all(
            Array.from(partnerIds).map(async (partnerId) => {
                const { ChatMessage: CM } = await import('../models/index');
                const count = await (CM as any).countDocuments({
                    senderId: partnerId,
                    receiverId: userId,
                    isRead: false
                });
                return { partnerId, count };
            })
        );

        const unreadMap = new Map<string, number>();
        unreadCounts.forEach(({ partnerId, count }) => unreadMap.set(partnerId, count));

        // Montar resposta em formato Conversation
        const conversations = partners.map((partner: any) => {
            const lastMsg = lastMessageByPartner.get(partner.id);
            const lastMsgText = lastMsg?.content || '';
            const lastMsgTime = lastMsg?.sentAt ? new Date(lastMsg.sentAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';

            return {
                id: `conv_${userId}_${partner.id}`,
                friend: partner,
                lastMessage: lastMsgText,
                timestamp: lastMsgTime,
                unreadCount: unreadMap.get(partner.id) || 0
            };
        });

        // Ordenar por mensagem mais recente primeiro
        conversations.sort((a: any, b: any) => {
            const aMsg = lastMessageByPartner.get(a.friend.id);
            const bMsg = lastMessageByPartner.get(b.friend.id);
            const aTime = aMsg?.sentAt ? new Date(aMsg.sentAt).getTime() : 0;
            const bTime = bMsg?.sentAt ? new Date(bMsg.sentAt).getTime() : 0;
            return bTime - aTime;
        });

        res.json(conversations);
    } catch (error: any) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ error: error.message });
    }
});
UserRoutes.get('/me/blocklist', async (req, res) => {
    try {
        const blockerId = getUserIdFromToken(req);
        if (!blockerId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Buscar bloqueios ativos
        const blocks = await Block.find({
            blockerId,
            isActive: true
        });

        // Extrair IDs dos usuários bloqueados
        const blockedIds = blocks.map((block: any) => block.blockedId);

        // Buscar dados completos dos usuários bloqueados
        const blockedUsers = await User.find({
            id: { $in: blockedIds }
        }).select('id name avatarUrl level fans following isLive isOnline lastSeen');

        res.json(blockedUsers);
    } catch (error: any) {
        console.error('Error getting blocklist:', error);
        res.status(500).json({ error: error.message });
    }
});
UserRoutes.get('/:id/status', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    res.json({ isOnline: user?.isOnline ?? false, lastSeen: user?.lastSeen ?? new Date().toISOString() });
});
UserRoutes.get('/:id/photos', async (req, res) => {
    try {
        const userId = req.params.id;
        const photos = await Photo.find({ userId }).sort({ createdAt: -1 });

        const user = await User.findOne({ id: userId });
        const userObj = user || { id: userId, name: 'Unknown', avatarUrl: '' };

        const formattedPhotos = photos.map(photo => {
            const photoJson = photo.toJSON();
            return {
                ...photoJson,
                photoUrl: photoJson.url,
                user: userObj
            };
        });
        res.json(formattedPhotos);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
UserRoutes.get('/:id/liked-photos', async (req, res) => {
    try {
        const userId = req.params.id;
        // Basic implementation for demonstration, assuming photos liked by the user 
        // In a real application, you'd query a Like collection that maps userIds to photoIds.
        // For now, we'll just return a few recent photos and pretend they are liked.
        const photos = await Photo.find().sort({ createdAt: -1 }).limit(10);

        const userIds = [...new Set(photos.map(p => p.userId))];
        const users = await User.find({ id: { $in: userIds } });
        const userMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {} as Record<string, any>);

        const formattedPhotos = photos.map(photo => {
            const photoJson = photo.toJSON();
            return {
                ...photoJson,
                photoUrl: photoJson.url,
                isLiked: true, // Force true for display
                user: userMap[photoJson.userId] || { id: photoJson.userId, name: 'UnknownUser', avatarUrl: '' }
            };
        });
        res.json(formattedPhotos);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
UserRoutes.get('/:id/level-info', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const xpForCurrentLevel = (user.level - 1) * 1000;
    const xpForNextLevel = user.level * 1000;
    const progress = Math.min(100, Math.max(0, ((user.xp || 0) - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel) * 100));

    res.json({
        level: user.level,
        xp: user.xp || 0,
        xpForCurrentLevel,
        xpForNextLevel,
        progress,
        privileges: ['Acesso ao chat VIP', 'Emblema exclusivo'],
        nextRewards: ['Moldura Especial']
    });
});
UserRoutes.post('/:id/visit', async (req, res) => {
    try {
        const { userId } = req.body;
        const profileId = req.params.id;

        if (!userId || !profileId) {
            return res.status(400).json({ error: 'userId e profileId são obrigatórios' });
        }

        if (userId === profileId) {
            return res.status(400).json({ error: 'Usuário não pode visitar o próprio perfil' });
        }

        console.log(`👁️ Usuário ${userId} visitou o perfil de ${profileId}`);

        // Verificar se ambos os usuários existem
        const [visitor, profile] = await Promise.all([
            User.findOne({ id: userId }),
            User.findOne({ id: profileId })
        ]);

        if (!visitor || !profile) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Importar Visitor dinamicamente para evitar dependência circular
        const { Visitor } = await import('../models');

        // Salvar visita no banco com upsert automático completo
        const visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await Visitor.findOneAndUpdate(
            { visitorId: userId, visitedId: profileId },
            {
                id: visitorId,
                visitorId: userId,
                visitedId: profileId,
                visitedAt: new Date(),
                visitorName: visitor.name,
                visitorAvatar: visitor.avatarUrl
            },
            { 
                upsert: true, // Criar se não existir
                new: true
            }
        );

        console.log(`✅ Visita registrada: ${userId} → ${profileId}`);

        res.json({
            success: true,
            message: 'Visita registrada com sucesso'
        });

    } catch (error: any) {
        console.error('❌ Erro ao registrar visita:', error);
        res.status(500).json({ error: 'Erro ao registrar visita' });
    }
});
UserRoutes.post('/:id/buy-diamonds', async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findOneAndUpdate(
            { id: req.params.id },
            { $inc: { diamonds: amount } },
            { new: true }
        );
        res.json({ success: !!user, user: standardizeUserResponse(user) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
UserRoutes.get('/:id/location-permission', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    res.json({ status: user?.locationPermission || 'prompt' });
});
UserRoutes.post('/:id/location-permission', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { locationPermission: req.body.status }, { new: true });
    res.json({ success: !!user, user: standardizeUserResponse(user) || {} as any });
});
UserRoutes.post('/:id/privacy/activity', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { showActivityStatus: req.body.show }, { new: true });
    res.json({ success: !!user, user: standardizeUserResponse(user) || {} as any });
});
UserRoutes.post('/:id/privacy/location', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { showLocation: req.body.show }, { new: true });
    res.json({ success: !!user, user: standardizeUserResponse(user) || {} as any });
});
UserRoutes.get('/:id/received-gifts', async (req, res) => {
    // If Gift records are saved as PurchaseRecord we query that, otherwise just an empty real query
    const records = await PurchaseRecord.find({ userId: req.params.id, type: 'gift_received' });
    res.json(records);
});
UserRoutes.post('/:id/set-active-frame', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { activeFrameId: req.body.frameId }, { new: true });
    res.json({ success: !!user, user: standardizeUserResponse(user) });
});
UserRoutes.get('/:id/avatar-protection', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    res.json({ isEnabled: user?.isAvatarProtected ?? false });
});
UserRoutes.post('/:id/avatar-protection', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { isAvatarProtected: req.body.isEnabled }, { new: true });
    res.json({ success: !!user, user: standardizeUserResponse(user) });
});

// Comprar quadro de avatar
UserRoutes.post('/:userId/frames/buy', async (req, res) => {
    try {
        const { userId } = req.params;
        const { frameId, price, duration } = req.body;

        if (!userId || !frameId || !price || !duration) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        // Importar modelos dinamicamente
        const { Frame, UserFrame } = await import('../models');

        // Verificar se o frame existe
        const frame = await Frame.findOne({ id: frameId, isActive: true });
        if (!frame) {
            return res.status(404).json({ error: 'Frame não encontrado' });
        }

        // Verificar se o usuário já possui este frame ativo
        const existingFrame = await UserFrame.findOne({
            userId,
            frameId,
            isActive: true,
            expirationDate: { $gt: new Date() }
        });

        if (existingFrame) {
            return res.status(400).json({ error: 'Você já possui este frame' });
        }

        // Verificar diamonds do usuário
        const user = await User.findOne({ id: userId });
        if (!user || user.diamonds < price) {
            return res.status(400).json({ error: 'Diamonds insuficientes' });
        }

        // Deduzir diamonds
        user.diamonds -= price;
        await user.save();

        // Calcular data de expiração
        const expirationDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

        // Criar registro do frame do usuário
        const userFrame = await UserFrame.create({
            id: `userframe_${userId}_${frameId}_${Date.now()}`,
            userId,
            frameId,
            purchaseDate: new Date(),
            expirationDate,
            isActive: true,
            isEquipped: false
        });

        console.log(`✅ Frame ${frameId} criado no UserFrame:`, userFrame);

        // Atualizar ownedFrames no usuário
        await User.findOneAndUpdate(
            { id: userId },
            { 
                $push: { 
                    ownedFrames: { 
                        frameId, 
                        expirationDate: expirationDate.toISOString() 
                    } 
                } 
            }
        );

        console.log(`✅ Frame ${frameId} comprado pelo usuário ${userId}`);

        // Buscar usuário atualizado com frames
        const updatedUser = await User.findOne({ id: userId });
        
        res.json({ 
            success: true, 
            user: standardizeUserResponse(updatedUser),
            userFrame
        });

    } catch (error: any) {
        console.error('❌ Erro ao comprar frame:', error);
        res.status(500).json({ error: error.message });
    }
});

// Equipar quadro de avatar
UserRoutes.post('/:userId/frames/equip', async (req, res) => {
    try {
        const { userId } = req.params;
        const { frameId } = req.body;

        if (!userId || !frameId) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        // Importar modelos dinamicamente
        const { UserFrame } = await import('../models');

        console.log(`🔍 Procurando frame: userId=${userId}, frameId=${frameId}`);

        // Verificar se o frame pertence ao usuário usando o array ownedFrames (abordagem consistente)
        const user = await User.findOne({ id: userId });
        
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        console.log(`📋 Usuário encontrado:`, user.id, `ownedFrames:`, user.ownedFrames);

        // Verificar se o usuário possui este frame
        const ownedFrame = (user.ownedFrames || []).find((f: any) => f.frameId === frameId);
        
        if (!ownedFrame) {
            console.log(`❌ Frame não encontrado no ownedFrames`);
            return res.status(404).json({ error: 'Frame não encontrado' });
        }

        // Verificar se o frame não expirou
        const expirationDate = new Date(ownedFrame.expirationDate);
        if (expirationDate <= new Date()) {
            console.log(`❌ Frame expirado: ${expirationDate} vs ${new Date()}`);
            return res.status(404).json({ error: 'Frame expirado' });
        }

        console.log(`✅ Frame válido encontrado:`, ownedFrame);

        // Atualizar activeFrameId do usuário
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            { activeFrameId: frameId },
            { new: true }
        );

        console.log(`✅ Frame ${frameId} equipado pelo usuário ${userId}`);

        res.json({ 
            success: true, 
            user: standardizeUserResponse(updatedUser),
            equippedFrame: ownedFrame
        });

    } catch (error: any) {
        console.error('❌ Erro ao equipar frame:', error);
        res.status(500).json({ error: error.message });
    }
});

// Desequipar quadro de avatar
UserRoutes.post('/:userId/frames/unequip', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'UserId é obrigatório' });
        }

        // Remover activeFrameId do usuário
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            { activeFrameId: null },
            { new: true }
        );

        console.log(`✅ Frame desequipado pelo usuário ${userId}`);

        res.json({ 
            success: true, 
            user: standardizeUserResponse(updatedUser)
        });

    } catch (error: any) {
        console.error('❌ Erro ao desequipar frame:', error);
        res.status(500).json({ error: error.message });
    }
});

// Listar frames do usuário
UserRoutes.get('/:userId/frames', async (req, res) => {
    try {
        const { userId } = req.params;

        // Importar modelos dinamicamente
        const { UserFrame, Frame } = await import('../models');

        // Buscar frames do usuário
        const userFrames = await UserFrame.find({
            userId,
            isActive: true,
            expirationDate: { $gt: new Date() }
        }).populate('frameId');

        // Buscar usuário para obter diamonds
        const user = await User.findOne({ id: userId });

        // Formatar resposta
        const ownedFrames = userFrames.map(uf => ({
            ...uf.toObject(),
            frame: uf.frameId
        }));

        res.json({
            ownedFrames,
            activeFrameId: user?.activeFrameId || null,
            diamonds: user?.diamonds || 0
        });

    } catch (error: any) {
        console.error('❌ Erro ao buscar frames do usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

export default UserRoutes;
