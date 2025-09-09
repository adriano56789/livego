const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configuração mais robusta da URI do MongoDB
// Para desenvolvimento local, usa localhost; para Docker, usa o nome do serviço
const isDockerEnv = process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'production';
const mongoHost = isDockerEnv ? 'mongodb' : 'localhost';
const defaultMongoUri = `mongodb://admin:admin123@${mongoHost}:27017/livego?authSource=admin`;
const MONGO_URI = process.env.MONGO_URI || defaultMongoUri;
const DB_NAME = process.env.DB_NAME || "livego";

// Log da configuração para debug
console.log('🔧 Configuração MongoDB:');
console.log(`   Ambiente Docker: ${isDockerEnv}`);
console.log(`   Host: ${mongoHost}`);
console.log(`   URI: ${MONGO_URI.replace(/\/\/.*@/, '//*****@')}`);
console.log(`   Database: ${DB_NAME}`);

let db = null;
let client = null;

async function connectToDatabase() {
  if (db) {
    console.log('📦 Reutilizando conexão existente do MongoDB');
    return db;
  }

  try {
    console.log('🔄 Iniciando conexão com MongoDB...');
    
    client = new MongoClient(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    
    // Garantir que estamos usando o banco correto
    db = client.db(DB_NAME);
    
    // Testar a conexão fazendo um ping
    await db.admin().ping();
    
    console.log(`✅ Conectado ao MongoDB com sucesso!`);
    console.log(`🗄️  Database: ${DB_NAME}`);
    console.log(`🏠 Host: ${MONGO_URI.split('@')[1]?.split('/')[0] || 'desconhecido'}`);
    
    // Inicializar dados se necessário
    await initializeData();
    
    return db;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:');
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    
    // Sugestões baseadas no tipo de erro
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Sugestão: Verifique se o MongoDB está rodando');
      console.error('   Docker: docker ps | grep mongodb');
      console.error('   Local: sudo systemctl status mongod');
    } else if (error.message.includes('Authentication')) {
      console.error('💡 Sugestão: Verifique as credenciais (admin:admin123)');
      console.error('   Teste: docker exec -it mongodb mongosh -u admin -p admin123 --authenticationDatabase admin');
    } else if (error.message.includes('Server selection')) {
      console.error('💡 Sugestão: Verifique a URI de conexão');
      console.error(`   URI atual: ${MONGO_URI.replace(/\/\/.*@/, '//*****@')}`);
    }
    
    throw error;
  }
}

