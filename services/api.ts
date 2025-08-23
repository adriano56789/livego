// This file contains the complete mock API server, including the in-memory database,
// routing logic, and all endpoint handlers. It fully simulates the backend.

import type * as types from '../types';
import * as levelService from './levelService';

// --- SIMULATED ENVIRONMENT VARIABLES ---
const SRS_URL_PUBLISH = 'rtmp://localhost/live';
const SRS_URL_PLAY_WEBRTC = 'webrtc://localhost/live';
const SRS_URL_PLAY_HLS = 'http://localhost:8080/live';

// A simple helper to map DB records to frontend view models
const mapLiveRecordToStream = (record: types.LiveStreamRecord): types.Stream => ({
    id: record.id,
    userId: record.user_id,
    titulo: record.titulo,
    nomeStreamer: record.nome_streamer,
    thumbnailUrl: record.thumbnail_url,
    espectadores: record.espectadores,
    categoria: record.categoria,
    aoVivo: record.ao_vivo,
    emPk: record.em_pk,
    isPrivate: record.is_private,
    entryFee: record.entry_fee,
    meta: record.meta,
    inicio: record.inicio,
    permitePk: record.permite_pk,
    countryCode: record.country_code,
    cameraFacingMode: record.camera_facing_mode,
});

const regions: types.Region[] = [
    { name: 'Global', code: 'global' },
    { name: 'Brasil', code: 'BR' },
    { name: 'Colômbia', code: 'CO' },
    { name: 'EUA', code: 'US' },
    { name: 'México', code: 'MX' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Espanha', code: 'ES' },
    { name: 'Filipinas', code: 'PH' },
    { name: 'Vietnã', code: 'VN' },
    { name: 'Índia', code: 'IN' },
    { name: 'Rússia', code: 'RU' },
    { name: 'Canadá', code: 'CA' },
];

const calculateAge = (birthday: string | null): number | null => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// --- MOCK DATABASE ---
const initialState = {
  users: [
    {
      id: 10755083,
      name: 'Você',
      email: 'livego@example.com',
      avatar_url: 'https://i.pravatar.cc/400?u=10755083',
      nickname: 'Seu Perfil',
      gender: 'male' as types.Gender,
      birthday: '1995-05-15',
      has_uploaded_real_photo: true,
      has_completed_profile: true,
      is_avatar_protected: false,
      invite_code: 'A1B2C3D4',
      following: [55218901, 66345102, 77123403, 99887705, 11223306],
      followers: 2200,
      visitors: 150,
      wallet_diamonds: 500,
      wallet_earnings: 12500000,
      withdrawal_method: null,
      level: 5,
      xp: 1800,
      last_camera_used: 'user' as types.FacingMode,
      country: 'BR' as types.User['country'],
      personalSignature: "Apenas boas vibrações!",
      personalityTags: [{id: 'gamer', label: 'Gamer'}, {id: 'music', label: 'Música'}],
      emotionalState: null,
      profession: null,
      languages: null,
      height: null,
      weight: null,
      pk_enabled_preference: true,
    },
    { 
        id: 55218901, 
        name: 'Streamer 1', 
        nickname: 'Lest Go 500 K...', 
        avatar_url: 'https://i.pravatar.cc/400?u=55218901', 
        following: [10755083], 
        followers: 680460, 
        visitors: 12345, 
        wallet_diamonds: 10000, 
        wallet_earnings: 500000, 
        level: 25, 
        xp: 40000, 
        country: 'BR', 
        is_avatar_protected: true,
        gender: 'male' as types.Gender,
        birthday: '1990-01-01',
        personalSignature: 'Rumo ao topo! Junte-se à minha jornada e vamos nos divertir.',
        personalityTags: [{id: 'pro_player', label: 'Pro Player'}, {id: 'competitive', label: 'Competitivo'}, {id: 'funny', label: 'Engraçado'}],
        emotionalState: 'happy',
        profession: 'streamer',
        languages: ['pt-br'],
        height: 180,
        weight: 75
    },
    { id: 66345102, name: 'Streamer 2', nickname: 'PK Queen', avatar_url: 'https://i.pravatar.cc/400?u=66345102', following: [10755083], followers: 120000, visitors: 6789, wallet_diamonds: 5000, wallet_earnings: 250000, level: 18, xp: 25000, country: 'US', gender: 'female', birthday: '1998-10-20' },
    { id: 77123403, name: 'Streamer 3', nickname: 'Dancer Live', avatar_url: 'https://i.pravatar.cc/400?u=77123403', following: [], followers: 50000, visitors: 1234, wallet_diamonds: 2000, wallet_earnings: 100000, level: 12, xp: 15000, country: 'ES', gender: 'female', birthday: '2000-03-10' },
    { id: 88567804, name: 'Streamer 4', nickname: 'Music Lover', avatar_url: 'https://i.pravatar.cc/400?u=88567804', following: [], followers: 80000, visitors: 567, wallet_diamonds: 3000, wallet_earnings: 150000, level: 15, xp: 20000, country: 'BR', gender: 'male', birthday: '1992-12-01' },
    { id: 99887705, name: 'PK Pro', nickname: 'PK Pro ⚡', avatar_url: 'https://i.pravatar.cc/400?u=99887705', following: [10755083], followers: 95000, visitors: 876, wallet_diamonds: 4000, wallet_earnings: 180000, level: 16, xp: 22000, country: 'US', coHostHistory: 'Co-host com Você', gender: 'male', birthday: '1994-08-25' },
    { id: 11223306, name: 'New Challenger', nickname: 'New Challenger', avatar_url: 'https://i.pravatar.cc/400?u=11223306', following: [], followers: 10000, visitors: 432, wallet_diamonds: 500, wallet_earnings: 5000, level: 5, xp: 1500, country: 'BR', coHostHistory: 'Última vez há 2 dias', gender: 'male', birthday: '2002-06-30' },
    { 
        id: 999,
        name: 'Atendimento ao Cliente', 
        nickname: 'Suporte LiveGo', 
        avatar_url: 'https://storage.googleapis.com/genai-assets/LiveGoSupportAgent.png', 
        following: [], 
        followers: 0, 
        visitors: 0, 
        wallet_diamonds: 0, 
        wallet_earnings: 0, 
        level: 99, 
        xp: 999999,
        email: 'support@livego.com',
        gender: null,
        birthday: null,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        country: 'BR'
    },
  ],
  lives: [
      { id: 101, user_id: 55218901, titulo: "PK Challenge", nome_streamer: "Lest Go 500 K...", thumbnail_url: 'https://i.pravatar.cc/400?u=55218901', espectadores: 6804, categoria: 'PK', ao_vivo: true, em_pk: true, is_private: false, entry_fee: null, meta: 'Evento de PK', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 12500, like_count: 12800, country_code: 'BR', camera_facing_mode: 'user' },
      { id: 102, user_id: 66345102, titulo: "Dance Party!", nome_streamer: "PK Queen", thumbnail_url: 'https://i.pravatar.cc/400?u=66345102', espectadores: 1205, categoria: 'Dança', ao_vivo: true, em_pk: true, is_private: false, entry_fee: null, meta: 'Vem dançar!', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 8300, like_count: 3200, country_code: 'US', camera_facing_mode: 'user' },
      { id: 103, user_id: 77123403, titulo: "Música ao vivo", nome_streamer: "Dancer Live", thumbnail_url: 'https://i.pravatar.cc/400?u=77123403', espectadores: 523, categoria: 'Música', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: 'Cantando sucessos', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 4100, like_count: 980, country_code: 'ES', camera_facing_mode: 'user' },
      { id: 104, user_id: 88567804, titulo: "Just Chatting", nome_streamer: "Music Lover", thumbnail_url: 'https://i.pravatar.cc/400?u=88567804', espectadores: 850, categoria: 'Popular', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: '', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 6200, like_count: 1500, country_code: 'BR', camera_facing_mode: 'user' },
      { id: 105, user_id: 99887705, titulo: "Sessão Privada", nome_streamer: "PK Pro ⚡", thumbnail_url: 'https://i.pravatar.cc/400?u=99887705', espectadores: 1, categoria: 'Privada', ao_vivo: true, em_pk: false, is_private: true, entry_fee: null, meta: 'Apenas para convidados', inicio: new Date().toISOString(), permite_pk: false, received_gifts_value: 1500, invited_users: [10755083], like_count: 50, country_code: 'US', camera_facing_mode: 'user' },
      { id: 106, user_id: 11223306, titulo: "Training for PK", nome_streamer: "New Challenger", thumbnail_url: 'https://i.pravatar.cc/400?u=11223306', espectadores: 50, categoria: 'Popular', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: 'Let\'s go!', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 200, like_count: 120, country_code: 'BR', camera_facing_mode: 'user' },
  ] as types.LiveStreamRecord[],
  chatMessages: {} as Record<string, types.ChatMessage[]>,
  pkBattles: [
      {
        id: 201,
        streamer_A_id: 55218901,
        streamer_B_id: 66345102,
        pontuacao_A: Math.floor(Math.random() * 50000),
        pontuacao_B: Math.floor(Math.random() * 50000),
        status: 'ativa',
        data_inicio: new Date(Date.now() - 2 * 60000).toISOString(),
        data_fim: new Date(Date.now() + 3 * 60000).toISOString(),
        duracao_segundos: 300,
      }
  ] as types.TabelaBatalhaPK[],
  pkInvitations: [] as types.ConvitePK[],
  privateLiveInvites: [] as any[],
  sentGifts: [] as types.LogPresenteEnviado[],
  profileVisits: [
    { id: 'v1', visitante_id: 55218901, perfil_visitado_id: 10755083, data_visita: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'v2', visitante_id: 66345102, perfil_visitado_id: 10755083, data_visita: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { id: 'v3', visitante_id: 77123403, perfil_visitado_id: 10755083, data_visita: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    { id: 'v4', visitante_id: 10755083, perfil_visitado_id: 55218901, data_visita: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  ] as types.VisitaPerfil[],
  conversations: [
    {
      id: 'convo-1',
      participantes: [10755083, 55218901],
      ultima_mensagem_texto: 'Hey, great stream yesterday!',
      ultima_mensagem_timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
    {
      id: 'convo-2',
      participantes: [10755083, 66345102],
      ultima_mensagem_texto: 'Thanks for the follow!',
      ultima_mensagem_timestamp: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
    }
  ] as types.TabelaConversa[],
  messages: [
    // Convo 1
    {
      id: 'msg-1-1',
      conversa_id: 'convo-1',
      remetente_id: 55218901,
      conteudo: 'Thanks for watching!',
      timestamp: new Date(Date.now() - 3600 * 1000 - 10000).toISOString(),
      tipo_conteudo: 'texto',
      status_leitura: { 10755083: true, 55218901: true },
    },
    {
      id: 'msg-1-2',
      conversa_id: 'convo-1',
      remetente_id: 10755083,
      conteudo: 'Hey, great stream yesterday!',
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      tipo_conteudo: 'texto',
      status_leitura: { 10755083: true, 55218901: false },
    },
     // Convo 2 (with unread for current user)
    {
      id: 'msg-2-1',
      conversa_id: 'convo-2',
      remetente_id: 66345102,
      conteudo: 'Thanks for the follow!',
      timestamp: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
      tipo_conteudo: 'texto',
      status_leitura: { 10755083: false, 66345102: true },
    },
  ] as types.TabelaMensagem[],
  gifts: [
    { id: 1, name: 'Coração', price: 10, valor_pontos: 1, is_ativo: true, animationUrl: 'https://lottie.host/8e4414d7-208b-4309-8446-c2a4b8682a85/q3sAhc01qX.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/heart_gift.png' },
    { id: 2, name: 'Rosa', price: 20, valor_pontos: 2, is_ativo: true, animationUrl: 'https://lottie.host/7e2968a3-2287-4939-b939-f83193424168/vDAbQ562sY.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/rose_gift.png' },
    { id: 3, name: 'Foguete', price: 100, valor_pontos: 10, is_ativo: true, animationUrl: 'https://lottie.host/e211832f-a681-4357-893f-561b69735414/jV4mBv3h6i.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/rocket_gift.png' },
    { id: 4, name: 'Coroa', price: 500, valor_pontos: 50, is_ativo: true, animationUrl: 'https://lottie.host/f712499d-122e-436f-8255-66113b593018/k2yHRWJk7N.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/crown_gift.png' },
    { id: 5, name: 'Carro Esportivo', price: 1000, valor_pontos: 100, is_ativo: true, animationUrl: 'https://lottie.host/a0740939-2169-4258-a551-344c2111c1d8/u8j53sV9wV.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/car_gift.png' },
    { id: 6, name: 'Castelo', price: 5000, valor_pontos: 500, is_ativo: true, animationUrl: 'https://lottie.host/9902e86d-f39b-469b-8919-9c4281313e63/l4Xn4q93An.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/castle_gift.png' },
    { id: 7, name: 'Iate', price: 10000, valor_pontos: 1000, is_ativo: true, animationUrl: 'https://lottie.host/28b8c252-2518-48b4-9388-348574d64233/yT25s9Pz9x.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/yacht_gift.png' },
    { id: 8, name: 'Leão', price: 20000, valor_pontos: 2000, is_ativo: true, animationUrl: 'https://lottie.host/f70b4202-12f5-47e0-91a5-48b7a66b57e4/14G421Wk3L.json', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/lion_gift.png' },
  ],
  diamondPackages: [
    { id: 1, diamonds: 100, price: 1.99, currency: 'BRL' },
    { id: 2, diamonds: 500, price: 8.99, currency: 'BRL' },
    { id: 3, diamonds: 1000, price: 16.99, currency: 'BRL' },
    { id: 4, diamonds: 2000, price: 32.99, currency: 'BRL' },
    { id: 5, diamonds: 5000, price: 84.99, currency: 'BRL' },
    { id: 6, diamonds: 10000, price: 169.99, currency: 'BRL' },
  ] as types.DiamondPackage[],
  purchaseOrders: [] as types.PurchaseOrder[],
  withdrawalTransactions: [] as types.WithdrawalTransaction[],
  blockedUsers: [] as { blockerId: number, targetId: number }[],
  notificationSettings: [
    {
      userId: 10755083,
      newMessages: true,
      streamerLive: true,
      followedPost: true,
      order: true,
      interactive: true,
    }
  ] as types.NotificationSettings[],
  protectedAvatars: [
    { hash: 'hash_https://i.pravatar.cc/400?u=55218901', userId: 55218901 }
  ] as { hash: string; userId: number }[],
  connectedAccounts: [
    { userId: 10755083, provider: 'google', email: 'livego@example.com', accountId: 'some-google-id-123' }
  ],
  privateLiveInviteSettings: [
    {
        userId: 10755083,
        privateInvites: true,
        onlyFollowing: true,
        onlyFans: false,
        onlyFriends: false,
        acceptOnlyFriendPkInvites: false,
    }
  ],
  pkMatchmakingQueue: [] as types.FilaPK[],
  reports: [] as types.Denuncia[],
};


// In-memory database
let db = JSON.parse(JSON.stringify(initialState));

export function getRawDb() {
  return db;
}

// Helper to build a full Conversation view model
const buildConversationViewModel = (convoRecord: types.TabelaConversa, currentUserId: number): types.Conversation => {
    const otherUserId = convoRecord.participantes.find(pId => pId !== currentUserId)!;
    const otherUser = db.users.find((u: types.User) => u.id === otherUserId)!;

    const messagesForConvo = db.messages
        .filter((m: types.TabelaMensagem) => m.conversa_id === convoRecord.id)
        .sort((a: types.TabelaMensagem, b: types.TabelaMensagem) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((m: types.TabelaMensagem): types.ConversationMessage => ({
            id: m.id,
            senderId: m.remetente_id,
            type: m.remetente_id === -1 ? 'system' : m.tipo_conteudo === 'texto' ? 'text' : 'image',
            text: m.tipo_conteudo === 'texto' ? m.conteudo : null,
            imageUrl: m.tipo_conteudo === 'imagem' ? m.conteudo : null,
            timestamp: m.timestamp,
            status: Object.values(m.status_leitura).every(Boolean) ? 'seen' : 'sent',
            seenBy: Object.keys(m.status_leitura).filter(k => m.status_leitura[k as any]).map(Number),
        }));
    
    const unreadCount = messagesForConvo.filter(m => m.senderId === otherUserId && !m.seenBy.includes(currentUserId)).length;

    return {
        id: convoRecord.id,
        type: 'chat',
        participants: convoRecord.participantes,
        otherUserId: otherUserId,
        otherUserName: otherUser.nickname || otherUser.name,
        otherUserAvatarUrl: otherUser.avatar_url || '',
        unreadCount,
        messages: messagesForConvo,
    };
};

// Function to initialize chat with some content if it's empty
const initializeChatForLive = (liveId: number | string) => {
    if (!db.chatMessages[liveId] || db.chatMessages[liveId].length === 0) {
        const live = db.lives.find((l: types.LiveStreamRecord) => l.id === liveId);
        if (live) {
            const streamer = db.users.find((u: types.User) => u.id === live.user_id);
            db.chatMessages[liveId] = [
                {
                    id: Date.now() - 10000,
                    type: 'announcement',
                    username: 'System',
                    userId: 0,
                    message: `Bem-vindo à live de ${streamer?.nickname || 'streamer'}!`,
                    timestamp: new Date(Date.now() - 10000).toISOString(),
                }
            ];
        } else {
             db.chatMessages[liveId] = [];
        }
    }
};

// Helper function to generate mock ranking data
const generateMockRankingUsers = (count: number, scoreMultiplier: number): types.UniversalRankingUser[] => {
    return db.users
        .filter((u: types.User) => u.id !== 999 && u.id !== 10755083) // Exclude system and self
        .slice(0, count)
        .map((user: types.User, index: number) => {
            const badges: { type: 'flag' | 'v_badge' | 'gender' | 'level', value: string | number }[] = [
                { type: 'flag', value: user.country === 'BR' ? '🇧🇷' : '🇺🇸' },
                ...(user.is_avatar_protected ? [{ type: 'v_badge' as const, value: 'V' }] : []),
                { type: 'level', value: user.level },
                ...(user.gender ? [{ type: 'gender' as const, value: user.gender }] : []),
            ];
            return {
                rank: index + 1,
                userId: user.id,
                avatarUrl: user.avatar_url || '',
                name: user.nickname || user.name,
                score: Math.floor((10 - index) * scoreMultiplier * (Math.random() * 0.5 + 0.8)),
                level: user.level,
                gender: user.gender,
                badges,
            };
        })
        .sort((a, b) => b.score - a.score)
        .map((u, i) => ({ ...u, rank: i + 1 }));
};

// Helper to get a user object with dynamically calculated stats
const getDynamicUser = (userId: number): types.User | undefined => {
    const user = db.users.find((u: types.User) => u.id === userId);
    if (!user) {
        return undefined;
    }

    // Calculate dynamic "followers" count
    const followersCount = db.users.filter((u: types.User) => (u.following || []).includes(userId)).length;

    // Calculate dynamic "visitors" count for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentVisitors = db.profileVisits.filter((v: types.VisitaPerfil) => 
        v.perfil_visitado_id === userId && new Date(v.data_visita) > sevenDaysAgo
    );
    const uniqueVisitorIds = new Set(recentVisitors.map((v: types.VisitaPerfil) => v.visitante_id));
    const visitorsCount = uniqueVisitorIds.size;

    return {
        ...user,
        followers: followersCount,
        visitors: visitorsCount,
    };
}


// Router function that simulates a backend API
export const handleApiRequest = async (method: string, path: string, body: any, query: URLSearchParams): Promise<any> => {
  console.log(`[Mock API] Handling: ${method} ${path}`);
  
  const notFound = () => { throw new Error(`Endpoint ${method} ${path} não encontrado`); };

  const filterByRegion = (lives: types.LiveStreamRecord[]): types.LiveStreamRecord[] => {
    const region = query.get('region');
    if (region && region.toLowerCase() !== 'global') {
        return lives.filter(l => l.country_code === region);
    }
    return lives;
  };

  if (method === 'GET' && path === '/api/regions') {
    return regions;
  }
  
  if (method === 'POST' && path === '/api/users/location-preference') {
    const { userId, accuracy } = body;
    console.log(`[Mock API] User ${userId} saved location preference: ${accuracy}`);
    // No actual state change is needed in the mock DB for this,
    // just acknowledging the call is enough to fix the error.
    return { success: true };
  }
  
    if (method === 'GET' && path === '/api/lives/nearby') {
        const userId = query.get('userId') ? parseInt(query.get('userId')!, 10) : null;
        if (!userId) {
            throw new Error("userId is required for nearby streams");
        }
        
        // Simulate nearby by returning all live streams except the user's own, shuffled.
        const otherLives = db.lives.filter((l: types.LiveStreamRecord) => l.ao_vivo && l.user_id !== userId);
        const shuffled = otherLives.sort(() => 0.5 - Math.random());
        
        return shuffled.map(mapLiveRecordToStream);
    }

    if (method === 'POST' && path === '/api/chat/private/get-or-create') {
        const { currentUserId, otherUserId } = body;

        let convoRecord = db.conversations.find((c: types.TabelaConversa) => 
            c.participantes.sort().join(',') === [currentUserId, otherUserId].sort().join(',')
        );

        if (!convoRecord) {
            console.log(`[Mock API] Creating new conversation between ${currentUserId} and ${otherUserId}`);
            convoRecord = {
                id: `convo-${currentUserId}-${otherUserId}-${Date.now()}`,
                participantes: [currentUserId, otherUserId],
                ultima_mensagem_texto: "", // Start with no message
                ultima_mensagem_timestamp: new Date().toISOString(),
            };
            db.conversations.push(convoRecord);
        } else {
            console.log(`[Mock API] Found existing conversation: ${convoRecord.id}`);
        }
        
        return buildConversationViewModel(convoRecord, currentUserId);
    }

  // Use regex for paths with params
  const liveListMatch = path.match(/^\/api\/lives$/);
  const liveByIdMatch = path.match(/^\/api\/lives\/(\d+)$/);
  const flipCameraMatch = path.match(/^\/api\/lives\/(\d+)\/flip-camera$/);
  const liveSummaryMatch = path.match(/^\/api\/lives\/(\d+)\/summary$/);
  const viewersMatch = path.match(/^\/api\/lives\/(\d+)\/viewers$/);
  const privateInviteMatch = path.match(/^\/api\/lives\/(\d+)\/invite$/);
  const privateInviteCancelMatch = path.match(/^\/api\/lives\/(\d+)\/cancel-invite$/);
  const userPendingInvitesMatch = path.match(/^\/api\/users\/(\d+)\/pending-invites$/);
  const chatMatch = path.match(/^\/api\/chat\/live\/(\d+)$/);
  const likeMatch = path.match(/^\/api\/lives\/(\d+)\/like$/);
  const giftMatch = path.match(/^\/api\/lives\/(\d+)\/gift$/);
  const joinLeaveMatch = path.match(/^\/api\/lives\/(\d+)\/(join|leave)$/);
  const findPkForStreamMatch = path.match(/^\/api\/streams\/(\d+)\/batalha-pk$/);
  const getPkBattleMatch = path.match(/^\/api\/pk-battles\/(\d+)$/);
  const endPkBattleMatch = path.match(/^\/api\/pk-battles\/(\d+)\/end$/);
  const getActivePkBattleMatch = path.match(/^\/api\/batalhas-pk\/(.+)$/);
  const pendingPkInvitesMatch = path.match(/^\/api\/pk\/invites\/pending\/(\d+)$/);
  const pkInviteStatusMatch = path.match(/^\/api\/pk\/invites\/status\/(.+)$/);
  const pkInviteAcceptMatch = path.match(/^\/api\/pk\/invites\/(.+)\/accept$/);
  const pkInviteDeclineMatch = path.match(/^\/api\/pk\/invites\/(.+)\/decline$/);
  const pkInviteCancelMatch = path.match(/^\/api\/pk\/invites\/(.+)\/cancel$/);
  const helpArticlesMatch = path.match(/^\/api\/help\/articles$/);
  const helpArticleByIdMatch = path.match(/^\/api\/help\/articles\/(.+)$/);
  const userConversationsMatch = path.match(/^\/api\/users\/(\d+)\/conversations$/);
  const privateChatMatch = path.match(/^\/api\/chat\/private\/(.+)$/);
  const avatarStatusMatch = path.match(/^\/api\/avatar\/protection\/status\/(\d+)$/);
  const userPreferencesMatch = path.match(/^\/api\/users\/(\d+)\/live-preferences$/);
  const supportConvoMatch = path.match(/^\/api\/support\/conversation\/(\d+)$/);
  const supportMessageMatch = path.match(/^\/api\/support\/messages$/);
  const userSearchMatch = path.match(/^\/api\/users\/search$/);
  const avatarCheckMatch = path.match(/^\/api\/avatar\/protection\/check$/);
  const streamerRankingMatch = path.match(/^\/api\/ranking\/streamers$/);
  const userRankingMatch = path.match(/^\/api\/ranking\/users$/);
  const friendRequestsMatch = path.match(/^\/api\/users\/(\d+)\/friend-requests$/);
  const liveRankingMatch = path.match(/^\/api\/lives\/(\d+)\/ranking$/);
  const userGiftsReceivedMatch = path.match(/^\/api\/users\/(\d+)\/gifts\/received$/);
  const userGiftsSentMatch = path.match(/^\/api\/users\/(\d+)\/gifts\/sent$/);
  const userPurchaseHistoryMatch = path.match(/^\/api\/users\/(\d+)\/purchase-history$/);
  const pkOpponentsMatch = path.match(/^\/api\/pk\/opponents\/(\d+)$/);
  const matchmakingStatusMatch = path.match(/^\/api\/pk\/matchmaking\/status\/(\d+)$/);

  // New Matchers for refactoring
  const blocksMatch = path.match(/^\/api\/blocks$/);
  const blocksWithIdsMatch = path.match(/^\/api\/blocks\/(\d+)\/(\d+)$/);
  const followsMatch = path.match(/^\/api\/follows$/);
  const followsWithIdsMatch = path.match(/^\/api\/follows\/(\d+)\/(\d+)$/);
  
  // New matchers for settings screen
  const connectedAccountsMatch = path.match(/^\/api\/users\/(\d+)\/connected-accounts$/);
  const earningsInfoMatch = path.match(/^\/api\/users\/(\d+)\/earnings$/);
  const privateLiveSettingsMatch = path.match(/^\/api\/users\/(\d+)\/private-live-invite-settings$/);
  const notificationSettingsMatch = path.match(/^\/api\/users\/(\d+)\/notification-settings$/);
  const withdrawalBalanceMatch = path.match(/^\/api\/users\/(\d+)\/withdrawal-balance$/);
  const userWithdrawalHistoryMatch = path.match(/^\/api\/users\/(\d+)\/withdrawal-history$/);
  const userCohostFriendsMatch = path.match(/^\/api\/users\/(\d+)\/cohost-friends$/);
  const stopLiveMatch = path.match(/^\/api\/users\/(\d+)\/stop-live$/);
  const userPrivacySettingsMatch = path.match(/^\/api\/users\/(\d+)\/privacy-settings$/);

  // --- NEW HANDLERS ---
    if (method === 'POST' && path === '/api/live/start') {
        const { userId, title, meta, category, isPrivate, isPkEnabled, thumbnailUrl, entryFee, cameraUsed } = body;
        const user = db.users.find((u: any) => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        const newLiveStreamRecord: types.LiveStreamRecord = {
            id: Math.floor(1000 + Math.random() * 9000),
            user_id: userId,
            titulo: title,
            nome_streamer: user.nickname || user.name,
            thumbnail_url: thumbnailUrl,
            espectadores: 0,
            categoria: category,
            ao_vivo: true,
            em_pk: false,
            is_private: isPrivate,
            entry_fee: entryFee || null,
            meta: meta,
            inicio: new Date().toISOString(),
            permite_pk: isPkEnabled,
            camera_facing_mode: cameraUsed,
            country_code: user.country,
            like_count: 0,
            received_gifts_value: 0
        };

        db.lives.push(newLiveStreamRecord);
        
        user.last_camera_used = cameraUsed;
        user.last_selected_category = category;

        const response: types.StartLiveResponse = {
            live: mapLiveRecordToStream(newLiveStreamRecord),
            urls: {
                rtmp: `${SRS_URL_PUBLISH}/${newLiveStreamRecord.id}`,
                hls: `${SRS_URL_PLAY_HLS}/${newLiveStreamRecord.id}.m3u8`,
                webrtc: `${SRS_URL_PLAY_WEBRTC}/${newLiveStreamRecord.id}`,
                streamKey: `sk_${newLiveStreamRecord.id}_${Math.random().toString(36).substring(7)}`,
            },
        };

        return response;
    }

    if (method === 'POST' && path === '/api/avatar/protection/block-attempt') {
        const { userId, avatarImage } = body;
        console.log(`[Mock API] Block attempt logged for user ${userId} trying to use image: ${avatarImage.substring(0, 30)}...`);
        return { success: true };
    }

    if (method === 'POST' && path === '/api/reports/user') {
        const { reporterId, reportedId } = body;
        const report: types.Denuncia = {
            id: `report-${Date.now()}`,
            usuario_denunciante_id: reporterId,
            usuario_denunciado_id: String(reportedId),
            motivo_denuncia: 'User Report from Profile/Chat',
            comentarios: 'No details provided.',
            status_revisao: 'Pendente',
            data_denuncia: new Date().toISOString(),
        };
        db.reports.push(report);
        console.log(`[Mock API] User report received from ${reporterId} against ${reportedId}`);
        return { success: true };
    }

    if (pkOpponentsMatch && method === 'GET') {
        const userId = parseInt(pkOpponentsMatch[1], 10);
        const user = db.users.find((u: types.User) => u.id === userId);
        if (!user) return [];
        // Return friends who are currently live
        const friends = db.users.filter((u: any) => 
            (user.following || []).includes(u.id) && 
            (u.following || []).includes(userId) &&
            db.lives.some((l: types.LiveStreamRecord) => l.user_id === u.id && l.ao_vivo)
        );
        return friends;
    }

    if (method === 'POST' && path === '/api/pk/cohost-invite') {
        const { inviterId, inviteeId } = body;
        const streamerA = db.users.find((u: types.User) => u.id === inviterId);
        const streamerB = db.users.find((u: types.User) => u.id === inviteeId);
        const streamA = db.lives.find((l: types.LiveStreamRecord) => l.user_id === inviterId && l.ao_vivo);
        const streamB = db.lives.find((l: types.LiveStreamRecord) => l.user_id === inviteeId && l.ao_vivo);
        if (!streamerA || !streamerB || !streamA || !streamB) {
            throw new Error("One or both users are not live and cannot battle.");
        }
        
        const newBattle: types.TabelaBatalhaPK = {
            id: `pk-${Date.now()}`,
            streamer_A_id: inviterId,
            streamer_B_id: inviteeId,
            pontuacao_A: 0,
            pontuacao_B: 0,
            status: 'ativa',
            data_inicio: new Date().toISOString(),
            data_fim: new Date(Date.now() + 300 * 1000).toISOString(), // 5 mins
            duracao_segundos: 300,
        };
        db.pkBattles.push(newBattle);
        streamA.em_pk = true;
        streamB.em_pk = true;

        const battleViewModel: types.PkBattle = {
            id: newBattle.id as any,
            title: "Batalha Épica",
            streamer1: { userId: streamerA.id, streamId: streamA.id, name: streamerA.nickname || streamerA.name, score: 0, avatarUrl: streamerA.avatar_url!, isVerified: true, countryCode: streamerA.country },
            streamer2: { userId: streamerB.id, streamId: streamB.id, name: streamerB.nickname || streamerB.name, score: 0, avatarUrl: streamerB.avatar_url!, isVerified: false, countryCode: streamerB.country }
        };

        return battleViewModel;
    }

    if (pendingPkInvitesMatch && method === 'GET') {
        const userId = parseInt(pendingPkInvitesMatch[1], 10);
        const now = new Date();
        const invite = db.pkInvitations.find((inv: types.ConvitePK) => inv.destinatario_id === userId && inv.status === 'pendente' && new Date(inv.data_expiracao) > now);
        return invite || null;
    }
    
    if (pkInviteStatusMatch && method === 'GET') {
        const inviteId = pkInviteStatusMatch[1];
        const invite = db.pkInvitations.find((inv: types.ConvitePK) => inv.id === inviteId);
        if (!invite) return notFound();
        let battle: types.PkBattle | null = null;
        if (invite.status === 'aceito' && invite.batalha_id) {
             const battleRecord = db.pkBattles.find((b: types.TabelaBatalhaPK) => b.id === invite.batalha_id);
             if(battleRecord) {
                const streamerA = db.users.find((u: types.User) => u.id === battleRecord.streamer_A_id)!;
                const streamerB = db.users.find((u: types.User) => u.id === battleRecord.streamer_B_id)!;
                const streamA = db.lives.find((l: types.LiveStreamRecord) => l.user_id === streamerA.id && l.ao_vivo)!;
                const streamB = db.lives.find((l: types.LiveStreamRecord) => l.user_id === streamerB.id && l.ao_vivo)!;
                battle = {
                    id: battleRecord.id as any,
                    title: "Batalha Épica",
                    streamer1: { userId: streamerA.id, streamId: streamA.id, name: streamerA.nickname || streamerA.name, score: battleRecord.pontuacao_A, avatarUrl: streamerA.avatar_url!, isVerified: true, countryCode: streamerA.country },
                    streamer2: { userId: streamerB.id, streamId: streamB.id, name: streamerB.nickname || streamerB.name, score: battleRecord.pontuacao_B, avatarUrl: streamerB.avatar_url!, isVerified: false, countryCode: streamerB.country }
                };
             }
        }
        return { invitation: invite, battle };
    }

    if (pkInviteAcceptMatch && method === 'POST') {
        const inviteId = pkInviteAcceptMatch[1];
        const invite = db.pkInvitations.find((inv: types.ConvitePK) => inv.id === inviteId);
        if (!invite || invite.status !== 'pendente') throw new Error("Convite inválido ou já respondido.");
        
        invite.status = 'aceito';
        
        const battle = await handleApiRequest('POST', '/api/pk/cohost-invite', { inviterId: invite.remetente_id, inviteeId: invite.destinatario_id }, new URLSearchParams());
        invite.batalha_id = battle.id;

        return { battle };
    }
    
    if (pkInviteDeclineMatch && method === 'POST') {
        const inviteId = pkInviteDeclineMatch[1];
        const invite = db.pkInvitations.find((inv: types.ConvitePK) => inv.id === inviteId);
        if (invite) invite.status = 'recusado';
        return { success: true };
    }
    
    if (pkInviteCancelMatch && method === 'POST') {
        const inviteId = pkInviteCancelMatch[1];
        const invite = db.pkInvitations.find((inv: types.ConvitePK) => inv.id === inviteId);
        if (invite) invite.status = 'cancelado';
        return { success: true };
    }
    
    // PK Matchmaking
    if (method === 'POST' && path === '/api/pk/matchmaking/join') {
        const { userId } = body;
        if (!db.pkMatchmakingQueue.some((q: types.FilaPK) => q.streamer_id === userId)) {
            db.pkMatchmakingQueue.push({ streamer_id: userId, data_entrada: new Date().toISOString(), status: 'aguardando' });
        }
        return { success: true };
    }

    if (method === 'POST' && path === '/api/pk/matchmaking/leave') {
        const { userId } = body;
        db.pkMatchmakingQueue = db.pkMatchmakingQueue.filter((q: types.FilaPK) => q.streamer_id !== userId);
        return { success: true };
    }

    if (matchmakingStatusMatch && method === 'GET') {
        const userId = parseInt(matchmakingStatusMatch[1], 10);
        const userInQueue = db.pkMatchmakingQueue.find((q: types.FilaPK) => q.streamer_id === userId);
        if (!userInQueue) return { status: 'aguardando', battle: null };
        
        const opponent = db.pkMatchmakingQueue.find((q: types.FilaPK) => q.streamer_id !== userId);
        if (opponent) {
            db.pkMatchmakingQueue = db.pkMatchmakingQueue.filter((q: types.FilaPK) => q.streamer_id !== userId && q.streamer_id !== opponent.streamer_id);
            const battle = await handleApiRequest('POST', '/api/pk/cohost-invite', { inviterId: userId, inviteeId: opponent.streamer_id }, new URLSearchParams());
            return { status: 'pareado', battle };
        }
        
        return { status: 'aguardando', battle: null };
    }

    if (flipCameraMatch && method === 'POST') {
        const liveId = parseInt(flipCameraMatch[1], 10);
        const live = db.lives.find((l: types.LiveStreamRecord) => l.id === liveId);
        if (!live) {
            return notFound();
        }
        
        const currentMode = live.camera_facing_mode || 'user';
        const newFacingMode: types.FacingMode = currentMode === 'user' ? 'environment' : 'user';
        live.camera_facing_mode = newFacingMode;
        
        const user = db.users.find((u: types.User) => u.id === live.user_id);
        if (user) {
            user.last_camera_used = newFacingMode;
        }
        
        return { success: true, newFacingMode };
    }

    if (privateInviteMatch && method === 'POST') {
        const liveId = parseInt(privateInviteMatch[1], 10);
        const { inviteeId } = body;
        const live = db.lives.find((l: types.LiveStreamRecord) => l.id === liveId);
        if (!live) return notFound();
        if (!live.is_private) {
            throw new Error("Cannot invite to a public live stream.");
        }

        if (!live.invited_users) {
            live.invited_users = [];
        }
        if (!live.invited_users.includes(inviteeId)) {
            live.invited_users.push(inviteeId);
        }
        
        // Remove any existing pending invite for this user to this live
        db.privateLiveInvites = db.privateLiveInvites.filter((inv: any) => !(inv.liveId === liveId && inv.inviteeId === inviteeId));

        db.privateLiveInvites.push({
            id: `pli-${Date.now()}`,
            liveId: liveId,
            inviterId: live.user_id,
            inviteeId: inviteeId,
            status: 'pending',
            timestamp: new Date().toISOString(),
        });

        return { success: true };
    }
  
    if (privateInviteCancelMatch && method === 'POST') {
        const liveId = parseInt(privateInviteCancelMatch[1], 10);
        const { inviteeId } = body;
        const live = db.lives.find((l: types.LiveStreamRecord) => l.id === liveId);
        if (!live) return notFound();

        if (live.invited_users) {
            live.invited_users = live.invited_users.filter(id => id !== inviteeId);
        }

        db.privateLiveInvites = db.privateLiveInvites.filter((inv: any) => !(inv.liveId === liveId && inv.inviteeId === inviteeId));
        
        return { success: true };
    }

    if (userPendingInvitesMatch && method === 'GET') {
        const userId = parseInt(userPendingInvitesMatch[1], 10);
        const invite = db.privateLiveInvites.find((inv: any) => inv.inviteeId === userId && inv.status === 'pending');

        if (!invite) {
            return { invite: null };
        }

        // "Consume" the invite by changing its status
        invite.status = 'delivered';

        const liveRecord = db.lives.find((l: types.LiveStreamRecord) => l.id === invite.liveId);
        const inviter = db.users.find((u: types.User) => u.id === invite.inviterId);
        const invitee = db.users.find((u: types.User) => u.id === invite.inviteeId);

        if (!liveRecord || !inviter || !invitee) {
            // clean up bad invite
            db.privateLiveInvites = db.privateLiveInvites.filter((i: any) => i.id !== invite.id);
            return { invite: null }; // Invalid invite data
        }

        const fullInvite: types.IncomingPrivateLiveInvite = {
            stream: mapLiveRecordToStream(liveRecord),
            inviter,
            invitee,
        };
        
        return { invite: fullInvite };
    }

  if (method === 'GET' && path === '/api/gifts') {
      return db.gifts;
  }
  
  if (userPurchaseHistoryMatch && method === 'GET') {
      const userId = parseInt(userPurchaseHistoryMatch[1], 10);
      const userOrders = db.purchaseOrders.filter((o: types.PurchaseOrder) => o.userId === userId)
          .sort((a: types.PurchaseOrder, b: types.PurchaseOrder) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return userOrders;
  }

    if (method === 'GET' && path === '/api/ranking/hourly') {
        const liveId = query.get('liveId') ? parseInt(query.get('liveId')!, 10) : null;
        if (!liveId) throw new Error("liveId is required for hourly ranking");

        const giftsInLive = db.sentGifts.filter((g: types.LogPresenteEnviado) => {
            const pkBattle = db.pkBattles.find((b: types.TabelaBatalhaPK) => String(b.id) === String(g.batalha_id));
            if (pkBattle) {
                const streamA = db.lives.find((l: types.LiveStreamRecord) => l.user_id === pkBattle.streamer_A_id && l.ao_vivo);
                const streamB = db.lives.find((l: types.LiveStreamRecord) => l.user_id === pkBattle.streamer_B_id && l.ao_vivo);
                return streamA?.id === liveId || streamB?.id === liveId;
            }
            return g.liveId === liveId;
        });

        const scoresBySender: Record<number, number> = {};
        for (const gift of giftsInLive) {
            scoresBySender[gift.senderId] = (scoresBySender[gift.senderId] || 0) + gift.giftValue;
        }

        const rankingUsers: types.UniversalRankingUser[] = Object.entries(scoresBySender)
            .map(([userIdStr, score]) => {
                const userId = parseInt(userIdStr, 10);
                const user = db.users.find((u: types.User) => u.id === userId);
                if (!user) return null;
                
                const badges: { type: 'flag' | 'v_badge' | 'gender' | 'level', value: string | number }[] = [
                    { type: 'flag', value: user.country === 'BR' ? '🇧🇷' : '🇺🇸' },
                    ...(user.is_avatar_protected ? [{ type: 'v_badge' as const, value: 'V' }] : []),
                    { type: 'level', value: user.level },
                    ...(user.gender ? [{ type: 'gender' as const, value: user.gender }] : []),
                ];
                
                return {
                    userId,
                    score,
                    rank: 0 as (number | string),
                    avatarUrl: user.avatar_url || '',
                    name: user.nickname || user.name,
                    level: user.level,
                    gender: user.gender,
                    badges,
                };
            })
            .filter((u): u is types.UniversalRankingUser => u !== null)
            .sort((a, b) => b.score - a.score)
            .map((u, index) => ({ ...u, rank: index + 1 }));

        const currentUser = db.users.find((u: any) => u.id === 10755083);
        const currentUserRanking = rankingUsers.find(u => u.userId === currentUser.id) || {
            rank: '>99',
            userId: currentUser.id,
            avatarUrl: currentUser.avatar_url || '',
            name: currentUser.nickname || currentUser.name,
            score: scoresBySender[currentUser.id] || 0,
            level: currentUser.level,
            gender: currentUser.gender,
            badges: [{ type: 'flag', value: '🇧🇷' }, { type: 'level', value: currentUser.level }]
        };

        const data: types.UniversalRankingData = {
            podium: rankingUsers.slice(0, 3),
            list: rankingUsers.slice(3, 15),
            currentUserRanking: currentUserRanking,
            countdown: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            footerButtons: {
                primary: { text: "Ajudar o anfitrião a obter o 1º lugar", value: "1060" },
                secondary: { text: "Ajudar o anfitrião a entrar na lista", value: "203" }
            }
        };
        return data;
    }


  if (method === 'GET' && path === '/api/ranking/user-list') {
    const period = query.get('period') as types.UserListRankingPeriod || 'daily';
    let multiplier = 1;
    if (period === 'weekly') multiplier = 7;
    if (period === 'total') multiplier = 50;
    
    const rankingUsers = generateMockRankingUsers(20, 50000 * multiplier);
    const currentUser = db.users.find((u: any) => u.id === 10755083);
    
    const data: types.UniversalRankingData = {
        podium: rankingUsers.slice(0, 3),
        list: rankingUsers.slice(3),
        currentUserRanking: {
            rank: '>999',
            userId: currentUser.id,
            avatarUrl: currentUser.avatar_url || '',
            name: currentUser.nickname || currentUser.name,
            score: currentUser.xp,
            level: currentUser.level,
            gender: currentUser.gender,
            badges: [{ type: 'flag', value: '🇧🇷' }, { type: 'level', value: currentUser.level }]
        },
    };
    return data;
  }

  if (userConversationsMatch && method === 'GET') {
    const userId = parseInt(userConversationsMatch[1], 10);
    const userConvos = db.conversations
        .filter((c: types.TabelaConversa) => c.participantes.includes(userId))
        .map((c: types.TabelaConversa) => buildConversationViewModel(c, userId));

    const friendRequests = db.users.filter((u: types.User) => (u.following || []).includes(userId) && !(db.users.find((cu: types.User) => cu.id === userId)?.following || []).includes(u.id));
    if (friendRequests.length > 0) {
        userConvos.unshift({
            id: 'friend_requests_summary',
            type: 'friend_requests_summary',
            participants: [userId],
            otherUserId: -1,
            otherUserName: 'Pedidos de amizade',
            otherUserAvatarUrl: '',
            unreadCount: friendRequests.length,
            messages: [{
                id: 'fr-msg', senderId: -1, type: 'text', text: `${friendRequests.length} novos pedidos de amizade`,
                imageUrl: null, timestamp: new Date().toISOString(), status: 'sent', seenBy: []
            }],
        });
    }

    userConvos.sort((a, b) => {
        const lastMsgA = a.messages.length > 0 ? a.messages[a.messages.length - 1] : null;
        const lastMsgB = b.messages.length > 0 ? b.messages[b.messages.length - 1] : null;
        if (!lastMsgA) return 1;
        if (!lastMsgB) return -1;
        return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
    });
    
    return userConvos;
  }

  if (userCohostFriendsMatch && method === 'GET') {
    const userId = parseInt(userCohostFriendsMatch[1], 10);
    const user = db.users.find((u: types.User) => u.id === userId);
    if (!user) return [];

    const followingIds = new Set(user.following || []);
    const friends = db.users.filter((u: any) => 
        u.id !== userId &&
        followingIds.has(u.id) &&
        (u.following || []).includes(userId)
    );

    return friends.map((friend, index) => ({
        ...friend,
        coHostHistory: index % 2 === 0 ? 'Co-host com Você' : `Última vez há ${index + 1} dias`
    }));
  }
  // --- END NEW HANDLERS ---

  if (userGiftsReceivedMatch && method === 'GET') {
      const userId = parseInt(userGiftsReceivedMatch[1], 10);
      const receivedValue = db.sentGifts
          .filter((g: any) => g.receiverId === userId)
          .reduce((sum: number, g: any) => sum + g.giftValue, 0);
      return { totalValue: receivedValue };
  }

  if (userGiftsSentMatch && method === 'GET') {
      const userId = parseInt(userGiftsSentMatch[1], 10);
      const sentValue = db.sentGifts
          .filter((g: any) => g.senderId === userId)
          .reduce((sum: number, g: any) => sum + g.giftValue, 0);
      return { totalValue: sentValue };
  }
  
  // DIAMONDS
  if (method === 'GET' && path === '/api/diamonds/packages') {
    return db.diamondPackages;
  }
  
  if (notificationSettingsMatch) {
    const userId = parseInt(notificationSettingsMatch[1], 10);
    let userSettings = db.notificationSettings.find((s: any) => s.userId === userId);

    if (method === 'GET') {
        if (!userSettings) {
            // Create default settings if not found
            userSettings = {
                userId: userId,
                newMessages: true,
                streamerLive: true,
                followedPost: true,
                order: true,
                interactive: true,
            };
            db.notificationSettings.push(userSettings);
        }
        return userSettings;
    }
    
    if (method === 'PATCH') {
        if (!userSettings) {
            userSettings = {
                userId: userId,
                newMessages: true,
                streamerLive: true,
                followedPost: true,
                order: true,
                interactive: true,
            };
            db.notificationSettings.push(userSettings);
        }
        Object.assign(userSettings, body);
        return userSettings;
    }
  }

  if (withdrawalBalanceMatch && method === 'GET') {
    const userId = parseInt(withdrawalBalanceMatch[1], 10);
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) return notFound();

    const pendingWithdrawals = db.withdrawalTransactions
        .filter((t: any) => t.userId === userId && t.status === 'pending')
        .reduce((sum: number, t: any) => sum + t.earnings_withdrawn, 0);

    const balance: types.WithdrawalBalance = {
        totalEarnings: user.wallet_earnings || 0,
        pendingWithdrawals: pendingWithdrawals,
        availableBalance: (user.wallet_earnings || 0) - pendingWithdrawals,
    };
    return balance;
  }

  if (userWithdrawalHistoryMatch && method === 'GET') {
    const userId = parseInt(userWithdrawalHistoryMatch[1], 10);
    const history = db.withdrawalTransactions
        .filter((t: any) => t.userId === userId)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return history;
  }

  if (connectedAccountsMatch) {
    const userId = parseInt(connectedAccountsMatch[1], 10);
    if (method === 'GET') {
        const accounts = db.connectedAccounts.filter((acc: any) => acc.userId === userId)
            .map((acc: any) => ({ provider: acc.provider, email: acc.email }));
        return accounts;
    }
    if (method === 'PATCH') {
        console.log(`[Mock API] Updating connected accounts for user ${userId}`, body.accounts);
        return { success: true };
    }
  }

  if (privateLiveSettingsMatch) {
      const userId = parseInt(privateLiveSettingsMatch[1], 10);
      let userSettings = db.privateLiveInviteSettings.find((s: any) => s.userId === userId);

      if (method === 'GET') {
          if (!userSettings) {
              userSettings = {
                  userId: userId,
                  privateInvites: true,
                  onlyFollowing: true,
                  onlyFans: false,
                  onlyFriends: false,
                  acceptOnlyFriendPkInvites: true,
              };
              db.privateLiveInviteSettings.push(userSettings);
          }
          return userSettings;
      }

      if (method === 'PATCH') {
          if (!userSettings) {
               userSettings = {
                  userId: userId,
                  privateInvites: true,
                  onlyFollowing: true,
                  onlyFans: false,
                  onlyFriends: false,
                  acceptOnlyFriendPkInvites: true,
              };
              db.privateLiveInviteSettings.push(userSettings);
          }
          Object.assign(userSettings, body);
          return userSettings;
      }
  }

  if (earningsInfoMatch && method === 'GET') {
      const userId = parseInt(earningsInfoMatch[1], 10);
      const user = db.users.find((u: any) => u.id === userId);
      if (!user) return notFound();
      return {
          total: user.wallet_earnings || 0,
          lastMonth: (user.wallet_earnings || 0) * 0.1, 
          conversionRate: 0.0115,
          feeRate: 0.20
      };
  }
  if (method === 'GET' && path === '/api/copyright/info') {
      return {
          title: `Aviso de Direitos Autorais do LiveGo`,
          content: `
              <p class="mb-4">Copyright &copy; ${new Date().getFullYear()} LiveGo. Todos os direitos reservados.</p>
              <h3 class="text-xl font-semibold text-white mt-6 mb-2">1. Propriedade Intelectual</h3>
              <p class="mb-4">Todo o conteúdo presente neste aplicativo, incluindo, mas não se limitando a, texto, gráficos, logotipos, ícones, imagens, clipes de áudio, downloads digitais, compilações de dados e software, é propriedade da LiveGo ou de seus fornecedores de conteúdo e protegido pelas leis internacionais de direitos autorais. A compilação de todo o conteúdo neste aplicativo é propriedade exclusiva da LiveGo.</p>
              <h3 class="text-xl font-semibold text-white mt-6 mb-2">2. Marcas Registradas</h3>
              <p class="mb-4">O nome "LiveGo", o logotipo e outros gráficos, logotipos, cabeçalhos de página, ícones de botão, scripts e nomes de serviço são marcas comerciais, marcas registradas ou identidade visual da LiveGo. As marcas comerciais e a identidade visual da LiveGo não podem ser usadas em conexão com qualquer produto ou serviço que não seja da LiveGo, de nenhuma maneira que possa causar confusão entre os clientes, ou de qualquer maneira que deprecie ou desacredite a LiveGo.</p>
              <h3 class="text-xl font-semibold text-white mt-6 mb-2">3. Conteúdo Gerado pelo Usuário</h3>
              <p class="mb-4">Os usuários são responsáveis pelo conteúdo que publicam, transmitem ou disponibilizam através do serviço. Ao usar o LiveGo, você concede à LiveGo uma licença mundial, não exclusiva, isenta de royalties, sublicenciável e transferível para usar, reproduzir, distribuir, preparar trabalhos derivados, exibir e executar o conteúdo em conexão com o serviço.</p>
          `
      };
  }
  if (method === 'GET' && path === '/api/dev-tools/config') {
      return {
          loggingEnabled: true,
          showDbState: true,
          documentationAvailable: true,
      };
  }
  if (method === 'GET' && path === '/api/sales/documentation') {
      return {
          sections: [
              { title: '1. Proposta de Valor', content: `<p>O LiveGo é um aplicativo de streaming ao vivo "plug-and-play" pronto para o mercado. Ele foi construído com uma arquitetura escalável e uma interface de usuário moderna para atrair e reter usuários. A plataforma está pronta para gerar receita através de um sistema de presentes virtuais e taxas de saque, com potencial de expansão para assinaturas e anúncios.</p><p>Este pacote inclui tudo o que é necessário para um comprador lançar o produto rapidamente, minimizando o tempo de desenvolvimento e os custos.</p>`},
              { title: '2. Documentação da API (Simulada)', content: `<p>A API foi projetada para ser RESTful e intuitiva. Todos os dados são gerenciados por um backend simulado que imita as operações de um banco de dados real, tornando a transição para um ambiente de produção simples. O aplicativo frontend já está totalmente conectado a essa API simulada.</p><h3 class="font-semibold text-lg text-white mt-4">Endpoints Principais:</h3><p><strong class="text-yellow-400">GET /api/lives/popular</strong>: Retorna uma lista das transmissões ao vivo mais populares.</p><pre class="bg-gray-900/50 p-4 rounded-lg overflow-x-auto"><code class="text-sm font-mono text-cyan-300">${JSON.stringify([{id:101, userId: 401, titulo: "PK Challenge"}], null, 2)}</code></pre>`},
              { title: '3. Visão Geral da Arquitetura', content: `<p><strong>Frontend:</strong> Construído com React, TypeScript e Tailwind CSS, garantindo um código moderno, seguro e de fácil manutenção. A estrutura de componentes é modular e reutilizável.</p><p><strong>Backend (Simulado):</strong> Os serviços em \`src/services/\` simulam um backend Node.js. Eles operam em um banco de dados em memória (\`api.ts\`) e expõem funções que o frontend consome como se fossem chamadas de API reais. Isso permite que o desenvolvimento do frontend seja totalmente independente e que a lógica de negócios seja facilmente migrada para um servidor real.</p>`},
              { title: '4. Estrutura do Banco de Dados', content: `<p>O \`services/api.ts\` simula um banco de dados relacional (como PostgreSQL). As "tabelas" são arrays de objetos e estão prontas para serem convertidas em scripts SQL.</p><h3 class="font-semibold text-lg text-white mt-4">Tabelas Principais:</h3><ul class="list-disc list-inside space-y-2"><li><strong class="text-yellow-400">users</strong>: Armazena todos os dados do usuário, incluindo perfil, carteira e seguidores.</li><li><strong class="text-yellow-400">lives</strong>: Mantém o registro de todas as transmissões ao vivo, ativas e passadas.</li><li><strong class="text-yellow-400">withdrawalTransactions</strong>: Histórico de todos os saques processados.</li></ul>`},
              { title: '5. Guia de Instalação', content: `<p>O projeto é configurado para ser executado com um único comando, assumindo que Node.js e npm estão instalados.</p><h3 class="font-semibold text-lg text-white mt-4">Passos:</h3><ol class="list-decimal list-inside space-y-2"><li>Descompacte os arquivos do projeto.</li><li>Abra um terminal na pasta do projeto.</li><li>Execute \`<code class="text-sm font-mono text-cyan-300 bg-gray-900/50 p-1 rounded">npm install</code>\` para instalar as dependências (React).</li><li>Execute \`<code class="text-sm font-mono text-cyan-300 bg-gray-900/50 p-1 rounded">npm run dev</code>\` para iniciar o servidor de desenvolvimento.</li><li>Abra o navegador no endereço fornecido pelo terminal.</li></ol>`},
              { title: '6. Licença de Uso', content: `<p>Com a compra, o comprador recebe uma licença perpétua e exclusiva para usar, modificar e distribuir o código-fonte do aplicativo LiveGo para fins comerciais. O vendedor retém o direito de exibir o trabalho em seu portfólio. O código é fornecido "como está", sem garantias.</p>`}
          ]
      };
  }
  
  // USER BLOCKING (NEW SPEC)
  if (blocksMatch && method === 'POST') {
      const { blockerId, blockedId } = body;
      if (!db.blockedUsers.some((b: any) => b.blockerId === blockerId && b.targetId === blockedId)) {
          db.blockedUsers.push({ blockerId, targetId: blockedId });
      }
      return { success: true };
  }
  if (blocksWithIdsMatch && method === 'GET') {
      const blockerId = parseInt(blocksWithIdsMatch[1], 10);
      const targetId = parseInt(blocksWithIdsMatch[2], 10);
      const isBlocked = db.blockedUsers.some((b: any) => b.blockerId === blockerId && b.targetId === targetId);
      return { isBlocked };
  }
  if (blocksWithIdsMatch && method === 'DELETE') {
      const blockerId = parseInt(blocksWithIdsMatch[1], 10);
      const targetId = parseInt(blocksWithIdsMatch[2], 10);
      db.blockedUsers = db.blockedUsers.filter((b: any) => !(b.blockerId === blockerId && b.targetId === targetId));
      return { success: true };
  }
  
  // USER FOLLOWS (NEW SPEC)
  if (followsMatch && method === 'POST') {
        const { followerId, followingId } = body;
        const currentUser = db.users.find((u: types.User) => u.id === followerId);
        const targetUser = db.users.find((u: types.User) => u.id === followingId);
        if (!currentUser || !targetUser) return notFound();

        let wasAlreadyFollowing = false;
        if (!currentUser.following) currentUser.following = [];
        if (!currentUser.following.includes(followingId)) {
            currentUser.following.push(followingId);
            targetUser.followers = (targetUser.followers || 0) + 1;
        } else {
            wasAlreadyFollowing = true;
        }

        if (!wasAlreadyFollowing) {
            const targetUserLive = db.lives.find((l: types.LiveStreamRecord) => l.user_id === followingId && l.ao_vivo);
            if (targetUserLive) {
                const followMessage: types.ChatMessage = {
                    id: Date.now(),
                    type: 'announcement',
                    username: 'System',
                    userId: 0,
                    message: `${currentUser.nickname || currentUser.name} seguiu a âncora!`,
                    timestamp: new Date().toISOString(),
                };
                initializeChatForLive(targetUserLive.id);
                db.chatMessages[targetUserLive.id].push(followMessage);
            }

            let convoRecord = db.conversations.find((c: types.TabelaConversa) => 
                c.participantes.includes(followerId) && c.participantes.includes(followingId)
            );
            if (!convoRecord) {
                convoRecord = {
                    id: `convo-${followerId}-${followingId}-${Date.now()}`,
                    participantes: [followerId, followingId],
                    ultima_mensagem_texto: "",
                    ultima_mensagem_timestamp: new Date().toISOString(),
                };
                db.conversations.push(convoRecord);
            }

            const isFriendship = (targetUser.following || []).includes(followerId);
            const systemMessageText = isFriendship ? 'Agora vocês são amigos' : `Pedido de amizade: ${currentUser.nickname} seguiu você`;
            
            const systemMessage: types.TabelaMensagem = {
                id: `msg-${convoRecord.id}-${Date.now()}`,
                conversa_id: convoRecord.id,
                remetente_id: -1,
                conteudo: systemMessageText,
                timestamp: new Date().toISOString(),
                tipo_conteudo: 'sistema',
                status_leitura: {},
            };
            db.messages.push(systemMessage);
            
            convoRecord.ultima_mensagem_texto = systemMessageText;
            convoRecord.ultima_mensagem_timestamp = systemMessage.timestamp;
        }
        
        return getDynamicUser(currentUser.id);
  }
  if (followsWithIdsMatch && method === 'DELETE') {
      const followerId = parseInt(followsWithIdsMatch[1], 10);
      const followingId = parseInt(followsWithIdsMatch[2], 10);
      const currentUser = db.users.find((u: types.User) => u.id === followerId);
      const targetUser = db.users.find((u: types.User) => u.id === followingId);
      if (!currentUser || !targetUser) return notFound();

      if (!currentUser.following) currentUser.following = [];
      const index = currentUser.following.indexOf(followingId);
      if (index > -1) {
          currentUser.following.splice(index, 1);
          targetUser.followers = Math.max(0, (targetUser.followers || 0) - 1);
      }
      return getDynamicUser(currentUser.id);
  }
  
  // REPORTS
  if (method === 'POST' && path === '/api/reports') {
      console.log("[Mock API] Report received:", body);
      return { success: true };
  }

  // FRIEND REQUESTS
    if (method === 'GET' && friendRequestsMatch) {
        const userId = parseInt(friendRequestsMatch[1], 10);
        const currentUser = db.users.find((u: types.User) => u.id === userId);
        if (!currentUser) return notFound();

        const followers = db.users.filter((u: types.User) => (u.following || []).includes(userId));
        const friendRequests = followers.filter((follower: types.User) => !(currentUser.following || []).includes(follower.id));
        return friendRequests;
    }


  // AUTH
  if (method === 'POST' && path === '/api/auth/google') {
    const { id, email } = body || {};

    let userToFindId: number | undefined;

    if (id) {
        userToFindId = id;
    } else if (email) {
        const foundUser = db.users.find((u: types.User) => u.email === email);
        userToFindId = foundUser?.id;
    } else {
        // Default behavior: log in as the main user if no id/email is provided
        userToFindId = 10755083;
    }

    if (!userToFindId) {
        throw new Error('Usuário não encontrado');
    }

    return getDynamicUser(userToFindId);
  }

  // --- STREAMING INFRASTRUCTURE (SIMULATED) ---
  if (method === 'POST' && path === '/api/livekit/token') {
    const { roomName, participantIdentity } = body;
    console.log(`[Mock API] Generating fake LiveKit token for room: ${roomName}, user: ${participantIdentity}`);
    // Simulate a JWT token: header.payload.signature
    const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ room: roomName, identity: participantIdentity }))}.${Math.random().toString(36).substring(2)}`;
    return { token: fakeToken };
  }

  // VERSION
  if (method === 'GET' && path === '/api/version') {
      return {
          minVersion: '1.0.0',
          latestVersion: '1.0.0',
          updateUrl: 'https://play.google.com/store/apps/details?id=com.livego'
      };
  }
  
  // AVATAR PROTECTION
  if (method === 'POST' && avatarCheckMatch) {
    const { avatarImage } = body;
    const imageHash = `hash_${avatarImage}`;
    const existingProtection = db.protectedAvatars.find((p: any) => p.hash === imageHash);
    if (existingProtection) {
        return { inUse: true, protectedBy: existingProtection.userId };
    }
    return { inUse: false, protectedBy: null };
  }
  if (method === 'POST' && path === '/api/avatar/protection/activate') {
      const { userId, avatarImage } = body;
      const user = db.users.find((u: types.User) => u.id === userId);
      if (!user) throw new Error("Usuário não encontrado.");
      
      // Simple hash simulation
      const imageHash = `hash_${avatarImage}`; 
      
      const existingProtection = db.protectedAvatars.find((p: any) => p.hash === imageHash);
      
      if (existingProtection && existingProtection.userId !== userId) {
          throw new Error("Esta imagem já está protegida por outro usuário.");
      }

      // remove previous protection for the user if they had one
      db.protectedAvatars = db.protectedAvatars.filter((p: any) => p.userId !== userId);
      // add new one
      db.protectedAvatars.push({ hash: imageHash, userId: userId });

      user.is_avatar_protected = true;
      return { success: true, protectionId: `prot_${userId}`, frameUrl: 'default_frame' };
  }

  if (method === 'POST' && path === '/api/avatar/protection/deactivate') {
      const { userId } = body;
      const user = db.users.find((u: types.User) => u.id === userId);
      if (!user) throw new Error("Usuário não encontrado.");

      db.protectedAvatars = db.protectedAvatars.filter((p: any) => p.userId !== userId);
      user.is_avatar_protected = false;
      return { success: true };
  }

  if (method === 'GET' && avatarStatusMatch) {
      const userId = parseInt(avatarStatusMatch[1], 10);
      const user = db.users.find((u: types.User) => u.id === userId);
      if (!user) throw new Error("Usuário não encontrado.");
      return { active: !!user.is_avatar_protected, frameUrl: user.is_avatar_protected ? 'default_frame' : null };
  }

  if (method === 'POST' && path === '/api/avatar/protection/block') {
      const { userId, avatarImage } = body;
      console.log(`[Mock API] Block attempt logged for user ${userId} trying to use image: ${avatarImage.substring(0, 30)}...`);
      // In a real app, this would write to a security log table.
      return { success: true, reason: "Attempt logged for review." };
  }

  // CATEGORIES
  if (method === 'GET' && path === '/api/live/categories') {
    const categories: types.LiveCategory[] = [
        { id: '1', name: 'Popular', slug: 'popular' },
        { id: '2', name: 'Seguindo', slug: 'seguindo' },
        { id: '3', name: 'Perto', slug: 'perto' },
        { id: '4', name: 'Privada', slug: 'privada' },
        { id: '5', name: 'PK', slug: 'pk' },
        { id: '6', name: 'Novo', slug: 'novo' },
        { id: '7', name: 'Música', slug: 'musica' },
        { id: '8', name: 'Dança', slug: 'danca' },
    ];
    return categories;
  }
  
  // PROFILE OPTIONS
  if (method === 'GET' && path === '/api/genders') {
    return [
      { id: 'male', label: 'Masculino' },
      { id: 'female', label: 'Feminino' },
    ] as types.SelectableOption[];
  }
  if (method === 'GET' && path === '/api/countries') {
    return [
      { id: 'BR', label: 'Brasil' },
      { id: 'US', label: 'Estados Unidos' },
      { id: 'PT', label: 'Portugal' },
      { id: 'JP', label: 'Japão' },
      { id: 'DE', label: 'Alemanha' },
    ] as types.SelectableOption[];
  }
  if (method === 'GET' && path === '/api/emotional_states') {
    return [
      { id: 'happy', label: 'Feliz' },
      { id: 'sad', label: 'Triste' },
      { id: 'in_love', label: 'Apaixonado(a)' },
      { id: 'single', label: 'Solteiro(a)' },
      { id: 'complicated', label: 'Complicado' },
    ] as types.SelectableOption[];
  }
  if (method === 'GET' && path === '/api/professions') {
    return [
      { id: 'student', label: 'Estudante' },
      { id: 'developer', label: 'Desenvolvedor(a)' },
      { id: 'artist', label: 'Artista' },
      { id: 'doctor', label: 'Médico(a)' },
      { id: 'streamer', label: 'Streamer' },
      { id: 'teacher', label: 'Professor(a)' },
    ] as types.SelectableOption[];
  }
  if (method === 'GET' && path === '/api/languages') {
     return [
      { id: 'pt-br', label: 'Português (Brasil)' },
      { id: 'en-us', label: 'Inglês' },
      { id: 'es', label: 'Espanhol' },
      { id: 'jp', label: 'Japonês' },
      { id: 'de', label: 'Alemão' },
    ] as types.SelectableOption[];
  }

  if (liveListMatch && method === 'GET') {
    const category = (query.get('category') || 'popular').toLowerCase();
    const userId = query.get('userId') ? parseInt(query.get('userId')!, 10) : null;
    let results: types.LiveStreamRecord[] = db.lives.filter((l: types.LiveStreamRecord) => l.ao_vivo);

    switch (category) {
        case 'popular':
            results.sort((a, b) => b.espectadores - a.espectadores);
            break;
        case 'novo':
        case 'atualizado': // Map Atualizado to new
            results.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
            break;
        case 'seguindo':
            if (userId) {
                const user = db.users.find((u: types.User) => u.id === userId);
                results = user ? results.filter((l: types.LiveStreamRecord) => (user.following || []).includes(l.user_id)) : [];
            } else {
                 results = [];
            }
            break;
        case 'privada':
             if (userId) {
                results = results.filter((l: types.LiveStreamRecord) =>
                    l.is_private && (l.user_id === userId || (l.invited_users && l.invited_users.includes(userId)))
                );
             } else {
                 results = [];
             }
            break;
        case 'música':
        case 'dança':
            results = results.filter((l: types.LiveStreamRecord) => l.categoria.toLowerCase() === category);
            break;
        default:
            results.sort((a, b) => b.espectadores - a.espectadores);
            break;
    }
    
    const liveStreams = filterByRegion(results);
    return liveStreams.map(mapLiveRecordToStream);
}

if (liveByIdMatch && method === 'GET') {
    const liveId = parseInt(liveByIdMatch[1], 10);
    const live = db.lives.find((l: types.LiveStreamRecord) => l.id === liveId);
    if (!live) return notFound();
    const streamer = db.users.find((u: types.User) => u.id === live.user_id);
    if (!streamer) return notFound();
    
    return {
        streamerName: streamer.nickname || streamer.name,
        streamerAvatarUrl: streamer.avatar_url,
        streamerFollowers: streamer.followers,
        viewerCount: live.espectadores,
        totalVisitors: live.espectadores + 50,
        receivedGiftsValue: live.received_gifts_value || 0,
        rankingPosition: 'Top 5',
        status: 'ao vivo',
        likeCount: live.like_count || 0,
        streamerIsAvatarProtected: !!streamer.is_avatar_protected,
        title: live.titulo,
        meta: live.meta,
    } as types.LiveDetails;
}

  if (method === 'GET' && path === '/api/lives/pk') {
    const regionCode = query.get('region');
    const activeBattles = db.pkBattles.filter((b: types.TabelaBatalhaPK) => b.status === 'ativa');
    
    const battlesInRegion = activeBattles.filter((b: types.TabelaBatalhaPK) => {
        if (!regionCode || regionCode.toLowerCase() === 'global') {
            return true;
        }
        const streamerA = db.users.find((u: types.User) => u.id === b.streamer_A_id);
        const streamerB = db.users.find((u: types.User) => u.id === b.streamer_B_id);
        return streamerA?.country === regionCode || streamerB?.country === regionCode;
    });

    const pkBattleViewModels = battlesInRegion.map((battle: types.TabelaBatalhaPK) => {
        const streamerA = db.users.find((u: types.User) => u.id === battle.streamer_A_id)!;
        const streamerB = db.users.find((u: types.User) => u.id === battle.streamer_B_id)!;
        const streamA = db.lives.find((l: types.LiveStreamRecord) => l.user_id === streamerA.id && l.ao_vivo)!;
        const streamB = db.lives.find((l: types.LiveStreamRecord) => l.user_id === streamerB.id && l.ao_vivo)!;

        return {
            id: battle.id,
            title: "Batalha Épica",
            streamer1: {
                userId: streamerA.id,
                streamId: streamA.id,
                name: streamerA.nickname || streamerA.name,
                score: battle.pontuacao_A,
                avatarUrl: streamerA.avatar_url!,
                isVerified: true,
                countryCode: streamerA.country,
            },
            streamer2: {
                userId: streamerB.id,
                streamId: streamB.id,
                name: streamerB.nickname || streamerB.name,
                score: battle.pontuacao_B,
                avatarUrl: streamerB.avatar_url!,
                isVerified: false,
                countryCode: streamerB.country,
            }
        } as types.PkBattle;
    });
    return pkBattleViewModels;
  }
 
    if (method === 'GET' && liveSummaryMatch) {
        const liveId = parseInt(liveSummaryMatch[1], 10);
        // Find the live record. It may have been marked as not ao_vivo.
        const live = db.lives.find((l: types.LiveStreamRecord) => l.id === liveId);
        if (!live) return notFound();
        
        const streamer = db.users.find((u: types.User) => u.id === live.user_id);
        if (!streamer) return notFound();

        // In a real scenario, you'd calculate this data based on logs. Here we'll generate mock data.
        const durationSeconds = (new Date().getTime() - new Date(live.inicio).getTime()) / 1000;

        const summary: types.LiveEndSummary = {
            streamerId: streamer.id,
            streamerName: streamer.nickname || streamer.name,
            streamerAvatarUrl: streamer.avatar_url || '',
            durationSeconds: Math.floor(durationSeconds),
            peakViewers: live.espectadores + Math.floor(Math.random() * 20), // Peak is slightly higher than final viewers
            totalEarnings: live.received_gifts_value || 0,
            newFollowers: Math.floor(Math.random() * 10),
            newMembers: Math.floor(Math.random() * 5),
            newFans: Math.floor(Math.random() * 20),
        };
        return summary;
    }
    
    if (method === 'GET' && viewersMatch) {
        // Return a mock list of viewers from our user DB
        const viewers: types.Viewer[] = db.users
            .filter((u: types.User) => u.id !== 10755083)
            .slice(0, 3)
            .map((u: any, index: number) => ({
                id: u.id,
                name: u.nickname || u.name,
                avatarUrl: u.avatar_url,
                entryTime: new Date().toISOString(),
                contribution: (5 - index) * 300,
                level: u.level,
                level2: index + 1,
            }));
        return viewers;
    }

    if (method === 'POST' && likeMatch) {
        const liveId = parseInt(likeMatch[1], 10);
        const live = db.lives.find((l: types.LiveStreamRecord) => l.id === liveId);
        if (live) {
            live.like_count = (live.like_count || 0) + 1;
            return {
                id: Date.now(),
                userId: body.userId,
                liveId: liveId,
                timestamp: new Date().toISOString()
            } as types.Like;
        }
        return notFound();
    }

    if (giftMatch && method === 'POST') {
        const liveId = parseInt(giftMatch[1], 10);
        const { senderId, giftId, receiverId } = body;

        const sender = db.users.find((u: types.User) => u.id === senderId);
        const gift = db.gifts.find((g: types.Gift) => g.id === giftId);
        const live = db.lives.find((l: types.LiveStreamRecord) => l.id === liveId);

        if (!sender || !gift || !live) {
            throw new Error('Usuário, presente ou live não encontrado.');
        }

        if ((sender.wallet_diamonds || 0) < gift.price) {
            return {
                success: false,
                updatedUser: null,
                message: 'Diamantes insuficientes para enviar este presente.',
            } as types.SendGiftResponse;
        }

        // --- Transaction Logic ---
        sender.wallet_diamonds -= gift.price;

        const actualReceiverId = receiverId || live.user_id;
        const receiver = db.users.find((u: types.User) => u.id === actualReceiverId);
        if (receiver) {
            receiver.wallet_earnings = (receiver.wallet_earnings || 0) + gift.price;
        }

        live.received_gifts_value = (live.received_gifts_value || 0) + gift.price;

        const liveStreamerId = live.user_id;
        const pkBattle = db.pkBattles.find((b: types.TabelaBatalhaPK) => 
            b.status === 'ativa' && (b.streamer_A_id === liveStreamerId || b.streamer_B_id === liveStreamerId)
        );

        let pkBattleForGiftLog: number | undefined = undefined;
        if (pkBattle) {
            pkBattleForGiftLog = Number(pkBattle.id);
            if (actualReceiverId === pkBattle.streamer_A_id) {
                pkBattle.pontuacao_A += gift.price;
            } else if (actualReceiverId === pkBattle.streamer_B_id) {
                pkBattle.pontuacao_B += gift.price;
            }
        }
        
        initializeChatForLive(liveId);
        const giftMessage: types.ChatMessage = {
            id: Date.now(),
            type: 'gift',
            userId: sender.id,
            username: sender.nickname || sender.name,
            message: `enviou ${gift.name} para ${receiver.nickname || receiver.name}!`,
            giftId: gift.id,
            giftName: gift.name,
            giftValue: gift.price,
            giftAnimationUrl: gift.animationUrl,
            giftImageUrl: gift.imageUrl,
            recipientName: receiver.nickname || receiver.name,
            timestamp: new Date().toISOString(),
            level: sender.level,
            avatarUrl: sender.avatar_url,
        };
        db.chatMessages[liveId].push(giftMessage);

        const giftLog: types.LogPresenteEnviado = {
            id: Date.now(),
            senderId: sender.id,
            receiverId: actualReceiverId,
            liveId: liveId,
            giftId: gift.id,
            giftValue: gift.price,
            batalha_id: pkBattleForGiftLog,
            timestamp: new Date().toISOString(),
        };
        db.sentGifts.push(giftLog);

        return {
            success: true,
            updatedUser: sender,
            message: 'Presente enviado com sucesso!',
        } as types.SendGiftResponse;
    }
     
    if (joinLeaveMatch) {
        const liveId = parseInt(joinLeaveMatch[1], 10);
        const action = joinLeaveMatch[2];
        const live = db.lives.find((l: types.LiveStreamRecord) => l.id === liveId);
        if (live) {
            if (action === 'join') {
                live.espectadores += 1;            
                const { userId } = body;
                const joiningUser = db.users.find((u: types.User) => u.id === userId);
                
                // Don't show entry message for the streamer joining their own stream.
                if (joiningUser && joiningUser.id !== live.user_id) {
                    const userAge = calculateAge(joiningUser.birthday);
                    const entryMessage: types.ChatMessage = {
                        id: Date.now(),
                        type: 'entry',
                        username: joiningUser.nickname || joiningUser.name,
                        userId: joiningUser.id,
                        message: 'entrou',
                        timestamp: new Date().toISOString(),
                        level: joiningUser.level,
                        avatarUrl: joiningUser.avatar_url,
                        age: userAge,
                        gender: joiningUser.gender,
                    };
                    initializeChatForLive(liveId);
                    db.chatMessages[liveId].push(entryMessage);
                }

            } else { // leave
                live.espectadores = Math.max(0, live.espectadores - 1);
            }
            return { success: true };
        }
        return notFound();
    }
    
    // -- USER-CENTRIC ROUTES ---
    const userByIdMatch = path.match(/^\/api\/users\/(\d+)$/);
    const userProfileMatch = path.match(/^\/api\/users\/(\d+)\/profile$/);
    const userAvatarMatch = path.match(/^\/api\/users\/(\d+)\/avatar$/);
    const userFollowersMatch = path.match(/^\/api\/users\/(\d+)\/followers$/);
    const userFollowingMatch = path.match(/^\/api\/users\/(\d+)\/following$/);
    const userVisitorsMatch = path.match(/^\/api\/users\/(\d+)\/visitors$/);
    const userLiveStatusMatch = path.match(/^\/api\/users\/(\d+)\/live-status$/);
    const followingLiveStatusMatch = path.match(/^\/api\/users\/(\d+)\/following-live-status$/);
    const activeStreamMatch = path.match(/^\/api\/users\/(\d+)\/active-stream$/);
    const userLevelMatch = path.match(/^\/api\/users\/(\d+)\/level$/);
    const userBlockedListMatch = path.match(/^\/api\/users\/(\d+)\/blocked$/);
    
    if (userPrivacySettingsMatch) {
        const userId = parseInt(userPrivacySettingsMatch[1], 10);
        const user = db.users.find((u: any) => u.id === userId);
        if (!user) return notFound();

        // Ensure settings exist for the user
        if (user.privacy === undefined) {
             user.privacy = { showLocation: true, showActiveStatus: true, showInNearby: true, protectionEnabled: false };
        }
        
        if (method === 'GET') {
            return { userId, ...user.privacy };
        }
        if (method === 'PATCH') {
            Object.assign(user.privacy, body);
            // Also update the top-level user field if protectionEnabled changes
            if (body.protectionEnabled !== undefined) {
                user.protectionEnabled = body.protectionEnabled;
            }
            return { userId, ...user.privacy };
        }
    }


    if (userProfileMatch && method === 'GET') {
      const userId = parseInt(userProfileMatch[1], 10);
      const viewerId = query.get('viewerId') ? parseInt(query.get('viewerId')!, 10) : 10755083; // Default to main user
      const user = db.users.find((u: any) => u.id === userId);
      if (!user) return notFound();
      const live = db.lives.find((l: types.LiveStreamRecord) => l.user_id === userId && l.ao_vivo);
      const viewer = db.users.find((u: types.User) => u.id === viewerId);
      
      const publicProfile: types.PublicProfile = {
        id: user.id,
        name: user.name,
        nickname: user.nickname || user.name,
        avatarUrl: user.avatar_url || '',
        age: calculateAge(user.birthday),
        gender: user.gender,
        birthday: user.birthday,
        isLive: !!live,
        isFollowing: (viewer?.following || []).includes(userId),
        coverPhotoUrl: 'https://i.pravatar.cc/800?u=cover' + user.id,
        stats: {
          value: user.wallet_earnings,
          icon: 'moon',
        },
        badges: [
          { text: String(user.level), type: 'level' },
          { text: String(calculateAge(user.birthday)), type: 'gender_age', icon: user.gender },
        ],
        protectors: [], // This would be calculated from gift logs
        achievements: [], // This would come from an achievements table
        personalityTags: user.personalityTags || [],
        personalSignature: user.personalSignature || 'Este usuário é muito preguiçoso para deixar uma assinatura.',
        is_avatar_protected: !!user.is_avatar_protected,
        privacy: {
            protectionEnabled: !!user.protectionEnabled,
        }
      };
      return publicProfile;
    }

    if (userByIdMatch && method === 'GET') {
      const userId = parseInt(userByIdMatch[1], 10);
      const user = getDynamicUser(userId);
      return user || notFound();
    }
    
    if (userByIdMatch && method === 'PUT') {
        const userId = parseInt(userByIdMatch[1], 10);
        const userIndex = db.users.findIndex((u: any) => u.id === userId);
        if (userIndex === -1) return notFound();
        const updatedUser = { ...db.users[userIndex], ...body, has_completed_profile: true };
        db.users[userIndex] = updatedUser;
        return getDynamicUser(userId);
    }

    if (userAvatarMatch && method === 'PATCH') {
        const userId = parseInt(userAvatarMatch[1], 10);
        const userIndex = db.users.findIndex((u: any) => u.id === userId);
        if (userIndex === -1) return notFound();
        
        const updatedUser = { ...db.users[userIndex], avatar_url: body.photoDataUrl, has_uploaded_real_photo: true };
        db.users[userIndex] = updatedUser;
        return getDynamicUser(userId);
    }

    if (userFollowersMatch && method === 'GET') {
        const userId = parseInt(userFollowersMatch[1], 10);
        const user = db.users.find((u: any) => u.id === userId);
        if (!user) return notFound();
        const followers = db.users.filter((u: any) => (u.following || []).includes(userId));
        return followers;
    }
    
     if (path.includes('/fans') && method === 'GET') {
        const userId = parseInt(path.split('/')[3], 10);
        const user = db.users.find((u: any) => u.id === userId);
        if (!user) return notFound();
        const followers = db.users.filter((u: any) => (u.following || []).includes(userId));
        return followers;
    }

    if (userFollowingMatch && method === 'GET') {
        const userId = parseInt(userFollowingMatch[1], 10);
        const user = db.users.find((u: any) => u.id === userId);
        if (!user) return notFound();
        const followingUsers = db.users.filter((u: any) => (user.following || []).includes(u.id));
        return followingUsers;
    }

    if (userVisitorsMatch && method === 'GET') {
        const userId = parseInt(userVisitorsMatch[1], 10);
        const visits = db.profileVisits
            .filter((v: types.VisitaPerfil) => v.perfil_visitado_id === userId)
            .sort((a: types.VisitaPerfil, b: types.VisitaPerfil) => new Date(b.data_visita).getTime() - new Date(a.data_visita).getTime());
        
        const visitorIds = [...new Set(visits.map((v: types.VisitaPerfil) => v.visitante_id))];
        const visitors = db.users.filter((u: types.User) => visitorIds.includes(u.id));
        return visitors;
    }

    if (userLiveStatusMatch && method === 'GET') {
        const userId = parseInt(userLiveStatusMatch[1], 10);
        const isLive = db.lives.some((l: types.LiveStreamRecord) => l.user_id === userId && l.ao_vivo);
        return isLive;
    }

    if (stopLiveMatch && method === 'POST') {
        const userId = parseInt(stopLiveMatch[1], 10);
        const live = db.lives.find((l: types.LiveStreamRecord) => l.user_id === userId && l.ao_vivo);
        if (live) {
            live.ao_vivo = false;
            // Also end any active PK battle this user is in
            const pkBattle = db.pkBattles.find((b: types.TabelaBatalhaPK) => 
                b.status === 'ativa' && (b.streamer_A_id === userId || b.streamer_B_id === userId)
            );
            if (pkBattle) {
                pkBattle.status = 'finalizada';
                // Mark the other streamer's live as no longer in PK
                const otherStreamerId = pkBattle.streamer_A_id === userId ? pkBattle.streamer_B_id : pkBattle.streamer_A_id;
                const otherStreamerLive = db.lives.find((l: types.LiveStreamRecord) => l.user_id === otherStreamerId && l.ao_vivo);
                if (otherStreamerLive) {
                    otherStreamerLive.em_pk = false;
                }
            }
        }
        // Always return success even if no live stream was found, to handle cases where stop is called twice.
        return { success: true };
    }
    
    if (followingLiveStatusMatch && method === 'GET') {
        const userId = parseInt(followingLiveStatusMatch[1], 10);
        const user = db.users.find((u: any) => u.id === userId);
        if (!user) return [];

        return (user.following || []).map((followedId: number) => {
            const liveStream = db.lives.find((l: types.LiveStreamRecord) => l.user_id === followedId && l.ao_vivo);
            return {
                userId: followedId,
                isLive: !!liveStream,
                stream: liveStream ? mapLiveRecordToStream(liveStream) : null,
            };
        });
    }

    if (activeStreamMatch && method === 'GET') {
        const userId = parseInt(activeStreamMatch[1], 10);
        const liveRecord = db.lives.find((l: types.LiveStreamRecord) => l.user_id === userId && l.ao_vivo);
        return liveRecord ? mapLiveRecordToStream(liveRecord) : null;
    }

     if (userLevelMatch && method === 'GET') {
        const userId = parseInt(userLevelMatch[1], 10);
        const user = db.users.find((u: any) => u.id === userId);
        if (!user) return notFound();
        const nextLevel = user.level + 1;
        return {
            currentLevel: user.level,
            currentXp: user.xp,
            xpForNextLevel: levelService.getXpForLevel(nextLevel),
        } as types.UserLevelInfo;
    }
    
     if (userBlockedListMatch && method === 'GET') {
        const currentUserId = parseInt(userBlockedListMatch[1], 10);
        const blockedIds = db.blockedUsers
            .filter((b: any) => b.blockerId === currentUserId)
            .map((b: any) => b.targetId);
        const blockedUsers = db.users.filter((u: any) => blockedIds.includes(u.id));
        return blockedUsers;
    }

    if (userPreferencesMatch && method === 'GET') {
        const userId = parseInt(userPreferencesMatch[1], 10);
        const user = db.users.find((u: any) => u.id === userId);
        if (!user) return notFound();
        return {
            isPkEnabled: user.pk_enabled_preference ?? true,
            lastCameraUsed: user.last_camera_used || 'user',
            lastSelectedCategory: user.last_selected_category || 'Popular',
        };
    }
    
    if (chatMatch) {
        const liveId = parseInt(chatMatch[1], 10);
        if (method === 'GET') {
            initializeChatForLive(liveId);
            return db.chatMessages[liveId] || [];
        }
        if (method === 'POST') {
            const { userId, message, imageUrl } = body;
            const user = db.users.find((u: any) => u.id === userId);
            if (!user) return notFound();
            
            initializeChatForLive(liveId);

            const newMessage: types.ChatMessage = {
                id: Date.now(),
                type: imageUrl ? 'image' : 'message',
                userId,
                username: user.nickname || user.name,
                message,
                imageUrl: imageUrl || undefined,
                timestamp: new Date().toISOString(),
                level: user.level,
                avatarUrl: user.avatar_url,
                age: calculateAge(user.birthday),
                gender: user.gender,
            };
            db.chatMessages[liveId].push(newMessage);
            return newMessage;
        }
    }


  return notFound();
};