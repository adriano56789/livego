import express from 'express';
import { User, Streamer, Gift, Message, PurchaseRecord, Order, Photo, Follow, Friendship, Followers, Block } from '../models';
import { getUserIdFromToken } from '../middleware/auth';

export const UserRoutes = express.Router();

// Importar io para eventos WebSocket
declare global {
    var io: any;
}

UserRoutes.get('/me', async (req, res) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify JWT and get user ID
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';
        const decoded = jwt.verify(token, JWT_SECRET);

        // Find user by ID from token
        let user = await User.findOne({ id: decoded.id });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error in /api/users/me:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
UserRoutes.get('/', async (req, res) => { res.json(await User.find()); });
UserRoutes.get('/:id', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    if (user) return res.json(user);
    res.status(404).json({ error: 'User not found' });
});

UserRoutes.get('/:id/status', async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findOne({ id: userId });

        // Se for o usuário de suporte e não existir, criar automaticamente
        if (!user && userId === 'support-livercore') {
            console.log('🔧 Criando usuário de suporte automaticamente');
            user = await User.create({
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
            });
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
    res.json({ success: !!user, user });
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
UserRoutes.post('/:id/block', async (req, res) => {
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
    // Get conversations where user is part of
    res.json([]);
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
UserRoutes.post('/:id/visit', async (req, res) => res.json({ success: true }));
UserRoutes.post('/:id/buy-diamonds', async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findOneAndUpdate(
            { id: req.params.id },
            { $inc: { diamonds: amount } },
            { new: true }
        );
        res.json({ success: !!user, user });
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
    res.json({ success: !!user, user: user || {} as any });
});
UserRoutes.post('/:id/privacy/activity', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { showActivityStatus: req.body.show }, { new: true });
    res.json({ success: !!user, user: user || {} as any });
});
UserRoutes.post('/:id/privacy/location', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { showLocation: req.body.show }, { new: true });
    res.json({ success: !!user, user: user || {} as any });
});
UserRoutes.get('/:id/received-gifts', async (req, res) => {
    // If Gift records are saved as PurchaseRecord we query that, otherwise just an empty real query
    const records = await PurchaseRecord.find({ userId: req.params.id, type: 'gift_received' });
    res.json(records);
});
UserRoutes.post('/:id/set-active-frame', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { activeFrameId: req.body.frameId }, { new: true });
    res.json({ success: !!user, user });
});
UserRoutes.get('/:id/avatar-protection', async (req, res) => {
    const user = await User.findOne({ id: req.params.id });
    res.json({ isEnabled: user?.isAvatarProtected ?? false });
});
UserRoutes.post('/:id/avatar-protection', async (req, res) => {
    const user = await User.findOneAndUpdate({ id: req.params.id }, { isAvatarProtected: req.body.isEnabled }, { new: true });
    res.json({ success: !!user, user });
});
export default UserRoutes;
