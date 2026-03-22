import express, { Request, Response } from 'express';
import { ZoomSettings } from '../models';

const router = express.Router();

// Obter configurações de zoom do usuário
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        
        let zoomSettings = await ZoomSettings.findOne({ userId });
        
        if (!zoomSettings) {
            // Criar configuração padrão se não existir
            zoomSettings = await ZoomSettings.create({
                userId,
                zoomLevel: 100,
                isDefault: true
            });
        }

        res.json(zoomSettings);
    } catch (error: any) {
        console.error('Erro ao buscar configurações de zoom:', error);
        res.status(500).json({ error: error.message });
    }
});

// Atualizar configurações de zoom do usuário
router.put('/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { zoomLevel } = req.body;

        // Validar o nível de zoom
        if (zoomLevel < 50 || zoomLevel > 150) {
            return res.status(400).json({ error: 'Nível de zoom deve estar entre 50 e 150' });
        }

        const zoomSettings = await ZoomSettings.findOneAndUpdate(
            { userId },
            { 
                zoomLevel,
                isDefault: false,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ 
            success: true, 
            zoomSettings,
            message: 'Configurações de zoom atualizadas com sucesso'
        });

    } catch (error: any) {
        console.error('Erro ao atualizar configurações de zoom:', error);
        res.status(500).json({ error: error.message });
    }
});

// Resetar zoom para o padrão
router.post('/user/:userId/reset', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const zoomSettings = await ZoomSettings.findOneAndUpdate(
            { userId },
            { 
                zoomLevel: 100,
                isDefault: true,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ 
            success: true, 
            zoomSettings,
            message: 'Zoom resetado para o padrão (100%)'
        });

    } catch (error: any) {
        console.error('Erro ao resetar zoom:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
