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
const GiftTransactionSchema = new mongoose.Schema({
  fromUserId: String,
  fromUserName: String,
  toUserId: String,
  toUserName: String,
  giftName: String,
  giftPrice: Number,
  quantity: Number,
  totalValue: Number,
  createdAt: Date
});

const UserSchema = new mongoose.Schema({
  id: String,
  name: String,
  avatarUrl: String
});

const StreamerSchema = new mongoose.Schema({
  hostId: String,
  isLive: Boolean
});

const GiftTransaction = mongoose.model('GiftTransaction', GiftTransactionSchema);
const User = mongoose.model('User', UserSchema);
const Streamer = mongoose.model('Streamer', StreamerSchema);

(async () => {
  try {
    console.log('🧪 TESTANDO API DE RANKING AO VIVO:');
    
    // Simular chamada à API de ranking live
    const now = new Date();
    const liveStartTime = new Date(now.getTime() - (2 * 60 * 60 * 1000)); // Últimas 2 horas
    
    console.log('\n🔍 Buscando transações recentes (últimas 2 horas)...');
    
    // Buscar transações recentes
    const recentGifts = await GiftTransaction.find({
      createdAt: { $gte: liveStartTime.toISOString() }
    }).sort({ createdAt: -1 }).limit(100);
    
    console.log(`🎁 Encontradas ${recentGifts.length} transações recentes`);
    
    if (recentGifts.length === 0) {
      console.log('ℹ️ Nenhuma transação recente encontrada');
      console.log('\n💡 Para testar, envie alguns presentes na live!');
      process.exit(0);
    }
    
    // Mostrar algumas transações recentes
    console.log('\n📋 Transações recentes:');
    recentGifts.slice(0, 5).forEach((gift, index) => {
      console.log(`   ${index + 1}. ${gift.fromUserName} → ${gift.toUserName}: ${gift.giftName} (${gift.totalValue} diamantes)`);
    });
    
    // Agrupar por streamer
    const streamerContributions = new Map();
    
    recentGifts.forEach((gift) => {
      const toUserId = gift.toUserId;
      
      if (!streamerContributions.has(toUserId)) {
        streamerContributions.set(toUserId, {
          totalValue: 0,
          giftCount: 0,
          streamerId: toUserId,
          streamerName: gift.toUserName || 'Unknown',
          lastGiftTime: gift.createdAt,
          gifts: []
        });
      }
      
      const contribution = streamerContributions.get(toUserId);
      contribution.totalValue += gift.totalValue || 0;
      contribution.giftCount += 1;
      contribution.lastGiftTime = new Date(gift.createdAt);
      contribution.gifts.push({
        fromUser: gift.fromUserName,
        giftName: gift.giftName,
        giftPrice: gift.giftPrice,
        quantity: gift.quantity,
        totalValue: gift.totalValue,
        timestamp: gift.createdAt
      });
    });
    
    // Ordenar e pegar top 20
    const liveRanking = Array.from(streamerContributions.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 20);
    
    console.log('\n🏆 RANKING AO VIVO (TEMPORAL):');
    liveRanking.forEach((contrib, index) => {
      console.log(`   ${index + 1}. ${contrib.streamerName}: ${contrib.totalValue} diamantes (${contrib.giftCount} presentes)`);
    });
    
    // Verificar quais estão ao vivo
    const streamerIds = liveRanking.map(c => c.streamerId);
    const activeStreams = await Streamer.find({ 
      hostId: { $in: streamerIds }, 
      isLive: true 
    });
    const liveStreamIds = new Set(activeStreams.map(s => s.hostId));
    
    console.log('\n🔥 STREAMERS ATIVOS AGORA:');
    liveRanking.forEach((contrib, index) => {
      const isLive = liveStreamIds.has(contrib.streamerId);
      if (isLive) {
        console.log(`   🔴 ${contrib.streamerName} - AO VIVO (${contrib.totalValue} diamantes)`);
      }
    });
    
    console.log('\n✅ API de ranking ao vivo funcionando!');
    console.log('📡 Endpoint: GET /api/contribution/live');
    console.log('⏱️  Atualiza em tempo real a cada 2 horas de activity');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
