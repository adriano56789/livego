
import { db } from '../services/database';

export const LegalController = {
    async getDocument(req: any, res: any) {
        const { slug } = req.params;
        const doc = db.legalDocuments.find((d: any) => d.slug === slug);
        
        if (!doc) {
            return res.status(404).json({ error: "Document not found" });
        }
        return res.status(200).json(doc);
    },

    async listDocuments(req: any, res: any) {
        return res.status(200).json(db.legalDocuments.map((d: any) => ({
            slug: d.slug,
            title: d.title,
            version: d.version
        })));
    }
};
