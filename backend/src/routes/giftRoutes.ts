import express from 'express';
import { User, Gift, GiftTransaction, Streamer, Followers } from '../models';

const router = express.Router();

// 🚀 SISTEMA DE FILA PARA TRATAMENTO DE CONCORRÊNCIA
interface QueuedGift {
    id: string;
    fromUserId: string;
    toUserId: string;
    giftId: string;
    quantity: number;
    streamId: string;
    timestamp: number;
    resolve: (value: any) => void;
    reject: (error: any) => void;
}

class GiftQueue {
    private queue: QueuedGift[] = [];
    private processing = false;
    private readonly MAX_CONCURRENT = 5; // Processar até 5 presentes simultaneamente
    private currentProcessing = 0;

    async add(gift: Omit<QueuedGift, 'id' | 'timestamp' | 'resolve' | 'reject'>): Promise<any> {
        return new Promise((resolve, reject) => {
            const queuedGift: QueuedGift = {
                ...gift,
                id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                timestamp: Date.now(),
                resolve,
                reject
            };

            this.queue.push(queuedGift);
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.processing || this.currentProcessing >= this.MAX_CONCURRENT) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0 && this.currentProcessing < this.MAX_CONCURRENT) {
            const gift = this.queue.shift();
            if (gift) {
                this.currentProcessing++;
                this.processGift(gift)
                    .then(gift.resolve)
                    .catch(gift.reject)
                    .finally(() => {
                        this.currentProcessing--;
                        this.processQueue(); // Continuar processando
                    });
            }
        }

        this.processing = false;
    }

    private async processGift(gift: QueuedGift): Promise<any> {
        // Lógica de processamento do presente será implementada aqui
        // Por enquanto, vamos apenas simular o processamento
        console.log(`🔄 [QUEUE] Processando presente ${gift.id} da fila...`);
        return gift;
    }
}

const giftQueue = new GiftQueue();

