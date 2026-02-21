
import { db, saveDb, CURRENT_USER_ID, AccountDeletionRequest } from '../services/database';

export const AccountController = {
    async requestDeletion(req: any, res: any) {
        const { reason } = req.body;
        const userId = CURRENT_USER_ID;

        // Check if already pending
        const existing = db.accountDeletionRequests.find(r => r.userId === userId && r.status === 'pending');
        if (existing) return res.status(400).json({ error: "Deletion already requested" });

        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 30); // 30 day grace period

        const request: AccountDeletionRequest = {
            id: `del_${Date.now()}`,
            userId,
            reason,
            status: 'pending',
            scheduledFor: scheduledDate.toISOString(),
            createdAt: new Date().toISOString()
        };

        db.accountDeletionRequests.push(request);
        saveDb();

        return res.status(200).json({ success: true, request });
    },

    async cancelDeletion(req: any, res: any) {
        const userId = CURRENT_USER_ID;
        const request = db.accountDeletionRequests.find(r => r.userId === userId && r.status === 'pending');
        
        if (!request) return res.status(404).json({ error: "No pending deletion request" });

        request.status = 'cancelled';
        saveDb();

        return res.status(200).json({ success: true });
    }
};
