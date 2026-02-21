
import { db, saveDb, CURRENT_USER_ID } from '../services/database';

export const InteractionController = {
    async blockUser(req: any, res: any) {
        const { userId } = req.body;
        const blockerId = CURRENT_USER_ID;
        
        if (!db.blocklist.has(blockerId)) db.blocklist.set(blockerId, new Set());
        db.blocklist.get(blockerId)!.add(userId);
        
        db.following.get(blockerId)?.delete(userId);
        db.fans.get(userId)?.delete(blockerId);
        
        saveDb();
        return res.status(200).json({ success: true });
    },

    async unblockUser(req: any, res: any) {
        const { userId } = req.body;
        const blockerId = CURRENT_USER_ID;
        db.blocklist.get(blockerId)?.delete(userId);
        saveDb();
        return res.status(200).json({ success: true });
    },

    async logVisit(req: any, res: any) {
        const { profileId } = req.body;
        const visitorId = CURRENT_USER_ID;
        
        if (profileId === visitorId) return res.status(200).json({}); 

        const visits = db.visits.get(profileId) || [];
        const newVisits = [{ visitorId, timestamp: new Date().toISOString() }, ...visits];
        db.visits.set(profileId, newVisits.slice(0, 50));
        saveDb();
        return res.status(200).json({ success: true });
    },

    async createReport(req: any, res: any) {
        const { reportedId, reason } = req.body;
        db.reports.push({
            id: `rep_${Date.now()}`,
            reporterId: CURRENT_USER_ID,
            reportedId,
            reason,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        saveDb();
        return res.status(201).json({ success: true });
    }
};