// Enviar presente
router.post('/send', async (req: any, res) => {
    try {
        const { fromUserId, toUserId, giftId, quantity = 1, streamId } = req.body;
        const io = req.app.get('io');
        
        // Adicionar à fila de processamento
        const result = await giftQueue.add({
            fromUserId,
            toUserId,
            giftId,
            quantity,
            streamId
        });
        
        // Processar o presente
        await processGiftSend(result.fromUserId, result.toUserId, result.giftId, result.quantity, result.streamId, io);
        
        res.json({ 
            success: true, 
            message: 'Presente enviado com sucesso',
            queuedAt: result.timestamp
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao enviar presente:', error);
        res.status(500).json({ error: error.message });
    }
});

// Função principal de processamento de presente
async function processGiftSend(fromUserId: string, toUserId: string, giftId: string, quantity: number, streamId: string, io: any) {
    try {
        console.log(`🎁 [PROCESSING] Iniciando processamento: ${fromUserId} -> ${toUserId} (${quantity}x ${giftId})`);
        
        // Buscar usuários
        const fromUser = await User.findOne({ id: fromUserId });
        const toUser = await User.findOne({ id: toUserId });
        const gift = await Gift.findOne({ id: giftId });
        
        if (!fromUser || !toUser || !gift) {
            throw new Error('Usuário ou presente não encontrado');
        }
        
        // Calcular valor total
        const giftPrice = gift?.price || 0;
        const totalCost = giftPrice * quantity;
        
        // Verificar saldo de diamantes
        if (fromUser.diamonds < totalCost) {
            throw new Error('Saldo insuficiente');
        }
        
        // 🔧 MELHOR PRÁTICA: Atualizar saldos com $inc (atômico)
        await User.findOneAndUpdate(
            { id: fromUserId },
            { 
                $inc: { diamonds: -totalCost, enviados: totalCost },
                $set: { lastSeen: new Date().toISOString() }
            }
        );
        
        // Se for presente para stream, acumular diamantes na stream E no widget da streamer
        if (streamId && streamId !== 'unknown') {
            // Atualizar diamonds da stream com $inc (atômico)
            await Streamer.findOneAndUpdate(
                { id: streamId },
                { $inc: { diamonds: totalCost } },
                { upsert: true } // Criar se não existir
            );
            
            // Atualizar widget da streamer com $inc (atômico)
            await Streamer.findOneAndUpdate(
                { id: toUserId }, 
                { $inc: { diamonds: totalCost } },
                { upsert: true } // Criar se não existir
            );
            
            console.log(`💎 [LIVE GIFT] ${totalCost} diamantes adicionados à live ${streamId} e widget da streamer ${toUserId}.`);
        }

        // 🔧 MELHOR PRÁTICA: Atualizar earnings/receptores com $inc (atômico)
        await User.findOneAndUpdate(
            { id: toUserId },
            { 
                $inc: { earnings: totalCost, receptores: totalCost },
                $set: { lastSeen: new Date().toISOString() }
            },
            { upsert: true } // Criar se não existir
        );
        
        if (!streamId || streamId === 'unknown') {
            console.log(`💰 [DIRECT GIFT] ${totalCost} diamantes adicionados aos earnings/receptores de ${toUser.name}.`);
        } else {
            console.log(`💎 [LIVE GIFT] ${totalCost} diamantes adicionados aos earnings/receptores de ${toUser.name} (stream: ${streamId}).`);
        }
        
        // Emitir WebSocket para atualizar earnings em tempo real (para direct e live gifts)
        if (io) {
            io.emit('earnings_updated', {
                userId: toUserId,
                diamonds: totalCost,
                totalEarnings: toUser.earnings,
                timestamp: new Date().toISOString(),
                source: (!streamId || streamId === 'unknown') ? 'direct_gift' : 'live_gift',
                fromUser: fromUser.name,
                giftName: gift.name,
                streamId: streamId
            });
            
            // 🔧 CORREÇÃO: Atualizar contador da live em tempo real
            if (streamId && streamId !== 'unknown') {
                const updatedStream = await Streamer.findOne({ id: streamId });
                const totalStreamDiamonds = updatedStream?.diamonds || 0;
                
                io.emit('live_coins_updated', {
                    streamId: streamId,
                    coins: totalCost,
                    totalCoins: totalStreamDiamonds,
                    timestamp: new Date().toISOString(),
                    fromUser: fromUser.name,
                    giftName: gift.name
                });
                
                console.log(`🪙 [LIVE COINS] Live ${streamId} atualizada: +${totalCost} = ${totalStreamDiamonds} total`);
            }
        }
        
        console.log(`💰 [GIFT] ${fromUser.name} enviou ${totalCost} diamantes para ${toUser.name}`);
        console.log(`📊 [GIFT] ${toUser.name} - Receptores: ${toUser.receptores}, Earnings: ${toUser.earnings}`);
        
        // Salvar ambos os usuários no banco
        await fromUser.save();
        await toUser.save();
        
        // Registrar transação com upsert automático
        const transactionId = `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await GiftTransaction.findOneAndUpdate(
            { id: transactionId },
            {
                id: transactionId,
                fromUserId,
                fromUserName: fromUser.name,
                fromUserAvatar: fromUser.avatarUrl,
                toUserId,
                toUserName: toUser.name,
                streamId: streamId || 'unknown',
                giftName: gift.name,
                giftIcon: gift.icon,
                giftPrice: giftPrice,
                quantity: quantity,
                totalValue: totalCost,
                createdAt: new Date().toISOString()
            },
            { 
                upsert: true, // Criar se não existir
                new: true
            }
        );
        
        // 🚀 SISTEMA DE BROADCAST EM TEMPO REAL - PRESENTES NA LIVE
        if (io) {
            // 1. Broadcast principal para todos na sala da live (prioridade máxima)
            if (streamId && streamId !== 'unknown') {
                // Evento principal: presente recebido na live
                io.to(streamId).emit('live_gift_received', {
                    fromUser: {
                        id: fromUserId,
                        name: fromUser.name,
                        avatarUrl: fromUser.avatarUrl,
                        level: fromUser.level || 1
                    },
                    toUser: {
                        id: toUserId,
                        name: toUser.name,
                        avatarUrl: toUser.avatarUrl
                    },
                    gift: {
                        id: gift.id,
                        name: gift.name,
                        icon: gift.icon,
                        price: giftPrice,
                        rarity: (gift as any).rarity || 'common',
                        animation: (gift as any).animation || null
                    },
                    quantity: quantity,
                    totalValue: totalCost,
                    streamId: streamId,
                    timestamp: new Date().toISOString(),
                    eventId: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
                });
                
                console.log(`📡 [LIVE BROADCAST] Presente broadcastado para ${streamId}: ${fromUser.name} -> ${toUser.name} (${quantity}x ${gift.name})`);
                
                // 2. Atualizar contador de diamantes da live
                const updatedStream = await Streamer.findOne({ id: streamId });
                const totalStreamDiamonds = updatedStream?.diamonds || 0;
                
                io.to(streamId).emit('live_coins_updated', {
                    streamId: streamId,
                    coins: totalCost,
                    totalCoins: totalStreamDiamonds,
                    timestamp: new Date().toISOString(),
                    fromUser: fromUser.name,
                    giftName: gift.name
                });
                
                // 3. Atualizar modal de presentes da live
                io.to(streamId).emit('gift_sent_to_stream', {
                    streamId,
                    gift: {
                        fromUserId,
                        fromUserName: fromUser.name,
                        fromUserAvatar: fromUser.avatarUrl,
                        giftName: gift.name,
                        giftIcon: gift.icon,
                        giftPrice: giftPrice,
                        quantity,
                        totalValue: totalCost
                    },
                    timestamp: new Date().toISOString()
                });
            }
            
            // 4. Notificação pessoal para o destinatário
            io.to(`user_${toUserId}`).emit('gift_received', {
                from: {
                    id: fromUser.id,
                    name: fromUser.name,
                    avatarUrl: fromUser.avatarUrl
                },
                gift: {
                    id: gift.id,
                    name: gift.name,
                    icon: gift.icon,
                    price: giftPrice
                },
                quantity: quantity,
                totalValue: totalCost,
                streamId,
                timestamp: new Date().toISOString()
            });
            
            // 5. Atualização global de earnings
            io.emit('earnings_updated', {
                userId: toUserId,
                diamonds: totalCost,
                totalEarnings: toUser.earnings + totalCost,
                timestamp: new Date().toISOString(),
                source: (!streamId || streamId === 'unknown') ? 'direct_gift' : 'live_gift',
                fromUser: fromUser.name,
                giftName: gift.name,
                streamId: streamId
            });
            
            // 6. Atualização de diamantes do remetente
            io.emit('diamonds_updated', {
                userId: fromUserId,
                diamonds: fromUser.diamonds - totalCost,
                change: -totalCost,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`🎁 Presente enviado: ${fromUser.name} -> ${toUser.name} (${quantity}x ${gift.name} = ${totalCost} diamantes)`);
        
        return {
            success: true,
            fromUser: { id: fromUser.id, diamonds: fromUser.diamonds },
            toUser: { id: toUser.id, earnings: toUser.earnings },
            transaction: {
                quantity,
                totalCost,
                diamonds: totalCost
            }
        };
        
    } catch (error: any) {
        console.error('❌ Erro ao processar presente:', error);
        throw error;
    }
}

// Listar presentes enviados em uma live específica
router.get('/stream/:streamId', async (req, res) => {
    try {
        const { streamId } = req.params;
        const { limit = 50 } = req.query;
        
        // Buscar transações de presentes para esta live
        const gifts = await GiftTransaction.find({ 
            streamId: streamId,
            fromUserId: { $ne: '65384127' } // Excluir auto-presentes do streamer
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .lean();
        
        if (gifts.length === 0) {
            return res.json({
                success: true,
                gifts: [],
                message: 'Ninguém enviou presentes nesta live ainda'
            });
        }
        
        // Agrupar por usuário para mostrar total de presentes por pessoa
        const usersGifts = gifts.reduce((acc: any, gift) => {
            const userId = gift.fromUserId;
            if (!acc[userId]) {
                acc[userId] = {
                    userId: gift.fromUserId,
                    userName: gift.fromUserName,
                    userAvatar: gift.fromUserAvatar,
                    gifts: [],
                    totalValue: 0,
                    totalDiamonds: 0
                };
            }
            
            acc[userId].gifts.push({
                id: gift.id,
                giftName: gift.giftName,
                giftIcon: gift.giftIcon,
                giftPrice: gift.giftPrice,
                quantity: gift.quantity,
                totalValue: gift.totalValue,
                timestamp: gift.createdAt
            });
            
            acc[userId].totalValue += gift.totalValue;
            acc[userId].totalDiamonds += gift.giftPrice * gift.quantity;
            
            return acc;
        }, {});
        
        const result = Object.values(usersGifts);
        
        console.log(`📋 [GIFTS LIST] ${gifts.length} presentes encontrados para stream ${streamId} de ${result.length} usuários diferentes`);
        
        res.json({
            success: true,
            gifts: result,
            totalUsers: result.length,
            totalGifts: gifts.length,
            totalValue: result.reduce((sum: number, user: any) => sum + user.totalValue, 0)
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao listar presentes da live:', error);
        res.status(500).json({ error: error.message });
    }
});

// Notificar quando usuário entra ao vivo
router.post('/notify-live-start', async (req, res) => {
    try {
        const { userId, streamId, streamName } = req.body;
        
        // Buscar usuário
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Buscar seguidores
        const followers = await Followers.find({ followingId: userId });
        
        // Enviar notificações para todos os seguidores
        const io = req.app.get('io');
        if (io) {
            followers.forEach(follower => {
                io.to(`user_${follower.followerId}`).emit('notification', {
                    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${follower.followerId}`,
                    userId: follower.followerId,
                    type: 'user_live',
                    message: `${user.name} entrou ao vivo!`,
                    data: {
                        streamerId: userId,
                        streamerName: user.name,
                        streamId,
                        streamName,
                        avatarUrl: user.avatarUrl
                    },
                    timestamp: new Date().toISOString(),
                    read: false
                });
                
                io.to(`user_${follower.followerId}`).emit('unread_notification', {
                    userId: follower.followerId,
                    count: 1,
                    timestamp: new Date().toISOString()
                });
            });
        }
        
        console.log(`🔔 Notificações enviadas para ${followers.length} seguidores de ${user.name}`);
        
        res.json({ 
            success: true, 
            message: 'Notificações enviadas',
            followersCount: followers.length 
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao notificar live:', error);
        res.status(500).json({ error: error.message });
    }
});

// Buscar streams ativas dos usuários seguidos
router.get('/following-lives/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Buscar seguidores
        const followers = await Followers.find({ followingId: userId });
        const followingIds = followers.map(f => f.followerId);
        
        // Buscar streams ativas desses usuários
        const activeStreams = await Streamer.find({ 
            hostId: { $in: followingIds },
            isLive: true 
        }).sort({ viewers: -1 });
        
        console.log(`📺 Buscando ${activeStreams.length} lives de usuários seguidos por ${userId}`);
        
        res.json({
            success: true,
            streams: activeStreams,
            count: activeStreams.length
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao buscar lives seguidas:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
