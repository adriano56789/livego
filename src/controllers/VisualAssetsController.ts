
import { db, saveDb, BeautyEffect, GiftAnimationConfig } from '../services/database';

export const VisualAssetsController = {
    // --- BEAUTY EFFECTS ---
    async getBeautyEffects(req: any, res: any) {
        return res.status(200).json(db.beautyEffects);
    },
    async addBeautyEffect(req: any, res: any) {
        const effect: BeautyEffect = {
            id: `be_${Date.now()}`,
            isActive: true,
            order: 0,
            defaultValue: 0,
            ...req.body
        };
        if (effect.type === 'filter') db.beautyEffects.filters.push(effect);
        else db.beautyEffects.effects.push(effect);
        saveDb();
        return res.status(201).json(effect);
    },

    // --- GIFT ANIMATIONS ---
    async getGiftAnimation(req: any, res: any) {
        const { giftId } = req.params;
        const config = db.giftAnimationConfigs.find(c => c.giftId === giftId);
        if (!config) return res.status(404).json({ error: "Config not found" });
        return res.status(200).json(config);
    },
    async updateGiftAnimation(req: any, res: any) {
        const { giftId } = req.params;
        const existingIndex = db.giftAnimationConfigs.findIndex(c => c.giftId === giftId);
        if (existingIndex > -1) {
            db.giftAnimationConfigs[existingIndex] = { ...db.giftAnimationConfigs[existingIndex], ...req.body };
        } else {
            const newConfig: GiftAnimationConfig = { giftId, ...req.body };
            db.giftAnimationConfigs.push(newConfig);
        }
        saveDb();
        return res.status(200).json({ success: true });
    },

    // --- FRAME METADATA ---
    async getFrameMetadata(req: any, res: any) {
        return res.status(200).json(db.frameMetadata);
    },
    async updateFrameMetadata(req: any, res: any) {
        const { componentName } = req.params;
        const index = db.frameMetadata.findIndex(f => f.componentName === componentName);
        if (index > -1) {
             db.frameMetadata[index] = { ...db.frameMetadata[index], ...req.body };
             saveDb();
             return res.status(200).json({ success: true });
        }
        return res.status(404).json({ error: "Metadata not found" });
    }
};
