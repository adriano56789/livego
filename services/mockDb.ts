import type { User, DbLive, PkSession, Conversation, DiamondPackage, Gift, Viewer, Like, RankingContributor, ChatMessage, PublicProfile, PkEventDetails, ProtectorDetails, WithdrawalTransaction, InventoryItem, AppEvent, DailyReward, UserRewardStatus, PkRankingData, PurchaseOrder, HelpArticle, PkInvitation, PrivateLiveInviteSettings, NotificationSettings, VersionInfo, SoundEffectLogEntry, UniversalRankingData, GiftTransaction, UserListRankingPeriod, EventStatus, ReportPayload, SuggestionPayload } from '../types';

export const mockBlockedRelationships: { blockerId: number, targetId: number }[] = [];

// A base64 encoded SVG of a simple smiley face for use in achievement badges.
export const smileyIconDataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTAgMThhOCA4IDAgMTAtMTYgOCAxNiAwIDAwMCwwek03IDlhMSAxIDAgMTAwLTIgMSAxIDAgMDAwIDJ6bTctMWExIDEgMCAxMS0yIDAgMSAxIDAgMDEyIDB6bS0uNDY0IDUuNTM1YTEuNzUuNzUgMCAwMS4wODMuNjY1bC0uMDgzLjA4M2EuNzUuNzUgMCAwMS0xLjA2LTEuMDZsLjA4My0uMDgzYS43NS43NSAwIDAxLjk3Ny4zMzJ6IiBjbGlwLXJ1WGU9ImV2ZW5vZGQiLz48L3N2Zz4=';


