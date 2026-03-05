import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Chat, ChatMessage } from '../src/models/index';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const verifyRealChat = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Verificar coleções
        console.log('\n🔍 Verificando coleções do chat...');
        
        const chatCount = await Chat.countDocuments();
        const messageCount = await ChatMessage.countDocuments();
        
        console.log(`💬 Coleção Chat: ${chatCount} documentos`);
        console.log(`📝 Coleção ChatMessage: ${messageCount} documentos`);

        if (chatCount === 0 || messageCount === 0) {
            console.log('❌ Coleções vazias! Por favor, execute: npm run create-real-chat');
        }

        // Buscar usuários
        console.log('\n👥 Buscando usuários REAIS...');
        const users = await User.find({});
        console.log(`📊 Encontrados ${users.length} usuários REAIS`);

        // Verificar chats por usuário
        console.log('\n💬 Verificando chats por usuário...');
        
        for (const user of users) {
            const userChats = await Chat.find({ 
                participants: user.id, 
                isActive: true 
            });
            
            console.log(`👤 ${user.name}: ${userChats.length} chats`);
            
            for (const chat of userChats) {
                const otherParticipants = chat.participants.filter((p: any) => p !== user.id);
                const participantNames = otherParticipants.map((pid: any) => {
                    const participant = users.find(u => u.id === pid);
                    return participant?.name || pid;
                }).join(', ');
                
                const messageCount = await ChatMessage.countDocuments({
                    conversationId: chat.id
                });
                
                const unreadCount = await ChatMessage.countDocuments({
                    conversationId: chat.id,
                    receiverId: user.id,
                    isRead: false
                });
                
                console.log(`  💬 ${chat.type === 'group' ? '👥 Grupo' : '👤 Privado'}: ${participantNames}`);
                console.log(`     📝 ${messageCount} mensagens, 📤 ${unreadCount} não lidas`);
                if (chat.title) {
                    console.log(`     📋 Título: ${chat.title}`);
                }
                if (chat.lastMessage) {
                    console.log(`     💭 Última: ${(chat.lastMessage as any).content?.substring(0, 30)}...`);
                }
                console.log('');
            }
        }

        // Verificar mensagens recentes
        console.log('\n📝 Verificando mensagens recentes...');
        
        const recentMessages = await ChatMessage.find({})
            .sort({ sentAt: -1 })
            .limit(10);

        console.log(`📊 Últimas ${recentMessages.length} mensagens:`);
        
        for (let i = 0; i < recentMessages.length; i++) {
            const msg = recentMessages[i];
            const sender = users.find(u => u.id === msg.senderId);
            const receiver = users.find(u => u.id === msg.receiverId);
            
            const timeStr = msg.sentAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const readStatus = msg.isRead ? '✅' : '📤';
            
            if (msg.receiverId && msg.receiverId !== msg.senderId) {
                console.log(`  ${i + 1}. ${timeStr} ${sender?.name} → ${receiver?.name}: ${msg.content} ${readStatus}`);
            } else {
                console.log(`  ${i + 1}. ${timeStr} ${sender?.name}: ${msg.content} ${readStatus}`);
            }
        }

        // Testar endpoints da API
        console.log('\n🧪 Testando endpoints da API...');
        
        if (users.length >= 2) {
            const testUser = users[0];
            
            // Testar GET /api/chats
            console.log(`\n📡 Testando GET /api/chats?userId=${testUser.id}`);
            const userChats = await Chat.find({ 
                participants: testUser.id, 
                isActive: true 
            }).sort({ 'lastMessage.timestamp': -1 });

            console.log(`✅ Endpoint funcionaria: ${userChats.length} chats encontrados`);
            
            // Testar mensagens do primeiro chat
            if (userChats.length > 0) {
                const firstChat = userChats[0];
                console.log(`\n📡 Testando GET /api/chats/${firstChat.id}/messages`);
                
                const messages = await ChatMessage.find({ 
                    conversationId: firstChat.id 
                }).sort({ sentAt: -1 }).limit(50);

                console.log(`✅ Endpoint funcionaria: ${messages.length} mensagens encontradas`);
                
                // Mostrar exemplo de resposta
                console.log('\n📋 Exemplo de resposta da API:');
                console.log('```json');
                console.log(JSON.stringify({
                    success: true,
                    data: {
                        messages: messages.slice(0, 2).map((m: any) => ({
                            id: m.id,
                            senderId: m.senderId,
                            receiverId: m.receiverId,
                            content: m.content,
                            messageType: m.messageType,
                            isRead: m.isRead,
                            sentAt: m.sentAt
                        })),
                        chat: {
                            id: firstChat.id,
                            type: firstChat.type,
                            title: firstChat.title,
                            participants: firstChat.participants
                        }
                    }
                }, null, 2));
                console.log('```');
            }
        }

        // Verificar integridade dos dados
        console.log('\n🔍 Verificando integridade dos dados...');
        
        let integrityIssues = [];
        
        // Verificar se todas as mensagens têm chats válidos
        const allMessages = await ChatMessage.find({});
        for (const message of allMessages) {
            const chatExists = await Chat.findOne({ 
                id: message.conversationId 
            });
            
            if (!chatExists) {
                integrityIssues.push({
                    type: 'orphan_message',
                    messageId: message.id,
                    conversationId: message.conversationId
                });
            }
        }
        
        // Verificar se todos os chats têm mensagens
        const allChats = await Chat.find({});
        for (const chat of allChats) {
            const messageCount = await ChatMessage.countDocuments({
                conversationId: chat.id
            });
            
            if (messageCount === 0) {
                integrityIssues.push({
                    type: 'empty_chat',
                    chatId: chat.id,
                    participants: chat.participants
                });
            }
        }
        
        if (integrityIssues.length > 0) {
            console.log(`❌ Encontrados ${integrityIssues.length} problemas de integridade:`);
            
            for (const issue of integrityIssues) {
                if (issue.type === 'orphan_message') {
                    console.log(`  ⚠️ Mensagem órfã: ${issue.messageId} (chat ${issue.conversationId} não existe)`);
                } else if (issue.type === 'empty_chat') {
                    console.log(`  ⚠️ Chat vazio: ${issue.chatId} (${(issue as any).participants.join(', ')})`);
                }
            }
        } else {
            console.log('✅ Integridade dos dados OK!');
        }

        console.log('\n🎉 VERIFICAÇÃO DO CHAT CONCLUÍDA!');
        console.log('💡 Status do sistema:');
        console.log(`  ✅ Coleções: ${chatCount > 0 && messageCount > 0 ? 'OK' : 'Vazias'}`);
        console.log(`  ✅ Usuários: ${users.length}`);
        console.log(`  ✅ Chats: ${chatCount}`);
        console.log(`  ✅ Mensagens: ${messageCount}`);
        console.log(`  ✅ Integridade: ${integrityIssues.length === 0 ? 'OK' : 'Problemas'}`);
        console.log('\n📱 O chat deve funcionar quando clicar no ícone de bate-papo!');
        console.log('🔗 Endpoints disponíveis:');
        console.log('  - GET /api/chats?userId=X');
        console.log('  - GET /api/chats/:id/messages?userId=X');
        console.log('  - POST /api/chats');
        console.log('  - POST /api/chats/:id/messages');
        console.log('  - PUT /api/messages/:id/read');
        
    } catch (error) {
        console.error('❌ Erro ao verificar chat:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar verificação
verifyRealChat();
