import express from 'express';
import { User } from '../models/index';
import { getIO } from '../server';

const router = express.Router();

// GET /api/status - Buscar status de usuários
router.get('/', async (req, res) => {
    try {
        const { userIds } = req.query;
        
        if (!userIds) {
            return res.status(400).json({ error: 'userIds é obrigatório' });
        }

        const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
        
        console.log(`🔍 Buscando status para ${userIdArray.length} usuários`);

        const users = await User.find({ 
            id: { $in: userIdArray } 
        }).select('id name isOnline lastSeen avatarUrl');

        const statusMap = users.reduce((acc, user) => {
            acc[user.id] = {
                id: user.id,
                name: user.name,
                isOnline: user.isOnline || false,
                lastSeen: user.lastSeen,
                avatarUrl: user.avatarUrl
            };
            return acc;
        }, {} as any);

        res.json({
            success: true,
            statuses: statusMap
        });

    } catch (error: any) {
        console.error('❌ Erro ao buscar status:', error);
        res.status(500).json({ error: 'Erro interno ao buscar status' });
    }
});

// POST /api/status/online - Atualizar status online
router.post('/online', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId é obrigatório' });
        }

        console.log(`🟢 Usuário ${userId} ficou online`);

        // Atualizar status no banco
        await User.findOneAndUpdate(
            { id: userId },
            { 
                isOnline: true,
                lastSeen: new Date().toISOString()
            }
        );

        // Notificar via WebSocket
        const io = getIO();
        
        // Notificar todos os usuários sobre mudança de status
        io.emit('user_status_changed', {
            userId,
            isOnline: true,
            lastSeen: new Date().toISOString()
        });

        // Entrar na sala do usuário para receber mensagens
        io.sockets.sockets.forEach(socket => {
            if (socket.data.userId === userId) {
                socket.join(`user_${userId}`);
            }
        });

        res.json({
            success: true,
            status: 'online'
        });

    } catch (error: any) {
        console.error('❌ Erro ao atualizar status online:', error);
        res.status(500).json({ error: 'Erro interno ao atualizar status' });
    }
});

// POST /api/status/offline - Atualizar status offline
router.post('/offline', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId é obrigatório' });
        }

        console.log(`🔴 Usuário ${userId} ficou offline`);

        // Atualizar status no banco
        await User.findOneAndUpdate(
            { id: userId },
            { 
                isOnline: false,
                lastSeen: new Date().toISOString()
            }
        );

        // Notificar via WebSocket
        const io = getIO();
        
        // Notificar todos os usuários sobre mudança de status
        io.emit('user_status_changed', {
            userId,
            isOnline: false,
            lastSeen: new Date().toISOString()
        });

        // Sair da sala do usuário
        io.sockets.sockets.forEach(socket => {
            if (socket.data.userId === userId) {
                socket.leave(`user_${userId}`);
            }
        });

        res.json({
            success: true,
            status: 'offline'
        });

    } catch (error: any) {
        console.error('❌ Erro ao atualizar status offline:', error);
        res.status(500).json({ error: 'Erro interno ao atualizar status' });
    }
});

export default router;
