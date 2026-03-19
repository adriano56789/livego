const express = require('express');
const mongoose = require('mongoose');

// Conectar ao MongoDB
mongoose.connect('mongodb://admin:adriano123@localhost:27017/api?authSource/admin');

// Teste direto da API
const app = express();
app.use(express.json());

// Schema
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

const GiftTransaction = mongoose.model('GiftTransaction', GiftTransactionSchema);

// Rota de teste
app.get('/test-contribution/live', async (req, res) => {
  try {
    const now = new Date();
    const liveStartTime = new Date(now.getTime() - (2 * 60 * 60 * 1000));
    
    const recentGifts = await GiftTransaction.find({
      createdAt: { $gte: liveStartTime.toISOString() }
    }).sort({ createdAt: -1 }).limit(100);
    
    res.json({
      success: true,
      count: recentGifts.length,
      message: recentGifts.length > 0 ? 'API funcionando!' : 'Nenhuma transação recente',
      data: recentGifts.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('🧪 Servidor de teste rodando em http://localhost:3001');
  console.log('Teste: http://localhost:3001/test-contribution/live');
});
