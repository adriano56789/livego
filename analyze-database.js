import mongoose from 'mongoose';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Conectar ao MongoDB
mongoose.connect('mongodb://admin:adriano123@localhost:27017/api?authSource=admin')
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar:', err));

// Script para analisar o banco de dados
async function analyzeDatabase() {
  try {
    // Esperar a conexão estar pronta
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Conexão com banco não estabelecida');
    }
    
    const collections = await db.listCollections().toArray();
    
    console.log('=== COLEÇÕES ENCONTRADAS ===');
    collections.forEach(col => console.log(`- ${col.name}`));
    console.log('\n');

    // Analisar usuários e avatares
    console.log('=== ANÁLISE DE USUÁRIOS E AVATARES ===');
    const users = await db.collection('users').find({}).toArray();
    console.log(`Total de usuários: ${users.length}`);
    
    users.forEach(user => {
      console.log(`\n--- Usuário: ${user.name || 'N/A'} ---`);
      console.log(`ID: ${user.id || user._id}`);
      console.log(`Email: ${user.email || 'N/A'}`);
      console.log(`Avatar URL: ${user.avatarUrl || 'N/A'}`);
      console.log(`Avatar válido: ${user.avatarUrl ? 'SIM' : 'NÃO'}`);
      if (user.avatarUrl) {
        console.log(`Protocolo: ${user.avatarUrl.startsWith('http') ? 'HTTP' : 'RELATIVO'}`);
      }
    });

    // Analisar chats/mensagens
    console.log('\n=== ANÁLISE DE CHATS/CONVERSAS ===');
    const chatCollections = collections.filter(c => c.name.includes('chat') || c.name.includes('message') || c.name.includes('conversation'));
    
    for (const col of chatCollections) {
      console.log(`\n--- Coleção: ${col.name} ---`);
      const docs = await db.collection(col.name).find({}).limit(5).toArray();
      console.log(`Total de documentos: ${await db.collection(col.name).countDocuments()}`);
      
      docs.forEach((doc, index) => {
        console.log(`\nDocumento ${index + 1}:`);
        console.log(JSON.stringify(doc, null, 2));
      });
    }

    // Analisar presentes/transações
    console.log('\n=== ANÁLISE DE PRESENTES/TRANSAÇÕES ===');
    const giftCollections = collections.filter(c => c.name.includes('gift') || c.name.includes('transaction'));
    
    for (const col of giftCollections) {
      console.log(`\n--- Coleção: ${col.name} ---`);
      const docs = await db.collection(col.name).find({}).sort({createdAt: -1}).limit(5).toArray();
      console.log(`Total de documentos: ${await db.collection(col.name).countDocuments()}`);
      
      docs.forEach((doc, index) => {
        console.log(`\nDocumento ${index + 1}:`);
        console.log(JSON.stringify(doc, null, 2));
      });
    }

    // Analisar streams/sessões
    console.log('\n=== ANÁLISE DE STREAMS/SESSÕES ===');
    const streamCollections = collections.filter(c => c.name.includes('stream') || c.name.includes('session'));
    
    for (const col of streamCollections) {
      console.log(`\n--- Coleção: ${col.name} ---`);
      const docs = await db.collection(col.name).find({}).limit(3).toArray();
      console.log(`Total de documentos: ${await db.collection(col.name).countDocuments()}`);
      
      docs.forEach((doc, index) => {
        console.log(`\nDocumento ${index + 1}:`);
        console.log(JSON.stringify(doc, null, 2));
      });
    }

  } catch (error) {
    console.error('Erro ao analisar banco:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Executar análise
analyzeDatabase();
