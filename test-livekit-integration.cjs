const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testLiveKitIntegration() {
  console.log('🎥 Testando integrações do LiveKit...\n');
  
  try {
    // Teste 1: Status do LiveKit
    console.log('1. Testando status do LiveKit...');
    const statusResponse = await axios.get(`${API_BASE}/livekit/status`);
    console.log('✅ Status do LiveKit:', statusResponse.data.status);
    console.log('   Total de salas:', statusResponse.data.totalRooms);
    
    // Teste 2: Gerar token básico
    console.log('\n2. Testando geração de token...');
    const tokenResponse = await axios.post(`${API_BASE}/livekit/token`, {
      roomName: 'test-room',
      participantName: 'Test User',
      participantId: 'test_123'
    });
    console.log('✅ Token gerado com sucesso');
    console.log('   Room:', tokenResponse.data.roomName);
    console.log('   WS URL:', tokenResponse.data.wsUrl);
    
    // Teste 3: Criar sala
    console.log('\n3. Testando criação de sala...');
    const roomResponse = await axios.post(`${API_BASE}/livekit/rooms`, {
      name: 'test-room-api',
      maxParticipants: 50,
      metadata: 'Sala de teste criada via API'
    });
    console.log('✅ Sala criada:', roomResponse.data.name);
    
    // Teste 4: Listar salas
    console.log('\n4. Testando listagem de salas...');
    const roomsResponse = await axios.get(`${API_BASE}/livekit/rooms`);
    console.log('✅ Salas encontradas:', roomsResponse.data.length);
    roomsResponse.data.forEach(room => {
      console.log(`   - ${room.name} (${room.numParticipants} participantes)`);
    });
    
    // Teste 5: Buscar stream existente para testar integração
    console.log('\n5. Testando integração com stream...');
    const streamsResponse = await axios.get(`${API_BASE}/streams`);
    
    if (streamsResponse.data.length > 0) {
      const stream = streamsResponse.data[0];
      console.log('   Stream encontrada:', stream.titulo);
      
      // Teste 6: Iniciar stream com LiveKit
      console.log('\n6. Testando início de stream com LiveKit...');
      const startLiveKitResponse = await axios.post(`${API_BASE}/streams/${stream.id}/start-livekit`, {
        userId: stream.user_id
      });
      console.log('✅ Stream iniciada com LiveKit');
      console.log('   Sala:', startLiveKitResponse.data.roomName);
      console.log('   Token gerado para streamer');
      
      // Teste 7: Gerar token para espectador
      console.log('\n7. Testando token para espectador...');
      const viewerTokenResponse = await axios.post(`${API_BASE}/streams/${stream.id}/join-livekit`, {
        userId: 10755083 // ID do usuário "Você"
      });
      console.log('✅ Token gerado para espectador');
      console.log('   Sala:', viewerTokenResponse.data.roomName);
      
      // Teste 8: Listar participantes
      console.log('\n8. Testando listagem de participantes...');
      try {
        const participantsResponse = await axios.get(`${API_BASE}/livekit/rooms/${startLiveKitResponse.data.roomName}/participants`);
        console.log('✅ Participantes encontrados:', participantsResponse.data.length);
      } catch (error) {
        console.log('ℹ️  Nenhum participante conectado ainda (normal)');
      }
      
      // Teste 9: Finalizar stream LiveKit
      console.log('\n9. Testando finalização de stream LiveKit...');
      const endLiveKitResponse = await axios.post(`${API_BASE}/streams/${stream.id}/end-livekit`);
      console.log('✅ Stream finalizada:', endLiveKitResponse.data.success);
    } else {
      console.log('   Nenhuma stream encontrada para testar integração');
    }
    
    // Teste 10: Limpar sala de teste
    console.log('\n10. Limpando sala de teste...');
    try {
      await axios.delete(`${API_BASE}/livekit/rooms/test-room-api`);
      console.log('✅ Sala de teste removida');
    } catch (error) {
      console.log('ℹ️  Sala pode já ter sido removida');
    }
    
    console.log('\n🎉 Todos os testes de integração do LiveKit foram executados com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Executar os testes
testLiveKitIntegration();

