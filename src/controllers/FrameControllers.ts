
import { db, saveDb } from '../services/database';

const createFrameController = (collectionName: keyof typeof db) => ({
    async get(req: any, res: any) {
        const { userId } = req.params;
        const collection = db[collectionName] as any[];
        const frames = collection.filter((f: any) => f.userId === userId);
        return res.status(200).json(frames);
    },
    async create(req: any, res: any) {
        const { userId, isEquipped } = req.body;
        const newFrame = {
            id: `frame_${Date.now()}`,
            userId,
            isEquipped: isEquipped || false,
            purchasedAt: new Date().toISOString(),
            isActive: true
        };
        (db[collectionName] as any[]).push(newFrame);
        saveDb();
        return res.status(201).json(newFrame);
    }
});

export const FrameBlazingSunController = createFrameController('frameBlazingSuns');
export const FrameBlueCrystalController = createFrameController('frameBlueCrystals');
export const FrameGoldenFloralController = createFrameController('frameGoldenFlorals');
export const FrameBlueFireController = createFrameController('frameBlueFires');
export const FrameDiamondController = createFrameController('frameDiamonds');
export const FrameFloralWreathController = createFrameController('frameFloralWreaths');
export const FrameIcyWingsController = createFrameController('frameIcyWings');
export const FrameMagentaWingsController = createFrameController('frameMagentaWings');
export const FrameNeonDiamondController = createFrameController('frameNeonDiamonds');
export const FrameNeonPinkController = createFrameController('frameNeonPinks');
export const FrameOrnateBronzeController = createFrameController('frameOrnateBronzes');
export const FramePinkGemController = createFrameController('framePinkGems');
export const FramePinkLaceController = createFrameController('framePinkLaces');
export const FramePurpleFloralController = createFrameController('framePurpleFlorals');
export const FrameRegalPurpleController = createFrameController('frameRegalPurples');
export const FrameSilverThornController = createFrameController('frameSilverThorns');
export const FrameRoseHeartController = createFrameController('frameRoseHearts');
export const FrameSilverBeadedController = createFrameController('frameSilverBeadeds');
