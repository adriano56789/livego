#!/usr/bin/env node

/**
 * Script de Teste de Callback SRS - REAL
 * Valida a comunicação REAL entre SRS e Backend sem simulação
 */

const axios = require('axios');

const SRS_CALLBACK_URL = 'http://localhost:3000/api/srs/callback';
const SRS_API_URL = 'http://localhost:1985/api/v1';

async function testRealCommunication() {
    console.log('🧪 [TEST] Iniciando testes de comunicação REAL SRS + Backend...');
    console.log('⚠️  [TEST] ESTE SCRIPT TESTA COMUNICAÇÃO REAL - SEM SIMULAÇÃO');
    
    try {
        // 1. Verificar se backend está respondendo
        console.log('📡 [TEST] Verificando status do backend...');
        const statusResponse = await axios.get('http://localhost:3000/api/srs/status', { timeout: 5000 });
        console.log('✅ [TEST] Backend OK:', statusResponse.data);
        
        // 2. Verificar se SRS está rodando
        console.log('📡 [TEST] Verificando status do SRS...');
        const srsResponse = await axios.get(`${SRS_API_URL}/summary`, { timeout: 5000 });
        console.log('✅ [TEST] SRS OK:', srsResponse.data);
        
        // 3. Verificar se não há streams ativos (estado limpo)
        console.log('📡 [TEST] Verificando streams atuais...');
        const streamsResponse = await axios.get(`${SRS_API_URL}/streams`, { timeout: 5000 });
        const currentStreams = streamsResponse.data.streams || [];
        console.log(`✅ [TEST] Streams atuais: ${currentStreams.length}`);
        
        if (currentStreams.length > 0) {
            console.log('⚠️  [TEST] Existem streams ativos. Para teste limpo:');
            console.log('   1. Pare todas as transmissões ativas');
            console.log('   2. Ou aguarde os callbacks de unpublish');
        }
        
        // 4. Aguardar ação do usuário - INICIAR TRANSMISSÃO REAL
        console.log('\n🎬 [TEST] === ETAPA DE TESTE REAL ===');
        console.log('📱 [TEST] INICIE UMA TRANSMISSÃO REAL NO APP AGORA...');
        console.log('⏱️  [TEST] Aguardando callback on_publish...');
        console.log('   (Pressione Ctrl+C para cancelar)\n');
        
        // Monitorar mudanças nos streams
        await waitForStreamChange();
        
    } catch (error) {
        console.error('❌ [TEST] Erro na verificação:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            if (error.message.includes('3000')) {
                console.log('💡 [TEST] Backend não está rodando. Execute: npm start');
            } else if (error.message.includes('1985')) {
                console.log('💡 [TEST] SRS não está rodando. Execute: ./objs/srs -c srs.local.conf');
            }
        }
        
        process.exit(1);
    }
}

// Monitorar mudanças nos streams do SRS
async function waitForStreamChange() {
    let initialCount = 0;
    
    try {
        const initialResponse = await axios.get(`${SRS_API_URL}/streams`, { timeout: 5000 });
        initialCount = initialResponse.data.streams?.length || 0;
        console.log(`📊 [TEST] Streams iniciais: ${initialCount}`);
    } catch (error) {
        console.log('⚠️  [TEST] Não foi possível obter estado inicial');
    }
    
    // Polling para detectar mudanças
    const checkInterval = setInterval(async () => {
        try {
            const response = await axios.get(`${SRS_API_URL}/streams`, { timeout: 3000 });
            const currentCount = response.data.streams?.length || 0;
            
            if (currentCount !== initialCount) {
                console.log(`🔄 [TEST] Mudança detectada! Streams: ${initialCount} → ${currentCount}`);
                
                if (currentCount > initialCount) {
                    console.log('📡 [TEST] Stream INICIADO detectado!');
                    await analyzeNewStream(response.data.streams);
                } else {
                    console.log('📡 [TEST] Stream FINALIZADO detectado!');
                }
                
                clearInterval(checkInterval);
                await testComplete();
            } else {
                process.stdout.write('.');
            }
        } catch (error) {
            console.log('\n⚠️  [TEST] Erro ao verificar streams:', error.message);
        }
    }, 2000);
    
    // Timeout após 2 minutos
    setTimeout(() => {
        clearInterval(checkInterval);
        console.log('\n⏰ [TEST] Timeout - nenhuma mudança detectada');
        console.log('💡 [TEST] Verifique se:');
        console.log('   1. App está tentando transmitir');
        console.log('   2. WebRTC está configurado corretamente');
        console.log('   3. Console do navegador mostra erros');
        process.exit(0);
    }, 120000);
}

// Analisar novo stream
async function analyzeNewStream(streams) {
    try {
        console.log('🔍 [TEST] Analisando stream novo...');
        
        const newStream = streams[streams.length - 1];
        console.log('📊 [TEST] Detalhes do stream:');
        console.log(`   ID: ${newStream.id}`);
        console.log(`   App: ${newStream.app}`);
        console.log(`   Stream: ${newStream.name}`);
        console.log(`   URL: ${newStream.url}`);
        console.log(`   Client ID: ${newStream.client_id}`);
        
        // Aguardar um pouco e verificar se callback foi processado
        console.log('⏱️  [TEST] Aguardando processamento do callback...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verificar se backend registrou o stream
        try {
            const backendResponse = await axios.get('http://localhost:3000/api/srs/streams', { timeout: 5000 });
            console.log('✅ [TEST] Backend streams:', backendResponse.data);
        } catch (error) {
            console.log('⚠️  [TEST] Backend pode não ter recebido callback:', error.message);
        }
        
    } catch (error) {
        console.error('❌ [TEST] Erro na análise:', error.message);
    }
}

// Teste completo
async function testComplete() {
    console.log('\n🎉 [TEST] Teste REAL concluído!');
    console.log('📋 [TEST] Para validação completa, verifique:');
    console.log('   1. Logs do console do navegador (WebRTC)');
    console.log('   2. Logs do backend (callbacks)');
    console.log('   3. Logs do SRS (se disponível)');
    console.log('   4. MongoDB (campo isLive do streamer)');
    
    console.log('\n🏁 [TEST] === PRÓXIMOS PASSOS ===');
    console.log('📱 [TEST] 1. Finalize a transmissão no app');
    console.log('📡 [TEST] 2. Verifique callback on_unpublish');
    console.log('💾 [TEST] 3. Confirme isLive: false no MongoDB');
    
    process.exit(0);
}

// Função principal
async function main() {
    console.log('🚀 [TEST] INICIANDO TESTE DE COMUNICAÇÃO REAL SRS + BACKEND');
    console.log('=' .repeat(60));
    console.log('⚠️  [TEST] MODO: TESTE REAL (SEM SIMULAÇÃO)');
    console.log('⚠️  [TEST] REQUISITOS:');
    console.log('   ✅ Backend rodando em localhost:3000');
    console.log('   ✅ SRS rodando com srs.local.conf');
    console.log('   ✅ App pronto para transmitir');
    console.log('=' .repeat(60));
    
    await testRealCommunication();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(error => {
        console.error('💥 [TEST] Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = { testRealCommunication };
