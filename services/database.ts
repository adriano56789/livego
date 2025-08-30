import { mongoObjectId } from './mongoObjectId';
import * as levelService from './levelService';
// FIX: Added missing type imports.
import type { User, LiveStreamRecord, Stream, PkBattle, PkBattleState, PurchaseOrder, ConvitePK, LiveCategory, Category, StartLiveResponse, FacingMode, LiveDetails, ChatMessage, Viewer, PublicProfile, AppEvent, ArtigoAjuda, CanalContato, HealthCheckResult, PrivateLiveInviteSettings, NotificationSettings, GiftNotificationSettings, PrivacySettings, LiveFollowUpdate, WithdrawalBalance, UserLevelInfo, InventoryItem, WithdrawalTransaction, RankingContributor, Conversation, ConversationMessage, Gift, DiamondPackage, PkSettings, SelectableOption, SecurityLogEntry } from '../types';

// --- INITIAL MOCK DATA (STRUCTURED LIKE MONGODB COLLECTIONS) ---
const newUserTemplate = {
  has_uploaded_real_photo: true,
  has_completed_profile: true,
  invite_code: null,
  following: [],
  wallet_diamonds: 100,
  wallet_earnings: 0,
  withdrawal_method: null,
  xp: 100,
  last_camera_used: 'user' as FacingMode,
  country: 'BR',
  personalSignature: "",
  personalityTags: [],
  emotionalState: null,
  profession: null,
  languages: null,
  height: null,
  weight: null,
  pk_enabled_preference: true,
  settings: {
    notifications: { newMessages: true, streamerLive: true, followedPost: true, order: true, interactive: true },
    privacy: { showLocation: true, showActiveStatus: true, showInNearby: true, protectionEnabled: false },
    privateLiveInvite: { privateInvites: true, onlyFollowing: true, onlyFans: false, onlyFriends: false, acceptOnlyFriendPkInvites: false },
    giftNotifications: { enabledGifts: {} }
  }
};

const userDefinitions: Omit<User, 'level' | 'followers' | 'visitors'>[] = [
    {
      id: 10755083,
      name: 'Você',
      email: 'livego@example.com',
      avatar_url: 'https://i.pravatar.cc/400?u=10755083',
      nickname: 'Seu Perfil',
      gender: 'male',
      birthday: '1995-05-15',
      age: null,
      has_uploaded_real_photo: true,
      has_completed_profile: true,
      invite_code: 'A1B2C3D4',
      following: [55218901], // Following "Lest Go 500 K..."
      wallet_diamonds: 50000,
      wallet_earnings: 125000,
      withdrawal_method: null,
      xp: 0,
      last_camera_used: 'user',
      country: 'BR',
      personalSignature: "Apenas boas vibrações!",
      personalityTags: [{id: 'gamer', label: 'Gamer'}, {id: 'music', label: 'Música'}],
      emotionalState: null,
      profession: null,
      languages: null,
      height: null,
      weight: null,
      pk_enabled_preference: true,
      photo_gallery: ['https://i.pravatar.cc/400?u=10755083'],
      settings: {
        notifications: { newMessages: true, streamerLive: true, followedPost: true, order: true, interactive: true },
        privacy: { showLocation: true, showActiveStatus: true, showInNearby: true, protectionEnabled: false },
        privateLiveInvite: { privateInvites: true, onlyFollowing: true, onlyFans: false, onlyFriends: false, acceptOnlyFriendPkInvites: false },
        giftNotifications: { enabledGifts: {} }
      }
    },
    { 
      id: 55218901, 
      name: 'Streamer 1', 
      email: 'streamer1@example.com',
      nickname: 'Lest Go 500 K...', 
      avatar_url: 'https://i.pravatar.cc/400?u=55218901', 
      gender: 'male',
      birthday: '1990-01-01',
      age: null,
      ...newUserTemplate,
      following: [10755083], 
      is_avatar_protected: true,
      photo_gallery: ['https://i.pravatar.cc/400?u=55218901'],
    },
    { 
      id: 66345102, 
      name: 'Streamer 2', 
      email: 'streamer2@example.com',
      nickname: 'PK Queen', 
      avatar_url: 'https://i.pravatar.cc/400?u=66345102', 
      gender: 'female',
      birthday: '1998-10-20',
      age: null,
      ...newUserTemplate,
      country: 'US',
      photo_gallery: ['https://i.pravatar.cc/400?u=66345102'],
    },
    { 
      id: 99887705, 
      name: 'PK Pro', 
      email: 'pkpro@example.com',
      nickname: 'PK Pro', 
      avatar_url: 'https://i.pravatar.cc/400?u=99887705', 
      gender: 'male',
      birthday: '1992-07-11',
      age: null,
      ...newUserTemplate,
      photo_gallery: ['https://i.pravatar.cc/400?u=99887705'],
    },
    { 
      id: 999, 
      name: 'Atendimento ao Cliente', 
      nickname: 'Suporte LiveGo', 
      avatar_url: 'https://storage.googleapis.com/genai-assets/LiveGoSupportAgent.png', 
      email: 'support@livego.com',
      gender: null,
      birthday: null,
      age: null,
      ...newUserTemplate,
      xp: 999999,
      photo_gallery: ['https://storage.googleapis.com/genai-assets/LiveGoSupportAgent.png'],
    }
];

