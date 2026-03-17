import express from 'express';
import { User, Streamer } from '../models';

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
                
                // 🔧 USAR DADOS DA STREAM: Diamantes da transmissão atual
                const contribution = stream.diamonds || 0;
                
                return {
                    ...streamer.toObject(),
                    contribution: contribution,
                    streamId: stream.id,
                    streamTitle: stream.message || 'Live',
                    viewers: stream.viewers || 0,
                    isLive: true,
                    // Adicionar dados de verificação
                    debug: {
                        streamDiamonds: stream.diamonds || 0,
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
        
        // 🔧 CORREÇÃO: Para outros períodos, usar contadores de diamantes (não transações)
        // Diamantes são apenas números, não transações complexas
        
        console.log('📊 [RANKING] Buscando ranking por período:', period);
        
        // Buscar todos os usuários que têm diamantes
        const users = await User.find({
            $or: [
                { diamonds: { $gt: 0 } },
                { receptores: { $gt: 0 } }
            ]
        });
        
        console.log(`👤 [RANKING] Encontrados ${users.length} usuários com diamantes`);
        
        // Montar ranking baseado em contadores de diamantes
        const validUsers = users.map(user => {
            const userObj = user.toObject ? user.toObject() : user;
            
            // Usar receptores para ranking (diamantes recebidos)
            const contribution = user.receptores || 0;
            
            return {
                ...userObj,
                contribution: contribution,
                rank: 0, // Será atribuído após ordenação
                period: period,
                debug: {
                    diamonds: user.diamonds || 0,
                    receptores: user.receptores || 0,
                    enviados: user.enviados || 0
                }
            };
        }).filter(user => user.contribution > 0);
        
        // Ordenar por contribution (maior para menor)
        validUsers.sort((a, b) => b.contribution - a.contribution);
        
        // Atribuir ranks
        validUsers.forEach((user, index) => {
            user.rank = index + 1;
        });
        
        console.log(`✅ ${validUsers.length} usuários no ranking ${period} (contadores de diamantes)`);
        console.log(`📊 [RANKING] Top 3 do período:`);
        validUsers.slice(0, 3).forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.name}: ${user.contribution} diamantes`);
        });
        
        res.json(validUsers);
        
    } catch (error: any) {
        console.error('❌ [CONTRIBUTION RANKING] Erro:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
