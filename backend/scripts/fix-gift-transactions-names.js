/**
 * Script para corrigir nomes undefined nas transações de presentes
 * Uso: node backend/scripts/fix-gift-transactions-names.js
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function fixGiftTransactionNames() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const GiftTransaction = mongoose.connection.collection('gifttransactions');
    const User = mongoose.connection.collection('users');
    
    // Buscar transações com fromUserName undefined
    const transactionsWithUndefinedName = await GiftTransaction.find({
      fromUserName: { $in: [undefined, null, ''] }
    }).toArray();
    
    console.log(`🔍 Transações com nome undefined: ${transactionsWithUndefinedName.length}`);
    
    for (const transaction of transactionsWithUndefinedName) {
      console.log(`\n🔧 Corrigindo transação: ${transaction.id}`);
      console.log(`   fromUserId: ${transaction.fromUserId}`);
      console.log(`   fromUserName atual: ${transaction.fromUserName}`);
      
      // Buscar o usuário para pegar o nome correto
      const user = await User.findOne({ id: transaction.fromUserId });
      
      if (user) {
        console.log(`   Usuário encontrado: ${user.name}`);
        
        // Atualizar a transação
        const result = await GiftTransaction.updateOne(
          { id: transaction.id },
          { $set: { fromUserName: user.name } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`   ✅ Nome atualizado para: ${user.name}`);
        } else {
          console.log(`   ⚠️ Nenhuma alteração necessária`);
        }
      } else {
        console.log(`   ❌ Usuário não encontrado para ID: ${transaction.fromUserId}`);
      }
    }
    
    console.log(`\n🎉 Correção concluída!`);

  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

fixGiftTransactionNames();
