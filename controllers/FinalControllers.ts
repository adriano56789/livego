
import { db, saveDb, Fan, Transaction } from '../services/database';

export const FanController = {
    async getFans(req: any, res: any) {
        const { userId } = req.params;
        const fans = db.fanRecords.filter(f => f.userId === userId);
        return res.status(200).json(fans);
    },
    async addFan(req: any, res: any) {
        const { userId, fanId } = req.body;
        const fan: Fan = { id: `fan_${Date.now()}`, userId, fanId, createdAt: new Date().toISOString() };
        db.fanRecords.push(fan);
        saveDb();
        return res.status(201).json(fan);
    }
};

export const StreamHistoryController = {
    async getHistory(req: any, res: any) {
        const { userId } = req.params;
        const history = db.streamHistory.filter(h => h.streamerId === userId);
        return res.status(200).json(history);
    }
};

export const DiamondPackageController = {
    async getPackages(req: any, res: any) {
        return res.status(200).json(db.diamondPackages);
    },
    async createPackage(req: any, res: any) {
        const pkg = { id: `pkg_${Date.now()}`, ...req.body, isActive: true };
        db.diamondPackages.push(pkg);
        saveDb();
        return res.status(201).json(pkg);
    }
};

export const LegalDocumentController = {
    async getDocument(req: any, res: any) {
        const { slug } = req.params;
        const doc = db.legalDocuments.find(d => d.slug === slug);
        if (!doc) return res.status(404).json({ error: "Document not found" });
        return res.status(200).json(doc);
    }
};

export const TransactionController = {
    async getTransactions(req: any, res: any) {
        const { userId } = req.params;
        const transactions = db.transactions.filter(t => t.userId === userId);
        return res.status(200).json(transactions);
    },
    async createTransaction(req: any, res: any) {
        const transaction: Transaction = { id: `txn_${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
        db.transactions.push(transaction);
        saveDb();
        return res.status(201).json(transaction);
    }
};
