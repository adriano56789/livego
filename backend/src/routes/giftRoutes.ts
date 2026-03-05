import express from 'express';
import { User, Gift, GiftTransaction, Streamer, Followers } from '../models';
import { getIO } from '../server';

const router = express.Router();
const io = getIO();

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
        
        // Atualizar earnings do receptor (conversão: 1 diamante = R$ 0.10)
        const earningsInBRL = totalCost * 0.10;
        toUser.earnings = (toUser.earnings || 0) + earningsInBRL;
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
        
        // Enviar notificação via WebSocket
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
            change: earningsInBRL,
            timestamp: new Date().toISOString()
        });
        
        console.log(`🎁 Presente enviado: ${fromUser.name} -> ${toUser.name} (${quantity}x ${gift.name} = R$${earningsInBRL.toFixed(2)})`);
        
        res.json({ 
            success: true, 
            message: 'Presente enviado com sucesso',
            fromUser: { id: fromUser.id, diamonds: fromUser.diamonds },
            toUser: { id: toUser.id, earnings: toUser.earnings },
            transaction: {
                quantity,
                totalCost,
                earningsInBRL
            }
        });
        
    } catch (error: any) {
        console.error('❌ Erro ao enviar presente:', error);
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
