import express from 'express';
import { Message, User, Photo } from '../models';

const router = express.Router();

router.get('/presents/live/:id', async (req, res) => res.json([]));
router.post('/streams/:id/private-invite', async (req, res) => res.json({ success: true }));
router.get('/streams/:id/access-check', async (req, res) => res.json({ canJoin: true }));
router.post('/friends/invite', async (req, res) => res.json({ success: true }));
router.post('/streams/:id/interactions', async (req, res) => res.json({ success: true }));

router.post('/invitations/send', async (req, res) => res.json({ success: true }));
router.get('/invitations/received', async (req, res) => res.json([]));
router.get('/rooms/:id', async (req, res) => {
    // In a real scenario, this gets Room/Streamer by ID
    const room = await import('../models').then(m => m.Streamer).then(S => S.findOne({ id: req.params.id }));
    res.json(room || {});
});
router.post('/rooms/:id/join', async (req, res) => {
    // Basic permissions logic simulation
    res.json({ success: true, canJoin: true });
});
router.get('/rooms', async (req, res) => {
    const rooms = await import('../models').then(m => m.Streamer).then(S => S.find());
    res.json(rooms);
});

router.get('/streams/:id/messages', async (req, res) => {
    res.json(await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 }));
});

router.get('/feed/photos', async (req, res) => {
    try {
        // Fetch photos and populate user details manually based on userId
        const photos = await Photo.find().sort({ createdAt: -1 }).limit(50);

        const userIds = [...new Set(photos.map(p => p.userId))];
        const users = await User.find({ id: { $in: userIds } });
        const userMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {} as Record<string, any>);

        const photosWithUsers = photos.map(photo => {
            const photoJson = photo.toJSON();
            return {
                ...photoJson,
                photoUrl: photoJson.url, // Map url to photoUrl as expected by frontend
                user: userMap[photoJson.userId] || { id: photoJson.userId, name: 'UnknownUser', avatarUrl: '' }
            };
        });

        res.json(photosWithUsers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/photos/:id/like', async (req, res) => {
    try {
        const userId = req.body.userId || '10755083'; // TODO dynamically get userId
        const photoId = req.params.id;

        const photo = await Photo.findOne({ id: photoId });
        if (!photo) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        let newLikes = photo.likes || 0;
        let isLiked = false;

        // Simple toggle logic since we don't have a likes table yet
        // In a real scenario we would check `Like` collection mapping userId to photoId
        // We'll invert the provided value or assume a +1 action.
        if (req.body.action === 'unlike') {
            newLikes = Math.max(0, newLikes - 1);
            isLiked = false;
        } else {
            newLikes += 1;
            isLiked = true;
        }

        photo.likes = newLikes;
        await photo.save();

        res.json({ success: true, likes: newLikes, isLiked });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/photos/upload', async (req, res) => {
    try {
        const { userId, photoUrl, description } = req.body;

        if (!userId || !photoUrl) {
            return res.status(400).json({ error: 'Missing userId or photoUrl' });
        }

        const newPhoto = await Photo.create({
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            userId,
            url: photoUrl,
            caption: description || '',
            likes: 0,
            isLiked: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json({ success: true, photo: newPhoto });
    } catch (error: any) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/visitors/list/:id', async (req, res) => {
    // Mock visitors from User DB
    const users = await User.find().limit(5);
    res.json(users);
});
router.delete('/visitors/clear/:id', async (req, res) => res.json({ success: true }));
router.get('/chats/:id/messages', async (req, res) => {
    try {
        const otherUserId = req.params.id;
        const currentUser = { id: '10755083' }; // Usuário fixo para demonstração

        // Garantir que ambos os usuários existam
        const models = await import('../models');

        // Criar usuário de suporte se não existir
        if (otherUserId === 'support-livercore') {
            let supportUser = await models.User.findOne({ id: 'support-livercore' });
            if (!supportUser) {
                console.log('🔧 Criando usuário de suporte para chat');
                supportUser = await models.User.create({
                    id: 'support-livercore',
                    name: 'Support',
                    avatarUrl: 'https://picsum.photos/seed/support/200/200.jpg',
                    diamonds: 0,
                    level: 1,
                    xp: 0,
                    fans: 0,
                    following: 0,
                    isOnline: true,
                    lastSeen: new Date().toISOString()
                });
            }
        }

        // Criar chatKey consistente (ordem alfabética para garantir o mesmo chatId)
        const userIds = [currentUser.id, otherUserId].sort();
        const chatKey = `chat_${userIds[0]}_${userIds[1]}`;

        console.log(`🔍 Buscando mensagens para chatKey: ${chatKey}`);

        let messages = await Message.find({ chatId: chatKey }).sort({ createdAt: 1 });

        // Se não houver mensagens, criar mensagens de boas-vindas
        if (messages.length === 0) {
            console.log(`📝 Criando mensagens iniciais para chatKey: ${chatKey}`);

            const welcomeMessages = [
                {
                    id: Date.now().toString(),
                    chatId: chatKey,
                    from: currentUser.id,
                    to: otherUserId,
                    text: `Olá! Precisa de ajuda com a plataforma? 😊`,
                    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min atrás
                    status: 'delivered'
                },
                {
                    id: (Date.now() + 1).toString(),
                    chatId: chatKey,
                    from: otherUserId,
                    to: currentUser.id,
                    text: `Olá! Sou o suporte da LiveGo. Como posso ajudar você? 🎥`,
                    timestamp: new Date(Date.now() - 240000).toISOString(), // 4 min atrás
                    status: 'delivered'
                },
                {
                    id: (Date.now() + 2).toString(),
                    chatId: chatKey,
                    from: currentUser.id,
                    to: otherUserId,
                    text: `Estou testando o chat individual! 🚀`,
                    timestamp: new Date(Date.now() - 180000).toISOString(), // 3 min atrás
                    status: 'read'
                }
            ];

            await Message.insertMany(welcomeMessages);
            messages = await Message.find({ chatId: chatKey }).sort({ createdAt: 1 });
        }

        console.log(`📝 Encontradas ${messages.length} mensagens`);

        res.json(messages);
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        res.json([]); // Retornar array vazio em caso de erro
    }
});

router.put('/streams/:id/quality', async (req, res) => res.json({ success: true, stream: {} }));
router.post('/streams/:id/toggle-mic', async (req, res) => res.json({}));
router.post('/streams/:id/toggle-sound', async (req, res) => res.json({}));
router.post('/streams/:id/toggle-auto-follow', async (req, res) => res.json({}));
router.post('/streams/:id/toggle-auto-invite', async (req, res) => res.json({}));

const avatarFrames: Record<string, { price: number, durationDays: number, name: string }> = {
    'FrameDiamondIcon': { price: 500, durationDays: 7, name: 'Diamond' },
    'FrameNeonPinkIcon': { price: 750, durationDays: 7, name: 'Neon Pink' },
    'FrameFloralWreathIcon': { price: 1000, durationDays: 14, name: 'Floral Wreath' },
    'FramePinkGemIcon': { price: 1250, durationDays: 14, name: 'Pink Gem' },
    'FrameGoldenFloralIcon': { price: 1500, durationDays: 30, name: 'Golden Floral' },
    'FramePurpleFloralIcon': { price: 2000, durationDays: 30, name: 'Purple Floral' },
    'FrameBlueCrystalIcon': { price: 1750, durationDays: 21, name: 'Blue Crystal' },
    'FrameBlueFireIcon': { price: 1600, durationDays: 21, name: 'Blue Fire' },
    'FrameSilverThornIcon': { price: 1800, durationDays: 21, name: 'Silver Thorn' },
    'FrameNeonDiamondIcon': { price: 2200, durationDays: 45, name: 'Neon Diamond' },
    'FrameRoseHeartIcon': { price: 2500, durationDays: 45, name: 'Rose Heart' },
    'FrameOrnateBronzeIcon': { price: 1900, durationDays: 21, name: 'Ornate Bronze' },
    'FramePinkLaceIcon': { price: 2000, durationDays: 30, name: 'Pink Lace' },
    'FrameMagentaWingsIcon': { price: 2400, durationDays: 45, name: 'Magenta Wings' },
    'FrameSilverBeadedIcon': { price: 2100, durationDays: 30, name: 'Silver Beaded' },
    'FrameRegalPurpleIcon': { price: 1850, durationDays: 21, name: 'Regal Purple' },
    'FrameIcyWingsIcon': { price: 2300, durationDays: 45, name: 'Icy Wings' },
    'FrameBlazingSunIcon': { price: 2600, durationDays: 60, name: 'Blazing Sun' }
};

// GET /api/effects/frames - Buscar frames disponíveis
router.get('/effects/frames', async (req, res) => {
    try {
        const framesWithDetails = Object.entries(avatarFrames).map(([id, data]) => ({
            id,
            name: data.name,
            price: data.price,
            duration: data.durationDays
        }));
        res.json(framesWithDetails);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch frames' });
    }
});

router.post('/effects/purchase-frame/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { frameId } = req.body;

        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const frameData = avatarFrames[frameId];
        if (!frameData) return res.status(400).json({ error: 'Invalid frame ID' });

        if (user.diamonds < frameData.price) {
            return res.status(400).json({ error: 'Insufficient diamonds' });
        }

        // Deduct diamonds
        user.diamonds -= frameData.price;

        // Add or update frame in inventory
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + frameData.durationDays);

        const existingFrameIndex = user.ownedFrames.findIndex(f => f.frameId === frameId);
        if (existingFrameIndex >= 0) {
            user.ownedFrames[existingFrameIndex].expirationDate = expirationDate.toISOString();
        } else {
            user.ownedFrames.push({ frameId, expirationDate: expirationDate.toISOString() });
        }

        await user.save();
        res.json({ success: true, user });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/effects/purchase/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { giftId } = req.body; // Actually gift name is passed here from api.ts

        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Fetch real gift data if possible, for now we will hardcode a standard effect price or assume the frontend validated it.
        // In a real scenario we must validate against the Gift collection.
        const gift = await import('../models').then(m => m.Gift).then(G => G.findOne({ name: giftId }));
        const price = gift ? (gift.price || 0) : 500; // fallback price

        if (user.diamonds < price) {
            return res.status(400).json({ error: 'Insufficient diamonds' });
        }

        user.diamonds -= price;
        await user.save();
        res.json({ success: true, user });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/vip/subscribe/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const VIP_PRICE = 3000;
        if (user.diamonds < VIP_PRICE) {
            return res.status(400).json({ error: 'Insufficient diamonds for VIP' });
        }

        user.diamonds -= VIP_PRICE;
        user.isVIP = true;
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 30);
        user.vipExpirationDate = expDate.toISOString();

        await user.save();
        res.json({ success: true, user });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/chats/mark-read', async (req, res) => res.json({}));
router.post('/chats/send', async (req, res) => {
    await Message.create({ id: Date.now().toString(), ...req.body, chatId: req.body.to });
    res.json({});
});
router.post('/streams/:id/kick', async (req, res) => res.json({}));
router.post('/streams/:id/moderator', async (req, res) => res.json({}));
router.get('/notifications', async (req, res) => res.json([]));
router.patch('/notifications/:id/read', async (req, res) => res.json({ success: true }));

export default router;
