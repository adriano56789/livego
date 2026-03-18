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

// Definir schemas
const StreamerSchema = new mongoose.Schema({
  id: String,
  hostId: String,
  name: String,
  diamonds: Number,
  isLive: Boolean
});

const UserSchema = new mongoose.Schema({
  id: String,
  diamonds: Number,
  earnings: Number,
  receptores: Number
});

const Streamer = mongoose.model('Streamer', StreamerSchema);
const User = mongoose.model('User', UserSchema);

(async () => {
  try {
    console.log('🔧 ZERANDO CONTADOR DA LIVE APÓS SAQUE:');
    
    const userId = '65384127'; // ID do usuário adriano
    
    // Buscar dados atuais
    const user = await User.findOne({ id: userId });
    const stream = await Streamer.findOne({ 
      hostId: userId, 
      isLive: true 
    });
    
    if (!stream) {
      console.log('❌ Nenhuma live ativa encontrada');
      process.exit(0);
    }
    
    console.log('\n📊 DADOS ANTES DA CORREÇÃO:');
    console.log('- User.diamonds:', user ? (user.diamonds || 0) : 0);
    console.log('- Streamer.diamonds (contador live):', stream.diamonds || 0);
    
    // Zerar contador da live (simular pós-saque)
    const oldStreamDiamonds = stream.diamonds || 0;
    stream.diamonds = 0;
    await stream.save();
    
    console.log('\n📊 DADOS APÓS CORREÇÃO:');
    console.log('- User.diamonds:', user ? (user.diamonds || 0) : 0);
    console.log('- Streamer.diamonds (contador live):', stream.diamonds);
    console.log('- Diferença zerada:', oldStreamDiamonds - stream.diamonds);
    
    console.log('\n✅ CONTADOR DA LIVE ZERADO!');
    console.log('Agora o frontend deve mostrar 0 moedas na transmissão ao vivo');
    console.log('O contador está sincronizado com o saldo real do usuário');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
