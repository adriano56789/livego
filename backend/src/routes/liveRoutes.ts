import express from 'express';
import { Streamer, User, Gift, GiftTransaction } from '../models';
import { getUserIdFromToken } from '../middleware/auth';

const router = express.Router();

router.get('/live/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { country } = req.query;

        console.log(`🔍 [DEBUG] API Route called - Category: ${category}, Country: ${country || 'none'}`);

        // Base filter para streams ativos e válidas
        let baseFilter: any = {
            isLive: true,
            name: { $exists: true, $nin: ['', null] },
            hostId: { $exists: true, $nin: ['', null] },
            avatar: { $exists: true, $nin: ['', null] },
            // 🚀 FILTRO RIGOROSO: apenas streams realmente ao vivo
            startTime: { $exists: true, $ne: null },
            streamStatus: 'active',
            // 🚀 VERIFICAR SE O HOST ESTÁ REALMENTE ONLINE
            viewers: { $exists: true, $gte: 0 },
            // 🚀 VERIFICAR SE TEM DADOS DE TRANSMISSÃO
            rtmpIngestUrl: { $exists: true, $ne: null },
            playbackUrl: { $exists: true, $ne: null }
        };

        // Se for "global" ou "popular", retorna todas as lives ativas E válidas
        if (category === 'global' || category === 'popular') {
            let filter = baseFilter;

            // Se houver filtro por país, adicionar ao filter
            if (country && country !== 'ICON_GLOBE') {
                filter.country = country;
                console.log(`🌍 Filtering streams by country: ${country}`);
            }

            console.log(`🔍 [DEBUG] Final filter for global/popular:`, JSON.stringify(filter, null, 2));

            const streams = await Streamer.find(filter).sort({ viewers: -1 });
            console.log(`📺 Found ${streams.length} streams for category: ${category}, country: ${country || 'all'}`);

            // Log country codes of returned streams for debugging
            if (streams.length > 0) {
                const countryCodes = streams.map(s => s.country || 'undefined').join(', ');
                console.log(`🌍 [DEBUG] Stream country codes: ${countryCodes}`);
            }

            return res.json(streams);
        }

        // Para categorias específicas, filtra por tag ou categoria E valida dados
        let categoryFilter: any = {
            ...baseFilter,
            $or: [
                { category: category.toLowerCase() },
                { tags: { $in: [category.toLowerCase()] } }
            ]
        };

        // Se houver filtro por país em categorias específicas
        if (country && country !== 'ICON_GLOBE') {
            categoryFilter.country = country;
            console.log(`🌍 Filtering ${category} streams by country: ${country}`);
        }

        console.log(`🔍 [DEBUG] Final filter for category "${category}":`, JSON.stringify(categoryFilter, null, 2));

        const categoryStreams = await Streamer.find(categoryFilter).sort({ viewers: -1 });
        console.log(`📺 Found ${categoryStreams.length} streams for category: ${category}, country: ${country || 'all'}`);

        // Log country codes of returned streams for debugging
        if (categoryStreams.length > 0) {
            const countryCodes = categoryStreams.map(s => s.country || 'undefined').join(', ');
            console.log(`🌍 [DEBUG] Category stream country codes: ${countryCodes}`);
        }

        res.json(categoryStreams);
    } catch (error: any) {
        console.error('Error fetching streams:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para buscar streams por região
// API para listar lives ativas
router.get('/streams/live', async (req, res) => {
    try {
        console.log(`🔍 [STREAMS LIVE] Buscando lives ativas`);

        // Buscar streams ativas com dados reais
        const activeStreams = await Streamer.find({
            isLive: true,
            streamStatus: 'active',
            name: { $exists: true, $nin: ['', null] },
            hostId: { $exists: true, $nin: ['', null] }
        }).sort({ viewers: -1 });

        // Enriquecer com dados dos hosts
        const streamsWithHostData = await Promise.all(
            activeStreams.map(async (stream) => {
                const host = await User.findOne({ id: stream.hostId }).select('id name avatarUrl level country isOnline');

                return {
                    ...stream.toObject(),
                    host: host || {
                        id: stream.hostId,
                        name: 'Usuário',
                        avatarUrl: '',
                        level: 1,
                        country: 'br',
                        isOnline: false
                    }
                };
            })
        );

        console.log(`✅ [STREAMS LIVE] Encontradas ${activeStreams.length} lives ativas`);

        res.json({
            success: true,
            streams: streamsWithHostData,
            count: activeStreams.length
        });
    } catch (error: any) {
        console.error('❌ [STREAMS LIVE] Erro ao buscar lives ativas:', error);
        res.status(500).json({ error: error.message });
    }
});

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



// API para criar transmissão real
router.post('/streams', async (req, res) => {
    try {
        const { name, country, location, category = 'general', ...otherData } = req.body;
        const hostId = getUserIdFromToken(req) || req.body.hostId;

        console.log(`🎥 [STREAM CREATE] Iniciando criação de stream - Host: ${hostId}`);

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Stream name is required' });
        }

        if (!hostId) {
            return res.status(400).json({ error: 'Host ID is required (token or body)' });
        }

        // 🚀 VERIFICAÇÃO CRÍTICA: Verificar se host já tem stream existente (qualquer status)
        console.log(`🔍 [STREAM CREATE] Verificando streams existentes para host: ${hostId}`);

        const existingStream = await Streamer.findOne({ hostId: hostId });

        if (existingStream) {
            console.log(`⚠️ [STREAM CREATE] Host ${hostId} já tem stream ${existingStream.id} (status: ${existingStream.streamStatus || 'N/A'}, isLive: ${existingStream.isLive})`);

            // Se o stream existente estiver offline, reativá-lo em vez de criar novo
            if (!existingStream.isLive || existingStream.streamStatus !== 'active') {
                console.log(`🔄 [STREAM CREATE] Reativando stream existente ${existingStream.id} COM DADOS ZERADOS`);

                // 🔥 LIMPAR TRANSAÇÕES DE PRESENTES DA LIVE ANTERIOR
                try {
                    const { GiftTransaction } = await import('../models');
                    const deleteResult = await GiftTransaction.deleteMany({ 
                        streamId: existingStream.id 
                    });
                    console.log(`🧹 [STREAM CREATE] Limpadas ${deleteResult.deletedCount} transações de presentes da live anterior`);
                } catch (cleanupError: any) {
                    console.warn(`⚠️ [STREAM CREATE] Erro ao limpar transações (mas continuando): ${cleanupError.message}`);
                }

                // Atualizar stream existente para status ativo ZERANDO dados da live anterior
                const updatedStream = await Streamer.findOneAndUpdate(
                    { id: existingStream.id },
                    {
                        $set: {
                            isLive: true,
                            streamStatus: 'active',
                            startTime: new Date().toISOString(),
                            viewers: 0,
                            diamonds: 0, // 🔥 ZERAR diamantes da live anterior
                            name: name.trim(),
                            message: `Ao vivo: ${name.trim()}`,
                            tags: ['live', category.toLowerCase()],
                            country: country || existingStream.country || 'br',
                            location: location || existingStream.location || 'Brasil',
                            updatedAt: new Date()
                        }
                    },
                    { new: true }
                );

                if (!updatedStream) {
                    return res.status(500).json({ error: 'Failed to reactivate stream' });
                }

                console.log(`✅ [STREAM CREATE] Stream reativado: ${updatedStream.id}`);

                return res.json({
                    success: true,
                    stream: {
                        ...updatedStream.toObject(),
                        publishUrl: `${process.env.SRS_WEBRTC_URL || 'http://localhost:9000'}/rtc/v1/publish/`,
                        playUrl: `${process.env.SRS_WEBRTC_URL || 'http://localhost:9000'}/rtc/v1/play/`,
                        streamUrl: `webrtc://livego.store:8000/live/${updatedStream.id}`
                    },
                    reactivated: true
                });
            }

            // Se já estiver ativo, retornar existente
            console.log(`📊 [STREAM CREATE] Retornando stream ativo existente - sem duplicata`);
            return res.json({
                success: true,
                stream: {
                    ...existingStream.toObject(),
                    publishUrl: `${process.env.SRS_WEBRTC_URL || 'http://localhost:9000'}/rtc/v1/publish/`,
                    playUrl: `${process.env.SRS_WEBRTC_URL || 'http://localhost:9000'}/rtc/v1/play/`,
                    streamUrl: `webrtc://livego.store:8000/live/${existingStream.id}`
                },
                existing: true
            });
        }

        // Gerar ID único para stream
        const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        // Buscar usuário para obter dados reais
        const user = await User.findOne({ id: hostId });
        if (!user) {
            return res.status(404).json({ error: 'Host user not found' });
        }

        // Usar dados reais do usuário
        const userAvatar = user.avatarUrl || '';
        const userCountry = user.country || 'br';

        // Configurar URLs reais para SRS
        const srsWebRtcUrl = process.env.SRS_WEBRTC_URL || 'http://localhost:9000';
        const srsRtmpUrl = process.env.SRS_RTMP_URL || 'rtmp://localhost:1935/live';
        const srsHttpUrl = process.env.SRS_HTTP_URL || 'http://localhost:8080';

        // Prioridade: país enviado > país do usuário > Brasil como fallback
        const finalCountry = country || userCountry || 'br';
        const finalLocation = location || 'Brasil';

        console.log(`🌍 [STREAM CREATE] País final: ${finalCountry} (enviado: ${country || 'none'}, usuário: ${userCountry})`);

        // Criar stream com dados reais
        const stream = await Streamer.create({
            id: streamId,
            hostId: hostId,
            name: name.trim(),
            avatar: userAvatar,
            location: finalLocation,
            time: 'Live Now',
            message: `Ao vivo: ${name.trim()}`,
            tags: ['live', category.toLowerCase()],
            isHot: false,
            icon: '',
            country: finalCountry,
            viewers: 0,
            isPrivate: false,
            quality: '720p',
            demoVideoUrl: '',
            // URLs reais do SRS
            rtmpIngestUrl: `${srsRtmpUrl}/${streamId}`,
            srtIngestUrl: '',
            streamKey: streamId,
            playbackUrl: `${srsHttpUrl}/live/${streamId}.flv`,
            webrtcUrl: `${srsWebRtcUrl}/rtc/v1/play/`,
            // Status
            isLive: true,
            startTime: new Date().toISOString(),
            category: category.toLowerCase(),
            language: 'pt',
            maxViewers: 1000,
            recordingEnabled: false,
            chatEnabled: true,
            giftsEnabled: true,
            streamStatus: 'active',
            // Configurações técnicas
            bitrate: '2000k',
            fps: 30,
            resolution: '1280x720',
            audioCodec: 'AAC',
            videoCodec: 'H264',
            latency: 'low',
            // Configurações adicionais
            ...otherData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Atualizar status do usuário para live
        await User.findOneAndUpdate(
            { id: hostId },
            {
                isLive: true,
                currentStreamId: streamId,
                lastSeen: new Date().toISOString()
            }
        );

        console.log(`✅ [STREAM CREATE] Stream ${streamId} criada com sucesso para host ${hostId}`);

        res.json({
            success: true,
            stream: {
                ...stream.toObject(),
                id: streamId, // 🚀 ADICIONANDO ID EXPLICITAMENTE
                // URLs para WebRTC
                publishUrl: `${srsWebRtcUrl}/rtc/v1/publish/`,
                playUrl: `${srsWebRtcUrl}/rtc/v1/play/`,
                streamUrl: `webrtc://livego.store:8000/live/${streamId}`
            }
        });
    } catch (error: any) {
        console.error('❌ [STREAM CREATE] Erro ao criar stream:', error);
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

// Rota para buscar usuários online em uma stream específica
router.get('/streams/:id/online-users', async (req, res) => {
    try {
        const streamId = req.params.id;
        if (!streamId) {
            return res.status(400).json({ error: 'Stream ID inválido' });
        }

        // Buscar usuários marcados como online nesta stream no banco de dados
        const onlineUsersInStream = await User.find({
            isOnline: true,
            currentStreamId: streamId,
            name: { $exists: true, $nin: ['', null] }, // Apenas usuários com nome válido
            id: { $exists: true, $nin: ['', null] } // Apenas usuários com ID válido
        }).select('id name avatarUrl identification level activeFrameId frameExpiration');

        console.log(`🔍 [ONLINE USERS] Usuários encontrados na stream ${streamId}:`, onlineUsersInStream.map(u => ({
            id: u.id,
            name: u.name,
            avatarUrl: u.avatarUrl,
            hasAvatar: !!u.avatarUrl
        })));

        // Se não encontrar usuários online, buscar todos os usuários que enviaram presentes nesta live
        if (onlineUsersInStream.length === 0) {
            console.log(`🔍 [ONLINE USERS] Nenhum usuário online encontrado, buscando usuários que enviaram presentes...`);
            
            // Importar GiftTransaction apenas quando necessário
            const { GiftTransaction } = await import('../models');
            
            // Buscar usuários que enviaram presentes nesta live
            const giftSenders = await GiftTransaction.aggregate([
                { $match: { streamId: streamId } },
                { $group: { _id: '$fromUserId', totalValue: { $sum: '$totalValue' } } },
                { $sort: { totalValue: -1 } }
            ]);
            
            console.log(`🎁 [ONLINE USERS] Remetentes de presentes encontrados:`, giftSenders);
            
            // Buscar dados completos desses usuários
            const senderIds = giftSenders.map(s => s._id);
            if (senderIds.length > 0) {
                const senderUsers = await User.find({
                    id: { $in: senderIds },
                    name: { $exists: true, $nin: ['', null] }
                }).select('id name avatarUrl identification level activeFrameId frameExpiration');
                
                // Combinar dados dos usuários com valores reais de presentes enviados nesta live
                const usersWithGiftData = senderUsers.map(u => {
                    const senderData = giftSenders.find(s => s._id === u.id);
                    return {
                        id: u.id,
                        name: u.name,
                        avatarUrl: u.avatarUrl,
                        identification: u.identification,
                        level: u.level || 1,
                        activeFrameId: u.activeFrameId || null,
                        frameExpiration: u.frameExpiration || null,
                        value: senderData?.totalValue || 0 // Valor real enviado nesta live
                    };
                });
                
                console.log(`🎯 [ONLINE USERS] Resultado final (presentes):`, usersWithGiftData);
                return res.json(usersWithGiftData);
            }
        }

        // Buscar transações de presentes desta live para calcular valores enviados APENAS nesta live
        const { GiftTransaction } = await import('../models');
        const liveGiftTransactions = await GiftTransaction.find({
            streamId: streamId
        }).select('fromUserId totalValue');

        // Agrupar valores por usuário para esta live específica
        const userValuesInLive: Record<string, number> = {};
        liveGiftTransactions.forEach(transaction => {
            const userId = transaction.fromUserId;
            const value = transaction.totalValue || 0;
            userValuesInLive[userId] = (userValuesInLive[userId] || 0) + value;
        });

        // Enriquecer com valores reais de presentes enviados nesta live
        const usersWithValue = onlineUsersInStream.map(u => ({
            id: u.id,
            name: u.name,
            avatarUrl: u.avatarUrl,
            identification: u.identification,
            level: u.level || 1,
            activeFrameId: u.activeFrameId || null,
            frameExpiration: u.frameExpiration || null,
            value: userValuesInLive[u.id] || 0 // Valor real enviado nesta live
        }));

        // Ordenar por valor de presentes enviados (maior primeiro)
        usersWithValue.sort((a, b) => (b.value || 0) - (a.value || 0));

        // Se ainda não encontrar nada, buscar o host da stream como fallback
        if (usersWithValue.length === 0) {
            console.log(`🔍 [ONLINE USERS] Nenhum usuário encontrado, buscando host como fallback...`);
            
            const stream = await Streamer.findOne({ id: streamId });
            if (stream && stream.hostId) {
                const host = await User.findOne({ id: stream.hostId }).select('id name avatarUrl identification level activeFrameId frameExpiration');
                if (host) {
                    const hostData = {
                        id: host.id,
                        name: host.name,
                        avatarUrl: host.avatarUrl,
                        identification: host.identification,
                        level: host.level || 1,
                        activeFrameId: host.activeFrameId || null,
                        frameExpiration: host.frameExpiration || null,
                        value: userValuesInLive[host.id] || 0 // Valor real enviado pelo host
                    };
                    console.log(`🎯 [ONLINE USERS] Host encontrado como fallback:`, hostData);
                    return res.json([hostData]);
                }
            }
        }

        console.log(`🎯 [DEBUG] Resultado final:`, usersWithValue);
        return res.json(usersWithValue);
    } catch (error: any) {
        console.error('❌ [ONLINE USERS] Erro:', error);
        return res.status(500).json({ error: error.message });
    }
});
// Rota para atualizar status online do usuário
// API para usuário entrar na live
router.post('/streams/:streamId/join', async (req, res) => {
    try {
        const { userId } = req.body;
        const streamId = req.params.streamId;

        console.log(`👤 [STREAM JOIN] Usuário ${userId} entrando na stream ${streamId}`);

        if (!userId || !streamId) {
            return res.status(400).json({ success: false, error: 'UserId e StreamId são obrigatórios' });
        }

        // Verificar se o usuário existe
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
        }

        // Verificar se a stream existe e está ativa
        const stream = await Streamer.findOne({ id: streamId, isLive: true });
        if (!stream) {
            return res.status(404).json({ success: false, error: 'Stream não encontrada ou inativa' });
        }

        // Verificar se usuário já está na stream (evitar duplicatas)
        if (user.isOnline && user.currentStreamId === streamId) {
            console.log(`⚠️ [STREAM JOIN] Usuário ${userId} já está na stream ${streamId}`);
            return res.json({ success: true, message: 'Usuário já está na stream', user });
        }

        // Atualizar status do usuário
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            {
                isOnline: true,
                currentStreamId: streamId,
                lastSeen: new Date().toISOString()
            },
            { new: true }
        );

        // 🔧 MELHOR PRÁTICA: Incrementar viewers com $inc e upsert automático
        const updatedStream = await Streamer.findOneAndUpdate(
            { id: streamId },
            { 
                $inc: { viewers: 1 },
                $setOnInsert: {
                    id: streamId,
                    hostId: stream?.hostId || userId,
                    name: stream?.name || 'Live Stream',
                    avatar: stream?.avatar || '',
                    location: stream?.location || 'Brasil',
                    time: 'Live Now',
                    message: stream?.message || 'Ao vivo',
                    tags: stream?.tags || ['live'],
                    country: stream?.country || 'br',
                    isLive: true,
                    streamStatus: 'active',
                    startTime: new Date().toISOString(),
                    quality: '720p',
                    category: 'live'
                }
            },
            { 
                upsert: true, // Criar se não existir
                new: true
            }
        );

        // Notificar via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(streamId).emit('user_joined', {
                userId: userId,
                streamId: streamId,
                user: {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    level: user.level
                },
                timestamp: new Date().toISOString()
            });
        }

        console.log(`✅ [STREAM JOIN] Usuário ${userId} entrou na stream ${streamId}`);

        res.json({
            success: true,
            user: updatedUser,
            stream: {
                id: streamId,
                viewers: updatedStream.viewers || 1
            }
        });
    } catch (error: any) {
        console.error('❌ [STREAM JOIN] Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🔧 API DE SALDO DA LIVE - Retorna saldo em tempo real
router.get('/streams/:id/balance', async (req, res) => {
    try {
        const streamId = req.params.id;
        console.log(`💰 [BALANCE] Buscando saldo da live: ${streamId}`);
        
        // Buscar streamer pelo ID
        const streamer = await Streamer.findOne({ id: streamId });
        
        if (!streamer) {
            console.log(`❌ Streamer not found: ${streamId}`);
            return res.status(404).json({ error: 'Streamer not found' });
        }

        // 🔧 USAR DIAMONDS DO STREAM (valor correto para o contador)
        const currentBalance = streamer.diamonds || 0;
        
        console.log(`✅ [BALANCE] Saldo da live ${streamId}: ${currentBalance} diamantes`);
        
        // Retornar saldo atualizado
        res.json({
            streamId: streamId,
            streamerName: streamer.name,
            diamonds: currentBalance,
            lastUpdated: streamer.updatedAt || new Date().toISOString(),
            isLive: streamer.isLive
        });
        
    } catch (error: any) {
        console.error('❌ [BALANCE] Erro ao buscar saldo da live:', error);
        res.status(500).json({ error: error.message });
    }
});

// API para usuário sair da live
router.post('/streams/:streamId/leave', async (req, res) => {
    try {
        const { userId } = req.body;
        const streamId = req.params.streamId;

        console.log(`👤 [STREAM LEAVE] Usuário ${userId} saindo da stream ${streamId}`);

        if (!userId || !streamId) {
            return res.status(400).json({ success: false, error: 'UserId e StreamId são obrigatórios' });
        }

        // Verificar se o usuário existe
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
        }

        // Verificar se usuário está realmente na stream
        if (!user.isOnline || user.currentStreamId !== streamId) {
            console.log(`⚠️ [STREAM LEAVE] Usuário ${userId} não está na stream ${streamId}`);
            return res.json({ success: true, message: 'Usuário não está na stream' });
        }

        // Verificar se usuário é host de alguma stream ativa
        const activeHostStreams = await Streamer.find({
            hostId: userId,
            isLive: true,
            id: { $ne: streamId }
        });

        // Se não for host de nenhuma outra stream, marcar como offline
        if (!activeHostStreams || activeHostStreams.length === 0) {
            await User.findOneAndUpdate(
                { id: userId },
                {
                    isOnline: false,
                    currentStreamId: null,
                    lastSeen: new Date().toISOString()
                }
            );
        } else {
            // Se for host de outra stream, apenas limpar currentStreamId
            await User.findOneAndUpdate(
                { id: userId },
                {
                    currentStreamId: null,
                    lastSeen: new Date().toISOString()
                }
            );
        }

        // 🔧 MELHOR PRÁTICA: Decrementar viewers com $inc ( MongoDB garante não ficar negativo com min: 0 )
        await Streamer.findOneAndUpdate(
            { id: streamId, viewers: { $gt: 0 } }, // Apenas se viewers > 0
            { $inc: { viewers: -1 } }
        );

        // Notificar via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(streamId).emit('user_left', {
                userId: userId,
                streamId: streamId,
                user: {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    level: user.level
                },
                timestamp: new Date().toISOString()
            });
        }

        console.log(`✅ [STREAM LEAVE] Usuário ${userId} saiu da stream ${streamId}`);

        res.json({
            success: true,
            user: {
                id: userId,
                isOnline: activeHostStreams && activeHostStreams.length > 0,
                currentStreamId: null
            },
            stream: {
                id: streamId,
                viewers: Math.max(0, 0) // 🔧 MELHOR PRÁTICA: MongoDB já controlou o decremento
            }
        });
    } catch (error: any) {
        console.error('❌ [STREAM LEAVE] Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API para encerrar transmissão
router.post('/streams/:streamId/end', async (req, res) => {
    try {
        const { userId } = req.body; // Host que está encerrando
        const streamId = req.params.streamId;

        console.log(`🔴 [STREAM END] Encerrando stream ${streamId} pelo usuário ${userId}`);

        if (!userId || !streamId) {
            return res.status(400).json({ success: false, error: 'UserId e StreamId são obrigatórios' });
        }

        // Verificar se a stream existe
        const stream = await Streamer.findOne({ id: streamId });
        if (!stream) {
            return res.status(404).json({ success: false, error: 'Stream não encontrada' });
        }

        // Verificar se o usuário é o host
        if (stream.hostId !== userId) {
            return res.status(403).json({ success: false, error: 'Apenas o host pode encerrar a transmissão' });
        }

        const endTime = new Date();
        const durationMs = endTime.getTime() - new Date(stream.startTime || endTime).getTime();
        const durationSeconds = Math.floor(durationMs / 1000);

        // Salvar no histórico com upsert automático
        try {
            const { StreamHistory } = await import('../models');
            const historyId = `hist_${streamId}_${endTime.getTime()}`;
            await StreamHistory.findOneAndUpdate(
                { id: historyId },
                {
                    id: historyId,
                    streamId: streamId,
                    hostId: stream.hostId,
                    hostName: stream.name,
                    hostAvatar: stream.avatar,
                    title: stream.name,
                    startTime: stream.startTime,
                    endTime: endTime.toISOString(),
                    duration: new Date(durationSeconds * 1000).toISOString().substr(11, 8),
                    peakViewers: stream.viewers || 0,
                    totalCoins: 0,
                    totalFollowers: 0,
                    totalMembers: stream.viewers || 0,
                totalFans: 0,
                    category: stream.category,
                    tags: stream.tags || [],
                    country: stream.country
                },
                { 
                    upsert: true, // Criar se não existir
                    new: true
                }
            );
            console.log(`💾 [STREAM END] Histórico salvo para stream ${streamId}`);
        } catch (historyError: any) {
            console.warn(`⚠️ [STREAM END] Erro ao salvar histórico: ${historyError.message}`);
        }

        // Atualizar status da stream e ZERAR todos os dados da live
        await Streamer.findOneAndUpdate(
            { id: streamId },
            {
                isLive: false,
                streamStatus: 'ended',
                endTime: endTime.toISOString(),
                viewers: 0
                // � REMOVIDO: Não zerar diamantes ao encerrar para manter persistência
            }
        );

        // Transferir diamantes da live para carteira de ganhos do host
        // Regra: Streamer recebe o valor proporcional dos diamantes recebidos na live.
        try {
            console.log(`🔄 [STREAM END] Processando encerramento da live ${streamId} do host ${userId}`);
            
            // Buscar stream atual
            const streamData = await Streamer.findOne({ id: streamId });
            const streamDiamonds = streamData?.diamonds || 0;
            
            if (streamDiamonds > 0) {
                console.log(`📊 [STREAM END] Transferindo ${streamDiamonds} diamantes da live ${streamId} para o host ${userId}`);
                
                // Adicionar aos earnings do host
                const host = await User.findOne({ id: userId });
                if (host) {
                    const oldEarnings = host.earnings || 0;
                    const newEarnings = oldEarnings + streamDiamonds;
                    
                    await User.findOneAndUpdate(
                        { id: userId },
                        { $set: { earnings: newEarnings } }
                    );
                    
                    console.log(`✅ [STREAM END] Ganhos do host ${host.name} atualizados: ${oldEarnings} → ${newEarnings} diamantes`);
                    
                    // Notificar via WebSocket
                    const io = req.app.get('io');
                    if (io) {
                        io.emit('earnings_updated', {
                            userId: userId,
                            diamonds: streamDiamonds,
                            totalEarnings: newEarnings,
                            timestamp: endTime.toISOString(),
                            source: 'live_end',
                            streamId: streamId
                        });
                        
                        // 🔧 CORREÇÃO: Notificar também que os diamantes da live foram mantidos
                        io.emit('live_coins_updated', {
                            streamId: streamId,
                            coins: 0,
                            totalCoins: streamDiamonds, // Mantém o valor acumulado
                            timestamp: endTime.toISOString(),
                            fromUser: 'System',
                            giftName: 'Live End - Values Preserved'
                        });
                        
                        console.log(`🪙 [STREAM END] Diamantes da live ${streamId} preservados: ${streamDiamonds}`);
                    }
                }
                
                // Zerar contadores de presentes da live (enviados durante esta live)
                try {
                    console.log(`🧹 [STREAM END] Limpando contadores de presentes da live ${streamId}`);
                    
                    // 🔧 REMOVIDO: Não zerar diamantes da stream para manter persistência entre lives
                console.log(`✅ [STREAM END] Diamantes da live ${streamId} preservados para próxima sessão`);
                    
                    // 🔧 REMOVIDO: Não emitir WebSocket com valores zerados para manter consistência
                    console.log(`✅ [STREAM END] WebSocket não emitido para manter valores atuais`);
                } catch (cleanupError: any) {
                    console.error(`❌ [STREAM END] Erro ao zerar contadores: ${cleanupError.message}`);
                }
            } else {
                console.log(`ℹ️ [STREAM END] Sem diamantes acumulados para transferir na live ${streamId}`);
            }
        } catch (transferError: any) {
            console.error(`❌ [STREAM END] Erro ao transferir diamantes: ${transferError.message}`);
        }

        // Atualizar status do host
        await User.findOneAndUpdate(
            { id: userId },
            {
                isLive: false,
                currentStreamId: null,
                lastSeen: endTime.toISOString()
            }
        );

        // Remover todos os usuários da stream
        await User.updateMany(
            { currentStreamId: streamId },
            {
                isOnline: false,
                currentStreamId: null,
                lastSeen: endTime.toISOString()
            }
        );

        // Notificar via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.emit('stream_ended', {
                streamId: streamId,
                hostId: userId,
                timestamp: endTime.toISOString()
            });

            io.to(streamId).emit('live_stream_ended', {
                streamId: streamId,
                message: 'Esta transmissão foi encerrada',
                timestamp: endTime.toISOString()
            });
        }

        console.log(`✅ [STREAM END] Stream ${streamId} encerrada com sucesso`);

        res.json({
            success: true,
            stream: {
                id: streamId,
                isLive: false,
                endTime: endTime.toISOString(),
                duration: durationSeconds
            }
        });
    } catch (error: any) {
        console.error('❌ [STREAM END] Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota para quando usuário entra na stream - LEGACY
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
        let historyEntry = null;
        try {
            historyEntry = {
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
        } catch (historyError: any) {
            console.warn(`⚠️ Erro ao salvar histórico (mas continuando): ${historyError.message}`);
            // Continuar mesmo se o histórico falhar
        }

        // 4. Atualizar status da stream para offline
        let updatedStream;
        try {
            updatedStream = await Streamer.findOneAndUpdate(
                { id: streamId },
                {
                    isLive: false,
                    endTime: new Date(endTime).toISOString(),
                    streamStatus: 'ended',
                    viewers: 0
                },
                { new: true }
            );
            if (!updatedStream) {
                console.warn(`⚠️ Stream ${streamId} não encontrada para atualizar`);
            }
        } catch (updateError: any) {
            console.warn(`⚠️ Erro ao atualizar stream (mas continuando): ${updateError.message}`);
        }

        // 5. Atualizar status do host
        let updatedUser;
        try {
            const User = await import('../models').then(m => m.User);
            updatedUser = await User.findOneAndUpdate(
                { id: stream.hostId },
                { isLive: false },
                { new: true }
            );
            if (!updatedUser) {
                console.warn(`⚠️ Usuário ${stream.hostId} não encontrado para atualizar`);
            }
        } catch (userError: any) {
            console.warn(`⚠️ Erro ao atualizar usuário (mas continuando): ${userError.message}`);
        }

        // 6. Remover todos os usuários online desta stream
        try {
            const User = await import('../models').then(m => m.User);
            await User.updateMany(
                { currentStreamId: streamId },
                {
                    isOnline: false,
                    currentStreamId: null,
                    lastSeen: new Date().toISOString()
                }
            );
            console.log(`✅ Usuários removidos da stream ${streamId}`);
        } catch (removeError: any) {
            console.warn(`⚠️ Erro ao remover usuários da stream (mas continuando): ${removeError.message}`);
        }

        // 7. Notificar via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(streamId).emit('stream_ended', {
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
        const { userId } = req.query;

        console.log(`🗑️ Removendo card da live ${streamId} pelo usuário ${userId}`);

        // Validar userId
        if (!userId) {
            console.warn(`⚠️ userId não fornecido para remover card ${streamId}`);
            return res.status(400).json({ success: false, error: 'User ID required' });
        }

        // 1. Buscar a stream
        const stream = await Streamer.findOne({ id: streamId });

        if (!stream) {
            console.warn(`⚠️ Stream ${streamId} não encontrada`);
            return res.status(404).json({ success: false, error: 'Stream not found' });
        }

        // 2. Verificar se o usuário é o dono da stream
        if (stream.hostId !== userId) {
            console.warn(`⚠️ Usuário ${userId} não é dono da stream ${streamId} (dono: ${stream.hostId})`);
            return res.status(403).json({ success: false, error: 'Unauthorized: Only stream owner can remove card' });
        }

        // 3. Remover o card (marcar como offline)
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

        const price = gift.price || 0;
        const totalValue = price * (amount || 1);

        if (sender.diamonds < totalValue) {
            return res.status(400).json({ error: 'Insufficient diamonds' });
        }

        let updatedSender;
        let updatedReceiver;

        if (fromUserId === stream.hostId) {
            // Quando a pessoa manda presente pra si mesma, fazemos as duas atualizações (- e +) EM UMA ÚNICA chamada no banco.
            // O erro dos diamantes bugados acontecia porque o sender.save() e o receiver.save() sobrescreviam um ao outro.
            updatedSender = await U.findOneAndUpdate(
                { id: fromUserId },
                { $inc: { diamonds: -totalValue, enviados: totalValue, receptores: totalValue, earnings: totalValue } },
                { new: true }
            );
            updatedReceiver = updatedSender;
            console.log(`💰 [LIVE GIFT] ${updatedSender?.name} enviou ${totalValue} diamantes para si mesmo (duas métricas do mesmo evento)`);
        } else {
            // Se for para outra pessoa, atualiza cada um separado e corretamente
            updatedSender = await U.findOneAndUpdate(
                { id: fromUserId },
                { $inc: { diamonds: -totalValue, enviados: totalValue } },
                { new: true }
            );
            
            if (stream.hostId) {
                updatedReceiver = await U.findOneAndUpdate(
                    { id: stream.hostId },
                    { $inc: { receptores: totalValue, earnings: totalValue } },
                    { new: true }
                );
                console.log(`💰 [LIVE GIFT] ${updatedSender?.name} enviou ${totalValue} diamantes para ${updatedReceiver?.name}`);
            }
        }
        
        if (updatedReceiver) {
            console.log(`📊 [LIVE GIFT] ${updatedReceiver.name} - Receptores: ${updatedReceiver.receptores}, Earnings: ${updatedReceiver.earnings}`);
        }
        
        // Enviar WebSocket em tempo real com valor real
        const io = req.app.get('io');
        if (io && updatedReceiver) {
            // Notificar o RECEPTOR: atualiza earnings e receptores em tempo real
            io.emit('earnings_updated', {
                userId: updatedReceiver.id,
                diamonds: totalValue,
                totalEarnings: updatedReceiver.earnings,
                totalReceptores: updatedReceiver.receptores,
                timestamp: new Date().toISOString(),
                source: 'live_gift',
                streamId: req.params.id,
                fromUser: updatedSender?.name || 'Unknown',
                giftName: giftName
            });
            console.log(`📡 [WEBSOCKET] Earnings atualizados em tempo real para ${updatedReceiver.name}: +${totalValue} diamantes (total earnings: ${updatedReceiver.earnings}, receptores: ${updatedReceiver.receptores})`);
        }
        // Notificar o REMETENTE: atualiza diamonds e enviados em tempo real
        if (io && updatedSender) {
            io.emit('diamonds_updated', {
                userId: updatedSender.id,
                diamonds: updatedSender.diamonds,
                enviados: updatedSender.enviados,
                change: -totalValue,
                timestamp: new Date().toISOString(),
                source: 'gift_sent',
                giftName: giftName
            });
            console.log(`📡 [WEBSOCKET] Diamonds atualizados em tempo real para ${updatedSender.name}: ${updatedSender.diamonds} (enviados: ${updatedSender.enviados})`);
        }

        // Acumular diamantes na stream (não converter para BRL ainda)
        await Streamer.findOneAndUpdate(
            { id: req.params.id },
            {
                $inc: { diamonds: totalValue }
            }
        );

        // Emitir atualização para a sala de transmissão com os 'receptores' reais
        if (io && updatedReceiver) {
            io.emit('live_coins_updated', {
                streamId: req.params.id,
                coins: totalValue,
                totalCoins: updatedReceiver.receptores || 0,
                timestamp: new Date().toISOString(),
                fromUser: updatedSender?.name || 'Unknown',
                giftName: giftName
            });
            console.log(`📡 [WEBSOCKET] live_coins_updated emitido para a sala ${req.params.id} com totalCoins: ${updatedReceiver.receptores}`);
        }

        // Register gift transaction
        await GiftTransaction.create([{
            id: `gift_tx_${Date.now()}_${fromUserId}`,
            fromUserId,
            fromUserName: updatedSender?.name || 'Unknown',
            fromUserAvatar: updatedSender?.avatarUrl || '',
            toUserId: stream.hostId,
            toUserName: updatedReceiver?.name || 'Unknown',
            streamId: req.params.id,
            giftName,
            giftIcon: gift.icon || '🎁',
            giftPrice: price,
            quantity: amount || 1,
            totalValue,
            createdAt: new Date().toISOString()
        }]);

        console.log(`💎 Gift sent: ${giftName} x${amount} from ${updatedSender?.name || 'Unknown'} to stream ${req.params.id} - ${totalValue} diamonds accumulated`);

        res.json({
            success: true,
            updatedSender,
            updatedReceiver: updatedReceiver || {} as any,
            transaction: {
                giftName,
                amount: amount || 1,
                totalValue,
                diamonds: totalValue
            }
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

import { validateStreamKey } from '../middleware/streamAuth';

router.post('/rtc/v1/publish', validateStreamKey, async (req, res) => {
    try {
        const { streamUrl, sdp } = req.body;
        const stream = req.stream; // Stream validada pelo middleware

        console.log(`[PUBLISH] ${stream.hostId} publishing to ${streamUrl}`);
        console.log(`[PUBLISH DEBUG] Stream validated:`, {
            streamId: stream.id,
            hostId: stream.hostId,
            streamKey: stream.streamKey
        });

        const response = await fetch(`${SRS_API_URL}/rtc/v1/publish/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api: `${SRS_API_URL}/rtc/v1/publish/`, streamurl: streamUrl, sdp })
        });

        const data = await response.json();

        // Debug SRS response
        console.log(`[PUBLISH] SRS Response:`, {
            code: data.code,
            hasSdp: !!data.sdp,
            candidates: data.sdp?.match(/a=candidate:.*/g)?.length || 0,
            success: data.code === 0
        });

        res.json(data);
    } catch (err: any) {
        console.error('[PUBLISH Error]', err);
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

// PUT /api/streams/:id/quality - Atualizar qualidade do stream
router.put('/streams/:id/quality', async (req, res) => {
    try {
        const { id: streamId } = req.params;
        const { quality, userId } = req.body;

        console.log(`🎥 [STREAM_QUALITY] Stream: ${streamId}, Quality: ${quality}, User: ${userId}`);

        // 1. Validar se o stream existe
        const streamer = await Streamer.findOne({ id: streamId });
        if (!streamer) {
            console.log(`❌ [STREAM_QUALITY] Stream não encontrado: ${streamId}`);
            return res.status(404).json({
                success: false,
                error: 'Stream não encontrado'
            });
        }

        // 2. Validar se o usuário é o host do stream
        if (streamer.hostId !== userId) {
            console.log(`❌ [STREAM_QUALITY] Usuário não é host: ${userId} != ${streamer.hostId}`);
            return res.status(403).json({
                success: false,
                error: 'Apenas o host pode alterar a qualidade'
            });
        }

        // 3. Validar se a qualidade é válida
        const validQualities = ['360p', '480p', '720p', '1080p'];
        if (!validQualities.includes(quality)) {
            console.log(`❌ [STREAM_QUALITY] Qualidade inválida: ${quality}`);
            return res.status(400).json({
                success: false,
                error: 'Qualidade inválida'
            });
        }

        // 4. Atualizar qualidade no banco de dados
        await Streamer.updateOne(
            { id: streamId },
            { quality: quality }
        );

        console.log(`✅ [STREAM_QUALITY] Qualidade atualizada: ${quality}`);

        // 5. Enviar evento WebSocket para atualizar frontend
        const io = req.app.get('io');
        if (io) {
            io.emit(`stream_${streamId}_quality_updated`, {
                quality,
                streamId,
                userId
            });
            console.log(`📡 [STREAM_QUALITY] Evento WebSocket emitido para stream_${streamId}`);
        }

        res.json({
            success: true,
            message: `Qualidade alterada para ${quality} com sucesso`,
            streamId,
            quality,
            stream: {
                ...streamer.toJSON(),
                quality
            }
        });

    } catch (error) {
        console.error('❌ [STREAM_QUALITY] Erro:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar qualidade do stream'
        });
    }
});

router.post('/lives/start', async (req, res) => res.json({ success: true }));
router.get('/lives/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 [DEBUG] Getting live details for streamer: ${id}`);
        
        // Buscar streamer pelo ID
        const streamer = await Streamer.findOne({ id });
        
        if (!streamer) {
            console.log(`❌ Streamer not found: ${id}`);
            return res.status(404).json({ error: 'Streamer not found' });
        }

        // 🔧 CORREÇÃO: Usar diamonds do stream (valor correto para o contador)
        const finalDiamonds = streamer.diamonds || 0;
        
        console.log(`✅ Streamer found: ${streamer.name}, stream diamonds (contador): ${finalDiamonds}`);
        
        // Retornar dados do streamer incluindo diamonds reais calculados
        res.json({
            id: streamer.id,
            name: streamer.name,
            avatar: streamer.avatar,
            viewers: streamer.viewers,
            diamonds: finalDiamonds, // 🔧 GARANTIR QUE DIAMONDS REAIS SEJA RETORNADO
            isLive: streamer.isLive,
            country: streamer.country,
            location: streamer.location,
            message: streamer.message,
            tags: streamer.tags,
            isPrivate: streamer.isPrivate,
            quality: streamer.quality,
            playbackUrl: streamer.playbackUrl
        });
    } catch (error) {
        console.error('❌ Error getting live details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/lives/:id/end', async (req, res) => {
    await Streamer.deleteOne({ id: req.params.id });

    res.json({ success: true });
});

// GET /api/live/nearby - Streams próximas por localização
router.get('/live/nearby', async (req, res) => {
    try {
        const { latitude, longitude, maxDistance = 50000, limit = 20 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const lat = parseFloat(latitude as string);
        const lng = parseFloat(longitude as string);
        const maxDist = parseInt(maxDistance as string);

        // Buscar streams ativas próximas usando geoLocation do host
        const nearbyStreams = await Streamer.find({
            isLive: true,
            streamStatus: 'active',
            name: { $exists: true, $nin: ['', null] },
            hostId: { $exists: true, $ne: null }
        })
            .populate({
                path: 'hostId',
                select: 'geoLocation name avatarUrl',
                match: {
                    geoLocation: {
                        $near: {
                            $geometry: {
                                type: 'Point',
                                coordinates: [lng, lat]
                            },
                            $maxDistance: maxDist
                        }
                    }
                }
            })
            .limit(parseInt(limit as string));

        // Filtrar streams que têm host com localização próxima
        const validStreams = nearbyStreams.filter(stream => stream.hostId);

        console.log(`📍 [NEARBY STREAMS] ${validStreams.length} streams encontradas próximas a (${lat}, ${lng})`);

        res.json(validStreams);
    } catch (error: any) {
        console.error('Error fetching nearby streams:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/live/following - Streams de usuários que o usuário segue
router.get('/live/following', async (req, res) => {
    try {
        const userId = req.query.userId as string;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Buscar usuário e seus seguidos
        const User = await import('../models').then(m => m.User);
        const user = await User.findOne({ id: userId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Buscar IDs dos usuários que segue
        const followingIds = user.followingList || [];

        if (followingIds.length === 0) {
            return res.json([]);
        }

        // Buscar streams ativas dos usuários que segue
        const followingStreams = await Streamer.find({
            isLive: true,
            streamStatus: 'active',
            hostId: { $in: followingIds },
            name: { $exists: true, $nin: ['', null] }
        })
            .sort({ viewers: -1 });

        console.log(`👥 [FOLLOWING STREAMS] ${followingStreams.length} streams de usuários seguidos por ${userId}`);

        res.json(followingStreams);
    } catch (error: any) {
        console.error('Error fetching following streams:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/live/new - Streams mais recentes
router.get('/live/new', async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        // Buscar streams mais recentes
        const newStreams = await Streamer.find({
            isLive: true,
            streamStatus: 'active',
            name: { $exists: true, $nin: ['', null] },
            startTime: { $exists: true }
        })
            .sort({ startTime: -1 }) // Mais recentes primeiro
            .limit(parseInt(limit as string));

        console.log(`🆕 [NEW STREAMS] ${newStreams.length} streams mais recentes`);

        res.json(newStreams);
    } catch (error: any) {
        console.error('Error fetching new streams:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
