import express from 'express';
import { Streamer, User, Gift, GiftTransaction } from '../models';

const router = express.Router();

router.get('/live/:category', async (req, res) => {
    try {
        const { category } = req.params;
        
        // Se for "global" ou "popular", retorna todas as lives ativas E válidas
        if (category === 'global' || category === 'popular') {
            const streams = await Streamer.find({ 
                isLive: true,
                name: { $exists: true, $nin: ['', null] },
                hostId: { $exists: true, $nin: ['', null] },
                avatar: { $exists: true, $nin: ['', null] }
            }).sort({ viewers: -1 });
            return res.json(streams);
        }
        
        // Para categorias específicas, filtra por tag ou categoria E valida dados
        const categoryStreams = await Streamer.find({ 
            isLive: true,
            name: { $exists: true, $nin: ['', null] },
            hostId: { $exists: true, $nin: ['', null] },
            avatar: { $exists: true, $nin: ['', null] },
            $or: [
                { category: category.toLowerCase() },
                { tags: { $in: [category.toLowerCase()] } }
            ]
        }).sort({ viewers: -1 });
        
        res.json(categoryStreams);
    } catch (error: any) {
        console.error('Error fetching streams:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para buscar streams por região
router.get('/streams', async (req, res) => {
    try {
        const { region, country } = req.query;
        
        let filter: any = { 
            isLive: true,
            name: { $exists: true, $nin: ['', null] },
            hostId: { $exists: true, $nin: ['', null] },
            avatar: { $exists: true, $nin: ['', null] }
        };
        
        // Filtrar por região/país se especificado
        if (region && region !== 'ICON_GLOBE') {
            filter.country = region;
        } else if (country && country !== 'ICON_GLOBE') {
            filter.country = country;
        }
        
        const streams = await Streamer.find(filter).sort({ viewers: -1 });
        res.json(streams);
    } catch (error: any) {
        console.error('Error fetching streams by region:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/streams', async (req, res) => {
    try {
        const { name, hostId, country, location, ...otherData } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Stream name is required' });
        }
        
        const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const finalHostId = hostId || '10755083';
        
        // Buscar usuário para obter avatarUrl
        const user = await User.findOne({ id: finalHostId });
        const userAvatar = user?.avatarUrl || '';
        
        // Criar URLs de avatar realistas usando picsum
        const avatarUrl = userAvatar || `https://picsum.photos/200/200?random=${streamId}`;
        const coverUrl = `https://picsum.photos/800/400?random=${streamId}_cover`;
        
        // Usar país/localização enviada ou padrão Brasil
        const finalCountry = country || 'br';
        const finalLocation = location || 'Brasil';
        
        const stream = await Streamer.create({
            id: streamId,
            hostId: finalHostId,
            name: name.trim(),
            avatar: avatarUrl,
            location: finalLocation,
            time: 'Live Now',
            message: `Ao vivo: ${name.trim()}`,
            tags: ['live'],
            isHot: false,
            icon: '',
            country: finalCountry,
            viewers: 0,
            isPrivate: false,
            quality: '720p',
            demoVideoUrl: '',
            rtmpIngestUrl: `rtmp://livego.store:1935/live/${streamId}`,
            srtIngestUrl: '',
            streamKey: streamId,
            playbackUrl: `http://livego.store:8080/live/${streamId}.flv`,
            isLive: true,
            startTime: new Date().toISOString(),
            category: 'general',
            language: 'pt',
            maxViewers: 1000,
            recordingEnabled: false,
            chatEnabled: true,
            giftsEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            __v: 0,
            duration: 0,
            thumbnail: '',
            previewUrl: '',
            streamStatus: 'active',
            bitrate: '2000k',
            fps: 30,
            resolution: '1280x720',
            audioCodec: 'AAC',
            videoCodec: 'H264',
            latency: 'low',
            dvrEnabled: false,
            autoRecord: false,
            allowComments: true,
            allowGifts: true,
            allowFollowers: true,
            monetization: true,
            ageRestriction: false,
            geoRestriction: [],
            streamPassword: '',
            streamType: 'public',
            sourceType: 'rtmp',
            ingestStatus: 'ready',
            viewerCount: 0,
            peakViewers: 0,
            averageViewers: 0,
            totalViews: 0,
            likes: 0,
            shares: 0,
            bookmarks: 0,
            streamHealth: 'good',
            networkQuality: 'excellent',
            cpuUsage: 0,
            memoryUsage: 0,
            bandwidthUsage: 0,
            storageUsed: 0,
            maxDuration: 480,
            autoStop: false,
            scheduleEnabled: false,
            scheduledStart: null,
            scheduledEnd: null,
            repeatEnabled: false,
            repeatDays: [],
            streamTitle: name.trim(),
            streamDescription: `Ao vivo: ${name.trim()}`,
            streamTags: ['live', 'streaming'],
            categoryTags: ['general'],
            languageTags: ['pt', 'portuguese'],
            qualitySettings: {
                auto: true,
                videoQuality: '720p',
                bitrate: '2000k',
                fps: 30,
                keyframeInterval: 2
            },
            privacySettings: {
                isPrivate: false,
                allowEmbed: true,
                allowDownload: false,
                ageRestriction: false,
                geoRestriction: []
            },
            monetizationSettings: {
                enabled: true,
                allowDonations: true,
                allowSubscriptions: true,
                allowAds: true,
                currency: 'BRL'
            },
            interactionSettings: {
                allowChat: true,
                allowGifts: true,
                allowReactions: true,
                allowPolls: true,
                allowQa: true
            },
            technicalSettings: {
                dvrEnabled: false,
                autoRecord: false,
                lowLatency: true,
                adaptiveBitrate: true,
                redundancy: false
            },
            ...otherData
        });
        
        res.json(stream);
    } catch (error: any) {
        console.error('Error creating stream:', error);
        res.status(500).json({ error: error.message });
    }
});
router.put('/streams/:id', async (req, res) => {
    const stream = await Streamer.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(stream);
});
router.patch('/streams/:id', async (req, res) => {
    const stream = await Streamer.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, stream });
});
router.post('/streams/:id/save', async (req, res) => {
    try {
        const stream = await Streamer.findOneAndUpdate(
            { id: req.params.id }, 
            req.body, 
            { new: true }
        );
        
        if (!stream) {
            return res.status(404).json({ success: false, error: 'Stream not found' });
        }
        
        res.json({ success: true, stream });
    } catch (error: any) {
        console.error('Error saving stream:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/streams/:id/cover', async (req, res) => {
    try {
        const { coverUrl } = req.body;
        
        if (!coverUrl) {
            return res.status(400).json({ error: 'Cover URL is required' });
        }
        
        const stream = await Streamer.findOneAndUpdate(
            { id: req.params.id },
            { avatar: coverUrl },
            { new: true }
        );
        
        if (!stream) {
            return res.status(404).json({ success: false, error: 'Stream not found' });
        }
        
        res.json({ success: true, stream });
    } catch (error: any) {
        console.error('Error updating stream cover:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/streams/manual', async (req, res) => res.json([]));
router.get('/streams/effects', async (req, res) => res.json({}));
// Função para limpar usuários inativos (marcar como offline)
const cleanupInactiveUsers = async () => {
    try {
        const models = await import('../models');
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        // Buscar streams ativas para não remover usuários que estão em streams
        const activeStreams = await models.Streamer.find({ isLive: true });
        const activeStreamIds = activeStreams.map(stream => stream.id);
        
        // Marcar como offline apenas usuários que:
        // 1. Não têm lastSeen recente E não estão em nenhuma stream ativa
        // 2. OU têm lastSeen antigo E não estão em nenhuma stream ativa
        const result = await models.User.updateMany(
            {
                $and: [
                    {
                        $or: [
                            { lastSeen: { $lt: fiveMinutesAgo.toISOString() } },
                            { lastSeen: { $exists: false } }
                        ]
                    },
                    {
                        $or: [
                            { currentStreamId: { $exists: false } },
                            { currentStreamId: null },
                            { currentStreamId: { $nin: activeStreamIds } }
                        ]
                    }
                ]
            },
            { isOnline: false }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`🧹 Limpeza de usuários inativos: ${result.modifiedCount} usuários marcados como offline`);
        }
    } catch (error) {
        console.error('❌ Erro na limpeza de usuários inativos:', error);
    }
};

// Executar limpeza a cada 5 minutos (TEMPORARIAMENTE DESABILITADO PARA TESTE)
// setInterval(cleanupInactiveUsers, 5 * 60 * 1000);
console.log('🔧 Cleanup automático desabilitado para testes');

// ROTA DESABILITADA - Parar polling repetitivo de usuários online
// Usar apenas WebSocket para atualizações em tempo real
router.get('/streams/:id/online-users', async (req, res) => {
    console.warn('🚫 Rota /streams/:id/online-users DESABILITADA - use WebSocket');
    return res.json([]);
});
// Rota para atualizar status online do usuário
// Rota para quando usuário entra na stream
router.post('/streams/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        const streamId = req.params.id;
        
        console.log(`👤 Usuário ${userId} entrando na stream ${streamId} via HTTP`);
        
        if (!userId || !streamId) {
            console.warn('⚠️ Dados inválidos:', { userId, streamId });
            return res.status(400).json({ success: false, error: 'Dados inválidos' });
        }
        
        const models = await import('../models');
        
        // Verificar se o usuário existe no banco
        const user = await models.User.findOne({ id: userId });
        if (!user) {
            console.warn(`⚠️ Usuário ${userId} não encontrado no banco`);
            return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
        }
        
        // Verificar se a stream existe e está ativa
        const stream = await models.Streamer.findOne({ id: streamId, isLive: true });
        if (!stream) {
            console.warn(`⚠️ Stream ${streamId} não encontrada ou não está ativa`);
            return res.status(404).json({ success: false, error: 'Stream não encontrada' });
        }
        
        // VERIFICAÇÃO CRÍTICA: Se usuário já está online na mesma stream, não fazer nada
        if (user.isOnline && user.currentStreamId === streamId) {
            console.warn(`🛑 USUÁRIO ${userId} JÁ ESTÁ ONLINE NA STREAM ${streamId} - IGNORANDO CHAMADA DUPLICADA`);
            return res.json({ success: true, message: 'Usuário já está online nesta stream', user });
        }
        
        // Marcar usuário como online e na stream atual
        const updatedUser = await models.User.findOneAndUpdate(
            { id: userId }, 
            { 
                isOnline: true,
                currentStreamId: streamId,
                lastSeen: new Date().toISOString()
            },
            { new: true }
        );
        
        if (!updatedUser) {
            console.warn(`⚠️ Falha ao atualizar usuário ${userId}`);
            return res.status(500).json({ success: false, error: 'Falha ao atualizar usuário' });
        }
        
        console.log(`✅ Usuário ${userId} (${updatedUser?.name || 'desconhecido'}) marcado como online na stream ${streamId}`);
        
        res.json({ 
            success: true, 
            user: {
                id: updatedUser?.id || userId,
                name: updatedUser?.name || 'Usuário',
                avatarUrl: updatedUser?.avatarUrl || '',
                level: updatedUser?.level || 1,
                identification: updatedUser?.identification || updatedUser?.id || userId
            }
        });
    } catch (error: any) {
        console.error('❌ Erro ao entrar na stream:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota para quando usuário sai da stream - DESABILITADA para evitar loops
// router.post('/streams/:id/leave', async (req, res) => {
//     try {
//         const { userId } = req.body;
//         const streamId = req.params.id;
//         
//         console.log(`👤 Usuário ${userId} saindo da stream ${streamId}`);
//         
//         if (!userId || !streamId) {
//             console.warn('⚠️ Dados inválidos:', { userId, streamId });
//             return res.status(400).json({ success: false, error: 'Dados inválidos' });
//         }
//         
//         const models = await import('../models');
//         
//         // Verificar se o usuário existe
//         const user = await models.User.findOne({ id: userId });
//         if (!user) {
//             console.warn(`⚠️ Usuário ${userId} não encontrado no banco`);
//             return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
//         }
//         
//         // VERIFICAÇÃO CRÍTICA: Se usuário não está online ou não está na stream, não fazer nada
//         if (!user.isOnline || user.currentStreamId !== streamId) {
//             console.warn(`🛑 USUÁRIO ${userId} NÃO ESTÁ ONLINE NA STREAM ${streamId} - IGNORANDO CHAMADA DUPLICADA`);
//             console.warn(`   Status atual: isOnline=${user.isOnline}, currentStreamId=${user.currentStreamId}`);
//             return res.json({ success: true, message: 'Usuário não está nesta stream' });
//         }
//         
//         // Verificar se usuário está em outras streams como host (EXCETO a stream atual)
//         const activeStreams = await models.Streamer.find({ 
//             hostId: userId, 
//             isLive: true,
//             id: { $ne: streamId } // Excluir a stream atual da verificação
//         });
//         
//         // Se não estiver em outras streams, marcar como offline e limpar stream atual
//         if (!activeStreams || activeStreams.length === 0) {
//             await models.User.findOneAndUpdate({ id: userId }, { 
//                 isOnline: false,
//                 currentStreamId: null,
//                 lastSeen: new Date().toISOString()
//             });
//             console.log(`✅ Usuário ${userId} marcado como offline (não está em outras streams)`);
//         } else {
//             // Se estiver em outra stream como host, manter online mas NÃO mudar stream atual automaticamente
//             await models.User.findOneAndUpdate({ id: userId }, { 
//                 lastSeen: new Date().toISOString()
//             });
//             console.log(`✅ Usuário ${userId} mantido online (host em outra stream), mas stream atual não alterada`);
//         }
//         
//         // REMOVIDO: Não emitir eventos WebSocket via rotas HTTP
//         // O controle de eventos é feito apenas via WebSocket para evitar duplicatas
//         
//         res.json({ success: true });
//     } catch (error: any) {
//         console.error('❌ Erro ao sair da stream:', error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

router.post('/streams/:id/end-session', async (req, res) => {
    try {
        const { session } = req.body;
        const streamId = req.params.id;
        
        console.log(`🔴 Encerrando live ${streamId} e salvando no histórico`);
        
        // 1. Buscar a stream antes de atualizar
        const stream = await Streamer.findOne({ id: streamId });
        
        if (!stream) {
            console.warn(`⚠️ Stream ${streamId} não encontrada`);
            return res.status(404).json({ success: false, error: 'Stream not found' });
        }
        
        // 2. Calcular duração
        const endTime = Date.now();
        const durationMs = endTime - (session?.startTime || endTime);
        const totalSeconds = Math.floor(durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const durationStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // 3. Salvar no histórico
        const { StreamHistory } = await import('../models');
        const historyEntry = {
            id: `hist_${streamId}_${endTime}`,
            streamId: streamId,
            hostId: stream.hostId,
            hostName: stream.name,
            hostAvatar: stream.avatar,
            title: stream.name,
            startTime: session?.startTime || new Date(stream.startTime || endTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            duration: durationStr,
            peakViewers: session?.peakViewers || stream.viewers || 0,
            totalCoins: session?.coins || 0,
            totalFollowers: session?.followers || 0,
            totalMembers: session?.members || 0,
            totalFans: session?.fans || 0,
            category: stream.category,
            tags: stream.tags || [],
            country: stream.country
        };
        
        await StreamHistory.create(historyEntry);
        console.log(`💾 Histórico salvo para stream ${streamId}`);
        
        // 4. Atualizar status da stream para offline
        const updatedStream = await Streamer.findOneAndUpdate(
            { id: streamId }, 
            { 
                isLive: false,
                endTime: new Date(endTime).toISOString(),
                streamStatus: 'ended',
                viewers: 0
            },
            { new: true }
        );
        
        // 5. Atualizar status do host
        const User = await import('../models').then(m => m.User);
        const updatedUser = await User.findOneAndUpdate(
            { id: stream.hostId }, 
            { isLive: false }, 
            { new: true }
        );
        
        // 6. Remover todos os usuários online desta stream
        await User.updateMany(
            { currentStreamId: streamId },
            { 
                isOnline: false,
                currentStreamId: null,
                lastSeen: new Date().toISOString()
            }
        );
        
        // 7. Notificar via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.emit('stream_ended', {
                streamId: streamId,
                hostId: stream.hostId,
                timestamp: new Date().toISOString()
            });
            
            io.to(streamId).emit('live_stream_ended', {
                streamId: streamId,
                message: 'Esta transmissão foi encerrada',
                timestamp: new Date().toISOString()
            });
            
            console.log(`📢 Notificação WebSocket enviada: stream ${streamId} encerrada`);
        }
        
        console.log(`✅ Live ${streamId} encerrada e histórico salvo com sucesso`);
        
        res.json({ 
            success: true, 
            user: updatedUser || {},
            stream: {
                id: streamId,
                isLive: false,
                endTime: new Date(endTime).toISOString()
            },
            history: historyEntry
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao encerrar sessão da live:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API específica para remover cards de lives
router.delete('/cards/:streamId', async (req, res) => {
    try {
        const { streamId } = req.params;
        
        console.log(`🗑️ Removendo card da live ${streamId}`);
        
        // 1. Buscar a stream
        const stream = await Streamer.findOne({ id: streamId });
        
        if (!stream) {
            console.warn(`⚠️ Stream ${streamId} não encontrada`);
            return res.status(404).json({ success: false, error: 'Stream not found' });
        }
        
        // 2. Remover o card (marcar como offline)
        await Streamer.findOneAndUpdate(
            { id: streamId },
            { 
                isLive: false,
                streamStatus: 'ended',
                endTime: new Date().toISOString(),
                viewers: 0
            }
        );
        
        // 3. Notificar via WebSocket para todos os clientes
        const io = req.app.get('io');
        if (io) {
            io.emit('card_removed', {
                streamId: streamId,
                hostId: stream.hostId,
                timestamp: new Date().toISOString()
            });
            
            console.log(`📢 Notificação WebSocket enviada: card ${streamId} removido`);
        }
        
        console.log(`✅ Card da live ${streamId} removido com sucesso`);
        
        res.json({ success: true });
        
    } catch (error: any) {
        console.error('❌ Erro ao remover card:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/streams/:id/gift', async (req, res) => {
    try {
        const { fromUserId, giftName, amount } = req.body;
        const U = await import('../models').then(m => m.User);
        const G = await import('../models').then(m => m.Gift);
        
        const sender = await U.findOne({ id: fromUserId });
        if (!sender) return res.status(404).json({ error: 'Sender not found' });

        // Find stream to get receiver
        const stream = await Streamer.findOne({ id: req.params.id });
        if (!stream) return res.status(404).json({ error: 'Stream not found' });
        
        const receiver = await U.findOne({ id: stream.hostId });
        
        // Find gift details
        const gift = await G.findOne({ name: giftName });
        if (!gift) return res.status(404).json({ error: 'Gift not found' });

        const price = gift.price || 100;
        const totalValue = price * (amount || 1);

        if (sender.diamonds < totalValue) {
            return res.status(400).json({ error: 'Insufficient diamonds' });
        }

        // Update sender diamonds
        sender.diamonds -= totalValue;
        sender.enviados = (sender.enviados || 0) + totalValue;
        await sender.save();

        // Update receiver earnings
        if (receiver) {
            receiver.earnings = (receiver.earnings || 0) + totalValue;
            receiver.receptores = (receiver.receptores || 0) + totalValue;
            await receiver.save();
        }

        // Register gift transaction
        await GiftTransaction.create([{
            id: `gift_tx_${Date.now()}_${fromUserId}`,
            fromUserId,
            fromUserName: sender.name,
            fromUserAvatar: sender.avatarUrl || '',
            toUserId: stream.hostId,
            toUserName: receiver?.name || 'Unknown',
            streamId: req.params.id,
            giftName,
            giftIcon: gift.icon || '🎁',
            giftPrice: price,
            quantity: amount || 1,
            totalValue,
            createdAt: new Date().toISOString()
        }]);

        console.log(`✅ Gift sent: ${giftName} x${amount} from ${sender.name} to stream ${req.params.id}`);
        
        res.json({ 
            success: true, 
            updatedSender: sender, 
            updatedReceiver: receiver || {} as any 
        });
    } catch (error: any) {
        console.error('Error sending gift:', error);
        res.status(500).json({ error: error.message });
    }
});
// REMOVIDO: Endpoint de simulação que estava causando usuário falso online
// router.post('/sim/status', async (req, res) => {
//     // Just mock sim update
//     const user = await import('../models').then(m => m.User).then(U => U.findOneAndUpdate({ id: '10755083' }, { isOnline: req.body.isOnline }, { new: true }));
//     res.json({ success: true, user: user || {} });
// });

// WebRTC logic (SRS Integration)
const SRS_API_URL = process.env.SRS_API_URL || 'http://72.60.249.175:1985';

router.post('/rtc/v1/publish', async (req, res) => {
    try {
        const { streamUrl, sdp } = req.body;
        console.log(`[SRS Proxy] Publishing to ${streamUrl}`);

        const response = await fetch(`${SRS_API_URL}/rtc/v1/publish/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api: `${SRS_API_URL}/rtc/v1/publish/`, streamurl: streamUrl, sdp })
        });

        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        console.error('[SRS Publish Error]', err);
        res.status(500).json({ code: 500, error: err.message });
    }
});

router.post('/rtc/v1/play', async (req, res) => {
    try {
        const { streamUrl, sdp } = req.body;
        console.log(`[SRS Proxy] Playing from ${streamUrl}`);

        const response = await fetch(`${SRS_API_URL}/rtc/v1/play/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api: `${SRS_API_URL}/rtc/v1/play/`, streamurl: streamUrl, sdp })
        });

        const data = await response.json();
        res.json(data);
    } catch (err: any) {
        console.error('[SRS Play Error]', err);
        res.status(500).json({ code: 500, error: err.message });
    }
});

router.delete('/rtc/v1/stop', async (req, res) => {
    // Note: SRS typically manages stop via stream disconnects or specific API calls. For now we acknowledge.
    res.json({ code: 0, sdp: '', sessionid: '' });
});

router.get('/v1/streams/:id', async (req, res) => {
    try {
        const response = await fetch(`${SRS_API_URL}/api/v1/streams`);
        const data = await response.json() as { streams?: any[] };
        const stream = data.streams?.find((s: any) => s.name === req.params.id) || { id: req.params.id, clients: 0, kbps: { recv_30s: 0, send_30s: 0 }, create: '' };
        res.json(stream);
    } catch (err: any) {
        res.json({ id: req.params.id, clients: 0, kbps: { recv_30s: 0, send_30s: 0 }, create: '' });
    }
});

router.post('/lives/start', async (req, res) => res.json({ success: true }));
router.get('/lives/:id', async (req, res) => res.json({}));
router.post('/lives/:id/end', async (req, res) => {
    await Streamer.deleteOne({ id: req.params.id });
    res.json({ success: true });
});

export default router;
