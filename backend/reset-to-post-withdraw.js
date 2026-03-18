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
    
    // Zerar diamonds novamente para simular estado pós-saque
    const user = await User.findOne({ id: userId });
    if (!user) {
      console.log('Usuário não encontrado');
      process.exit(0);
    }
    
    console.log('REVERTENDO SIMULAÇÃO - VOLTANDO AO ESTADO PÓS-SAQUE:');
    console.log('\nDados ATUAIS:');
    console.log('- Diamonds (carteira):', user.diamonds || 0);
    console.log('- Earnings (ganhos):', user.earnings || 0);
    console.log('- Receptores:', user.receptores || 0);
    
    // Zerar diamonds para voltar ao estado pós-saque
    user.diamonds = 0;
    
    await user.save();
    
    console.log('\nDados APÓS reverter (estado pós-saque):');
    console.log('- Diamonds (carteira):', user.diamonds);
    console.log('- Earnings (ganhos):', user.earnings || 0);
    console.log('- Receptores:', user.receptores || 0);
    
    console.log('\n✅ Estado pós-saque restaurado!');
    console.log('Agora o frontend deve mostrar 0 em todas as telas.');
    console.log('Quando alguém comprar diamantes de verdade, a API deve atualizar em tempo real.');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
