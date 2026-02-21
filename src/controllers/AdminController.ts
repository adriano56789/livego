
import { db, saveDb, CURRENT_USER_ID, RefundRequest, Report } from '../services/database';
import { PurchaseRecord } from '../types';
import { webSocketServerInstance } from '../services/websocket';

export const AdminController = {
    async saveWithdrawalMethod(req: any, res: any) {
        const { email } = req.body;
        const admin = db.users.get(CURRENT_USER_ID);
        if (admin) {
            admin.adminWithdrawalMethod = { email };
            saveDb();
            return res.status(200).json({ success: true, user: admin });
        }
        return res.status(404).json({ error: "Admin not found" });
    },

    async withdrawPlatformEarnings(req: any, res: any) {
        const admin = db.users.get(CURRENT_USER_ID);
        const amount = db.platform_earnings;

        if (!admin) return res.status(404).json({ error: "Admin not found" });
        if (amount <= 0) return res.status(400).json({ error: "No funds" });

        const record: PurchaseRecord = {
            id: `adm_wd_${Date.now()}`,
            userId: CURRENT_USER_ID,
            type: 'withdraw_platform_earnings',
            description: 'Saque Administrativo',
            amountBRL: amount,
            amountCoins: 0,
            status: 'Concluído',
            timestamp: new Date().toISOString()
        };
        db.purchases.unshift(record);
        
        db.platform_earnings = 0;
        admin.platformEarnings = 0;
        
        saveDb();
        webSocketServerInstance.broadcastUserUpdate(admin);
        
        return res.status(200).json({ success: true, message: "Withdrawal successful" });
    },

    async getAdminHistory(req: any, res: any) {
        const { status } = req.query;
        // Filtra transações onde userId é o admin E o tipo é relevante
        let history = db.purchases.filter(p => 
            p.userId === CURRENT_USER_ID && 
            (p.type === 'withdraw_platform_earnings' || p.type === 'platform_fee_income')
        );

        if (status && status !== 'all') {
            history = history.filter(p => p.status === status);
        }
        
        history.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return res.status(200).json(history);
    },

    // --- Refund Logic (Model: RefundRequest) ---
    async requestRefund(req: any, res: any) {
        const { userId, purchaseRecordId, reason } = req.body;
        
        // Validation
        const purchase = db.purchases.find((p: any) => p.id === purchaseRecordId);
        if (!purchase) return res.status(404).json({ error: "Transaction not found" });
        if (purchase.userId !== userId) return res.status(403).json({ error: "Unauthorized" });

        const refund: RefundRequest = {
            id: `ref_${Date.now()}`,
            userId,
            purchaseRecordId,
            reason,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        db.refundRequests.push(refund);
        saveDb();
        return res.status(200).json({ success: true, refund });
    },

    async handleRefund(req: any, res: any) {
        const { refundId } = req.params;
        const { status, adminNotes } = req.body; // status: 'approved' | 'rejected'
        
        const refund = db.refundRequests.find((r: any) => r.id === refundId);
        if (!refund) return res.status(404).json({ error: "Refund request not found" });

        refund.status = status;
        refund.adminNotes = adminNotes;

        // If approved, reverse transaction logic
        if (status === 'approved') {
            const purchase = db.purchases.find((p: any) => p.id === refund.purchaseRecordId);
            if (purchase) {
                purchase.status = 'Cancelado'; // Update purchase record status
                
                // If diamonds were purchased, should we deduct them? 
                // For 'purchase_diamonds', yes.
                if (purchase.type === 'purchase_diamonds') {
                    const user = db.users.get(purchase.userId);
                    if (user) {
                        user.diamonds = Math.max(0, user.diamonds - purchase.amountCoins);
                        webSocketServerInstance.broadcastUserUpdate(user);
                    }
                }
            }
        }
        
        saveDb();
        return res.status(200).json({ success: true, refund });
    },
    
    // --- Report Logic (Model: Report) ---
    async getReports(req: any, res: any) {
        return res.status(200).json(db.reports);
    },
    
    async resolveReport(req: any, res: any) {
        const { reportId } = req.params;
        const { status } = req.body;
        const report = db.reports.find((r: Report) => r.id === reportId);
        if(report) {
            report.status = status;
            saveDb();
            return res.status(200).json({ success: true });
        }
        return res.status(404).json({ error: "Report not found" });
    }
};