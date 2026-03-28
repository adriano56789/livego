import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createBackup() {
    const uri = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';
    const dbName = 'api';
    
    // Criar diretório de backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(__dirname, 'backups', `mongodb-backup-${timestamp}`);
    
    if (!fs.existsSync(path.join(__dirname, 'backups'))) {
        fs.mkdirSync(path.join(__dirname, 'backups'), { recursive: true });
    }
    
    fs.mkdirSync(backupDir, { recursive: true });
    
    console.log('🔄 Conectando ao MongoDB...');
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ Conectado ao MongoDB com sucesso!');
        
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        console.log(`📦 Encontradas ${collections.length} coleções para backup`);
        
        const backupData = {
            metadata: {
                database: dbName,
                timestamp: new Date().toISOString(),
                collections: collections.length,
                version: '1.0'
            },
            collections: {}
        };
        
        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`📄 Fazendo backup da coleção: ${collectionName}`);
            
            const data = await db.collection(collectionName).find({}).toArray();
            backupData.collections[collectionName] = data;
            
            console.log(`✅ ${collectionName}: ${data.length} documentos`);
        }
        
        // Salvar backup
        const backupFile = path.join(backupDir, 'backup.json');
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        
        // Criar arquivo de metadados
        const metadataFile = path.join(backupDir, 'metadata.json');
        fs.writeFileSync(metadataFile, JSON.stringify(backupData.metadata, null, 2));
        
        console.log(`\n🎉 BACKUP COMPLETO CRIADO COM SUCESSO!`);
        console.log(`📍 Local: ${backupDir}`);
        console.log(`📄 Arquivo principal: backup.json`);
        console.log(`📊 Metadados: metadata.json`);
        console.log(`💾 Tamanho total: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`);
        
        // Listar coleções e quantidades
        console.log('\n📋 Resumo das coleções:');
        for (const [name, data] of Object.entries(backupData.collections)) {
            console.log(`   • ${name}: ${data.length} documentos`);
        }
        
    } catch (error) {
        console.error('❌ Erro durante o backup:', error);
        throw error;
    } finally {
        await client.close();
        console.log('🔒 Conexão com MongoDB fechada');
    }
}

// Executar backup
createBackup().catch(console.error);
