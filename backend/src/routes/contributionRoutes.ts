import express from 'express';
import { User, Streamer, GiftTransaction } from '../models';

const router = express.Router();

// 🔥 NOVA ROTA: Ranking de Contribuição baseado em dados frescos do banco
// Esta rota busca sempre os dados mais recentes sem depender de cache
router.get('/contribution/:period', async (req, res) => {
    try {
        const period = req.params.period;
        console.log('🏆 [CONTRIBUTION RANKING] Buscando ranking com dados frescos do banco:', period);
        
        // 🔧 CORREÇÃO: Para ranking "Live", usar transações de presentes em tempo real
        // Mostra quem está enviando presentes durante a live atual
        if (period === 'live' || period === 'Ao vivo') {
            // Buscar transações de presentes das últimas horas (tempo real)
            const now = new Date();
            const liveStartTime = new Date(now.getTime() - (2 * 60 * 60 * 1000)); // Últimas 2 horas
            
            // Buscar transações recentes de presentes
            const recentGifts = await GiftTransaction.find({
                createdAt: { $gte: liveStartTime.toISOString() }
            }).sort({ createdAt: -1 }).limit(100);
            
            console.log(`🎁 [LIVE RANKING] Encontradas ${recentGifts.length} transações recentes`);
            
            if (!recentGifts || recentGifts.length === 0) {
                console.log('ℹ️ Nenhuma transação recente encontrada para ranking ao vivo');
                return res.json([]);
            }
            
            // Agrupar por usuário que recebeu presentes (streamers)
            const streamerContributions = new Map<string, {
                totalValue: number;
                giftCount: number;
                streamerId: string;
                streamerName: string;
                lastGiftTime: Date;
                gifts: any[];
            }>();
            
            recentGifts.forEach((gift: any) => {
                const toUserId = gift.toUserId;
                
                if (!streamerContributions.has(toUserId)) {
                    streamerContributions.set(toUserId, {
                        totalValue: 0,
                        giftCount: 0,
                        streamerId: toUserId,
                        streamerName: gift.toUserName || 'Unknown',
                        lastGiftTime: gift.createdAt,
                        gifts: []
                    });
                }
                
                const contribution = streamerContributions.get(toUserId)!;
                contribution.totalValue += gift.totalValue || 0;
                contribution.giftCount += 1;
                contribution.lastGiftTime = new Date(gift.createdAt);
                contribution.gifts.push({
                    fromUser: gift.fromUserName,
                    giftName: gift.giftName,
                    giftPrice: gift.giftPrice,
                    quantity: gift.quantity,
                    totalValue: gift.totalValue,
                    timestamp: gift.createdAt
                });
            });
            
            // Converter para array e ordenar por maior contribuição
            const liveRanking = Array.from(streamerContributions.values())
                .sort((a, b) => b.totalValue - a.totalValue)
                .slice(0, 20); // Top 20
            
            // Buscar dados completos dos streamers
            const streamerIds = liveRanking.map(c => c.streamerId);
            const streamers = await User.find({ id: { $in: streamerIds } });
            
            // Verificar quais streamers estão ao vivo
            const activeStreams = await Streamer.find({ 
                hostId: { $in: streamerIds }, 
                isLive: true 
            });
            const liveStreamIds = new Set(activeStreams.map(s => s.hostId));
            
            // Montar ranking final
            const finalRanking = liveRanking.map((contrib, index) => {
                const streamer = streamers.find(s => s.id === contrib.streamerId);
                const isLive = liveStreamIds.has(contrib.streamerId);
                
                return {
                    id: contrib.streamerId,
                    name: contrib.streamerName,
                    avatarUrl: streamer?.avatarUrl || '',
                    contribution: contrib.totalValue,
                    rank: index + 1,
                    isLive: isLive,
                    giftCount: contrib.giftCount,
                    lastGiftTime: contrib.lastGiftTime,
                    recentGifts: contrib.gifts.slice(0, 5), // Últimos 5 presentes
                    debug: {
                        totalGifts: contrib.giftCount,
                        isCurrentlyLive: isLive,
                        lastActivity: contrib.lastGiftTime
                    }
                };
            });
            
            console.log(`✅ ${finalRanking.length} streamers no ranking Ao vivo (tempo real)`);
            console.log(`🔥 Streamers ativos: ${finalRanking.filter(r => r.isLive).length}`);
            
            return res.json(finalRanking);
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
