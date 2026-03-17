const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function testDailyRanking() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🧪 Testando ranking daily...');
    
    const db = mongoose.connection.db;
    const User = db.collection('users');
    
    // Simular a lógica do ranking daily
    console.log('\n📊 Buscando usuários com diamantes (lógica atual):');
    
    const users = await User.find({
      $or: [
        { diamonds: { $gt: 0 } },
        { receptores: { $gt: 0 } }
      ]
    }).toArray();
    
    console.log(`👤 Encontrados ${users.length} usuários com diamantes:`);
    
    users.forEach(user => {
      console.log(`   ${user.name} (${user.id}):`);
      console.log(`     Diamonds: ${user.diamonds || 0}`);
      console.log(`     Receptores: ${user.receptores || 0}`);
      console.log(`     Enviados: ${user.enviados || 0}`);
      console.log('');
    });
    
    // Montar ranking como a API faz
    const validUsers = users.map(user => {
      const contribution = user.receptores || 0;
      
      return {
        id: user.id,
        name: user.name,
        contribution: contribution,
        rank: 0,
        period: 'daily',
        debug: {
          diamonds: user.diamonds || 0,
          receptores: user.receptores || 0,
          enviados: user.enviados || 0
        }
      };
    }).filter(user => user.contribution > 0);
    
    // Ordenar
    validUsers.sort((a, b) => b.contribution - a.contribution);
    
    // Atribuir ranks
    validUsers.forEach((user, index) => {
      user.rank = index + 1;
    });
    
    console.log('\n🏆 Resultado do ranking daily:');
    if (validUsers.length === 0) {
      console.log('   ❌ NENHUM USUÁRIO ENCONTRADO (por isso retorna 0.5 kB vazio)');
    } else {
      validUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name}: ${user.contribution} diamantes`);
      });
    }
    
    console.log('\n📏 Tamanho da resposta:');
    const responseSize = JSON.stringify(validUsers).length;
    console.log(`   ${responseSize} bytes (${(responseSize / 1024).toFixed(1)} kB)`);
    
    if (responseSize < 1000) {
      console.log('   ⚠️ Resposta muito pequena - pode estar retornando array vazio');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

testDailyRanking();