// Pre-calculate followers
const followerCounts: Record<number, number> = {};
userDefinitions.forEach(user => {
    (user.following || []).forEach(followedId => {
        followerCounts[followedId] = (followerCounts[followedId] || 0) + 1;
    });
});


const initialData = {
  users: userDefinitions.map((u) => ({
    _id: mongoObjectId(),
    ...u,
    followers: followerCounts[u.id] || 0,
    visitors: 0,
    following: u.following || [], // Ensure `following` is always an array
    level: levelService.calculateLevelFromXp(u.xp)
  })),
  liveStreams: [
    { _id: mongoObjectId(), id: 101, user_id: 55218901, titulo: "PK Challenge", nome_streamer: "Lest Go 500 K...", thumbnail_url: 'https://i.pravatar.cc/400?u=55218901', espectadores: 0, categoria: 'PK', ao_vivo: true, em_pk: true, is_private: false, entry_fee: null, meta: 'Evento de PK', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 0, like_count: 0, country_code: 'BR', camera_facing_mode: 'user', current_viewers: [] },
    { _id: mongoObjectId(), id: 102, user_id: 66345102, titulo: "Dance Party!", nome_streamer: "PK Queen", thumbnail_url: 'https://i.pravatar.cc/400?u=66345102', espectadores: 0, categoria: 'Dança', ao_vivo: true, em_pk: true, is_private: false, entry_fee: null, meta: 'Vem dançar!', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 0, like_count: 0, country_code: 'US', camera_facing_mode: 'user', current_viewers: [] },
    { _id: mongoObjectId(), id: 105, user_id: 99887705, titulo: "Private Session", nome_streamer: "PK Pro", thumbnail_url: 'https://i.pravatar.cc/400?u=99887705', espectadores: 0, categoria: 'Privada', ao_vivo: true, em_pk: false, is_private: true, entry_fee: null, meta: 'Chill stream', inicio: new Date().toISOString(), permite_pk: false, received_gifts_value: 0, like_count: 0, country_code: 'BR', camera_facing_mode: 'user', current_viewers: [] },
  ],
  conversations: [
    {
      _id: mongoObjectId(),
      id: 'convo_1_2',
      participants: [10755083, 55218901],
      messages: [
        {
          id: mongoObjectId(),
          senderId: 55218901,
          type: 'text',
          text: 'Olá! Tudo bem?',
          imageUrl: null,
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          status: 'sent',
          seenBy: [55218901]
        }
      ]
    }
  ],
  pkBattles: [],
  gifts: [
    { _id: mongoObjectId(), id: 1, name: 'Coração', price: 1, valor_pontos: 1, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'HeartGift' },
    { _id: mongoObjectId(), id: 2, name: 'Rosa', price: 10, valor_pontos: 10, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'RoseGift' },
    { _id: mongoObjectId(), id: 3, name: 'Sorvete', price: 50, valor_pontos: 50, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'IceCreamGift' },
    { _id: mongoObjectId(), id: 4, name: 'Foguete', price: 1000, valor_pontos: 1000, is_ativo: true, animationUrl: 'https://assets2.lottiefiles.com/packages/lf20_p8bfn5to.json', imageUrl: '', iconComponent: 'RocketGift' },
    { _id: mongoObjectId(), id: 5, name: 'Carro', price: 5000, valor_pontos: 5000, is_ativo: true, animationUrl: 'https://assets5.lottiefiles.com/packages/lf20_l2k2mjbn.json', imageUrl: '', iconComponent: 'SportsCar', soundUrl: 'https://storage.googleapis.com/genai-assets/livego/car_sound.mp3' },
    { _id: mongoObjectId(), id: 6, name: 'Castelo', price: 20000, valor_pontos: 20000, is_ativo: true, animationUrl: 'https://assets6.lottiefiles.com/packages/lf20_tijmpky4.json', imageUrl: '', iconComponent: 'CastleGift', soundUrl: 'https://storage.googleapis.com/genai-assets/livego/castle_sound.mp3' },
    { _id: mongoObjectId(), id: 7, name: 'Anel', price: 2000, valor_pontos: 2000, is_ativo: true, animationUrl: 'https://assets8.lottiefiles.com/packages/lf20_x2oiattv.json', imageUrl: '', iconComponent: 'RingGift', soundUrl: 'https://storage.googleapis.com/genai-assets/livego/ring_sound.mp3' },
    { _id: mongoObjectId(), id: 8, name: 'Iate', price: 50000, valor_pontos: 50000, is_ativo: true, animationUrl: 'https://assets1.lottiefiles.com/packages/lf20_b3dknkey.json', imageUrl: '', iconComponent: 'PrivateJet', soundUrl: 'https://storage.googleapis.com/genai-assets/livego/yacht_sound.mp3' },
    { _id: mongoObjectId(), id: 9, name: 'Pirulito', price: 5, valor_pontos: 5, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'Lollipop' },
    { _id: mongoObjectId(), id: 10, name: 'Donut', price: 25, valor_pontos: 25, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'Donut' },
    { _id: mongoObjectId(), id: 11, name: 'Patinho', price: 99, valor_pontos: 99, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'RubberDuck' },
    { _id: mongoObjectId(), id: 12, name: 'Microfone', price: 250, valor_pontos: 250, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'Microphone' },
    { _id: mongoObjectId(), id: 13, name: 'Controle', price: 499, valor_pontos: 499, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'GameController' },
    { _id: mongoObjectId(), id: 14, name: 'Baú', price: 999, valor_pontos: 999, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'TreasureChest' },
    { _id: mongoObjectId(), id: 15, name: 'Coração Dima', price: 1999, valor_pontos: 1999, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'DiamondHeart' },
    { _id: mongoObjectId(), id: 16, name: 'Coroa', price: 4999, valor_pontos: 4999, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'CrownV2' },
    { _id: mongoObjectId(), id: 17, name: 'Esportivo', price: 9999, valor_pontos: 9999, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'SportsCar' },
    { _id: mongoObjectId(), id: 18, name: 'Jato', price: 29999, valor_pontos: 29999, is_ativo: true, animationUrl: '', imageUrl: '', iconComponent: 'PrivateJet' },
    { _id: mongoObjectId(), id: 19, name: 'Panda Fofo', price: 888, valor_pontos: 888, is_ativo: true, animationUrl: 'https://assets5.lottiefiles.com/packages/lf20_ysbh2y2m.json', imageUrl: '', iconComponent: 'CutePanda' },
    { _id: mongoObjectId(), id: 20, name: 'Bomba Divertida', price: 199, valor_pontos: 199, is_ativo: true, animationUrl: 'https://assets2.lottiefiles.com/packages/lf20_O2OT6E.json', imageUrl: '', iconComponent: 'FunnyBomb' },
    { _id: mongoObjectId(), id: 21, name: 'Poção do Amor', price: 699, valor_pontos: 699, is_ativo: true, animationUrl: 'https://assets6.lottiefiles.com/packages/lf20_gwmxftjc.json', imageUrl: '', iconComponent: 'LovePotion' },
    { _id: mongoObjectId(), id: 22, name: 'Guitarra de Rock', price: 2500, valor_pontos: 2500, is_ativo: true, animationUrl: 'https://assets1.lottiefiles.com/packages/lf20_p25qud2g.json', imageUrl: '', iconComponent: 'RockGuitar' },
    { _id: mongoObjectId(), id: 23, name: 'Caixa Surpresa', price: 350, valor_pontos: 350, is_ativo: true, animationUrl: 'https://assets3.lottiefiles.com/packages/lf20_xmdoxc1o.json', imageUrl: '', iconComponent: 'JackInTheBox' },
    { _id: mongoObjectId(), id: 24, name: 'Unicórnio Mágico', price: 7500, valor_pontos: 7500, is_ativo: true, animationUrl: 'https://assets1.lottiefiles.com/packages/lf20_e2RV2J.json', imageUrl: '', iconComponent: 'MagicUnicorn' },
    { _id: mongoObjectId(), id: 25, name: 'Chuva de Dinheiro', price: 10000, valor_pontos: 10000, is_ativo: true, animationUrl: 'https://assets4.lottiefiles.com/packages/lf20_vgr58t0d.json', imageUrl: '', iconComponent: 'MoneyRain' },
    { _id: mongoObjectId(), id: 26, name: 'Nave Espacial', price: 15000, valor_pontos: 15000, is_ativo: true, animationUrl: 'https://assets9.lottiefiles.com/packages/lf20_z01bika0.json', imageUrl: '', iconComponent: 'Spaceship' },
    { _id: mongoObjectId(), id: 27, name: 'Leão Rei', price: 25000, valor_pontos: 25000, is_ativo: true, animationUrl: 'https://assets8.lottiefiles.com/packages/lf20_y0pqpgw0.json', imageUrl: '', iconComponent: 'LionKing' },
    { _id: mongoObjectId(), id: 28, name: 'Dragão Lendário', price: 75000, valor_pontos: 75000, is_ativo: true, animationUrl: 'https://assets4.lottiefiles.com/packages/lf20_1nCoaD.json', imageUrl: '', iconComponent: 'LegendaryDragon' },
  ],
  diamondPackages: [
    { _id: mongoObjectId(), id: 1, diamonds: 100, price: 4.99, currency: 'BRL' },
    { _id: mongoObjectId(), id: 2, diamonds: 525, price: 25.99, currency: 'BRL' },
    { _id: mongoObjectId(), id: 3, diamonds: 1050, price: 49.99, currency: 'BRL' },
    { _id: mongoObjectId(), id: 4, diamonds: 2100, price: 99.99, currency: 'BRL' },
    { _id: mongoObjectId(), id: 5, diamonds: 5250, price: 249.99, currency: 'BRL' },
    { _id: mongoObjectId(), id: 6, diamonds: 10500, price: 499.99, currency: 'BRL' },
  ],
  purchaseOrders: [],
  withdrawalTransactions: [],
  blockedUsers: [],
  protectedAvatars: [],
  reports: [],
  profileVisits: [],
  sentGifts: [],
  pkMatchmakingQueue: [],
  pkInvitations: [],
  privateLiveInvites: [],
  streamUserStats: [],
  helpArticles: [
    {
      _id: mongoObjectId(),
      id: 'what-is-livego',
      titulo: 'O que é o LiveGo?',
      conteudo: 'LiveGo é uma plataforma de streaming de vídeo que permite que os criadores de conteúdo se conectem com seu público em tempo real.',
      categoria: 'FAQ' as const,
      ordem_exibicao: 1,
      visualizacoes: 1024,
      is_ativo: true
    },
    {
      _id: mongoObjectId(),
      id: 'how-to-go-live',
      titulo: 'Como eu faço para transmitir ao vivo?',
      conteudo: 'Clique no botão central na barra de navegação inferior, configure o título e a capa da sua transmissão e, em seguida, clique em "Iniciar Transmissão".',
      categoria: 'FAQ' as const,
      ordem_exibicao: 2,
      visualizacoes: 850,
      is_ativo: true
    },
    {
      _id: mongoObjectId(),
      id: 'what-are-diamonds',
      titulo: 'O que são Diamantes e Ganhos?',
      conteudo: 'Diamantes são a moeda virtual que você compra para enviar presentes aos streamers. Ganhos são o que os streamers recebem dos presentes e podem ser sacados como dinheiro real.',
      categoria: 'FAQ' as const,
      ordem_exibicao: 3,
      visualizacoes: 2500,
      is_ativo: true
    },
    {
      _id: mongoObjectId(),
      id: 'community-guidelines',
      titulo: 'Diretrizes da Comunidade',
      conteudo: 'Nossas diretrizes promovem uma comunidade segura e positiva. Respeite todos os usuários, evite discurso de ódio e não compartilhe conteúdo ilegal ou prejudicial. Violações podem resultar em suspensão da conta.',
      categoria: 'Artigos Úteis' as const,
      ordem_exibicao: 1,
      visualizacoes: 500,
      is_ativo: true
    },
    {
      _id: mongoObjectId(),
      id: 'withdrawal-policy',
      titulo: 'Política de Saque',
      conteudo: 'Você pode sacar seus Ganhos assim que atingir o limite mínimo. Uma taxa de plataforma de 20% é aplicada a todos os saques para cobrir os custos operacionais. Os pagamentos são processados via PIX ou Mercado Pago.',
      categoria: 'Artigos Úteis' as const,
      ordem_exibicao: 2,
      visualizacoes: 1200,
      is_ativo: true
    }
  ],
  contactChannels: [
    {
      _id: mongoObjectId(),
      id: 'live-support',
      nome: 'Suporte ao Vivo',
      tipo: 'chat_interno',
      destino: 'support_chat',
      icone: 'headset' as const,
      is_ativo: true,
      horario_funcionamento: '24/7'
    },
    {
      _id: mongoObjectId(),
      id: 'email-support',
      nome: 'E-mail',
      tipo: 'email',
      destino: 'mailto:support@livego.com',
      icone: 'envelope' as const,
      is_ativo: true
    },
    {
      _id: mongoObjectId(),
      id: 'whatsapp-support',
      nome: 'WhatsApp',
      tipo: 'link_externo',
      destino: 'https://wa.me/1234567890',
      icone: 'whatsapp' as const,
      is_ativo: true
    }
  ],
  likes: [],
  pkSettings: [],
  genders: [
    { _id: mongoObjectId(), id: 'male', label: 'Masculino' },
    { _id: mongoObjectId(), id: 'female', label: 'Feminino' },
  ],
  countries: [
    { _id: mongoObjectId(), id: 'BR', label: 'Brasil' },
    { _id: mongoObjectId(), id: 'US', label: 'Estados Unidos' },
    { _id: mongoObjectId(), id: 'PT', label: 'Portugal' },
    { _id: mongoObjectId(), id: 'CO', label: 'Colômbia' },
    { _id: mongoObjectId(), id: 'MX', label: 'México' },
    { _id: mongoObjectId(), id: 'AR', label: 'Argentina' },
    { _id: mongoObjectId(), id: 'ES', label: 'Espanha' },
  ],
  emotionalStates: [
    { _id: mongoObjectId(), id: 'single', label: 'Solteiro(a)' },
    { _id: mongoObjectId(), id: 'in_relationship', label: 'Em um relacionamento' },
    { _id: mongoObjectId(), id: 'married', label: 'Casado(a)' },
    { _id: mongoObjectId(), id: 'complicated', label: 'É complicado' },
  ],
  professions: [
    { _id: mongoObjectId(), id: 'student', label: 'Estudante' },
    { _id: mongoObjectId(), id: 'developer', label: 'Desenvolvedor(a)' },
    { _id: mongoObjectId(), id: 'artist', label: 'Artista' },
    { _id: mongoObjectId(), id: 'doctor', label: 'Médico(a)' },
    { _id: mongoObjectId(), id: 'teacher', label: 'Professor(a)' },
  ],
  languages: [
    { _id: mongoObjectId(), id: 'pt', label: 'Português' },
    { _id: mongoObjectId(), id: 'en', label: 'Inglês' },
    { _id: mongoObjectId(), id: 'es', label: 'Espanhol' },
    { _id: mongoObjectId(), id: 'fr', label: 'Francês' },
    { _id: mongoObjectId(), id: 'de', label: 'Alemão' },
  ],
  securityLogs: [],
};

