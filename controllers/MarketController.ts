
import { db, saveDb, avatarFrames, getRemainingDays } from '../services/database';
import { PurchaseRecord, Gift } from '../types';
import { webSocketServerInstance } from '../services/websocket';
import { UserFrame, FrameLog } from '../services/database';

// Helper to calculate gross BRL from diamonds (Mock rate)
const calculateGrossBRL = (diamonds: number): number => {
    return diamonds * 0.01;
};

const truncateBRL = (value: number): number => {
    return Math.floor(value * 100) / 100;
};

export const MarketController = {
    async purchaseFrame(req: any, res: any) {
        const { userId } = req.params;
        const { frameId } = req.body;
        const user = db.users.get(userId);
        const catalogFrame = avatarFrames.find(f => f.id === frameId);

        if (!user || !catalogFrame) return res.status(404).json({ error: "User or Frame not found." });
        
        // 1. Check Balance
        if (user.diamonds < catalogFrame.price) return res.status(400).json({ error: "Insufficient diamonds." });
        
        // 2. Deduct Balance
        user.diamonds -= catalogFrame.price;
        
        // 3. Logic for UserFrame (Model: UserFrame.ts)
        const now = new Date();
        const durationMs = catalogFrame.duration * 24 * 60 * 60 * 1000;
        
        // Check if already owns active frame
        let existingUserFrame = db.userFrames.find(uf => uf.userId === userId && uf.frameId === frameId && uf.isActive);
        let expiresAtDate;

        if (existingUserFrame) {
            // Extend
            const currentExp = existingUserFrame.expiresAt ? new Date(existingUserFrame.expiresAt).getTime() : now.getTime();
            const newExp = Math.max(currentExp, now.getTime()) + durationMs;
            expiresAtDate = new Date(newExp);
            existingUserFrame.expiresAt = expiresAtDate.toISOString();
        } else {
            // Create New
            expiresAtDate = new Date(now.getTime() + durationMs);
            const newUserFrame: UserFrame = {
                id: `uf_${Date.now()}_${Math.random()}`,
                userId: user.id,
                frameId: catalogFrame.id,
                componentName: catalogFrame.componentName,
                isEquipped: true, // Auto-equip on purchase
                isPermanent: false,
                obtainedAt: now.toISOString(),
                expiresAt: expiresAtDate.toISOString(),
                isActive: true
            };
            
            // Unequip others
            db.userFrames.forEach(uf => { if(uf.userId === userId) uf.isEquipped = false; });
            
            db.userFrames.push(newUserFrame);
            existingUserFrame = newUserFrame;
        }
        
        // 4. Update Legacy User Object fields for frontend compatibility
        user.activeFrameId = frameId;
        user.frameExpiration = expiresAtDate.toISOString();
        
        // Sync ownedFrames array on user object (Legacy View)
        const frameIndex = user.ownedFrames.findIndex(f => f.frameId === frameId);
        if (frameIndex > -1) user.ownedFrames[frameIndex].expirationDate = expiresAtDate.toISOString();
        else user.ownedFrames.push({ frameId, expirationDate: expiresAtDate.toISOString() });

        // 5. Log Transaction (Model: PurchaseRecord)
        const brlValue = calculateGrossBRL(catalogFrame.price);
        const purchase: PurchaseRecord = {
            id: `frame_${Date.now()}`,
            userId: user.id,
            type: 'purchase_frame',
            description: `Compra da moldura '${catalogFrame.name}'`,
            amountBRL: truncateBRL(brlValue),
            amountCoins: catalogFrame.price,
            status: 'Concluído',
            timestamp: now.toISOString(),
        };
        db.purchases.unshift(purchase);

        // 6. Log Frame Action (Model: FrameLog)
        const frameLog: FrameLog = {
            id: `fl_${Date.now()}`,
            userId: user.id,
            frameId: frameId,
            componentName: catalogFrame.componentName,
            action: 'purchase',
            cost: catalogFrame.price,
            timestamp: now.toISOString()
        };
        db.frameLogs.push(frameLog);

        saveDb();
        webSocketServerInstance.broadcastUserUpdate(user);
        return res.status(200).json({ success: true, user });
    },

    async setActiveFrame(req: any, res: any) {
        const { id } = req.params; // userId
        const { frameId } = req.body;
        const user = db.users.get(id);
        
        if (!user) return res.status(404).json({ error: "User not found." });

        if (frameId === null) {
            // Unequip all
            db.userFrames.forEach(uf => { if (uf.userId === id) uf.isEquipped = false; });
            user.activeFrameId = null;
            user.frameExpiration = null;
            
            db.frameLogs.push({
                id: `fl_${Date.now()}`, userId: id, frameId: 'none', componentName: 'none', action: 'unequip', cost: 0, timestamp: new Date().toISOString()
            });

        } else {
            // Find UserFrame ownership
            const userFrame = db.userFrames.find(uf => uf.userId === id && uf.frameId === frameId && uf.isActive);
            const now = new Date();
            
            if (userFrame && userFrame.expiresAt && new Date(userFrame.expiresAt) > now) {
                // Unequip others
                db.userFrames.forEach(uf => { if (uf.userId === id) uf.isEquipped = false; });
                // Equip target
                userFrame.isEquipped = true;
                
                user.activeFrameId = frameId;
                user.frameExpiration = userFrame.expiresAt;

                db.frameLogs.push({
                    id: `fl_${Date.now()}`, userId: id, frameId: frameId, componentName: userFrame.componentName, action: 'equip', cost: 0, timestamp: now.toISOString()
                });
            } else {
                 return res.status(404).json({ error: "Moldura não encontrada ou expirada." });
            }
        }

        saveDb();
        webSocketServerInstance.broadcastUserUpdate(user);
        return res.status(200).json({ success: true, user });
    },

    async purchaseEffect(req: any, res: any) {
        const { userId } = req.params;
        const { giftId } = req.body; 
        const user = db.users.get(userId);
        const gift = db.gifts.find(g => g.name === giftId);

        if (!user || !gift) return res.status(404).json({ error: "User or Effect not found." });
        if (user.diamonds < (gift.price || 0)) return res.status(400).json({ error: "Insufficient diamonds." });

        user.diamonds -= (gift.price || 0);
        
        const purchase: PurchaseRecord = {
            id: `effect_${Date.now()}`,
            userId: user.id,
            type: 'purchase_diamonds', // Generic type for effect purchase
            description: `Compra do efeito '${gift.name}'`,
            amountBRL: 0,
            amountCoins: gift.price,
            status: 'Concluído',
            timestamp: new Date().toISOString(),
        };
        db.purchases.unshift(purchase);
        
        saveDb();
        webSocketServerInstance.broadcastUserUpdate(user);
        
        return res.status(200).json({ success: true, user });
    },

    async subscribeVIP(req: any, res: any) {
        const { userId } = req.params;
        const user = db.users.get(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Logic handled in VIPController, but exposed here for compatibility if needed.
        // For strict SOC, client calls VIPController.
        return res.status(400).json({ error: "Use VIP Controller endpoints." });
    }
};
