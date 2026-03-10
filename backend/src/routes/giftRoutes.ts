import express from 'express';
import { User, Gift, GiftTransaction, Streamer, Followers } from '../models';
import { calculateNetEarnings } from '../utils/diamondConversion';

const router = express.Router();

// Enviar presente
router.post('/send', async (req, res) => {
    try {
        const { fromUserId, toUserId, giftId, streamId, quantity = 1 } = req.body;
        
        // Buscar usuários
        const fromUser = await User.findOne({ id: fromUserId });
        const toUser = await User.findOne({ id: toUserId });
        const gift = await Gift.findOne({ id: giftId });
        
        if (!fromUser || !toUser || !gift) {
            return res.status(404).json({ error: 'Usuário ou presente não encontrado' });
        }
        
        // Calcular valor total
        const giftPrice = gift?.price || 0;
        const totalCost = giftPrice * quantity;
        
        // Verificar saldo de diamantes
        if (fromUser.diamonds < totalCost) {
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }
        
        // Atualizar saldos
        fromUser.diamonds -= totalCost;
        await fromUser.save();
        
        // Calcular earnings em BRL e aplicar desconto de 20% da plataforma
        const { gross: grossEarnings, platformFee, net: netEarnings } = calculateNetEarnings(totalCost);
        
        // Atualizar earnings do receptor em dinheiro (BRL)
        toUser.earnings = (toUser.earnings || 0) + netEarnings;
        await toUser.save();
        
        // Registrar transação
        await GiftTransaction.create([{
            id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        }]);
        
        // Enviar notificações via WebSocket
        const io = req.app.get('io');
        
        // 🚀 VERIFICAR SE O PRESENTE LIBERA ACESSO À SALA PRIVADA
        if (streamId && streamId !== 'unknown') {
            const streamer = await Streamer.findOne({ id: streamId });
            
            if (streamer && streamer.privateGiftId && streamer.privateGiftId === giftId) {
                console.log(`🔑 [PRIVATE ROOM] Presente correto enviado! GiftId: ${giftId} - Streamer: ${streamer.hostId}`);
                
                // Enviar convite para sala privada via WebSocket
                if (io) {
                    io.to(`user_${toUserId}`).emit('private_room_invite', {
                        fromUserId: fromUserId,
                        fromUserName: fromUser.name,
                        fromUserAvatar: fromUser.avatarUrl,
                        streamId: streamId,
                        giftId: giftId,
                        giftName: gift.name,
                        giftIcon: gift.icon,
                        message: `${fromUser.name} enviou ${gift.name} e ganhou acesso à sala privada!`,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Notificar o usuário que enviou o presente
                    io.to(`user_${fromUserId}`).emit('private_room_access_granted', {
                        streamId: streamId,
                        streamerName: toUser.name,
                        giftName: gift.name,
                        message: `Você ganhou acesso à sala privada de ${toUser.name}!`,
                        timestamp: new Date().toISOString()
                    });
                    
                    console.log(`✅ [PRIVATE ROOM] Convite enviado para ${fromUserId} e notificação para ${toUserId}`);
                }
            } else if (streamer && streamer.privateGiftId) {
                console.log(`🚫 [PRIVATE ROOM] Presente incorreto. Enviado: ${giftId}, Necessário: ${streamer.privateGiftId}`);
            }
        }
        
        // Enviar notificações via WebSocket
        if (io) {
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
                streamId,
                timestamp: new Date().toISOString()
            });
            
            // Enviar notificação de presente recebido
            io.to(`user_${toUserId}`).emit('notification', {
                id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: toUserId,
                type: 'gift_received',
                message: `${fromUser.name} enviou ${gift.name} para você!`,
                data: {
                    fromUserId,
                    fromUserName: fromUser.name,
                    giftName: gift.name,
                    giftIcon: gift.icon,
                    streamId
                },
                timestamp: new Date().toISOString(),
                read: false
            });
            
            // Atualizar contador de não lidas
            io.to(`user_${toUserId}`).emit('unread_notification', {
                userId: toUserId,
                count: 1,
                timestamp: new Date().toISOString()
            });
            
            // Se estiver em live, atualizar presentes recebidos na stream
            if (streamId) {
                io.to(`stream_${streamId}`).emit('gift_sent_in_stream', {
                    fromUserId,
                    fromUserName: fromUser.name,
                    toUserId,
                    toUserName: toUser.name,
                    gift: {
                        id: gift.id,
                        name: gift.name,
                        icon: gift.icon,
                        price: giftPrice
                    },
                    quantity: quantity,
                    totalValue: totalCost,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Atualizar diamantes em tempo real
            io.emit('diamonds_updated', {
                userId: fromUserId,
                diamonds: fromUser.diamonds,
                change: -totalCost,
                timestamp: new Date().toISOString()
            });
            
            // Atualizar earnings em tempo real
            io.emit('earnings_updated', {
                userId: toUserId,
                earnings: toUser.earnings,
                change: netEarnings,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`🎁 Presente enviado: ${fromUser.name} -> ${toUser.name} (${quantity}x ${gift.name} = ${totalCost} diamantes) - Gross: R$${grossEarnings.toFixed(2)}, Net: R$${netEarnings.toFixed(2)} (Platform fee: R$${platformFee.toFixed(2)})`);
        
        res.json({ 
            success: true, 
            message: 'Presente enviado com sucesso',
            fromUser: { id: fromUser.id, diamonds: fromUser.diamonds },
            toUser: { id: toUser.id, earnings: toUser.earnings },
            transaction: {
                quantity,
                totalCost,
                grossEarnings,
                platformFee,
                netEarnings
            }
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao enviar presente:', error);
        res.status(500).json({ error: error.message });
    }
});

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
