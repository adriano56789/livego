
import { db, saveDb, MessageUser, MessageConversation } from '../services/database';

export const MessageDataController = {
    async getMessageUser(req: any, res: any) {
        const { userId } = req.params;
        const msgUser = db.messageUsers.get(userId);
        if (msgUser) return res.status(200).json(msgUser);
        
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

    async getFriendRequests(req: any, res: any) {
        const { userId } = req.params;
        const reqs = db.messageFriendRequests.filter(r => r.to === userId && r.status === 'pending');
        return res.status(200).json(reqs);
    }
};
