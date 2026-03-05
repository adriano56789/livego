import { UserSearchService } from '../services/UserSearchService';

// Middleware para atualizar o índice de busca automaticamente
export const updateUserSearchIndex = async (user: any, operation: 'create' | 'update' | 'delete') => {
    try {
        switch (operation) {
            case 'create':
            case 'update':
                await UserSearchService.updateUserIndex(user);
                break;
            case 'delete':
                await UserSearchService.removeUserFromIndex(user.id || user._id);
                break;
        }
    } catch (error: any) {
        console.error(`❌ Erro ao atualizar índice de busca (${operation}):`, error.message);
    }
};
