import express from 'express';
import { UserSearchService } from '../services/UserSearchService';

const router = express.Router();

// @route GET /api/search/users?q=termo&limit=20
// Buscar usuários por ID ou nome
router.get('/users', async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;
        
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ 
                error: 'Parâmetro de busca "q" é obrigatório' 
            });
        }

        const results = await UserSearchService.searchUsers(q, parseInt(limit as string));
        
        res.json({
            success: true,
            query: q,
            count: results.length,
            users: results
        });
    } catch (error: any) {
        console.error('Erro na busca de usuários:', error);
        res.status(500).json({ 
            error: 'Erro interno na busca de usuários' 
        });
    }
});

// @route POST /api/search/sync
// Sincronizar manualmente todos os usuários (admin)
router.post('/sync', async (req, res) => {
    try {
        await UserSearchService.syncAllUsers();
        res.json({ 
            success: true, 
            message: 'Sincronização iniciada com sucesso' 
        });
    } catch (error: any) {
        console.error('Erro na sincronização:', error);
        res.status(500).json({ 
            error: 'Erro na sincronização' 
        });
    }
});

// @route POST /api/search/cleanup
// Limpar usuários inativos do índice (admin)
router.post('/cleanup', async (req, res) => {
    try {
        await UserSearchService.cleanupInactiveUsers();
        res.json({ 
            success: true, 
            message: 'Limpeza concluída com sucesso' 
        });
    } catch (error: any) {
        console.error('Erro na limpeza:', error);
        res.status(500).json({ 
            error: 'Erro na limpeza' 
        });
    }
});

// @route GET /api/search/stats
// Estatísticas do índice de busca
router.get('/stats', async (req, res) => {
    try {
        const { UserIndex } = await import('../models');
        
        const totalUsers = await UserIndex.countDocuments({ isActive: true });
        const inactiveUsers = await UserIndex.countDocuments({ isActive: false });
        
        res.json({
            success: true,
            stats: {
                totalActiveUsers: totalUsers,
                totalInactiveUsers: inactiveUsers,
                totalUsers: totalUsers + inactiveUsers
            }
        });
    } catch (error: any) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar estatísticas' 
        });
    }
});

export default router;
