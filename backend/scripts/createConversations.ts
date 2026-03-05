import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, ChatMessage } from '../src/models/index';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const createConversations = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Buscar usuários REAIS
        console.log('🔍 Buscando usuários REAIS...');
        const users = await User.find({});
        
        if (users.length < 2) {
            console.log('❌ Precisa de pelo menos 2 usuários para criar conversas!');
            return;
        }

        console.log(`📊 Encontrados ${users.length} usuários REAIS`);

        // Limpar conversas existentes
        console.log('\n🧹 Limpando conversas existentes...');
        await ChatMessage.deleteMany({});
        console.log('✅ Conversas limpas');

        // Criar conversas entre usuários REAIS
        console.log('\n💬 Criando conversas REAIS...');
        
        const conversations = [];
        const messages = [];
        
        // Criar conversa entre usuário 0 e usuário 1
        const user1 = users[0];
        const user2 = users[1];
        
        // Criar mensagens diretas entre usuários
        const msg1 = await ChatMessage.create({
            id: `message_${user1.id}_${user2.id}_${Date.now()}`,
            conversationId: `conversation_${user1.id}_${user2.id}`,
            senderId: user1.id,
            receiverId: user2.id,
            content: `Oi ${user2.name}! Como você está?`,
            messageType: 'text',
            sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
        });
        
        const msg2 = await ChatMessage.create({
            id: `message_${user2.id}_${user1.id}_${Date.now() + 1}`,
            conversationId: `conversation_${user1.id}_${user2.id}`,
            senderId: user2.id,
            receiverId: user1.id,
            content: `Olá ${user1.name}! Tudo ótimo, e com você?`,
            messageType: 'text',
            sentAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 horas atrás
            isRead: true,
            readAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hora atrás
        });
        
        const msg3 = await ChatMessage.create({
            id: `message_${user1.id}_${user2.id}_${Date.now() + 2}`,
            conversationId: `conversation_${user1.id}_${user2.id}`,
            senderId: user1.id,
            receiverId: user2.id,
            content: 'Estou bem também! Quer trocar uma ideia?',
            messageType: 'text',
            sentAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutos atrás
        });
        
        messages.push(msg1, msg2, msg3);
        
        // Se tiver 3+ usuários, criar mais conversas
        if (users.length >= 3) {
            const user3 = users[2];
            
            // Conversa entre usuário 0 e usuário 3
            const msg4 = await ChatMessage.create({
                id: `message_${user3.id}_${user1.id}_${Date.now() + 4}`,
                conversationId: `conversation_${user1.id}_${user3.id}`,
                senderId: user3.id,
                receiverId: user1.id,
                content: `E aí ${user1.name}! Beleza?`,
                messageType: 'text',
                sentAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutos atrás
            });
            
            messages.push(msg4);
            
            // Se tiver 4+ usuários, criar conversa entre usuário 2 e usuário 3
            if (users.length >= 4) {
                const user4 = users[3];
                
                const msg5 = await ChatMessage.create({
                    id: `message_${user4.id}_${user3.id}_${Date.now() + 6}`,
                    conversationId: `conversation_${user3.id}_${user4.id}`,
                    senderId: user4.id,
                    receiverId: user3.id,
                    content: 'Oi! Tudo bem?',
                    messageType: 'text',
                    sentAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutos atrás
                });
                
                messages.push(msg5);
            }
        }

        console.log(`✅ Criadas ${messages.length} mensagens REAIS`);

        // Mostrar estatísticas
        console.log('\n📊 Estatísticas finais:');
        console.log(`👥 Usuários REAIS: ${users.length}`);
        console.log(`📝 Mensagens REAIS: ${messages.length}`);

        // Mostrar mensagens criadas
        console.log('\n💬 Mensagens criadas:');
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const sender = users.find(u => u.id === msg.senderId);
            const receiver = users.find(u => u.id === msg.receiverId);
            
            console.log(`  ${i + 1}. ${sender?.name} → ${receiver?.name}: "${msg.content}"`);
        }

        console.log('\n🎉 Mensagens REAIS criadas com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao criar conversas:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar criação
createConversations();
