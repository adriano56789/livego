const io = require('socket.io-client');

// Configuração de teste
const WS_URL = 'ws://localhost:3000';
const TEST_STREAM_ID = 'stream_test_123';
const TEST_USER_ID = 'user_test_456';

console.log('🧪 Testando sistema de usuários online...');
console.log(`📡 Conectando ao WebSocket: ${WS_URL}`);

// Conectar ao WebSocket
const socket = io(WS_URL, {
    transports: ['websocket'],
    reconnection: false
});

socket.on('connect', () => {
    console.log('✅ Conectado ao WebSocket');
    
    // Entrar na sala da stream
    console.log(`📥 Entrando na sala da stream: ${TEST_STREAM_ID}`);
    socket.emit('join_room', TEST_STREAM_ID);
});

socket.on('connect_error', (err) => {
    console.error('❌ Erro de conexão:', err.message);
    process.exit(1);
});

// Escutar eventos de teste
socket.on('gift_sent_to_stream', (data) => {
    console.log('🎁 Presente enviado para stream:', data);
    console.log(`   - Stream: ${data.streamId}`);
    console.log(`   - Usuário: ${data.gift.fromUserId}`);
    console.log(`   - Valor: ${data.gift.totalValue}`);
});

socket.on('stream_ended', (data) => {
    console.log('🔴 Stream encerrada:', data);
    console.log(`   - Stream: ${data.streamId}`);
    console.log(`   - Host: ${data.hostId}`);
});

socket.on('live_stream_ended', (data) => {
    console.log('🔴 Live stream encerrada:', data);
    console.log(`   - Stream: ${data.streamId}`);
    console.log(`   - Mensagem: ${data.message}`);
});

// Simular envio de presente
setTimeout(() => {
    console.log('🎯 Simulando envio de presente...');
    socket.emit('send_gift', {
        roomId: TEST_STREAM_ID,
        gift: {
            fromUserId: TEST_USER_ID,
            toUserId: 'host_123',
            giftName: 'Rose',
            giftIcon: '🌹',
            giftPrice: 10,
            quantity: 2,
            totalValue: 20
        }
    });
}, 3000);

// Simular encerramento de live
setTimeout(() => {
    console.log('🔴 Simulando encerramento de live...');
    // Isso seria feito pelo backend quando a live é encerrada
}, 6000);

// Desconectar após testes
setTimeout(() => {
    console.log('📡 Desconectando...');
    socket.disconnect();
    process.exit(0);
}, 9000);
