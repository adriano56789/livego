import express from 'express';
import { Block, User, Followers, Friendship } from '../models';
import { blockProtection } from '../middleware/appOwnerProtection';

const router = express.Router();

// POST /api/blocks - Bloquear usuário
router.post('/', blockProtection(), async (req, res) => {
    try {
        const { blockerId, blockedId } = req.body;
        
        if (!blockerId || !blockedId) {
            return res.status(400).json({ error: 'blockerId e blockedId são obrigatórios' });
        }
        
        if (blockerId === blockedId) {
            return res.status(400).json({ error: 'Você não pode bloquear a si mesmo' });
        }
        
        // Verificar se já está bloqueado
        const existingBlock = await Block.findOne({
            blockerId,
            blockedId,
            isActive: true
        });
        
        if (existingBlock) {
            return res.status(400).json({ error: 'Este usuário já está bloqueado' });
        }
        
        // Verificar se usuários existem
        const [blocker, blocked] = await Promise.all([
            User.findOne({ id: blockerId }),
            User.findOne({ id: blockedId })
        ]);
        
        if (!blocker || !blocked) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Criar bloqueio
        const block = await Block.create({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            blockerId,
            blockedId,
            blockedAt: new Date(),
            isActive: true
        });
        
        // Remover follow/seguimento existente entre eles
        await Promise.all([
            // Remover follow do blocker para o blocked
            Followers.updateOne(
                { followerId: blockerId, followingId: blockedId },
                { isActive: false, unfollowedAt: new Date() }
            ),
            // Remover follow do blocked para o blocker
            Followers.updateOne(
                { followerId: blockedId, followingId: blockerId },
                { isActive: false, unfollowedAt: new Date() }
            ),
            // Remover amizade se existir
            Friendship.updateOne(
                {
                    $or: [
                        { userId1: blockerId, userId2: blockedId },
                        { userId1: blockedId, userId2: blockerId }
                    ]
                },
                { isActive: false }
            )
        ]);
        
        // Notificar via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${blockedId}`).emit('user_blocked', {
                blockerId,
                blockerName: blocker.name,
                blockerAvatar: blocker.avatarUrl,
                timestamp: new Date()
            });
        }
        
        console.log(`🚫 ${blockerId} bloqueou ${blockedId}`);
        
        res.json({
            success: true,
            block,
            blocker: {
                id: blocker.id,
                name: blocker.name,
                avatarUrl: blocker.avatarUrl
            },
            blocked: {
                id: blocked.id,
                name: blocked.name,
                avatarUrl: blocked.avatarUrl
            }
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao bloquear usuário:', error);
        res.status(500).json({ error: 'Erro interno ao bloquear usuário' });
    }
});

// GET /api/blocks/:userId - Listar usuários bloqueados por um usuário
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        console.log(`🔍 Buscando usuários bloqueados por: ${userId}`);
        
        // Buscar relações de bloqueio ativas
        const blockRelations = await Block.find({
            blockerId: userId,
            isActive: true
        })
        .sort({ blockedAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string));
        
        // Buscar detalhes dos usuários bloqueados
        const blockedIds = blockRelations.map(rel => rel.blockedId);
        const blockedUsers = await User.find({
            id: { $in: blockedIds }
        }).select('id name avatarUrl level fans isOnline lastSeen');
        
        // Combinar dados
        const blockedWithDetails = blockRelations.map(rel => {
            const userDetails = blockedUsers.find(u => u.id === rel.blockedId);
            return {
                blockId: rel.id,
                blockedAt: rel.blockedAt,
                blockedUser: userDetails
            };
        });
        
        console.log(`📊 ${userId} bloqueou ${blockedWithDetails.length} usuários`);
        
        res.json({
            success: true,
            blockedUsers: blockedWithDetails,
            total: blockedWithDetails.length
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao buscar bloqueados:', error);
        res.status(500).json({ error: 'Erro interno ao buscar bloqueados' });
    }
});

// DELETE /api/blocks/:id - Desbloquear usuário
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { blockerId } = req.body; // Para validação
        
        // Buscar bloqueio
        const block = await Block.findOne({ id });
        
        if (!block) {
            return res.status(404).json({ error: 'Bloqueio não encontrado' });
        }
        
        if (blockerId && block.blockerId !== blockerId) {
            return res.status(403).json({ error: 'Não autorizado' });
        }
        
        // Desativar bloqueio (soft delete)
        await Block.updateOne(
            { id },
            { 
                isActive: false,
                unblockedAt: new Date()
            }
        );
        
        // Notificar via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${block.blockerId}`).emit('user_unblocked', {
                unblockedUserId: block.blockedId,
                timestamp: new Date()
            });
        }
        
        console.log(`✅ ${block.blockerId} desbloqueou ${block.blockedId}`);
        
        res.json({
            success: true,
            message: 'Usuário desbloqueado com sucesso'
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao desbloquear usuário:', error);
        res.status(500).json({ error: 'Erro interno ao desbloquear usuário' });
    }
});

// GET /api/blocks/check/:blockerId/:blockedId - Verificar se está bloqueado
router.get('/check/:blockerId/:blockedId', async (req, res) => {
    try {
        const { blockerId, blockedId } = req.params;
        
        const block = await Block.findOne({
            blockerId,
            blockedId,
            isActive: true
        });
        
        res.json({
            success: true,
            isBlocked: !!block,
            blockId: block?.id || null,
            blockedAt: block?.blockedAt || null
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao verificar bloqueio:', error);
        res.status(500).json({ error: 'Erro interno ao verificar bloqueio' });
    }
});

// GET /api/blocks/:userId/blocked-by - Listar usuários que bloquearam o usuário
router.get('/:userId/blocked-by', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        console.log(`🔍 Buscando quem bloqueou: ${userId}`);
        
        // Buscar relações onde o usuário é o bloqueado
        const blockRelations = await Block.find({
            blockedId: userId,
            isActive: true
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string));
        
        // Buscar detalhes dos bloqueadores
        const blockerIds = blockRelations.map(rel => rel.blockerId);
        const blockers = await User.find({
            id: { $in: blockerIds }
        }).select('id name avatarUrl level fans isOnline lastSeen');
        
        // Combinar dados
        const blockersWithDetails = blockRelations.map(rel => {
            const userDetails = blockers.find(u => u.id === rel.blockerId);
            return {
                blockId: rel.id,
                blockedAt: rel.blockedAt,
                blocker: userDetails
            };
        });
        
        console.log(`📊 ${blockersWithDetails.length} usuários bloquearam ${userId}`);
        
        res.json({
            success: true,
            blockedBy: blockersWithDetails,
            total: blockersWithDetails.length
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao buscar quem bloqueou:', error);
        res.status(500).json({ error: 'Erro interno ao buscar quem bloqueou' });
    }
});

export default router;
