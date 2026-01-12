import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';

export const taskController = {
    getQuickCompleteFriends: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const mockFriends = [
                { id: 'qf-1', name: 'Amigo Rápido 1', status: 'pendente' },
                { id: 'qf-2', name: 'Amigo Rápido 2', status: 'concluido' },
            ];
            return sendSuccess(res, mockFriends);
        } catch (error) {
            next(error);
        }
    },
    completeQuickFriendTask: async (req: Request, res: Response, next: NextFunction) => {
        try {
            return sendSuccess(res, { success: true }, "Tarefa concluída.");
        } catch (error) {
            next(error);
        }
    }
};
