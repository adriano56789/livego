import type { User, DbLive, PkSession, Conversation, DiamondPackage, LiveDetails, Gift, Viewer, Like, RankingContributor, ChatMessage, PublicProfile, PkEventDetails, ProtectorDetails, WithdrawalTransaction, InventoryItem, AppEvent, DailyReward, UserRewardStatus, PkRankingData, PurchaseOrder, HelpArticle, PkInvitation, PrivateLiveInviteSettings, NotificationSettings, VersionInfo, SoundEffectLogEntry, UniversalRankingData } from '../types';

export let mockBlockedUsers = new Set<number>();

// A base64 encoded SVG of a simple smiley face for use in achievement badges.
export const smileyIconDataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTAgMThhOCA4IDAgMTAtMTYgOCAxNiAwIDAwMCwwek03IDlhMSAxIDAgMTAwLTIgMSAxIDAgMDAwIDJ6bTctMWExIDEgMCAxMS0yIDAgMSAxIDAgMDEyIDB6bS0uNDY0IDUuNTM1YTEuNzUuNzUgMCAwMS4wODMuNjY1bC0uMDgzLjA4M2EuNzUuNzUgMCAwMS0xLjA2LTEuMDZsLjA4My0uMDgzYS43NS43NSAwIDAxLjk3Ny4zMzJ6IiBjbGlwLXJvbGU9ImV2ZW5vZGQiIC8+PC9zdmc+';

// =================================================================
// MOCK DATABASE
// Este arquivo simula um banco de dados relacional (PostgreSQL) e
// um cache (Redis) conforme a arquitetura sugerida. As chaves primárias
// para usuários e lives são numéricas (simulando SERIAL PRIMARY KEY).
// =================================================================

// -----------------------------------------------------------------
// Tabela: `version_info` (Simulação)
// -----------------------------------------------------------------
export const mockVersionInfo: VersionInfo = {
    minVersion: '1.0.0',
    latestVersion: '1.0.0',
    updateUrl: 'https://livego.example.com/update',
};

// -----------------------------------------------------------------
// Tabela: `reports` e `suggestions` (Simulação)
// -----------------------------------------------------------------
export let mockReportsDatabase: any[] = [];
export let mockSuggestionsDatabase: any[] = [];


