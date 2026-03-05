import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function initChatCollections() {
    console.log('=== INICIALIZANDO COLEÇÕES DE CHAT ===');
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected successfully');

        // Verificar se as coleções de chat existem
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }
        
        const collections = await db.listCollections().toArray();
        
        const chatCollections = ['chats', 'chatmessages', 'conversations'];
        const existingCollections = collections.map(c => c.name);
        
        console.log('📋 Coleções existentes:', existingCollections);
        
        // Criar coleções se não existirem
        for (const collectionName of chatCollections) {
            if (!existingCollections.includes(collectionName)) {
                await db.createCollection(collectionName);
                console.log(`✅ Coleção '${collectionName}' criada com sucesso`);
            } else {
                console.log(`📂 Coleção '${collectionName}' já existe`);
            }
        }

        // Criar índices para performance
        const chatsCollection = db.collection('chats');
        await chatsCollection.createIndex({ participants: 1 });
        await chatsCollection.createIndex({ isActive: 1 });
        await chatsCollection.createIndex({ 'lastMessage.timestamp': -1 });
        
        const messagesCollection = db.collection('chatmessages');
        await messagesCollection.createIndex({ conversationId: 1 });
        await messagesCollection.createIndex({ senderId: 1 });
        await messagesCollection.createIndex({ receiverId: 1 });
        await messagesCollection.createIndex({ timestamp: -1 });
        await messagesCollection.createIndex({ isRead: 1 });
        
        console.log('🔍 Índices criados para performance de chat');
        
        console.log('\n✅ Coleções de chat inicializadas com sucesso!');
        console.log('📝 Prontas para receber mensagens e status em tempo real');
        
    } catch (error: any) {
        console.error('❌ Erro ao inicializar coleções:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

initChatCollections();
