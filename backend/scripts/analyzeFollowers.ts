import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Followers } from '../src/models';
import { User } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const analyzeCurrentFollowers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Listar todos os usuários existentes
        const users = await User.find({}, { id: 1, name: 1, email: 1 });
        console.log('\n👥 Usuários existentes:');
        users.forEach(user => {
            console.log(`  - ID: ${user.id} | Nome: ${user.name || 'N/A'} | Email: ${user.email || 'N/A'}`);
        });

        // Listar todos os registros de seguidores
        const followers = await Followers.find({});
        console.log('\n📊 Registros de seguidores:');
        
        if (followers.length === 0) {
            console.log('  - Nenhum registro encontrado');
        } else {
            for (const follower of followers) {
                const followerUser = users.find(u => u.id === follower.followerId);
                const followingUser = users.find(u => u.id === follower.followingId);
                
                console.log(`  - ${follower.followerId} segue ${follower.followingId}`);
                console.log(`    • Seguidor: ${followerUser?.name || 'USUÁRIO NÃO ENCONTRADO'} (${follower.followerId})`);
                console.log(`    • Seguido: ${followingUser?.name || 'USUÁRIO NÃO ENCONTRADO'} (${follower.followingId})`);
                console.log(`    • Desde: ${follower.followedAt.toLocaleDateString('pt-BR')}`);
                console.log(`    • Ativo: ${follower.isActive ? 'Sim' : 'Não'}`);
                console.log('');
            }
        }

        // Verificar se há algum "administrador" sendo seguido
        const adminFollows = followers.filter(f => 
            f.followingId.toLowerCase().includes('admin') || 
            f.followerId.toLowerCase().includes('admin')
        );

        if (adminFollows.length > 0) {
            console.log('⚠️  Registros envolvendo "admin":');
            adminFollows.forEach(follower => {
                console.log(`  - ${follower.followerId} segue ${follower.followingId}`);
            });
        } else {
            console.log('✅ Nenhum registro envolvendo "admin" encontrado');
        }

    } catch (error) {
        console.error('❌ Erro durante análise:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar análise
analyzeCurrentFollowers();
