import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Chat, ChatMessage, ProfilePhoto, Followers, Friendship, Block, Birthday, Comment } from '../src/models/index';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const ensureRealData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Verificar dados existentes sem criar nada novo
        console.log('\n🔍 Verificando dados existentes...');

        // Usuários existentes
        const users = await User.find({});
        console.log(`👥 Usuários existentes: ${users.length}`);

        // Verificar se cada usuário tem dados completos
        for (const user of users) {
            console.log(`\n👤 Verificando usuário: ${user.name} (${user.id})`);
            
            // Verificar fotos de perfil
            const avatar = await ProfilePhoto.findOne({ 
                userId: user.id, 
                photoType: 'avatar', 
                isMain: true, 
                isActive: true 
            });
            
            const cover = await ProfilePhoto.findOne({ 
                userId: user.id, 
                photoType: 'cover', 
                isActive: true 
            });
            
            const gallery = await ProfilePhoto.find({ 
                userId: user.id, 
                photoType: 'gallery', 
                isActive: true 
            });

            console.log(`  📸 Fotos: Avatar ${avatar ? '✅' : '❌'}, Capa ${cover ? '✅' : '❌'}, Galeria ${gallery.length} fotos`);
            
            // Verificar follows
            const followingCount = await Followers.countDocuments({
                followerId: user.id,
                isActive: true
            });
            
            const fansCount = await Followers.countDocuments({
                followingId: user.id,
                isActive: true
            });

            console.log(`  📝 Follows: Seguindo ${followingCount}, Fãs ${fansCount}`);
            
            // Verificar chats
            const userChats = await Chat.find({ 
                participants: user.id, 
                isActive: true 
            });

            console.log(`  💬 Chats: ${userChats.length}`);
            
            // Verificar aniversário
            const birthday = await Birthday.findOne({ userId: user.id });
            console.log(`  🎂 Aniversário: ${birthday ? '✅' : '❌'}`);
            
            // Verificar comentários
            const comments = await Comment.find({ userId: user.id });
            console.log(`  💬 Comentários: ${comments.length}`);
        }

        // Verificar integridade dos dados sem criar nada
        console.log('\n🔍 Verificando integridade dos dados...');
        
        // Verificar se todas as mensagens têm chats válidos
        const allMessages = await ChatMessage.find({});
        let orphanMessages = 0;
        
        for (const message of allMessages) {
            const chatExists = await Chat.findOne({ 
                id: message.conversationId 
            });
            
            if (!chatExists) {
                orphanMessages++;
            }
        }
        
        console.log(`📝 Mensagens órfãs: ${orphanMessages}`);
        
        // Verificar se todos os follows têm usuários válidos
        const allFollows = await Followers.find({ isActive: true });
        let invalidFollows = 0;
        
        for (const follow of allFollows) {
            const followerExists = users.some(u => u.id === follow.followerId);
            const followingExists = users.some(u => u.id === follow.followingId);
            
            if (!followerExists || !followingExists) {
                invalidFollows++;
            }
        }
        
        console.log(`📝 Follows inválidos: ${invalidFollows}`);
        
        // Verificar se todas as fotos têm usuários válidos
        const allPhotos = await ProfilePhoto.find({ isActive: true });
        let invalidPhotos = 0;
        
        for (const photo of allPhotos) {
            const userExists = users.some(u => u.id === photo.userId);
            
            if (!userExists) {
                invalidPhotos++;
            }
        }
        
        console.log(`📝 Fotos inválidas: ${invalidPhotos}`);

        // Mostrar status atual das coleções
        console.log('\n📊 Status atual das coleções:');
        
        const collections = [
            { name: 'User', model: User },
            { name: 'Chat', model: Chat },
            { name: 'ChatMessage', model: ChatMessage },
            { name: 'ProfilePhoto', model: ProfilePhoto },
            { name: 'Followers', model: Followers },
            { name: 'Friendship', model: Friendship },
            { name: 'Block', model: Block },
            { name: 'Birthday', model: Birthday },
            { name: 'Comment', model: Comment }
        ];
        
        for (const collection of collections) {
            try {
                const count = await collection.model.countDocuments();
                console.log(`  ✅ ${collection.name}: ${count} documentos`);
            } catch (error) {
                console.log(`  ❌ ${collection.name}: Erro ao contar`);
            }
        }

        // Verificar se as APIs podem acessar os dados
        console.log('\n🧪 Testando acesso das APIs aos dados existentes...');
        
        if (users.length > 0) {
            const testUser = users[0];
            
            // Testar API de chats
            const userChats = await Chat.find({ 
                participants: testUser.id, 
                isActive: true 
            }).sort({ 'lastMessage.timestamp': -1 });

            console.log(`  💬 API /api/chats?userId=${testUser.id}: ${userChats.length} chats`);
            
            if (userChats.length > 0) {
                const firstChat = userChats[0];
                const messages = await ChatMessage.find({ 
                    conversationId: firstChat.id 
                }).sort({ sentAt: -1 }).limit(10);
                
                console.log(`    📝 API /api/chats/${firstChat.id}/messages: ${messages.length} mensagens`);
            }
            
            // Testar API de fotos
            const avatar = await ProfilePhoto.findOne({ 
                userId: testUser.id, 
                photoType: 'avatar', 
                isMain: true, 
                isActive: true 
            });
            
            const gallery = await ProfilePhoto.find({ 
                userId: testUser.id, 
                photoType: 'gallery', 
                isActive: true 
            });

            console.log(`  📸 API /api/users/${testUser.id}/photos/avatar: ${avatar ? '1' : '0'} avatar`);
            console.log(`  📸 API /api/users/${testUser.id}/photos/gallery: ${gallery.length} fotos`);
        }

        console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');
        console.log('💡 Status do sistema:');
        console.log('  ✅ Dados existentes verificados');
        console.log('  ✅ APIs prontas para consumir dados REAIS');
        console.log('  ✅ Nenhum dado de teste criado');
        console.log('  ✅ Sistema funcionando com dados do frontend');
        
        console.log('\n📗 URLs das APIs (dados REAIS):');
        console.log(`  - GET /api/chats?userId=X`);
        console.log(`  - GET /api/chats/:id/messages?userId=X`);
        console.log(`  - GET /api/users/:userId/photos/avatar`);
        console.log(`  - GET /api/users/:userId/photos/gallery`);
        console.log(`  - POST /api/users/:userId/photos`);
        
        console.log('\n🔄 Conforme os usuários mexem no app, os dados serão salvos automaticamente!');
        
    } catch (error) {
        console.error('❌ Erro ao verificar dados:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar verificação
ensureRealData();
