
import { db, saveDb, CURRENT_USER_ID, UserMedia } from '../services/database';
import { Obra } from '../types';
import { webSocketServerInstance } from '../services/websocket';

export const UserContentController = {
    // --- User Media (Separate from ProfileController's logic for 'obras' array, targeting specific model structure) ---
    async getUserMedia(req: any, res: any) {
        const { userId } = req.params;
        const media = db.userMedias.filter(m => m.userId === userId).sort((a, b) => a.sortOrder - b.sortOrder);
        return res.status(200).json(media);
    },

    async addUserMedia(req: any, res: any) {
        const { userId } = req.params;
        const { url, type, duration } = req.body;
        
        const newMedia: UserMedia = {
            id: `media_${Date.now()}`,
            userId,
            url,
            type: type || 'image',
            duration,
            sortOrder: db.userMedias.filter(m => m.userId === userId).length,
            createdAt: new Date().toISOString()
        };
        
        db.userMedias.push(newMedia);
        
        // Sync with legacy 'obras' for compatibility
        const user = db.users.get(userId);
        if (user) {
            if (!user.obras) user.obras = [];
            const newObra: Obra = { id: newMedia.id, url: newMedia.url, duration: newMedia.duration };
            user.obras.push(newObra);
            db.users.set(userId, user);
            webSocketServerInstance.broadcastUserUpdate(user);
        }

        saveDb();
        return res.status(201).json(newMedia);
    },

    async reorderMedia(req: any, res: any) {
        const { userId } = req.params;
        const { orderedIds } = req.body; // Array of IDs
        
        orderedIds.forEach((id: string, index: number) => {
            const media = db.userMedias.find(m => m.id === id && m.userId === userId);
            if (media) media.sortOrder = index;
        });
        
        saveDb();
        return res.status(200).json({ success: true });
    },

    // --- Main Screen Streamers (Curated List Model) ---
    async getCuratedStreamers(req: any, res: any) {
        const active = db.mainScreenStreamers.filter((s: any) => s.isActive);
        return res.status(200).json(active);
    },

    async addToCurated(req: any, res: any) {
        const { name, avatar, viewers } = req.body;
        const newItem = {
            id: `curated_${Date.now()}`,
            name,
            avatar,
            viewers,
            isPrivate: false,
            country: 'br',
            isActive: true
        };
        db.mainScreenStreamers.push(newItem);
        saveDb();
        return res.status(201).json(newItem);
    }
};