// Deep clone for a resettable in-memory DB
let db: Record<string, any[]> = JSON.parse(JSON.stringify(initialData));

export function getRawDb() {
  return db;
}

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper function to handle setting nested properties via dot notation
const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === undefined || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
};

const createCollection = <T extends { _id: string }>(collectionName: keyof typeof db) => ({
    async find(query: any = {}): Promise<T[]> {
        await delay(50);
        const collection = db[collectionName] as T[];
        return collection.filter(doc => {
            return Object.entries(query).every(([key, queryValue]: [string, any]) => {
                const docValue = (doc as any)[key];
                if (typeof queryValue === 'object' && queryValue !== null && '$in' in queryValue) {
                    if (Array.isArray(docValue)) {
                        // Check for intersection between the doc's array and the query's array
                        return queryValue['$in'].some((v: any) => docValue.includes(v));
                    }
                    // Original logic for non-array fields
                    return queryValue['$in'].includes(docValue);
                }
                if (typeof queryValue === 'object' && queryValue !== null && '$or' in queryValue) {
                    return queryValue['$or'].some((q: any) => Object.keys(q).every(k => (doc as any)[k] === q[k]));
                }
                return docValue === queryValue;
            });
        });
    },
    async findOne(query: any): Promise<T | null> {
        await delay(30);
        const collection = db[collectionName] as T[];
        return collection.find(doc => {
            return Object.entries(query).every(([key, value]) => {
                if (Array.isArray(value) && Array.isArray((doc as any)[key])) {
                    return value.every(v => (doc as any)[key].includes(v)) && value.length === (doc as any)[key].length;
                }
                return (doc as any)[key] === value;
            });
        }) || null;
    },
    async insertOne(doc: Omit<T, '_id'>): Promise<{ insertedId: string }> {
        await delay(40);
        const newDoc = { _id: mongoObjectId(), ...doc } as T;
        db[collectionName].push(newDoc);
        return { insertedId: newDoc._id };
    },
    async updateOne(query: any, update: any): Promise<{ modifiedCount: number }> {
        await delay(40);
        const collection = db[collectionName] as T[];
        const docIndex = collection.findIndex(doc => {
             return Object.entries(query).every(([key, value]) => {
                return (doc as any)[key] === value;
            });
        });

        if (docIndex > -1) {
            const docToUpdate = collection[docIndex] as any;
            if (update.$set) {
                 for (const key in update.$set) {
                    if (key.includes('.')) {
                        setNestedValue(docToUpdate, key, update.$set[key]);
                    } else {
                        docToUpdate[key] = update.$set[key];
                    }
                }
            }
            if (update.$push) {
                const [key, value] = Object.entries(update.$push)[0] as [string, any];
                if (!Array.isArray(docToUpdate[key])) {
                    docToUpdate[key] = [];
                }
                docToUpdate[key].push(value);
            }
             if (update.$pull) {
                const [key, value] = Object.entries(update.$pull)[0] as [string, any];
                if (Array.isArray(docToUpdate[key])) {
                    docToUpdate[key] = docToUpdate[key].filter(item => item !== value);
                }
            }
            return { modifiedCount: 1 };
        }
        return { modifiedCount: 0 };
    },
     async deleteOne(query: any): Promise<{ deletedCount: number }> {
        await delay(40);
        const collection = db[collectionName] as T[];
        const initialLength = collection.length;
        db[collectionName] = collection.filter(doc => {
            return !Object.entries(query).every(([key, value]) => (doc as any)[key] === value);
        });
        return { deletedCount: initialLength - db[collectionName].length };
    },
});