export const mockUserDatabase: User[] = [
    {
        id: 10755083,
        name: "Usuário Principal",
        email: "usuario@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=10755083",
        nickname: "GamerX 🎮",
        gender: "male",
        birthday: "1993-05-15",
        age: 32,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        invite_code: "LIVEGO2025",
        following: [401, 402, 403, 404, 405],
        followers: 12500,
        visitors: 8900,
        wallet_earnings: 75000,
        wallet_diamonds: 1200,
        paid_stream_ids: [],
        withdrawal_method: { method: "pix", account: "user@email.com" },
        equipped_entry_effect_id: "entry_effect_1",
        level: 45,
        xp: 60000,
        last_camera_used: 'user',
        last_selected_category: 'Popular',
        country: 'BR',
    },
    {
        id: 401,
        name: "Lest Go",
        email: "lestgo@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=401",
        nickname: "Lest Go 500 K...",
        gender: "female",
        birthday: "1998-10-20",
        age: 26,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [10755083],
        followers: 512000,
        visitors: 150000,
        wallet_earnings: 250000,
        wallet_diamonds: 5000,
        level: 82,
        xp: 180000,
        country: 'BR',
        withdrawal_method: null,
    },
    {
        id: 402,
        name: "Simone",
        email: "simone@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=402",
        nickname: "Simone 🦋",
        gender: "female",
        birthday: "1995-02-11",
        age: 30,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [],
        followers: 32000,
        visitors: 45000,
        wallet_earnings: 120000,
        wallet_diamonds: 800,
        level: 65,
        xp: 120000,
        country: 'PT',
        withdrawal_method: null,
    },
    {
        id: 403,
        name: "Fernando",
        email: "fernando@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=403",
        nickname: "Fernando11...",
        gender: "male",
        birthday: "2000-01-01",
        age: 25,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [],
        followers: 15000,
        visitors: 22000,
        wallet_earnings: 80000,
        wallet_diamonds: 300,
        level: 50,
        xp: 85000,
        country: 'BR',
        withdrawal_method: null,
    },
    {
        id: 404,
        name: "PK Host",
        email: "pkhost@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=404",
        nickname: "PK Host",
        gender: "male",
        birthday: "1999-07-07",
        age: 25,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [],
        followers: 180000,
        visitors: 95000,
        wallet_earnings: 450000,
        wallet_diamonds: 10000,
        level: 95,
        xp: 250000,
        country: 'US',
        withdrawal_method: null,
    },
    {
        id: 405,
        name: "Music Queen",
        email: "music@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=405",
        nickname: "Music Queen 🎶",
        gender: "female",
        birthday: "1996-12-25",
        age: 28,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [],
        followers: 98000,
        visitors: 62000,
        wallet_earnings: 210000,
        wallet_diamonds: 1500,
        level: 78,
        xp: 160000,
        country: 'JP',
        withdrawal_method: null,
    },
    {
        id: 406,
        name: "New Streamer",
        email: "newstreamer@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=406",
        nickname: "LiveGo Star",
        gender: "female",
        birthday: "1997-08-10",
        age: 28,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [],
        followers: 75000,
        visitors: 32000,
        wallet_earnings: 95000,
        wallet_diamonds: 2200,
        level: 70,
        xp: 140000,
        country: 'BR',
        withdrawal_method: null,
    },
    {
        id: 407,
        name: "New Streamer 107",
        email: "newstreamer107@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=407",
        nickname: "LiveGo 107",
        gender: "male",
        birthday: "1999-09-09",
        age: 26,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [],
        followers: 12000,
        visitors: 5000,
        wallet_earnings: 15000,
        wallet_diamonds: 500,
        level: 30,
        xp: 40000,
        country: 'IT',
        withdrawal_method: null,
    },
    {
        id: 408,
        name: "Streamer 108",
        email: "streamer108@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=408",
        nickname: "Live Pro 108",
        gender: "male",
        birthday: "2001-01-01",
        age: 24,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [],
        followers: 5000,
        visitors: 2000,
        wallet_earnings: 5000,
        wallet_diamonds: 200,
        level: 25,
        xp: 30000,
        country: 'AR',
        withdrawal_method: null,
    },
    {
        id: 409,
        name: "Dancer Extra",
        email: "dancer@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=409",
        nickname: "Dança Comigo",
        gender: "female",
        birthday: "2002-03-15",
        age: 23,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [],
        followers: 8200,
        visitors: 3000,
        wallet_earnings: 9000,
        wallet_diamonds: 150,
        level: 28,
        xp: 35000,
        country: 'BR',
        withdrawal_method: null,
    },
    {
        id: 410,
        name: "Private Streamer",
        email: "private@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=410",
        nickname: "Sala Secreta",
        gender: "male",
        birthday: "2000-05-20",
        age: 25,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [],
        followers: 1500,
        visitors: 800,
        wallet_earnings: 2000,
        wallet_diamonds: 100,
        level: 20,
        xp: 25000,
        country: 'BR',
        withdrawal_method: null,
    },
    {
        id: 1201,
        name: "LiveGoFan",
        email: "livegofan@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=1201",
        nickname: "LiveGoFan 👍",
        gender: "male",
        birthday: "2005-01-01",
        age: 20,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [],
        followers: 10,
        visitors: 5,
        wallet_earnings: 100,
        wallet_diamonds: 50,
        withdrawal_method: null,
        level: 3,
        xp: 500,
        country: 'BR',
    },
    {
        id: 1202,
        name: "SuperUser",
        email: "superuser@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=1202",
        nickname: "SuperUser 👾",
        gender: "female",
        birthday: "2002-02-02",
        age: 23,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [401],
        followers: 150,
        visitors: 80,
        wallet_earnings: 2500,
        wallet_diamonds: 800,
        withdrawal_method: null,
        level: 10,
        xp: 12000,
        country: 'PT',
    },
    {
        id: 1203,
        name: "LiveStar",
        email: "livestar@livego.com",
        avatar_url: "https://i.pravatar.cc/150?u=1203",
        nickname: "LiveStar ✨",
        gender: "female",
        birthday: "1999-03-03",
        age: 26,
        has_uploaded_real_photo: true,
        has_completed_profile: true,
        following: [401, 402, 403],
        followers: 5000,
        visitors: 2000,
        wallet_earnings: 15000,
        wallet_diamonds: 3000,
        withdrawal_method: null,
        level: 32,
        xp: 45000,
        country: 'US',
    },
];

