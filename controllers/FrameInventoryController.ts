
import { db, saveDb, SpecificFrameInventory } from '../services/database';

export const FrameInventoryController = {
    // Generic handler for ANY specific frame model (BlazingSun, BlueCrystal, etc.)
    // In a real DB with Mongoose discriminators, these would be separate models.
    // Here we store them in specificFrameInventories with a 'frameType' discriminator.

    async getFrameStatus(req: any, res: any) {
        const { userId, frameType } = req.params; // e.g. frameType = 'FrameBlazingSun'
        const entry = db.specificFrameInventories.find(f => f.userId === userId && f.frameType === frameType);
        
        if (!entry) return res.status(404).json({ owned: false });
        return res.status(200).json({ owned: true, ...entry });
    },

    async acquireFrame(req: any, res: any) {
        const { userId, frameType } = req.params;
        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // Default 30 days

        const entry: SpecificFrameInventory = {
            id: `sf_${Date.now()}`,
            userId,
            frameType,
            purchasedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
        };

        // Remove old entry if exists to renew
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
