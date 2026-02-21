
import { db, saveDb, CURRENT_USER_ID } from '../services/database';
import { PurchaseRecord } from '../types';
import { webSocketServerInstance } from '../services/websocket';

export const VIPController = {
    async getPlans(req: any, res: any) {
        // Fetches from the newly added vipPlans collection in db
        return res.status(200).json(db.vipPlans || []);
    },

    async subscribe(req: any, res: any) {
        const { userId } = req.params;
        const { planId } = req.body; // Expecting planId if selecting specific plan, else default logic
        
        const user = db.users.get(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Logic for specific plan or default
        let plan = db.vipPlans.find((p: any) => p.id === planId);
        if (!plan) {
            // Default fallback if no planId provided (legacy support)
            plan = db.vipPlans.find((p: any) => p.durationMonths === 1); 
        }

        if (!plan) return res.status(400).json({ error: "Invalid VIP Plan" });

        // Mock payment check or diamond deduction could happen here
        // For now, we assume direct activation

        const now = new Date();
        const currentExpiration = user.vipExpirationDate ? new Date(user.vipExpirationDate) : new Date();
        
        // If expired, start from now. If active, extend.
        const startDate = currentExpiration > now ? currentExpiration : now;
        const newExpiration = new Date(startDate);
        newExpiration.setDate(newExpiration.getDate() + (plan.durationMonths * 30));

        user.isVIP = true;
        user.vipSubscriptionDate = now.toISOString();
        user.vipExpirationDate = newExpiration.toISOString();

        // Log transaction (Simulated as Free/Direct for now or integrate with Wallet)
        const record: PurchaseRecord = {
            id: `sub_${Date.now()}`,
            userId: user.id,
            type: 'purchase_diamonds', // Reusing type or add 'subscription'
            description: `Assinatura VIP - ${plan.title}`,
            amountBRL: plan.price,
            amountCoins: 0,
            status: 'Concluído',
            timestamp: now.toISOString()
        };
        db.purchases.unshift(record);

        saveDb();
        webSocketServerInstance.broadcastUserUpdate(user);

        return res.status(200).json({ success: true, user, plan });
    }
};
