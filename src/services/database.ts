
import { 
    FrameBlazingSunIcon, FrameBlueCrystalIcon, FrameGoldenFloralIcon, FrameBlueFireIcon,
    FrameDiamondIcon, FrameFloralWreathIcon, FrameIcyWingsIcon, FrameMagentaWingsIcon,
    FrameNeonDiamondIcon, FrameNeonPinkIcon, FrameOrnateBronzeIcon, FramePinkGemIcon,
    FramePinkLaceIcon, FramePurpleFloralIcon, FrameRegalPurpleIcon, FrameSilverThornIcon,
    FrameRoseHeartIcon, FrameSilverBeadedIcon 
} from '../components/icons/frames';
import { User, Gift, Streamer, Message, NotificationSettings, BeautySettings, PurchaseRecord, EligibleUser, GoogleAccount, LiveSessionState, StreamHistoryEntry, LevelInfo, Order, LiveNotification, Invitation, DiamondPackage, Fan, Transaction, Country } from '../types';

// --- Interfaces based on Models ---

export interface VIPPlan {
    id: string;
    title: string;
    price: number;
    currency: string;
    durationMonths: number;
    isActive: boolean;
}

export interface LegalDocument {
    slug: string;
    title: string;
    content: string;
    version: string;
    language: string;
    lastUpdated: string;
}

export interface StreamReminder {
    id: string;
    userId: string;
    streamerId: string;
    reminderType: 'one-time' | 'always';
    status: 'pending' | 'sent' | 'cancelled';
    scheduledFor?: string;
}

export interface ChatSettings {
    userId: string;
    partnerId: string;
    isMuted: boolean;
    isPinned: boolean;
    backgroundImageUrl?: string;
}

export interface RefundRequest {
    id: string;
    userId: string;
    purchaseRecordId: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    adminNotes?: string;
    createdAt: string;
}

export interface Report {
    id: string;
    reporterId: string;
    reportedId: string;
    reason: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: string;
}

export interface UserFrame {
    id: string;
    userId: string;
    frameId: string;
    componentName: string;
    isEquipped: boolean;
    isPermanent: boolean;
    obtainedAt: string;
    expiresAt?: string;
    isActive: boolean;
}

export interface FrameLog {
    id: string;
    userId: string;
    frameId: string;
    componentName: string;
    action: 'purchase' | 'equip' | 'unequip' | 'expire' | 'gift_received';
    cost: number;
    timestamp: string;
}

export interface StreamResolution {
    label: string;
    value: string;
    bitrate: number;
    isPremium: boolean;
    isActive: boolean;
    order: number;
}

export interface AppVersion {
    version: string;
    buildNumber: number;
    platform: 'ios' | 'android' | 'web';
    isMandatory: boolean;
    releaseNotes: string;
    downloadUrl: string;
    releaseDate: string;
    isActive: boolean;
}

export interface FriendRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
}

export interface AccountDeletionRequest {
    id: string;
    userId: string;
    reason?: string;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    scheduledFor: string;
    createdAt: string;
}

export interface PushNotificationConfig {
    userId: string;
    isEnabled: boolean;
    preferences: {
        mentions: boolean;
        likes: boolean;
        newFollowers: boolean;
        liveStart: boolean;
        giftReceived: boolean;
    };
    updatedAt: string;
}

export interface WatermarkConfig {
    userId: string;
    isEnabled: boolean;
    opacity: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    showUserName: boolean;
    showUserId: boolean;
    showTimestamp: boolean;
}

export interface ProfileTag { name: string; usageCount: number; isActive: boolean; }
export interface Profession { name: string; isActive: boolean; }
export interface EmotionalStatus { name: string; isActive: boolean; }

export interface ZoomConfig { userId: string; percentage: number; applyToStream: boolean; }
export interface PipConfig { userId: string; isEnabled: boolean; autoEnter: boolean; }
export interface LanguageConfig { userId: string; languageCode: string; autoDetect: boolean; }
export interface PrivateStreamConfig {
    userId: string;
    defaultMode: 'invite_only' | 'password' | 'pay_per_view';
    price?: number;
    password?: string;
    allowFollowers: boolean;
    allowFans: boolean;
    allowFriends: boolean;
}

