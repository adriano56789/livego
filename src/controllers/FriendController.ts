
import { db, saveDb, CURRENT_USER_ID, FriendRequest } from '../services/database';

export const FriendController = {
    async sendRequest(req: any, res: any) {
        const { toUserId } = req.body;
        const fromUserId = CURRENT_USER_ID;

        if (fromUserId === toUserId) return res.status(400).json({ error: "Cannot add yourself" });

        const existing = db.friendRequests.find(r => 
            (r.fromUserId === fromUserId && r.toUserId === toUserId) ||
            (r.fromUserId === toUserId && r.toUserId === fromUserId)
        );

        if (existing) {
            if (existing.status === 'pending') return res.status(400).json({ error: "Request pending" });
            if (existing.status === 'accepted') return res.status(400).json({ error: "Already friends" });
        }

        const request: FriendRequest = {
            id: `freq_${Date.now()}`,
            fromUserId,
            toUserId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        db.friendRequests.push(request);
        saveDb();

        return res.status(200).json({ success: true, request });
    },

    async getRequests(req: any, res: any) {
        const userId = CURRENT_USER_ID;
        const requests = db.friendRequests.filter(r => r.toUserId === userId && r.status === 'pending');
        return res.status(200).json(requests);
    },

    async acceptRequest(req: any, res: any) {
        const { requestId } = req.body;
        const request = db.friendRequests.find(r => r.id === requestId);
        
        if (!request) return res.status(404).json({ error: "Request not found" });
        if (request.toUserId !== CURRENT_USER_ID) return res.status(403).json({ error: "Unauthorized" });

        request.status = 'accepted';
        request.updatedAt = new Date().toISOString();

        // Enforce bidirectional follow logic
        if (!db.following.has(request.fromUserId)) db.following.set(request.fromUserId, new Set());
        if (!db.following.has(request.toUserId)) db.following.set(request.toUserId, new Set());
        if (!db.fans.has(request.fromUserId)) db.fans.set(request.fromUserId, new Set());
        if (!db.fans.has(request.toUserId)) db.fans.set(request.toUserId, new Set());

        db.following.get(request.fromUserId)?.add(request.toUserId);
        db.fans.get(request.toUserId)?.add(request.fromUserId);

        db.following.get(request.toUserId)?.add(request.fromUserId);
        db.fans.get(request.fromUserId)?.add(request.toUserId);

        saveDb();
        return res.status(200).json({ success: true });
    },
    
    async rejectRequest(req: any, res: any) {
        const { requestId } = req.body;
        const request = db.friendRequests.find(r => r.id === requestId);
        
        if (!request) return res.status(404).json({ error: "Request not found" });
        if (request.toUserId !== CURRENT_USER_ID) return res.status(403).json({ error: "Unauthorized" });

        request.status = 'rejected';
        request.updatedAt = new Date().toISOString();
        
        saveDb();
        return res.status(200).json({ success: true });
    }
};
