/**
 * Script para atualizar receptores do usuário adriano (65384127) para 6
 * Uso: node backend/scripts/fix-receptores-adriano.js
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function fixReceptores() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const User = mongoose.connection.collection('users');
    
    // Buscar por identification ou id
    const user = await User.findOne({ 
      $or: [ 
        { identification: '65384127' }, 
        { id: '65384127' } 
      ] 
    });

    if (!user) {
      console.log('❌ Usuário não encontrado com identification/id 65384127');
      const all = await User.find({}).limit(5).toArray();
      console.log('Usuários no banco:', all.map(u => ({ id: u.id, identification: u.identification, name: u.name })));
      process.exit(1);
    }

    console.log(`📋 Usuário encontrado: ${user.name} (id: ${user.id}, identification: ${user.identification})`);
    console.log(`   Receptores atual: ${user.receptores ?? 0}`);
    console.log(`   Earnings atual: ${user.earnings ?? 0}`);

    const result = await User.updateOne(
      { id: user.id },
      { $set: { receptores: 6, earnings: 6 } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Receptores e earnings atualizados para 6');
      const updated = await User.findOne({ id: user.id });
      console.log(`   Novo receptores: ${updated.receptores}`);
      console.log(`   Novo earnings: ${updated.earnings}`);
    } else {
      console.log('⚠️ Nenhuma alteração (valores já estavam corretos?)');
    }

  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

fixReceptores();
