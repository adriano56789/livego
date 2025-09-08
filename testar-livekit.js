import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

// Configurações do LiveKit
const livekitHost = 'http://localhost:7880';
const apiKey = 'devkey';
const apiSecret = 'secret';

console.log('🔄 Iniciando teste de conexão com LiveKit...');

// Teste 1: Criar token de acesso
function criarToken() {
    try {
        const at = new AccessToken(apiKey, apiSecret, {
            identity: 'teste-usuario-' + Date.now(),
            ttl: '10m'
        });

        at.addGrant({
            room: 'sala-teste',
            roomJoin: true,
            canPublish: true,
            canSubscribe: true
        });

        const token = at.toJwt();
        console.log('✅ Token criado com sucesso!');
        console.log('🔑 Token:', token.substring(0, 50) + '...');
        return token;
    } catch (error) {
        console.error('❌ Erro ao criar token:', error.message);
        return null;
    }
}

// Teste 2: Testar Room Service
async function testarRoomService() {
    try {
        const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
        
        console.log('\n🏠 Testando Room Service...');
        
        // Listar rooms existentes
        const rooms = await roomService.listRooms();
        console.log(`✅ Conexão com Room Service OK! Rooms encontradas: ${rooms.length}`);
        
        // Criar uma sala de teste
        const roomName = 'sala-teste-' + Date.now();
        const room = await roomService.createRoom({
            name: roomName,
            emptyTimeout: 300,
            maxParticipants: 10
        });
        
        console.log(`✅ Sala criada: ${room.name}`);
        
        // Listar participantes (deve estar vazia)
        const participants = await roomService.listParticipants(roomName);
        console.log(`👥 Participantes na sala: ${participants.length}`);
        
        // Deletar a sala de teste
        await roomService.deleteRoom(roomName);
        console.log('✅ Sala de teste removida');
        
        return true;
    } catch (error) {
        console.error('❌ Erro no Room Service:', error.message);
        console.log('💡 Sugestões:');
        console.log('   - Verifique se o LiveKit está rodando: docker ps');
        console.log('   - Teste a conectividade: curl http://localhost:7880/');
        console.log('   - Verifique os logs: docker logs livekit');
        return false;
    }
}

// Teste 3: Verificar saúde do servidor
async function verificarSaude() {
    try {
        console.log('\n🏥 Verificando saúde do servidor...');
        
        const response = await fetch('http://localhost:7880/', {
            method: 'GET',
            timeout: 5000
        });
        
        if (response.ok) {
            console.log('✅ Servidor LiveKit está respondendo!');
            console.log(`📊 Status: ${response.status}`);
            return true;
        } else {
            console.log(`⚠️ Servidor retornou status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Não foi possível conectar ao servidor LiveKit:', error.message);
        console.log('💡 Inicie os serviços com: docker-compose up -d');
        return false;
    }
}

// Executar todos os testes
async function executarTestes() {
    console.log('🧪 === TESTE LIVEKITVUEJS ===\n');
    
    // Teste 1: Verificar saúde
    const saudeOk = await verificarSaude();
    if (!saudeOk) {
        console.log('\n❌ Servidor LiveKit não está acessível. Abortando testes.');
        return;
    }
    
    // Teste 2: Criar token
    const token = criarToken();
    if (!token) {
        console.log('\n❌ Não foi possível criar token. Verifique as credenciais.');
        return;
    }
    
    // Teste 3: Testar Room Service
    const roomServiceOk = await testarRoomService();
    
    console.log('\n📊 === RESUMO DOS TESTES ===');
    console.log(`🏥 Saúde do servidor: ${saudeOk ? '✅ OK' : '❌ Falhou'}`);
    console.log(`🔑 Criação de token: ${token ? '✅ OK' : '❌ Falhou'}`);
    console.log(`🏠 Room Service: ${roomServiceOk ? '✅ OK' : '❌ Falhou'}`);
    
    if (saudeOk && token && roomServiceOk) {
        console.log('\n🎉 Todos os testes passaram! LiveKit está funcionando corretamente.');
        console.log('\n📖 URLs úteis:');
        console.log('   - Servidor: http://localhost:7880/');
        console.log('   - WebSocket: ws://localhost:7880/');
        console.log('   - API Backend: http://localhost:3000/api/');
    } else {
        console.log('\n⚠️ Alguns testes falharam. Verifique a configuração.');
    }
}

// Executar testes se o arquivo for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    executarTestes().catch(console.error);
}

export { criarToken, testarRoomService, verificarSaude };