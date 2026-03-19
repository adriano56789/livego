import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

const uri = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';
const client = new MongoClient(uri);

async function fixUserAvatar(userId) {
    try {
        console.log(`🔧 Corrigindo avatar do usuário ${userId}`);
        
        await client.connect();
        const db = client.db();
        const users = db.collection('users');
        
        // 1. Buscar usuário atual
        const currentUser = await users.findOne({ id: userId });
        if (!currentUser) {
            console.log('❌ Usuário não encontrado');
            return;
        }
        
        console.log(`👤 Usuário atual:`, {
            name: currentUser.name,
            avatarUrl: currentUser.avatarUrl,
            enviados: currentUser.enviados,
            receptores: currentUser.receptores
        });
        
        // 2. Atualizar avatarUrl para uma URL real
        const avatarUrl = `https://picsum.photos/seed/${currentUser.name}-${userId}/200/200.jpg`;
        
        const updateResult = await users.updateOne(
            { id: userId },
            { 
                $set: { 
                    avatarUrl: avatarUrl,
                    enviados: 0,  // Resetar para garantir
                    receptores: 0  // Resetar para garantir
                }
            }
        );
        
        console.log(`✅ Usuário atualizado: modified=${updateResult.modifiedCount}`);
        console.log(`🖼️ Novo avatarUrl: ${avatarUrl}`);
        
        // 3. Verificar resultado
        const updatedUser = await users.findOne({ id: userId });
        console.log(`👤 Usuário após atualização:`, {
            name: updatedUser.name,
            avatarUrl: updatedUser.avatarUrl,
            enviados: updatedUser.enviados,
            receptores: updatedUser.receptores
        });
        
    } catch (error) {
        console.error('❌ Erro ao corrigir avatar:', error);
    } finally {
        await client.close();
    }
}

// Corrigir avatar do usuário adriano
fixUserAvatar('65384127');
