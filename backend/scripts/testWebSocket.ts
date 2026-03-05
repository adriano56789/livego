import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Chat, ChatMessage } from '../src/models/index';
import { Server } from 'socket.io';
import { createServer } from 'http';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const testWebSocket = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Verificar dados existentes
        console.log('\n🔍 Verificando dados para teste...');
        
        const users = await User.find({});
        const chats = await Chat.find({});
        
        if (users.length < 2 || chats.length < 1) {
            console.log('❌ Dados insuficientes para teste WebSocket');
            console.log('   Execute: npm run ensure-real-data');
            return;
        }

        console.log(`📊 Encontrados: ${users.length} usuários, ${chats.length} chats`);

        // Criar servidor de teste WebSocket
        const app = require('express')();
        const httpServer = createServer(app);
        const io = new Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        // Simular eventos do WebSocket
        io.on('connection', (socket) => {
            console.log(`🔌 Cliente conectado: ${socket.id}`);

            // Evento de teste: enviar mensagem
            socket.on('test_send_message', async (data) => {
                try {
                    const { chatId, senderId, content } = data;
                    
                    console.log(`🧪 Testando envio de mensagem: ${senderId} -> ${chatId}`);
                    
                    // Verificar acesso ao chat
                    const chat = await Chat.findOne({ 
                        id: chatId, 
                        participants: senderId, 
                        isActive: true 
                    });
                    
                    if (!chat) {
                        socket.emit('error', { message: 'Chat não encontrado' });
                        return;
                    }

                    // Criar mensagem
                    const message = await ChatMessage.create({
                        id: `test_msg_${chatId}_${senderId}_${Date.now()}`,
                        conversationId: chatId,
                        senderId,
                        receiverId: chat.participants.find((p: any) => p !== senderId) || senderId,
                        content,
                        messageType: 'text',
                        isRead: false,
                        sentAt: new Date()
                    });

                    // Buscar detalhes do remetente
                    const sender = await User.findOne({ id: senderId }).select('id name avatarUrl');
                    
                    // Formatar mensagem
                    const formattedMessage = {
                        id: message.id,
                        conversationId: message.conversationId,
                        senderId: message.senderId,
                        receiverId: message.receiverId,
                        content: message.content,
                        messageType: message.messageType,
                        isRead: message.isRead,
                        sentAt: message.sentAt,
                        sender: sender || { id: senderId, name: 'Usuário', avatarUrl: '' }
                    };

                    // Enviar para todos os participantes
                    chat.participants.forEach((participantId: string) => {
                        io.to(`user_${participantId}`).emit('new_chat_message', formattedMessage);
                        
                        // Enviar notificação se não for o remetente
                        if (participantId !== senderId) {
                            io.to(`user_${participantId}`).emit('chat_notification', {
                                type: 'new_message',
                                chatId,
                                message: formattedMessage,
                                sender: sender,
                                timestamp: new Date()
                            });
                        }
                    });

                    console.log(`✅ Mensagem de teste enviada: ${content}`);
                    socket.emit('test_message_sent', formattedMessage);
                    
                } catch (error) {
                    console.error('❌ Erro no teste:', error);
                    socket.emit('error', { message: 'Erro no teste' });
                }
            });

            // Evento de teste: entrar no chat
            socket.on('test_join_chat', async (data) => {
                try {
                    const { userId, chatId } = data;
                    
                    console.log(`🧪 Testando entrada no chat: ${userId} -> ${chatId}`);
                    
                    // Verificar acesso
                    const chat = await Chat.findOne({ 
                        id: chatId, 
                        participants: userId, 
                        isActive: true 
                    });
                    
                    if (!chat) {
                        socket.emit('error', { message: 'Chat não encontrado' });
                        return;
                    }

                    // Entrar nas salas
                    socket.join(`user_${userId}`);
                    socket.join(`chat_${chatId}`);
                    
                    console.log(`✅ Usuário entrou no chat`);
                    socket.emit('test_joined_chat', { userId, chatId });
                    
                } catch (error) {
                    console.error('❌ Erro no teste:', error);
                    socket.emit('error', { message: 'Erro no teste' });
                }
            });

            // Evento de teste: marcar como lida
            socket.on('test_mark_read', async (data) => {
                try {
                    const { messageId, userId } = data;
                    
                    console.log(`🧪 Testando marcar como lida: ${messageId} por ${userId}`);
                    
                    const message = await ChatMessage.findOne({ 
                        id: messageId,
                        receiverId: userId 
                    });
                    
                    if (!message) {
                        socket.emit('error', { message: 'Mensagem não encontrada' });
                        return;
                    }

                    // Marcar como lida
                    await ChatMessage.findOneAndUpdate(
                        { id: messageId },
                        { isRead: true, readAt: new Date() }
                    );

                    console.log(`✅ Mensagem marcada como lida`);
                    socket.emit('test_message_read', { messageId, userId });
                    
                } catch (error) {
                    console.error('❌ Erro no teste:', error);
                    socket.emit('error', { message: 'Erro no teste' });
                }
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Cliente desconectado: ${socket.id}`);
            });
        });

        // Iniciar servidor de teste
        const PORT = 3001; // Porta diferente para não conflitar
        httpServer.listen(PORT, () => {
            console.log(`🧪 Servidor de teste WebSocket rodando na porta ${PORT}`);
            console.log(`📗 URL: http://localhost:${PORT}`);
        });

        // Mostrar exemplos de uso
        console.log('\n📋 Exemplos para testar no frontend:');
        console.log('```javascript');
        console.log('// Conectar ao WebSocket de teste');
        console.log('const socket = io("http://localhost:3001");');
        console.log('');
        console.log('// Entrar em um chat');
        console.log('socket.emit("test_join_chat", {');
        console.log('  userId: "10755083",');
        console.log('  chatId: "chat_private_10755083_87654321_1772558557783"');
        console.log('});');
        console.log('');
        console.log('// Enviar mensagem');
        console.log('socket.emit("test_send_message", {');
        console.log('  chatId: "chat_private_10755083_87654321_1772558557783",');
        console.log('  senderId: "10755083",');
        console.log('  content: "Mensagem de teste WebSocket!"');
        console.log('});');
        console.log('');
        console.log('// Ouvir novas mensagens');
        console.log('socket.on("new_chat_message", (message) => {');
        console.log('  console.log("Nova mensagem:", message);');
        console.log('});');
        console.log('');
        console.log('// Ouvir notificações');
        console.log('socket.on("chat_notification", (notification) => {');
        console.log('  console.log("Notificação:", notification);');
        console.log('});');
        console.log('```');

        console.log('\n🎉 TESTE WEBSOCKET INICIADO!');
        console.log('💡 Use os exemplos acima para testar as notificações em tempo real');
        console.log('🔄 As mensagens aparecerão como notificação instantânea!');
        
        // Manter servidor rodando
        process.on('SIGINT', () => {
            console.log('\n🔌 Encerrando servidor de teste...');
            httpServer.close();
            mongoose.disconnect();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Erro ao testar WebSocket:', error);
        await mongoose.disconnect();
    }
};

// Executar teste
testWebSocket();