export interface PKBattleState {
    opponentId: string;
    heartsA: number;
    heartsB: number;
    scoreA: number;
    scoreB: number;
}

export interface UserMedia {
    id: string;
    userId: string;
    url: string;
    type: 'image' | 'video';
    duration?: number;
    sortOrder: number;
    createdAt: string;
}

export interface LevelPrivilege {
    id: string;
    levelRequirement: number;
    title: string;
    description: string;
    iconUrl: string;
    type: 'badge' | 'effect' | 'feature' | 'gift';
    isActive: boolean;
}

export interface StreamViewer {
    id: string;
    streamId: string;
    userId: string;
    joinedAt: string;
    leftAt?: string;
    device?: string;
    isGhost: boolean;
}

export interface ProfileShare {
    id: string;
    sharerId: string;
    profileId: string;
    platform: string;
    createdAt: string;
}

export interface StreamModerationLog {
    id: string;
    streamId: string;
    moderatorId: string;
    targetUserId: string;
    action: 'kick' | 'mute' | 'unmute' | 'block' | 'warn';
    reason?: string;
    createdAt: string;
}

export interface PaymentTransaction {
    id: string;
    orderId: string;
    gatewayTransactionId: string;
    gatewayStatus: string;
    paymentMethod: string;
    amountProcessed: number;
    currency: string;
    createdAt: string;
}

export interface LoadingConfig {
    isActive: boolean;
    color: string;
    size: number;
}

export interface InviteRestriction {
    streamId: string;
    minLevelToInvite: number;
    minLevelToJoin: number;
    allowedRoles: string[];
}

export interface MainScreenStreamer {
    id: string;
    name: string;
    avatar: string;
    isPrivate: boolean;
    country: string;
    viewers: number;
    isActive: boolean;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    order: number;
    isActive: boolean;
}

export interface StreamManual {
    id: string;
    title: string;
    content: string[];
    order: number;
}

export interface BeautyEffect {
    id: string;
    name: string;
    type: 'filter' | 'effect';
    icon?: string;
    defaultValue: number;
    order: number;
    isActive: boolean;
}

export interface GiftAnimationConfig {
    giftId: string;
    animationType: 'lottie' | 'svga' | 'mp4' | 'canvas_particles';
    assetUrl: string;
    fullScreen: boolean;
    durationMs: number;
}

export interface FrameMetadata {
    componentName: string;
    visualConfig: {
        primaryColor: string;
        secondaryColor: string;
        strokeWidth: number;
        hasParticles: boolean;
    };
    rarity: string;
}

// --- LATEST MISSING MODELS ---

export interface SearchHistory {
    id: string;
    userId: string;
    query: string;
    clickedUserId?: string;
    createdAt: string;
}

export interface CameraPermissionState {
    userId: string;
    cameraStatus: 'granted' | 'denied' | 'prompt';
    microphoneStatus: 'granted' | 'denied' | 'prompt';
    updatedAt: string;
}

export interface LocationPermissionState {
    userId: string;
    status: 'granted' | 'denied' | 'prompt';
    updatedAt: string;
}

export interface LoginState {
    id: string;
    userId: string;
    ip: string;
    device: string;
    timestamp: string;
    success: boolean;
}

export interface MarketUser { id: string; userId: string; points: number; tier: string; }
export interface MarketFrame { id: string; name: string; price: number; }
export interface MarketGift { id: string; name: string; price: number; }

export interface MessageUser { id: string; userId: string; lastActive: string; }
export interface MessageConversation { id: string; user1: string; user2: string; lastMessage: string; updatedAt: string; }
export interface MessageFriendRequest { id: string; from: string; to: string; status: 'pending'|'accepted'; }

export interface LevelUser { id: string; userId: string; currentXp: number; }
export interface StreamContributor { id: string; streamId: string; userId: string; amount: number; }
export interface StreamSummary { id: string; streamId: string; totalCoins: number; duration: number; }