export const database = {
    users: createCollection<User & { _id: string }>('users'),
    liveStreams: createCollection<LiveStreamRecord & { _id: string }>('liveStreams'),
    conversations: createCollection<any & { _id: string }>('conversations'),
    pkBattles: createCollection<PkBattleState & { _id: string }>('pkBattles'),
    gifts: createCollection<Gift & { _id: string }>('gifts'),
    diamondPackages: createCollection<DiamondPackage & { _id: string }>('diamondPackages'),
    purchaseOrders: createCollection<PurchaseOrder & { _id: string }>('purchaseOrders'),
    withdrawalTransactions: createCollection<WithdrawalTransaction & { _id: string }>('withdrawalTransactions'),
    blockedUsers: createCollection<any & { _id: string }>('blockedUsers'),
    protectedAvatars: createCollection<any & { _id: string }>('protectedAvatars'),
    reports: createCollection<any & { _id: string }>('reports'),
    profileVisits: createCollection<any & { _id: string }>('profileVisits'),
    sentGifts: createCollection<any & { _id: string }>('sentGifts'),
    pkMatchmakingQueue: createCollection<any & { _id: string }>('pkMatchmakingQueue'),
    pkInvitations: createCollection<ConvitePK & { _id: string }>('pkInvitations'),
    pkSettings: createCollection<PkSettings & { _id: string }>('pkSettings'),
    privateLiveInvites: createCollection<any & { _id: string }>('privateLiveInvites'),
    streamUserStats: createCollection<any & { _id: string }>('streamUserStats'),
    helpArticles: createCollection<ArtigoAjuda & { _id: string }>('helpArticles'),
    contactChannels: createCollection<CanalContato & { _id: string }>('contactChannels'),
    likes: createCollection<any & { _id: string }>('likes'),
    genders: createCollection<SelectableOption & { _id: string }>('genders'),
    countries: createCollection<SelectableOption & { _id: string }>('countries'),
    emotionalStates: createCollection<SelectableOption & { _id: string }>('emotionalStates'),
    professions: createCollection<SelectableOption & { _id: string }>('professions'),
    languages: createCollection<SelectableOption & { _id: string }>('languages'),
    securityLogs: createCollection<SecurityLogEntry & { _id: string }>('securityLogs'),
};