export const mockLivesDatabase: DbLive[] = [
    { id: 101, user_id: 401, titulo: "PK Challenge", nome_streamer: "Lest Go 500 K...", thumbnail_url: "https://i.pravatar.cc/400?u=401", espectadores: 680460, categoria: "PK", ao_vivo: true, em_pk: true, is_private: false, entry_fee: null, meta: "Evento de PK", inicio: new Date().toISOString(), permite_pk: true },
    { id: 102, user_id: 402, titulo: "Chill Vibes", nome_streamer: "Simone 🦋", thumbnail_url: "https://i.pravatar.cc/400?u=402", espectadores: 1200, categoria: "Música", ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: "Relaxando com música", inicio: new Date().toISOString(), permite_pk: true },
    { id: 103, user_id: 403, titulo: "Just Chatting", nome_streamer: "Fernando11...", thumbnail_url: "https://i.pravatar.cc/400?u=403", espectadores: 850, categoria: "Popular", ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: null, inicio: new Date().toISOString(), permite_pk: false },
    { id: 104, user_id: 405, titulo: "Live Concert", nome_streamer: "Music Queen 🎶", thumbnail_url: "https://i.pravatar.cc/400?u=405", espectadores: 4500, categoria: "Música", ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: "Show ao vivo!", inicio: new Date().toISOString(), permite_pk: true },
    { id: 105, user_id: 404, titulo: "PK Hype", nome_streamer: "PK Host", thumbnail_url: "https://i.pravatar.cc/400?u=404", espectadores: 1500, categoria: "PK", ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: "Vem pro PK!", inicio: new Date().toISOString(), permite_pk: true },
    { id: 106, user_id: 406, titulo: "Welcome!", nome_streamer: "LiveGo Star", thumbnail_url: "https://i.pravatar.cc/400?u=406", espectadores: 3200, categoria: "Popular", ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: "Let's chat!", inicio: new Date().toISOString(), permite_pk: true },
    { id: 107, user_id: 407, titulo: "Italian Vibes", nome_streamer: "LiveGo 107", thumbnail_url: "https://i.pravatar.cc/400?u=407", espectadores: 1337, categoria: "Popular", ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: "Chatting from Italy!", inicio: new Date().toISOString(), permite_pk: true },
    { id: 108, user_id: 408, titulo: "Argentinian Live", nome_streamer: "Live Pro 108", thumbnail_url: "https://i.pravatar.cc/400?u=408", espectadores: 987, categoria: "Popular", ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: "¡Vamos!", inicio: new Date().toISOString(), permite_pk: true },
    { id: 109, user_id: 409, titulo: "Dance Party!", nome_streamer: "Dança Comigo", thumbnail_url: "https://i.pravatar.cc/400?u=409", espectadores: 1234, categoria: "Dança", ao_vivo: true, em_pk: false, is_private: false, entry_fee: null, meta: "Vem dançar!", inicio: new Date().toISOString(), permite_pk: true },
    { id: 110, user_id: 410, titulo: "Apenas para convidados", nome_streamer: "Sala Secreta", thumbnail_url: "https://i.pravatar.cc/400?u=410", espectadores: 5, categoria: "Privada", ao_vivo: true, em_pk: false, is_private: true, entry_fee: 100, meta: "Sessão privada", inicio: new Date().toISOString(), permite_pk: false },
];

export const mockPkSessionDatabase: PkSession[] = [
    { id: 201, stream1Id: 101, stream2Id: 104, score1: 54200, score2: 48900, startTime: new Date().toISOString(), endTime: null },
];

export const mockConversationsDatabase: Omit<Conversation, 'otherUserName' | 'otherUserAvatarUrl'>[] = [
    {
        id: 'conv-1',
        participants: [10755083, 401],
        otherUserId: 401,
        unreadCount: 2,
        messages: [
            { id: 1, senderId: 401, text: "Hey! Thanks for watching my stream.", timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'sent', seenBy: [] },
            { id: 2, senderId: 401, text: "Hope you enjoyed it! 😄", timestamp: new Date(Date.now() - 3540000).toISOString(), status: 'sent', seenBy: [] },
        ]
    },
    {
        id: 'conv-2',
        participants: [10755083, 402],
        otherUserId: 402,
        unreadCount: 0,
        messages: [
            { id: 3, senderId: 10755083, text: "Your music stream was awesome!", timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'seen', seenBy: [10755083, 402] },
            { id: 4, senderId: 402, text: "Thank you so much! Glad you liked it.", timestamp: new Date(Date.now() - 86340000).toISOString(), status: 'seen', seenBy: [10755083, 402] },
        ]
    }
];

export const mockDiamondPackages: DiamondPackage[] = [
    { id: 1, diamonds: 100, price: 5.99, currency: 'BRL' },
    { id: 2, diamonds: 500, price: 27.99, currency: 'BRL' },
    { id: 3, diamonds: 1000, price: 54.99, currency: 'BRL' },
    { id: 4, diamonds: 2000, price: 109.99, currency: 'BRL' },
    { id: 5, diamonds: 5000, price: 274.99, currency: 'BRL' },
    { id: 6, diamonds: 10000, price: 549.99, currency: 'BRL' },
];

export const mockGiftCatalog: Gift[] = [
    { id: 1, name: "Rosa", price: 10, animationUrl: "https://lottie.host/8e31034a-9b42-4f05-a839-397a6e13309a/T2l5A8iS5l.json" },
    { id: 2, name: "Coração", price: 50, animationUrl: "https://lottie.host/80a87a41-61a7-4560-8f6a-0d19f1f6c4be/Ym2QkI3VDr.json" },
    { id: 3, name: "Diamante", price: 100, animationUrl: "https://lottie.host/b0347895-3b95-4a11-8dee-5a505b38a7c2/WnAs625S8M.json" },
    { id: 8, name: "Coroa", price: 200, animationUrl: "https://lottie.host/6253507c-9562-4318-9c59-25f028e469e3/oFrC6a3B66.json" },
    { id: 4, name: "Carro", price: 500, animationUrl: "https://lottie.host/890875e6-2318-47a3-86b6-f3b1f0c291d5/sY3uWlBinv.json" },
    { id: 5, name: "Foguete", price: 1000, animationUrl: "https://lottie.host/87062402-995a-4cc0-8488-8495a70e7a2b/YgTNHBS3yK.json" },
    { id: 6, name: "Castelo", price: 5000, animationUrl: "https://lottie.host/c58045a5-7f72-4d2c-806b-4e815668e169/aPuvX1yWkF.json" },
    { id: 7, name: "Iate", price: 10000, animationUrl: "https://lottie.host/f7e028b5-31a8-44d4-8d99-52d3a24b104c/k2uI8aE8vM.json" }
];

