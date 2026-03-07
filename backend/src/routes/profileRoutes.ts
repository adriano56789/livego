import express from 'express';
import { User, Photo } from '../models';

const router = express.Router();

// Middleware para extrair usuário do token JWT
const getCurrentUserId = (req: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    
    try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.id;
    } catch {
        return null;
    }
};

router.get('/imagens', async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const photos = await Photo.find({ userId }).sort({ createdAt: -1 });
        
        // Converter Photo[] para Obra[] (formato que frontend espera)
        const obras = photos.map(photo => ({
            id: photo.id,
            url: photo.url
        }));
        
        res.json(obras);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/imagens/:id', async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        console.log(`🗑️ Tentando deletar foto ${req.params.id} do usuário ${userId}`);
        
        // Usar 'id' em vez de '_id' para compatibilidade com frontend
        const photo = await Photo.findOneAndDelete({ id: req.params.id, userId });
        if (!photo) {
            console.log(`❌ Foto não encontrada: ${req.params.id}`);
            return res.status(404).json({ error: 'Photo not found' });
        }
        
        console.log(`✅ Foto deletada: ${photo.id}`);
        res.json({ success: true });
    } catch (error: any) {
        console.error('❌ Erro ao deletar foto:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/imagens/ordenar', async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { orderedIds } = req.body;
        
        console.log(`🔄 Ordenando fotos: ${orderedIds.join(', ')}`);
        
        // Update order of photos - usar 'id' em vez de '_id'
        const updatePromises = orderedIds.map((photoId: string, index: number) => 
            Photo.findOneAndUpdate(
                { id: photoId, userId },
                { order: index },
                { new: true }
            )
        );
        
        const updatedPhotos = await Promise.all(updatePromises);
        console.log(`✅ ${updatedPhotos.length} fotos ordenadas`);
        res.json({ success: true, images: updatedPhotos });
    } catch (error: any) {
        console.error('❌ Erro ao ordenar fotos:', error);
        res.status(500).json({ error: error.message });
    }
});

const singleValueRoutes = [
    { route: 'apelido', field: 'name' },
    { route: 'genero', field: 'gender' },
    { route: 'aniversario', field: 'birthday' },
    { route: 'apresentacao', field: 'bio' },
    { route: 'residencia', field: 'residence' },
    { route: 'estado-emocional', field: 'emotional_status' },
    { route: 'tags', field: 'tags' },
    { route: 'profissao', field: 'profession' }
];

singleValueRoutes.forEach(({ route, field }) => {
    router.get(`/${route}`, async (req, res) => {
        try {
            const userId = getCurrentUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const user = await User.findOne({ id: userId });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ value: (user as any)[field] || '' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put(`/${route}`, async (req, res) => {
        try {
            const userId = getCurrentUserId(req);
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const { value } = req.body;
            const user = await User.findOneAndUpdate(
                { id: userId }, 
                { [field]: value }, 
                { new: true }
            );
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ success: true, user });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });
});

export default router;
