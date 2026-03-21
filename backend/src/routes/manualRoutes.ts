import express from 'express';
import { ManualTransmissao } from '../models';

const router = express.Router();

// GET /api/manual-transmissao - Buscar manual completo
router.get('/manual-transmissao', async (req, res) => {
    try {
        console.log('🔍 [MANUAL_API] Requisição recebida para /manual-transmissao');
        console.log('📋 [MANUAL_API] Headers:', req.headers);
        console.log('🌐 [MANUAL_API] IP:', req.ip);
        
        // Buscar manual mais recente
        const manual = await ManualTransmissao.findOne().sort({ createdAt: -1 });
        
        if (!manual) {
            console.log('❌ [MANUAL_API] Nenhum manual encontrado');
            return res.status(404).json({ 
                error: 'Manual não encontrado',
                message: 'Nenhum manual de transmissão está disponível no momento.'
            });
        }
        
        console.log('✅ [MANUAL_API] Manual encontrado:', manual.titulo);
        console.log('📚 [MANUAL_API] Seções:', manual.secoes.length);
        
        // Estrutura de resposta esperada pelo frontend
        const responseData = {
            success: true,
            data: {
                titulo: manual.titulo,
                secoes: manual.secoes
            }
        };
        
        console.log('📤 [MANUAL_API] Enviando manual com', manual.secoes.length, 'seções');
        res.json(responseData);
        
    } catch (error: any) {
        console.error('❌ [MANUAL_API] Erro ao buscar manual:', error);
        res.status(500).json({ 
            error: error.message,
            message: 'Erro interno ao buscar manual de transmissão'
        });
    }
});

export default router;
