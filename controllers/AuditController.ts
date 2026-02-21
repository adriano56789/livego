
import { db, saveDb, CURRENT_USER_ID, StreamViewer, ProfileShare, StreamModerationLog, PaymentTransaction } from '../services/database';

export const AuditController = {
    // --- Stream Viewers Logging ---
    async recordStreamView(req: any, res: any) {
        const { streamId, userId, device } = req.body;
        
        const viewerLog: StreamViewer = {
            id: `view_${Date.now()}_${Math.random()}`,
            streamId,
            userId: userId || CURRENT_USER_ID,
            joinedAt: new Date().toISOString(),
            device: device || 'web',
            isGhost: false
        };
        
        db.streamViewers.push(viewerLog);
        saveDb();
        return res.status(200).json({ success: true, logId: viewerLog.id });
    },

    async updateStreamView(req: any, res: any) {
        const { logId, leftAt } = req.body;
        const log = db.streamViewers.find(v => v.id === logId);
        if (log) {
            log.leftAt = leftAt || new Date().toISOString();
            saveDb();
            return res.status(200).json({ success: true });
        }
        return res.status(404).json({ error: "Log not found" });
    },

    // --- Profile Shares ---
    async recordProfileShare(req: any, res: any) {
        const { profileId, platform } = req.body;
        const share: ProfileShare = {
            id: `share_${Date.now()}`,
            sharerId: CURRENT_USER_ID,
            profileId,
            platform,
            createdAt: new Date().toISOString()
        };
        db.profileShares.push(share);
        saveDb();
        return res.status(200).json({ success: true });
    },

    // --- Moderation Logs ---
    async logModerationAction(req: any, res: any) {
        const { streamId, targetUserId, action, reason } = req.body;
        const log: StreamModerationLog = {
            id: `mod_${Date.now()}`,
            streamId,
            moderatorId: CURRENT_USER_ID,
            targetUserId,
            action,
            reason,
            createdAt: new Date().toISOString()
        };
        db.streamModerationLogs.push(log);
        saveDb();
        return res.status(200).json({ success: true });
    },

    // --- Payment Transactions (Gateway Logs) ---
    async logPaymentTransaction(req: any, res: any) {
        const { orderId, gatewayTransactionId, gatewayStatus, amountProcessed, paymentMethod } = req.body;
        const log: PaymentTransaction = {
            id: `pay_${Date.now()}`,
            orderId,
            gatewayTransactionId,
            gatewayStatus,
            paymentMethod,
            amountProcessed,
            currency: 'BRL',
            createdAt: new Date().toISOString()
        };
        db.paymentTransactions.push(log);
        saveDb();
        return res.status(200).json({ success: true, logId: log.id });
    },

    async getTransactionLogs(req: any, res: any) {
        // Admin only in real app
        return res.status(200).json(db.paymentTransactions);
    }
};
