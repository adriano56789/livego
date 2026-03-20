/**
 * Script para testar API de online users
 * Uso: node backend/scripts/test-online-users.js
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function testOnlineUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const User = mongoose.connection.collection('users');
    const Streamer = mongoose.connection.collection('streamers');
    const GiftTransaction = mongoose.connection.collection('gifttransactions');
    
    // Buscar streams ativas
    const activeStreams = await Streamer.find({ isLive: true }).limit(3).toArray();
    console.log(`📺 Streams ativas encontradas: ${activeStreams.length}`);
    
    for (const stream of activeStreams) {
      console.log(`\n🔍 Testando stream: ${stream.id} (host: ${stream.hostId})`);
      
      // 1. Buscar usuários online
      const onlineUsers = await User.find({
        isOnline: true,
        currentStreamId: stream.id,
        name: { $exists: true, $nin: ['', null] },
        id: { $exists: true, $nin: ['', null] }
      }).project({ id: 1, name: 1, avatarUrl: 1, identification: 1, level: 1 }).toArray();
      
      console.log(`👥 Usuários online: ${onlineUsers.length}`);
      onlineUsers.forEach(u => {
        console.log(`   - ${u.name} (${u.id})`);
      });
      
      // 2. Buscar transações de presentes
      const giftTransactions = await GiftTransaction.find({
        streamId: stream.id
      }).project({ fromUserId: 1, fromUserName: 1, totalValue: 1 }).toArray();
      
      console.log(`🎁 Transações de presentes: ${giftTransactions.length}`);
      giftTransactions.forEach(t => {
        console.log(`   - ${t.fromUserName} (${t.fromUserId}): ${t.totalValue} diamantes`);
      });
      
      // 3. Verificar se os usuários das transações existem
      const senderIds = [...new Set(giftTransactions.map(t => t.fromUserId))];
      if (senderIds.length > 0) {
        const senders = await User.find({
          id: { $in: senderIds }
        }).project({ id: 1, name: 1, avatarUrl: 1, identification: 1, level: 1 }).toArray();
        
        console.log(`🎯 Remetentes encontrados: ${senders.length}/${senderIds.length}`);
        senders.forEach(s => {
          console.log(`   - ${s.name} (${s.id})`);
        });
        
        // Verificar quem está faltando
        const missing = senderIds.filter(id => !senders.find(s => s.id === id));
        if (missing.length > 0) {
          console.log(`❌ Remetentes não encontrados: ${missing.join(', ')}`);
        }
      }
    }

  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

testOnlineUsers();
