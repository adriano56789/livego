
import { mongoObjectId } from './mongoObjectId';
import type * as types from '../types';
import * as levelService from './levelService';

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
  last_camera_used: 'user' as types.FacingMode,
  country: 'BR',
  personalSignature: "",
  personalityTags: [],
  emotionalState: null,
  profession: null,
  languages: null,
  height: null,
  weight: null,
  pk_enabled_preference: true,
  declined_requests: [],
  settings: {
    notifications: { newMessages: true, streamerLive: true, followedPost: true, order: true, interactive: true },
    privacy: { showLocation: true, showActiveStatus: true, showInNearby: true, protectionEnabled: false },
    privateLiveInvite: { privateInvites: true, onlyFollowing: true, onlyFans: false, onlyFriends: false, acceptOnlyFriendPkInvites: false },
    giftNotifications: { enabledGifts: {} }
  }
};

const userDefinitions = [
    {
      _id: mongoObjectId(),
      id: 10755083,
      name: 'Você',
      email: 'livego@example.com',
      avatar_url: 'https://i.pravatar.cc/400?u=10755083',
      nickname: 'Seu Perfil',
      gender: 'male',
      birthday: '1995-05-15',
      has_uploaded_real_photo: true,
      has_completed_profile: true,
      invite_code: 'A1B2C3D4',
      following: [1, 2],
      wallet_diamonds: 50000,
      wallet_earnings: 0,
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
      declined_requests: [],
      settings: {
        notifications: { newMessages: true, streamerLive: true, followedPost: true, order: true, interactive: true },
        privacy: { showLocation: true, showActiveStatus: true, showInNearby: true, protectionEnabled: false },
        privateLiveInvite: { privateInvites: true, onlyFollowing: true, onlyFans: false, onlyFriends: false, acceptOnlyFriendPkInvites: false },
        giftNotifications: { enabledGifts: {} }
      }
    },
    {
      _id: mongoObjectId(),
      id: 1,
      name: 'Maria Silva',
      email: 'maria.silva@example.com',
      avatar_url: 'https://i.pravatar.cc/400?u=1',
      nickname: 'Maria Silva',
      gender: 'female',
      birthday: '1998-03-20',
      ...newUserTemplate,
      following: [10755083, 2],
    },
    {
      _id: mongoObjectId(),
      id: 2,
      name: 'João Souza',
      email: 'joao.souza@example.com',
      avatar_url: 'https://i.pravatar.cc/400?u=2',
      nickname: 'João Souza',
      gender: 'male',
      birthday: '1996-11-10',
      ...newUserTemplate,
    },
    {
      _id: mongoObjectId(),
      id: 3,
      name: 'Nova Conta',
      email: 'nova.conta@example.com',
      avatar_url: 'https://i.pravatar.cc/400?u=3',
      nickname: 'Nova Conta',
      gender: null,
      birthday: null,
      ...newUserTemplate,
      following: [10755083],
    },
    { _id: mongoObjectId(), id: 55218901, name: 'Streamer 1', nickname: 'Lest Go 500 K...', avatar_url: 'https://i.pravatar.cc/400?u=55218901', following: [10755083], xp: 0, country: 'BR', gender: 'male', birthday: '1990-01-01', settings: {}, is_avatar_protected: true, declined_requests: [] },
    { _id: mongoObjectId(), id: 66345102, name: 'Streamer 2', nickname: 'PK Queen', avatar_url: 'https://i.pravatar.cc/400?u=66345102', following: [], xp: 0, country: 'US', gender: 'female', birthday: '1998-10-20', settings: {}, declined_requests: [] },
    { _id: mongoObjectId(), id: 77123403, name: 'Streamer 3', nickname: 'Dancer Live', avatar_url: 'https://i.pravatar.cc/400?u=77123403', following: [], xp: 0, country: 'ES', gender: 'female', birthday: '2000-03-10', settings: {}, declined_requests: [] },
    { _id: mongoObjectId(), id: 88567804, name: 'Streamer 4', nickname: 'Music Lover', avatar_url: 'https://i.pravatar.cc/400?u=88567804', following: [], xp: 0, country: 'BR', gender: 'male', birthday: '1992-12-01', settings: {}, declined_requests: [] },
    { _id: mongoObjectId(), id: 99887705, name: 'PK Pro', nickname: 'PK Pro ⚡', avatar_url: 'https://i.pravatar.cc/400?u=99887705', following: [], xp: 0, country: 'US', coHostHistory: 'Co-host com Você', gender: 'male', birthday: '1994-08-25', settings: {}, declined_requests: [] },
    { _id: mongoObjectId(), id: 11223306, name: 'New Challenger', nickname: 'New Challenger', avatar_url: 'https://i.pravatar.cc/400?u=11223306', following: [], xp: 0, country: 'BR', coHostHistory: 'Última vez há 2 dias', gender: 'male', birthday: '2002-06-30', settings: {}, declined_requests: [] },
    { _id: mongoObjectId(), id: 999, name: 'Atendimento ao Cliente', nickname: 'Suporte LiveGo', avatar_url: 'https://storage.googleapis.com/genai-assets/LiveGoSupportAgent.png', following: [], xp: 999999, email: 'support@livego.com', gender: null, birthday: null, country: 'BR', settings: {}, declined_requests: [] }
];

