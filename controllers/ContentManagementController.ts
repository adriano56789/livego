
import { db, saveDb, FAQ, StreamManual } from '../services/database';

export const ContentManagementController = {
    // --- FAQ ---
    async listFAQs(req: any, res: any) {
        const faqs = db.faqs.filter(f => f.isActive).sort((a, b) => a.order - b.order);
        return res.status(200).json(faqs);
    },
    async createFAQ(req: any, res: any) {
        const { question, answer, order } = req.body;
        const newFaq: FAQ = {
            id: `faq_${Date.now()}`,
            question,
            answer,
            order: order || db.faqs.length + 1,
            isActive: true
        };
        db.faqs.push(newFaq);
        saveDb();
        return res.status(201).json(newFaq);
    },

    // --- STREAM MANUAL ---
    async getStreamManual(req: any, res: any) {
        const manual = db.streamManuals.sort((a, b) => a.order - b.order);
        return res.status(200).json(manual);
    },
    async updateStreamManualSection(req: any, res: any) {
        const { id } = req.params;
        const index = db.streamManuals.findIndex(m => m.id === id);
        if (index > -1) {
            db.streamManuals[index] = { ...db.streamManuals[index], ...req.body };
            saveDb();
            return res.status(200).json({ success: true, section: db.streamManuals[index] });
        }
        return res.status(404).json({ error: "Manual section not found" });
    },

    // --- APP VERSION ---
    async getLatestVersion(req: any, res: any) {
        const { platform } = req.query;
        // In real app, filter by platform. Here return default.
        return res.status(200).json(db.appVersion);
    },
    async updateVersion(req: any, res: any) {
        db.appVersion = { ...db.appVersion, ...req.body };
        saveDb();
        return res.status(200).json({ success: true, version: db.appVersion });
    }
};
