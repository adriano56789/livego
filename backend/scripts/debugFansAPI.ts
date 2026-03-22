import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Followers } from '../src/models';
import { User } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const debugFansAPI = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        const userId = '65384127';
        
        console.log(`\n🔍 Debug completo da API de FANS para usuário: ${userId}`);
        
        // 1. Verificar follows ativos onde este usuário é seguido
        console.log('\n📊 Passo 1: Buscando follows ativos...');
        const follows = await Followers.find({
            followingId: userId,
            isActive: true
        });
        
        console.log(`- Follows encontrados: ${follows.length}`);
        
        if (follows.length === 0) {
            console.log('❌ Nenhum follow encontrado - problema aqui!');
            return;
        }
        
        // 2. Extrair IDs dos seguidores
        const followerIds = follows.map((follow: any) => follow.followerId);
        console.log(`\n📊 Passo 2: IDs dos seguidores: [${followerIds.join(', ')}]`);
        
        // 3. Buscar dados completos dos seguidores (exatamente como a API faz)
        console.log('\n📊 Passo 3: Buscando dados completos...');
        const fans = await User.find({
            id: { $in: followerIds }
        }).select('id name avatarUrl level fans following isLive isOnline lastSeen');
        
        console.log(`- Usuários encontrados: ${fans.length}`);
        
        if (fans.length === 0) {
            console.log('❌ Nenhum usuário encontrado - problema nos dados!');
            
            // Debug: verificar cada ID individualmente
            console.log('\n🔍 Verificando cada ID individualmente:');
            for (const followerId of followerIds) {
                const user = await User.findOne({ id: followerId });
                console.log(`- ${followerId}: ${user ? '✅ Encontrado' : '❌ Não encontrado'}`);
                if (user) {
                    console.log(`  • Nome: "${user.name}"`);
                    console.log(`  • Avatar: "${user.avatarUrl || 'N/A'}"`);
                    console.log(`  • Level: ${user.level || 'N/A'}`);
                    console.log(`  • Campos: ${Object.keys(user.toObject()).join(', ')}`);
                } else {
                    // Verificar se há usuários com IDs similares
                    const similarUsers = await User.find({
                        $or: [
                            { id: { $regex: followerId, $options: 'i' } },
                            { name: { $regex: followerId, $options: 'i' } }
                        ]
                    }).limit(5);
                    if (similarUsers.length > 0) {
                        console.log(`  • Usuários similares encontrados:`);
                        similarUsers.forEach(u => console.log(`    - ${u.id}: ${u.name}`));
                    }
                }
            }
        } else {
            console.log('\n✅ Usuários encontrados:');
            fans.forEach(fan => {
                console.log(`  • ID: ${fan.id}`);
                console.log(`  • Nome: "${fan.name}"`);
                console.log(`  • Avatar: "${fan.avatarUrl || 'N/A'}"`);
                console.log(`  • Level: ${fan.level || 'N/A'}`);
                console.log(`  • isLive: ${fan.isLive}`);
                console.log(`  • isOnline: ${fan.isOnline}`);
                console.log('');
            });
            
            // 4. Simular resposta JSON da API
            console.log('📡 Resposta JSON que a API retornaria:');
            const jsonResponse = fans.map(fan => ({
                id: fan.id,
                name: fan.name,
                avatarUrl: fan.avatarUrl,
                level: fan.level,
                fans: fan.fans,
                following: fan.following,
                isLive: fan.isLive,
                isOnline: fan.isOnline,
                lastSeen: fan.lastSeen
            }));
            console.log(JSON.stringify(jsonResponse, null, 2));
        }
        
        // 5. Verificar se há problema de campos obrigatórios
        console.log('\n🔍 Verificando campos obrigatórios para o frontend:');
        fans.forEach((fan, index) => {
            console.log(`Usuário ${index + 1}:`);
            console.log(`  • id: ${fan.id ? '✅' : '❌'} ${fan.id}`);
            console.log(`  • name: ${fan.name ? '✅' : '❌'} "${fan.name}"`);
            console.log(`  • avatarUrl: ${fan.avatarUrl ? '✅' : '❌'} "${fan.avatarUrl}"`);
            console.log(`  • level: ${fan.level !== undefined ? '✅' : '❌'} ${fan.level}`);
        });

    } catch (error) {
        console.error('❌ Erro durante debug:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar debug
debugFansAPI();
