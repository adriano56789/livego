const mongoose = require('mongoose');

// Conectar ao MongoDB
mongoose.connect('mongodb://admin:adriano123@localhost:27017/api?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado ao MongoDB');
}).catch(err => {
  console.error('Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});

// Definir schema do User
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  diamonds: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  receptores: { type: Number, default: 0 },
  enviados: { type: Number, default: 0 },
  withdrawal_method: { type: mongoose.Schema.Types.Mixed }
});

const User = mongoose.model('User', UserSchema);

(async () => {
  try {
    console.log('🧪 TESTANDO RANKING APÓS CORREÇÃO:');
    
    // Simular chamada à API de ranking como o frontend faz
    const testRanking = async (period) => {
      console.log(`\n📊 Testando ranking ${period}:`);
      
      // Buscar usuários com contadores > 0 (lógica corrigida)
      const users = await User.find({
        $or: [
          { receptores: { $gt: 0 } },
          { diamonds: { $gt: 0 } }
        ]
      });
      
      console.log(`👤 Usuários com contadores encontrados: ${users.length}`);
      
      // Aplicar lógica do ranking corrigido
      const validUsers = users.map(user => {
        const userObj = user.toObject ? user.toObject() : user;
        const contribution = user.receptores || 0;
        
        if (contribution === 0) {
          return null; // Não aparece no ranking se estiver zerado
        }
        
        return {
          ...userObj,
          contribution: contribution,
          rank: 0,
          period: period,
          debug: {
            diamonds: user.diamonds || 0,
            receptores: user.receptores || 0,
            enviados: user.enviados || 0,
            source: 'counters'
          }
        };
      }).filter(user => user !== null && user.contribution > 0);
      
      // Ordenar
      validUsers.sort((a, b) => b.contribution - a.contribution);
      
      // Atribuir ranks
      validUsers.forEach((user, index) => {
        user.rank = index + 1;
      });
      
      console.log(`✅ ${validUsers.length} usuários no ranking ${period}`);
      
      if (validUsers.length > 0) {
        console.log('🏆 Top usuários:');
        validUsers.slice(0, 3).forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name}: ${user.contribution} diamantes (receptores: ${user.debug.receptores})`);
        });
      } else {
        console.log('📭 Nenhum usuário no ranking (todos os contadores estão zerados)');
      }
      
      return validUsers;
    };
    
    // Testar todos os períodos
    await testRanking('daily');
    await testRanking('weekly');
    await testRanking('monthly');
    
    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('✅ Ranking deve estar vazio pois todos os contadores estão zerados');
    console.log('✅ Frontend não deve mais mostrar valores antigos');
    console.log('✅ Quando receber presentes, ranking será atualizado em tempo real');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