export interface SpecificFrameInventory {
    id: string;
    userId: string;
    frameType: string; // e.g. 'FrameBlazingSun'
    purchasedAt: string;
    expiresAt?: string;
}

// --- SPECIFIC FRAME MODELS ---
export interface IFrameBase { id: string; userId: string; isEquipped: boolean; purchasedAt: string; }
export interface FrameBlazingSun extends IFrameBase {}
export interface FrameBlueCrystal extends IFrameBase {}
export interface FrameGoldenFloral extends IFrameBase {}
export interface FrameBlueFire extends IFrameBase {}
export interface FrameDiamond extends IFrameBase {}
export interface FrameFloralWreath extends IFrameBase {}
export interface FrameIcyWings extends IFrameBase {}
export interface FrameMagentaWings extends IFrameBase {}
export interface FrameNeonDiamond extends IFrameBase {}
export interface FrameNeonPink extends IFrameBase {}
export interface FrameOrnateBronze extends IFrameBase {}
export interface FramePinkGem extends IFrameBase {}
export interface FramePinkLace extends IFrameBase {}
export interface FramePurpleFloral extends IFrameBase {}
export interface FrameRegalPurple extends IFrameBase {}
export interface FrameSilverThorn extends IFrameBase {}
export interface FrameRoseHeart extends IFrameBase {}
export interface FrameSilverBeaded extends IFrameBase {}

// --- NEWEST MODELS FOR 100% COVERAGE ---
export interface WalletData { userId: string; diamonds: number; earnings: number; updatedAt: string; }
export interface UserProfileData { userId: string; nickname: string; bio: string; updatedAt: string; }
export interface GiftNotificationConfig { userId: string; minPrice: number; enabled: boolean; }
export interface AvatarFrameCatalogItem { id: string; name: string; price: number; }
export interface PKConfig { userId: string; duration: number; }
export interface GoogleRegistration { id: string; firstName: string; lastName?: string; createdAt: string; }
export interface GooglePassword { id: string; passwordHash: string; createdAt: string; }
export interface Region { id: string; name: string; code: string; }
export interface CountryModel { id: string; name: string; code: string; }

// Global Constants & Helpers
export const CURRENT_USER_ID = '10755083';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createChatKey = (user1: string, user2: string) => {
    return [user1, user2].sort().join('-');
};

