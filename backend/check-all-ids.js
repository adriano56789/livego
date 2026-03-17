const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function checkAllIds() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔍 Verificando todos os IDs nas transações...');
    
    const db = mongoose.connection.db;
    const GiftTransaction = db.collection('gifttransactions');
    const User = db.collection('users');
    
    // Buscar todas as transações
    const transactions = await GiftTransaction.find({}).toArray();
    console.log(`📋 Total de transações: ${transactions.length}`);
    
    // Coletar IDs únicos
    const fromIds = new Set();
    const toIds = new Set();
    const allIds = new Set();
    
    transactions.forEach(tx => {
      if (tx.fromUserId) {
        fromIds.add(tx.fromUserId);
        allIds.add(tx.fromUserId);
      }
      if (tx.toUserId) {
        toIds.add(tx.toUserId);
        allIds.add(tx.toUserId);
      }
    });
    
    console.log('\n👥 IDs únicos encontrados:');
    console.log(`   From (remetentes): ${Array.from(fromIds).join(', ')}`);
    console.log(`   To (destinatários): ${Array.from(toIds).join(', ')}`);
    console.log(`   Todos: ${Array.from(allIds).join(', ')}`);
    
    // Verificar quais IDs existem no User
    const users = await User.find({}).toArray();
    const userIds = users.map(u => u.id);
    
    console.log('\n👤 IDs de usuários no banco:');
    console.log(`   ${userIds.join(', ')}`);
    
    // Encontrar IDs que estão em transações mas não em usuários
    const orphanIds = Array.from(allIds).filter(id => !userIds.includes(id));
    
    if (orphanIds.length > 0) {
      console.log('\n❌ IDs órfãos (em transações mas não em usuários):');
      orphanIds.forEach(id => {
        const count = transactions.filter(tx => 
          tx.fromUserId === id || tx.toUserId === id
        ).length;
        console.log(`   ${id}: ${count} transações`);
      });
      
      // Perguntar qual é o ID correto
      console.log('\n🤔 Qual é o ID correto para substituir estes?');
      console.log('   Opções baseadas nos usuários existentes:');
      userIds.forEach(id => {
        console.log(`   - ${id}`);
      });
    } else {
      console.log('\n✅ Todos os IDs das transações existem no banco de usuários');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkAllIds();
