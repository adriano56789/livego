import express from 'express';
import { PurchaseRecord } from '../models';

const router = express.Router();

router.post('/withdrawal-method', async (req, res) => res.json({ success: true, user: {} as any }));
router.post('/withdraw', async (req, res) => res.json({ success: true, message: 'Requested' }));
router.get('/history', async (req, res) => {
    try {
        // Extrair userId do token JWT
        const token = req.headers.authorization?.replace('Bearer ', '');
        let userId: string | null = null;
        
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
            } catch {
                return res.status(401).json({ error: 'Unauthorized' });
            }
        }
        
        if (!userId) {
            return res.status(401).json({ error: 'User ID required' });
        }
        
        // Buscar histórico apenas do usuário específico
        const history = await PurchaseRecord.find({ 
            userId: userId,
            status: req.query.status as string 
        }).sort({ createdAt: -1 });
        
        res.json(history);
    } catch (error: any) {
        console.error('Error fetching purchase history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
