import express from 'express';
import { Gift, GiftTransaction, Streamer, User, StreamSession, LiveNotification } from '../models';

const router = express.Router();

router.get('/gifts', async (req, res) => {
    res.json(await Gift.find());
});

router.get('/gifts/category/:category', async (req, res) => {
    try {
        const category = req.params.category;
        
        console.log(`🔍 Buscando presentes da categoria: ${category}`);
        
        // Buscar presentes por categoria no banco de dados
        const gifts = await Gift.find({ category: category });
        console.log(`✅ Encontrados ${gifts.length} presentes na categoria ${category}`);
        
        res.json(gifts);
    } catch (error: any) {
        console.error('❌ Erro ao buscar presentes por categoria:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/gifts/received/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        console.log(`🔍 Buscando presentes recebidos pelo usuário: ${userId}`);
        
        // Buscar todas as transações de presentes recebidas pelo usuário
        const transactions = await GiftTransaction.find({ toUserId: userId });
        
        // Agrupar por presente e contar quantidades
        const giftsMap = new Map();
        
        transactions.forEach((transaction: any) => {
            const giftKey = transaction.giftName;
            if (giftsMap.has(giftKey)) {
                const existing = giftsMap.get(giftKey);
                existing.count += transaction.quantity;
            } else {
                giftsMap.set(giftKey, {
                    name: transaction.giftName,
                    icon: transaction.giftIcon,
                    price: transaction.giftPrice,
                    count: transaction.quantity,
                    category: 'Galeria', // Todos os presentes recebidos ficam na galeria
                    component: null,
                    fromUsers: [transaction.fromUserName]
                });
            }
        });
        
        const receivedGifts = Array.from(giftsMap.values());
        console.log(`✅ Encontrados ${receivedGifts.length} tipos de presentes recebidos`);
        
        res.json(receivedGifts);
    } catch (error: any) {
        console.error('❌ Erro ao buscar presentes recebidos:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/regions', async (req, res) => {
    try {
        // Regiões disponíveis
        const regions = [
            { name: 'Global', code: 'ICON_GLOBE' },
            { name: '🇧🇷 Brasil', code: 'br' },
            { name: '🇺🇸 Estados Unidos', code: 'us' },
            { name: '🇦🇷 Argentina', code: 'ar' },
            { name: '🇲🇽 México', code: 'mx' },
            { name: '🇨🇴 Colômbia', code: 'co' },
            { name: '🇪🇸 Espanha', code: 'es' },
            { name: '🇮🇹 Itália', code: 'it' },
            { name: '🇫🇷 França', code: 'fr' },
            { name: '🇩🇪 Alemanha', code: 'de' },
            { name: '🇬🇧 Reino Unido', code: 'gb' },
            { name: '🇨🇦 Canadá', code: 'ca' },
            { name: '🇵🇹 Portugal', code: 'pt' }
        ];
        
        // Adicionar contagem de lives ao vivo por região
        const regionsWithCount = await Promise.all(
            regions.map(async (region) => {
                const count = await Streamer.countDocuments({ country: region.code, isLive: true });
                
                return { ...region, liveCount: count };
            })
        );
        
        res.json(regionsWithCount);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/feed/photos - Upload de foto no feed
router.post('/feed/photos', async (req, res) => {
    try {
        const { userId, photoUrl, caption, tags, isPublic = true } = req.body;
        
        if (!userId || !photoUrl) {
            return res.status(400).json({ error: 'userId e photoUrl são obrigatórios' });
        }
        
        // Verificar se usuário existe
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Importar modelo de foto se existir, ou criar coleção simples
        const Photo = require('../models').Photo || require('mongoose').model('Photo');
        
        // Criar registro da foto no feed
        const photo = await Photo.create({
            id: `feed_photo_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            userId,
            photoUrl,
            caption: caption || '',
            tags: tags || [],
            isPublic,
            likes: 0,
            comments: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        // Notificar via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.emit('new_feed_photo', {
                photoId: photo.id,
                userId,
                userName: user.name,
                userAvatar: user.avatarUrl,
                photoUrl,
                caption,
                timestamp: new Date()
            });
        }
        
        console.log(`📸 Foto adicionada ao feed por ${userId}: ${photo.id}`);
        
        res.json({
            success: true,
            photo: {
                id: photo.id,
                userId: photo.userId,
                photoUrl: photo.photoUrl,
                caption: photo.caption,
                tags: photo.tags,
                isPublic: photo.isPublic,
                likes: photo.likes,
                comments: photo.comments,
                createdAt: photo.createdAt
            },
            user: {
                id: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl
            }
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao adicionar foto ao feed:', error);
        res.status(500).json({ error: 'Erro interno ao adicionar foto ao feed' });
    }
});

router.get('/reminders', async (req, res) => {
    try {
        // Reminders são usuários que estão ao vivo e seguidos pelo usuário atual
        const token = req.headers.authorization?.replace('Bearer ', '');
        let userId: string | null = null;
        
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
            } catch {
                // Token inválido
            }
        }
        
        // Se não houver usuário logado ou se não seguir ninguém, retornar usuários ao vivo aleatórios
        if (!userId) {
            const liveUsers = await User.find({ isLive: true }).limit(10);
            return res.json(liveUsers);
        }

        // Buscar usuários que o usuário atual segue e que estão ao vivo
        const currentUser = await User.findOne({ id: userId });
        if (!currentUser || !currentUser.followingList || currentUser.followingList.length === 0) {
            const liveUsers = await User.find({ isLive: true }).limit(10);
            return res.json(liveUsers);
        }
        
        const followedLiveUsers = await User.find({
            id: { $in: currentUser.followingList },
            isLive: true
        }).limit(10);
        
        res.json(followedLiveUsers);
    } catch (error: any) {
        console.error('Error getting reminders:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/ranking/:period', async (req, res) => {
    try {
        const period = req.params.period;
        console.log('🏆 Buscando ranking real para período:', period);
        
        // Para ranking "Ao vivo", usar dados da sessão atual
        if (period === 'live' || period === 'Ao vivo') {
            // Buscar streams ativos e suas sessões
            const activeStreams = await Streamer.find({ isLive: true });
            
            if (!activeStreams || activeStreams.length === 0) {
                console.log('ℹ️ Nenhuma stream ativa encontrada');
                return res.json([]);
            }
            
            // Para cada stream ativa, buscar dados da sessão
            const liveRanking = [];
            
            for (const stream of activeStreams) {
                const session = await StreamSession.findOne({ streamId: stream.id });
                
                if (session && session.giftsReceived > 0) {
                    // Buscar dados do streamer
                    const streamer = await User.findOne({ id: stream.hostId });
                    
                    if (streamer) {
                        const streamerObj = streamer.toObject ? streamer.toObject() : streamer;
                        liveRanking.push({
                            ...streamerObj,
                            contribution: session.giftsReceived, // Presentes recebidos na live atual
                            streamId: stream.id,
                            streamTitle: stream.message, // Usar message em vez de title
                            viewers: session.viewers || 0,
                            rank: liveRanking.length + 1
                        });
                    }
                }
            }
            
            // Ordenar por número de presentes recebidos
            liveRanking.sort((a, b) => b.contribution - a.contribution);
            
            console.log(`✅ ${liveRanking.length} streamers no ranking Ao vivo`);
            return res.json(liveRanking);
        }
        
        // Para outros períodos, usar transações de presentes
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;
        
        switch(period) {
            case 'daily':
            case 'Diária':
                // Hoje (meia-noite até agora)
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'weekly':
            case 'Semanal':
                // Esta semana (domingo até agora)
                const dayOfWeek = now.getDay();
                startDate = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'monthly':
            case 'Mensal':
                // Este mês (dia 1 até agora)
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                console.warn('⚠️ Período não reconhecido:', period);
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        
        // Buscar transações de presentes reais no período
        const giftTransactions = await GiftTransaction.find({
            createdAt: {
                $gte: startDate.toISOString(),
                $lte: endDate.toISOString()
            }
        }).sort({ totalValue: -1 });
        
        console.log(`📊 Encontradas ${giftTransactions.length} transações de presentes`);
        
        // Se não houver transações, retornar array vazio
        if (!giftTransactions || giftTransactions.length === 0) {
            console.log('ℹ️ Nenhuma transação encontrada para este período');
            return res.json([]);
        }
        
        // Agrupar transações por usuário e calcular contribuições
        const userContributions = new Map<string, {
            totalValue: number;
            transactionCount: number;
            userId: string;
        }>();
        
        giftTransactions.forEach((transaction: any) => {
            const userId = transaction.toUserId; // Quem recebeu o presente
            
            if (!userContributions.has(userId)) {
                userContributions.set(userId, {
                    totalValue: 0,
                    transactionCount: 0,
                    userId: userId
                });
            }
            
            const contribution = userContributions.get(userId)!;
            contribution.totalValue += transaction.totalValue || 0;
            contribution.transactionCount += 1;
        });
        
        // Converter para array e ordenar por maior contribuição
        const rankingArray = Array.from(userContributions.values())
            .sort((a, b) => b.totalValue - a.totalValue);
        
        // Buscar dados completos dos usuários do ranking
        const userIds = rankingArray.map(c => c.userId);
        const users = await User.find({ id: { $in: userIds } });
        
        // Mapear usuários para lookup rápido
        const userMap = new Map();
        users.forEach((user: any) => {
            userMap.set(user.id, user);
        });
        
        // Montar ranking final com dados reais dos usuários
        const validUsers = rankingArray.map((contribution, index) => {
            const user = userMap.get(contribution.userId);
            if (!user) {
                console.warn(`⚠️ Usuário ${contribution.userId} não encontrado no banco`);
                return null;
            }
            
            const userObj = user.toObject ? user.toObject() : user;
            return {
                ...userObj,
                contribution: contribution.totalValue, // Usar o totalValue exato DESTA SESSÃO/DIÁRIA
                transactionCount: contribution.transactionCount, // Número de transações
                rank: index + 1, // Posição no ranking
            };
        }).filter(user => user !== null); // Remover usuários não encontrados
        
        console.log(`✅ ${validUsers.length} usuários no ranking real ${period}`);
        res.json(validUsers);
    } catch (error: any) {
        console.error('❌ Erro ao buscar ranking real:', error);
        // Sempre retornar array vazio em caso de erro
        res.json([]);
    }
});

// Rotas de notificações
router.get('/notifications', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        let userId: string | null = null;
        
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
            } catch {
                // Token inválido
            }
        }
        
        if (!userId) {
            return res.json([]);
        }

        // Buscar notificações do usuário
        const notifications = await LiveNotification.find({ userId }).sort({ createdAt: -1 }).limit(50);
        res.json(notifications);
    } catch (error: any) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

router.patch('/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        
        const notification = await LiveNotification.findOneAndUpdate(
            { _id: id },
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/notifications/start-live', async (req, res) => {
    try {
        const { streamId } = req.body;
        
        if (!streamId) {
            return res.status(400).json({ error: 'Stream ID is required' });
        }
        
        // Buscar informações do stream
        const stream = await Streamer.findOne({ id: streamId });
        if (!stream) {
            return res.status(404).json({ error: 'Stream not found' });
        }
        
        // Notificar seguidores do streamer
        const streamer = await User.findOne({ id: stream.hostId });
        if (streamer && streamer.followingList && streamer.followingList.length > 0) {
            const notifications = streamer.followingList.map((followerId: string) => ({
                userId: followerId,
                type: 'live_started',
                message: `${streamer.name} iniciou uma live: ${stream.name || 'Ao Vivo'}`,
                streamId: stream.id,
                isRead: false,
                createdAt: new Date()
            }));
            
            await LiveNotification.insertMany(notifications);
            
            return res.json({ 
                success: true, 
                notificationsCreated: notifications.length 
            });
        }
        
        res.json({ success: true, notificationsCreated: 0 });
    } catch (error: any) {
        console.error('Error creating live notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stream History - usando PurchaseRecord como base
router.get('/history/streams', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        let userId: string | null = null;
        
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
            } catch {
                // Token inválido
            }
        }
        
        if (!userId) {
            return res.json([]);
        }

        // Buscar streams finalizados do usuário
        const streamHistory = await StreamSession.find({ userId })
            .sort({ endedAt: -1 })
            .limit(20)
            .populate('userId', 'name avatar');
        
        res.json(streamHistory);
    } catch (error: any) {
        console.error('Error getting stream history:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/history/streams', async (req, res) => {
    try {
        const streamData = req.body;
        
        // Criar registro de histórico de stream
        const streamHistory = new StreamSession({
            userId: streamData.userId,
            streamId: streamData.streamId,
            title: streamData.title,
            startedAt: streamData.startedAt || new Date(),
            endedAt: streamData.endedAt || new Date(),
            duration: streamData.duration,
            viewers: streamData.viewers || 0,
            gifts: streamData.gifts || 0,
            diamonds: streamData.diamonds || 0
        });
        
        await streamHistory.save();
        res.json({ success: true, streamHistory });
    } catch (error: any) {
        console.error('Error saving stream history:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
