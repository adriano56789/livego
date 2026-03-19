import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin')
    .then(() => console.log('✅ Conectado ao MongoDB'))
    .catch(err => console.error('❌ Erro ao conectar:', err));

async function resetStreamData(streamId) {
    try {
        console.log(`🔄 Resetando dados da stream ${streamId}`);
        
        // Importar modelos dinamicamente
        const { default: GiftTransaction } = await import('./backend/src/models/GiftTransaction.ts');
        const { default: User } = await import('./backend/src/models/User.ts');
        
        // 1. Remover todas as transações da stream
        const deleteResult = await GiftTransaction.deleteMany({ streamId });
        console.log(`🗑️ Removidas ${deleteResult.deletedCount} transações`);
        
        // 2. Resetar valores dos usuários online na stream
        const updateResult = await User.updateMany(
            { currentStreamId: streamId },
            { $set: { enviados: 0, receptores: 0 } }
        );
        console.log(`🔄 Resetados ${updateResult.modifiedCount} usuários`);
        
        // 3. Verificar usuários online após reset
        const onlineUsers = await User.find({ 
            currentStreamId: streamId,
            isOnline: true 
        }).select('id name enviados receptores');
        
        console.log(`👥 Usuários online após reset:`);
        onlineUsers.forEach(user => {
            console.log(`  ${user.name} (${user.id}): enviados=${user.enviados}, receptores=${user.receptores}`);
        });
        
        console.log(`✅ Reset completo da stream ${streamId}`);
        
    } catch (error) {
        console.error('❌ Erro ao resetar:', error);
    } finally {
        mongoose.disconnect();
    }
}

const streamId = process.argv[2] || '65384127';
resetStreamData(streamId);
