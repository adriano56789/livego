import { db, saveDb, CURRENT_USER_ID } from '../services/database';

/**
 * Controller responsável pelas operações de conta do usuário.
 * Mapeado para as rotas /api/account/
 */
export const AccountController = {
    /**
     * Solicita a exclusão da conta.
     * Rota: POST /api/account/delete-request
     */
    async requestDeletion(req: any, res: any) {
        try {
            const { userId, reason } = req.body;
            // Usa o ID do corpo ou o ID do usuário logado (10755083)
            const targetId = userId || CURRENT_USER_ID;

            const user = db.users.get(String(targetId));
            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado." });
            }

            // Verifica se já existe uma solicitação pendente
            const existing = db.accountDeletionRequests.find(r => r.userId === targetId && r.status === 'pending');
            if (existing) {
                return res.status(400).json({ error: "Já existe uma solicitação de exclusão pendente para esta conta." });
            }

            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + 30); // Período de carência de 30 dias

            const request = {
                id: `del_${Date.now()}`,
                userId: String(targetId),
                reason: reason || "Não especificado",
                status: 'pending',
                scheduledFor: scheduledDate.toISOString(),
                createdAt: new Date().toISOString()
            };

            db.accountDeletionRequests.push(request as any);
            saveDb();

            console.log(`[Account] Deletion requested for user ${targetId}`);
            return res.status(200).json({ 
                success: true, 
                message: "Solicitação de exclusão registrada. A conta será removida em 30 dias.",
                request 
            });
        } catch (error) {
            return res.status(500).json({ error: "Erro interno ao processar exclusão." });
        }
    },

    /**
     * Cancela uma solicitação de exclusão pendente.
     * Rota: POST /api/account/delete-request/cancel
     */
    async cancelDeletion(req: any, res: any) {
        try {
            const { userId } = req.body;
            const targetId = userId || CURRENT_USER_ID;

            const request = db.accountDeletionRequests.find(r => r.userId === String(targetId) && r.status === 'pending');
            
            if (!request) {
                return res.status(404).json({ error: "Nenhuma solicitação de exclusão pendente encontrada." });
            }

            request.status = 'cancelled';
            saveDb();

            console.log(`[Account] Deletion cancelled for user ${targetId}`);
            return res.status(200).json({ success: true, message: "Exclusão cancelada com sucesso." });
        } catch (error) {
            return res.status(500).json({ error: "Erro interno ao cancelar exclusão." });
        }
    }
};