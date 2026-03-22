import express, { Request, Response } from 'express';
import { UserStatus } from '../models';

const router = express.Router();

// GET /user/:id/status - Obter status do usuário
router.get('/user/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        let userStatus = await UserStatus.findOne({ user_id: id });
        
        if (!userStatus) {
            // Criar status padrão se não existir
            userStatus = await UserStatus.create({
                user_id: id,
                is_online: false,
                last_seen: new Date(),
                updated_at: new Date()
            });
        }

        res.json({
            user_id: userStatus.user_id,
            is_online: userStatus.is_online,
            last_seen: userStatus.last_seen,
            updated_at: userStatus.updated_at
        });
    } catch (error: any) {
        console.error('Erro ao buscar status do usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /user/:id/online - Marcar usuário como online
router.post('/user/:id/online', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const userStatus = await UserStatus.findOneAndUpdate(
            { user_id: id },
            { 
                is_online: true,
                updated_at: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ 
            success: true, 
            message: 'Usuário marcado como online',
            user_id: userStatus.user_id,
            is_online: true,
            updated_at: userStatus.updated_at
        });

    } catch (error: any) {
        console.error('Erro ao marcar usuário como online:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /user/:id/offline - Marcar usuário como offline
router.post('/user/:id/offline', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const userStatus = await UserStatus.findOneAndUpdate(
            { user_id: id },
            { 
                is_online: false,
                last_seen: new Date(),
                updated_at: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ 
            success: true, 
            message: 'Usuário marcado como offline',
            user_id: userStatus.user_id,
            is_online: false,
            last_seen: userStatus.last_seen,
            updated_at: userStatus.updated_at
        });

    } catch (error: any) {
        console.error('Erro ao marcar usuário como offline:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /user/:id/status - Atualizar status (unificado)
router.put('/user/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_online } = req.body;

        if (typeof is_online !== 'boolean') {
            return res.status(400).json({ error: 'is_online deve ser booleano' });
        }

        const updateData: any = {
            is_online,
            updated_at: new Date()
        };

        if (!is_online) {
            updateData.last_seen = new Date();
        }

        const userStatus = await UserStatus.findOneAndUpdate(
            { user_id: id },
            updateData,
            { upsert: true, new: true }
        );

        res.json({ 
            success: true, 
            message: `Usuário marcado como ${is_online ? 'online' : 'offline'}`,
            user_id: userStatus.user_id,
            is_online: userStatus.is_online,
            last_seen: userStatus.last_seen,
            updated_at: userStatus.updated_at
        });

    } catch (error: any) {
        console.error('Erro ao atualizar status do usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /users/online - Lista de usuários online
router.get('/users/online', async (req: Request, res: Response) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        
        const onlineUsers = await UserStatus.find({ is_online: true })
            .sort({ updated_at: -1 })
            .limit(Number(limit))
            .skip(Number(offset))
            .select('user_id last_seen updated_at');

        res.json({
            users: onlineUsers,
            total: onlineUsers.length,
            limit: Number(limit),
            offset: Number(offset)
        });

    } catch (error: any) {
        console.error('Erro ao buscar usuários online:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /users/batch-status - Obter status de múltiplos usuários
router.post('/users/batch-status', async (req: Request, res: Response) => {
    try {
        const { user_ids } = req.body;

        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ error: 'user_ids deve ser um array não vazio' });
        }

        const userStatuses = await UserStatus.find({ 
            user_id: { $in: user_ids } 
        }).select('user_id is_online last_seen updated_at');

        // Criar mapa para fácil acesso
        const statusMap = new Map();
        userStatuses.forEach(status => {
            statusMap.set(status.user_id, status);
        });

        // Garantir que todos os IDs solicitados tenham uma resposta
        const result = user_ids.map(userId => {
            const status = statusMap.get(userId);
            if (status) {
                return status;
            } else {
                // Status padrão para usuários não encontrados
                return {
                    user_id: userId,
                    is_online: false,
                    last_seen: new Date(),
                    updated_at: new Date()
                };
            }
        });

        res.json({
            users: result,
            total: result.length
        });

    } catch (error: any) {
        console.error('Erro ao buscar status em lote:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
