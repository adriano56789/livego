import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Followers, Follow, Friendship } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const migrateToFollowers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // 1. Verificar dados existentes na coleção Follow
        console.log('🔍 Verificando dados na coleção Follow...');
        const oldFollows = await Follow.find({ isActive: true });
        console.log(`📊 Encontrados ${oldFollows.length} follows na coleção antiga`);

        if (oldFollows.length === 0) {
            console.log('✅ Nenhum dado para migrar - coleção Follow vazia');
            return;
        }

        // 2. Verificar se já existem dados na coleção Followers
        console.log('\n🔍 Verificando coleção Followers...');
        const existingFollowers = await Followers.find({ isActive: true });
        console.log(`📊 Já existem ${existingFollowers.length} follows na coleção Followers`);

        if (existingFollowers.length > 0) {
            console.log('⚠️ Coleção Followers já tem dados. Deseja limpar e migrar novamente?');
            console.log('💡 Para limpar, execute: npm run clean-followers');
            return;
        }

        // 3. Migrar dados para a nova coleção
        console.log('\n🔄 Migrando dados para coleção Followers...');
        
        let migratedCount = 0;
        for (const oldFollow of oldFollows) {
            // Criar novo registro na coleção Followers
            await Followers.create({
                id: `followers_${oldFollow.followerId}_${oldFollow.followingId}_${Date.now()}`,
                followerId: oldFollow.followerId,
                followingId: oldFollow.followingId,
                followedAt: oldFollow.followedAt,
                isActive: true
            });
            
            migratedCount++;
            
            if (migratedCount % 10 === 0) {
                console.log(`📝 Migrados: ${migratedCount}/${oldFollows.length}`);
            }
        }

        console.log(`✅ Migração concluída! ${migratedCount} follows migrados para coleção Followers`);

        // 4. Verificar migração
        console.log('\n🔍 Verificando migração...');
        const newFollowers = await Followers.find({ isActive: true });
        console.log(`📊 Total na coleção Followers: ${newFollowers.length}`);

        // 5. Comparar dados
        if (newFollowers.length === oldFollows.length) {
            console.log('✅ Migração perfeita - todos os dados foram migrados!');
        } else {
            console.log('⚠️ Diferença encontrada - verifique os dados');
        }

        // 6. Mostrar exemplos
        console.log('\n📝 Exemplos de dados migrados:');
        for (let i = 0; i < Math.min(3, newFollowers.length); i++) {
            const follower = newFollowers[i];
            const followerUser = await User.findOne({ id: follower.followerId });
            const followingUser = await User.findOne({ id: follower.followingId });
            
            console.log(`  ${i + 1}. ${followerUser?.name || follower.followerId} segue ${followingUser?.name || follower.followingId}`);
        }

        // 7. Estatísticas finais
        console.log('\n📊 Estatísticas finais:');
        console.log(`👥 Usuários REAIS: ${await User.countDocuments()}`);
        console.log(`📋 Coleção Follow (antiga): ${oldFollows.length} registros`);
        console.log(`📋 Coleção Followers (nova): ${newFollowers.length} registros`);
        console.log(`🤝 Amizades: ${await Friendship.countDocuments({ isActive: true })}`);

        console.log('\n🎉 Migração concluída com sucesso!');
        console.log('💡 Agora o sistema usa a coleção Followers para seguidores!');
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar migração
migrateToFollowers();
