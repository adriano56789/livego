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
    
    // Simular compra de diamantes
    const user = await User.findOne({ id: userId });
    if (!user) {
      console.log('Usuário não encontrado');
      process.exit(0);
    }
    
    console.log('SIMULAÇÃO DE COMPRA DE DIAMANTES:');
    console.log('\nDados ANTES da compra:');
    console.log('- Diamonds (carteira):', user.diamonds || 0);
    console.log('- Earnings (ganhos):', user.earnings || 0);
    console.log('- Receptores:', user.receptores || 0);
    
    // Simular compra de 1000 diamantes
    const purchaseAmount = 1000;
    user.diamonds = (user.diamonds || 0) + purchaseAmount;
    
    await user.save();
    
    console.log('\nDados APÓS compra de 1000 diamantes:');
    console.log('- Diamonds (carteira):', user.diamonds);
    console.log('- Earnings (ganhos):', user.earnings || 0);
    console.log('- Receptores:', user.receptores || 0);
    
    console.log('\n✅ Compra simulada com sucesso!');
    console.log('O frontend agora deve mostrar 1000 diamantes na aba de compra.');
    console.log('Quando alguém comprar diamantes, a API deve atualizar em tempo real.');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
