
import { db, saveDb } from '../services/database';
// Fix: Import from types instead of database
import { DiamondPackage } from '../types';

export const EconomyController = {
    // --- DIAMOND PACKAGES ---
    async getPackages(req: any, res: any) {
        const packages = db.diamondPackages.filter(p => (p as any).isActive).sort((a, b) => a.price - b.price);
        return res.status(200).json(packages);
    },
    async createPackage(req: any, res: any) {
        const pkg: DiamondPackage = {
            id: `pkg_${Date.now()}`,
            isActive: true,
            ...req.body
        };
        db.diamondPackages.push(pkg as any);
        saveDb();
        return res.status(201).json(pkg);
    },

    // --- EARNINGS POLICY ---
    async getEarningsPolicy(req: any, res: any) {
        return res.status(200).json(db.earningsPolicy);
    },
    async updateEarningsPolicy(req: any, res: any) {
        db.earningsPolicy = { ...db.earningsPolicy, ...req.body };
        saveDb();
        return res.status(200).json({ success: true, policy: db.earningsPolicy });
    },

    // --- VIP PLANS ---
    async getVipPlans(req: any, res: any) {
        const plans = db.vipPlans.filter(p => p.isActive);
        return res.status(200).json(plans);
    },
    async updateVipPlan(req: any, res: any) {
        const { id } = req.params;
        const index = db.vipPlans.findIndex(p => p.id === id);
        if (index > -1) {
            db.vipPlans[index] = { ...db.vipPlans[index], ...req.body };
            saveDb();
            return res.status(200).json({ success: true, plan: db.vipPlans[index] });
        }
        return res.status(404).json({ error: "Plan not found" });
    }
};
