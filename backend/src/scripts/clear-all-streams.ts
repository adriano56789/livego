import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Streamer } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function clearAllStreams() {
    console.log('=== LIMPANDO TODAS AS STREAMS ===');
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected successfully');

        // Remover TODAS as streams do banco
        const result = await Streamer.deleteMany({});
        console.log(`🗑️  Removidas ${result.deletedCount} streams do banco`);

        // Verificar se está realmente vazio
        const remainingStreams = await Streamer.countDocuments();
        console.log(`📋 Streams restantes: ${remainingStreams}`);

        if (remainingStreams === 0) {
            console.log('✅ Banco limpo! Nenhuma stream será mostrada até que alguém crie uma.');
        } else {
            console.log('⚠️ Ainda há streams no banco');
        }
        
        console.log('\n✅ Limpeza concluída com sucesso');
        
    } catch (error: any) {
        console.error('❌ Erro ao limpar streams:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

clearAllStreams();
