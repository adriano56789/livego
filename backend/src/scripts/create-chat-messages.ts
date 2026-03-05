import mongoose from 'mongoose';
import { Message } from '../models';

mongoose.connect('mongodb://admin:adriano123@localhost:27017/api?authSource=admin').then(async () => {
  // Limpar mensagens antigas
  await Message.deleteMany({});
  
  // Criar mensagens de exemplo para diferentes chats
  
  // Chat entre 10755083 e 87654321
  await Message.create({
    id: 'msg_001',
    chatId: '87654321',
    from: '10755083',
    to: '87654321',
    text: 'Oi! Tudo bem?',
    status: 'read',
    createdAt: new Date(Date.now() - 3600000) // 1 hora atrás
  });
  
  await Message.create({
    id: 'msg_002',
    chatId: '87654321',
    from: '87654321',
    to: '10755083',
    text: 'Opa! Tudo ótimo e você?',
    status: 'read',
    createdAt: new Date(Date.now() - 3000000) // 50 minutos atrás
  });
  
  await Message.create({
    id: 'msg_003',
    chatId: '87654321',
    from: '10755083',
    to: '87654321',
    text: 'Também bem! Quer entrar na live mais tarde?',
    status: 'delivered',
    createdAt: new Date(Date.now() - 1800000) // 30 minutos atrás
  });
  
  // Chat entre 10755083 e 12345678
  await Message.create({
    id: 'msg_004',
    chatId: '12345678',
    from: '12345678',
    to: '10755083',
    text: 'Parabéns pela live de hoje! 🔥',
    status: 'read',
    createdAt: new Date(Date.now() - 7200000) // 2 horas atrás
  });
  
  await Message.create({
    id: 'msg_005',
    chatId: '12345678',
    from: '10755083',
    to: '12345678',
    text: 'Valeu! Foi muito top! 😎',
    status: 'read',
    createdAt: new Date(Date.now() - 6000000) // 1.5 horas atrás
  });
  
  // Chat entre 87654321 e 99999999
  await Message.create({
    id: 'msg_006',
    chatId: '99999999',
    from: '87654321',
    to: '99999999',
    text: 'Vamos jogar juntos mais tarde?',
    status: 'sent',
    createdAt: new Date(Date.now() - 900000) // 15 minutos atrás
  });
  
  await Message.create({
    id: 'msg_007',
    chatId: '99999999',
    from: '99999999',
    to: '87654321',
    text: 'Com certeza! Me chama quando for',
    status: 'delivered',
    createdAt: new Date(Date.now() - 300000) // 5 minutos atrás
  });
  
  console.log('✅ Created sample chat messages');
  console.log('📝 Chat 87654321: 3 messages');
  console.log('📝 Chat 12345678: 2 messages');
  console.log('📝 Chat 99999999: 2 messages');
  process.exit(0);
}).catch(err => { 
  console.error('Error:', err.message); 
  process.exit(1); 
});