const initialData: any = {
  users: userDefinitions.map((u: any) => ({
    ...u,
    following: u.following || [], // Ensure `following` is always an array
    declined_requests: u.declined_requests || [],
    level: levelService.calculateLevelFromXp(u.xp)
  })),
  liveStreams: [
    { _id: mongoObjectId(), id: 101, user_id: 55218901, titulo: "PK Challenge", nome_streamer: "Lest Go 500 K...", thumbnail_url: 'https://i.pravatar.cc/400?u=55218901', espectadores: 0, categoria: 'PK', ao_vivo: true, em_pk: true, is_private: false, entry_fee: null, meta: 'Evento de PK', inicio: new Date(), permite_pk: true, received_gifts_value: 0, like_count: 0, country_code: 'BR', camera_facing_mode: 'user', current_viewers: [] },
    { _id: mongoObjectId(), id: 102, user_id: 66345102, titulo: "Dance Party!", nome_streamer: "PK Queen", thumbnail_url: 'https://i.pravatar.cc/400?u=66345102', espectadores: 0, categoria: 'Dança', ao_vivo: true, em_pk: true, is_private: false, entry_fee: null, meta: 'Vem dançar!', inicio: new Date(), permite_pk: true, received_gifts_value: 0, like_count: 0, country_code: 'US', camera_facing_mode: 'user', current_viewers: [] },
    { _id: mongoObjectId(), id: 103, user_id: 77123403, titulo: "Música ao vivo", nome_streamer: "Dancer Live", thumbnail_url: 'https://i.pravatar.cc/400?u=77123403', espectadores: 0, categoria: 'Música', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: 'Cantando sucessos', inicio: new Date(), permite_pk: true, received_gifts_value: 0, like_count: 0, country_code: 'ES', camera_facing_mode: 'user', current_viewers: [] },
    { _id: mongoObjectId(), id: 104, user_id: 88567804, titulo: "Just Chatting", nome_streamer: "Music Lover", thumbnail_url: 'https://i.pravatar.cc/400?u=88567804', espectadores: 0, categoria: 'Popular', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: '', inicio: new Date(), permite_pk: true, received_gifts_value: 0, like_count: 0, country_code: 'BR', camera_facing_mode: 'user', current_viewers: [] },
    { _id: mongoObjectId(), id: 105, user_id: 99887705, titulo: "Sessão Privada", nome_streamer: "PK Pro ⚡", thumbnail_url: 'https://i.pravatar.cc/400?u=99887705', espectadores: 0, categoria: 'Privada', ao_vivo: true, em_pk: false, is_private: true, entry_fee: null, meta: 'Apenas para convidados', inicio: new Date(), permite_pk: false, received_gifts_value: 0, invited_users: [10755083], like_count: 0, country_code: 'US', camera_facing_mode: 'user', current_viewers: [] },
    { _id: mongoObjectId(), id: 106, user_id: 11223306, titulo: "Training for PK", nome_streamer: "New Challenger", thumbnail_url: 'https://i.pravatar.cc/400?u=11223306', espectadores: 0, categoria: 'Popular', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: 'Let\'s go!', inicio: new Date(), permite_pk: true, received_gifts_value: 0, like_count: 0, country_code: 'BR', camera_facing_mode: 'user', current_viewers: [] },
  ],
  conversations: [
    {
        _id: mongoObjectId(),
        id: 'convo-1',
        participants: [10755083, 55218901],
        last_message_text: 'Hey, great stream yesterday!',
        last_message_timestamp: new Date(Date.now() - 3600 * 1000),
        messages: [
            { id: 'msg-1-1', senderId: 55218901, type: 'text', text: 'Thanks for watching!', timestamp: new Date(Date.now() - 3600 * 1000 - 10000), status: 'seen', seenBy: [10755083, 55218901] },
            { id: 'msg-1-2', senderId: 10755083, type: 'text', text: 'Hey, great stream yesterday!', timestamp: new Date(Date.now() - 3600 * 1000), status: 'sent', seenBy: [10755083] }
        ]
    },
     {
        _id: mongoObjectId(),
        id: 'convo-2',
        participants: [10755083, 66345102],
        last_message_text: 'Thanks for the follow!',
        last_message_timestamp: new Date(Date.now() - 86400 * 1000 * 2),
        messages: [
             { id: 'msg-2-1', senderId: 66345102, type: 'text', text: 'Thanks for the follow!', timestamp: new Date(Date.now() - 86400 * 1000 * 2), status: 'sent', seenBy: [66345102] }
        ]
    }
  ],
  pkBattles: [
    {
      _id: mongoObjectId(),
      id: 201,
      streamer_A_id: 55218901,
      streamer_B_id: 66345102,
      pontuacao_A: 0,
      pontuacao_B: 0,
      status: 'ativa',
      data_inicio: new Date(Date.now() - 2 * 60000),
      data_fim: new Date(Date.now() + 3 * 60000),
      duracao_segundos: 300,
    }
  ],
  gifts: [
    { _id: mongoObjectId(), id: 1, name: 'Coração', price: 10, valor_pontos: 1, is_ativo: true, animationUrl: 'https://lottie.host/8e4414d7-208b-4309-8446-c2a4b8682a85/q3sAhc01qX.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/heart_gift.png' },
    { _id: mongoObjectId(), id: 2, name: 'Rosa', price: 20, valor_pontos: 2, is_ativo: true, animationUrl: 'https://lottie.host/7e2968a3-2287-4939-b939-f83193424168/vDAbQ562sY.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/rose_gift.png' },
    { _id: mongoObjectId(), id: 3, name: 'Foguete', price: 100, valor_pontos: 10, is_ativo: true, animationUrl: 'https://lottie.host/e211832f-a681-4357-893f-561b69735414/jV4mBv3h6i.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/rocket_gift.png' },
    { _id: mongoObjectId(), id: 4, name: 'Coroa', price: 500, valor_pontos: 50, is_ativo: true, animationUrl: 'https://lottie.host/f712499d-122e-436f-8255-66113b593018/k2yHRWJk7N.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/crown_gift.png' },
    { _id: mongoObjectId(), id: 5, name: 'Carro Esportivo', price: 1000, valor_pontos: 100, is_ativo: true, animationUrl: 'https://lottie.host/a0740939-2169-4258-a551-344c2111c1d8/u8j53sV9wV.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/car_gift.png' },
    { _id: mongoObjectId(), id: 6, name: 'Castelo', price: 5000, valor_pontos: 500, is_ativo: true, animationUrl: 'https://lottie.host/9902e86d-f39b-469b-8919-9c4281313e63/l4Xn4q93An.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/castle_gift.png' },
    { _id: mongoObjectId(), id: 7, name: 'Iate', price: 10000, valor_pontos: 1000, is_ativo: true, animationUrl: 'https://lottie.host/28b8c252-2518-48b4-9388-348574d64233/yT25s9Pz9x.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/yacht_gift.png' },
    { _id: mongoObjectId(), id: 8, name: 'Leão', price: 20000, valor_pontos: 2000, is_ativo: true, animationUrl: 'https://lottie.host/f70b4202-12f5-47e0-91a5-48b7a66b57e4/14G421Wk3L.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/lion_gift.png' },
  ],
  diamondPackages: [
    { _id: mongoObjectId(), id: 1, diamonds: 100, price: 1.99, currency: 'BRL' },
    { _id: mongoObjectId(), id: 2, diamonds: 500, price: 8.99, currency: 'BRL' },
    { _id: mongoObjectId(), id: 3, diamonds: 1000, price: 16.99, currency: 'BRL' },
    { _id: mongoObjectId(), id: 4, diamonds: 2000, price: 32.99, currency: 'BRL' },
    { _id: mongoObjectId(), id: 5, diamonds: 5000, price: 84.99, currency: 'BRL' },
    { _id: mongoObjectId(), id: 6, diamonds: 10000, price: 169.99, currency: 'BRL' },
  ],
  purchaseOrders: [
    {
      _id: mongoObjectId(),
      orderId: 'po-1',
      userId: 10755083,
      package: { id: 3, diamonds: 1000, price: 16.99, currency: 'BRL' },
      address: { street: 'Rua Exemplo', number: '123', neighborhood: 'Bairro Teste', city: 'São Paulo', postalCode: '01000-000' },
      paymentDetails: { method: 'card' },
      status: 'completed',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      _id: mongoObjectId(),
      orderId: 'po-2',
      userId: 10755083,
      package: { id: 5, diamonds: 5000, price: 84.99, currency: 'BRL' },
      address: { street: 'Rua Exemplo', number: '123', neighborhood: 'Bairro Teste', city: 'São Paulo', postalCode: '01000-000' },
      paymentDetails: { method: 'transfer' },
      status: 'pending',
      timestamp: new Date().toISOString(),
    }
  ],
  withdrawalTransactions: [],
  blockedUsers: [],
  protectedAvatars: [
    { _id: mongoObjectId(), hash: 'hash_https://i.pravatar.cc/400?u=55218901', userId: 55218901 }
  ],
  reports: [],
  profileVisits: [],
  sentGifts: [],
  pkMatchmakingQueue: [],
  pkInvitations: [],
  privateLiveInvites: [
    {
      _id: mongoObjectId(),
      inviterId: 99887705, // "PK Pro"
      inviteeId: 10755083, // "Você"
      streamId: 105, // PK Pro's private stream
      status: 'pending',
      timestamp: new Date().toISOString()
    }
  ],
  streamUserStats: [],
  helpArticles: [
    {
      _id: mongoObjectId(),
      id: 'faq',
      titulo: 'Perguntas Frequentes (FAQ)',
      conteudo: '<h2>O que é o LiveGo?</h2><p>LiveGo é uma plataforma de streaming para conectar criadores e fãs.</p><h2>Como ganho moedas?</h2><p>Você pode comprar moedas na loja ou recebê-las como presentes de seus espectadores durante as transmissões ao vivo.</p>',
      categoria: 'FAQ',
      ordem_exibicao: 1,
      visualizacoes: 123,
      is_ativo: true
    },
    {
      _id: mongoObjectId(),
      id: 'como-sacar',
      titulo: 'Como fazer um saque?',
      conteudo: '<h2>Passo a passo para sacar seus ganhos:</h2><ol><li>Vá para sua Carteira.</li><li>Selecione a aba "Ganhos".</li><li>Verifique se você tem um método de saque configurado.</li><li>Insira o valor que deseja sacar e confirme.</li></ol><p>O valor será processado e enviado para sua conta cadastrada em até 5 dias úteis.</p>',
      categoria: 'Artigos Úteis',
      ordem_exibicao: 1,
      visualizacoes: 45,
      is_ativo: true
    },
    {
      _id: mongoObjectId(),
      id: 'regras-comunidade',
      titulo: 'Regras da Comunidade',
      conteudo: '<h2>Nossas diretrizes:</h2><ul><li>Seja respeitoso com todos.</li><li>Não compartilhe conteúdo ilegal ou impróprio.</li><li>Não pratique spam ou assédio.</li></ul><p>Violações podem levar à suspensão da conta.</p>',
      categoria: 'Artigos Úteis',
      ordem_exibicao: 2,
      visualizacoes: 88,
      is_ativo: true
    }
  ],
  likes: [],
  pkSettings: [
      { _id: mongoObjectId(), userId: 55218901, durationSeconds: 300 },
      { _id: mongoObjectId(), userId: 66345102, durationSeconds: 300 },
  ],
};


