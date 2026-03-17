const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function checkUserRanking() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔍 Verificando seu ID no ranking...');
    
    const db = mongoose.connection.db;
    const User = db.collection('users');
    
    // Buscar todos os usuários com contadores
    const users = await User.find({
      $or: [
        { diamonds: { $gt: 0 } },
        { receptores: { $gt: 0 } },
        { enviados: { $gt: 0 } }
      ]
    }).toArray();
    
    console.log(`\n👥 Encontrados ${users.length} usuários com atividade:`);
    
    // Ordenar por receptores (quem recebeu mais)
    const sortedByReceivers = users
      .filter(u => (u.receptores || 0) > 0)
      .sort((a, b) => (b.receptores || 0) - (a.receptores || 0));
    
    // Ordenar por enviados (quem enviou mais)
    const sortedBySenders = users
      .filter(u => (u.enviados || 0) > 0)
      .sort((a, b) => (b.enviados || 0) - (a.enviados || 0));
    
    console.log('\n🏆 RANKING POR RECEBIDOS (receptores):');
    sortedByReceivers.slice(0, 10).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.id}): ${user.receptores || 0} diamantes recebidos`);
    });
    
    console.log('\n🎁 RANKING POR ENVIADOS (enviados):');
    sortedBySenders.slice(0, 10).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.id}): ${user.enviados || 0} diamantes enviados`);
    });
    
    // Verificar IDs específicos
    console.log('\n🔍 VERIFICANDO SEUS IDs:');
    const yourIds = ['65384127', '653841']; // IDs que aparecem nas transações
    
    yourIds.forEach(id => {
      const user = users.find(u => u.id === id);
      if (user) {
        console.log(`\n   ✅ Usuário ${id} encontrado:`);
        console.log(`      Nome: ${user.name}`);
        console.log(`      Diamonds: ${user.diamonds || 0}`);
        console.log(`      Enviados: ${user.enviados || 0}`);
        console.log(`      Receptores: ${user.receptores || 0}`);
        console.log(`      Earnings: ${user.earnings || 0}`);
        
        // Posição nos rankings
        const posReceivers = sortedByReceivers.findIndex(u => u.id === id) + 1;
        const posSenders = sortedBySenders.findIndex(u => u.id === id) + 1;
        
        console.log(`      Posição ranking recebidos: ${posReceivers > 0 ? `#${posReceivers}` : 'Não está'}`);
        console.log(`      Posição ranking enviados: ${posSenders > 0 ? `#${posSenders}` : 'Não está'}`);
      } else {
        console.log(`   ❌ Usuário ${id} NÃO encontrado`);
      }
    });
    
    console.log('\n📊 ANÁLISE:');
    console.log('   - Ranking atual usa "receptores" (quem recebeu presentes)');
    console.log('   - Se você envia presentes, seu ID aparece em "enviados"');
    console.log('   - Para aparecer no ranking atual, você precisa receber presentes');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkUserRanking();
