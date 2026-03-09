import express from 'express';
import { Frame, UserFrame, User } from '../models';

const router = express.Router();

// Listar todos os frames disponíveis
router.get('/frames', async (req, res) => {
    try {
        const frames = await Frame.find({ isActive: true });
        res.json(frames);
    } catch (error: any) {
        console.error('Erro ao buscar frames:', error);
        res.status(500).json({ error: error.message });
    }
});

// Comprar um frame
router.post('/frames/:frameId/purchase', async (req, res) => {
    try {
        const { frameId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Buscar frame da loja
        const frame = await Frame.findOne({ id: frameId, isActive: true });
        if (!frame) {
            return res.status(404).json({ error: 'Frame não encontrado' });
        }

        // Verificar se usuário já possui este frame ativo
        const existingActive = await UserFrame.findOne({ 
            userId, 
            frameId, 
            isActive: true,
            expirationDate: { $gt: new Date() }
        });
        if (existingActive) {
            return res.status(400).json({ error: 'Você já possui este frame ativo' });
        }

        // Verificar diamonds do usuário
        const user = await User.findOne({ id: userId });
        if (!user || user.diamonds < frame.price) {
            return res.status(400).json({ error: 'Diamonds insuficientes' });
        }

        // Deduzir diamonds
        user.diamonds -= frame.price;
        await user.save();

        // Calcular data de expiração
        const expirationDate = new Date(Date.now() + frame.duration * 24 * 60 * 60 * 1000);

        // Adicionar frame ao usuário
        const userFrame = await UserFrame.create({
            userId,
            frameId,
            purchaseDate: new Date(),
            expirationDate,
            isActive: true,
            isEquipped: false
        });

        res.json({ 
            success: true, 
            userFrame,
            userDiamonds: user.diamonds,
            expirationDate
        });

    } catch (error: any) {
        console.error('Erro ao comprar frame:', error);
        res.status(500).json({ error: error.message });
    }
});

// Listar frames do usuário
router.get('/frames/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Buscar frames do usuário que ainda não expiraram
        const userFrames = await UserFrame.find({ 
            userId, 
            isActive: true,
            expirationDate: { $gt: new Date() }
        }).populate('frameId');

        res.json(userFrames);
    } catch (error: any) {
        console.error('Erro ao buscar frames do usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// Equipar um frame
router.post('/frames/:frameId/equip', async (req, res) => {
    try {
        const { frameId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Verificar se frame pertence ao usuário e está ativo
        const userFrame = await UserFrame.findOne({ 
            userId, 
            frameId,
            isActive: true,
            expirationDate: { $gt: new Date() }
        });

        if (!userFrame) {
            return res.status(404).json({ error: 'Frame não encontrado ou expirado' });
        }

        // Desmarcar todos os outros frames como equipados
        await UserFrame.updateMany(
            { userId, isActive: true },
            { isEquipped: false }
        );

        // Marcar este frame como equipado
        userFrame.isEquipped = true;
        await userFrame.save();

        // Atualizar activeFrameId do usuário
        await User.findOneAndUpdate(
            { id: userId },
            { activeFrameId: frameId }
        );

        res.json({ 
            success: true, 
            equippedFrame: userFrame,
            message: 'Frame equipado com sucesso'
        });

    } catch (error: any) {
        console.error('Erro ao equipar frame:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obter frame equipado atual
router.get('/frames/current/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const currentFrame = await UserFrame.findOne({ 
            userId, 
            isActive: true, 
            isEquipped: true,
            expirationDate: { $gt: new Date() }
        }).populate('frameId');

        res.json(currentFrame);
    } catch (error: any) {
        console.error('Erro ao buscar frame atual:', error);
        res.status(500).json({ error: error.message });
    }
});

// Limpar frames expirados (pode ser chamado por um cron job)
router.post('/frames/cleanup-expired', async (req, res) => {
    try {
        const result = await UserFrame.updateMany(
            { 
                isActive: true,
                expirationDate: { $lte: new Date() }
            },
            { isActive: false }
        );

        res.json({ 
            success: true, 
            expiredFrames: result.modifiedCount 
        });
    } catch (error: any) {
        console.error('Erro ao limpar frames expirados:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
