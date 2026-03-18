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

// Definir schema de GiftTransaction
const GiftTransactionSchema = new mongoose.Schema({
  fromUserId: String,
  toUserId: String,
  giftName: String,
  giftPrice: Number,
  quantity: Number,
  totalValue: Number,
  createdAt: Date
});

const User = mongoose.model('User', UserSchema);
const GiftTransaction = mongoose.model('GiftTransaction', GiftTransactionSchema);

(async () => {
  try {
    console.log('🔍 VERIFICANDO CONTADORES DO RANKING:');
    
    const userId = '65384127'; // ID do usuário adriano
    
    // Buscar usuário atual
    const user = await User.findOne({ id: userId });
    if (!user) {
      console.log('Usuário não encontrado');
      process.exit(0);
    }
    
    console.log('\n📊 DADOS ATUAIS DO USUÁRIO:');
    console.log('- ID:', user.id);
    console.log('- Nome:', user.name);
    console.log('- Diamonds (carteira):', user.diamonds || 0);
    console.log('- Earnings (ganhos):', user.earnings || 0);
    console.log('- Receptores (contador ranking):', user.receptores || 0);
    console.log('- Enviados:', user.enviados || 0);
    
    // Verificar transações recentes que alimentam o ranking
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    console.log('\n🔍 VERIFICANDO TRANSAÇÕES POR PERÍODO:');
    
    // Diário
    const dailyTransactions = await GiftTransaction.find({
      toUserId: userId,
      createdAt: { $gte: today.toISOString() }
    });
    const dailyTotal = dailyTransactions.reduce((sum, t) => sum + (t.totalValue || 0), 0);
    
    // Semanal
    const weeklyTransactions = await GiftTransaction.find({
      toUserId: userId,
      createdAt: { $gte: thisWeek.toISOString() }
    });
    const weeklyTotal = weeklyTransactions.reduce((sum, t) => sum + (t.totalValue || 0), 0);
    
    // Mensal
    const monthlyTransactions = await GiftTransaction.find({
      toUserId: userId,
      createdAt: { $gte: thisMonth.toISOString() }
    });
    const monthlyTotal = monthlyTransactions.reduce((sum, t) => sum + (t.totalValue || 0), 0);
    
    console.log('- Daily (hoje):', dailyTotal, 'diamantes em', dailyTransactions.length, 'transações');
    console.log('- Weekly (semana):', weeklyTotal, 'diamantes em', weeklyTransactions.length, 'transações');
    console.log('- Monthly (mês):', monthlyTotal, 'diamantes em', monthlyTransactions.length, 'transações');
    
    console.log('\n🎯 PROBLEMA IDENTIFICADO:');
    console.log('O ranking está usando transações antigas (antes do saque) porque:');
    console.log('1. As transações não são apagadas quando o usuário saca');
    console.log('2. O ranking calcula baseado em transações, não nos contadores atuais');
    console.log('3. Mesmo com receptores=0, as transações antigas continuam no ranking');
    
    console.log('\n✅ SOLUÇÃO NECESSÁRIA:');
    console.log('1. Zerar o contador "receptores" no banco (já feito)');
    console.log('2. Modificar ranking para usar "receptores" em vez de transações');
    console.log('3. Ou apagar transações antigas quando sacar');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
