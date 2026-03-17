const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function correctDiamonds() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔍 Conectado ao MongoDB - Corrigindo valores para 95.321...');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const User = db.collection('users');
    
    // 1. Verificar valores atuais
    console.log('\n📊 Valores atuais:');
    const users = await User.find({}).toArray();
    users.forEach(user => {
      console.log(`👤 ID: ${user.id}, Nome: ${user.name}`);
      console.log(`   Diamonds: ${user.diamonds}`);
      console.log(`   Enviados: ${user.enviados}`);
      console.log(`   Receptores: ${user.receptores}`);
      console.log(`   Earnings: ${user.earnings}`);
      console.log('');
    });
    
    // 2. Atualizar todos os valores para 95.321
    console.log('🔧 Atualizando todos os valores para 95.321...');
    
    for (const user of users) {
      await User.updateOne(
        { id: user.id },
        { 
          $set: { 
            diamonds: 95321,
            enviados: 95321,
            receptores: 95321,
            earnings: 95321
          }
        }
      );
      console.log(`✅ Usuário ${user.name} (${user.id}) atualizado:`);
      console.log(`   Diamonds: 95321`);
      console.log(`   Enviados: 95321`);
      console.log(`   Receptores: 95321`);
      console.log(`   Earnings: 95321`);
      console.log('');
    }
    
    // 3. Verificação final
    console.log('🔍 Verificação final:');
    const updatedUsers = await User.find({}).toArray();
    updatedUsers.forEach(user => {
      console.log(`👤 ${user.name}: Diamonds=${user.diamonds}, Enviados=${user.enviados}, Receptores=${user.receptores}, Earnings=${user.earnings}`);
    });
    
    // 4. Verificar streams também
    const Streamer = db.collection('streamers');
    const streamers = await Streamer.find({}).toArray();
    
    console.log('\n📺 Atualizando streams...');
    for (const stream of streamers) {
      await Streamer.updateOne(
        { id: stream.id },
        { $set: { coins: 95321 } }
      );
      console.log(`✅ Stream ${stream.id} atualizado: coins=95321`);
    }
    
    await mongoose.disconnect();
    console.log('\n🎉 TODOS OS VALORES CORRIGIDOS PARA 95.321 COM SUCESSO! ✅');
    console.log('✅ Diamonds = 95.321');
    console.log('✅ Enviados = 95.321'); 
    console.log('✅ Receptores = 95.321');
    console.log('✅ Earnings = 95.321');
    console.log('✅ Stream coins = 95.321');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

correctDiamonds();
