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
    
    console.log('Dados ANTES do reset:');
    console.log('- Diamonds (carteira):', user.diamonds || 0);
    console.log('- Earnings (ganhos):', user.earnings || 0);
    console.log('- Receptores:', user.receptores || 0);
    console.log('- Enviados:', user.enviados || 0);
    
    // Zerar todos os saldos para simular pós-saque
    const oldValues = {
      diamonds: user.diamonds || 0,
      earnings: user.earnings || 0,
      receptores: user.receptores || 0,
      enviados: user.enviados || 0
    };
    
    user.diamonds = 0;
    user.earnings = 0;
    user.receptores = 0;
    // Manter enviados pois é um contador histórico
    
    await user.save();
    
    console.log('\nDados APÓS reset (simulando pós-saque):');
    console.log('- Diamonds (carteira):', user.diamonds);
    console.log('- Earnings (ganhos):', user.earnings);
    console.log('- Receptores:', user.receptores);
    console.log('- Enviados:', user.enviados);
    
    console.log('\nResumo das alterações:');
    console.log('- Diamonds:', oldValues.diamonds, '→', user.diamonds, '(diff:', user.diamonds - oldValues.diamonds, ')');
    console.log('- Earnings:', oldValues.earnings, '→', user.earnings, '(diff:', user.earnings - oldValues.earnings, ')');
    console.log('- Receptores:', oldValues.receptores, '→', user.receptores, '(diff:', user.receptores - oldValues.receptores, ')');
    console.log('- Enviados:', oldValues.enviados, '→', user.enviados, '(mantido)');
    
    console.log('\n✅ Saldos zerados com sucesso! Agora o frontend deve mostrar 0 em todas as telas.');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
