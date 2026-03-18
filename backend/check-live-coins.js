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

// Definir schema do Streamer
const StreamerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  hostId: { type: String, required: true },
  name: { type: String, required: true },
  diamonds: { type: Number, default: 0 },
  isLive: { type: Boolean, default: false }
});

const Streamer = mongoose.model('Streamer', StreamerSchema);

(async () => {
  try {
    console.log('🔍 VERIFICANDO CONTADOR DE MOEDAS DA LIVE:');
    
    const userId = '65384127'; // ID do usuário adriano
    
    // Buscar stream ativo do usuário
    const stream = await Streamer.findOne({ 
      hostId: userId,
      isLive: true 
    });
    
    if (!stream) {
      console.log('❌ Nenhuma live ativa encontrada para este usuário');
      process.exit(0);
    }
    
    console.log('\n📊 DADOS DA LIVE ATIVA:');
    console.log('- Stream ID:', stream.id);
    console.log('- Host ID:', stream.hostId);
    console.log('- Stream Name:', stream.name);
    console.log('- Diamonds (contador da live):', stream.diamonds || 0);
    console.log('- Is Live:', stream.isLive);
    
    console.log('\n🎯 PROBLEMA IDENTIFICADO:');
    console.log('O contador de moedas está vindo de Streamer.diamonds, não do User.diamonds');
    console.log('Quando o usuário saca, apenas User.diamonds é zerado');
    console.log('Streamer.diamonds permanece com o valor antigo da live');
    
    console.log('\n✅ SOLUÇÃO NECESSÁRIA:');
    console.log('1. Zerar Streamer.diamonds quando usuário sacar');
    console.log('2. Ou sincronizar Streamer.diamonds com User.diamonds');
    console.log('3. Ou usar User.diamonds como fonte única para o contador');
    
    // Verificar se há diferença
    const User = mongoose.model('User', new mongoose.Schema({
      id: String,
      diamonds: Number
    }));
    
    const user = await User.findOne({ id: userId });
    const userDiamonds = user ? (user.diamonds || 0) : 0;
    const streamDiamonds = stream.diamonds || 0;
    
    console.log('\n📈 COMPARAÇÃO:');
    console.log('- User.diamonds (banco):', userDiamonds);
    console.log('- Streamer.diamonds (live):', streamDiamonds);
    console.log('- Diferença:', streamDiamonds - userDiamonds);
    
    if (streamDiamonds !== userDiamonds) {
      console.log('⚠️ INCONSISTÊNCIA DETECTADA!');
      console.log('O contador da live está diferente do saldo real do usuário');
    } else {
      console.log('✅ Valores sincronizados');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
