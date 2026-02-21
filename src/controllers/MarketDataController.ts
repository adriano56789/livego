
import { db, saveDb, MarketFrame, MarketGift } from '../services/database';

export const MarketDataController = {
    // --- Market User ---
    async getMarketUser(req: any, res: any) {
        const { userId } = req.params;
        const marketUser = db.marketUsers.get(userId) || { 
            id: `mu_${userId}`, userId, points: 0, tier: 'bronze' 
        };
        return res.status(200).json(marketUser);
    },
    
    // --- Market Frames (Catalog) ---
    async getMarketFrames(req: any, res: any) {
        const frames = db.marketFrames.length > 0 ? db.marketFrames : [];
        return res.status(200).json(frames);
    },
    async addMarketFrame(req: any, res: any) {
        const frame: MarketFrame = { id: `mf_${Date.now()}`, ...req.body };
        db.marketFrames.push(frame);
        saveDb();
        return res.status(201).json(frame);
    },

    // --- Market Gifts (Catalog) ---
    async getMarketGifts(req: any, res: any) {
        const gifts = db.marketGifts.length > 0 ? db.marketGifts : [];
        return res.status(200).json(gifts);
    },
    async addMarketGift(req: any, res: any) {
        const gift: MarketGift = { id: `mg_${Date.now()}`, ...req.body };
        db.marketGifts.push(gift);
        saveDb();
        return res.status(201).json(gift);
    }
};
