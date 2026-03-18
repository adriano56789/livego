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

// Definir schema do User (baseado no modelo TypeScript)
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
    const userId = '65384127'; // ID do usuário adriano
    
    // Buscar usuário atual
    const user = await User.findOne({ id: userId });
    if (!user) {
      console.log('Usuário não encontrado');
      process.exit(0);
    }
    
    console.log('VERIFICAÇÃO PÓS-CORREÇÕES:');
    console.log('- ID:', user.id);
    console.log('- Nome:', user.name || 'Não definido');
    console.log('- Diamonds (carteira):', user.diamonds || 0);
    console.log('- Earnings (ganhos):', user.earnings || 0);
    console.log('- Receptores:', user.receptores || 0);
    console.log('- Enviados:', user.enviados || 0);
    
    // Verificar se os saldos estão zerados como esperado
    const isDiamondsZero = (user.diamonds || 0) === 0;
    const isEarningsZero = (user.earnings || 0) === 0;
    const isReceptoresZero = (user.receptores || 0) === 0;
    
    console.log('\nSTATUS DOS SALDOS:');
    console.log('- Diamonds zerado:', isDiamondsZero ? '✅ SIM' : '❌ NÃO');
    console.log('- Earnings zerado:', isEarningsZero ? '✅ SIM' : '❌ NÃO');
    console.log('- Receptores zerado:', isReceptoresZero ? '✅ SIM' : '❌ NÃO');
    
    if (isDiamondsZero && isEarningsZero && isReceptoresZero) {
      console.log('\n🎉 SUCESSO: Todos os saldos estão zerados!');
      console.log('O frontend agora deve mostrar 0 em todas as telas após o saque.');
    } else {
      console.log('\n⚠️ ATENÇÃO: Alguns saldos não estão zerados.');
      console.log('Verifique se as correções foram aplicadas corretamente.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
