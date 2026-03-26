import express from 'express';
import { Streamer } from '../models';

const router = express.Router();

// POST /api/streams/:streamId/like - Adicionar curtida na transmissão
router.post('/streams/:streamId/like', async (req, res) => {
    try {
        const { streamId } = req.params;
        const userId = req.body.userId;

        if (!userId) {
            return res.status(400).json({ error: 'ID do usuário é obrigatório' });
        }

        // Verificar se a transmissão existe
        const streamer = await Streamer.findOne({ streamId });
        if (!streamer) {
            return res.status(404).json({ error: 'Transmissão não encontrada' });
        }

        // Incrementar contador de curtidas no banco de dados
        const currentLikes = streamer.likes || 0;
        const newLikes = currentLikes + 1;
        
        await Streamer.updateOne(
            { streamId },
            { $set: { likes: newLikes } }
        );

        // Emitir WebSocket para atualização em tempo real
        const io = req.app.get('io');
        if (io) {
            io.to(streamId).emit('stream_liked', {
                streamId,
                totalLikes: newLikes,
                userId: userId
            });
        }

        res.json({
            success: true,
            totalLikes: newLikes,
            message: 'Curtida registrada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao registrar curtida:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/streams/:streamId/likes - Obter contador de curtidas
router.get('/streams/:streamId/likes', async (req, res) => {
    try {
        const { streamId } = req.params;

        // Verificar se a transmissão existe
        const streamer = await Streamer.findOne({ streamId });
        if (!streamer) {
            return res.status(404).json({ error: 'Transmissão não encontrada' });
        }

        // Retornar contador de curtidas do banco de dados
        const totalLikes = streamer.likes || 0;

        res.json({
            streamId,
            totalLikes,
            isLive: streamer.isLive
        });

    } catch (error) {
        console.error('Erro ao obter curtidas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/streams/:streamId/likes/reset - Resetar contador (apenas para o streamer)
router.post('/streams/:streamId/likes/reset', async (req, res) => {
    try {
        const { streamId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'ID do usuário é obrigatório' });
        }

        // Verificar se o usuário é o dono da transmissão
        const streamer = await Streamer.findOne({ streamId, userId });
        if (!streamer) {
            return res.status(403).json({ error: 'Apenas o dono da transmissão pode resetar as curtidas' });
        }

        // Resetar contador no banco de dados
        await Streamer.updateOne(
            { streamId },
            { $set: { likes: 0 } }
        );

        // Emitir WebSocket para atualização em tempo real
        const io = req.app.get('io');
        if (io) {
            io.to(streamId).emit('stream_likes_reset', {
                streamId,
                totalLikes: 0
            });
        }

        res.json({
            success: true,
            totalLikes: 0,
            message: 'Contador de curtidas resetado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao resetar curtidas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