export const getRemainingDays = (expirationDate?: string | null) => {
    if (!expirationDate) return 0;
    const now = new Date();
    const exp = new Date(expirationDate);
    const diffTime = exp.getTime() - now.getTime();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

export const getFrameGlowClass = (frameId?: string | null) => {
    if (!frameId) return '';
    return `frame-glow-${frameId}`; 
};

// Avatar Frames Catalog (Static Data)
export const avatarFrames = [
    { id: 'blazing-sun', name: 'Sol Escaldante', price: 1500, currency: 'diamonds', duration: 30, component: FrameBlazingSunIcon, componentName: 'FrameBlazingSunIcon' },
    { id: 'blue-crystal', name: 'Cristal Azul', price: 1200, currency: 'diamonds', duration: 30, component: FrameBlueCrystalIcon, componentName: 'FrameBlueCrystalIcon' },
    { id: 'golden-floral', name: 'Floral Dourado', price: 1000, currency: 'diamonds', duration: 30, component: FrameGoldenFloralIcon, componentName: 'FrameGoldenFloralIcon' },
    { id: 'blue-fire', name: 'Fogo Azul', price: 2000, currency: 'diamonds', duration: 30, component: FrameBlueFireIcon, componentName: 'FrameBlueFireIcon' },
    { id: 'diamond-ring', name: 'Anel de Diamante', price: 2500, currency: 'diamonds', duration: 30, component: FrameDiamondIcon, componentName: 'FrameDiamondIcon' },
    { id: 'floral-wreath', name: 'Coroa Floral', price: 800, currency: 'diamonds', duration: 30, component: FrameFloralWreathIcon, componentName: 'FrameFloralWreathIcon' },
    { id: 'icy-wings', name: 'Asas Gélidas', price: 3000, currency: 'diamonds', duration: 30, component: FrameIcyWingsIcon, componentName: 'FrameIcyWingsIcon' },
    { id: 'magenta-wings', name: 'Asas Magenta', price: 2800, currency: 'diamonds', duration: 30, component: FrameMagentaWingsIcon, componentName: 'FrameMagentaWingsIcon' },
    { id: 'neon-diamond', name: 'Diamante Neon', price: 1800, currency: 'diamonds', duration: 30, component: FrameNeonDiamondIcon, componentName: 'FrameNeonDiamondIcon' },
    { id: 'neon-pink', name: 'Neon Rosa', price: 1600, currency: 'diamonds', duration: 30, component: FrameNeonPinkIcon, componentName: 'FrameNeonPinkIcon' },
    { id: 'ornate-bronze', name: 'Bronze Ornato', price: 900, currency: 'diamonds', duration: 30, component: FrameOrnateBronzeIcon, componentName: 'FrameOrnateBronzeIcon' },
    { id: 'pink-gem', name: 'Gema Rosa', price: 1400, currency: 'diamonds', duration: 30, component: FramePinkGemIcon, componentName: 'FramePinkGemIcon' },
    { id: 'pink-lace', name: 'Renda Rosa', price: 700, currency: 'diamonds', duration: 30, component: FramePinkLaceIcon, componentName: 'FramePinkLaceIcon' },
    { id: 'purple-floral', name: 'Floral Roxo', price: 1100, currency: 'diamonds', duration: 30, component: FramePurpleFloralIcon, componentName: 'FramePurpleFloralIcon' },
    { id: 'regal-purple', name: 'Roxo Real', price: 2200, currency: 'diamonds', duration: 30, component: FrameRegalPurpleIcon, componentName: 'FrameRegalPurpleIcon' },
    { id: 'silver-thorn', name: 'Espinho de Prata', price: 1300, currency: 'diamonds', duration: 30, component: FrameSilverThornIcon, componentName: 'FrameSilverThornIcon' },
    { id: 'rose-heart', name: 'Coração de Rosas', price: 1700, currency: 'diamonds', duration: 30, component: FrameRoseHeartIcon, componentName: 'FrameRoseHeartIcon' },
    { id: 'silver-beaded', name: 'Contas de Prata', price: 600, currency: 'diamonds', duration: 30, component: FrameSilverBeadedIcon, componentName: 'FrameSilverBeadedIcon' },
];

export const levelProgression = Array.from({ length: 100 }, (_, i) => ({
    level: i + 1,
    xpRequired: i * 1000 + (i * i * 50),
    privileges: ['Exclusive Badge', 'Special Comment Border'],
    nextRewards: ['Level Gift', 'Entry Effect']
}));

const constructInitialDb = () => {
    // User: Livercore (Admin)
    const livercoreUser: User = {
        id: CURRENT_USER_ID,
        identification: '10755083',
        name: 'Livercore',
        avatarUrl: 'https://i.pravatar.cc/150?u=livercore',
        coverUrl: 'https://picsum.photos/seed/cover_livercore/400/800',
        country: 'br',
        age: 28,
        gender: 'male',
        level: 12,
        xp: 15400,
        diamonds: 5000,
        earnings: 25000,
        earnings_withdrawn: 10000,
        fans: 1420,
        following: 15,
        receptores: 50000,
        enviados: 12000,
        isVIP: true,
        isAvatarProtected: false,
        bio: 'Desenvolvedor da plataforma.',
        obras: [
            { id: '1', url: 'https://picsum.photos/seed/post1/400/400', duration: 0 },
            { id: '2', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', duration: 15 }
        ],
        ownedFrames: [], 
        preferences: {
             language: { code: 'pt-BR', autoDetect: true },
             display: { zoomPercentage: 100, pipEnabled: false, watermark: true },
             privacy: { showLocation: true, showActivityStatus: true, chatPermission: 'all' },
             notifications: { newMessages: true, streamerLive: true, followedPosts: false, pedido: true, interactive: true },
             giftNotifications: { minPriceToNotify: 0, enabledCategories: [], disabledGiftIds: [] },
             stream: { beauty: {}, private: { privateInvite: true, followersOnly: true, fansOnly: false, friendsOnly: false } },
             permissions: { camera: 'prompt', microphone: 'prompt' }
        }
    };

    const users = new Map<string, User>();
    users.set(livercoreUser.id, livercoreUser);
    
    // Initial Seed Data
    const streamers: Streamer[] = [{ id: 'stream_1', hostId: '1', name: 'Mirella', avatar: 'https://i.pravatar.cc/150?u=1', location: 'São Paulo', time: 'Agora', message: 'Vem pra live!', tags: ['Pop'], isPrivate: false, country: 'br', viewers: 1200 }];
    const gifts: Gift[] = [{ name: 'Coração', price: 1, icon: '❤️', category: 'Popular', type: 'emoji' }];
    
    const vipPlans: VIPPlan[] = [
        { id: 'vip_1m', title: 'Mensal', price: 29.99, currency: 'BRL', durationMonths: 1, isActive: true },
        { id: 'vip_3m', title: 'Trimestral', price: 79.99, currency: 'BRL', durationMonths: 3, isActive: true },
        { id: 'vip_12m', title: 'Anual', price: 299.99, currency: 'BRL', durationMonths: 12, isActive: true },
    ];

    const legalDocuments: LegalDocument[] = [
        { slug: 'privacy-policy', title: 'Política de Privacidade', content: 'Conteúdo...', version: '1.0', language: 'pt-BR', lastUpdated: new Date().toISOString() },
        { slug: 'terms-of-service', title: 'Termos de Serviço', content: 'Conteúdo...', version: '1.0', language: 'pt-BR', lastUpdated: new Date().toISOString() },
        { slug: 'copyright', title: 'Direitos Autorais', content: 'Conteúdo...', version: '1.0', language: 'pt-BR', lastUpdated: new Date().toISOString() },
    ];

    const streamResolutions: StreamResolution[] = [
        { label: '720p (HD)', value: '720p', bitrate: 2500, isPremium: true, isActive: true, order: 1 },
        { label: '480p (SD)', value: '480p', bitrate: 1200, isPremium: false, isActive: true, order: 2 },
        { label: '360p', value: '360p', bitrate: 800, isPremium: false, isActive: true, order: 3 },
    ];

    const appVersion: AppVersion = {
        version: '1.0.0', buildNumber: 100, platform: 'web', isMandatory: false, releaseNotes: 'Initial Launch', downloadUrl: '', releaseDate: new Date().toISOString(), isActive: true
    };

    const tags: ProfileTag[] = [
        { name: 'Gamer', usageCount: 10, isActive: true },
        { name: 'Música', usageCount: 5, isActive: true },
    ];
    
    const professions: Profession[] = [{ name: 'Estudante', isActive: true }, { name: 'Modelo', isActive: true }];
    const emotionalStatus: EmotionalStatus[] = [{ name: 'Solteiro', isActive: true }, { name: 'Casado', isActive: true }];

    const levelPrivileges: LevelPrivilege[] = [
        { id: 'p1', levelRequirement: 10, title: 'Badge VIP', description: 'Badge exclusivo', iconUrl: '', type: 'badge', isActive: true }
    ];
    
    const diamondPackages: DiamondPackage[] = [
        { id: 'pkg1', diamonds: 800, price: 7.00, bonus: 0, isActive: true },
        { id: 'pkg2', diamonds: 3000, price: 25.00, bonus: 100, isActive: true },
        { id: 'pkg3', diamonds: 6000, price: 60.00, bonus: 500, isActive: true }
    ];
    
    const faqs: FAQ[] = [
        { id: '1', question: 'Como comprar diamantes?', answer: 'Vá até a carteira e selecione um pacote.', order: 1, isActive: true },
        { id: '2', question: 'Como iniciar uma live?', answer: 'Clique no botão central no menu inferior.', order: 2, isActive: true }
    ];

    const streamManuals: StreamManual[] = [
        { id: 'm1', title: 'Preparando sua Transmissão', content: ['Escolha uma boa iluminação', 'Verifique o áudio'], order: 1 }
    ];
    
    const beautyEffects: BeautyEffect[] = [
        { id: 'be1', name: 'Musa', type: 'filter', icon: '✨', defaultValue: 50, order: 1, isActive: true },
        { id: 'be2', name: 'Branquear', type: 'effect', icon: '🎨', defaultValue: 20, order: 1, isActive: true }
    ];

    return {
        db_version: 12,
        platform_earnings: 1500,
        users,
        following: new Map<string, Set<string>>(),
        fans: new Map<string, Set<string>>(),
        gifts,
        countries: [{ name: 'Brasil', code: 'br', isActive: true }, { name: 'Estados Unidos', code: 'us', isActive: true }, { name: 'Global', code: 'ICON_GLOBE', isActive: true }],
        conversations: [],
        sentGifts: new Map<string, (Gift & { count: number })[]>(),
        receivedGifts: new Map<string, (Gift & { count: number })[]>(),
        contributions: new Map<string, number>(),
        streamRooms: new Map<string, Set<string>>(),
        streamers,
        friends: [],
        followingUsers: [],
        fansUsers: [],
        visits: new Map<string, { visitorId: string, timestamp: string }[]>(),
        topFansUsers: [],
        streamManuals,
        beautyEffects: { filters: beautyEffects.filter(e => e.type === 'filter'), effects: beautyEffects.filter(e => e.type === 'effect') },
        beautySettings: new Map<string, BeautySettings>(),
        blocklist: new Map<string, Set<string>>(),
        messages: new Map<string, Message>(),
        permissions: new Map<string, any>(),
        notificationSettings: new Map<string, NotificationSettings>(),
        giftNotificationSettings: new Map<string, Record<string, boolean>>(),
        purchases: [] as PurchaseRecord[],
        contributionLog: [],
        history: { actions: [], transactions: [], liveEvents: [] },
        streamHistory: [] as StreamHistoryEntry[],
        photoFeed: [],
        photoLikes: new Map<string, Set<string>>(),
        liveSessions: new Map<string, Partial<LiveSessionState & { viewerSet: Set<string>; isMicrophoneMuted: boolean; isStreamMuted: boolean; giftSenders: Map<string, EligibleUser>, isAutoFollowEnabled: boolean; isAutoPrivateInviteEnabled: boolean; }>>(),
        kickedUsers: new Map<string, Set<string>>(),
        moderators: new Map<string, Set<string>>(),
        pkDefaultConfig: { duration: 7 },
        pkBattles: new Map<string, PKBattleState>(),
        chatMetadata: new Map<string, { systemNotificationSent: boolean }>(),
        googleAccounts: [] as GoogleAccount[],
        userConnectedAccounts: new Map<string, { google?: GoogleAccount[] }>(),
        orders: new Map<string, Order>(),
        liveNotifications: [] as LiveNotification[],
        invitations: [] as Invitation[],
        
        // Expanded Collections for Models
        vipPlans,
        refundRequests: [] as RefundRequest[],
        reports: [] as Report[],
        streamReminders: [] as StreamReminder[],
        chatSettings: new Map<string, ChatSettings>(),
        legalDocuments,
        userFrames: [] as UserFrame[],
        frameLogs: [] as FrameLog[],
        streamResolutions,
        appVersion,
        profileTags: tags,
        professions,
        emotionalStatus,
        zoomConfigs: new Map<string, ZoomConfig>(),
        pipConfigs: new Map<string, PipConfig>(),
        watermarkConfigs: new Map<string, WatermarkConfig>(),
        friendRequests: [] as FriendRequest[],
        accountDeletionRequests: [] as AccountDeletionRequest[],
        pushNotificationConfigs: new Map<string, PushNotificationConfig>(),
        languageConfigs: new Map<string, LanguageConfig>(),
        
        // Newly added collections for coverage
        userMedias: [] as UserMedia[],
        levelPrivileges,
        streamViewers: [] as StreamViewer[],
        profileShares: [] as ProfileShare[],
        streamModerationLogs: [] as StreamModerationLog[],
        paymentTransactions: [] as PaymentTransaction[],
        loadingConfigs: [] as LoadingConfig[],
        inviteRestrictions: [] as InviteRestriction[],
        mainScreenStreamers: [] as MainScreenStreamer[],
        diamondPackages,
        faqs,
        privateStreamConfigs: new Map<string, PrivateStreamConfig>(),
        giftAnimationConfigs: [] as GiftAnimationConfig[],
        frameMetadata: [] as FrameMetadata[],
        
        // NEW COLLECTIONS TO COVER ALL MODELS
        searchHistory: [] as SearchHistory[],
        cameraPermissionStates: new Map<string, CameraPermissionState>(),
        locationPermissionStates: new Map<string, LocationPermissionState>(),
        loginStates: [] as LoginState[],
        marketUsers: new Map<string, MarketUser>(),
        marketFrames: [] as MarketFrame[],
        marketGifts: [] as MarketGift[],
        messageUsers: new Map<string, MessageUser>(),
        messageConversations: [] as MessageConversation[],
        messageFriendRequests: [] as MessageFriendRequest[],
        levelUsers: new Map<string, LevelUser>(),
        streamContributors: [] as StreamContributor[],
        streamSummaries: [] as StreamSummary[],
        specificFrameInventories: [] as SpecificFrameInventory[],
        levelInfos: [] as any[],
        
        // NEWEST COLLECTIONS FROM THIS PROMPT
        frameBlazingSuns: [] as FrameBlazingSun[],
        frameBlueCrystals: [] as FrameBlueCrystal[],
        frameGoldenFlorals: [] as FrameGoldenFloral[],
        frameBlueFires: [] as FrameBlueFire[],
        frameDiamonds: [] as FrameDiamond[],
        frameFloralWreaths: [] as FrameFloralWreath[],
        frameIcyWings: [] as FrameIcyWings[],
        frameMagentaWings: [] as FrameMagentaWings[],
        frameNeonDiamonds: [] as FrameNeonDiamond[],
        frameNeonPinks: [] as FrameNeonPink[],
        frameOrnateBronzes: [] as FrameOrnateBronze[],
        framePinkGems: [] as FramePinkGem[],
        framePinkLaces: [] as FramePinkLace[],
        framePurpleFlorals: [] as FramePurpleFloral[],
        frameRegalPurples: [] as FrameRegalPurple[],
        frameSilverThorns: [] as FrameSilverThorn[],
        frameRoseHearts: [] as FrameRoseHeart[],
        frameSilverBeadeds: [] as FrameSilverBeaded[],
        
        fanRecords: [] as Fan[],
        transactions: [] as Transaction[],
        
        // Newest collections for ExtendedControllers
        googleRegistrations: [] as GoogleRegistration[],
        googlePasswords: [] as GooglePassword[],
        regions: [] as Region[],
        walletData: [] as WalletData[],
        userProfiles: [] as UserProfileData[],
        avatarFramesCatalog: [] as AvatarFrameCatalogItem[],
        pkConfigs: [] as PKConfig[],
        giftNotificationConfigs: [] as GiftNotificationConfig[],

        earningsPolicy: {
            version: '1.0',
            conversionRate: 100,
            streamerSharePercentage: 80,
            platformFeePercentage: 20,
            minimumWithdrawalAmount: 50
        }
    };
};

export const replacer = (key: string, value: any) => {
    if(value instanceof Map) {
        return { dataType: 'Map', value: Array.from(value.entries()) };
    } else if (value instanceof Set) {
        return { dataType: 'Set', value: Array.from(value) };
    }
    return value;
};

export const reviver = (key: string, value: any) => {
    if(typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') return new Map(value.value);
        if (value.dataType === 'Set') return new Set(value.value);
    }
    return value;
};

export let db = constructInitialDb();

export const saveDb = () => {};

export const connectToDatabase = async () => {
    console.log('Connected to mock database');
};

connectToDatabase();
