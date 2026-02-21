
import { db, saveDb, CURRENT_USER_ID } from '../services/database';

export const NotificationController = {
    async getNotifications(req: any, res: any) {
        const userId = CURRENT_USER_ID;
        
        // Filtra notificações onde o usuário é o alvo
        const notifications = db.liveNotifications
            .filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return res.status(200).json(notifications);
    },

    async markRead(req: any, res: any) {
        const { id } = req.params;
        const notification = db.liveNotifications.find(n => n.id === id);
        
        if (notification) {
            notification.read = true;
            saveDb();
            return res.status(200).json({ success: true });
        }
        return res.status(404).json({ error: "Notification not found" });
    }
};
