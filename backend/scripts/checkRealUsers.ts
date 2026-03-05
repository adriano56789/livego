import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const checkRealUsers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Buscar todos os usuários reais no banco
        console.log('🔍 Buscando usuários reais no banco...');
        
        const users = await User.find({}).select('id name avatarUrl diamonds level xp fans following isOnline lastSeen');
        
        console.log(`📊 Total de usuários encontrados: ${users.length}`);
        
        if (users.length === 0) {
            console.log('❌ Nenhum usuário encontrado no banco!');
            console.log('💡 Execute primeiro: npm run create-users');
            return;
        }
        
        console.log('\n👥 Usuários REAIS encontrados:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id} | Nome: ${user.name} | Level: ${user.level} | Diamonds: ${user.diamonds}`);
        });
        
        console.log('\n🎯 IDs REAIS para usar nos scripts:');
        const realIds = users.map(u => u.id);
        console.log('IDs:', realIds.join(', '));
        
    } catch (error) {
        console.error('❌ Erro ao verificar usuários:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar verificação
checkRealUsers();