export const mockLiveConnections: Record<number, Set<number>> = {
    101: new Set([10755083, 402, 403]),
    102: new Set([10755083, 401]),
    103: new Set([401, 402]),
    104: new Set([10755083])
};

export const mockViewers: Record<number, Viewer[]> = {};
export const mockLikes: Record<number, Like[]> = {
    103: [{id: 1, userId: 401, timestamp: new Date().toISOString()}]
};

export const mockRankings: Record<number, RankingContributor[]> = {};
export const mockChatDatabase: Record<number, ChatMessage[]> = {
    103: [
        { id: 1, type: 'entry', username: "Lest Go 500 K...", userId: 401, message: "entrou.", timestamp: new Date().toISOString() },
        { id: 2, type: 'message', level: 82, username: "Lest Go 500 K...", userId: 401, message: "Oi Fernando!", emojis: "👋", color: "pink", timestamp: new Date().toISOString() },
    ]
};
export const mockPublicProfiles: Record<number, Partial<PublicProfile>> = {};
export const mockPkPreferences: Record<number, boolean> = {};
export const mockPkEventDetails: PkEventDetails = { totalPrize: 0, endTime: "", streamerRanking: [], userRanking: [] };
export const mockProtectorsList: Record<number, ProtectorDetails[]> = {
    401: [
        { rank: 1, userId: 10755083, name: "GamerX 🎮", avatarUrl: "https://i.pravatar.cc/150?u=10755083", protectionValue: 150000 },
        { rank: 2, userId: 402, name: "Simone 🦋", avatarUrl: "https://i.pravatar.cc/150?u=402", protectionValue: 95000 },
        { rank: 3, userId: 403, name: "Fernando11...", avatarUrl: "https://i.pravatar.cc/150?u=403", protectionValue: 50000 },
    ]
};
export const mockWithdrawalTransactions: WithdrawalTransaction[] = [];
export const mockUserInventory: Record<number, InventoryItem[]> = {
    10755083: [
        { id: 'entry_effect_1', name: "Entrada Estelar", imageUrl: "https://storage.googleapis.com/genai-assets/entry_effect_star.png", quantity: 1, category: 'decoration', sub_type: 'entry_effect', description: "Faça uma entrada brilhante em qualquer sala." },
    ]
};
export const mockEvents: AppEvent[] = [];
export const mockDailyRewards: DailyReward[] = [];
export const mockUserRewardsStatus: Record<number, UserRewardStatus> = {};
export const mockPkRankingData: PkRankingData = { totalPrize: 0, currency: "", timeRemaining: "", streamerRanking: [], userRanking: [] };
export const mockPurchaseOrders: PurchaseOrder[] = [];
export const mockHelpArticles: HelpArticle[] = [];
export const mockPkInvitationsDatabase: PkInvitation[] = [];
export const mockProfileVisitors: Record<number, number[]> = {};
export const mockPrivateLiveInviteSettings: PrivateLiveInviteSettings[] = [];
export const mockNotificationSettings: NotificationSettings[] = [
    {
        userId: 10755083,
        newMessages: true,
        streamerLive: true,
        followedPost: true,
        order: true,
        interactive: true,
    }
];
export const mockPushSettings: Record<number, Record<number, boolean>> = {};
export const mockVersionInfo: VersionInfo = { minVersion: '1.0.0', latestVersion: '1.0.0', updateUrl: '#' };
export const mockSoundEffectLog: Record<number, SoundEffectLogEntry[]> = {};
export const mockMutedUsersInLive: Record<number, Record<number, { mutedUntil: string }>> = {};
export const mockKickedUsersFromLive: Record<number, number[]> = {};
export const mockSupportConversation: Conversation = { id: "", participants: [], otherUserId: 0, otherUserName: "", otherUserAvatarUrl: "", unreadCount: 0, messages: [] };
export const mockUserListRankingData: Record<UserListRankingPeriod, UniversalRankingData> = {
    daily: { podium: [], list: [] },
    weekly: { podium: [], list: [] },
    total: { podium: [], list: [] },
};
export const mockReportsDatabase: (ReportPayload & { timestamp: string })[] = [];
export const mockSuggestionsDatabase: (SuggestionPayload & { timestamp: string })[] = [];
export const mockGiftTransactionsDatabase: GiftTransaction[] = [];