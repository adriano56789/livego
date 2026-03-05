#!/usr/bin/env node

/**
 * Script para criar e inicializar a coleção de streams no MongoDB
 * Esta coleção vai armazenar os dados dos cards de lives
 */

import mongoose from 'mongoose';
import { Streamer } from '../src/models';

// URL de conexão do MongoDB (mesma usada na VPS)
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function initializeStreamsCollection() {
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
        const streamersCollection = collections.find(c => c.name === 'streamers');

        if (streamersCollection) {
            console.log('📋 Coleção "streamers" já existe');
            
            // Verificar quantos documentos existem
            const count = await Streamer.countDocuments();
            console.log(`📊 Encontrados ${count} documentos na coleção`);
        } else {
            console.log('🆕 Criando coleção "streamers" vazia...');
            
            // Criar a coleção vazia inserindo um documento temporário e removendo
            const tempDoc = {
                id: 'temp_init',
                hostId: 'temp',
                name: 'Temp',
                isLive: false
            };

            await Streamer.create(tempDoc);
            await Streamer.deleteOne({ id: 'temp_init' });
            console.log('✅ Coleção "streamers" criada vazia');
        }

        // 2. Verificar e garantir índices importantes
        console.log('\n🔍 Verificando índices...');
        
        // Criar índice para busca por isLive (muito usado)
        await Streamer.collection.createIndex({ isLive: 1 });
        console.log('✅ Índice criado para campo isLive');
        
        // Criar índice para busca por hostId
        await Streamer.collection.createIndex({ hostId: 1 });
        console.log('✅ Índice criado para campo hostId');
        
        // Criar índice composto para performance
        await Streamer.collection.createIndex({ isLive: 1, viewers: -1 });
        console.log('✅ Índice composto criado (isLive, viewers)');

        // 3. Limpar streams inconsistentes (se houver)
        console.log('\n🧹 Limpando dados inconsistentes...');
        
        const inconsistentStreams = await Streamer.find({
            $or: [
                { isLive: true, endTime: { $ne: null } },
                { isLive: true, endTime: { $ne: '' } },
                { isLive: true, streamStatus: 'ended' }
            ]
        });

        if (inconsistentStreams.length > 0) {
            console.log(`⚠️ Encontradas ${inconsistentStreams.length} streams inconsistentes, corrigindo...`);
            
            for (const stream of inconsistentStreams) {
                await Streamer.updateOne(
                    { _id: stream._id },
                    { 
                        $set: {
                            isLive: false,
                            streamStatus: 'ended'
                        }
                    }
                );
                console.log(`🔧 Corrigida stream: ${stream.id} - ${stream.name}`);
            }
        } else {
            console.log('✅ Nenhuma inconsistência encontrada');
        }

        // 4. Estatísticas finais
        const totalStreams = await Streamer.countDocuments();
        const activeStreams = await Streamer.countDocuments({ isLive: true });
        const endedStreams = await Streamer.countDocuments({ isLive: false });
        
        console.log('\n📈 Estatísticas da coleção:');
        console.log(`📊 Total de streams: ${totalStreams}`);
        console.log(`🟢 Streams ativas: ${activeStreams}`);
        console.log(`🔴 Streams encerradas: ${endedStreams}`);
        
        console.log('\n🎉 Coleção "streamers" inicializada com sucesso!');
        console.log('💡 A API agora pode salvar e buscar dados dos cards nesta coleção');

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
    initializeStreamsCollection();
}

export { initializeStreamsCollection };
