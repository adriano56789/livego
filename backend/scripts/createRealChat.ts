import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Chat, ChatMessage } from '../src/models/index';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const createRealChat = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Buscar usuários REAIS
        console.log('🔍 Buscando usuários REAIS...');
        const users = await User.find({});
        
        if (users.length < 2) {
            console.log('❌ Precisa de pelo menos 2 usuários para criar chats!');
            return;
        }

        console.log(`📊 Encontrados ${users.length} usuários REAIS`);

        // Limpar chats existentes
        console.log('\n🧹 Limpando chats existentes...');
        await Chat.deleteMany({});
        await ChatMessage.deleteMany({});
        console.log('✅ Chats e mensagens limpos');

        // Criar chats REAIS
        console.log('\n💬 Criando chats REAIS...');
        
        const chats = [];
        const messages = [];
        
        // Mensagens de exemplo realistas
        const sampleMessages = [
            'Oi! Tudo bem? 👋',
            'E aí! Beleza? 😊',
            'Como você está? 🤔',
            'Tudo certo por aqui! ✨',
            'Boa tarde! 🌅',
            'E aí, sumido! 👀',
            'Tudo joia? 🔥',
            'Opa! E aí? 🎉',
            'Fala aí! 🗣️',
            'Ei! Como vai? 💪',
            'Salve! 🤙',
            'Beleza? 🎯',
            'Tudo certo! 🎲',
            'Firmeza! 🚀'
        ];

        // Criar chat privado entre usuário 0 e usuário 1
        const user1 = users[0];
        const user2 = users[1];
        
        const privateChat1 = await Chat.create({
            id: `chat_private_${user1.id}_${user2.id}_${Date.now()}`,
            participants: [user1.id, user2.id],
            type: 'private',
            isActive: true
        });
        
        chats.push(privateChat1);
        
        // Adicionar mensagens para este chat
        for (let i = 0; i < 5; i++) {
            const isFromUser1 = i % 2 === 0;
            const sender = isFromUser1 ? user1 : user2;
            const receiver = isFromUser1 ? user2 : user1;
            const messageText = sampleMessages[i % sampleMessages.length];
            
            const message = await ChatMessage.create({
                id: `msg_${privateChat1.id}_${sender.id}_${Date.now()}_${i}`,
                conversationId: privateChat1.id,
                senderId: sender.id,
                receiverId: receiver.id,
                content: messageText,
                messageType: 'text',
                isRead: i < 3, // Mensagens mais antigas como lidas
                readAt: i < 3 ? new Date(Date.now() - (3-i) * 60 * 60 * 1000) : undefined,
                sentAt: new Date(Date.now() - (5-i) * 60 * 60 * 1000) // 5 horas atrás até agora
            });
            
            messages.push(message);
        }
        
        // Atualizar última mensagem do chat
        const lastMsg1 = messages[messages.length - 1];
        await Chat.findOneAndUpdate(
            { id: privateChat1.id },
            {
                lastMessage: {
                    content: lastMsg1.content,
                    senderId: lastMsg1.senderId,
                    timestamp: lastMsg1.sentAt,
                    messageType: lastMsg1.messageType
                }
            }
        );
        
        // Criar chat entre usuário 0 e usuário 2
        if (users.length >= 3) {
            const user3 = users[2];
            
            const privateChat2 = await Chat.create({
                id: `chat_private_${user1.id}_${user3.id}_${Date.now() + 1}`,
                participants: [user1.id, user3.id],
                type: 'private',
                isActive: true
            });
            
            chats.push(privateChat2);
            
            // Adicionar algumas mensagens
            for (let i = 0; i < 3; i++) {
                const isFromUser1 = i % 2 === 0;
                const sender = isFromUser1 ? user1 : user3;
                const receiver = isFromUser1 ? user3 : user1;
                const messageText = sampleMessages[(i + 5) % sampleMessages.length];
                
                const message = await ChatMessage.create({
                    id: `msg_${privateChat2.id}_${sender.id}_${Date.now()}_${i}`,
                    conversationId: privateChat2.id,
                    senderId: sender.id,
                    receiverId: receiver.id,
                    content: messageText,
                    messageType: 'text',
                    isRead: i < 1,
                    sentAt: new Date(Date.now() - (3-i) * 30 * 60 * 1000) // 3-30 minutos atrás
                });
                
                messages.push(message);
            }
            
            // Atualizar última mensagem
            const lastMsg2 = messages[messages.length - 1];
            await Chat.findOneAndUpdate(
                { id: privateChat2.id },
                {
                    lastMessage: {
                        content: lastMsg2.content,
                        senderId: lastMsg2.senderId,
                        timestamp: lastMsg2.sentAt,
                        messageType: lastMsg2.messageType
                    }
                }
            );
        }
        
        // Criar chat em grupo se tiver 3+ usuários
        if (users.length >= 3) {
            const groupChat = await Chat.create({
                id: `chat_group_${Date.now()}`,
                participants: users.map(u => u.id), // Todos no grupo
                type: 'group',
                title: 'Grupo Geral',
                isActive: true,
                metadata: {
                    groupId: 'group_general',
                    isPinned: true
                }
            });
            
            chats.push(groupChat);
            
            // Adicionar mensagens de grupo
            for (let i = 0; i < 4; i++) {
                const sender = users[i % users.length];
                const messageText = sampleMessages[(i + 10) % sampleMessages.length];
                
                const message = await ChatMessage.create({
                    id: `msg_${groupChat.id}_${sender.id}_${Date.now()}_${i}`,
                    conversationId: groupChat.id,
                    senderId: sender.id,
                    receiverId: sender.id, // Para mensagens de grupo, usar o próprio ID
                    content: `${sender.name}: ${messageText}`,
                    messageType: 'text',
                    isRead: true, // Mensagens de grupo sempre aparecem como lidas
                    sentAt: new Date(Date.now() - (4-i) * 45 * 60 * 1000) // 4-45 minutos atrás
                });
                
                messages.push(message);
            }
            
            // Atualizar última mensagem do grupo
            const lastMsgGroup = messages[messages.length - 1];
            await Chat.findOneAndUpdate(
                { id: groupChat.id },
                {
                    lastMessage: {
                        content: lastMsgGroup.content,
                        senderId: lastMsgGroup.senderId,
                        timestamp: lastMsgGroup.sentAt,
                        messageType: lastMsgGroup.messageType
                    }
                }
            );
        }

        console.log(`✅ Criados ${chats.length} chats REAIS`);
        console.log(`✅ Criadas ${messages.length} mensagens REAIS`);

        // Mostrar estatísticas
        console.log('\n📊 Estatísticas finais:');
        console.log(`👥 Usuários REAIS: ${users.length}`);
        console.log(`💬 Chats REAIS: ${chats.length}`);
        console.log(`📝 Mensagens REAIS: ${messages.length}`);

        // Mostrar chats criados
        console.log('\n💬 Chats criados:');
        for (let i = 0; i < chats.length; i++) {
            const chat = chats[i];
            const participantNames = chat.participants.map(pid => {
                const user = users.find(u => u.id === pid);
                return user?.name || pid;
            }).join(', ');
            
            const chatMessages = messages.filter((m: any) => m.conversationId === chat.id);
            console.log(`  ${i + 1}. ${chat.type === 'group' ? '👥 Grupo' : '👤 Privado'}: ${participantNames} (${chatMessages.length} mensagens)`);
            if (chat.title) {
                console.log(`     Título: ${chat.title}`);
            }
        }

        // Mostrar mensagens recentes
        console.log('\n📝 Mensagens recentes:');
        const recentMessages = messages
            .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
            .slice(0, 5);

        for (let i = 0; i < recentMessages.length; i++) {
            const msg = recentMessages[i];
            const sender = users.find(u => u.id === msg.senderId);
            const receiver = users.find(u => u.id === msg.receiverId);
            
            const timeStr = msg.sentAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const readStatus = msg.isRead ? '✅' : '📤';
            
            if (msg.receiverId) {
                console.log(`  ${i + 1}. ${timeStr} ${sender?.name} → ${receiver?.name}: ${msg.content} ${readStatus}`);
            } else {
                console.log(`  ${i + 1}. ${timeStr} ${sender?.name} (grupo): ${msg.content} ${readStatus}`);
            }
        }

        console.log('\n🎉 Sistema de chat criado com dados REAIS!');
        console.log('💡 Funcionalidades disponíveis:');
        console.log('  - GET /api/chats - Listar chats do usuário');
        console.log('  - GET /api/chats/:id/messages - Mensagens de um chat');
        console.log('  - POST /api/chats - Criar novo chat');
        console.log('  - POST /api/chats/:id/messages - Enviar mensagem');
        console.log('  - PUT /api/messages/:id/read - Marcar como lida');
        console.log('\n📱 O chat agora aparecerá no app quando clicar no ícone de bate-papo!');
        
    } catch (error) {
        console.error('❌ Erro ao criar chat:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar criação
createRealChat();
