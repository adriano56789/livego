const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function checkTransactions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔍 Verificando transações recentes...');
    
    const db = mongoose.connection.db;
    const GiftTransaction = db.collection('gifttransactions');
    
    // Total de transações
    const total = await GiftTransaction.countDocuments();
    console.log('Total de transações:', total);
    
    // Últimas 24 horas
    const yesterday = new Date(Date.now() - 24*60*60*1000);
    const daily = await GiftTransaction.countDocuments({
      createdAt: { $gte: yesterday }
    });
    console.log('Transações últimas 24h:', daily);
    
    // Últimos 7 dias
    const week = new Date(Date.now() - 7*24*60*60*1000);
    const weekly = await GiftTransaction.countDocuments({
      createdAt: { $gte: week }
    });
    console.log('Transações últimos 7 dias:', weekly);
    
    // Mostrar últimas 5 transações
    const latest = await GiftTransaction.find().sort({createdAt: -1}).limit(5).toArray();
    console.log('\nÚltimas 5 transações:');
    latest.forEach(tx => {
      console.log('  ', new Date(tx.createdAt).toISOString(), '->', tx.fromUserId, 'valor:', (tx.giftPrice || 0) * (tx.quantity || 0));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkTransactions();
