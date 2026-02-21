
import { db, saveDb, SpecificFrameInventory } from '../services/database';

export const FrameInventoryController = {
    async getFrameStatus(req: any, res: any) {
        const { userId, frameType } = req.params; 
        const entry = db.specificFrameInventories.find(f => f.userId === userId && f.frameType === frameType);
        
        if (!entry) return res.status(404).json({ owned: false });
        return res.status(200).json({ owned: true, ...entry });
    },

    async acquireFrame(req: any, res: any) {
        const { userId, frameType } = req.params;
        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); 

        const entry: SpecificFrameInventory = {
            id: `sf_${Date.now()}`,
            userId,
            frameType,
            purchasedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
        };

        const existingIdx = db.specificFrameInventories.findIndex(f => f.userId === userId && f.frameType === frameType);
        if (existingIdx > -1) {
            db.specificFrameInventories[existingIdx] = entry;
        } else {
            db.specificFrameInventories.push(entry);
        }

        saveDb();
        return res.status(200).json({ success: true, entry });
    },
    
    async listAllFrames(req: any, res: any) {
        const { userId } = req.params;
        const frames = db.specificFrameInventories.filter(f => f.userId === userId);
        return res.status(200).json(frames);
    }
};
