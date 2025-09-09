const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAPIs() {
  console.log('🧪 Iniciando testes das APIs CRUD...\n');
  
  try {
    // Teste 1: Health Check
    console.log('1. Testando Health Check...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health Check:', health.data);
    
    // Teste 2: Version
    console.log('\n2. Testando Version...');
    const version = await axios.get(`${API_BASE}/version`);
    console.log('✅ Version:', version.data);
    
    // Teste 3: Listar usuários existentes
    console.log('\n3. Testando listagem de usuários...');
    const usersResponse = await axios.get(`${API_BASE}/users`);
    console.log('✅ Usuários encontrados:', usersResponse.data.users.length);
    
    // Teste 4: Criar novo usuário
    console.log('\n4. Testando criação de usuário...');
    const newUser = {
      name: 'Usuário Teste',
      email: 'teste@example.com',
      nickname: 'teste_user',
      gender: 'male',
      birthday: '1990-01-01',
      age: 34,
      level2: 1,
      has_uploaded_real_photo: false,
      has_completed_profile: true,
      invite_code: 'TEST123',
      country: 'BR',
      personalSignature: 'Usuário de teste',
      wallet_diamonds: 1000
    };
    
    const createUserResponse = await axios.post(`${API_BASE}/users`, newUser);
    const createdUser = createUserResponse.data;
    console.log('✅ Usuário criado:', createdUser.name, 'ID:', createdUser.id);
    
    // Teste 5: Buscar usuário por ID
    console.log('\n5. Testando busca de usuário por ID...');
    const userResponse = await axios.get(`${API_BASE}/users/${createdUser.id}`);
    console.log('✅ Usuário encontrado:', userResponse.data.name);
    
    // Teste 6: Atualizar usuário
    console.log('\n6. Testando atualização de usuário...');
    const updateData = { personalSignature: 'Usuário atualizado via API' };
    const updateResponse = await axios.put(`${API_BASE}/users/${createdUser.id}`, updateData);
    console.log('✅ Usuário atualizado:', updateResponse.data.personalSignature);
    
    // Teste 7: Listar streams
    console.log('\n7. Testando listagem de streams...');
    const streamsResponse = await axios.get(`${API_BASE}/streams`);
    console.log('✅ Streams encontradas:', streamsResponse.data.length);
    
    // Teste 8: Criar nova stream
    console.log('\n8. Testando criação de stream...');
    const newStream = {
      user_id: createdUser.id,
      titulo: 'Stream de Teste',
      nome_streamer: createdUser.nickname,
      thumbnail_url: 'https://picsum.photos/400/300?random=999',
      categoria: 'Teste',
      is_private: false,
      entry_fee: 0,
      permite_pk: true,
      country_code: 'BR',
      camera_facing_mode: 'user',
      voice_enabled: true
    };
    
    const createStreamResponse = await axios.post(`${API_BASE}/streams`, newStream);
    const createdStream = createStreamResponse.data;
    console.log('✅ Stream criada:', createdStream.titulo, 'ID:', createdStream.id);
    
    // Teste 9: Buscar stream por ID
    console.log('\n9. Testando busca de stream por ID...');
    const streamResponse = await axios.get(`${API_BASE}/streams/${createdStream.id}`);
    console.log('✅ Stream encontrada:', streamResponse.data.titulo);
    
    // Teste 10: Entrar na stream
    console.log('\n10. Testando entrada na stream...');
    const joinResponse = await axios.post(`${API_BASE}/streams/${createdStream.id}/join`, {
      userId: createdUser.id
    });
    console.log('✅ Entrada na stream:', joinResponse.data.success);
    
    // Teste 11: Listar presentes
    console.log('\n11. Testando listagem de presentes...');
    const giftsResponse = await axios.get(`${API_BASE}/gifts`);
    console.log('✅ Presentes encontrados:', giftsResponse.data.length);
    
    // Teste 12: Criar novo presente
    console.log('\n12. Testando criação de presente...');
    const newGift = {
      name: 'Presente Teste',
      image_url: 'https://example.com/test_gift.png',
      diamond_cost: 25,
      animation_url: 'https://example.com/test_animation.json'
    };
    
    const createGiftResponse = await axios.post(`${API_BASE}/gifts`, newGift);
    const createdGift = createGiftResponse.data;
    console.log('✅ Presente criado:', createdGift.name, 'ID:', createdGift.id);
    
    // Teste 13: Enviar presente
    console.log('\n13. Testando envio de presente...');
    const sendGiftResponse = await axios.post(`${API_BASE}/gifts/send`, {
      fromUserId: createdUser.id,
      toUserId: 55218901, // ID do usuário Ana_Live
      giftId: createdGift.id,
      streamId: createdStream.id
    });
    console.log('✅ Presente enviado:', sendGiftResponse.data.id);
    
    // Teste 14: Enviar mensagem no chat
    console.log('\n14. Testando envio de mensagem no chat...');
    const chatResponse = await axios.post(`${API_BASE}/streams/${createdStream.id}/chat`, {
      userId: createdUser.id,
      message: 'Olá, esta é uma mensagem de teste!'
    });
    console.log('✅ Mensagem enviada:', chatResponse.data.message);
    
    // Teste 15: Buscar mensagens do chat
    console.log('\n15. Testando busca de mensagens do chat...');
    const chatMessagesResponse = await axios.get(`${API_BASE}/streams/${createdStream.id}/chat`);
    console.log('✅ Mensagens encontradas:', chatMessagesResponse.data.length);
    
    // Teste 16: Seguir usuário
    console.log('\n16. Testando seguir usuário...');
    const followResponse = await axios.post(`${API_BASE}/users/55218901/follow`, {
      userId: createdUser.id
    });
    console.log('✅ Usuário seguido:', followResponse.data.success);
    
    // Teste 17: Listar transações de presentes
    console.log('\n17. Testando listagem de transações de presentes...');
    const transactionsResponse = await axios.get(`${API_BASE}/gift-transactions?userId=${createdUser.id}`);
    console.log('✅ Transações encontradas:', transactionsResponse.data.transactions.length);
    
    // Teste 18: Finalizar stream
    console.log('\n18. Testando finalização de stream...');
    const endStreamResponse = await axios.post(`${API_BASE}/streams/${createdStream.id}/end`);
    console.log('✅ Stream finalizada:', endStreamResponse.data.success);
    
    console.log('\n🎉 Todos os testes das APIs CRUD foram executados com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Executar os testes
testAPIs();

