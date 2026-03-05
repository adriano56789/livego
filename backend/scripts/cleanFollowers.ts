import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Followers } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const cleanFollowers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Verificar quantidade antes de limpar
        const beforeCount = await Followers.countDocuments();
        console.log(`📊 Followers antes de limpar: ${beforeCount}`);

        if (beforeCount === 0) {
            console.log('✅ Coleção Followers já está vazia');
            return;
        }

        // Limpar coleção
        console.log('🧹 Limpando coleção Followers...');
        await Followers.deleteMany({});

        // Verificar depois de limpar
        const afterCount = await Followers.countDocuments();
        console.log(`📊 Followers depois de limpar: ${afterCount}`);

        if (afterCount === 0) {
            console.log('✅ Coleção Followers limpa com sucesso!');
            console.log('💡 Agora pode executar: npm run migrate-followers');
        } else {
            console.log('❌ Erro ao limpar coleção Followers');
        }
        
    } catch (error) {
        console.error('❌ Erro ao limpar:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar limpeza
cleanFollowers();
