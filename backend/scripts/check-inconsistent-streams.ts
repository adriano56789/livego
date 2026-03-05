#!/usr/bin/env node

/**
 * Script para verificar e limpar streams inconsistentes no MongoDB
 * Streams que estão marcadas como isLive: true mas não deveriam estar
 */

import mongoose from 'mongoose';
import { Streamer } from '../src/models';

// URL de conexão do MongoDB
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function checkAndCleanInconsistentStreams() {
    try {
        console.log('🔧 Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB com sucesso!');

        // 1. Buscar todas as streams marcadas como live
        console.log('\n🔍 Buscando streams marcadas como live...');
        const liveStreams = await Streamer.find({ isLive: true });
        console.log(`📊 Encontradas ${liveStreams.length} streams marcadas como live`);

        if (liveStreams.length === 0) {
            console.log('✅ Nenhuma stream marcada como live encontrada');
            return;
        }

        // 2. Verificar cada stream
        const inconsistentStreams = [];
        const now = Date.now();
        
        for (const stream of liveStreams) {
            const startTime = new Date(stream.startTime || '').getTime();
            const ageInHours = (now - startTime) / (1000 * 60 * 60);
            
            // Se a stream tem mais de 2 horas, provavelmente é inconsistente
            if (ageInHours > 2) {
                inconsistentStreams.push({
                    ...stream.toObject(),
                    ageInHours: Math.round(ageInHours * 100) / 100
                });
            }
        }

        // 3. Mostrar streams inconsistentes
        if (inconsistentStreams.length > 0) {
            console.log(`\n⚠️ Encontradas ${inconsistentStreams.length} streams inconsistentes:`);
            
            inconsistentStreams.forEach(stream => {
                console.log(`🔴 Stream: ${stream.id} - ${stream.name}`);
                console.log(`   Idade: ${stream.ageInHours} horas`);
                console.log(`   Início: ${stream.startTime}`);
                console.log('');
            });

            // 4. Perguntar se quer limpar
            console.log('🧹 Deseja limpar essas streams inconsistentes?');
            console.log('   Elas serão marcadas como isLive: false');
            
            // Para automação, vamos limpar automaticamente
            console.log('🧹 Limpando streams inconsistentes automaticamente...');
            
            for (const stream of inconsistentStreams) {
                await Streamer.updateOne(
                    { _id: stream._id },
                    { 
                        isLive: false,
                        streamStatus: 'ended',
                        endTime: new Date().toISOString()
                    }
                );
                console.log(`✅ Stream ${stream.id} marcada como offline`);
            }
            
            console.log(`\n🎉 ${inconsistentStreams.length} streams inconsistentes limpas!`);
        } else {
            console.log('✅ Nenhuma stream inconsistente encontrada');
        }

        // 5. Estatísticas finais
        const finalLiveStreams = await Streamer.find({ isLive: true });
        const totalStreams = await Streamer.countDocuments();
        
        console.log('\n📈 Estatísticas finais:');
        console.log(`📊 Total de streams: ${totalStreams}`);
        console.log(`🟢 Streams ativas: ${finalLiveStreams.length}`);
        console.log(`🔴 Streams inativas: ${totalStreams - finalLiveStreams.length}`);

    } catch (error) {
        console.error('❌ Erro ao verificar streams:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
}

// Executar verificação
if (require.main === module) {
    checkAndCleanInconsistentStreams();
}

export { checkAndCleanInconsistentStreams };
