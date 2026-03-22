import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Followers } from '../src/models';
import { User } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const cleanOrphanedFollowers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Contar registros antes da limpeza
        const beforeCount = await Followers.countDocuments();
        console.log(`📊 Total de registros de seguidores antes: ${beforeCount}`);

        if (beforeCount === 0) {
            console.log('✅ Coleção Followers já está vazia');
            return;
        }

        // Buscar todos os registros de seguidores
        const allFollowers = await Followers.find({});
        console.log(`🔍 Analisando ${allFollowers.length} registros de seguidores...`);

        // Arrays para armazenar IDs inválidos
        const invalidFollowerIds = new Set<string>();
        const invalidFollowingIds = new Set<string>();
        const recordsToDelete = new Set<string>();

        // Buscar todos os IDs de usuários existentes
        const existingUsers = await User.find({}, { id: 1 });
        const existingUserIds = new Set(existingUsers.map(user => user.id));
        console.log(`👥 Usuários existentes no banco: ${existingUserIds.size}`);

        // Analisar cada registro de seguidor
        for (const follower of allFollowers) {
            let hasInvalidUser = false;

            // Verificar se o seguidor existe
            if (!existingUserIds.has(follower.followerId)) {
                console.log(`❌ Seguidor não encontrado: ${follower.followerId} (seguindo ${follower.followingId})`);
                invalidFollowerIds.add(follower.followerId);
                hasInvalidUser = true;
            }

            // Verificar se o usuário sendo seguido existe
            if (!existingUserIds.has(follower.followingId)) {
                console.log(`❌ Usuário seguido não encontrado: ${follower.followingId} (seguido por ${follower.followerId})`);
                invalidFollowingIds.add(follower.followingId);
                hasInvalidUser = true;
            }

            // Se qualquer um dos usuários não existir, marcar para deleção
            if (hasInvalidUser) {
                recordsToDelete.add(follower.id);
            }
        }

        console.log(`\n📈 Resumo:`);
        console.log(`- Seguidores inexistentes: ${invalidFollowerIds.size}`);
        console.log(`- Usuários seguidos inexistentes: ${invalidFollowingIds.size}`);
        console.log(`- Registros para remover: ${recordsToDelete.size}`);

        if (recordsToDelete.size === 0) {
            console.log('✅ Nenhum registro inválido encontrado! Banco de dados está consistente.');
            return;
        }

        // Confirmar antes de deletar
        console.log('\n⚠️  ATENÇÃO: Isso removerá permanentemente os registros inválidos.');
        console.log('Deseja continuar? (Ctrl+C para cancelar)');
        
        // Aguardar 3 segundos antes de prosseguir (tempo para cancelar)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Deletar registros inválidos
        console.log('🧹 Removendo registros inválidos...');
        const deleteResult = await Followers.deleteMany({
            id: { $in: Array.from(recordsToDelete) }
        });

        console.log(`✅ Removidos ${deleteResult.deletedCount} registros inválidos`);

        // Verificar resultado final
        const afterCount = await Followers.countDocuments();
        console.log(`📊 Total de registros após limpeza: ${afterCount}`);

        // Verificar consistência restante
        const remainingFollowers = await Followers.find({});
        let stillInvalid = 0;
        
        for (const follower of remainingFollowers) {
            if (!existingUserIds.has(follower.followerId) || !existingUserIds.has(follower.followingId)) {
                stillInvalid++;
            }
        }

        if (stillInvalid === 0) {
            console.log('✅ Todos os registros inválidos foram removidos! Banco de dados agora está consistente.');
        } else {
            console.log(`⚠️  Ainda existem ${stillInvalid} registros inválidos. Verifique manualmente.`);
        }

    } catch (error) {
        console.error('❌ Erro durante limpeza:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar limpeza
cleanOrphanedFollowers();
