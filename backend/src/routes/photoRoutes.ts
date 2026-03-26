import express, { Request, Response } from 'express';
const router = express.Router();
const Photo = require('../models/Photo');
import Like from '../models/Like';

// POST /api/photos/:id/like - Dar like em uma foto
router.post('/:id/like', async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId;
        const photoId = req.params.id;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Verificar se a foto existe
        let photo = await Photo.findOne({ id: photoId });
        
        // Se não existir e for uma foto de chat (ID começa com "chat_"), criar automaticamente
        if (!photo && photoId.startsWith('chat_')) {
            // Extrair URL da foto de chat se possível, ou usar URL padrão
            const photoUrl = req.body.photoUrl || `https://livego.store/uploads/chat/${photoId.replace('chat_', '')}.jpg`;
            
            photo = new Photo({
                id: photoId,
                userId: userId, // Usuário que está curtindo como dono inicial
                photoUrl: photoUrl,
                caption: 'Imagem compartilhada no chat',
                likes: 0,
                comments: 0,
                shares: 0,
                isPublic: true,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            await photo.save();
            console.log(`✅ Foto de chat criada automaticamente: ${photoId}`);
        }

        if (!photo) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        // Verificar se já deu like
        const existingLike = await Like.findOne({ userId, photoId });
        if (existingLike) {
            return res.status(400).json({ error: 'Already liked' });
        }

        // Criar novo like
        const like = new Like({
            userId,
            photoId,
            timestamp: new Date().toISOString()
        });

        await like.save();

        // Incrementar contador de likes da foto
        await Photo.updateOne(
            { id: photoId },
            { $inc: { likes: 1 } }
        );

        // Buscar foto atualizada para retornar likes corretos
        const updatedPhoto = await Photo.findOne({ id: photoId });

        res.json({ 
            success: true, 
            likes: updatedPhoto?.likes || 1,
            isLiked: true
        });

    } catch (error: any) {
        console.error('Error liking photo:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/photos/:id/like - Remover like de uma foto
router.delete('/:id/like', async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId;
        const photoId = req.params.id;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Verificar se o like existe
        const like = await Like.findOne({ userId, photoId });
        if (!like) {
            return res.status(404).json({ error: 'Like not found' });
        }

        // Remover like
        await Like.deleteOne({ userId, photoId });

        // Decrementar contador de likes da foto
        await Photo.updateOne(
            { id: photoId },
            { $inc: { likes: -1 } }
        );

        res.json({ 
            success: true, 
            liked: false
        });

    } catch (error: any) {
        console.error('Error unliking photo:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
