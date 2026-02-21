

import { db } from '../services/database';

export const SystemController = {
    async getCountries(req: any, res: any) {
        const activeCountries = db.countries.filter((c: any) => c.isActive);
        return res.status(200).json(activeCountries);
    },

    async getFAQ(req: any, res: any) {
        // Simple mock data serving
        const faqs = [
            { id: '1', question: 'Como comprar diamantes?', answer: 'Vá até a carteira e selecione um pacote.', order: 1 },
            { id: '2', question: 'Como iniciar uma live?', answer: 'Clique no botão central no menu inferior.', order: 2 }
        ];
        return res.status(200).json(faqs);
    },

    async getAppVersion(req: any, res: any) {
        // Logic for AppVersion model
        return res.status(200).json(db.appVersion);
    },

    async getLegalDocument(req: any, res: any) {
        // Logic for LegalDocument model
        const { slug } = req.params; // e.g. privacy-policy
        const doc = db.legalDocuments.find((d: any) => d.slug === slug);
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        return res.status(200).json(doc);
    },
    
    async getTags(req: any, res: any) {
        // Logic for ProfileTag model
        const activeTags = db.profileTags.filter((t: any) => t.isActive);
        return res.status(200).json(activeTags);
    }
};