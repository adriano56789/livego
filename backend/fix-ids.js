const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function fixIds() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔧 Corrigindo IDs inconsistentes...');
    
    const db = mongoose.connection.db;
    const GiftTransaction = db.collection('gifttransactions');
    const User = db.collection('users');
    
    // Buscar todas as transações com IDs problemáticos
    const transactions = await GiftTransaction.find({
      $or: [
        { fromUserId: '653841' },
        { toUserId: '653841' }
      ]
    }).toArray();
    
    console.log(`📋 Encontradas ${transactions.length} transações com ID 653841`);
    
    if (transactions.length === 0) {
      console.log('✅ Nenhuma transação precisa ser corrigida');
      process.exit(0);
    }
    
    // Corrigir cada transação
    let corrected = 0;
    for (const tx of transactions) {
      const updateData = {};
      
      if (tx.fromUserId === '653841') {
        updateData.fromUserId = '65384127';
      }
      
      if (tx.toUserId === '653841') {
        updateData.toUserId = '65384127';
      }
      
      if (Object.keys(updateData).length > 0) {
        await GiftTransaction.updateOne(
          { _id: tx._id },
          { $set: updateData }
        );
        corrected++;
        console.log(`✅ Transação ${tx._id} corrigida: ${JSON.stringify(updateData)}`);
      }
    }
    
    console.log(`\n🎉 Total corrigido: ${corrected} transações`);
    
    // Verificar resultado
    const remainingWrong = await GiftTransaction.countDocuments({
      $or: [
        { fromUserId: '653841' },
        { toUserId: '653841' }
      ]
    });
    
    console.log(`📊 Transações restantes com ID errado: ${remainingWrong}`);
    
    if (remainingWrong === 0) {
      console.log('✅ Todos os IDs foram corrigidos com sucesso!');
    } else {
      console.log('⚠️ Ainda há transações com IDs errados');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

fixIds();
