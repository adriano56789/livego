/**
 * Script para atualizar campo recebido do usuário adriano para 6 diamantes
 * Uso: node backend/scripts/update-recebido-adriano.js
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function updateRecebido() {
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
    console.log(`   Recebido atual: ${user.recebido ?? 0}`);

    const result = await User.updateOne(
      { id: user.id },
      { $set: { recebido: 6 } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Campo recebido atualizado para 6');
      const updated = await User.findOne({ id: user.id });
      console.log(`   Novo recebido: ${updated.recebido}`);
    } else {
      console.log('⚠️ Nenhuma alteração (valor já estava correto?)');
    }

  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

updateRecebido();
