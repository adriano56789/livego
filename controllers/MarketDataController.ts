
import { db, saveDb, MarketUser, MarketFrame, MarketGift } from '../services/database';

export const MarketDataController = {
    // --- Market User ---
    async getMarketUser(req: any, res: any) {
        const { userId } = req.params;
        // Sync with main user data if needed
        const mainUser = db.users.get(userId);
        if (!mainUser) return res.status(404).json({ error: "User not found" });

        const marketUser = db.marketUsers.get(userId) || { 
            id: `mu_${userId}`, userId, points: 0, tier: 'bronze' 
        };
        return res.status(200).json(marketUser);
    },
    
    // --- Market Frames (Catalog) ---
    async getMarketFrames(req: any, res: any) {
        // Return existing frames from catalog as MarketFrame model
        // In a real DB this is its own collection, here we map from avatarFrames
        // but also respect the 'marketFrames' collection if populated.
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
