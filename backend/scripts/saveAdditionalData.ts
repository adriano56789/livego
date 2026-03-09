import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

// Dados do seu database.ts
const liveStreamManualData = [
    { 
        title: '1. Preparando sua Transmissão', 
        content: [ 
            'Capa e Título: Escolha uma imagem de capa clara e um título que chame a atenção. Isso é a primeira coisa que os espectadores verão!', 
            'Categoria: Selecione a categoria correta (Música, Dança, Jogos, etc.) para que seu público-alvo encontre sua live mais facilmente.', 
            'Qualidade: Verifique sua conexão com a internet. Uma boa iluminação e um áudio claro são essenciais para manter os espectadores engajados.' 
        ] 
    }, 
    { 
        title: '2. Durante a Transmissão', 
        content: [ 
            'Interaja com o Chat: Converse com seus espectadores! Responda perguntas, agradeça pelos presentes e faça com que eles se sintam parte da transmissão.', 
            'Ferramentas de Co-host e PK: Convide amigos para participar da sua live ou inicie uma Batalha PK para tornar as coisas mais emocionantes. Use as ferramentas no menu de opções.', 
            'Efeitos de Beleza: Utilize os filtros e efeitos de beleza para melhorar a qualidade da sua imagem e se divertir.' 
        ] 
    }, 
    { 
        title: '3. Tipo de Transmissão', 
        content: [ 
            'WebRTC (Padrão): A forma mais simples de começar a transmitir, direto do seu navegador, sem necessidade de softwares adicionais.', 
            'RTMP/SRT: Para streamers avançados que usam softwares como OBS Studio. Copie a URL do servidor e a chave de transmissão para o seu programa para ter mais controle sobre a qualidade e layout da sua live.' 
        ] 
    }, 
    { 
        title: '4. Dicas Importantes', 
        content: [ 
            'Seja Consistente: Tente transmitir em horários regulares para que seus fãs saibam quando podem te encontrar.', 
            'Divulgue: Avise seus seguidores em outras redes sociais que você vai entrar ao vivo.', 
            'Regras da Comunidade: Lembre-se de seguir as diretrizes da plataforma para manter um ambiente seguro e divertido para todos.' 
        ] 
    }
];

const beautyEffectsData = {
    filters: [
        {name: 'Fechar', icon: '🚫'},
        {name: 'Musa', img: 'https://i.pravatar.cc/150?img=1'},
        {name: 'Bonito', img: 'https://i.pravatar.cc/150?img=2'},
        {name: 'Vitalidade', img: 'https://i.pravatar.cc/150?img=3'}
    ], 
    effects: [
        {name: 'Branquear', icon: '😊'},
        {name: 'Alisar a p...', icon: '✨'},
        {name: 'Ruborizar', icon: '☺️'},
        {name: 'Contraste', icon: '🌗'}
    ]
};

const mainUserAvatar = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

async function saveAdditionalDataToDatabase() {
    try {
        console.log('🚀 Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado com sucesso!');
        
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Não foi possível conectar ao banco de dados');
        }
        
        // 1. Salvar Manual de Live Stream
        console.log('\n📖 Salvando manual de live stream...');
        await db.collection('livestreammanual').deleteMany({});
        
        const manualCollection = db.collection('livestreammanual');
        for (const [index, manual] of liveStreamManualData.entries()) {
            const manualWithId = {
                id: `manual_${index + 1}`,
                ...manual,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await manualCollection.insertOne(manualWithId);
            console.log(`📖 ${manual.title}`);
        }
        
        // 2. Salvar Efeitos de Beleza
        console.log('\n💄 Salvando efeitos de beleza...');
        await db.collection('beautyeffects').deleteMany({});
        
        const beautyCollection = db.collection('beautyeffects');
        const beautyWithId = {
            id: 'beauty_effects_config',
            filters: beautyEffectsData.filters,
            effects: beautyEffectsData.effects,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await beautyCollection.insertOne(beautyWithId);
        
        console.log(`💄 ${beautyEffectsData.filters.length} filtros salvos`);
        console.log(`✨ ${beautyEffectsData.effects.length} efeitos salvos`);
        
        // 3. Salvar Configurações do Sistema
        console.log('\n⚙️ Salvando configurações do sistema...');
        await db.collection('systemconfig').deleteMany({});
        
        const configCollection = db.collection('systemconfig');
        const systemConfig = {
            id: 'main_config',
            mainUserAvatar: mainUserAvatar,
            version: '1.0.0',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await configCollection.insertOne(systemConfig);
        
        console.log(`⚙️ Avatar principal: ${mainUserAvatar}`);
        
        console.log('\n✅ Dados adicionais salvos com sucesso no MongoDB!');
        console.log('📖 Coleção "livestreammanual" criada!');
        console.log('💄 Coleção "beautyeffects" criada!');
        console.log('⚙️ Coleção "systemconfig" criada!');
        console.log('📱 O app agora pode buscar todos os dados da API!');
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Conexão encerrada.');
    }
}

saveAdditionalDataToDatabase();
