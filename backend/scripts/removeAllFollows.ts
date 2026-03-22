import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Followers } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const removeAllFollows = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Verificar follows ativos
        const activeFollows = await Followers.find({ isActive: true });
        console.log(`📊 Follows ativos encontrados: ${activeFollows.length}`);

        if (activeFollows.length > 0) {
            console.log('\n🔍 Registros encontrados:');
            activeFollows.forEach(follow => {
                console.log(`- ${follow.followerId} segue ${follow.followingId} (Desde: ${follow.followedAt.toLocaleDateString('pt-BR')})`);
            });

            // Remover todos os follows
            console.log('\n🧹 Removendo todos os registros de follows...');
            const deleteResult = await Followers.deleteMany({ isActive: true });
            console.log(`✅ Removidos ${deleteResult.deletedCount} registros`);

            // Verificação final
            const remainingFollows = await Followers.countDocuments({ isActive: true });
            console.log(`📊 Follows restantes: ${remainingFollows}`);

            if (remainingFollows === 0) {
                console.log('\n🎉 SUCESSO! Não há mais registros de seguidores!');
                console.log('Agora o sistema está 100% limpo:');
                console.log('- "0 Seguindo" ✅');
                console.log('- "0 Fãs" ✅');
                console.log('- Páginas vazias corretamente ✅');
            }
        } else {
            console.log('✅ Não há follows ativos para remover');
        }

    } catch (error) {
        console.error('❌ Erro ao remover follows:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar remoção
removeAllFollows();
