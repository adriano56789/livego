const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

async function addDiamonds() {
  const client = new MongoClient('mongodb://admin:adriano123@localhost:27017/api?authSource=admin');
  await client.connect();
  const db = client.db('api');
  
  try {
    // Listar todos os usuários para encontrar o ID correto
    const users = await db.collection('users').find({}).toArray();
    console.log('Usuários encontrados:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Nome: ${user.name}, Diamantes: ${user.diamonds}`);
    });
    
    // Tentar encontrar pelo ID do token JWT
    const userById = await db.collection('users').findOne({ id: '65384127' });
    if (userById) {
      console.log('\nUsuário encontrado pelo ID 65384127');
      
      // Adicionar 65.000 diamantes
      const result = await db.collection('users').updateOne(
        { id: '65384127' },
        { $inc: { diamonds: 65000 } }
      );
      
      console.log('Resultado da atualização:', result);
      
      // Verificar novo saldo
      const updatedUser = await db.collection('users').findOne({ id: '65384127' });
      console.log('Novo saldo de diamantes:', updatedUser?.diamonds);
    } else {
      console.log('\nUsuário com ID 65384127 não encontrado');
      console.log('Tentando encontrar por _id...');
      
      // Tentar encontrar por _id (MongoDB ObjectId)
      const userByMongoId = await db.collection('users').findOne({ _id: '65384127' });
      if (userByMongoId) {
        console.log('Encontrado por _id, atualizando...');
        const result = await db.collection('users').updateOne(
          { _id: '65384127' },
          { $inc: { diamonds: 65000 } }
        );
        console.log('Resultado:', result);
      }
    }
    
  } catch (error) {
    console.error('Erro ao adicionar diamantes:', error);
  } finally {
    await client.close();
  }
}

addDiamonds().catch(console.error);