async function initializeData() {
  try {
    console.log('🔍 Verificando dados iniciais do banco...');
    
    // Verificar se já existem dados
    const usersCount = await db.collection('users').countDocuments();
    const streamsCount = await db.collection('streams').countDocuments();
    const giftsCount = await db.collection('gifts').countDocuments();
    
    console.log(`📄 Estatísticas atuais:`);
    console.log(`   Usuários: ${usersCount}`);
    console.log(`   Streams: ${streamsCount}`);
    console.log(`   Presentes: ${giftsCount}`);
    
    if (usersCount === 0) {
      console.log('🏠 Inicializando dados do banco...');
      
      // Inserir usuários iniciais
      console.log('👥 Criando usuários iniciais...');
      await db.collection('users').insertMany([
        {
          id: 10755083,
          name: 'Você',
          email: 'livego@example.com',
          avatar_url: 'https://i.pravatar.cc/400?u=10755083',
          nickname: 'Seu Perfil',
          gender: 'male',
          birthday: '2002-01-01',
          age: 22,
          level2: 6,
          has_uploaded_real_photo: true,
          has_completed_profile: true,
          invite_code: 'A1B2C3D4',
          following: [55218901, 14431934, 99887705],
          wallet_diamonds: 50000,
          wallet_earnings: 0,
          withdrawal_method: null,
          xp: 100,
          last_camera_used: 'user',
          country: 'BR',
          personalSignature: "",
          personalityTags: [],
          emotionalState: null,
          profession: null,
          languages: null,
          height: null,
          weight: null,
          pk_enabled_preference: true,
          online_status: true,
          settings: {
            notifications: { newMessages: true, streamerLive: true, followedPost: true, order: true, interactive: true },
            privacy: { showLocation: true, showActiveStatus: true, showInNearby: true, protectionEnabled: false, messagePrivacy: 'everyone' },
            privateLiveInvite: { privateInvites: true, onlyFollowing: true, onlyFans: false, onlyFriends: false, acceptOnlyFriendPkInvites: false },
            giftNotifications: { enabledGifts: {} }
          }
        },
        {
          id: 55218901,
          name: 'Ana Silva',
          email: 'ana@example.com',
          avatar_url: 'https://i.pravatar.cc/400?u=55218901',
          nickname: 'Ana_Live',
          gender: 'female',
          birthday: '1995-03-15',
          age: 29,
          level2: 12,
          has_uploaded_real_photo: true,
          has_completed_profile: true,
          invite_code: 'E5F6G7H8',
          following: [10755083],
          wallet_diamonds: 25000,
          wallet_earnings: 1500,
          withdrawal_method: 'pix',
          xp: 2500,
          last_camera_used: 'user',
          country: 'BR',
          personalSignature: "Streamer profissional",
          personalityTags: ['extrovertida', 'criativa'],
          emotionalState: 'feliz',
          profession: 'Streamer',
          languages: ['português', 'inglês'],
          height: 165,
          weight: 55,
          pk_enabled_preference: true,
          online_status: true,
          settings: {
            notifications: { newMessages: true, streamerLive: true, followedPost: true, order: true, interactive: true },
            privacy: { showLocation: false, showActiveStatus: true, showInNearby: true, protectionEnabled: true, messagePrivacy: 'followers' },
            privateLiveInvite: { privateInvites: true, onlyFollowing: true, onlyFans: true, onlyFriends: false, acceptOnlyFriendPkInvites: true },
            giftNotifications: { enabledGifts: {} }
          }
        }
      ]);
      console.log('✅ Usuários criados com sucesso!');

      // Inserir streams iniciais
      console.log('📺 Criando streams iniciais...');
      await db.collection('streams').insertMany([
        {
          id: 'stream_001',
          user_id: 55218901,
          titulo: 'Live de Música e Conversa',
          nome_streamer: 'Ana_Live',
          thumbnail_url: 'https://picsum.photos/400/300?random=1',
          current_viewers: [],
          categoria: 'Música',
          ao_vivo: true,
          em_pk: false,
          is_private: false,
          entry_fee: 0,
          meta: null,
          inicio: new Date().toISOString(),
          permite_pk: true,
          country_code: 'BR',
          camera_facing_mode: 'user',
          voice_enabled: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
      console.log('✅ Streams criadas com sucesso!');

      // Inserir presentes
      console.log('🎁 Criando presentes iniciais...');
      await db.collection('gifts').insertMany([
        {
          id: 'gift_001',
          name: 'Rosa',
          image_url: 'https://example.com/rose.png',
          diamond_cost: 10,
          animation_url: 'https://example.com/rose_animation.json'
        },
        {
          id: 'gift_002',
          name: 'Coração',
          image_url: 'https://example.com/heart.png',
          diamond_cost: 50,
          animation_url: 'https://example.com/heart_animation.json'
        }
      ]);
      console.log('✅ Presentes criados com sucesso!');

      console.log('🎉 Dados iniciais inseridos com sucesso!');
    } else {
      console.log('📦 Dados já existem, pulando inicialização');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar dados:', error.message);
    console.error('💡 Sugestão: Verifique se o banco livego está acessível');
  }
}

async function closeConnection() {
  if (client) {
    console.log('🔌 Fechando conexão com MongoDB...');
    await client.close();
    db = null;
    client = null;
    console.log('✅ Conexão fechada com sucesso!');
  }
}

module.exports = {
  connectToDatabase,
  closeConnection
};
