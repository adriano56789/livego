
import { db } from '../services/database';

export const LeaderboardController = {
    async getRanking(req: any, res: any) {
        const { period } = req.params;
        
        // Simulação de lógica de ranking baseada no período
        // O `db.topFansUsers` contém dados mockados populados no `database.ts`
        // Em um app real, isso faria agregações no MongoDB
        
        let data = [];
        
        switch(period) {
            case 'daily':
                data = db.topFansUsers; // Mock: usa os top fans como base
                break;
            case 'weekly':
                data = db.topFansUsers;
                break;
            case 'monthly':
                data = db.topFansUsers;
                break;
            default:
                data = [];
        }

        return res.status(200).json(data);
    }
};
