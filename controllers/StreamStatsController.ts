
import { db, saveDb, StreamContributor, StreamSummary } from '../services/database';

export const StreamStatsController = {
    // --- Stream Contributors ---
    async getTopContributors(req: any, res: any) {
        const { streamId } = req.params;
        const contributors = db.streamContributors
            .filter(c => c.streamId === streamId)
            .sort((a, b) => b.amount - a.amount);
        return res.status(200).json(contributors);
    },
    
    async logContribution(req: any, res: any) {
        const { streamId, userId, amount } = req.body;
        let contributor = db.streamContributors.find(c => c.streamId === streamId && c.userId === userId);
        
        if (contributor) {
            contributor.amount += amount;
        } else {
            contributor = {
                id: `sc_${Date.now()}`,
                streamId,
                userId,
                amount
            };
            db.streamContributors.push(contributor);
        }
        saveDb();
        return res.status(200).json({ success: true });
    },

    // --- Stream Summary ---
    async createSummary(req: any, res: any) {
        const summary: StreamSummary = {
            id: `ss_${Date.now()}`,
            ...req.body
        };
        db.streamSummaries.push(summary);
        saveDb();
        return res.status(201).json(summary);
    },
    
    async getSummary(req: any, res: any) {
        const { streamId } = req.params;
        const summary = db.streamSummaries.find(s => s.streamId === streamId);
        if (!summary) return res.status(404).json({ error: "Summary not found" });
        return res.status(200).json(summary);
    }
};