// Deep clone for a resettable in-memory DB
let db = JSON.parse(JSON.stringify(initialData));

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
            return Object.entries(query).every(([key, value]) => {
                if (key === '$in') {
                     // @ts-ignore
                    return value.includes(doc[Object.keys(value)[0]]);
                }
                // @ts-ignore
                return doc[key] === value;
            });
        });
    },
    async findOne(query: any): Promise<T | null> {
        await delay(30);
        const collection = db[collectionName] as T[];
        return collection.find(doc => {
            return Object.entries(query).every(([key, value]) => {
                // @ts-ignore
                if (Array.isArray(value) && Array.isArray(doc[key])) {
                    // @ts-ignore
                    return value.every(v => doc[key].includes(v)) && value.length === doc[key].length;
                }
                // @ts-ignore
                return doc[key] === value;
            });
        }) || null;
    },
    async insertOne(doc: Omit<T, '_id'>): Promise<{ insertedId: string }> {
        await delay(40);
        const newDoc = { _id: mongoObjectId(), ...doc } as T;
        (db[collectionName] as T[]).push(newDoc);
        return { insertedId: newDoc._id };
    },
    async updateOne(query: any, update: any): Promise<{ modifiedCount: number }> {
        await delay(40);
        const collection = db[collectionName] as T[];
        const docIndex = collection.findIndex(doc => {
             return Object.entries(query).every(([key, value]) => {
                // @ts-ignore
                return doc[key] === value;
            });
        });

        if (docIndex > -1) {
            const docToUpdate = collection[docIndex];
            if (update.$set) {
                 for (const key in update.$set) {
                    if (key.includes('.')) {
                        setNestedValue(docToUpdate, key, update.$set[key]);
                    } else {
                        // @ts-ignore
                        docToUpdate[key] = update.$set[key];
                    }
                }
            }
            if (update.$push) {
                const [key, value] = Object.entries(update.$push)[0] as [string, any];
                // @ts-ignore
                if (!Array.isArray(docToUpdate[key])) {
                    // @ts-ignore
                    docToUpdate[key] = [];
                }
                // @ts-ignore
                docToUpdate[key].push(value);
            }
             if (update.$pull) {
                const [key, value] = Object.entries(update.$pull)[0] as [string, any];
                 // @ts-ignore
                if (Array.isArray(docToUpdate[key])) {
                     // @ts-ignore
                    docToUpdate[key] = docToUpdate[key].filter(item => item !== value);
                }
            }
            return { modifiedCount: 1 };
        }
        return { modifiedCount: 0 };
    },
     async deleteOne(query: any): Promise<{ deletedCount: number }> {
        await delay(40);
        const collection = db[collectionName] as any[];
        const initialLength = collection.length;
        db[collectionName] = collection.filter(doc => {
            return !Object.entries(query).every(([key, value]) => doc[key] === value);
        });
        return { deletedCount: initialLength - db[collectionName].length };
    },
});

