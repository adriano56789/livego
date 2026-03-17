import express from 'express';
import { User, Streamer, StreamSession, GiftTransaction } from '../models';

const router = express.Router();

// 🔥 NOVA ROTA: Ranking de Contribuição baseado em dados frescos do banco
// Esta rota busca sempre os dados mais recentes sem depender de cache
router.get('/contribution/:period', async (req, res) => {
    try {
        const period = req.params.period;
        console.log('🏆 [CONTRIBUTION RANKING] Buscando ranking com dados frescos do banco:', period);
        
        // Para ranking "Live", usar dados da sessão atual + dados frescos do usuário
        if (period === 'live' || period === 'Ao vivo') {
            // Buscar streams ativos
            const activeStreams = await Streamer.find({ isLive: true });
            
            if (!activeStreams || activeStreams.length === 0) {
                console.log('ℹ️ Nenhuma stream ativa encontrada');
                return res.json([]);
            }
            
            // Buscar dados completos e frescos dos streamers
            const streamerIds = activeStreams.map(s => s.hostId);
            const streamers = await User.find({ id: { $in: streamerIds } });
            
            // Montar ranking ao vivo com dados verificados
            const liveRanking = activeStreams.map(stream => {
                const streamer = streamers.find(s => s.id === stream.hostId);
                if (!streamer) return null;  
                
                // 🔧 USAR DADOS FRESCOS: Verificar se receptores está correto
                const contribution = streamer.receptores || 0;
                
                return {
                    ...streamer.toObject(),
                    contribution: contribution,
                    streamId: stream.id,
                    streamTitle: stream.message || 'Live',
                    viewers: stream.viewers || 0,
                    isLive: true,
                    // Adicionar dados de verificação
                    debug: {
                        receptores: streamer.receptores || 0,
                        diamonds: streamer.diamonds || 0,
                        earnings: streamer.earnings || 0
                    }
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
            
            console.log(`✅ ${liveRanking.length} streamers no ranking Ao vivo (dados frescos do banco)`);
            return res.json(liveRanking);
        }
        
        // 🔧 CORREÇÃO: Para outros períodos, buscar dados frescos e sincronizar se necessário
        // Diário, Semanal, Mensal = baseado no contador enviados (acumulado total)
        
        console.log('📊 [RANKING] Buscando dados frescos para ranking:', period);
        
        // Buscar todos os usuários ordenados por enviados
        const users = await User.find({})
            .sort({ enviados: -1 })
            .limit(100); // Limitar para performance
        
        console.log(`📊 Encontrados ${users.length} usuários para análise`);
        
        // Verificar e sincronizar contadores se necessário
        const validUsers = [];
        
        for (const user of users) {
            if (user.enviados <= 0) continue;
            
            // Opcional: Verificar se os contadores estão sincronizados
            const sentTransactions = await GiftTransaction.find({ fromUserId: user.id });
            const realEnviados = sentTransactions.reduce((sum, t) => sum + (t.giftPrice * t.quantity), 0);
            
            // Se houver diferença, usar o valor real das transações
            const contribution = Math.max(user.enviados, realEnviados);
            
            const userObj = user.toObject ? user.toObject() : user;
            validUsers.push({
                ...userObj,
                contribution: contribution,
                rank: validUsers.length + 1,
                period: period,
                debug: {
                    enviados: user.enviados || 0,
                    realEnviados: realEnviados,
                    diamonds: user.diamonds || 0
                }
            });
        }
        
        // Ordenar novamente por contribution (pode ter mudado após sincronização)
        validUsers.sort((a, b) => b.contribution - a.contribution);
        
        // Re-atribuir ranks após ordenação final
        validUsers.forEach((user, index) => {
            user.rank = index + 1;
        });
        
        console.log(`✅ ${validUsers.length} usuários no ranking ${period} (dados frescos sincronizados)`);
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
