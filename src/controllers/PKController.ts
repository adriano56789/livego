
import { db, saveDb } from '../services/database';
import { webSocketServerInstance } from '../services/websocket';

export const PKController = {
    async getConfig(req: any, res: any) {
        return res.status(200).json(db.pkDefaultConfig);
    },

    async updateConfig(req: any, res: any) {
        const { duration } = req.body;
        if (typeof duration === 'number' && duration > 0) {
            db.pkDefaultConfig.duration = duration;
            saveDb();
            return res.status(200).json({ success: true, config: db.pkDefaultConfig });
        }
        return res.status(400).json({ error: 'Invalid duration.' });
    },

    async startBattle(req: any, res: any) {
        const { streamId, opponentId } = req.body;
        const stream = db.streamers.find(s => s.id === streamId);
        
        if (!stream) return res.status(404).json({ error: "Stream not found." });

        // Inicializa o estado da batalha no DB em memória
        db.pkBattles.set(streamId, { 
            opponentId, 
            heartsA: 0, 
            heartsB: 0, 
            scoreA: 0, 
            scoreB: 0 
        });
        
        saveDb();
        return res.status(200).json({ success: true });
    },

    async endBattle(req: any, res: any) {
        const { streamId } = req.body; 
        if (db.pkBattles.has(streamId)) {
            db.pkBattles.delete(streamId);
            saveDb();
            return res.status(200).json({ success: true });
        }
        return res.status(404).json({ error: "No active battle found." });
    },

    async sendHeart(req: any, res: any) {
        const { roomId, team } = req.body;
        const battle = db.pkBattles.get(roomId);
        
        if (battle) {
            if (team === 'A') battle.heartsA++; 
            else battle.heartsB++;
            
            // Notifica via WebSocket para atualização em tempo real
            webSocketServerInstance.broadcastPKHeartUpdate(roomId, battle.heartsA, battle.heartsB);
            return res.status(200).json({ success: true });
        }
        return res.status(404).json({ error: "Battle not found" });
    }
};
