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
    // Primeiro, listar todos os usuários para encontrar o ID correto
    const allUsers = await User.find({});
    console.log(`Total de usuários encontrados: ${allUsers.length}`);
    
    if (allUsers.length === 0) {
      console.log('Nenhum usuário encontrado no banco de dados');
      process.exit(0);
    }
    
    // Mostrar todos os IDs disponíveis
    console.log('\nIDs disponíveis:');
    allUsers.forEach(user => {
      console.log(`- ID: ${user.id}, Nome: ${user.name || 'Não definido'}`);
    });
    
    // Tentar encontrar o usuário com ID '1', se não existir, usar o primeiro
    let user = await User.findOne({ id: '1' });
    let userId = '1';
    
    if (!user && allUsers.length > 0) {
      user = allUsers[0];
      userId = user.id;
      console.log(`\nUsuário com ID '1' não encontrado. Usando o primeiro usuário: ID ${userId}`);
    }
    
    if (user) {
      console.log(`\nDados atuais do usuário (ID: ${userId}):`);
      console.log('- ID:', user.id);
      console.log('- Nome:', user.name || 'Não definido');
      console.log('- Diamonds (carteira):', user.diamonds || 0);
      console.log('- Earnings (ganhos):', user.earnings || 0);
      console.log('- Receptores:', user.receptores || 0);
      console.log('- Enviados:', user.enviados || 0);
      console.log('- Withdrawal method:', user.withdrawal_method ? 'Configurado' : 'Não configurado');
    } else {
      console.log('Nenhum usuário encontrado');
    }
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
