import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

const uri = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';
const client = new MongoClient(uri);

async function cleanAndCreateTransaction(streamId, userId, value) {
    try {
        console.log(`🧹 Limpando todas as transações e criando apenas uma: ${value} diamantes`);
        
        await client.connect();
        const db = client.db();
        
        // 1. Remover TODAS as transações da stream
        const giftTransactions = db.collection('gifttransactions');
        const deleteResult = await giftTransactions.deleteMany({ streamId });
        console.log(`🗑️ Removidas ${deleteResult.deletedCount} transações`);
        
        // 2. Resetar contador do usuário
        const users = db.collection('users');
        const userUpdate = await users.updateOne(
            { id: userId },
            { $set: { enviados: 0, receptores: 0 } }
        );
        console.log(`🔄 Resetado usuário: modified=${userUpdate.modifiedCount}`);
        
        // 3. Criar apenas uma transação com o valor correto
        const transaction = {
            streamId: streamId,
            fromUserId: userId,
            toUserId: 'streamer_id',
            giftId: 'gift_test',
            giftName: 'Presente Teste',
            giftIcon: '💎',
            giftPrice: value,
            quantity: 1,
            totalValue: value,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await giftTransactions.insertOne(transaction);
        console.log(`✅ Nova transação criada: ${result.insertedId}`);
        
        // 4. Verificar resultado
        const finalTransactions = await giftTransactions.find({ streamId }).toArray();
        console.log(`📊 Transações finais na stream ${streamId}: ${finalTransactions.length}`);
        finalTransactions.forEach((tx, index) => {
            console.log(`  ${index + 1}. ${tx.fromUserId} → ${tx.totalValue} diamantes`);
        });
        
        // 5. Calcular total por usuário
        const userValues = {};
        finalTransactions.forEach(tx => {
            const uid = tx.fromUserId;
            userValues[uid] = (userValues[uid] || 0) + tx.totalValue;
        });
        
        console.log(`💎 Total por usuário:`);
        Object.entries(userValues).forEach(([uid, total]) => {
            console.log(`  ${uid}: ${total} diamantes`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await client.close();
    }
}

// Limpar tudo e criar apenas 6 diamantes
cleanAndCreateTransaction('stream_1773115965799_pjgil4', '65384127', 6);
