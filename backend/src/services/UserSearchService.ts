import { User, UserIndex } from '../models';

export class UserSearchService {
    /**
     * Atualizar ou adicionar usuário no índice de busca
     */
    static async updateUserIndex(user: any) {
        try {
            // Gerar searchTerms manualmente
            const name = (user.name || '').toLowerCase();
            const displayName = (user.displayName || user.name || '').toLowerCase();
            const identification = (user.identification || '').toLowerCase();
            
            const searchTerms = [
                name,
                displayName,
                identification,
                ...name.split(' ').filter((t: string) => t.length > 0),
                ...displayName.split(' ').filter((t: string) => t.length > 0),
                ...identification.split(' ').filter((t: string) => t.length > 0)
            ].filter((term: string, index: number, arr: string[]) => arr.indexOf(term) === index); // Remover duplicatas

            const indexData = {
                id: `user_idx_${user.id}`,
                userId: user.id,
                identification: user.identification,
                name: user.name,
                displayName: user.displayName || user.name,
                avatarUrl: user.avatarUrl,
                searchTerms: searchTerms, // Adicionar searchTerms explicitamente
                isActive: true,
                lastUpdated: new Date()
            };

            // Usar upsert para criar ou atualizar
            await UserIndex.findOneAndUpdate(
                { userId: user.id },
                indexData,
                { upsert: true, new: true }
            );

            console.log(`✅ Usuário ${user.name} adicionado/atualizado no índice de busca`);
        } catch (error: any) {
            console.error(`❌ Erro ao atualizar índice do usuário ${user.id}:`, error.message);
        }
    }

    /**
     * Remover usuário do índice (quando deletado)
     */
    static async removeUserFromIndex(userId: string) {
        try {
            await UserIndex.findOneAndDelete({ userId });
            console.log(`✅ Usuário ${userId} removido do índice de busca`);
        } catch (error: any) {
            console.error(`❌ Erro ao remover usuário do índice:`, error.message);
        }
    }

    /**
     * Buscar usuários por ID ou nome
     */
    static async searchUsers(query: string, limit: number = 20) {
        try {
            if (!query || query.trim().length < 2) {
                return [];
            }

            const searchTerm = query.trim().toLowerCase();

            // Busca por ID exato ou por termos de busca
            const results = await UserIndex.find({
                isActive: true,
                $or: [
                    { userId: searchTerm }, // Busca por ID exato
                    { searchTerms: { $regex: searchTerm, $options: 'i' } } // Busca por partes do nome
                ]
            })
            .limit(limit)
            .sort({ name: 1 });

            return results;
        } catch (error: any) {
            console.error('❌ Erro na busca de usuários:', error.message);
            return [];
        }
    }

    /**
     * Sincronizar todos os usuários existentes com o índice
     */
    static async syncAllUsers() {
        try {
            console.log('🔄 Iniciando sincronização de todos os usuários...');
            
            // Buscar todos os usuários ativos
            const users = await User.find({ 
                $or: [
                    { isActive: { $exists: false } },
                    { isActive: true }
                ]
            });

            console.log(`📊 Encontrados ${users.length} usuários para sincronizar`);

            // Atualizar cada usuário no índice
            for (const user of users) {
                await this.updateUserIndex(user);
            }

            console.log('✅ Sincronização concluída com sucesso!');
        } catch (error: any) {
            console.error('❌ Erro na sincronização:', error.message);
        }
    }

    /**
     * Limpar usuários inativos do índice
     */
    static async cleanupInactiveUsers() {
        try {
            console.log('🧹 Limpando usuários inativos do índice...');
            
            // Marcar como inativos usuários que não existem mais no banco principal
            const activeUserIds = await User.distinct('id');
            
            await UserIndex.updateMany(
                { userId: { $nin: activeUserIds } },
                { isActive: false }
            );

            console.log('✅ Limpeza concluída!');
        } catch (error: any) {
            console.error('❌ Erro na limpeza:', error.message);
        }
    }
}
