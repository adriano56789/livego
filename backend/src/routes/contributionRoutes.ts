import express from 'express';
import { User, Streamer, StreamSession, GiftTransaction } from '../models';

const router = express.Router();

// 🔥 NOVA ROTA: Ranking de Contribuição baseado em contadores reais
// Esta rota substitui a lógica antiga que usava transações (com valores multiplicados)
router.get('/contribution/:period', async (req, res) => {
    try {
        const period = req.params.period;
        console.log('🏆 [CONTRIBUTION RANKING] Buscando ranking baseado em contadores reais:', period);
        
        // Para ranking "Live", usar dados da sessão atual + contadores
        if (period === 'live' || period === 'Ao vivo') {
            // Buscar streams ativos
            const activeStreams = await Streamer.find({ isLive: true });
            
            if (!activeStreams || activeStreams.length === 0) {
                console.log('ℹ️ Nenhuma stream ativa encontrada');
                return res.json([]);
            }
            
            // Buscar dados completos dos streamers
            const streamerIds = activeStreams.map(s => s.hostId);
            const streamers = await User.find({ id: { $in: streamerIds } });
            
            // Montar ranking ao vivo
            const liveRanking = activeStreams.map(stream => {
                const streamer = streamers.find(s => s.id === stream.hostId);
                if (!streamer) return null;  
                
                return {
                    ...streamer.toObject(),
                    contribution: streamer.receptores || 0, // 🔧 USAR RECEPTORES (valor real recebido)
                    streamId: stream.id,
                    streamTitle: stream.message || 'Live',
                    viewers: stream.viewers || 0,
                    isLive: true
                };
            }).filter(item => item !== null && item.contribution > 0);
            
            // Ordenar por maior contribuição
            liveRanking.sort((a, b) => (b?.contribution || 0) - (a?.contribution || 0));
            
            // Adicionar posição no ranking
            liveRanking.forEach((user, index) => {
                if (user) {
                    user.rank = index + 1;
                }
            });
            
            console.log(`✅ ${liveRanking.length} streamers no ranking Ao vivo (baseado em receptores)`);
            return res.json(liveRanking);
        }
        
        // 🔧 CORREÇÃO: Para outros períodos, usar contadores acumulados dos usuários
        // Diário, Semanal, Mensal = baseado no contador enviados (acumulado total)
        
        // Buscar todos os usuários ordenados por enviados
        const users = await User.find({})
            .sort({ enviados: -1 })
            .limit(100); // Limitar para performance
        
        console.log(`📊 Encontrados ${users.length} usuários para análise`);
        
        // Filtrar apenas usuários com enviados > 0
        const validUsers = users
            .filter(user => user.enviados > 0)
            .map((user, index) => {
                const userObj = user.toObject ? user.toObject() : user;
                return {
                    ...userObj,
                    contribution: user.enviados, // 🔧 USAR ENVIADOS (valor real enviado)
                    rank: index + 1,
                    period: period
                };
            });
        
        console.log(`✅ ${validUsers.length} usuários no ranking ${period} (baseado em enviados)`);
        res.json(validUsers);
        
    } catch (error: any) {
        console.error('❌ [CONTRIBUTION RANKING] Erro:', error);
        res.status(500).json({ error: error.message });
    }
});

// 🔄 ROTA para sincronizar contadores (se necessário)
router.post('/sync-counters/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log(`🔄 [SYNC] Sincronizando contadores do usuário ${userId}`);
        
        // Buscar usuário
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Calcular valores reais baseados em transações
        const sentTransactions = await GiftTransaction.find({ fromUserId: userId });
        const receivedTransactions = await GiftTransaction.find({ toUserId: userId });
        
        const realEnviados = sentTransactions.reduce((sum, t) => sum + (t.giftPrice * t.quantity), 0);
        const realReceptores = receivedTransactions.reduce((sum, t) => sum + (t.giftPrice * t.quantity), 0);
        
        // Atualizar contadores se estiverem incorretos
        const needsUpdate = user.enviados !== realEnviados || user.receptores !== realReceptores;
        
        if (needsUpdate) {
            user.enviados = realEnviados;
            user.receptores = realReceptores;
            user.earnings = realReceptores; // Manter earnings = receptores
            await user.save();
            
            console.log(`✅ [SYNC] Contadores atualizados: enviados=${realEnviados}, receptores=${realReceptores}`);
        } else {
            console.log(`ℹ️ [SYNC] Contadores já estão corretos`);
        }
        
        res.json({
            success: true,
            updated: needsUpdate,
            counters: {
                enviados: user.enviados,
                receptores: user.receptores,
                earnings: user.earnings
            }
        });
        
    } catch (error: any) {
        console.error('❌ [SYNC] Erro ao sincronizar contadores:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
