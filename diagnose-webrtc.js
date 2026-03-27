#!/usr/bin/env node

/**
 * Script de diagnóstico completo para WebRTC "conectando" indefinidamente
 * Execute: node diagnose-webrtc.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const SRS_BASE = 'http://localhost:1985';

async function diagnoseWebRTC() {
    console.log('🔍 DIAGNÓSTICO COMPLETO WEBRTC\n');

    // 1. Verificar se backend está online
    console.log('1. Verificando backend...');
    try {
        const response = await axios.get(`${API_BASE}/api/streams/live`, { timeout: 5000 });
        console.log('✅ Backend online');
    } catch (error) {
        console.log('❌ Backend offline ou inacessível');
        return;
    }

    // 2. Verificar se SRS está online
    console.log('\n2. Verificando SRS...');
    try {
        const response = await axios.get(`${SRS_BASE}/api/v1/summaries`, { timeout: 5000 });
        console.log('✅ SRS online');
        console.log(`   Server ID: ${response.data.server}`);
        console.log(`   Versão: ${response.data.version || 'N/A'}`);
    } catch (error) {
        console.log('❌ SRS offline ou inacessível');
        console.log('   💡 Execute: ./objs/srs -c srs.local.conf');
        return;
    }

    // 3. Verificar configuração WebRTC do SRS
    console.log('\n3. Verificando configuração WebRTC do SRS...');
    try {
        const response = await axios.get(`${SRS_BASE}/api/v1/vhosts`);
        const vhosts = response.data.vhosts;
        
        if (vhosts && vhosts.length > 0) {
            const vhost = vhosts[0]; // __defaultVhost__
            const rtc = vhost.rtc;
            
            console.log(`✅ Vhost encontrado: ${vhost.name}`);
            console.log(`   WebRTC habilitado: ${rtc?.enabled || false}`);
            console.log(`   Plan B: ${rtc?.plan_b || false}`);
            console.log(`   NACK: ${rtc?.nack || false}`);
            console.log(`   TWCC: ${rtc?.twcc || false}`);
            
            if (!rtc?.enabled) {
                console.log('❌ WebRTC não está habilitado no SRS!');
                console.log('   💡 Verifique srs.local.conf: rtc { enabled on; }');
            }
        } else {
            console.log('❌ Nenhum vhost encontrado');
        }
    } catch (error) {
        console.log('❌ Erro ao verificar configuração do SRS');
    }

    // 4. Verificar se há streams ativas no SRS
    console.log('\n4. Verificando streams no SRS...');
    try {
        const response = await axios.get(`${SRS_BASE}/api/v1/streams`);
        const streams = response.data.streams || [];
        
        console.log(`📺 Streams encontradas: ${streams.length}`);
        
        streams.forEach(stream => {
            console.log(`   - ${stream.name} (app: ${stream.app})`);
            console.log(`     Publicado: ${stream.publish ? 'Sim' : 'Não'}`);
            console.log(`     Ativo: ${stream.active ? 'Sim' : 'Não'}`);
            console.log(`     WebRTC: ${stream.webrtc ? 'Sim' : 'Não'}`);
        });
        
        if (streams.length === 0) {
            console.log('⚠️ Nenhuma stream ativa no SRS');
        }
    } catch (error) {
        console.log('❌ Erro ao listar streams do SRS');
    }

    // 5. Testar endpoint WebRTC do backend
    console.log('\n5. Testando endpoint WebRTC do backend...');
    try {
        // Criar SDP offer falso para teste
        const fakeSdp = `v=0\r\n
o=- 0 0 IN IP4 127.0.0.1\r\n
s=-\r\n
t=0 0\r\n
a=group:BUNDLE audio video\r\n
m=audio 9 UDP/TLS/RTP/SAVPF 0\r\n
a=rtcp:9 IN IP4 0.0.0.0\r\n
a=ice-ufrag:test\r\n
a=ice-pwd:test\r\n
a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\n
a=setup:actpass\r\n
a=mid:audio\r\n
a=sendrecv\r\n
a=rtcp-mux\r\n
a=rtpmap:0 PCMU/8000\r\n
m=video 9 UDP/TLS/RTP/SAVPF 96\r\n
a=rtcp:9 IN IP4 0.0.0.0\r\n
a=ice-ufrag:test\r\n
a=ice-pwd:test\r\n
a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\n
a=setup:actpass\r\n
a=mid:video\r\n
a=sendrecv\r\n
a=rtcp-mux\r\n
a=rtpmap:96 VP8/90000\r\n`;

        const response = await axios.post(`${API_BASE}/api/webrtc/publish`, {
            userId: 'test_user',
            sdp: fakeSdp
        }, { timeout: 10000 });

        console.log('✅ Endpoint WebRTC respondendo');
        console.log(`   Status: ${response.status}`);
        console.log(`   Code: ${response.data.code}`);
        
        if (response.data.code === 0) {
            console.log('✅ WebRTC funcionando (resposta SDP recebida)');
        } else {
            console.log('❌ WebRTC com erro:', response.data.message);
        }
    } catch (error) {
        console.log('❌ Endpoint WebRTC com erro:', error.message);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data:`, error.response.data);
        }
    }

    // 6. Verificar logs de callback do SRS
    console.log('\n6. Verificando callbacks do SRS...');
    console.log('   💡 O SRS deve estar configurado para enviar callbacks para:');
    console.log(`      ${API_BASE}/api/srs/callback`);
    console.log('   💡 Verifique srs.local.conf: http_hooks { on_publish http://localhost:3000/api/srs/callback; }');

    // 7. Diagnóstico de rede
    console.log('\n7. Diagnóstico de rede...');
    console.log('   💡 WebRTC precisa de:');
    console.log('   - HTTPS ou localhost (sua conexão é OK)');
    console.log('   - Porta 8000 aberta para WebRTC (SRS rtc_server)');
    console.log('   - STUN servers funcionando (stun:stun.l.google.com:19302)');
    
    // 8. Checklist final
    console.log('\n8. CHECKLIST FINAL - O que verificar:');
    console.log('□ Backend rodando na porta 3000');
    console.log('□ SRS rodando na porta 1985 (API) e 8000 (WebRTC)');
    console.log('□ WebRTC habilitado no SRS (rtc { enabled on; })');
    console.log('□ Callbacks configurados (http_hooks)');
    console.log('□ Permissão de câmera no navegador');
    console.log('□ Console do navegador sem erros');
    console.log('□ Rede permite conexões WebRTC (firewall/NAT)');

    console.log('\n🔧 COMANDOS ÚTEIS:');
    console.log('   # Iniciar SRS: ./objs/srs -c srs.local.conf');
    console.log('   # Ver logs SRS: tail -f ./objs/srs.log');
    console.log('   # Testar WebRTC: http://localhost:1985/console');
    console.log('   # Ver streams: curl http://localhost:1985/api/v1/streams');

    console.log('\n✅ Diagnóstico concluído!');
}

// Executar diagnóstico
diagnoseWebRTC().catch(console.error);
