import mongoose from 'mongoose';

/**
 * Script para limpar índices conflitantes do MongoDB
 * Execute uma vez para resolver problemas de índices duplicados
 */
export async function cleanupConflictingIndexes() {
    try {
        console.log('🧹 [CLEANUP] Limpando índices conflitantes...');

        // Conectar ao MongoDB se não estiver conectado
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/livego');
        }

        const db = mongoose.connection.db;
        if (!db) {
            console.log('❌ [CLEANUP] Banco de dados não conectado');
            return false;
        }
        
        const collections = await db.listCollections().toArray();

        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`📁 [CLEANUP] Verificando coleção: ${collectionName}`);
            
            try {
                const indexes = await db.collection(collectionName).listIndexes().toArray();
                
                for (const index of indexes) {
                    // Pular o índice padrão _id
                    if (index.name === '_id_') continue;
                    
                    console.log(`🗑️ [CLEANUP] Removendo índice: ${index.name} da coleção ${collectionName}`);
                    
                    try {
                        await db.collection(collectionName).dropIndex(index.name);
                        console.log(`✅ [CLEANUP] Índice ${index.name} removido com sucesso`);
                    } catch (error: any) {
                        if (error.codeName !== 'IndexNotFound') {
                            console.log(`⚠️ [CLEANUP] Erro ao remover índice ${index.name}:`, error.message);
                        }
                    }
                }
            } catch (error: any) {
                console.log(`⚠️ [CLEANUP] Erro ao processar coleção ${collectionName}:`, error.message);
            }
        }

        console.log('🎉 [CLEANUP] Limpeza de índices concluída!');
        return true;

    } catch (error: any) {
        console.error('❌ [CLEANUP] Erro durante limpeza:', error);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    cleanupConflictingIndexes()
        .then(() => {
            console.log('✅ Limpeza concluída com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erro na limpeza:', error);
            process.exit(1);
        });
}
