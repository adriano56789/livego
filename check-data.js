import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

mongoose.connect('mongodb://admin:adriano123@localhost:27017/api?authSource=admin')
  .then(() => console.log('Conectado'))
  .catch(err => console.error('Erro:', err));

async function checkData() {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const db = mongoose.connection.db;

    // 1. Verificar avatares dos usuários
    console.log('=== USUÁRIOS E AVATARES ===');
    const users = await db.collection('users').find({}).project({name: 1, avatarUrl: 1, email: 1}).toArray();
    users.forEach(user => {
      console.log(`${user.name}: ${user.avatarUrl ? 'TEM AVATAR' : 'SEM AVATAR'}`);
      if (user.avatarUrl) {
        console.log(`  URL: ${user.avatarUrl.substring(0, 80)}...`);
      }
    });

    // 2. Verificar últimas transações de presentes
    console.log('\n=== ÚLTIMAS TRANSAÇÕES ===');
    const transactions = await db.collection('gifttransactions').find({})
      .project({fromUserName: 1, fromUserAvatar: 1, giftName: 1, totalValue: 1, createdAt: 1})
      .sort({createdAt: -1})
      .limit(5)
      .toArray();
    
    transactions.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.fromUserName}: ${tx.giftName} (${tx.totalValue})`);
      console.log(`   Avatar: ${tx.fromUserAvatar ? 'SIM' : 'NÃO'}`);
    });

    // 3. Verificar conversas
    console.log('\n=== CONVERSAS ===');
    const convCount = await db.collection('conversations').countDocuments();
    console.log(`Total de conversas: ${convCount}`);

    // 4. Verificar streams com presentes
    console.log('\n=== STREAMS ===');
    const streams = await db.collection('streams').find({})
      .project({title: 1, diamonds: 1, privateGiftId: 1})
      .toArray();
    
    streams.forEach(stream => {
      console.log(`${stream.title}: ${stream.diamonds || 0} diamantes`);
      if (stream.privateGiftId) {
        console.log(`  Presente privado requerido: ${stream.privateGiftId}`);
      }
    });

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkData();
