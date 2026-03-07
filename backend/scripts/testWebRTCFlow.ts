import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Streamer, User } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';
const SRS_API_URL = 'http://72.60.249.175:1985';

// Teste completo do fluxo WebRTC
const testWebRTCFlow = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // 1. Verificar se existem usuários reais
        console.log('\n👥 Verificando usuários no banco...');
        const users = await User.find({});
        console.log(`📊 Total de usuários: ${users.length}`);
        
        if (users.length === 0) {
            console.log('❌ Nenhum usuário encontrado. Criando usuário de teste...');
            const testUser = await User.create({
                id: 'test_user_001',
                name: 'Usuário Teste WebRTC',
                email: 'test@webrtc.com',
                password: 'hashed_password',
                avatarUrl: '',
                isOnline: true,
                country: 'br',
                coins: 1000,
                level: 1,
                experience: 0,
                isVip: false,
                followersCount: 0,
                followingCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`✅ Usuário criado: ${testUser.name} (ID: ${testUser.id})`);
        }

        // 2. Verificar streams ativas no SRS
        console.log('\n📡 Verificando streams ativas no SRS...');
        const srsResponse = await fetch(`${SRS_API_URL}/api/v1/streams`);
        const srsData = await srsResponse.json();
        
        if (srsData.streams && Array.isArray(srsData.streams)) {
            console.log(`📊 Streams ativas no SRS: ${srsData.streams.length}`);
            srsData.streams.forEach((stream: any) => {
                console.log(`   - ${stream.name} (clients: ${stream.clients || 0})`);
            });
        } else {
            console.log('⚠️ Nenhuma stream ativa encontrada no SRS');
        }

        // 3. Verificar streams no banco
        console.log('\n💾 Verificando streams no banco...');
        const streams = await Streamer.find({});
        console.log(`📊 Streams no banco: ${streams.length}`);
        
        const activeStreams = streams.filter(s => s.isLive);
        console.log(`📊 Streams ativas no banco: ${activeStreams.length}`);

        // 4. Testar criação de stream real
        console.log('\n🧪 Testando criação de stream real...');
        const testUser = users[0] || await User.findOne({ id: 'test_user_001' });
        
        if (testUser) {
            const streamId = `test_stream_${Date.now()}`;
            const testStream = {
                id: streamId,
                hostId: testUser.id,
                name: `Teste WebRTC - ${new Date().toLocaleTimeString()}`,
                avatar: testUser.avatarUrl || '',
                location: 'Brasil',
                time: 'Live Now',
                message: 'Stream de teste para WebRTC',
                tags: ['test', 'webrtc'],
                isHot: false,
                country: testUser.country || 'br',
                viewers: 0,
                isPrivate: false,
                quality: '720p',
                demoVideoUrl: '',
                rtmpIngestUrl: `rtmp://livego.store:1935/live/${streamId}`,
                srtIngestUrl: '',
                streamKey: streamId,
                playbackUrl: `http://livego.store:8080/live/${streamId}.flv`,
                isLive: true,
                startTime: new Date().toISOString(),
                category: 'test',
                language: 'pt',
                maxViewers: 1000,
                recordingEnabled: false,
                chatEnabled: true,
                giftsEnabled: true,
                streamStatus: 'active' as const
            };

            const createdStream = await Streamer.create(testStream);
            console.log(`✅ Stream criada: ${createdStream.name} (ID: ${createdStream.id})`);
            console.log(`   - Host: ${createdStream.hostId} (${testUser.name})`);
            console.log(`   - URL WebRTC: webrtc://72.60.249.175/live/${createdStream.id}`);
            console.log(`   - URL RTMP: ${createdStream.rtmpIngestUrl}`);

            // 5. Verificar se a stream aparece na API
            console.log('\n🔍 Verificando se a stream aparece na API...');
            setTimeout(async () => {
                const apiResponse = await fetch('http://localhost:3000/api/live/global');
                const apiData = await apiResponse.json();
                
                if (apiData.success && apiData.streamers) {
                    const foundStream = apiData.streamers.find((s: any) => s.id === createdStream.id);
                    if (foundStream) {
                        console.log(`✅ Stream encontrada na API: ${foundStream.name}`);
                    } else {
                        console.log(`❌ Stream não encontrada na API`);
                    }
                }
            }, 2000);

        } else {
            console.log('❌ Nenhum usuário encontrado para criar stream');
        }

        // 6. Resumo do teste
        console.log('\n📋 Resumo do Teste WebRTC:');
        console.log(`   - Usuários no banco: ${users.length}`);
        console.log(`   - Streams no SRS: ${srsData.streams?.length || 0}`);
        console.log(`   - Streams no banco: ${streams.length}`);
        console.log(`   - Streams ativas: ${activeStreams.length}`);
        console.log('\n🎯 Próximos passos:');
        console.log('   1. Iniciar o frontend');
        console.log('   2. Fazer login com um usuário real');
        console.log('   3. Iniciar uma live usando WebRTC');
        console.log('   4. Verificar se a câmera aparece para o host');
        console.log('   5. Entrar na sala com outro usuário e verificar se o vídeo aparece');

        console.log('\n🎉 Teste WebRTC concluído!');

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar teste
testWebRTCFlow();