// -----------------------------------------------------------------
// Tabela: `usuarios` (Simulação PostgreSQL)
// -----------------------------------------------------------------
export const mockUserDatabase: User[] = [
  // Usuário principal logado - Resetado para o fluxo de onboarding
  {
    id: 10755083,
    name: 'GamerX',
    email: 'gamerx@email.com',
    avatar_url: 'https://images.pexels.com/photos/428364/pexels-photo-428364.jpeg?auto=compress&cs=tinysrgb&w=300',
    has_uploaded_real_photo: true,
    nickname: 'GamerX 👑',
    gender: 'male',
    birthday: '1993-07-20',
    age: 32,
    has_completed_profile: true,
    invite_code: null,
    following: [2, 3, 401, 402, 403, 404, 6, 7],
    followers: 183,
    visitors: 0,
    wallet_earnings: 6353,
    wallet_diamonds: 50,
    paid_stream_ids: [],
    withdrawal_method: null,
    equipped_entry_effect_id: null,
    level: 6,
    xp: 4345,
    last_selected_category: 'Dança',
  },
  // Usuários que são streamers
  { id: 2, name: 'Elektra', email: 'nairobi@livego.com', avatar_url: 'https://images.pexels.com/photos/1848565/pexels-photo-1848565.jpeg?auto=compress&cs=tinysrgb&w=300', following: [10755083], followers: 12500, visitors: 0, wallet_earnings: 100, wallet_diamonds: 50, nickname: 'Elektra', paid_stream_ids: [], withdrawal_method: null, level: 12, xp: 15000, gender: 'female', birthday: '1995-05-10', age: 30, has_uploaded_real_photo: true, has_completed_profile: true },
  { id: 3, name: 'Mulher Maravilha', email: 'ww@livego.com', avatar_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300', following: [10755083], followers: 45000, visitors: 0, wallet_earnings: 100, wallet_diamonds: 50, nickname: 'WW', gender: 'female', age: 28, has_completed_profile: true, has_uploaded_real_photo: true, birthday: '1996-03-22', paid_stream_ids: [], withdrawal_method: null, level: 10, xp: 11200 },
  { id: 401, name: 'Lest Go 500 K...', email: 'lestgo@livego.com', avatar_url: 'https://images.pexels.com/photos/1758144/pexels-photo-1758144.jpeg?auto=compress&cs=tinysrgb&w=400&h=600', following: [10755083], followers: 500000, visitors: 0, wallet_earnings: 100, wallet_diamonds: 50, nickname: 'Lest Go 500 K...', paid_stream_ids: [], withdrawal_method: null, level: 25, xp: 63000, gender: 'female', birthday: '1998-01-15', age: 27, has_uploaded_real_photo: true, has_completed_profile: true },
  { id: 402, name: 'Emy', email: 'emy@livego.com', avatar_url: 'https://images.pexels.com/photos/459392/pexels-photo-459392.jpeg?auto=compress&cs=tinysrgb&w=400&h=600', following: [10755083], followers: 180000, visitors: 0, wallet_earnings: 100, wallet_diamonds: 50, nickname: 'Emy', paid_stream_ids: [], withdrawal_method: null, level: 22, xp: 49000, gender: 'female', birthday: '1999-06-20', age: 26, has_uploaded_real_photo: true, has_completed_profile: true },
  { id: 403, name: 'Help 150K', email: 'help150k@livego.com', avatar_url: 'https://images.pexels.com/photos/3220360/pexels-photo-3220360.jpeg?auto=compress&cs=tinysrgb&w=400&h=600', following: [], followers: 150000, visitors: 0, wallet_earnings: 100, wallet_diamonds: 50, nickname: 'Help 150K', paid_stream_ids: [], withdrawal_method: null, level: 18, xp: 33000, gender: 'female', birthday: '2000-02-02', age: 25, has_uploaded_real_photo: true, has_completed_profile: true },
  { id: 404, name: 'Luh_Araujo0', email: 'luh@livego.com', avatar_url: 'https://images.pexels.com/photos/2613260/pexels-photo-2613260.jpeg?auto=compress&cs=tinysrgb&w=400&h=600', following: [], followers: 85000, visitors: 0, wallet_earnings: 100, wallet_diamonds: 50, nickname: 'Luh_Araujo0', paid_stream_ids: [], withdrawal_method: null, level: 15, xp: 23000, gender: 'female', birthday: '2001-11-11', age: 23, has_uploaded_real_photo: true, has_completed_profile: true },
  { id: 6, name: 'PK-Master', email: 'pk@livego.com', avatar_url: 'https://i.pravatar.cc/150?u=user_s5', following: [], followers: 75000, visitors: 0, wallet_earnings: 100, wallet_diamonds: 50, paid_stream_ids: [], withdrawal_method: null, level: 30, xp: 91000, nickname: 'PK-Master', gender: 'male', birthday: '1994-04-04', age: 31, has_uploaded_real_photo: true, has_completed_profile: true },
  { id: 7, name: 'GamerGirl', email: 'gg@livego.com', avatar_url: 'https://i.pravatar.cc/150?u=user_s6', following: [], followers: 68000, visitors: 0, wallet_earnings: 100, wallet_diamonds: 50, paid_stream_ids: [], withdrawal_method: null, level: 28, xp: 80000, nickname: 'GamerGirl', gender: 'female', birthday: '1996-08-12', age: 28, has_uploaded_real_photo: true, has_completed_profile: true },
  { id: 8, name: 'NovatoStream', email: 'novato@livego.com', avatar_url: 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=300', following: [], followers: 150, visitors: 0, wallet_earnings: 100, wallet_diamonds: 50, nickname: 'NovatoStream', paid_stream_ids: [], withdrawal_method: null, level: 2, xp: 250, gender: 'male', birthday: '2002-03-03', age: 23, has_uploaded_real_photo: true, has_completed_profile: true },
];

export const mockLivesDatabase: DbLive[] = [
    { id: 101, user_id: 401, titulo: 'PK Challenge', nome_streamer: 'Lest Go 500 K...', espectadores: 680460, categoria: 'PK', ao_vivo: true, em_pk: true, is_private: false, entry_fee: null, meta: 'Evento de PK', inicio: '2023-10-27T10:00:00Z', permite_pk: true, received_gifts_value: 120000 },
    { id: 102, user_id: 2, titulo: 'Dança Comigo!', nome_streamer: 'Elektra', espectadores: 520300, categoria: 'Dança', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: 'Top 1 Global', inicio: '2023-10-27T11:00:00Z', permite_pk: true, received_gifts_value: 95000 },
    { id: 103, user_id: 402, titulo: 'Just Chatting', nome_streamer: 'Emy', espectadores: 450100, categoria: 'Popular', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: null, inicio: '2023-10-27T09:30:00Z', permite_pk: false, received_gifts_value: 78000 },
    { id: 104, user_id: 3, titulo: 'Girl Power Hour', nome_streamer: 'Mulher Maravilha', espectadores: 380500, categoria: 'Música', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: 'Cantando sucessos', inicio: '2023-10-27T12:00:00Z', permite_pk: true, received_gifts_value: 65000 },
    { id: 105, user_id: 403, titulo: 'Road to 200k', nome_streamer: 'Help 150K', espectadores: 290800, categoria: 'Popular', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: null, inicio: '2023-10-27T11:30:00Z', permite_pk: false, received_gifts_value: 54000 },
    { id: 106, user_id: 404, titulo: 'Vem dançar!', nome_streamer: 'Luh_Araujo0', espectadores: 120000, categoria: 'Dança', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: null, inicio: '2023-10-27T13:00:00Z', permite_pk: true, received_gifts_value: 32000 },
    { id: 107, user_id: 6, titulo: 'PK Battles All Day', nome_streamer: 'PK-Master', espectadores: 95000, categoria: 'PK', ao_vivo: true, em_pk: true, is_private: false, entry_fee: null, meta: 'Evento de PK', inicio: '2023-10-27T08:00:00Z', permite_pk: true, received_gifts_value: 88000 },
    { id: 108, user_id: 7, titulo: 'Gaming Session', nome_streamer: 'GamerGirl', espectadores: 85000, categoria: 'Popular', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: 'Fortnite Friday', inicio: '2023-10-27T14:00:00Z', permite_pk: false, received_gifts_value: 21000 },
    { id: 109, user_id: 8, titulo: 'Minha Primeira Live!', nome_streamer: 'NovatoStream', espectadores: 150, categoria: 'Novo', ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: null, inicio: '2023-10-27T15:00:00Z', permite_pk: true, received_gifts_value: 500 },
    { id: 110, user_id: 10755083, titulo: 'Festa Privada!', nome_streamer: 'GamerX 👑', espectadores: 5, categoria: 'Privada', ao_vivo: true, em_pk: false, is_private: true, entry_fee: 100, meta: 'Só para amigos', inicio: '2023-10-27T16:00:00Z', permite_pk: false, received_gifts_value: 1000 },
];

export const mockPkSessionDatabase: PkSession[] = [
    { id: 201, stream1Id: 101, stream2Id: 107, score1: 120000, score2: 88000, startTime: '2023-10-27T10:00:00Z', endTime: null },
];

export const mockConversationsDatabase: Omit<Conversation, 'otherUserName' | 'otherUserAvatarUrl'>[] = [
    { id: 'conv-1', otherUserId: 2, unreadCount: 2, messages: [
        { id: 1, senderId: 2, text: 'Ei! Vi que você entrou na minha live!', timestamp: '2023-10-27T11:05:00Z', status: 'sent', seenBy: [] },
        { id: 2, senderId: 2, text: 'Obrigado pelo presente! ❤️', timestamp: '2023-10-27T11:05:30Z', status: 'sent', seenBy: [] },
    ]},
    { id: 'conv-2', otherUserId: 3, unreadCount: 0, messages: [
        { id: 3, senderId: 10755083, text: 'Adorei sua live de música!', timestamp: '2023-10-27T12:15:00Z', status: 'seen', seenBy: [3] },
        { id: 4, senderId: 3, text: 'Obrigada! Fico feliz que gostou 😊', timestamp: '2023-10-27T12:16:00Z', status: 'seen', seenBy: [10755083] },
    ]},
];

export let mockPurchaseOrders: PurchaseOrder[] = [];
export let mockWithdrawalTransactions: WithdrawalTransaction[] = [];
export let mockPkInvitationsDatabase: PkInvitation[] = [];
export let mockPrivateLiveInviteSettings: PrivateLiveInviteSettings[] = [];
export let mockNotificationSettings: NotificationSettings[] = [];
export let mockUserInventory: Record<number, InventoryItem[]> = {};
export let mockChatDatabase: Record<number, ChatMessage[]> = {};
export let mockPublicProfiles: Record<number, Partial<PublicProfile>> = {};
export let mockGiftCatalog: Gift[] = [
    { id: 1, name: 'Rosa', price: 1, imageUrl: 'https://storage.googleapis.com/genai-assets/rose.png' },
    { id: 2, name: 'Sorvete', price: 10, imageUrl: 'https://storage.googleapis.com/genai-assets/icecream.png' },
    { id: 3, name: 'Diamante', price: 50, imageUrl: 'https://storage.googleapis.com/genai-assets/diamond.png' },
    { id: 4, name: 'Coroa', price: 100, imageUrl: 'https://storage.googleapis.com/genai-assets/crown.png' },
    { id: 5, name: 'Carro Esportivo', price: 1000, imageUrl: 'https://storage.googleapis.com/genai-assets/sportscar.png' },
    { id: 6, name: 'Castelo', price: 5000, imageUrl: 'https://storage.googleapis.com/genai-assets/castle.png' },
];
export let mockMutedUsersInLive: Record<number, Record<number, { mutedUntil: string }>> = {};
export let mockViewers: Record<number, Viewer[]> = {};
export let mockRankings: Record<number, { hourly: RankingContributor[], daily: RankingContributor[], weekly: RankingContributor[], monthly: RankingContributor[] }> = {};
export let mockLiveConnections: Record<number, Set<number>> = {};
export let mockLikes: Record<number, Like[]> = {};
export let mockKickedUsersFromLive: Record<number, number[]> = {};
export let mockSoundEffectLog: SoundEffectLogEntry[] = [];
export let mockPkPreferences: Record<number, boolean> = {};
export let mockPkEventData: PkEventDetails = {
    totalPrize: 50000,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    streamerRanking: [],
    userRanking: [],
};
export let mockHelpArticles: HelpArticle[] = [
    { id: 'faq', title: 'Perguntas Frequentes', content: '<h1>FAQ</h1><p>...</p>' },
    { id: 'withdrawal-problems', title: 'Problemas com saque', content: '<h1>Solução de Saques</h1><p>...</p>' },
    { id: 'how-to-go-live', title: 'Como iniciar uma live?', content: '<h1>Indo ao vivo</h1><p>...</p>' },
    { id: 'community-rules', title: 'Regras da comunidade', content: '<h1>Regras</h1><p>...</p>' },
    { id: 'account-security', title: 'Segurança da conta', content: '<h1>Segurança</h1><p>...</p>' },
];
export const mockDiamondPackages: DiamondPackage[] = [
    { id: 1, diamonds: 100, price: 5.99, currency: 'BRL' },
    { id: 2, diamonds: 500, price: 28.99, currency: 'BRL' },
    { id: 3, diamonds: 1000, price: 54.99, currency: 'BRL' },
    { id: 4, diamonds: 2000, price: 109.99, currency: 'BRL' },
    { id: 5, diamonds: 5000, price: 279.99, currency: 'BRL' },
    { id: 6, diamonds: 10000, price: 549.99, currency: 'BRL' },
];
export let mockSupportConversation: Conversation = {
    id: 'conv-support-10755083',
    otherUserId: 999,
    otherUserName: 'Suporte LiveGo',
    otherUserAvatarUrl: 'https://storage.googleapis.com/genai-assets/support_avatar.png',
    unreadCount: 1,
    messages: [
        { id: 1, senderId: 999, text: 'Olá! Como podemos ajudar você hoje?', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), status: 'sent', seenBy: [] }
    ]
};
export let mockUserRewardsStatus: Record<number, UserRewardStatus> = {};
export let mockPushSettings: Record<number, Record<number, boolean>> = {};
export let mockProfileVisitors: Record<number, number[]> = {};

export const mockUniversalRankingData: Record<string, UniversalRankingData> = {
  'hourly_venezuela': {
    podium: [
      { rank: 1, userId: 201, avatarUrl: 'https://images.pexels.com/photos/3764014/pexels-photo-3764014.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'T☆...', score: 200, level: 8, gender: 'female', badges: [{type: 'flag', value: '🇻🇪'}, {type: 'v_badge', value: 1}] },
      { rank: 2, userId: 202, avatarUrl: 'https://images.pexels.com/photos/718978/pexels-photo-718978.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'OSPL', score: 200, level: 33, gender: 'female', badges: [{type: 'flag', value: '🇨🇴'}, {type: 'v_badge', value: 1}] },
      { rank: 3, userId: 203, avatarUrl: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=120', name: '...🎀', score: 100, level: 14, gender: 'female', badges: [{type: 'flag', value: '🇺🇸'}, {type: 'v_badge', value: 1}] },
    ],
    list: [
      { rank: 4, userId: 204, avatarUrl: 'https://images.pexels.com/photos/837358/pexels-photo-837358.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'carolina24265466', score: 67, level: 6, gender: 'male', badges: [{type: 'flag', value: '🇻🇪'}] },
      { rank: 5, userId: 205, avatarUrl: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'w Maddison💕', score: 65, level: 4, gender: 'female', badges: [] },
      { rank: 8, userId: 206, avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'Yohandrick Villarr', score: 57, level: 1, gender: 'male', badges: [] },
    ],
    countdown: '45m1s',
    footerButtons: {
      primary: { text: "Conseguiu o primeiro lugar", value: "X144" },
      secondary: { text: "Supere o anterior", value: "X2" }
    }
  },
  'total': {
    podium: [
       { rank: 1, userId: 301, avatarUrl: 'https://i.pravatar.cc/150?u=jdee8', name: 'JDee8...', score: 18, level: 13, gender: 'male', badges: [] },
       { rank: 2, userId: 302, avatarUrl: 'https://i.pravatar.cc/150?u=steve', name: 'steve...', score: 10, level: 16, gender: 'male', badges: [{type: 'flag', value: '🇸🇸'}] },
       { rank: 3, userId: 303, avatarUrl: 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'Henri...', score: 4, level: 12, gender: 'male', badges: [] },
    ],
    list: [
      { rank: 4, userId: 304, avatarUrl: 'https://i.pravatar.cc/150?u=elver83', name: 'Elver83', score: 3, level: 21, gender: 'male', badges: [] },
      { rank: 5, userId: 305, avatarUrl: 'https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'dani pinga fogo', score: 2, level: 9, gender: 'female', badges: [] },
      { rank: 6, userId: 306, avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'gustavoitry', score: 2, level: 9, gender: 'male', badges: [{type: 'flag', value: '🇨🇱'}] },
    ]
  }
};

const mockBrazilRankingData: UniversalRankingData = {
    podium: [
      { rank: 1, userId: 501, avatarUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'LucasBR', score: 250, level: 10, gender: 'male', badges: [{type: 'flag', value: '🇧🇷'}, {type: 'v_badge', value: 1}] },
      { rank: 2, userId: 502, avatarUrl: 'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'Juliana S.', score: 220, level: 25, gender: 'female', badges: [{type: 'flag', value: '🇧🇷'}, {type: 'v_badge', value: 1}] },
      { rank: 3, userId: 202, avatarUrl: 'https://images.pexels.com/photos/718978/pexels-photo-718978.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'OSPL', score: 200, level: 33, gender: 'female', badges: [{type: 'flag', value: '🇨🇴'}, {type: 'v_badge', value: 1}] },
    ],
    list: [
      { rank: 4, userId: 504, avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'fernando_oficial', score: 150, level: 8, gender: 'male', badges: [{type: 'flag', value: '🇧🇷'}] },
      { rank: 5, userId: 505, avatarUrl: 'https://images.pexels.com/photos/3772510/pexels-photo-3772510.jpeg?auto=compress&cs=tinysrgb&w=120', name: 'Gabi ✨', score: 135, level: 5, gender: 'female', badges: [] },
      { rank: 6, userId: 203, avatarUrl: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=120', name: '...🎀', score: 100, level: 14, gender: 'female', badges: [{type: 'flag', value: '🇺🇸'}, {type: 'v_badge', value: 1}] },
    ],
    countdown: '32m15s',
    footerButtons: {
      primary: { text: "Conseguiu o primeiro lugar", value: "X120" },
      secondary: { text: "Supere o anterior", value: "X3" }
    }
};

mockUniversalRankingData['hourly_global'] = { ...mockUniversalRankingData['hourly_venezuela'], list: [...mockUniversalRankingData['hourly_venezuela'].list].reverse() };
mockUniversalRankingData['hourly_brazil'] = mockBrazilRankingData;
mockUniversalRankingData['daily'] = mockUniversalRankingData['total'];
mockUniversalRankingData['weekly'] = { ...mockUniversalRankingData['total'], list: [...mockUniversalRankingData['total'].list].reverse() };
