import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

mongoose.connect('mongodb://admin:adriano123@localhost:27017/api?authSource=admin')
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar:', err));

async function quickAnalysis() {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const db = mongoose.connection.db;

    console.log('=== AVATARES DOS USUÁRIOS ===');
    const users = await db.collection('users').find({}).toArray();
    users.forEach(user => {
      console.log(`${user.name}: ${user.avatarUrl || 'SEM AVATAR'}`);
    });

    console.log('\n=== ÚLTIMAS 5 TRANSAÇÕES DE PRESENTES ===');
    const gifts = await db.collection('gifttransactions').find({}).sort({createdAt: -1}).limit(5).toArray();
    gifts.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.fromUserName} → ${tx.toUserName}: ${tx.giftName} (${tx.totalValue} diamantes)`);
      console.log(`   Avatar: ${tx.fromUserAvatar || 'SEM AVATAR'}`);
    });

    console.log('\n=== STREAMS COM DIAMANTES ===');
    const streams = await db.collection('streams').find({diamonds: {$gt: 0}}).toArray();
    streams.forEach(stream => {
      console.log(`${stream.title}: ${stream.diamonds} diamantes (Privado: ${stream.privateGiftId || 'NÃO'})`);
    });

    console.log('\n=== CONVERSAS COM MENSAGENS ===');
    const conversations = await db.collection('conversations').find({}).limit(3).toArray();
    conversations.forEach((conv, i) => {
      console.log(`Conversa ${i+1}: ${conv.participants?.length || 0} participantes`);
      if (conv.messages && conv.messages.length > 0) {
        const lastMsg = conv.messages[conv.messages.length - 1];
        console.log(`  Última msg: ${lastMsg.senderName} - Avatar: ${lastMsg.senderAvatar || 'NÃO DEFINIDO'}`);
      }
    });

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

quickAnalysis();
