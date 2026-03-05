import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserSearchService } from '../services/UserSearchService';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function syncUserSearchIndex() {
    console.log('=== SINCRONIZANDO ÍNDICE DE BUSCA DE USUÁRIOS ===');
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected successfully');

        // Sincronizar todos os usuários existentes
        await UserSearchService.syncAllUsers();
        
        // Limpar usuários inativos
        await UserSearchService.cleanupInactiveUsers();
        
        console.log('\n✅ Índice de busca sincronizado com sucesso!');
        console.log('🔍 Agora você pode buscar usuários por ID ou nome');
        
    } catch (error: any) {
        console.error('❌ Erro na sincronização:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

syncUserSearchIndex();
