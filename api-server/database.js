const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/livego';

let db = null;
let client = null;

async function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db();
    console.log('Conectado ao MongoDB com sucesso!');
    
    // Inicializar dados se necessário
    await initializeData();
    
    return db;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    throw error;
  }
}

async function initializeData() {
  try {
    // Verificar se já existem dados
    const usersCount = await db.collection('users').countDocuments();
    
    if (usersCount === 0) {
      console.log('Inicializando dados do banco...');
      
      // Inserir usuários iniciais
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

      // Inserir streams iniciais
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

      // Inserir presentes
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

      console.log('Dados iniciais inseridos com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao inicializar dados:', error);
  }
}

async function closeConnection() {
  if (client) {
    await client.close();
    db = null;
    client = null;
  }
}

module.exports = {
  connectToDatabase,
  closeConnection
};
