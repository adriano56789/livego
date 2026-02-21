
import { db, saveDb, LoadingConfig } from '../services/database';

export const SystemConfigController = {
    async getLoadingConfig(req: any, res: any) {
        const config = db.loadingConfigs[db.loadingConfigs.length - 1] || { isActive: true, color: 'purple', size: 12 };
        return res.status(200).json(config);
    },

    async updateLoadingConfig(req: any, res: any) {
        const { isActive, color, size } = req.body;
        const newConfig: LoadingConfig = {
            isActive,
            color,
            size
        };
        db.loadingConfigs.push(newConfig);
        saveDb();
        return res.status(200).json({ success: true, config: newConfig });
    },

    async getInviteRestriction(req: any, res: any) {
        const { streamId } = req.params;
        const restriction = db.inviteRestrictions.find(r => r.streamId === streamId) || { streamId, minLevelToInvite: 1, minLevelToJoin: 1, allowedRoles: ['user'] };
        return res.status(200).json(restriction);
    },

    async updateInviteRestriction(req: any, res: any) {
        const { streamId } = req.params;
        const updates = req.body;
        
        let index = db.inviteRestrictions.findIndex(r => r.streamId === streamId);
        if (index > -1) {
            db.inviteRestrictions[index] = { ...db.inviteRestrictions[index], ...updates };
        } else {
            db.inviteRestrictions.push({ streamId, minLevelToInvite: 1, minLevelToJoin: 1, allowedRoles: ['user'], ...updates });
        }
        saveDb();
        return res.status(200).json({ success: true });
    },

    async getFrameMetadata(req: any, res: any) {
        return res.status(200).json(db.frameMetadata);
    }
};
