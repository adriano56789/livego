
import { db, saveDb, UserMedia } from '../services/database';
import { Obra } from '../types';
import { webSocketServerInstance } from '../services/websocket';

export const UserContentController = {
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
        
        // Sync with legacy 'obras'
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
        const { orderedIds } = req.body;
        
        orderedIds.forEach((id: string, index: number) => {
            const media = db.userMedias.find(m => m.id === id && m.userId === userId);
            if (media) media.sortOrder = index;
        });
        
        saveDb();
        return res.status(200).json({ success: true });
    },

    async getCuratedStreamers(req: any, res: any) {
        const active = db.mainScreenStreamers.filter((s: any) => s.isActive);
        return res.status(200).json(active);
    }
};
