import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Comment, ChatMessage } from '../src/models/index';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const createComments = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Buscar usuários REAIS
        console.log('🔍 Buscando usuários REAIS...');
        const users = await User.find({});
        
        if (users.length < 2) {
            console.log('❌ Precisa de pelo menos 2 usuários para criar comentários!');
            return;
        }

        console.log(`📊 Encontrados ${users.length} usuários REAIS`);

        // Buscar mensagens existentes para comentar
        console.log('\n🔍 Buscando mensagens para comentar...');
        const messages = await ChatMessage.find({});
        console.log(`📝 Encontradas ${messages.length} mensagens`);

        // Limpar comentários existentes
        console.log('\n🧹 Limpando comentários existentes...');
        await Comment.deleteMany({});
        console.log('✅ Comentários limpos');

        // Criar comentários REAIS
        console.log('\n💬 Criando comentários REAIS...');
        
        const comments = [];
        
        // Comentários de exemplo realistas
        const sampleComments = [
            'Que legal! 👏',
            'Amei isso! ❤️',
            'Muito bom! 🔥',
            'Parabéns! 🎉',
            'Incrível! ✨',
            'Perfeito! ⭐',
            'Sensacional! 🚀',
            'Maravilhoso! 💯',
            'Excelente! 👍',
            'Fantástico! 🌟',
            'Show! 🎭',
            'Top! 🏆',
            'Legal! 😊',
            'Bom! 👌',
            'Ótimo! 💪'
        ];

        // Criar comentários para mensagens
        if (messages.length > 0) {
            for (let i = 0; i < messages.length && i < 10; i++) {
                const message = messages[i];
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
                
                const comment = await Comment.create({
                    id: `comment_msg_${message.id}_${randomUser.id}_${Date.now()}_${i}`,
                    userId: randomUser.id,
                    targetId: message.id,
                    targetType: 'message',
                    content: randomComment,
                    likes: Math.floor(Math.random() * 10),
                    isActive: true
                });
                
                comments.push(comment);
                
                // Adicionar algumas respostas
                if (Math.random() > 0.5 && comments.length > 0) {
                    const replyUser = users[Math.floor(Math.random() * users.length)];
                    const replyComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
                    
                    const reply = await Comment.create({
                        id: `reply_msg_${message.id}_${replyUser.id}_${Date.now()}_${i}_reply`,
                        userId: replyUser.id,
                        targetId: message.id,
                        targetType: 'message',
                        content: replyComment,
                        parentId: comment.id,
                        likes: Math.floor(Math.random() * 5),
                        isActive: true
                    });
                    
                    comments.push(reply);
                }
            }
        }

        // Criar comentários para perfis de usuários
        for (let i = 0; i < users.length && i < 8; i++) {
            const targetUser = users[i];
            const commenterUser = users[Math.floor(Math.random() * users.length)];
            
            // Evitar que usuário comente no próprio perfil
            if (commenterUser.id === targetUser.id) continue;
            
            const profileComments = [
                `Ótimo perfil, ${targetUser.name}! 👏`,
                `${targetUser.name}, você é incrível! 🔥`,
                `Parabéns pelo conteúdo! 🎉`,
                `Continue assim! 💪`,
                `Adorei seu perfil! ❤️`
            ];
            
            const randomProfileComment = profileComments[Math.floor(Math.random() * profileComments.length)];
            
            const profileComment = await Comment.create({
                id: `comment_profile_${targetUser.id}_${commenterUser.id}_${Date.now()}_${i}`,
                userId: commenterUser.id,
                targetId: targetUser.id,
                targetType: 'profile',
                content: randomProfileComment,
                likes: Math.floor(Math.random() * 15),
                isActive: true
            });
            
            comments.push(profileComment);
        }

        // Criar comentários para streams (simulados)
        const streamIds = ['stream_1', 'stream_2', 'stream_3'];
        for (let i = 0; i < streamIds.length; i++) {
            const streamId = streamIds[i];
            
            // Criar múltiplos comentários para cada stream
            for (let j = 0; j < 5; j++) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const streamComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
                
                const streamCommentDoc = await Comment.create({
                    id: `comment_stream_${streamId}_${randomUser.id}_${Date.now()}_${j}`,
                    userId: randomUser.id,
                    targetId: streamId,
                    targetType: 'stream',
                    content: streamComment,
                    likes: Math.floor(Math.random() * 8),
                    isActive: true
                });
                
                comments.push(streamCommentDoc);
            }
        }

        console.log(`✅ Criados ${comments.length} comentários REAIS`);

        // Mostrar estatísticas
        console.log('\n📊 Estatísticas finais:');
        console.log(`👥 Usuários REAIS: ${users.length}`);
        console.log(`📝 Mensagens: ${messages.length}`);
        console.log(`💬 Comentários REAIS: ${comments.length}`);

        // Contar comentários por tipo
        const commentsByType = comments.reduce((acc, comment) => {
            acc[comment.targetType] = (acc[comment.targetType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log('\n📈 Comentários por tipo:');
        Object.entries(commentsByType).forEach(([type, count]) => {
            console.log(`  ${type}: ${count} comentários`);
        });

        // Mostrar comentários mais curtidos
        console.log('\n🔥 Comentários mais curtidos:');
        const topComments = comments
            .sort((a, b) => b.likes - a.likes)
            .slice(0, 5);

        for (let i = 0; i < topComments.length; i++) {
            const comment = topComments[i];
            const user = users.find(u => u.id === comment.userId);
            console.log(`  ${i + 1}. ${user?.name}: "${comment.content}" (${comment.likes} likes)`);
        }

        // Mostrar comentários com respostas
        const commentsWithReplies = comments.filter(c => c.parentId);
        console.log(`\n💬 Respostas: ${commentsWithReplies.length} comentários`);

        console.log('\n🎉 Sistema de comentários criado com dados REAIS!');
        console.log('💡 Funcionalidades disponíveis:');
        console.log('  - GET /api/comments/:targetId/:targetType - Listar comentários');
        console.log('  - POST /api/comments - Criar comentário');
        console.log('  - PUT /api/comments/:id/like - Curtir/descurtir comentário');
        console.log('  - DELETE /api/comments/:id - Deletar comentário');
        console.log('  - GET /api/users/:userId/comments - Comentários do usuário');
        
    } catch (error) {
        console.error('❌ Erro ao criar comentários:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar criação
createComments();
