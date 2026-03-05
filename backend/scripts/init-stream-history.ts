#!/usr/bin/env node

/**
 * Script para criar e inicializar a coleção StreamHistory no MongoDB
 * Esta coleção vai armazenar o histórico de lives encerradas
 */

import mongoose from 'mongoose';
import { StreamHistory } from '../src/models';

// URL de conexão do MongoDB
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function initializeStreamHistoryCollection() {
    try {
        console.log('🔧 Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB com sucesso!');

        // 1. Verificar se a coleção já existe
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }
        
        const collections = await db.listCollections().toArray();
        const streamHistoryCollection = collections.find(c => c.name === 'streamhistories');

        if (streamHistoryCollection) {
            console.log('📋 Coleção "streamhistories" já existe');
            
            // Verificar quantos documentos existem
            const count = await StreamHistory.countDocuments();
            console.log(`📊 Encontrados ${count} documentos na coleção`);
        } else {
            console.log('🆕 Criando coleção "streamhistories" vazia...');
            
            // Criar a coleção vazia inserindo um documento temporário e removendo
            const tempDoc = {
                id: 'temp_init',
                streamId: 'temp',
                hostId: 'temp',
                hostName: 'Temp',
                title: 'Temp',
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                duration: '00:00:00',
                peakViewers: 0,
                totalCoins: 0,
                totalFollowers: 0,
                totalMembers: 0,
                totalFans: 0
            };

            await StreamHistory.create(tempDoc);
            await StreamHistory.deleteOne({ id: 'temp_init' });
            console.log('✅ Coleção "streamhistories" criada vazia');
        }

        // 2. Verificar e garantir índices importantes
        console.log('\n🔍 Verificando índices...');
        
        // Criar índice para busca por streamId
        await StreamHistory.collection.createIndex({ streamId: 1 });
        console.log('✅ Índice criado para campo streamId');
        
        // Criar índice para busca por hostId
        await StreamHistory.collection.createIndex({ hostId: 1 });
        console.log('✅ Índice criado para campo hostId');
        
        // Criar índice para busca por endTime (ordenação)
        await StreamHistory.collection.createIndex({ endTime: -1 });
        console.log('✅ Índice criado para campo endTime');
        
        // Criar índice para busca por createdAt
        await StreamHistory.collection.createIndex({ createdAt: -1 });
        console.log('✅ Índice criado para campo createdAt');

        // 3. Estatísticas finais
        const totalHistory = await StreamHistory.countDocuments();
        
        console.log('\n📈 Estatísticas da coleção:');
        console.log(`📊 Total de históricos: ${totalHistory}`);
        
        console.log('\n🎉 Coleção "streamhistories" inicializada com sucesso!');
        console.log('💡 Quando lives forem encerradas, o histórico será salvo automaticamente');

    } catch (error) {
        console.error('❌ Erro ao inicializar coleção:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
}

// Executar inicialização
if (require.main === module) {
    initializeStreamHistoryCollection();
}

export { initializeStreamHistoryCollection };
