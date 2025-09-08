import { MongoClient } from 'mongodb';

// Configuração da conexão com MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:admin123@localhost:27017/livego?authSource=admin';

// Função para testar a conexão
async function testarConexaoMongoDB() {
    console.log('🔄 Iniciando teste de conexão com MongoDB...');
    console.log(`📍 URI de conexão: ${MONGO_URI}`);
    
    let client;
    
    try {
        // Conectar ao MongoDB
        console.log('⏳ Conectando ao MongoDB...');
        client = new MongoClient(MONGO_URI);
        await client.connect();
        
        console.log('✅ Conexão estabelecida com sucesso!');
        
        // Testar o banco de dados
        const db = client.db('livego');
        console.log('📊 Banco de dados selecionado: livego');
        
        // Listar coleções existentes
        const collections = await db.listCollections().toArray();
        console.log('📂 Coleções encontradas:', collections.length);
        
        if (collections.length > 0) {
            console.log('📋 Lista de coleções:');
            collections.forEach(col => {
                console.log(`   - ${col.name}`);
            });
        }
        
        // Testar operação de escrita
        console.log('✍️  Testando operação de escrita...');
        const testCollection = db.collection('teste_conexao');
        const resultado = await testCollection.insertOne({
            timestamp: new Date(),
            teste: 'Conexão funcionando',
            usuario: 'script_teste'
        });
        console.log('✅ Documento inserido com ID:', resultado.insertedId);
        
        // Testar operação de leitura
        console.log('📖 Testando operação de leitura...');
        const documento = await testCollection.findOne({ _id: resultado.insertedId });
        console.log('✅ Documento lido:', documento);
        
        // Limpar teste
        await testCollection.deleteOne({ _id: resultado.insertedId });
        console.log('🧹 Documento de teste removido');
        
        // Verificar dados do LiveGo se existirem
        console.log('\n📊 Verificando dados do LiveGo...');
        const usuarios = await db.collection('users').countDocuments();
        const streams = await db.collection('streams').countDocuments();
        const mensagens = await db.collection('chat_messages').countDocuments();
        
        console.log(`👥 Usuários no banco: ${usuarios}`);
        console.log(`📺 Streams no banco: ${streams}`);
        console.log(`💬 Mensagens no banco: ${mensagens}`);
        
        console.log('\n🎉 Teste de conexão MongoDB CONCLUÍDO COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ Erro na conexão com MongoDB:');
        console.error(`   Tipo: ${error.name}`);
        console.error(`   Mensagem: ${error.message}`);
        
        if (error.code) {
            console.error(`   Código: ${error.code}`);
        }
        
        // Sugestões baseadas no tipo de erro
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Sugestões:');
            console.log('   1. Verifique se o MongoDB está rodando');
            console.log('   2. Execute: docker compose -f docker-compose-basic.yml up -d');
            console.log('   3. Verifique se a porta 27017 está acessível');
        } else if (error.message.includes('Authentication failed')) {
            console.log('\n💡 Sugestões:');
            console.log('   1. Verifique as credenciais (admin:admin123)');
            console.log('   2. Verifique se authSource=admin está correto');
        }
        
        process.exit(1);
    } finally {
        // Fechar conexão
        if (client) {
            await client.close();
            console.log('🔌 Conexão fechada');
        }
    }
}

// Executar teste
testarConexaoMongoDB();