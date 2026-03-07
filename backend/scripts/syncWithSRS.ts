import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Streamer } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';
const SRS_API_URL = 'http://72.60.249.175:1985';

// Função para buscar streams ativas no SRS
const getActiveStreamsFromSRS = async () => {
    try {
        console.log(`[SRS] Verificando streams ativas em: ${SRS_API_URL}/api/v1/streams`);
        const response = await fetch(`${SRS_API_URL}/api/v1/streams`);
        const data = await response.json();
        
        if (data.streams && Array.isArray(data.streams)) {
            console.log(`[SRS] Streams ativas encontradas: ${data.streams.length}`);
            data.streams.forEach((stream: any) => {
                console.log(`[SRS] Stream ativa: ${stream.name} (clients: ${stream.clients || 0})`);
            });
            return data.streams;
        }
        return [];
    } catch (error) {
        console.error('[SRS] Erro ao buscar streams ativas:', error);
        return [];
    }
};

const syncWithSRS = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // 1. Buscar streams ativas no SRS
        console.log('\n📡 Buscando streams ativas no SRS...');
        const srsStreams = await getActiveStreamsFromSRS();
        const srsStreamNames = new Set(srsStreams.map((s: any) => s.name));
        
        // 2. Buscar streams no banco de dados
        console.log('\n💾 Buscando streams no banco de dados...');
        const dbStreams = await Streamer.find({});
        console.log(`📊 Total de streams no BD: ${dbStreams.length}`);

        // 3. Sincronizar streams
        console.log('\n🔄 Sincronizando streams com SRS...');
        
        let updatedCount = 0;
        let deactivatedCount = 0;

        for (const dbStream of dbStreams) {
            const isActiveInSRS = srsStreamNames.has(dbStream.id);
            const shouldBeActive = dbStream.isLive;

            if (shouldBeActive && !isActiveInSRS) {
                // Stream está marcada como live no BD mas não existe no SRS
                console.log(`❌ Stream ${dbStream.name} (${dbStream.id}) não existe no SRS - desativando`);
                await Streamer.updateOne(
                    { _id: dbStream._id },
                    { isLive: false, streamStatus: 'ended' }
                );
                deactivatedCount++;
            } else if (!shouldBeActive && isActiveInSRS) {
                // Stream existe no SRS mas não está marcada como live no BD
                console.log(`✅ Stream ${dbStream.name} (${dbStream.id}) existe no SRS - ativando`);
                await Streamer.updateOne(
                    { _id: dbStream._id },
                    { isLive: true, streamStatus: 'active' }
                );
                updatedCount++;
            } else if (shouldBeActive && isActiveInSRS) {
                // Stream está consistente em ambos
                const srsStream = srsStreams.find((s: any) => s.name === dbStream.id);
                const viewerCount = srsStream?.clients || 0;
                
                if (dbStream.viewers !== viewerCount) {
                    console.log(`👥 Atualizando viewers da stream ${dbStream.name}: ${dbStream.viewers} → ${viewerCount}`);
                    await Streamer.updateOne(
                        { _id: dbStream._id },
                        { viewers: viewerCount }
                    );
                    updatedCount++;
                }
            }
        }

        // 4. Verificar streams que existem no SRS mas não no BD
        console.log('\n🔍 Verificando streams do SRS que não existem no BD...');
        const dbStreamNames = new Set(dbStreams.map(s => s.id));
        const orphanSrsStreams = srsStreams.filter((s: any) => !dbStreamNames.has(s.name));
        
        if (orphanSrsStreams.length > 0) {
            console.log(`⚠️ Streams no SRS sem correspondência no BD: ${orphanSrsStreams.length}`);
            orphanSrsStreams.forEach((stream: any) => {
                console.log(`   - ${stream.name} (clients: ${stream.clients || 0})`);
            });
        }

        // 5. Estatísticas finais
        const finalStreams = await Streamer.find({});
        const activeStreams = finalStreams.filter(s => s.isLive);
        
        console.log('\n📊 Estatísticas finais da sincronização:');
        console.log(`   - Total de streams no BD: ${finalStreams.length}`);
        console.log(`   - Streams ativas no SRS: ${srsStreams.length}`);
        console.log(`   - Streams ativas no BD: ${activeStreams.length}`);
        console.log(`   - Streams atualizadas: ${updatedCount}`);
        console.log(`   - Streams desativadas: ${deactivatedCount}`);
        console.log(`   - Streams órfãs no SRS: ${orphanSrsStreams.length}`);

        // 6. Listar streams ativas finais
        if (activeStreams.length > 0) {
            console.log('\n✅ Streams ativas após sincronização:');
            activeStreams.forEach(stream => {
                const srsStream = srsStreams.find((s: any) => s.name === stream.id);
                console.log(`   - ${stream.name} (ID: ${stream.id}, Viewers: ${stream.viewers}, SRS clients: ${srsStream?.clients || 0})`);
            });
        } else {
            console.log('\n⚠️ Nenhuma stream ativa encontrada após sincronização');
        }

        console.log('\n🎉 Sincronização com SRS concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar sincronização
syncWithSRS();
