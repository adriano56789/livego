import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Follow, Friendship } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const importRealData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Buscar usuários REAIS que já existem
        console.log('🔍 Buscando usuários REAIS no banco...');
        const realUsers = await User.find({}).select('id name');
        
        if (realUsers.length < 2) {
            console.log('❌ Precisa de pelo menos 2 usuários reais no banco!');
            return;
        }
        
        console.log(`✅ Encontrados ${realUsers.length} usuários REAIS:`);
        realUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} (ID: ${user.id})`);
        });

        // Limpar coleções existentes
        console.log('\n🧹 Limpando coleções de follows/amizades...');
        await Follow.deleteMany({});
        await Friendship.deleteMany({});

        // Criar follows REAIS entre os usuários existentes
        console.log('\n📥 Criando follows REAIS...');
        
        const follows = [];
        
        // Usuário 0 segue Usuário 1
        follows.push({
            id: `follow_${realUsers[0].id}_${realUsers[1].id}_${Date.now()}`,
            followerId: realUsers[0].id,
            followingId: realUsers[1].id,
            followedAt: new Date(),
            isActive: true
        });

        // Usuário 1 segue Usuário 0 (amizade recíproca)
        follows.push({
            id: `follow_${realUsers[1].id}_${realUsers[0].id}_${Date.now() + 1}`,
            followerId: realUsers[1].id,
            followingId: realUsers[0].id,
            followedAt: new Date(),
            isActive: true
        });

        // Se tiver 3+ usuários, criar mais follows
        if (realUsers.length >= 3) {
            // Usuário 0 segue Usuário 2
            follows.push({
                id: `follow_${realUsers[0].id}_${realUsers[2].id}_${Date.now() + 2}`,
                followerId: realUsers[0].id,
                followingId: realUsers[2].id,
                followedAt: new Date(),
                isActive: true
            });
        }

        await Follow.insertMany(follows);
        console.log(`✅ ${follows.length} follows REAIS criados`);

        // Criar amizades REAIS (follow recíproco)
        console.log('\n🤝 Criando amizades REAIS...');
        
        const friendships = [];
        
        // Usuário 0 e Usuário 1 são amigos (follow recíproco)
        friendships.push({
            id: `friendship_${realUsers[0].id}_${realUsers[1].id}_${Date.now()}`,
            userId1: realUsers[0].id,
            userId2: realUsers[1].id,
            initiatedBy: realUsers[1].id,
            friendshipStartedAt: new Date(),
            isActive: true
        });

        await Friendship.insertMany(friendships);
        console.log(`✅ ${friendships.length} amizades REAIS criadas`);

        // Atualizar contadores dos usuários REAIS
        console.log('\n🔄 Atualizando contadores dos usuários REAIS...');
        
        // Atualizar Usuário 0
        await User.findOneAndUpdate(
            { id: realUsers[0].id },
            { 
                $set: { 
                    following: realUsers.length >= 3 ? 2 : 1,
                    fans: 1,
                    followingList: realUsers.length >= 3 ? [realUsers[1].id, realUsers[2].id] : [realUsers[1].id],
                    followersList: [realUsers[1].id],
                    friendsList: [realUsers[1].id]
                }
            }
        );

        // Atualizar Usuário 1
        await User.findOneAndUpdate(
            { id: realUsers[1].id },
            { 
                $set: { 
                    following: 1,
                    fans: 1,
                    followingList: [realUsers[0].id],
                    followersList: [realUsers[0].id],
                    friendsList: [realUsers[0].id]
                }
            }
        );

        // Atualizar Usuário 2 (se existir)
        if (realUsers.length >= 3) {
            await User.findOneAndUpdate(
                { id: realUsers[2].id },
                { 
                    $set: { 
                        fans: 1,
                        followersList: [realUsers[0].id]
                    }
                }
            );
        }

        console.log('✅ Contadores atualizados com dados REAIS');

        // Mostrar resultado
        console.log('\n📊 Resultado - Dados REAIS importados:');
        console.log(`👥 ${realUsers[0].name} segue: ${realUsers.length >= 3 ? realUsers[1].name + ', ' + realUsers[2].name : realUsers[1].name}`);
        console.log(`👥 ${realUsers[1].name} segue: ${realUsers[0].name} (amizade!)`);
        if (realUsers.length >= 3) {
            console.log(`👥 ${realUsers[2].name} é seguido por: ${realUsers[0].name}`);
        }

        console.log('\n🎉 Importação de DADOS REAIS concluída!');
        
    } catch (error) {
        console.error('❌ Erro na importação:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar importação
importRealData();
