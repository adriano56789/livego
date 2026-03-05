import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserIndex } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function debugUserIndex() {
    console.log('=== DEBUG DO ÍNDICE DE USUÁRIOS ===');
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected successfully');

        // Verificar todos os documentos no UserIndex
        const allUsers = await UserIndex.find({});
        console.log(`📊 Total de usuários no índice: ${allUsers.length}`);
        
        allUsers.forEach((user, index) => {
            console.log(`\n👤 Usuário ${index + 1}:`);
            console.log(`   ID: ${user.id}`);
            console.log(`   UserID: ${user.userId}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   DisplayName: ${user.displayName}`);
            console.log(`   SearchTerms: ${JSON.stringify(user.searchTerms)}`);
            console.log(`   IsActive: ${user.isActive}`);
        });

        // Testar busca manual
        console.log('\n🔍 Testando busca manual:');
        const searchResults = await UserIndex.find({
            isActive: true,
            $or: [
                { userId: 'adriano' },
                { searchTerms: { $regex: 'adriano', $options: 'i' } }
            ]
        });
        
        console.log(`📋 Resultados da busca manual: ${searchResults.length}`);
        searchResults.forEach(user => {
            console.log(`   Encontrado: ${user.name} (${user.userId})`);
        });

    } catch (error: any) {
        console.error('❌ Erro:', error.message);
    }
    
    process.exit(0);
}

debugUserIndex();
