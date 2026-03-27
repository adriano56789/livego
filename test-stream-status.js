#!/usr/bin/env node

/**
 * Script de teste para verificar se o status isLive está sendo atualizado corretamente
 * Execute: node test-stream-status.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testStreamStatus() {
    console.log('🧪 Testando status da transmissão...\n');

    try {
        // 1. Verificar streams ativas
        console.log('1. Buscando streams ativas...');
        const liveStreamsResponse = await axios.get(`${API_BASE}/streams/live`);
        console.log('Streams ativas encontradas:', liveStreamsResponse.data.length);
        
        if (liveStreamsResponse.data.length > 0) {
            const stream = liveStreamsResponse.data[0];
            console.log(`Stream: ${stream.name} (ID: ${stream.id})`);
            console.log(`isLive: ${stream.isLive}`);
            console.log(`Status: ${stream.streamStatus || 'N/A'}`);
            console.log(`Viewers: ${stream.viewers || 0}`);
        }

        // 2. Verificar streams gerais
        console.log('\n2. Buscando streams gerais...');
        const streamsResponse = await axios.get(`${API_BASE}/streams`);
        console.log('Streams gerais encontradas:', streamsResponse.data.length);

        // 3. Verificar status do SRS
        console.log('\n3. Verificando status do SRS...');
        try {
            const srsResponse = await axios.get(`${API_BASE}/srs/status`);
            console.log('SRS Status:', srsResponse.data.success ? 'Online' : 'Offline');
            if (srsResponse.data.success) {
                console.log('SRS Version:', srsResponse.data.version);
            }
        } catch (srsError) {
            console.log('SRS offline ou não acessível');
        }

        // 4. Verificar streams do SRS
        console.log('\n4. Verificando streams do SRS...');
        try {
            const srsStreamsResponse = await axios.get(`${API_BASE}/srs/streams`);
            console.log('Streams no SRS:', srsStreamsResponse.data.data?.length || 0);
            
            if (srsStreamsResponse.data.data && srsStreamsResponse.data.data.length > 0) {
                srsStreamsResponse.data.data.forEach(stream => {
                    console.log(`  - ${stream.name} (app: ${stream.app})`);
                });
            }
        } catch (srsStreamsError) {
            console.log('Não foi possível obter streams do SRS');
        }

        console.log('\n✅ Teste concluído!');
        console.log('\n💡 Se nenhuma stream está aparecendo como ativa:');
        console.log('   1. Verifique se o WebRTC está publicando para o SRS');
        console.log('   2. Verifique se o callback do SRS está configurado corretamente');
        console.log('   3. Verifique os logs do backend para eventos on_publish');

    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Testar stream específica se ID for fornecido
async function testSpecificStream(streamId) {
    console.log(`🧪 Testando stream específica: ${streamId}\n`);

    try {
        // Buscar detalhes da stream
        const streamResponse = await axios.get(`${API_BASE}/streams/${streamId}`);
        const stream = streamResponse.data;
        
        console.log('Detalhes da stream:');
        console.log(`ID: ${stream.id}`);
        console.log(`Nome: ${stream.name}`);
        console.log(`Host ID: ${stream.hostId}`);
        console.log(`isLive: ${stream.isLive}`);
        console.log(`Status: ${stream.streamStatus || 'N/A'}`);
        console.log(`Viewers: ${stream.viewers || 0}`);
        console.log(`RTMP URL: ${stream.rtmpIngestUrl || 'N/A'}`);
        console.log(`Playback URL: ${stream.playbackUrl || 'N/A'}`);

        // Verificar status no SRS
        try {
            const srsStreamResponse = await axios.get(`${API_BASE}/srs/streams/${streamId}`);
            console.log('\nStatus no SRS:');
            console.log('Stream encontrada no SRS:', srsStreamResponse.data.success ? 'Sim' : 'Não');
            
            if (srsStreamResponse.data.success) {
                console.log('Detalhes no SRS:', JSON.stringify(srsStreamResponse.data.data, null, 2));
            }
        } catch (srsError) {
            console.log('\nStream não encontrada no SRS ou SRS offline');
        }

    } catch (error) {
        console.error('❌ Erro ao buscar stream:', error.message);
    }
}

// Executar teste
const streamId = process.argv[2];

if (streamId) {
    testSpecificStream(streamId);
} else {
    testStreamStatus();
}
