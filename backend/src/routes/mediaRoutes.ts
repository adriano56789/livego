import express from 'express';
import { User, UserPhoto, UserVideo, ProfileUpdate } from '../models';

const router = express.Router();

// Upload de foto do usuário
router.post('/users/:userId/photos', async (req, res) => {
    try {
        const { userId } = req.params;
        const { photoUrl, caption, tags, isPublic } = req.body;
        
        // Verificar se usuário existe
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Criar registro da foto
        const photo = await UserPhoto.create({
            id: `photo_${userId}_${Date.now()}`,
            userId,
            photoUrl,
            caption: caption || '',
            tags: tags || [],
            isPublic: isPublic !== false
        });
        
        // Atualizar avatar do usuário se for a primeira foto ou se marcado como avatar
        if (!user.avatarUrl || req.body.isAvatar) {
            await User.findOneAndUpdate(
                { id: userId },
                { avatarUrl: photoUrl }
            );
            
            // Registrar atualização de perfil
            await ProfileUpdate.create({
                id: `profile_update_${userId}_${Date.now()}`,
                userId,
                updateType: 'avatar',
                oldValue: user.avatarUrl,
                newValue: photoUrl,
                updateReason: 'Nova foto de perfil'
            });
        }
        
        res.json({ success: true, photo });
    } catch (error: any) {
        console.error('Erro ao fazer upload de foto:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload de vídeo do usuário
router.post('/users/:userId/videos', async (req, res) => {
    try {
        const { userId } = req.params;
        const { videoUrl, thumbnailUrl, title, description, duration, tags, isPublic } = req.body;
        
        // Verificar se usuário existe
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Criar registro do vídeo
        const video = await UserVideo.create({
            id: `video_${userId}_${Date.now()}`,
            userId,
            videoUrl,
            thumbnailUrl,
            title,
            description: description || '',
            duration,
            tags: tags || [],
            isPublic: isPublic !== false
        });
        
        res.json({ success: true, video });
    } catch (error: any) {
        console.error('Erro ao fazer upload de vídeo:', error);
        res.status(500).json({ error: error.message });
    }
});

// Buscar fotos de um usuário
router.get('/users/:userId/photos', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const photos = await UserPhoto.find({ 
            userId,
            isPublic: true 
        })
        .sort({ postedAt: -1 })
        .limit(Number(limit) * Number(page))
        .skip((Number(page) - 1) * Number(limit));
        
        const total = await UserPhoto.countDocuments({ 
            userId, 
            isPublic: true 
        });
        
        res.json({
            photos,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        console.error('Erro ao buscar fotos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Buscar vídeos de um usuário
router.get('/users/:userId/videos', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const videos = await UserVideo.find({ 
            userId,
            isPublic: true 
        })
        .sort({ postedAt: -1 })
        .limit(Number(limit) * Number(page))
        .skip((Number(page) - 1) * Number(limit));
        
        const total = await UserVideo.countDocuments({ 
            userId, 
            isPublic: true 
        });
        
        res.json({
            videos,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        console.error('Erro ao buscar vídeos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Atualizar perfil do usuário
router.put('/users/:userId/profile', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, avatarUrl, bio } = req.body;
        
        // Verificar se usuário existe
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Atualizar dados
        const updateData: any = {};
        const updates: any[] = [];
        
        if (name && name !== user.name) {
            updateData.name = name;
            updates.push({
                id: `profile_update_${userId}_${Date.now()}_1`,
                userId,
                updateType: 'info',
                oldValue: user.name,
                newValue: name,
                updateReason: 'Atualização de nome'
            });
        }
        
        if (avatarUrl && avatarUrl !== user.avatarUrl) {
            updateData.avatarUrl = avatarUrl;
            updates.push({
                id: `profile_update_${userId}_${Date.now()}_2`,
                userId,
                updateType: 'avatar',
                oldValue: user.avatarUrl,
                newValue: avatarUrl,
                updateReason: 'Atualização de avatar'
            });
        }
        
        if (bio && bio !== user.bio) {
            updateData.bio = bio;
            updates.push({
                id: `profile_update_${userId}_${Date.now()}_3`,
                userId,
                updateType: 'info',
                oldValue: user.bio,
                newValue: bio,
                updateReason: 'Atualização de bio'
            });
        }
        
        // Atualizar usuário
        await User.findOneAndUpdate({ id: userId }, updateData);
        
        // Salvar histórico de atualizações
        if (updates.length > 0) {
            await ProfileUpdate.insertMany(updates);
        }
        
        res.json({ success: true, updated: updateData });
    } catch (error: any) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ error: error.message });
    }
});

// Buscar histórico de atualizações do perfil
router.get('/users/:userId/profile-updates', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const updates = await ProfileUpdate.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(Number(limit) * Number(page))
        .skip((Number(page) - 1) * Number(limit));
        
        const total = await ProfileUpdate.countDocuments({ userId });
        
        res.json({
            updates,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        console.error('Erro ao buscar atualizações:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
