import express from 'express';
import { ProfilePhoto, User, Streamer } from '../models/index';

const router = express.Router();

// GET /api/users/:userId/photos/avatar - Buscar avatar principal
router.get('/:userId/photos/avatar', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log(`🔍 Buscando avatar principal para usuário: ${userId}`);

        const avatar = await ProfilePhoto.findOne({ 
            userId, 
            photoType: 'avatar', 
            isMain: true, 
            isActive: true 
        });

        if (!avatar) {
            return res.status(404).json({ 
                success: false,
                error: 'Avatar não encontrado' 
            });
        }

        res.json({
            success: true,
            data: {
                id: avatar.id,
                photoUrl: avatar.photoUrl,
                isMain: avatar.isMain,
                metadata: avatar.metadata,
                createdAt: avatar.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar avatar:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao buscar avatar',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// GET /api/users/:userId/photos/cover - Buscar capa do perfil
router.get('/:userId/photos/cover', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log(`🔍 Buscando capa para usuário: ${userId}`);

        const cover = await ProfilePhoto.findOne({ 
            userId, 
            photoType: 'cover', 
            isActive: true 
        });

        if (!cover) {
            return res.status(404).json({ 
                success: false,
                error: 'Capa não encontrada' 
            });
        }

        res.json({
            success: true,
            data: {
                id: cover.id,
                photoUrl: cover.photoUrl,
                metadata: cover.metadata,
                createdAt: cover.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar capa:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao buscar capa',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// GET /api/users/:userId/photos/gallery - Buscar galeria completa
router.get('/:userId/photos/gallery', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log(`🔍 Buscando galeria para usuário: ${userId}`);

        const gallery = await ProfilePhoto.find({ 
            userId, 
            photoType: 'gallery', 
            isActive: true 
        }).sort({ order: 1 });

        res.json({
            success: true,
            data: gallery.map(photo => ({
                id: photo.id,
                photoUrl: photo.photoUrl,
                order: photo.order,
                metadata: photo.metadata,
                createdAt: photo.createdAt
            }))
        });

    } catch (error) {
        console.error('❌ Erro ao buscar galeria:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao buscar galeria',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// GET /api/users/:userId/photos - Buscar todas as fotos do usuário
router.get('/:userId/photos', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log(`🔍 Buscando todas as fotos para usuário: ${userId}`);

        const photos = await ProfilePhoto.find({ 
            userId, 
            isActive: true 
        }).sort({ createdAt: -1 });

        // Organizar por tipo
        const avatar = photos.find(p => p.photoType === 'avatar' && p.isMain);
        const cover = photos.find(p => p.photoType === 'cover');
        const gallery = photos.filter(p => p.photoType === 'gallery');

        res.json({
            success: true,
            data: {
                avatar: avatar ? {
                    id: avatar.id,
                    photoUrl: avatar.photoUrl,
                    isMain: avatar.isMain,
                    metadata: avatar.metadata
                } : null,
                cover: cover ? {
                    id: cover.id,
                    photoUrl: cover.photoUrl,
                    metadata: cover.metadata
                } : null,
                gallery: gallery.map(photo => ({
                    id: photo.id,
                    photoUrl: photo.photoUrl,
                    order: photo.order,
                    metadata: photo.metadata
                }))
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar fotos:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao buscar fotos',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// POST /api/users/:userId/photos - Adicionar nova foto
router.post('/:userId/photos', async (req, res) => {
    try {
        const { userId } = req.params;
        const { photoUrl, photoType, order = 0, metadata } = req.body;

        if (!photoUrl || !photoType) {
            return res.status(400).json({ 
                success: false,
                error: 'photoUrl e photoType são obrigatórios' 
            });
        }

        console.log(`📸 Adicionando foto para usuário ${userId}: ${photoType}`);

        // Se for avatar, remover o status principal dos outros avatares
        if (photoType === 'avatar') {
            await ProfilePhoto.updateMany(
                { userId, photoType: 'avatar', isMain: true },
                { isMain: false }
            );
        }

        const newPhoto = await ProfilePhoto.create({
            id: `profile_${photoType}_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            photoUrl,
            photoType,
            isMain: photoType === 'avatar',
            order,
            metadata: metadata || {
                originalName: `photo_${Date.now()}.jpg`,
                size: 0,
                mimeType: 'image/jpeg',
                uploadedAt: new Date()
            }
        });

        console.log(`✅ Foto criada: ${newPhoto.id}`);

        res.status(201).json({
            success: true,
            data: newPhoto,
            message: 'Foto adicionada com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao adicionar foto:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao adicionar foto',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// PUT /api/users/:userId/photos/:id/set-main - Definir foto como avatar principal
router.put('/:userId/photos/:id/set-main', async (req, res) => {
    try {
        const { userId, id } = req.params;

        console.log(`👤 Definindo foto ${id} como avatar principal do usuário ${userId}`);

        // Verificar se a foto existe e pertence ao usuário
        const photo = await ProfilePhoto.findOne({ id, userId, photoType: 'avatar' });

        if (!photo) {
            return res.status(404).json({ 
                success: false,
                error: 'Foto não encontrada' 
            });
        }

        // Remover status principal de outros avatares
        await ProfilePhoto.updateMany(
            { userId, photoType: 'avatar', isMain: true },
            { isMain: false }
        );

        // Definir esta foto como principal
        const updatedPhoto = await ProfilePhoto.findOneAndUpdate(
            { id },
            { isMain: true, updatedAt: new Date() },
            { new: true }
        );

        if (updatedPhoto) {
            await User.findOneAndUpdate(
                { id: userId },
                { avatarUrl: updatedPhoto.photoUrl, updatedAt: new Date() }
            );
            console.log(`✅ Avatar do usuário atualizado: ${updatedPhoto.photoUrl}`);

            // Sincronizar avatar com streams ativas do usuário
            await Streamer.updateMany(
                { hostId: userId },
                { 
                    avatar: updatedPhoto.photoUrl,
                    updatedAt: new Date()
                }
            );
            console.log(`✅ Avatar sincronizado com streams do usuário: ${userId}`);
        }

        console.log(`✅ Foto ${id} definida como avatar principal`);

        res.json({
            success: true,
            message: 'Avatar principal atualizado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao definir avatar principal:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao definir avatar principal',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// PUT /api/users/:userId/photos/:id/order - Atualizar ordem da foto na galeria
router.put('/:userId/photos/:id/order', async (req, res) => {
    try {
        const { userId, id } = req.params;
        const { order } = req.body;

        if (order === undefined || order < 0) {
            return res.status(400).json({ 
                success: false,
                error: 'order é obrigatório e deve ser >= 0' 
            });
        }

        console.log(`🔄 Atualizando ordem da foto ${id} para ${order}`);

        const photo = await ProfilePhoto.findOneAndUpdate(
            { id, userId, photoType: 'gallery' },
            { order, updatedAt: new Date() },
            { new: true }
        );

        if (!photo) {
            return res.status(404).json({ 
                success: false,
                error: 'Foto não encontrada na galeria' 
            });
        }

        console.log(`✅ Ordem atualizada: ${photo.id} -> ${order}`);

        res.json({
            success: true,
            data: photo,
            message: 'Ordem atualizada com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar ordem:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao atualizar ordem',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

// DELETE /api/users/:userId/photos/:id - Remover foto
router.delete('/:userId/photos/:id', async (req, res) => {
    try {
        const { userId, id } = req.params;

        console.log(`🗑️ Removendo foto ${id} do usuário ${userId}`);

        const photo = await ProfilePhoto.findOne({ id, userId });

        if (!photo) {
            return res.status(404).json({ 
                success: false,
                error: 'Foto não encontrada' 
            });
        }

        // Soft delete - marcar como inativa em vez de remover
        await ProfilePhoto.findOneAndUpdate(
            { id },
            { isActive: false, updatedAt: new Date() }
        );

        console.log(`✅ Foto ${id} removida (soft delete)`);

        res.json({
            success: true,
            message: 'Foto removida com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao remover foto:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao remover foto',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

export default router;
