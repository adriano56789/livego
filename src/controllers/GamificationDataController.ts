
import { db, saveDb, LevelUser } from '../services/database';
// Fix: Import from types instead of database
import { LevelInfo } from '../types';

export const GamificationDataController = {
    // --- Level User ---
    async getLevelData(req: any, res: any) {
        const { userId } = req.params;
        const levelUser = db.levelUsers.get(userId);
        
        if (levelUser) return res.status(200).json(levelUser);

        // Fallback sync
        const user = db.users.get(userId);
        if (user) {
            const newLevelUser: LevelUser = {
                id: `lu_${userId}`,
                userId,
                currentXp: user.xp || 0
            };
            db.levelUsers.set(userId, newLevelUser);
            return res.status(200).json(newLevelUser);
        }
        return res.status(404).json({ error: "User not found" });
    },

    // --- Level Info (Definitions) ---
    async getLevelDefinitions(req: any, res: any) {
        return res.status(200).json(db.levelInfos || []); 
    }
};
