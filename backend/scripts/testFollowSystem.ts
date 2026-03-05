import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Follow, Friendship } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const testFollowSystem = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Buscar usuários REAIS
        console.log('🔍 Buscando usuários REAIS...');
        const users = await User.find({});
        
        if (users.length < 2) {
            console.log('❌ Precisa de pelo menos 2 usuários para testar!');
            return;
        }

        const user1 = users[0]; // Quem vai seguir
        const user2 = users[1]; // Quem vai ser seguido

        console.log(`\n📝 Teste: ${user1.name} (${user1.id}) segue ${user2.name} (${user2.id})`);

        // 1. Verificar estado ANTES do follow
        console.log('\n🔍 Estado ANTES:');
        const user1FollowingBefore = await Follow.find({ followerId: user1.id, isActive: true });
        const user2FansBefore = await Follow.find({ followingId: user2.id, isActive: true });
        
        console.log(`👤 ${user1.name} segue: ${user1FollowingBefore.length} usuários`);
        console.log(`👥 ${user2.name} tem: ${user2FansBefore.length} fãs`);

        // 2. Simular follow
        console.log('\n➕ Criando follow...');
        await Follow.create({
            id: `test_follow_${user1.id}_${user2.id}_${Date.now()}`,
            followerId: user1.id,
            followingId: user2.id,
            followedAt: new Date(),
            isActive: true
        });

        // 3. Atualizar listas dos usuários
        console.log('🔄 Atualizando listas...');
        await User.findOneAndUpdate(
            { id: user1.id },
            { 
                $inc: { following: 1 },
                $push: { followingList: user2.id }
            }
        );
        
        await User.findOneAndUpdate(
            { id: user2.id },
            { 
                $inc: { fans: 1 },
                $push: { followersList: user1.id },
                isFollowed: true
            }
        );

        // 4. Verificar estado DEPOIS do follow
        console.log('\n🔍 Estado DEPOIS:');
        const user1FollowingAfter = await Follow.find({ followerId: user1.id, isActive: true });
        const user2FansAfter = await Follow.find({ followingId: user2.id, isActive: true });
        
        console.log(`👤 ${user1.name} segue: ${user1FollowingAfter.length} usuários`);
        console.log(`👥 ${user2.name} tem: ${user2FansAfter.length} fãs`);

        // 5. Verificar listas nos usuários
        const user1Updated = await User.findOne({ id: user1.id });
        const user2Updated = await User.findOne({ id: user2.id });

        console.log('\n📋 Listas atualizadas:');
        console.log(`👤 ${user1.name} followingList: [${user1Updated?.followingList?.join(', ') || 'vazia'}]`);
        console.log(`👥 ${user2.name} followersList: [${user2Updated?.followersList?.join(', ') || 'vazia'}]`);

        // 6. Testar APIs
        console.log('\n🌐 Testando APIs...');
        
        // API de following
        const followingResponse = await fetch(`http://localhost:3000/api/users/${user1.id}/following`);
        const followingData = await followingResponse.json();
        console.log(`📊 API /following (${user1.name}): ${followingData.length} usuários`);

        // API de fans
        const fansResponse = await fetch(`http://localhost:3000/api/users/${user2.id}/fans`);
        const fansData = await fansResponse.json();
        console.log(`📊 API /fans (${user2.name}): ${fansData.length} fãs`);

        // 7. Verificar se user1 aparece nos fãs de user2
        const user1AppearsInFans = fansData.some((fan: any) => fan.id === user1.id);
        const user2AppearsInFollowing = followingData.some((follow: any) => follow.id === user2.id);

        console.log('\n✅ Resultado:');
        console.log(`${user1.name} aparece nos fãs de ${user2.name}: ${user1AppearsInFans ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`${user2.name} aparece no seguindo de ${user1.name}: ${user2AppearsInFollowing ? '✅ SIM' : '❌ NÃO'}`);

        if (user1AppearsInFans && user2AppearsInFollowing) {
            console.log('\n🎉 Sistema de seguidores funcionando PERFEITAMENTE!');
        } else {
            console.log('\n❌ PROBLEMA no sistema de seguidores!');
        }

        // 8. Limpar teste
        console.log('\n🧹 Limpando dados de teste...');
        await Follow.deleteOne({ 
            followerId: user1.id, 
            followingId: user2.id 
        });
        
        await User.findOneAndUpdate(
            { id: user1.id },
            { 
                $inc: { following: -1 },
                $pull: { followingList: user2.id }
            }
        );
        
        await User.findOneAndUpdate(
            { id: user2.id },
            { 
                $inc: { fans: -1 },
                $pull: { followersList: user1.id },
                isFollowed: false
            }
        );

        console.log('✅ Teste concluído e limpo!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar teste
testFollowSystem();
