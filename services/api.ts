
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
      avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
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
        avatar_url: 'https://images.pexels.com/photos/837358/pexels-photo-837358.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', 
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
    { id: 66345102, name: 'Streamer 2', nickname: 'PK Queen', avatar_url: 'https://images.pexels.com/photos/1130624/pexels-photo-1130624.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', following: [10755083], followers: 120000, visitors: 6789, wallet_diamonds: 5000, wallet_earnings: 250000, level: 18, xp: 25000, country: 'US', gender: 'female', birthday: '1998-10-20' },
    { id: 77123403, name: 'Streamer 3', nickname: 'Dancer Live', avatar_url: 'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', following: [], followers: 50000, visitors: 1234, wallet_diamonds: 2000, wallet_earnings: 100000, level: 12, xp: 15000, country: 'ES', gender: 'female', birthday: '2000-03-10' },
    { id: 88567804, name: 'Streamer 4', nickname: 'Music Lover', avatar_url: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', following: [], followers: 80000, visitors: 567, wallet_diamonds: 3000, wallet_earnings: 150000, level: 15, xp: 20000, country: 'BR', gender: 'male', birthday: '1992-12-01' },
    { id: 99887705, name: 'PK Pro', nickname: 'PK Pro ⚡', avatar_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400', following: [10755083], followers: 95000, visitors: 876, wallet_diamonds: 4000, wallet_earnings: 180000, level: 16, xp: 22000, country: 'US', coHostHistory: 'Co-host com Você', gender: 'male', birthday: '1994-08-25' },
    { id: 11223306, name: 'New Challenger', nickname: 'New Challenger', avatar_url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400', following: [], followers: 10000, visitors: 432, wallet_diamonds: 500, wallet_earnings: 5000, level: 5, xp: 1500, country: 'BR', coHostHistory: 'Última vez há 2 dias', gender: 'male', birthday: '2002-06-30' },
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
      { id: 101, user_id: 55218901, titulo: "PK Challenge", nome_streamer: "Lest Go 500 K...", thumbnail_url: 'https://picsum.photos/seed/live1/400/600', espectadores: 6804, categoria: 'PK', ao_vivo: true, em_pk: true, is_private: false, entry_fee: null, meta: 'Evento de PK', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 12500, like_count: 12800, country_code: 'BR' },
      { id: 102, user_id: 66345102, titulo: "Dance Party!", nome_streamer: "PK Queen", thumbnail_url: 'https://picsum.photos/seed/live2/400/600', espectadores: 1205, categoria: 'Dança', ao_vivo: true, em_pk: true, is_private: false, entry_fee: null, meta: 'Vem dançar!', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 8300, like_count: 3200, country_code: 'US' },
      { id: 103, user_id: 77123403, titulo: "Música ao vivo", nome_streamer: "Dancer Live", thumbnail_url: 'https://picsum.photos/seed/live3/400/600', espectadores: 523, categoria: 'Música', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: 'Cantando sucessos', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 4100, like_count: 980, country_code: 'ES' },
      { id: 104, user_id: 88567804, titulo: "Just Chatting", nome_streamer: "Music Lover", thumbnail_url: 'https://picsum.photos/seed/live4/400/600', espectadores: 850, categoria: 'Popular', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: '', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 6200, like_count: 1500, country_code: 'BR' },
      { id: 105, user_id: 99887705, titulo: "Sessão Privada", nome_streamer: "PK Pro ⚡", thumbnail_url: 'https://picsum.photos/seed/live5/400/600', espectadores: 1, categoria: 'Privada', ao_vivo: true, em_pk: false, is_private: true, entry_fee: null, meta: 'Apenas para convidados', inicio: new Date().toISOString(), permite_pk: false, received_gifts_value: 1500, invited_users: [10755083], like_count: 50, country_code: 'US' },
      { id: 106, user_id: 11223306, titulo: "Training for PK", nome_streamer: "New Challenger", thumbnail_url: 'https://picsum.photos/seed/live6/400/600', espectadores: 50, categoria: 'Popular', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: 'Let\'s go!', inicio: new Date().toISOString(), permite_pk: true, received_gifts_value: 200, like_count: 120, country_code: 'BR' },
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
  sentGifts: [] as types.LogPresenteEnviado[],
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
    { id: 1, name: 'Coração', price: 10, valor_pontos: 1, is_ativo: true, animationUrl: 'https://lottie.host/8e4414d7-208b-4309-8446-c2a4b8682a85/q3sAhc01qX.json' },
    { id: 2, name: 'Rosa', price: 20, valor_pontos: 2, is_ativo: true, animationUrl: 'https://lottie.host/7e2968a3-2287-4939-b939-f83193424168/vDAbQ562sY.json' },
    { id: 3, name: 'Foguete', price: 100, valor_pontos: 10, is_ativo: true, animationUrl: 'https://lottie.host/e211832f-a681-4357-893f-561b69735414/jV4mBv3h6i.json' },
    { id: 4, name: 'Coroa', price: 500, valor_pontos: 50, is_ativo: true, animationUrl: 'https://lottie.host/f712499d-122e-436f-8255-66113b593018/k2yHRWJk7N.json' },
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
  protectedAvatars: [
    { hash: 'hash_https://images.pexels.com/photos/837358/pexels-photo-837358.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', userId: 55218901 }
  ] as { hash: string; userId: number }[],
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

  // Use regex for paths with params
  const liveListMatch = path.match(/^\/api\/lives$/);
  const liveByIdMatch = path.match(/^\/api\/lives\/(\d+)$/);
  const liveSummaryMatch = path.match(/^\/api\/lives\/(\d+)\/summary$/);
  const viewersMatch = path.match(/^\/api\/lives\/(\d+)\/viewers$/);
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

  // New Matchers for refactoring
  const blocksMatch = path.match(/^\/api\/blocks$/);
  const blocksWithIdsMatch = path.match(/^\/api\/blocks\/(\d+)\/(\d+)$/);
  const followsMatch = path.match(/^\/api\/follows$/);
  const followsWithIdsMatch = path.match(/^\/api\/follows\/(\d+)\/(\d+)$/);
  
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
        
        return currentUser;
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
      return currentUser;
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
    return db.users.find((u: types.User) => u.id === 10755083);
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

  // LIVES
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
  
  if (liveListMatch && method === 'GET') {
    const category = (query.get('category') || 'popular').toLowerCase();
    const userId = query.get('userId') ? parseInt(query.get('userId')!, 10) : null;
    let results: types.LiveStreamRecord[] = db.lives.filter((l: types.LiveStreamRecord) => l.ao_vivo);

    switch (category) {
        case 'popular':
        case 'perto': // Map Perto to popular as a fallback
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
                        userId: joiningUser.id,
                        username: joiningUser.nickname || joiningUser.name,
                        message: 'entrou',
                        level: joiningUser.level,
                        avatarUrl: joiningUser.avatar_url,
                        age: userAge,
                        gender: joiningUser.gender,
                        timestamp: new Date().toISOString(),
                    };
                    initializeChatForLive(liveId);
                    db.chatMessages[liveId].push(entryMessage);
                }
            }  else {
                live.espectadores = Math.max(0, live.espectadores - 1);
            }
            return { success: true };
        }
        return notFound();
    }
  
  // CHAT
  if (method === 'GET' && chatMatch) {
    const liveId = parseInt(chatMatch[1], 10);
    initializeChatForLive(liveId);
    return db.chatMessages[liveId];
  }

  if (method === 'POST' && path === '/api/chat/upload') {
    // Simulate upload. In a real app, this would save to S3/GCS and return the URL.
    // Here, we just return a random image URL for demonstration.
    const randomId = Math.floor(Math.random() * 1000);
    return { url: `https://picsum.photos/seed/${randomId}/400/300` };
  }

  if (method === 'POST' && chatMatch) {
      const liveId = parseInt(chatMatch[1], 10);
      const { userId, message, imageUrl } = body;
      const user = db.users.find((u: types.User) => u.id === userId);
      if (!user) return notFound();

      const userAge = calculateAge(user.birthday);

      const newMessage: types.ChatMessage = {
          id: Date.now(),
          type: imageUrl ? 'image' : 'message',
          level: user.level,
          username: user.nickname || user.name,
          userId: user.id,
          message: message,
          imageUrl: imageUrl,
          timestamp: new Date().toISOString(),
          avatarUrl: user.avatar_url,
          age: userAge,
          gender: user.gender,
      };
      
      initializeChatForLive(liveId);
      db.chatMessages[liveId].push(newMessage);
      if(db.chatMessages[liveId].length > 50) { // Keep chat history from growing too big
          db.chatMessages[liveId].shift();
      }
      return newMessage;
  }
  
  if (method === 'GET' && userConversationsMatch) {
    const userId = parseInt(userConversationsMatch[1], 10);
    const userConvoRecords = db.conversations.filter((c: types.TabelaConversa) => c.participantes.includes(userId));

    let conversations = userConvoRecords.map((convoRecord: types.TabelaConversa) => 
        buildConversationViewModel(convoRecord, userId)
    );
    
    // Add friend request summary
    const currentUser = db.users.find((u: types.User) => u.id === userId);
    const followers = db.users.filter((u: types.User) => (u.following || []).includes(userId));
    const friendRequests = followers.filter((follower: types.User) => !(currentUser.following || []).includes(follower.id));

    if (friendRequests.length > 0) {
        const friendRequestEntry: types.Conversation = {
            id: 'friend-requests',
            type: 'friend_requests_summary',
            participants: [],
            otherUserId: -1,
            otherUserName: 'Pedidos de Amizade',
            otherUserAvatarUrl: 'https://storage.googleapis.com/genai-assets/friend_request_icon.png',
            unreadCount: friendRequests.length,
            messages: [{
                id: 'fr-last-msg',
                senderId: -1,
                type: 'system',
                text: `${friendRequests[0].nickname} e outros seguiram você.`,
                imageUrl: null,
                timestamp: new Date().toISOString(),
                status: 'sent',
                seenBy: [],
            }],
        };
        conversations.unshift(friendRequestEntry);
    }
    
    conversations.sort((a, b) => {
        if (a.id === 'friend-requests') return -1;
        if (b.id === 'friend-requests') return 1;
        const messagesA = a.messages || [];
        const messagesB = b.messages || [];
        if ((messagesA).length === 0) return 1;
        if ((messagesB).length === 0) return -1;
        const lastMsgA = messagesA[messagesA.length - 1];
        const lastMsgB = messagesB[messagesB.length - 1];
        return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
    });

    return conversations;
  }

  if (method === 'POST' && path === '/api/chat/private/get-or-create') {
      const { currentUserId, otherUserId } = body;
      let convoRecord = db.conversations.find((c: types.TabelaConversa) => 
          c.participantes.includes(currentUserId) && c.participantes.includes(otherUserId)
      );

      if (!convoRecord) {
          const otherUser = db.users.find((u: types.User) => u.id === otherUserId);
          if (!otherUser) throw new Error("Other user not found");

          convoRecord = {
              id: `convo-${Date.now()}`,
              participantes: [currentUserId, otherUserId],
              ultima_mensagem_texto: "",
              ultima_mensagem_timestamp: new Date().toISOString(),
          };
          db.conversations.push(convoRecord);
      }

      return buildConversationViewModel(convoRecord, currentUserId);
  }

  if (privateChatMatch) {
      const convoId = privateChatMatch[1];
      const convoRecord = db.conversations.find((c: types.TabelaConversa) => c.id === convoId);
      if (!convoRecord) return notFound();

      if (method === 'GET') {
          const currentUserId = parseInt(query.get('userId')!, 10);
          return buildConversationViewModel(convoRecord, currentUserId);
      }

      if (method === 'POST') {
          const { senderId, text, imageUrl } = body;
          const newMessage: types.TabelaMensagem = {
              id: `msg-${convoId}-${Date.now()}`,
              conversa_id: convoId,
              remetente_id: senderId,
              conteudo: imageUrl || text,
              timestamp: new Date().toISOString(),
              tipo_conteudo: imageUrl ? 'imagem' : 'texto',
              status_leitura: { [senderId]: true },
          };
          db.messages.push(newMessage);

          convoRecord.ultima_mensagem_texto = imageUrl ? '📷 Imagem' : text;
          convoRecord.ultima_mensagem_timestamp = newMessage.timestamp;

          return buildConversationViewModel(convoRecord, senderId);
      }
  }

  if (method === 'POST' && path === '/api/chat/viewed') {
      const { conversationId, viewerId } = body;
      db.messages.forEach((m: types.TabelaMensagem) => {
          if (m.conversa_id === conversationId && m.remetente_id !== viewerId) {
              m.status_leitura[viewerId] = true;
          }
      });
      return { success: true };
  }

  // USERS
  if (method === 'GET' && userPreferencesMatch) {
    const userId = parseInt(userPreferencesMatch[1], 10);
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) return notFound();
    return {
        isPkEnabled: user.pk_enabled_preference ?? true,
        lastCameraUsed: user.last_camera_used || 'user',
        lastSelectedCategory: user.last_selected_category || 'Popular',
    };
  }
  const userPathMatch = path.match(/^\/api\/users\/(\d+)(?:\/(.*))?$/);
  if (userPathMatch) {
    const userId = parseInt(userPathMatch[1], 10);
    const resource = userPathMatch[2];
    const user = db.users.find((u: types.User) => u.id === userId);
    if (!user) return notFound();

    if (method === 'POST' && resource === 'stop-live') {
        const liveToEnd = db.lives.find((l: types.LiveStreamRecord) => l.user_id === userId && l.ao_vivo);
        if (liveToEnd) {
            liveToEnd.ao_vivo = false;
            if (liveToEnd.em_pk) {
                liveToEnd.em_pk = false;
            }
            console.log(`[Mock API] Stream ${liveToEnd.id} for user ${userId} has been stopped.`);
            return { success: true };
        }
        return { success: true, message: "No active live stream found to stop." };
    }

    if (method === 'PATCH' && resource === 'avatar') {
        user.avatar_url = body.photoDataUrl;
        user.has_uploaded_real_photo = true;
        return user;
    }

    if (method === 'PUT' && !resource) {
        const updatedUser = { ...user, ...body, has_completed_profile: true };
        db.users = db.users.map((u: types.User) => (u.id === userId ? updatedUser : u));
        return updatedUser;
    }

    if (method === 'GET') {
        if (!resource) {
             // Calculate age before returning user
             if (user.birthday) {
                const birthDate = new Date(user.birthday);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                user.age = age;
            }
            return user;
        }
        if (resource === 'level') {
            const currentLevel = user.level || 1;
            const currentXp = user.xp || 0;
            const xpForNextLevel = levelService.getXpForLevel(currentLevel + 1);

            return {
                currentLevel,
                currentXp,
                xpForNextLevel
            } as types.UserLevelInfo;
        }
        if (resource === 'fans') {
            const fans = db.users.filter((u: types.User) => (u.following || []).includes(userId));
            return fans;
        }
        if (resource === 'friends') {
            const currentUser = db.users.find((u: types.User) => u.id === userId);
            if (!currentUser || !currentUser.following) {
                return [];
            }
            const followingIds = new Set(currentUser.following);
            const friends = db.users.filter((u: types.User) => {
                if (followingIds.has(u.id)) {
                    return (u.following || []).includes(userId);
                }
                return false;
            });
            return friends;
        }
        if (resource === 'gifts/received') {
            return { totalValue: user.wallet_earnings || 0 };
        }
        if (resource === 'gifts/sent') {
            const sentValue = db.sentGifts
                .filter((g: types.LogPresenteEnviado) => g.senderId === userId)
                .reduce((sum: number, g: types.LogPresenteEnviado) => sum + g.giftValue, 0);
            return { totalValue: sentValue };
        }
        if (resource === 'cohost-friends') {
            if (!user.following) return [user];
            
            const liveUserIds = new Set(db.lives.filter((l: types.LiveStreamRecord) => l.ao_vivo).map((l: types.LiveStreamRecord) => l.user_id));
            const friends = db.users.filter((u: types.User) => (user.following || []).includes(u.id) && liveUserIds.has(u.id));
            
            // Add the current user to the list for self-invitation testing
            const selfUser = db.users.find((u: types.User) => u.id === userId);
            if (selfUser && !friends.some(f => f.id === selfUser.id)) {
                const selfUserWithHistory = { ...selfUser, coHostHistory: "Convidar a si mesmo (Teste)" };
                friends.unshift(selfUserWithHistory);
            }
            
            return friends;
        }
        if (resource === 'profile') {
            const userAge = user.birthday ? new Date().getFullYear() - new Date(user.birthday).getFullYear() : null;
            const badges = [];
            if (user.level) badges.push({ text: String(user.level), type: 'level' });
            if (userAge && user.gender) badges.push({ text: String(userAge), type: 'gender_age', icon: user.gender as 'male' | 'female' });

            return {
                id: user.id,
                name: user.name,
                nickname: user.nickname,
                avatarUrl: user.avatar_url,
                age: userAge,
                gender: user.gender,
                birthday: user.birthday,
                isLive: db.lives.some((l: types.LiveStreamRecord) => l.user_id === user.id && l.ao_vivo),
                isFollowing: db.users.find((u: any) => u.id === 10755083).following.includes(user.id),
                coverPhotoUrl: `https://picsum.photos/seed/cover${user.id}/800/400`,
                stats: { value: user.wallet_earnings, icon: 'coin' },
                badges: badges,
                protectors: [],
                achievements: [],
                personalityTags: user.personalityTags || [],
                personalSignature: user.personalSignature || 'Apenas boas vibrações!',
            } as types.PublicProfile;
        }
        if (resource === 'live-status') {
            const isLive = db.lives.some((l: types.LiveStreamRecord) => l.user_id === userId && l.ao_vivo);
            return isLive;
        }
        if (resource === 'notification-settings') {
            return {
                userId: userId,
                newMessages: true,
                streamerLive: true,
                followedPost: true,
                order: true,
                interactive: true,
            } as types.NotificationSettings;
        }
        if (resource === 'followers') {
            const followers = db.users.filter((u: types.User) => (u.following || []).includes(userId));
            return followers;
        }
        if (resource === 'following') {
            if (!user.following) return [];
            return db.users.filter((u: types.User) => (user.following || []).includes(u.id));
        }
        if (resource === 'visitors') {
            return db.users.filter((u: types.User) => u.id !== userId).slice(0, 5);
        }
        if (resource === 'following-live-status') {
            const followingIds = user.following;
            const liveUsers = db.lives.filter((l: types.LiveStreamRecord) => l.ao_vivo && (followingIds || []).includes(l.user_id));
            const liveUpdates: types.LiveFollowUpdate[] = (followingIds || []).map((id: number) => {
                const liveStream = liveUsers.find((l: types.LiveStreamRecord) => l.user_id === id);
                return {
                    userId: id,
                    isLive: !!liveStream,
                    stream: liveStream ? mapLiveRecordToStream(liveStream) : null,
                };
            });
            return liveUpdates;
        }
        if (resource === 'pk-preference') {
            return { isPkEnabled: true };
        }
        if (resource === 'withdrawal-balance') {
            const pendingWithdrawals = db.withdrawalTransactions
                .filter((tx: types.WithdrawalTransaction) => tx.userId === userId && tx.status === 'pending')
                .reduce((sum: number, tx: types.WithdrawalTransaction) => sum + tx.earnings_withdrawn, 0);

            const availableBalance = (user.wallet_earnings || 0) - (pendingWithdrawals || 0);

            const balance: types.WithdrawalBalance = {
                totalEarnings: user.wallet_earnings || 0,
                pendingWithdrawals: pendingWithdrawals || 0,
                availableBalance: availableBalance || 0
            };
            return balance;
        }
        if (resource === 'purchase-history') {
            return db.purchaseOrders.filter((o: types.PurchaseOrder) => o.userId === userId)
                .sort((a: types.PurchaseOrder, b: types.PurchaseOrder) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        if (resource === 'withdrawal-history') {
            return db.withdrawalTransactions.filter((tx: types.WithdrawalTransaction) => tx.userId === userId)
                .sort((a: types.WithdrawalTransaction, b: types.WithdrawalTransaction) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
    }
  }

  if (method === 'GET' && userSearchMatch) {
    const queryStr = query.get('q')?.toLowerCase() || '';
    if (!queryStr) return [];
    const results = db.users.filter((u: types.User) => 
        (u.nickname || '').toLowerCase().includes(queryStr) ||
        (u.name || '').toLowerCase().includes(queryStr) ||
        String(u.id).includes(queryStr)
    );
    return results;
  }

  // GIFTS
  if (method === 'GET' && path === '/api/gifts') {
      return db.gifts;
  }
  if (method === 'POST' && giftMatch) {
    const roomLiveId = parseInt(giftMatch[1], 10);
    const { senderId, giftId, receiverId } = body;
    const sender = db.users.find((u: types.User) => u.id === senderId);
    const gift = db.gifts.find((g: types.Gift) => g.id === giftId);

    if (!sender || !gift) return notFound();

    if ((sender.wallet_diamonds || 0) < gift.price) {
        return { success: false, updatedUser: null, message: 'Diamantes insuficientes. Por favor, recarregue.' };
    }
    
    sender.wallet_diamonds = (sender.wallet_diamonds || 0) - gift.price;
    sender.xp = (sender.xp || 0) + gift.valor_pontos; // Gain XP from sending gifts
    sender.level = levelService.calculateLevelFromXp(sender.xp);

    const streamInRoom = db.lives.find((l: types.LiveStreamRecord) => l.id === roomLiveId);
    if (!streamInRoom) return notFound();
    
    const actualReceiverId = receiverId || streamInRoom.user_id;
    const receiverUser = db.users.find((u: types.User) => u.id === actualReceiverId);
    if (receiverUser) {
        receiverUser.wallet_earnings = (receiverUser.wallet_earnings || 0) + gift.valor_pontos;
        receiverUser.xp = (receiverUser.xp || 0) + gift.valor_pontos; // Receiver also gains XP
        receiverUser.level = levelService.calculateLevelFromXp(receiverUser.xp);
    }
    
    const receiverLive = db.lives.find((l: types.LiveStreamRecord) => l.user_id === actualReceiverId && l.ao_vivo);
    if (receiverLive) {
        receiverLive.received_gifts_value = (receiverLive.received_gifts_value || 0) + gift.valor_pontos;
    }

    const activePkBattle = db.pkBattles.find((b: types.TabelaBatalhaPK) => 
        b.status === 'ativa' && (streamInRoom.user_id === b.streamer_A_id || streamInRoom.user_id === b.streamer_B_id)
    );
    
    if (activePkBattle) {
        if (activePkBattle.streamer_A_id === actualReceiverId) {
            activePkBattle.pontuacao_A += gift.valor_pontos;
        } else if (activePkBattle.streamer_B_id === actualReceiverId) {
            activePkBattle.pontuacao_B += gift.valor_pontos;
        }
    }
    
    const giftMessage: types.ChatMessage = {
        id: Date.now(),
        type: 'gift',
        username: sender.nickname || sender.name,
        userId: sender.id,
        message: `enviou um ${gift.name}!`,
        giftName: gift.name,
        giftValue: gift.price,
        giftAnimationUrl: gift.animationUrl,
        timestamp: new Date().toISOString(),
    };
    
    initializeChatForLive(roomLiveId);
    db.chatMessages[roomLiveId].push(giftMessage);
    if(db.chatMessages[roomLiveId].length > 50) {
        db.chatMessages[roomLiveId].shift();
    }
    
    db.sentGifts.push({
      id: Date.now(),
      senderId,
      receiverId: actualReceiverId,
      liveId: roomLiveId,
      giftId,
      giftValue: gift.valor_pontos,
      batalha_id: activePkBattle ? activePkBattle.id : undefined,
      timestamp: new Date().toISOString()
    });
    
    return { success: true, updatedUser: sender, message: 'Presente enviado com sucesso!' } as types.SendGiftResponse;
  }


  // DIAMONDS
  if (method === 'GET' && path === '/api/diamonds/packages') {
      return db.diamondPackages;
  }
  if (method === 'POST' && path === '/api/purchase') {
      const { userId, packageId, address, paymentDetails } = body;
      const user = db.users.find((u: types.User) => u.id === userId);
      const pkg = db.diamondPackages.find((p: types.DiamondPackage) => p.id === packageId);
  
      if (!user || !pkg) {
          throw new Error("Usuário ou pacote não encontrado.");
      }
  
      const order: types.PurchaseOrder = {
          orderId: `ord_${Date.now()}`,
          userId: userId,
          package: pkg,
          address: address,
          paymentDetails: paymentDetails,
          status: paymentDetails.method === 'transfer' ? 'pending' : 'completed',
          timestamp: new Date().toISOString(),
      };
      db.purchaseOrders.push(order);
  
      if (order.status === 'completed') {
          user.wallet_diamonds = (user.wallet_diamonds || 0) + pkg.diamonds;
      }
      
      const updatedUser = { ...user };
      
      return { updatedUser, order };
  }
    
    // RANKING
  if (method === 'GET' && streamerRankingMatch) {
      const rankedStreamers = [...db.users]
          .filter((u: types.User) => (u.followers || 0) > 0 && u.id !== 999)
          .sort((a: types.User, b: types.User) => (b.followers || 0) - (a.followers || 0))
          .map((u: types.User, index: number): types.GeneralRankingStreamer => ({
              rank: index + 1,
              userId: u.id,
              username: u.nickname || u.name,
              avatarUrl: u.avatar_url || '',
              level: u.level || 1,
              followers: u.followers || 0,
          }));
      return rankedStreamers;
  }
  if (method === 'GET' && userRankingMatch) {
      const rankedUsers = [...db.users]
          .filter((u: types.User) => u.id !== 999)
          .sort((a: types.User, b: types.User) => (b.xp || 0) - (a.xp || 0))
          .map((u: types.User, index: number): types.GeneralRankingUser => ({
              rank: index + 1,
              userId: u.id,
              username: u.nickname || u.name,
              avatarUrl: u.avatar_url || '',
              level: u.level || 1,
              xp: u.xp || 0,
          }));
      return rankedUsers;
  }
    if (method === 'GET' && path === '/api/ranking/hourly') {
        const rankedUsers = db.users
            .filter((u: any) => u.id !== 10755083)
            .map((u: any, index: number) => ({
                rank: index + 1,
                userId: u.id,
                avatarUrl: u.avatar_url,
                name: u.nickname || u.name,
                score: 100000 - (index * 15000) + Math.floor(Math.random() * 5000),
                level: u.level,
                gender: u.gender,
                badges: [
                    { type: 'flag', value: '🇧🇷' },
                    { type: 'v_badge', value: 'V' },
                    { type: 'level', value: u.level },
                    { type: 'gender', value: u.gender }
                ]
            } as types.UniversalRankingUser));

        const response: types.UniversalRankingData = {
            podium: rankedUsers.slice(0, 3),
            list: rankedUsers.slice(3, 10),
            currentUserRanking: {
                rank: 25,
                userId: 10755083,
                avatarUrl: db.users.find((u: any) => u.id === 10755083).avatar_url,
                name: db.users.find((u: any) => u.id === 10755083).nickname,
                score: 5230,
                level: db.users.find((u: any) => u.id === 10755083).level,
                gender: db.users.find((u: any) => u.id === 10755083).gender,
                badges: [
                    { type: 'flag', value: '🇧🇷' },
                    { type: 'level', value: db.users.find((u: any) => u.id === 10755083).level },
                ]
            },
            countdown: new Date(Date.now() + 3600 * 1000).toISOString(),
            footerButtons: {
                primary: { text: "Para o primeiro lugar", value: "1060" },
                secondary: { text: "Para entrar na lista", value: "203" }
            }
        };
        return response;
    }
    
    // SUPPORT CHAT
    if (method === 'GET' && supportConvoMatch) {
        const userId = parseInt(supportConvoMatch[1], 10);
        const supportUserId = 999;
        
        let convoRecord = db.conversations.find((c: types.TabelaConversa) => 
            (c.participantes || []).includes(userId) && (c.participantes || []).includes(supportUserId)
        );
        
        if (!convoRecord) {
            convoRecord = {
                id: `support-convo-${userId}`,
                participantes: [userId, supportUserId],
                ultima_mensagem_texto: "Olá! Como podemos ajudar?",
                ultima_mensagem_timestamp: new Date().toISOString(),
            };
            db.conversations.push(convoRecord);
            
            const welcomeMessage: types.TabelaMensagem = {
                id: `msg-support-${userId}-init`,
                conversa_id: convoRecord.id,
                remetente_id: supportUserId,
                conteudo: "Olá! Como podemos ajudar?",
                timestamp: new Date().toISOString(),
                tipo_conteudo: 'texto',
                status_leitura: { [supportUserId]: true },
            };
            db.messages.push(welcomeMessage);
        }
        
        return buildConversationViewModel(convoRecord, userId);
    }

    if (method === 'POST' && supportMessageMatch) {
        const { userId, text } = body;
        const supportUserId = 999;
        let convoRecord = db.conversations.find((c: types.TabelaConversa) => 
            (c.participantes || []).includes(userId) && (c.participantes || []).includes(supportUserId)
        );
        if (!convoRecord) return notFound();

        const newMessage: types.TabelaMensagem = {
            id: `msg-support-${userId}-${Date.now()}`,
            conversa_id: convoRecord.id,
            remetente_id: userId,
            conteudo: text,
            timestamp: new Date().toISOString(),
            tipo_conteudo: 'texto',
            status_leitura: { [userId]: true },
        };
        db.messages.push(newMessage);
        
        convoRecord.ultima_mensagem_texto = text;
        convoRecord.ultima_mensagem_timestamp = newMessage.timestamp;

        // Simulate a support reply
        setTimeout(() => {
            const convo = db.conversations.find((c: types.TabelaConversa) => c.id === convoRecord!.id);
            if (convo) {
                const replyMessage: types.TabelaMensagem = {
                    id: `msg-support-reply-${userId}-${Date.now()}`,
                    conversa_id: convo.id,
                    remetente_id: supportUserId,
                    conteudo: "Obrigado por sua mensagem. Nossa equipe de suporte responderá em breve.",
                    timestamp: new Date().toISOString(),
                    tipo_conteudo: 'texto',
                    status_leitura: {},
                };
                db.messages.push(replyMessage);
                convo.ultima_mensagem_texto = replyMessage.conteudo;
                convo.ultima_mensagem_timestamp = replyMessage.timestamp;
            }
        }, 2000);

        return buildConversationViewModel(convoRecord, userId);
    }


  // Default fallback
  return notFound();
};
