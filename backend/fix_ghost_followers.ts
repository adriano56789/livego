import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '.env') });

import { User } from './src/models/User';
import { Follow } from './src/models/Follow';
import { Friendship } from './src/models/Friendship';
import { Followers } from './src/models/Followers';

async function cleanup() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/livego';
        console.log(`Conectando ao MongoDB: ${mongoUri}`);
        await mongoose.connect(mongoUri);
        console.log('Conectado ao MongoDB');

        // 1. Pegar todos os IDs de usuários reais
        const allUsers = await User.find({}, 'id');
        const validUserIds = new Set(allUsers.map(u => u.id));
        console.log(`Total de usuários válidos encontrados: ${validUserIds.size}`);

        // 2. Limpar a collection Follow
        const followsToDelete = await Follow.find({
            $or: [
                { followerId: { $nin: Array.from(validUserIds) } },
                { followingId: { $nin: Array.from(validUserIds) } }
            ]
        });
        if (followsToDelete.length > 0) {
            console.log(`Deletando ${followsToDelete.length} registros fantasmas da collection Follow...`);
            await Follow.deleteMany({
                _id: { $in: followsToDelete.map(f => f._id) }
            });
        }

        // 3. Limpar a collection Followers
        const followersToDelete = await Followers.find({
            $or: [
                { followerId: { $nin: Array.from(validUserIds) } },
                { followingId: { $nin: Array.from(validUserIds) } }
            ]
        });
        if (followersToDelete.length > 0) {
            console.log(`Deletando ${followersToDelete.length} registros fantasmas da collection Followers...`);
            await Followers.deleteMany({
                _id: { $in: followersToDelete.map(f => f._id) }
            });
        }

        // 4. Limpar a collection Friendship
        const friendshipsToDelete = await Friendship.find({
            $or: [
                { userId1: { $nin: Array.from(validUserIds) } },
                { userId2: { $nin: Array.from(validUserIds) } }
            ]
        });
        if (friendshipsToDelete.length > 0) {
            console.log(`Deletando ${friendshipsToDelete.length} amizades fantasmas da collection Friendship...`);
            await Friendship.deleteMany({
                _id: { $in: friendshipsToDelete.map(f => f._id) }
            });
        }

        // 5. Corrigir os arrays e contadores de cada usuário
        const users = await User.find({});
        for (const user of users) {
            let changed = false;

            // Limpar followingList
            const originalFollowingCount = user.followingList?.length || 0;
            user.followingList = (user.followingList || []).filter(id => validUserIds.has(id));
            if (user.followingList.length !== originalFollowingCount) changed = true;

            // Limpar followersList
            const originalFollowersCount = user.followersList?.length || 0;
            user.followersList = (user.followersList || []).filter(id => validUserIds.has(id));
            if (user.followersList.length !== originalFollowersCount) changed = true;

            // Limpar friendsList
            const originalFriendsCount = user.friendsList?.length || 0;
            user.friendsList = (user.friendsList || []).filter(id => validUserIds.has(id));
            if (user.friendsList.length !== originalFriendsCount) changed = true;

            // Recalcular os números baseados nos arrays limpos
            const trueFollowingCount = user.followingList.length;
            const trueFansCount = user.followersList.length;

            if (user.following !== trueFollowingCount) {
                console.log(`Corrigindo following do usuário ${user.id} (${user.name}): ${user.following} -> ${trueFollowingCount}`);
                user.following = trueFollowingCount;
                changed = true;
            }

            if (user.fans !== trueFansCount) {
                console.log(`Corrigindo fans do usuário ${user.id} (${user.name}): ${user.fans} -> ${trueFansCount}`);
                user.fans = trueFansCount;
                changed = true;
            }

            if (changed) {
                await user.save();
                console.log(`Usuário ${user.id} (${user.name}) atualizado.`);
            }
        }

        console.log('Limpeza concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro na limpeza:', error);
        process.exit(1);
    }
}

cleanup();
