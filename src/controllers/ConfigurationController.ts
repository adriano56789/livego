
import { db, saveDb, ZoomConfig, PipConfig, WatermarkConfig, LanguageConfig, PushNotificationConfig, PrivateStreamConfig } from '../services/database';

export const ConfigurationController = {
    // --- ZOOM ---
    async getZoom(req: any, res: any) {
        const { userId } = req.params;
        const config = db.zoomConfigs.get(userId) || { userId, percentage: 100, applyToStream: true };
        return res.status(200).json(config);
    },
    async updateZoom(req: any, res: any) {
        const { userId } = req.params;
        const config: ZoomConfig = { userId, ...req.body };
        db.zoomConfigs.set(userId, config);
        saveDb();
        return res.status(200).json({ success: true, config });
    },

    // --- PIP ---
    async getPip(req: any, res: any) {
        const { userId } = req.params;
        const config = db.pipConfigs.get(userId) || { userId, isEnabled: false, autoEnter: false };
        return res.status(200).json(config);
    },
    async updatePip(req: any, res: any) {
        const { userId } = req.params;
        const config: PipConfig = { userId, ...req.body };
        db.pipConfigs.set(userId, config);
        saveDb();
        return res.status(200).json({ success: true, config });
    },

    // --- WATERMARK ---
    async getWatermark(req: any, res: any) {
        const { userId } = req.params;
        const config = db.watermarkConfigs.get(userId) || { userId, isEnabled: true, showUserName: true };
        return res.status(200).json(config);
    },
    async updateWatermark(req: any, res: any) {
        const { userId } = req.params;
        const config: WatermarkConfig = { userId, ...req.body };
        db.watermarkConfigs.set(userId, config);
        saveDb();
        return res.status(200).json({ success: true, config });
    },

    // --- LANGUAGE ---
    async getLanguage(req: any, res: any) {
        const { userId } = req.params;
        const config = db.languageConfigs.get(userId) || { userId, languageCode: 'pt-BR', autoDetect: true };
        return res.status(200).json(config);
    },
    async updateLanguage(req: any, res: any) {
        const { userId } = req.params;
        const config: LanguageConfig = { userId, ...req.body };
        db.languageConfigs.set(userId, config);
        saveDb();
        return res.status(200).json({ success: true, config });
    },

    // --- PUSH ---
    async getPush(req: any, res: any) {
        const { userId } = req.params;
        const config = db.pushNotificationConfigs.get(userId) || { userId, isEnabled: true, preferences: { mentions: true, likes: true, newFollowers: true, liveStart: true, giftReceived: true }, updatedAt: new Date().toISOString() };
        return res.status(200).json(config);
    },
    async updatePush(req: any, res: any) {
        const { userId } = req.params;
        const config: PushNotificationConfig = { userId, ...req.body, updatedAt: new Date().toISOString() };
        db.pushNotificationConfigs.set(userId, config);
        saveDb();
        return res.status(200).json({ success: true, config });
    },

    // --- PRIVATE STREAM CONFIG ---
    async getPrivateStreamConfig(req: any, res: any) {
        const { userId } = req.params;
        const config = db.privateStreamConfigs.get(userId) || { 
            userId, defaultMode: 'invite_only', allowFollowers: true, allowFans: true, allowFriends: true 
        };
        return res.status(200).json(config);
    },
    async updatePrivateStreamConfig(req: any, res: any) {
        const { userId } = req.params;
        const config: PrivateStreamConfig = { userId, ...req.body };
        db.privateStreamConfigs.set(userId, config);
        saveDb();
        return res.status(200).json({ success: true, config });
    }
};
