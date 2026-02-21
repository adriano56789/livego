
import { db, saveDb, MessageUser, MessageConversation, MessageFriendRequest } from '../services/database';

export const MessageDataController = {
    // --- Message User (Profile snapshot for chat) ---
    async getMessageUser(req: any, res: any) {
        const { userId } = req.params;
        const msgUser = db.messageUsers.get(userId);
        if (msgUser) return res.status(200).json(msgUser);
        
        // Fallback: create from main user
        const mainUser = db.users.get(userId);
        if (mainUser) {
            const newUser: MessageUser = {
                id: `mu_${userId}`,
                userId,
                lastActive: new Date().toISOString()
            };
            db.messageUsers.set(userId, newUser);
            return res.status(200).json(newUser);
        }
        return res.status(404).json({ error: "User not found" });
    },

    // --- Message Conversations (Metadata) ---
    async getConversationMeta(req: any, res: any) {
        const { id } = req.params;
        const convo = db.messageConversations.find(c => c.id === id);
        return res.status(200).json(convo || {});
    },
    async createConversationMeta(req: any, res: any) {
        const { user1, user2 } = req.body;
        const convo: MessageConversation = {
            id: `mc_${Date.now()}`,
            user1,
            user2,
            lastMessage: '',
            updatedAt: new Date().toISOString()
        };
        db.messageConversations.push(convo);
        saveDb();
        return res.status(201).json(convo);
    },

    // --- Message Friend Requests (Independent of main friend system for chat) ---
    async getFriendRequests(req: any, res: any) {
        const { userId } = req.params;
        const reqs = db.messageFriendRequests.filter(r => r.to === userId && r.status === 'pending');
        return res.status(200).json(reqs);
    },
    async updateFriendRequest(req: any, res: any) {
        const { id } = req.params;
        const { status } = req.body;
        const reqIndex = db.messageFriendRequests.findIndex(r => r.id === id);
        if (reqIndex > -1) {
            db.messageFriendRequests[reqIndex].status = status;
            saveDb();
            return res.status(200).json({ success: true });
        }
        return res.status(404).json({ error: "Request not found" });
    }
};