type StoredUser = types.User & { _id: string; settings?: any; declined_requests: number[] };

export const database = {
    users: createCollection<StoredUser>('users'),
    liveStreams: createCollection<types.LiveStreamRecord & { _id: string }>('liveStreams'),
    conversations: createCollection<types.TabelaConversa & { _id: string; messages: any[] }>('conversations'),
    pkBattles: createCollection<types.TabelaBatalhaPK & { _id: string }>('pkBattles'),
    gifts: createCollection<types.Gift & { _id: string }>('gifts'),
    diamondPackages: createCollection<types.DiamondPackage & { _id: string }>('diamondPackages'),
    purchaseOrders: createCollection<types.PurchaseOrder & { _id: string }>('purchaseOrders'),
    withdrawalTransactions: createCollection<types.WithdrawalTransaction & { _id: string }>('withdrawalTransactions'),
    blockedUsers: createCollection<{ _id: string; blockerId: number; blockedId: number }>('blockedUsers'),
    protectedAvatars: createCollection<{ _id: string; hash: string; userId: number }>('protectedAvatars'),
    reports: createCollection<any & { _id: string }>('reports'),
    profileVisits: createCollection<{ _id: string; visitorId: number; visitedId: number; date: Date }>('profileVisits'),
    sentGifts: createCollection<types.LogPresenteEnviado & { _id: string }>('sentGifts'),
    pkMatchmakingQueue: createCollection<types.FilaPK & { _id: string }>('pkMatchmakingQueue'),
    pkInvitations: createCollection<types.ConvitePK & { _id: string }>('pkInvitations'),
    pkSettings: createCollection<types.PkSettings & { _id: string }>('pkSettings'),
    privateLiveInvites: createCollection<any & { _id: string }>('privateLiveInvites'),
    streamUserStats: createCollection<types.StreamUserStats & { _id: string }>('streamUserStats'),
    helpArticles: createCollection<types.ArtigoAjuda & { _id: string }>('helpArticles'),
    likes: createCollection<types.Like & { _id: string }>('likes'),
};