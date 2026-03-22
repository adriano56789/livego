import express, { Request, Response, NextFunction } from 'express';
import { ShopItem, UserInventory, UserAvatar, User, Streamer } from '../models';

const router = express.Router();

// ============= MOCHILAS =============
router.get('/mochilas', async (req, res) => {
    try {
        const mochilas = await ShopItem.find({ category: 'mochila', isActive: true });
        res.json(mochilas);
    } catch (error: any) {
        console.error('Erro ao buscar mochilas:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/mochilas/:itemId/purchase', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Buscar item da loja
        const shopItem = await ShopItem.findOne({ id: itemId, category: 'mochila' });
        if (!shopItem) {
            return res.status(404).json({ error: 'Mochila não encontrada' });
        }

        // Verificar se usuário já possui
        const existing = await UserInventory.findOne({ 
            userId, 
            itemId, 
            itemType: 'mochila',
            isActive: true 
        });
        if (existing) {
            return res.status(400).json({ error: 'Você já possui esta mochila' });
        }

        // Verificar diamonds do usuário
        const user = await User.findOne({ id: userId });
        if (!user || user.diamonds < shopItem.price) {
            return res.status(400).json({ error: 'Diamonds insuficientes' });
        }

        // Deduzir diamonds
        user.diamonds -= shopItem.price;
        await user.save();

        // Adicionar ao inventário
        const inventory = await UserInventory.create({
            userId,
            itemId,
            itemType: 'mochila',
            purchaseDate: new Date(),
            expirationDate: shopItem.duration ? new Date(Date.now() + shopItem.duration * 24 * 60 * 60 * 1000) : undefined,
            isActive: true,
            isEquipped: false
        });

        res.json({ 
            success: true, 
            inventory,
            userDiamonds: user.diamonds 
        });

    } catch (error: any) {
        console.error('Erro ao comprar mochila:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/mochilas/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const inventory = await UserInventory.find({ 
            userId, 
            itemType: 'mochila', 
            isActive: true 
        }).populate('itemId');

        res.json(inventory);
    } catch (error: any) {
        console.error('Erro ao buscar mochilas do usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============= QUADROS =============
router.get('/quadros', async (req, res) => {
    try {
        const quadros = await ShopItem.find({ category: 'quadro', isActive: true });
        res.json(quadros);
    } catch (error: any) {
        console.error('Erro ao buscar quadros:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/quadros/:itemId/purchase', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const shopItem = await ShopItem.findOne({ id: itemId, category: 'quadro' });
        if (!shopItem) {
            return res.status(404).json({ error: 'Quadro não encontrado' });
        }

        const existing = await UserInventory.findOne({ 
            userId, 
            itemId, 
            itemType: 'quadro',
            isActive: true 
        });
        if (existing) {
            return res.status(400).json({ error: 'Você já possui este quadro' });
        }

        const user = await User.findOne({ id: userId });
        if (!user || user.diamonds < shopItem.price) {
            return res.status(400).json({ error: 'Diamonds insuficientes' });
        }

        user.diamonds -= shopItem.price;
        await user.save();

        const inventory = await UserInventory.create({
            userId,
            itemId,
            itemType: 'quadro',
            purchaseDate: new Date(),
            expirationDate: shopItem.duration ? new Date(Date.now() + shopItem.duration * 24 * 60 * 60 * 1000) : undefined,
            isActive: true,
            isEquipped: false
        });

        res.json({ 
            success: true, 
            inventory,
            userDiamonds: user.diamonds 
        });

    } catch (error: any) {
        console.error('Erro ao comprar quadro:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/quadros/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const inventory = await UserInventory.find({ 
            userId, 
            itemType: 'quadro', 
            isActive: true 
        }).populate('itemId');

        res.json(inventory);
    } catch (error: any) {
        console.error('Erro ao buscar quadros do usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============= CARROS =============
router.get('/carros', async (req, res) => {
    try {
        const carros = await ShopItem.find({ category: 'carro', isActive: true });
        res.json(carros);
    } catch (error: any) {
        console.error('Erro ao buscar carros:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/carros/:itemId/purchase', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const shopItem = await ShopItem.findOne({ id: itemId, category: 'carro' });
        if (!shopItem) {
            return res.status(404).json({ error: 'Carro não encontrado' });
        }

        const existing = await UserInventory.findOne({ 
            userId, 
            itemId, 
            itemType: 'carro',
            isActive: true 
        });
        if (existing) {
            return res.status(400).json({ error: 'Você já possui este carro' });
        }

        const user = await User.findOne({ id: userId });
        if (!user || user.diamonds < shopItem.price) {
            return res.status(400).json({ error: 'Diamonds insuficientes' });
        }

        user.diamonds -= shopItem.price;
        await user.save();

        const inventory = await UserInventory.create({
            userId,
            itemId,
            itemType: 'carro',
            purchaseDate: new Date(),
            expirationDate: shopItem.duration ? new Date(Date.now() + shopItem.duration * 24 * 60 * 60 * 1000) : undefined,
            isActive: true,
            isEquipped: false
        });

        res.json({ 
            success: true, 
            inventory,
            userDiamonds: user.diamonds 
        });

    } catch (error: any) {
        console.error('Erro ao comprar carro:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/carros/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const inventory = await UserInventory.find({ 
            userId, 
            itemType: 'carro', 
            isActive: true 
        }).populate('itemId');

        res.json(inventory);
    } catch (error: any) {
        console.error('Erro ao buscar carros do usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============= BOLHAS =============
router.get('/bolhas', async (req, res) => {
    try {
        const bolhas = await ShopItem.find({ category: 'bolha', isActive: true });
        res.json(bolhas);
    } catch (error: any) {
        console.error('Erro ao buscar bolhas:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/bolhas/:itemId/purchase', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const shopItem = await ShopItem.findOne({ id: itemId, category: 'bolha' });
        if (!shopItem) {
            return res.status(404).json({ error: 'Bolha não encontrada' });
        }

        const existing = await UserInventory.findOne({ 
            userId, 
            itemId, 
            itemType: 'bolha',
            isActive: true 
        });
        if (existing) {
            return res.status(400).json({ error: 'Você já possui esta bolha' });
        }

        const user = await User.findOne({ id: userId });
        if (!user || user.diamonds < shopItem.price) {
            return res.status(400).json({ error: 'Diamonds insuficientes' });
        }

        user.diamonds -= shopItem.price;
        await user.save();

        const inventory = await UserInventory.create({
            userId,
            itemId,
            itemType: 'bolha',
            purchaseDate: new Date(),
            expirationDate: shopItem.duration ? new Date(Date.now() + shopItem.duration * 24 * 60 * 60 * 1000) : undefined,
            isActive: true,
            isEquipped: false
        });

        res.json({ 
            success: true, 
            inventory,
            userDiamonds: user.diamonds 
        });

    } catch (error: any) {
        console.error('Erro ao comprar bolha:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/bolhas/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const inventory = await UserInventory.find({ 
            userId, 
            itemType: 'bolha', 
            isActive: true 
        }).populate('itemId');

        res.json(inventory);
    } catch (error: any) {
        console.error('Erro ao buscar bolhas do usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============= ANÉIS =============
router.get('/aneis', async (req, res) => {
    try {
        const aneis = await ShopItem.find({ category: 'anel', isActive: true });
        res.json(aneis);
    } catch (error: any) {
        console.error('Erro ao buscar anéis:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/aneis/:itemId/purchase', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const shopItem = await ShopItem.findOne({ id: itemId, category: 'anel' });
        if (!shopItem) {
            return res.status(404).json({ error: 'Anel não encontrado' });
        }

        const existing = await UserInventory.findOne({ 
            userId, 
            itemId, 
            itemType: 'anel',
            isActive: true 
        });
        if (existing) {
            return res.status(400).json({ error: 'Você já possui este anel' });
        }

        const user = await User.findOne({ id: userId });
        if (!user || user.diamonds < shopItem.price) {
            return res.status(400).json({ error: 'Diamonds insuficientes' });
        }

        user.diamonds -= shopItem.price;
        await user.save();

        const inventory = await UserInventory.create({
            userId,
            itemId,
            itemType: 'anel',
            purchaseDate: new Date(),
            expirationDate: shopItem.duration ? new Date(Date.now() + shopItem.duration * 24 * 60 * 60 * 1000) : undefined,
            isActive: true,
            isEquipped: false
        });

        res.json({ 
            success: true, 
            inventory,
            userDiamonds: user.diamonds 
        });

    } catch (error: any) {
        console.error('Erro ao comprar anel:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/aneis/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const inventory = await UserInventory.find({ 
            userId, 
            itemType: 'anel', 
            isActive: true 
        }).populate('itemId');

        res.json(inventory);
    } catch (error: any) {
        console.error('Erro ao buscar anéis do usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============= AVATARES (ESPECIAL - 7 DIAS) =============
router.get('/avatars', async (req, res) => {
    try {
        const avatars = await ShopItem.find({ category: 'avatar', isActive: true });
        res.json(avatars);
    } catch (error: any) {
        console.error('Erro ao buscar avatares:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/avatars/:itemId/purchase', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const shopItem = await ShopItem.findOne({ id: itemId, category: 'avatar' });
        if (!shopItem) {
            return res.status(404).json({ error: 'Avatar não encontrado' });
        }

        // Verificar se usuário já possui este avatar ativo
        const existing = await UserAvatar.findOne({ 
            userId, 
            avatarId: itemId,
            isActive: true,
            expirationDate: { $gt: new Date() }
        });
        if (existing) {
            return res.status(400).json({ error: 'Você já possui este avatar ativo' });
        }

        const user = await User.findOne({ id: userId });
        if (!user || user.diamonds < shopItem.price) {
            return res.status(400).json({ error: 'Diamonds insuficientes' });
        }

        user.diamonds -= shopItem.price;
        await user.save();

        // Criar avatar com expiração de 7 dias
        const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        const userAvatar = await UserAvatar.create({
            userId,
            avatarId: itemId,
            imageUrl: shopItem.image,
            purchaseDate: new Date(),
            expirationDate,
            isActive: true,
            isCurrent: false
        });

        res.json({ 
            success: true, 
            userAvatar,
            userDiamonds: user.diamonds,
            expirationDate
        });

    } catch (error: any) {
        console.error('Erro ao comprar avatar:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/avatars/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const avatars = await UserAvatar.find({ 
            userId,
            isActive: true,
            expirationDate: { $gt: new Date() }
        });

        res.json(avatars);
    } catch (error: any) {
        console.error('Erro ao buscar avatares do usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/avatars/:avatarId/equip', async (req, res) => {
    try {
        const { avatarId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Verificar se avatar pertence ao usuário e está ativo
        const avatar = await UserAvatar.findOne({ 
            userId, 
            avatarId,
            isActive: true,
            expirationDate: { $gt: new Date() }
        });

        if (!avatar) {
            return res.status(404).json({ error: 'Avatar não encontrado ou expirado' });
        }

        // Desmarcar todos os outros avatares como current
        await UserAvatar.updateMany(
            { userId, isActive: true },
            { isCurrent: false }
        );

        // Marcar este avatar como current
        avatar.isCurrent = true;
        await avatar.save();

        // VALIDAÇÃO: Bloquear URLs Base64 - apenas permitir URLs normais
        if (avatar.imageUrl && avatar.imageUrl.startsWith('data:image')) {
            return res.status(400).json({ 
                success: false, 
                error: 'URLs Base64 não são permitidas. Use o upload de arquivos.' 
            });
        }

        // Atualizar avatarUrl do usuário
        await User.findOneAndUpdate(
            { id: userId },
            { avatarUrl: avatar.imageUrl }
        );

        // Sincronizar avatar com streams ativas do usuário
        await Streamer.updateMany(
            { hostId: userId },
            { 
                avatar: avatar.imageUrl,
                updatedAt: new Date()
            }
        );
        console.log(`✅ Avatar sincronizado com streams do usuário: ${userId}`);

        res.json({ 
            success: true, 
            currentAvatar: avatar,
            message: 'Avatar equipado com sucesso'
        });

    } catch (error: any) {
        console.error('Erro ao equipar avatar:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/avatars/current/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const currentAvatar = await UserAvatar.findOne({ 
            userId, 
            isActive: true, 
            isCurrent: true,
            expirationDate: { $gt: new Date() }
        });

        res.json(currentAvatar);
    } catch (error: any) {
        console.error('Erro ao buscar avatar atual:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/frames/cleanup-expired', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Buscar usuário
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const now = new Date();
        let removedCount = 0;
        let currentFrameRemoved = false;

        // Filtrar frames expirados
        const validFrames = (user.ownedFrames || []).filter(frame => {
            const isExpired = new Date(frame.expirationDate) <= now;
            if (isExpired) {
                removedCount++;
                // Verificar se era o frame atual
                if (user.activeFrameId === frame.frameId) {
                    currentFrameRemoved = true;
                }
            }
            return !isExpired;
        });

        // Atualizar usuário apenas com frames válidos
        const updateData: any = { ownedFrames: validFrames };
        
        // Se o frame atual expirou, remover activeFrameId
        if (currentFrameRemoved) {
            updateData.activeFrameId = null;
        }
        
        await User.updateOne(
            { id: userId },
            updateData
        );

        // Sincronizar com streams
        if (currentFrameRemoved) {
            await Streamer.updateMany(
                { hostId: userId },
                { 
                    activeFrameId: null,
                    updatedAt: new Date()
                }
            );
        }

        console.log(`🧹 Cleanup: ${removedCount} frames expirados removidos do usuário ${userId}`);

        res.json({ 
            success: true, 
            removedCount,
            currentFrameRemoved,
            message: `${removedCount} frames expirados removidos com sucesso`
        });

    } catch (error: any) {
        console.error('Erro ao limpar frames expirados:', error);
        res.status(500).json({ error: error.message });
    }
});

// Middleware para verificar frames expirados automaticamente
const checkExpiredFrames = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.body;
        
        if (userId) {
            const user = await User.findOne({ id: userId });
            if (user && user.ownedFrames) {
                const now = new Date();
                const currentFrame = user.ownedFrames.find(f => f.frameId === user.activeFrameId);
                
                if (currentFrame && new Date(currentFrame.expirationDate) <= now) {
                    // Frame atual expirou, remover
                    await User.updateOne(
                        { id: userId },
                        { activeFrameId: null }
                    );
                    
                    await Streamer.updateMany(
                        { hostId: userId },
                        { 
                            activeFrameId: null,
                            updatedAt: new Date()
                        }
                    );
                    
                    console.log(`⚠️ Frame expirado removido: ${currentFrame.frameId} do usuário ${userId}`);
                }
            }
        }
        
        next();
    } catch (error) {
        console.error('Erro no middleware de verificação:', error);
        next();
    }
};

// Aplicar middleware nas rotas de equipar
router.use('/frames/equip', checkExpiredFrames);
router.use('/frames/:frameId/equip', checkExpiredFrames);

router.post('/avatars/cleanup-expired', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Buscar avatares expirados do usuário
        const expiredAvatars = await UserAvatar.find({
            userId,
            expirationDate: { $lte: new Date() }
        });

        if (expiredAvatars.length > 0) {
            // Remover avatares expirados
            await UserAvatar.deleteMany({
                userId,
                expirationDate: { $lte: new Date() }
            });

            // Verificar se algum avatar expirado era o atual
            const currentExpiredAvatar = expiredAvatars.find(avatar => avatar.isCurrent);
            if (currentExpiredAvatar) {
                // Resetar avatarUrl do usuário para padrão
                await User.updateOne(
                    { id: userId },
                    { avatarUrl: null }
                );

                // Sincronizar com streams
                await Streamer.updateMany(
                    { hostId: userId },
                    { 
                        avatar: null,
                        updatedAt: new Date()
                    }
                );
            }

            console.log(`🧹 Cleanup: ${expiredAvatars.length} avatares expirados removidos do usuário ${userId}`);
        }

        res.json({ 
            success: true, 
            removedCount: expiredAvatars.length,
            message: `${expiredAvatars.length} avatares expirados removidos com sucesso`
        });

    } catch (error: any) {
        console.error('Erro ao limpar avatares expirados:', error);
        res.status(500).json({ error: error.message });
    }
});

// Middleware para verificar avatares expirados automaticamente
const checkExpiredAvatars = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.body;
        
        if (userId) {
            const currentAvatar = await UserAvatar.findOne({ 
                userId, 
                isCurrent: true,
                expirationDate: { $lte: new Date() }
            });
            
            if (currentAvatar) {
                // Avatar atual expirou, remover
                await UserAvatar.updateOne(
                    { _id: currentAvatar._id },
                    { isCurrent: false }
                );
                
                await User.updateOne(
                    { id: userId },
                    { avatarUrl: null }
                );
                
                await Streamer.updateMany(
                    { hostId: userId },
                    { 
                        avatar: null,
                        updatedAt: new Date()
                    }
                );
                
                console.log(`⚠️ Avatar expirado removido: ${currentAvatar.avatarId} do usuário ${userId}`);
            }
        }
        
        next();
    } catch (error) {
        console.error('Erro no middleware de verificação de avatares:', error);
        next();
    }
};

// Aplicar middleware nas rotas de equipar de avatares
router.use('/avatars/equip', checkExpiredAvatars);
router.use('/avatars/:avatarId/equip', checkExpiredAvatars);

export default router;
