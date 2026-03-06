import express from 'express';
import { Followers, User } from '../models';

const router = express.Router();

// POST /api/followers - Seguir usuário
router.post('/', async (req, res) => {
    try {
        const { followerId, followingId } = req.body;
        
        if (!followerId || !followingId) {
            return res.status(400).json({ error: 'followerId e followingId são obrigatórios' });
        }
        
        if (followerId === followingId) {
            return res.status(400).json({ error: 'Você não pode seguir a si mesmo' });
        }
        
        // Verificar se já segue
        const existingFollow = await Followers.findOne({
            followerId,
            followingId,
            isActive: true
        });
        
        if (existingFollow) {
            return res.status(400).json({ error: 'Você já segue este usuário' });
        }
        
        // Verificar se usuários existem
        const [follower, following] = await Promise.all([
            User.findOne({ id: followerId }),
            User.findOne({ id: followingId })
        ]);
        
        if (!follower || !following) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Criar relação de follow
        const follow = await Followers.create({
            id: `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            followerId,
            followingId,
            followedAt: new Date(),
            isActive: true
        });
        
        // Atualizar contadores
        await User.updateOne(
            { id: followerId },
            { $inc: { following: 1 } }
        );
        
        await User.updateOne(
            { id: followingId },
            { $inc: { fans: 1 } }
        );
        
        // Notificar via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${followingId}`).emit('new_follower', {
                followerId,
                followerName: follower.name,
                followerAvatar: follower.avatarUrl,
                timestamp: new Date()
            });
        }
        
        console.log(`✅ ${followerId} começou a seguir ${followingId}`);
        
        res.json({
            success: true,
            follow,
            follower: {
                id: follower.id,
                name: follower.name,
                avatarUrl: follower.avatarUrl
            },
            following: {
                id: following.id,
                name: following.name,
                avatarUrl: following.avatarUrl
            }
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao seguir usuário:', error);
        res.status(500).json({ error: 'Erro interno ao seguir usuário' });
    }
});

// GET /api/followers/:userId - Listar seguidores de um usuário
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        console.log(`🔍 Buscando seguidores do usuário: ${userId}`);
        
        // Buscar relações de seguidores ativas
        const followerRelations = await Followers.find({
            followingId: userId,
            isActive: true
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string));
        
        // Buscar detalhes dos seguidores
        const followerIds = followerRelations.map(rel => rel.followerId);
        const followers = await User.find({
            id: { $in: followerIds }
        }).select('id name avatarUrl level fans isOnline lastSeen');
        
        // Combinar dados
        const followersWithDetails = followerRelations.map(rel => {
            const followerDetails = followers.find(f => f.id === rel.followerId);
            return {
                followId: rel.id,
                followedAt: rel.followedAt,
                follower: followerDetails
            };
        });
        
        console.log(`📊 Encontrados ${followersWithDetails.length} seguidores para ${userId}`);
        
        res.json({
            success: true,
            followers: followersWithDetails,
            total: followersWithDetails.length
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao buscar seguidores:', error);
        res.status(500).json({ error: 'Erro interno ao buscar seguidores' });
    }
});

// GET /api/followers/:userId/following - Listar quem um usuário segue
router.get('/:userId/following', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        console.log(`🔍 Buscando usuários que ${userId} segue`);
        
        // Buscar relações de seguindo ativas
        const followingRelations = await Followers.find({
            followerId: userId,
            isActive: true
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string));
        
        // Buscar detalhes dos usuários seguidos
        const followingIds = followingRelations.map(rel => rel.followingId);
        const followingUsers = await User.find({
            id: { $in: followingIds }
        }).select('id name avatarUrl level fans isOnline lastSeen');
        
        // Combinar dados
        const followingWithDetails = followingRelations.map(rel => {
            const userDetails = followingUsers.find(u => u.id === rel.followingId);
            return {
                followId: rel.id,
                followedAt: rel.followedAt,
                following: userDetails
            };
        });
        
        console.log(`📊 ${userId} segue ${followingWithDetails.length} usuários`);
        
        res.json({
            success: true,
            following: followingWithDetails,
            total: followingWithDetails.length
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao buscar seguindo:', error);
        res.status(500).json({ error: 'Erro interno ao buscar seguindo' });
    }
});

// DELETE /api/followers/:id - Deixar de seguir
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { followerId } = req.body; // Para validação
        
        // Buscar relação de follow
        const follow = await Followers.findOne({ id });
        
        if (!follow) {
            return res.status(404).json({ error: 'Relação de follow não encontrada' });
        }
        
        if (followerId && follow.followerId !== followerId) {
            return res.status(403).json({ error: 'Não autorizado' });
        }
        
        // Desativar relação (soft delete)
        await Followers.updateOne(
            { id },
            { 
                isActive: false,
                unfollowedAt: new Date()
            }
        );
        
        // Atualizar contadores
        await User.updateOne(
            { id: follow.followerId },
            { $inc: { following: -1 } }
        );
        
        await User.updateOne(
            { id: follow.followingId },
            { $inc: { fans: -1 } }
        );
        
        // Notificar via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${follow.followingId}`).emit('unfollowed', {
                followerId: follow.followerId,
                timestamp: new Date()
            });
        }
        
        console.log(`✅ ${follow.followerId} deixou de seguir ${follow.followingId}`);
        
        res.json({
            success: true,
            message: 'Deixou de seguir com sucesso'
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao deixar de seguir:', error);
        res.status(500).json({ error: 'Erro interno ao deixar de seguir' });
    }
});

// GET /api/followers/check/:followerId/:followingId - Verificar se segue
router.get('/check/:followerId/:followingId', async (req, res) => {
    try {
        const { followerId, followingId } = req.params;
        
        const follow = await Followers.findOne({
            followerId,
            followingId,
            isActive: true
        });
        
        res.json({
            success: true,
            isFollowing: !!follow,
            followId: follow?.id || null
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao verificar follow:', error);
        res.status(500).json({ error: 'Erro interno ao verificar follow' });
    }
});

export default router;
