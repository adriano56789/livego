import express from 'express';
import { virtualIPManager, VirtualUser, VirtualRoom } from '../services/VirtualIPManager';

const router = express.Router();

/**
 * POST /api/virtual-ip/register
 * Registra um usuário com IP virtual
 */
router.post('/register', async (req, res) => {
    try {
        const { userId, realIP, socketId } = req.body;

        if (!userId || !realIP || !socketId) {
            return res.status(400).json({
                error: 'Dados obrigatórios faltando: userId, realIP, socketId'
            });
        }

        const virtualUser = virtualIPManager.registerUser(userId, realIP, socketId);

        res.json({
            success: true,
            virtualUser: {
                userId: virtualUser.userId,
                virtualIP: virtualUser.virtualIP,
                realIP: virtualUser.realIP,
                socketCount: virtualUser.socketIds.size,
                currentRoom: virtualUser.currentRoom,
                joinedAt: virtualUser.joinedAt
            }
        });
    } catch (error) {
        console.error('Erro ao registrar usuário virtual:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/virtual-ip/unregister
 * Remove um socket de um usuário
 */
router.post('/unregister', async (req, res) => {
    try {
        const { userId, socketId } = req.body;

        if (!userId || !socketId) {
            return res.status(400).json({
                error: 'Dados obrigatórios faltando: userId, socketId'
            });
        }

        const userRemoved = virtualIPManager.removeSocket(userId, socketId);

        res.json({
            success: true,
            userRemoved
        });
    } catch (error) {
        console.error('Erro ao remover socket virtual:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/virtual-ip/user/:userId
 * Obtém informações de um usuário
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const virtualUser = virtualIPManager.getUser(userId);

        if (!virtualUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            success: true,
            virtualUser: {
                userId: virtualUser.userId,
                virtualIP: virtualUser.virtualIP,
                realIP: virtualUser.realIP,
                socketCount: virtualUser.socketIds.size,
                currentRoom: virtualUser.currentRoom,
                joinedAt: virtualUser.joinedAt,
                lastSeen: virtualUser.lastSeen
            }
        });
    } catch (error) {
        console.error('Erro ao obter usuário virtual:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/virtual-ip/user-by-ip/:virtualIP
 * Obtém usuário pelo IP virtual
 */
router.get('/user-by-ip/:virtualIP', async (req, res) => {
    try {
        const { virtualIP } = req.params;
        const virtualUser = virtualIPManager.getUserByVirtualIP(virtualIP);

        if (!virtualUser) {
            return res.status(404).json({ error: 'IP virtual não encontrado' });
        }

        res.json({
            success: true,
            virtualUser: {
                userId: virtualUser.userId,
                virtualIP: virtualUser.virtualIP,
                realIP: virtualUser.realIP,
                socketCount: virtualUser.socketIds.size,
                currentRoom: virtualUser.currentRoom,
                joinedAt: virtualUser.joinedAt
            }
        });
    } catch (error) {
        console.error('Erro ao obter usuário por IP virtual:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/virtual-room/create
 * Cria uma nova sala virtual
 */
router.post('/create', async (req, res) => {
    try {
        const { streamId, hostId } = req.body;

        if (!streamId || !hostId) {
            return res.status(400).json({
                error: 'Dados obrigatórios faltando: streamId, hostId'
            });
        }

        const room = virtualIPManager.createRoom(streamId, hostId);

        res.json({
            success: true,
            room: {
                roomId: room.roomId,
                streamId: room.streamId,
                hostId: room.hostId,
                roomCode: room.roomCode,
                participantCount: room.participants.size,
                createdAt: room.createdAt,
                isActive: room.isActive
            }
        });
    } catch (error) {
        console.error('Erro ao criar sala virtual:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/virtual-room/join
 * Entrar em uma sala virtual
 */
router.post('/join', async (req, res) => {
    try {
        const { userId, roomId } = req.body;

        if (!userId || !roomId) {
            return res.status(400).json({
                error: 'Dados obrigatórios faltando: userId, roomId'
            });
        }

        const success = virtualIPManager.joinRoom(userId, roomId);

        if (!success) {
            return res.status(400).json({
                error: 'Não foi possível entrar na sala. Verifique se a sala existe e está ativa.'
            });
        }

        const room = virtualIPManager.getRoom(roomId);
        const user = virtualIPManager.getUser(userId);

        res.json({
            success: true,
            room: room ? {
                roomId: room.roomId,
                roomCode: room.roomCode,
                participantCount: room.participants.size,
                isActive: room.isActive
            } : null,
            userVirtualIP: user?.virtualIP
        });
    } catch (error) {
        console.error('Erro ao entrar na sala virtual:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/virtual-room/leave
 * Sair de uma sala virtual
 */
router.post('/leave', async (req, res) => {
    try {
        const { userId, roomId } = req.body;

        if (!userId || !roomId) {
            return res.status(400).json({
                error: 'Dados obrigatórios faltando: userId, roomId'
            });
        }

        const success = virtualIPManager.leaveRoom(userId, roomId);

        res.json({
            success,
            message: success ? 'Saída da sala realizada com sucesso' : 'Usuário não estava na sala'
        });
    } catch (error) {
        console.error('Erro ao sair da sala virtual:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/virtual-room/end
 * Encerra uma sala virtual
 */
router.post('/end', async (req, res) => {
    try {
        const { roomId } = req.body;

        if (!roomId) {
            return res.status(400).json({
                error: 'Dados obrigatórios faltando: roomId'
            });
        }

        virtualIPManager.endRoom(roomId);

        res.json({
            success: true,
            message: 'Sala encerrada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao encerrar sala virtual:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/virtual-room/:roomId
 * Obtém informações de uma sala
 */
router.get('/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = virtualIPManager.getRoom(roomId);

        if (!room) {
            return res.status(404).json({ error: 'Sala não encontrada' });
        }

        const participants = virtualIPManager.getRoomParticipants(roomId);

        res.json({
            success: true,
            room: {
                roomId: room.roomId,
                streamId: room.streamId,
                hostId: room.hostId,
                roomCode: room.roomCode,
                participantCount: room.participants.size,
                createdAt: room.createdAt,
                isActive: room.isActive,
                participants
            }
        });
    } catch (error) {
        console.error('Erro ao obter sala virtual:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/virtual-room/by-code/:roomCode
 * Obtém sala pelo código
 */
router.get('/by-code/:roomCode', async (req, res) => {
    try {
        const { roomCode } = req.params;
        const room = virtualIPManager.getRoomByCode(roomCode);

        if (!room) {
            return res.status(404).json({ error: 'Sala não encontrada' });
        }

        const participants = virtualIPManager.getRoomParticipants(room.roomId);

        res.json({
            success: true,
            room: {
                roomId: room.roomId,
                streamId: room.streamId,
                hostId: room.hostId,
                roomCode: room.roomCode,
                participantCount: room.participants.size,
                createdAt: room.createdAt,
                isActive: room.isActive,
                participants
            }
        });
    } catch (error) {
        console.error('Erro ao obter sala por código:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/virtual-room/by-stream/:streamId
 * Obtém sala pelo ID da transmissão
 */
router.get('/by-stream/:streamId', async (req, res) => {
    try {
        const { streamId } = req.params;
        const room = virtualIPManager.getRoomByStreamId(streamId);

        if (!room) {
            return res.status(404).json({ error: 'Sala não encontrada para esta transmissão' });
        }

        const participants = virtualIPManager.getRoomParticipants(room.roomId);

        res.json({
            success: true,
            room: {
                roomId: room.roomId,
                streamId: room.streamId,
                hostId: room.hostId,
                roomCode: room.roomCode,
                participantCount: room.participants.size,
                createdAt: room.createdAt,
                isActive: room.isActive,
                participants
            }
        });
    } catch (error) {
        console.error('Erro ao obter sala por stream:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/virtual-room/:roomId/participants
 * Lista participantes de uma sala com IPs virtuais
 */
router.get('/:roomId/participants', async (req, res) => {
    try {
        const { roomId } = req.params;
        const participants = virtualIPManager.getRoomParticipants(roomId);

        res.json({
            success: true,
            participants,
            count: participants.length
        });
    } catch (error) {
        console.error('Erro ao listar participantes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/virtual-system/stats
 * Obtém estatísticas do sistema
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = virtualIPManager.getStats();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/virtual-system/cleanup
 * Limpa usuários inativos
 */
router.post('/cleanup', async (req, res) => {
    try {
        virtualIPManager.cleanupInactiveUsers();

        res.json({
            success: true,
            message: 'Limpeza de usuários inativos realizada'
        });
    } catch (error) {
        console.error('Erro ao limpar usuários inativos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
