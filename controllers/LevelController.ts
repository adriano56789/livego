
import { db, saveDb, LevelPrivilege } from '../services/database';

export const LevelController = {
    async getPrivileges(req: any, res: any) {
        const { level } = req.query;
        let privileges = db.levelPrivileges;
        
        if (level) {
            const userLevel = parseInt(level as string);
            privileges = privileges.filter(p => p.levelRequirement <= userLevel && p.isActive);
        }
        
        return res.status(200).json(privileges);
    },

    async createPrivilege(req: any, res: any) {
        const { levelRequirement, title, description, iconUrl, type } = req.body;
        const newPrivilege: LevelPrivilege = {
            id: `priv_${Date.now()}`,
            levelRequirement,
            title,
            description,
            iconUrl,
            type,
            isActive: true
        };
        db.levelPrivileges.push(newPrivilege);
        saveDb();
        return res.status(201).json(newPrivilege);
    }
};
