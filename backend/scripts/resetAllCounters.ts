import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models';
import { Followers } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const resetAllCounters = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Buscar todos os usuários
        const users = await User.find({});
        console.log(`👥 Encontrados ${users.length} usuários`);

        // Zerar todos os contadores
        for (const user of users) {
            console.log(`\n🔄 Zerando contadores do usuário: ${user.name} (${user.id})`);
            
            // Contar valores reais
            const fansCount = await mongoose.connection.collection('followers').countDocuments({
                followingId: user.id,
                isActive: true
            });
            
            const followingCount = await mongoose.connection.collection('followers').countDocuments({
                followerId: user.id,
                isActive: true
            });
            
            console.log(`- Contagem real: fans=${fansCount}, following=${followingCount}`);
            console.log(`- Valores atuais: fans=${user.fans || 0}, following=${user.following || 0}`);
            
            // Zerar os contadores
            await User.updateOne(
                { id: user.id },
                { 
                    fans: 0,
                    following: 0
                }
            );
            
            console.log(`✅ Contadores zerados para: fans=0, following=0`);
        }

        // Verificação final
        console.log('\n🔍 Verificação final:');
        const usersAfter = await User.find({});
        let totalFans = 0;
        let totalFollowing = 0;
        
        usersAfter.forEach(user => {
            totalFans += user.fans || 0;
            totalFollowing += user.following || 0;
            console.log(`- ${user.name}: fans=${user.fans || 0}, following=${user.following || 0}`);
        });
        
        console.log(`\n📊 Totais: fans=${totalFans}, following=${totalFollowing}`);
        
        // Verificar se há seguidores ativos
        const activeFollows = await Followers.countDocuments({ isActive: true });
        console.log(`📊 Follows ativos no banco: ${activeFollows}`);
        
        if (totalFans === 0 && totalFollowing === 0) {
            console.log('\n🎉 SUCESSO! Todos os contadores zerados!');
            console.log('Agora o perfil deve mostrar "0 Seguindo" e "0 Fãs"');
        } else {
            console.log('\n⚠️  Ainda há contadores diferentes de zero');
        }

    } catch (error) {
        console.error('❌ Erro ao zerar contadores:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar reset
resetAllCounters();
