
import React from 'react';
import { User, Gift, Streamer, Message, RankedUser, Country, Conversation, NotificationSettings, BeautySettings, PurchaseRecord, EligibleUser, FeedPhoto, Obra, GoogleAccount, LiveSessionState, StreamHistoryEntry, Visitor, LevelInfo, Order, LiveNotification, Invitation } from '../types';
import { 
    RocketGiftIcon, 
    PrivateJetGiftIcon, 
    RingGiftIcon, 
    LionGiftIcon, 
    SportsCarGiftIcon, 
    PhoenixGiftIcon, 
    SuperCarGiftIcon, 
    DragonGiftIcon, 
    CastleGiftIcon, 
    UniverseGiftIcon, 
    HelicopterGiftIcon, 
    PlanetGiftIcon, 
    YachtGiftIcon, 
    GalaxyGiftIcon, 
    KingsCrownGiftIcon, 
    PremiumDiamondGiftIcon, 
    PrivateIslandGiftIcon,
    LuxuryCarEntryIcon,
    FirePhoenixEntryIcon,
    DragonEntryIcon
} from '../components/icons';
import {
    FrameDiamondIcon,
    FrameNeonPinkIcon,
    FrameFloralWreathIcon,
    FramePinkGemIcon,
    FrameGoldenFloralIcon,
    FramePurpleFloralIcon,
    FrameBlueCrystalIcon,
    FrameBlueFireIcon,
    FrameBlazingSunIcon,
} from '../components/icons/frames';
import { dbConfig } from './config';

const DB_VERSION = 2; // Increment to trigger migration

// --- DATABASE CONNECTION ---
// In a real Node.js backend, this would use a library like Mongoose to connect.
const connectToDatabase = async () => {
    try {
        console.log(`[DB] Connecting to MongoDB at ${dbConfig.mongodb.url}...`);
        // Simulate an async connection attempt.
        await new Promise(resolve => setTimeout(resolve, 500)); 
        console.log('[DB] MongoDB connection established successfully.');
    } catch (error) {
        console.error('[DB] CRITICAL: Failed to connect to MongoDB. The application may not function correctly.', error);
        // In a real production backend, the process would likely exit on a failed DB connection.
    }
};

export const levelProgression = [
  { level: 1, xpRequired: 0, privileges: [], nextRewards: ['Badge Exclusivo Nv. 2'] },
  { level: 2, xpRequired: 100, privileges: ['Badge Exclusivo Nv. 2'], nextRewards: ['Borda de Comentário Especial'] },
  { level: 3, xpRequired: 300, privileges: ['Badge Exclusivo Nv. 2', 'Borda de Comentário Especial'], nextRewards: ['Presente Exclusivo'] },
  { level: 4, xpRequired: 600, privileges: ['Badge Exclusivo Nv. 2', 'Borda de Comentário Especial', 'Presente Exclusivo'], nextRewards: ['Efeito de Entrada na Sala'] },
  { level: 5, xpRequired: 1000, privileges: ['Badge Exclusivo Nv. 2', 'Borda de Comentário Especial', 'Presente Exclusivo', 'Efeito de Entrada na Sala'], nextRewards: ['Moldura de Avatar Especial'] },
  { level: 6, xpRequired: 1500, privileges: ['Badge Exclusivo Nv. 2', 'Borda de Comentário Especial', 'Presente Exclusivo', 'Efeito de Entrada na Sala', 'Moldura de Avatar Especial'], nextRewards: ['Mais Recompensas!'] },
  { level: 7, xpRequired: 2500, privileges: ['Badge Exclusivo Nv. 2', 'Borda de Comentário Especial', 'Presente Exclusivo', 'Efeito de Entrada na Sala', 'Moldura de Avatar Especial'], nextRewards: ['Mais Recompensas!'] },
  { level: 8, xpRequired: 4000, privileges: ['Badge Exclusivo Nv. 2', 'Borda de Comentário Especial', 'Presente Exclusivo', 'Efeito de Entrada na Sala', 'Moldura de Avatar Especial'], nextRewards: ['Mais Recompensas!'] },
  { level: 9, xpRequired: 6000, privileges: ['Badge Exclusivo Nv. 2', 'Borda de Comentário Especial', 'Presente Exclusivo', 'Efeito de Entrada na Sala', 'Moldura de Avatar Especial'], nextRewards: ['Mais Recompensas!'] },
  { level: 10, xpRequired: 10000, privileges: ['Badge Exclusivo Nv. 2', 'Borda de Comentário Especial', 'Presente Exclusivo', 'Efeito de Entrada na Sala', 'Moldura de Avatar Especial'], nextRewards: ['Mais Recompensas!'] },
];

interface PKBattleState {
    opponentId: string;
    heartsA: number;
    heartsB: number;
    scoreA: number;
    scoreB: number;
}


export const CURRENT_USER_ID = '10755083';
export const createChatKey = (id1: string, id2: string) => [id1, id2].sort().join('-');
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- JSON HELPERS ---
const replacer = (key: string, value: any) => {
  if (value instanceof Map) {
    return { _dataType: 'Map', value: Array.from(value.entries()) };
  }
  if (value instanceof Set) {
    return { _dataType: 'Set', value: Array.from(value.values()) };
  }
  return value;
};

const reviver = (key: string, value: any) => {
  if (typeof value === 'object' && value !== null) {
    if (value._dataType === 'Map') return new Map(value.value);
    if (value._dataType === 'Set') return new Set(value.values());
  }
  return value;
};

export const avatarFrames = [
  { id: 'classic-silver', name: 'Prata Clássica', price: 50, duration: 7, component: FrameDiamondIcon },
  { id: 'glowing-runes', name: 'Runas Brilhantes', price: 150, duration: 7, component: FrameNeonPinkIcon },
  { id: 'spring-blossom', name: 'Flores de Primavera', price: 250, duration: 7, component: FrameFloralWreathIcon },
  { id: 'royal-gold', name: 'Ouro Real', price: 400, duration: 15, component: FramePinkGemIcon },
  { id: 'frozen-shard', name: 'Fragmento Congelado', price: 600, duration: 15, component: FrameGoldenFloralIcon },
  { id: 'phoenix-feathers', name: 'Penas de Fênix', price: 800, duration: 15, component: FramePurpleFloralIcon },
  { id: 'starlight', name: 'Luz Estrelar', price: 1000, duration: 30, component: FrameBlueCrystalIcon },
  { id: 'dragon-scale', name: 'Escama de Dragão', price: 1500, duration: 30, component: FrameBlueFireIcon },
  { id: 'celestial-wings', name: 'Asas Celestiais', price: 1200, duration: 30, component: FrameBlazingSunIcon },
];

export const getRemainingDays = (expirationDate: string | null | undefined): number => {
    if (!expirationDate) return 0;
    const now = new Date();
    const exp = new Date(expirationDate);
    const diffTime = exp.getTime() - now.getTime();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getFrameGlowClass = (frameId: string | null | undefined): string => {
    if (!frameId) return '';
    const glowMap: Record<string, string> = {
        'classic-silver': 'classic-silver-anim',
        'glowing-runes': 'glowing-runes-anim',
        'spring-blossom': 'spring-blossom-anim',
        'royal-gold': 'royal-gold-anim',
        'frozen-shard': 'frozen-shard-anim',
        'phoenix-feathers': 'phoenix-feathers-anim',
        'starlight': 'starlight-anim',
        'dragon-scale': 'dragon-scale-anim',
        'celestial-wings': 'celestial-wings-anim',
    };
    return glowMap[frameId] || 'avatar-frame-glow-effect'; // Fallback to a generic glow
};

// --- DB CONSTRUCTION, MIGRATION & PERSISTENCE ---

const constructInitialDb = () => {
    // --- DATA COLLECTIONS (FOR SEEDING) ---
    const googleAccountsData: GoogleAccount[] = [
      { id: 'g1', name: 'Adriano Santos', email: 'adrianomdk5@gmail.com' },
      { id: 'g2', name: 'Adriano Santos', email: 'adrianomdk23@gmail.com' },
      { id: 'g3', name: 'Adriano Santos', email: 'adrianomdk7@gmail.com' },
      { id: 'g4', name: 'ramon santos', email: 'rsm52665@gmail.com' },
      { id: 'g5', name: 'Adriano Santos', email: 'adrianomedium2@gmail.com' },
      { id: 'g6', name: 'Viviane Santos', email: 'vivianemdk1@gmail.com' },
      { id: 'g7', name: 'Adriano Santos', email: 'adrianomdk8@gmail.com' },
    ];

    const streamersData: Streamer[] = [
      { id: '1', hostId: '10755084', name: 'MIRELLA', avatar: 'https://picsum.photos/seed/mirella/100/100', location: 'Em algum lugar', time: '44 minutos', message: '#Beleza te chamou 💕', tags: ['PK', 'Festa'], icon: '🎀', country: 'br', viewers: 1200, demoVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
      { id: '2', hostId: '20844912', name: 'SARAH', avatar: 'https://picsum.photos/seed/sarah/100/100', location: 'Em algum lugar', time: '56 minutos', message: '#Beleza Oi amor', tags: ['Dança'], icon: '🌹🧸', country: 'br', viewers: 17, demoVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
      { id: '3', hostId: '30192837', name: 'princesa', avatar: 'https://picsum.photos/seed/princesa/100/100', location: 'Em algum lugar', time: '2h2m', message: '#Dança 💃', tags: ['Musica'], icon: '👑', country: 'co', viewers: 890, demoVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
      { id: '4', hostId: '40583726', name: 'JuFe', avatar: 'https://picsum.photos/seed/jufe/100/100', location: 'Em algum lugar', time: '1 minuto', message: '#Beleza CH@M@D@S 10', tags: ['Novo', 'Dança', 'Festa'], country: 'us', viewers: 5600, demoVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
      { id: '5', hostId: '50123847', name: 'Isa', avatar: 'https://picsum.photos/seed/isa/100/100', location: 'Em algum lugar', time: '1h24m', message: 'Oi, baby', tags: ['Perto', 'Musica'], isHot: true, icon: '🇨', country: 'ar', viewers: 4100, demoVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
      { id: '6', hostId: '60483721', name: 'Laura', avatar: 'https://picsum.photos/seed/laura/100/100', location: 'São Paulo', time: '1h30m', message: '', tags: ['Privada', 'Novo'], icon: '🌹', country: 'mx', viewers: 750, isPrivate: true, demoVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
    ];

    const jumaUser: User = {
        id: 'user-juma',
        identification: '11223344',
        name: 'Juma',
        avatarUrl: 'https://picsum.photos/seed/juma/100/100',
        coverUrl: 'https://picsum.photos/seed/juma-cover/400/800',
        country: 'br',
        age: 22,
        gender: 'female',
        level: 1,
        xp: 0,
        isFollowed: true, 
        isOnline: true,
        lastSeen: new Date().toISOString(),
        fans: 1200,
        following: 340,
        receptores: 50000,
        enviados: 12000,
        diamonds: 1234,
        earnings: 5678,
        earnings_withdrawn: 0,
        bio: 'Amiga para todas as horas.',
        obras: [],
        curtidas: [],
        isVIP: false,
        ownedFrames: [],
        activeFrameId: null,
        frameExpiration: null,
    };

    const anaUser: User = {
        id: 'user-ana',
        identification: '55667788',
        name: 'Ana',
        avatarUrl: 'https://picsum.photos/seed/ana/100/100',
        coverUrl: 'https://picsum.photos/seed/ana-cover/400/800',
        country: 'br',
        age: 25,
        gender: 'female',
        level: 1,
        xp: 0,
        isFollowed: true, 
        isOnline: true,
        lastSeen: new Date().toISOString(),
        fans: 800,
        following: 150,
        receptores: 45000,
        enviados: 11000,
        diamonds: 2500,
        earnings: 9800,
        earnings_withdrawn: 0,
        bio: 'Adoro música e dança!',
        obras: [],
        curtidas: [],
        isVIP: true,
        ownedFrames: [],
        activeFrameId: null,
        frameExpiration: null,
    };

    const friendsData: User[] = [jumaUser, anaUser];

    const livercoreUser: User = { id: 'support-livercore', identification: 'support-livercore', name: 'Livercore', avatarUrl: 'https://static.vecteezy.com/system/resources/previews/000/423/908/original/headset-icon-vector-illustration.jpg', level: 1, xp: 0, isOnline: true, lastSeen: new Date().toISOString(), bio: 'Suporte oficial da plataforma LiveGo.', isFollowed: true, fans: 0, following: 0, receptores: 0, enviados: 0, diamonds: 0, earnings: 0, earnings_withdrawn: 0, ownedFrames: [], activeFrameId: null, frameExpiration: null, };
    const followingUsersData: User[] = [];
    const topFansUsersData: User[] = [ { id: 'fan-1', identification: '8839210', name: '👑 Rei dos Fãs 👑', avatarUrl: 'https://i.pravatar.cc/150?img=11', level: 1, xp: 0, diamonds: 1500000, isFollowed: true, isVIP: true, fans: 1, following: 1, receptores: 10000000, enviados: 10000000, earnings: 0, earnings_withdrawn: 0, ownedFrames: [], activeFrameId: null, frameExpiration: null, }, { id: 'fan-2', identification: '9182374', name: 'Amigo Fiel', avatarUrl: 'https://i.pravatar.cc/150?img=12', level: 1, xp: 0, diamonds: 950000, isFollowed: false, fans: 1, following: 1, receptores: 5000000, enviados: 5000000, earnings: 0, earnings_withdrawn: 0, ownedFrames: [], activeFrameId: null, frameExpiration: null, }, { id: 'fan-3', identification: '1238745', name: 'Super Apoiador', avatarUrl: 'https://i.pravatar.cc/150?img=13', level: 1, xp: 0, diamonds: 720000, isFollowed: true, fans: 1, following: 1, receptores: 3000000, enviados: 3000000, earnings: 0, earnings_withdrawn: 0, ownedFrames: [], activeFrameId: null, frameExpiration: null, }, ];
    const fansUsersData: User[] = [];

    const countries: Country[] = [ { name: 'Global', code: 'ICON_GLOBE' }, { name: 'Brasil', code: 'br' }, { name: 'Colômbia', code: 'co' }, { name: 'EUA', code: 'us' }, { name: 'México', code: 'mx' }, { name: 'Argentina', code: 'ar' }, { name: 'Espanha', code: 'es' }, { name: 'Filipinas', code: 'ph' }, { name: 'Vietnã', code: 'vn' }, { name: 'Índia', code: 'in' }, { name: 'Indonésia', code: 'id' }, { name: 'Turquia', code: 'tr' }, ];
    const conversations: Conversation[] = [];
    const gifts: Gift[] = [ 
        { name: 'Coração', price: 1, icon: '❤️', category: 'Popular' }, 
        { name: 'Café', price: 3, icon: '☕', category: 'Popular' },
        { name: 'Milho', price: 2, icon: '🍿', category: 'Popular' }, 
        { name: 'Rosa', price: 5, icon: '🌷', category: 'Popular' },
        { name: 'Flor', price: 7, icon: '🌸', category: 'Popular' },
        { name: 'Donut', price: 8, icon: '🍩', category: 'Popular' }, 
        { name: 'Balão', price: 9, icon: '🎈', category: 'Popular' },
        { name: 'Batom', price: 10, icon: '💄', category: 'Popular' }, 
        { name: 'Chocolate', price: 12, icon: '🍫', category: 'Popular' },
        { name: 'Sorvete', price: 15, icon: '🍦', category: 'Popular' }, 
        { name: 'Lanche', price: 20, icon: '🍔', category: 'Popular' }, 
        { name: 'Perfume', price: 25, icon: '🧴', category: 'Popular' }, 
        { name: 'Pirulito', price: 30, icon: '🍭', category: 'Popular' }, 
        { name: 'Pizza', price: 35, icon: '🍕', category: 'Popular' },
        { name: 'Microfone', price: 40, icon: '🎤', category: 'Popular' }, 
        { name: 'Alvo', price: 50, icon: '🎯', category: 'Popular' }, 
        { name: 'Câmera', price: 60, icon: '📸', category: 'Popular' },
        { name: 'Óculos de Sol', price: 80, icon: '😎', category: 'Popular' }, 
        { name: 'Panda', price: 65, icon: '🐼', category: 'Popular' },
        { name: 'Coala', price: 68, icon: '🐨', category: 'Popular' },
        { name: 'Fatia de Pizza', price: 10, icon: '🍕', category: 'Popular' },
        { name: 'Taco', price: 15, icon: '🌮', category: 'Popular' },
        { name: 'Biscoito', price: 5, icon: '🍪', category: 'Popular' },
        { name: 'Cupcake', price: 8, icon: '🧁', category: 'Popular' },
        { name: 'Morango', price: 12, icon: '🍓', category: 'Popular' },
        { name: 'Abacate', price: 18, icon: '🥑', category: 'Popular' },
        { name: 'Brócolis', price: 4, icon: '🥦', category: 'Popular' },
        { name: 'Baguete', price: 6, icon: '🥖', category: 'Popular' },
        { name: 'Pretzel', price: 7, icon: '🥨', category: 'Popular' },
        { name: 'Queijo', price: 11, icon: '🧀', category: 'Popular' },
        { name: 'Waffle', price: 14, icon: '🧇', category: 'Popular' },
        { name: 'Panquecas', price: 16, icon: '🥞', category: 'Popular' },
        { name: 'Bacon', price: 19, icon: '🥓', category: 'Popular' },
        { name: 'Cachorro-quente', price: 22, icon: '🌭', category: 'Popular' },
        { name: 'Batata Frita', price: 9, icon: '🍟', category: 'Popular' },
        { name: 'Sanduíche', price: 24, icon: '🥪', category: 'Popular' },
        { name: 'Dango', price: 13, icon: '🍡', category: 'Popular' },
        { name: 'Onigiri', price: 5, icon: '🍙', category: 'Popular' },
        { name: 'Camarão Frito', price: 28, icon: '🍤', category: 'Popular' },
        { name: 'Sushi', price: 33, icon: '🍣', category: 'Popular' },
        { name: 'Taça de Sorvete', price: 17, icon: '🍨', category: 'Popular' },
        { name: 'Torta', price: 21, icon: '🥧', category: 'Popular' },
        { name: 'Doce', price: 3, icon: '🍬', category: 'Popular' },
        { name: 'Mel', price: 26, icon: '🍯', category: 'Popular' },
        { name: 'Copo de Leite', price: 8, icon: '🥛', category: 'Popular' },
        { name: 'Chá Verde', price: 10, icon: '🍵', category: 'Popular' },
        { name: 'Saquê', price: 29, icon: '🍶', category: 'Popular' },
        { name: 'Cerveja', price: 15, icon: '🍺', category: 'Popular' },
        { name: 'Milkshake', price: 22, icon: '🥤', category: 'Popular' },
        { name: 'Croissant', price: 11, icon: '🥐', category: 'Popular' },
        { name: 'Uvas', price: 14, icon: '🍇', category: 'Popular' },
        { name: 'Frango Frito', price: 27, icon: '🍗', category: 'Popular' },
        { name: 'Melancia', price: 10, icon: '🍉', category: 'Popular' },
        
        { name: 'Bola de Basquete', price: 70, icon: '🏀', category: 'Atividade' },
        { name: 'Bola', price: 75, icon: '⚽', category: 'Atividade' }, 
        { name: 'Túmulo', price: 99, icon: '🪦', category: 'Atividade' }, 
        { name: 'Bicicleta', price: 110, icon: '🚲', category: 'Atividade' }, 
        { name: 'Haltere', price: 120, icon: '💪', category: 'Atividade' }, 
        { name: 'Skate', price: 130, icon: '🛹', category: 'Atividade' }, 
        { name: 'Prancha de Surf', price: 140, icon: '🏄', category: 'Atividade' }, 
        { name: 'Luva de Boxe', price: 160, icon: '🥊', category: 'Atividade' },
        { name: 'Taco de Golfe', price: 180, icon: '🏌️', category: 'Atividade' },
        { name: 'Capacete de Corrida', price: 210, icon: '⛑️', category: 'Atividade' },
        { name: 'Bola de Tênis', price: 85, icon: '🎾', category: 'Atividade' },
        { name: 'Boliche', price: 95, icon: '🎳', category: 'Atividade' },
        { name: 'Bola de Rugby', price: 105, icon: '🏉', category: 'Atividade' },
        { name: 'Voleibol', price: 90, icon: '🏐', category: 'Atividade' },
        { name: 'Beisebol', price: 80, icon: '⚾', category: 'Atividade' },
        { name: 'Pingue-pongue', price: 78, icon: '🏓', category: 'Atividade' },
        { name: 'Badminton', price: 82, icon: '🏸', category: 'Atividade' },
        { name: 'Hóquei no Gelo', price: 150, icon: '🏒', category: 'Atividade' },
        { name: 'Hóquei de Campo', price: 145, icon: '🏑', category: 'Atividade' },
        { name: 'Lacrosse', price: 155, icon: '🥍', category: 'Atividade' },
        { name: 'Críquete', price: 115, icon: '🏏', category: 'Atividade' },
        { name: 'Rede de Gol', price: 190, icon: '🥅', category: 'Atividade' },
        { name: 'Pipa', price: 65, icon: '🪁', category: 'Atividade' },
        { name: 'Frisbee', price: 55, icon: '🥏', category: 'Atividade' },
        { name: 'Trenzinho', price: 220, icon: '🛷', category: 'Atividade' },
        { name: 'Pedra de Curling', price: 230, icon: '🥌', category: 'Atividade' },
        { name: 'Esquis', price: 250, icon: '🎿', category: 'Atividade', triggersAutoFollow: true },
        { name: 'Dardos', price: 45, icon: '🎯', category: 'Atividade' },
        { name: 'Ioiô', price: 35, icon: '🪀', category: 'Atividade' },
        { name: 'Bumerangue', price: 40, icon: '🪃', category: 'Atividade' },
        { name: 'Trenó', price: 170, icon: '🛷', category: 'Atividade' },
        { name: 'Arco e Flecha', price: 190, icon: '🏹', category: 'Atividade' },
        { name: 'Patins', price: 135, icon: '🛼', category: 'Atividade' },
        
        { name: 'Urso', price: 500, icon: '🧸', category: 'Luxo' }, 
        { name: 'Boia', price: 800, icon: '🍩', category: 'Luxo' }, 
        { name: 'Champanhe', price: 1200, icon: '🍾', category: 'Luxo' }, 
        { name: 'Gema de Nível', price: 1500, icon: '💎', category: 'Luxo' }, 
        { name: 'Relógio', price: 2000, icon: '⌚', category: 'Luxo' }, 
        { name: 'Bolsa', price: 2500, icon: '👜', category: 'Luxo' }, 
        { name: 'Moto', price: 3000, icon: '🛵', category: 'Luxo' }, 
        { name: 'Violino', price: 3500, icon: '🎻', category: 'Luxo' },
        { name: 'Salto Alto', price: 4000, icon: '👠', category: 'Luxo' },
        { name: 'Piano', price: 4500, icon: '🎹', category: 'Luxo' },
        { name: 'Colar', price: 4800, icon: '📿', category: 'Luxo' },
        { name: 'Coroa', price: 5000, icon: '👑', category: 'Luxo', triggersAutoFollow: true }, 
        { name: 'Bolsa de Grife', price: 6000, icon: '👜', category: 'Luxo' },
        { name: 'Diamante Azul', price: 6000, icon: '💠', category: 'Luxo' }, 
        { name: 'Carro Esportivo', price: 8888, icon: '🏎️', category: 'Luxo', triggersAutoFollow: true, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
        { name: 'Jóia Rara', price: 12000, icon: '💍', category: 'Luxo', triggersAutoFollow: true, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
        { name: 'Barco a Vela', price: 9000, icon: '⛵', category: 'Luxo', triggersAutoFollow: true, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
        { name: 'Navio de Cruzeiro', price: 15000, icon: '🛳️', category: 'Luxo', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
        { name: 'Sino', price: 1800, icon: '🔔', category: 'Luxo' },
        { name: 'Trompete', price: 2200, icon: '🎺', category: 'Luxo' },
        { name: 'Saxofone', price: 2800, icon: '🎷', category: 'Luxo' },
        { name: 'Acordeão', price: 3200, icon: '🪗', category: 'Luxo' },
        { name: 'Harpa', price: 4200, icon: '🎻', category: 'Luxo' },
        { name: 'Xadrez', price: 1000, icon: '♟️', category: 'Luxo' },
        { name: 'Jóia', price: 7500, icon: '💎', category: 'Luxo', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
        { name: 'Mala de Dinheiro', price: 10000, icon: '💰', category: 'Luxo' },
        { name: 'Carta de Baralho', price: 900, icon: '🃏', category: 'Luxo' },
        { name: 'Telescópio', price: 5500, icon: '🔭', category: 'Luxo', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
        { name: 'Microscópio', price: 5200, icon: '🔬', category: 'Luxo' },
        { name: 'Ampulheta', price: 1300, icon: '⏳', category: 'Luxo' },
        { name: 'Despertador', price: 1100, icon: '⏰', category: 'Luxo' },
        { name: 'Globo', price: 3800, icon: '🌍', category: 'Luxo', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
        { name: 'Balão de Ar Quente', price: 4600, icon: '🎈', category: 'Luxo' },
        { name: 'Troféu', price: 9999, icon: '🏆', category: 'Luxo' },
        { name: 'Barra de Ouro', price: 7000, icon: '🧈', category: 'Luxo' },
        { name: 'Cofre de Diamantes', price: 11000, icon: '💰', category: 'Luxo' },
        { name: 'Chave do Carro', price: 9500, icon: '🔑', category: 'Luxo' },
        { name: 'Cetro Real', price: 13000, icon: '👑', category: 'Luxo' },
        
        { name: 'Foguete', price: 500, icon: '🚀', category: 'VIP', component: React.createElement(RocketGiftIcon), triggersAutoFollow: true, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' }, 
        { name: 'Jato Privado', price: 600, icon: '✈️', category: 'VIP', component: React.createElement(PrivateJetGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' }, 
        { name: 'Anel', price: 750, icon: '💍', category: 'VIP', component: React.createElement(RingGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' }, 
        { name: 'Leão', price: 800, icon: '🦁', category: 'VIP', component: React.createElement(LionGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }, 
        { name: 'Carro', price: 1000, icon: '🚗', category: 'VIP', component: React.createElement(SportsCarGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' }, 
        { name: 'Fênix', price: 1200, icon: '🔥', category: 'VIP', component: React.createElement(PhoenixGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }, 
        { name: 'Supercarro', price: 1500, icon: '🏎️', category: 'VIP', component: React.createElement(SuperCarGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' }, 
        { name: 'Dragão', price: 1800, icon: '🐉', category: 'VIP', component: React.createElement(DragonGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' }, 
        { name: 'Castelo', price: 2000, icon: '🏰', category: 'VIP', component: React.createElement(CastleGiftIcon), triggersAutoFollow: true, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' }, 
        { name: 'Universo', price: 2500, icon: '🌌', category: 'VIP', component: React.createElement(UniverseGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }, 
        { name: 'Helicóptero', price: 3000, icon: '🚁', category: 'VIP', component: React.createElement(HelicopterGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' }, 
        { name: 'Planeta', price: 4000, icon: '🪐', category: 'VIP', component: React.createElement(PlanetGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }, 
        { name: 'Iate', price: 5000, icon: '🛥️', category: 'VIP', component: React.createElement(YachtGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' }, 
        { name: 'Galáxia', price: 6000, icon: '🌠', category: 'VIP', component: React.createElement(GalaxyGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }, 
        { name: 'Coroa Real', price: 8000, icon: '🤴', category: 'VIP', component: React.createElement(KingsCrownGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' }, 
        { name: 'Diamante VIP', price: 10000, icon: '💎', category: 'VIP', component: React.createElement(PremiumDiamondGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' }, 
        { name: 'Ilha Particular', price: 15000, icon: '🏝️', category: 'VIP', component: React.createElement(PrivateIslandGiftIcon), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' }, 
        { name: 'Cavalo Alado', price: 25000, icon: '🦄', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { name: 'Tigre Dourado', price: 40000, icon: '🐅', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { name: 'Nave Espacial', price: 75000, icon: '🛸', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
        { name: 'Estrela Cadente', price: 22000, icon: '🌠', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
        { name: 'Cometa', price: 35000, icon: '☄️', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
        { name: 'Buraco Negro', price: 99999, icon: '⚫', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
        { name: 'Tesouro', price: 50000, icon: '👑', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' }, 
        { name: 'Pégaso', price: 60000, icon: '🦄', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { name: 'Grifo', price: 65000, icon: '🦅', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { name: 'Kraken', price: 70000, icon: '🐙', category: 'VIP' },
        { name: 'Hidra', price: 80000, icon: '🐉', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
        { name: 'Sereia', price: 45000, icon: '🧜‍♀️', category: 'VIP' },
        { name: 'Gênio', price: 55000, icon: '🧞', category: 'VIP' },
        { name: 'Anjo', price: 48000, icon: '👼', category: 'VIP' },
        { name: 'Excalibur', price: 42000, icon: '🗡️', category: 'VIP' },
        { name: 'Martelo de Thor', price: 68000, icon: '🔨', category: 'VIP' },
        { name: 'Tridente de Poseidon', price: 72000, icon: '🔱', category: 'VIP' },
        { name: 'Arco de Artemis', price: 62000, icon: '🏹', category: 'VIP' },
        { name: 'Elmo de Hades', price: 58000, icon: '🎩', category: 'VIP' },
        { name: 'Sandálias de Hermes', price: 52000, icon: '👟', category: 'VIP' },
        { name: 'Velo de Ouro', price: 90000, icon: '🏆', category: 'VIP' },
        { name: 'Maçã Dourada', price: 43000, icon: '🍏', category: 'VIP' },
        { name: 'Caixa de Pandora', price: 85000, icon: '🎁', category: 'VIP' },
        { name: 'Foguete Espacial', price: 25000, icon: '🚀', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
        { name: 'Disco Voador', price: 30000, icon: '🛸', category: 'VIP', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
        { name: 'Jet Ski', price: 700, icon: '🚤', category: 'VIP' },
        { name: 'Ilha Flutuante', price: 16000, icon: '🏝️', category: 'VIP' },
        { name: 'Trem Bala', price: 9000, icon: '🚄', category: 'VIP' },
        { name: 'Dirigível', price: 11000, icon: '🎈', category: 'VIP' },

        { name: 'Explosão de Confete', price: 19000, icon: '🎉', category: 'Efeito' }, 
        { name: 'Invocação de Dragão', price: 80000, icon: '🐲', category: 'Efeito' }, 
        { name: 'Coração Gigante', price: 28000, icon: '❤️‍🔥', category: 'Efeito' }, 
        { name: 'Beijo de Anjo', price: 23000, icon: '😘', category: 'Efeito' }, 
        { name: 'Dança dos Robôs', price: 33000, icon: '🤖', category: 'Efeito' }, 
        { name: 'Portal Galáctico', price: 42000, icon: '🌀', category: 'Efeito' }, 
        { name: 'Ataque de Tubarão', price: 37000, icon: '🦈', category: 'Efeito' }, 
        { name: 'Nuvem de Trovão', price: 31000, icon: '⛈️', category: 'Efeito' }, 
        { name: 'Flor de Lótus', price: 21000, icon: '🌸', category: 'Efeito' }, 
        { name: 'Chuva de Rosas', price: 26000, icon: '🌹', category: 'Efeito' }, 
        { name: 'Show de Luzes', price: 34000, icon: '🎇', category: 'Efeito' }, 
        
        { name: 'Entrada de Carro de Luxo', price: 1000, icon: '🏎️', category: 'Entrada', component: React.createElement(LuxuryCarEntryIcon) }, 
        { name: 'Entrada Fênix de Fogo', price: 5000, icon: '🔥', category: 'Entrada', component: React.createElement(FirePhoenixEntryIcon) }, 
        { name: 'Entrada Dragão Místico', price: 10000, icon: '🐉', category: 'Entrada', component: React.createElement(DragonEntryIcon) }, 
        { name: 'Tapete Mágico', price: 12000, icon: '🧞', category: 'Entrada' },
        { name: 'Entrada de Moto Esportiva', price: 2000, icon: '🏍️', category: 'Entrada' }, 
        { name: 'Chegada de Limousine', price: 8000, icon: '🚘', category: 'Entrada' }, 
        { name: 'Pouso de Pégaso', price: 15000, icon: '🦄', category: 'Entrada' },
        { name: 'Teletransporte', price: 7000, icon: '🌀', category: 'Entrada' },
        { name: 'Surfando na Onda', price: 6000, icon: '🏄', category: 'Entrada' },
        { name: 'Skate Voador', price: 4000, icon: '🛹', category: 'Entrada' },
        { name: 'Chegada de Tanque', price: 9000, icon: '💣', category: 'Entrada' },
        { name: 'Nuvem Voadora', price: 3000, icon: '☁️', category: 'Entrada' },
        { name: 'Carruagem Real', price: 11000, icon: '👑', category: 'Entrada' },
        { name: 'Chegada de Submarino', price: 13000, icon: '🌊', category: 'Entrada' },
        { name: 'Trono Flutuante', price: 18000, icon: '✨', category: 'Entrada' },
        { name: 'Jetpack', price: 5500, icon: '🚀', category: 'Entrada' },
        { name: 'Aparição Fantasma', price: 4500, icon: '👻', category: 'Entrada' },
        { name: 'Explosão de Flores', price: 3500, icon: '🌸', category: 'Entrada' },
        { name: 'Caminho de Estrelas', price: 6500, icon: '⭐', category: 'Entrada' }
    ];
    const receivedGiftsByStreamer = new Map<string, (Gift & { count: number })[]>();
    const liveStreamManualData = [ { title: '1. Preparando sua Transmissão', content: [ 'Capa e Título: Escolha uma imagem de capa clara e um título que chame a atenção. Isso é a primeira coisa que os espectadores verão!', 'Categoria: Selecione a categoria correta (Música, Dança, Jogos, etc.) para que seu público-alvo encontre sua live mais facilmente.', 'Qualidade: Verifique sua conexão com a internet. Uma boa iluminação e um áudio claro são essenciais para manter os espectadores engajados.' ] }, { title: '2. Durante a Transmissão', content: [ 'Interaja com o Chat: Converse com seus espectadores! Responda perguntas, agradeça pelos presentes e faça com que eles se sintam parte da transmissão.', 'Ferramentas de Co-host e PK: Convide amigos para participar da sua live ou inicie uma Batalha PK para tornar as coisas mais emocionantes. Use as ferramentas no menu de opções.', 'Efeitos de Beleza: Utilize os filtros e efeitos de beleza para melhorar a qualidade da sua imagem e se divertir.' ] }, { title: '3. Tipo de Transmissão', content: [ 'WebRTC (Padrão): A forma mais simples de começar a transmitir, direto do seu navegador, sem necessidade de softwares adicionais.', 'RTMP/SRT: Para streamers avançados que usam softwares como OBS Studio. Copie a URL do servidor e a chave de transmissão para o seu programa para ter mais controle sobre a qualidade e layout da sua live.' ] }, { title: '4. Dicas Importantes', content: [ 'Seja Consistente: Tente transmitir em horários regulares para que seus fãs saibam quando podem te encontrar.', 'Divulgue: Avise seus seguidores em outras redes sociais que você vai entrar ao vivo.', 'Regras da Comunidade: Lembre-se de seguir as diretrizes da plataforma para manter um ambiente seguro e divertido para todos.' ] } ];
    const beautyEffectsData = { filters: [ {name: 'Fechar', icon: '🚫'}, {name: 'Musa', img: 'https://i.pravatar.cc/150?img=1'}, {name: 'Bonito', img: 'https://i.pravatar.cc/150?img=2'}, {name: 'Vitalidade', img: 'https://i.pravatar.cc/150?img=3'} ], effects: [ {name: 'Branquear', icon: '😊'}, {name: 'Alisar a p...', icon: '✨'}, {name: 'Ruborizar', icon: '☺️'}, {name: 'Contraste', icon: '🌗'} ] };


    const users = new Map<string, User>();
    const followingMap = new Map<string, Set<string>>();
    const fansMap = new Map<string, Set<string>>();
    const permissions = new Map<string, { camera: 'granted' | 'denied' | 'prompt'; microphone: 'granted' | 'denied' | 'prompt'; }>();
    const notificationSettings = new Map<string, NotificationSettings>();
    const giftNotificationSettings = new Map<string, Record<string, boolean>>();
    giftNotificationSettings.set(CURRENT_USER_ID, gifts.reduce((acc, gift) => ({ ...acc, [gift.name]: true }), {}));
    const beautySettings = new Map<string, BeautySettings>();
    beautySettings.set(CURRENT_USER_ID, { 'Branquear': 20, 'Alisar a p...': 30, 'Ruborizar': 10, 'Contraste': 50 });
    const userConnectedAccounts = new Map<string, { google?: GoogleAccount[] }>();
    if (googleAccountsData && googleAccountsData.length > 0) {
        userConnectedAccounts.set(CURRENT_USER_ID, { google: [googleAccountsData[0]] });
    }

    const mainUserAvatar = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

    const allUserData: Partial<User>[] = [
      {
        id: '10755083',
        identification: '10755083',
        name: 'Seu Perfil',
        avatarUrl: mainUserAvatar,
        obras: [
            { id: 'obra-user-main', url: mainUserAvatar },
            { id: 'obra-user-1', url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
            { id: 'obra-user-2', url: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }
        ],
        photos: [],
        coverUrl: 'https://picsum.photos/seed/profile-cover/400/800',
        country: 'br',
        age: 32,
        birthday: '15/07/1992',
        gender: 'male',
        isFollowed: false,
        topFansAvatars: [],
        bio: 'Olá! Bem-vindo ao meu perfil.',
        curtidas: [],
        isVIP: false,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        adminWithdrawalMethod: { email: 'admin@livego.com' }
      },
      ...streamersData.map(s => ({ id: s.hostId, identification: s.hostId, name: s.name, avatarUrl: s.avatar, isLive: true, isOnline: true, lastSeen: new Date().toISOString() })),
      ...friendsData.map(({xp, level, ...rest}) => rest),
      {...livercoreUser, xp: undefined, level: undefined},
      ...followingUsersData,
      ...topFansUsersData.map(({xp, level, ...rest}) => rest),
      ...fansUsersData,
      { id: 'buzzcast-oficial', identification: 'buzzcast-oficial', name: 'BuzzCast Oficial', avatarUrl: 'https://i.imgur.com/JdJg8Uq.png', isFollowed: true },
      { id: 'user-a', identification: 'user-a', name: 'QUALITY', avatarUrl: 'https://i.pravatar.cc/150?img=1', gender: 'male', age: 32, isVIP: true },
      { id: 'user-b', identification: 'user-b', name: 'nachodaddy', avatarUrl: 'https://i.pravatar.cc/150?img=2', gender: 'male', age: 38 },
      { id: 'user-c', identification: 'user-c', name: 'Biazinha ✨', avatarUrl: 'https://i.pravatar.cc/150?img=3', gender: 'female', age: 21 },
      { id: 'user-d', identification: 'user-d', name: 'marina da samara 👄', avatarUrl: 'https://i.pravatar.cc/150?img=4', gender: 'female', age: 21 },
      { id: 'user-e', identification: 'user-e', name: 'MineiraFake ✨ Ui ✨', avatarUrl: 'https://i.pravatar.cc/150?img=5', gender: 'female', age: 19 },
    ];

    allUserData.forEach(user => {
        if (!users.has(user.id!)) {
            const completeUser: User = { 
                coverUrl: `https://picsum.photos/seed/${user.id}-cover/400/800`, country: 'br', age: 25, gender: 'not_specified', rank: 0, location: 'Brasil', distance: 'desconhecido', 
                fans: 0,
                following: 0,
                receptores: 0,
                enviados: 0,
                topFansAvatars: [], isLive: false, isFollowed: false, isOnline: false, lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 
                diamonds: Math.floor(Math.random() * 10000), 
                earnings: Math.floor(Math.random() * 5000), 
                earnings_withdrawn: 0,
                withdrawal_method: undefined,
                bio: '', obras: [], curtidas: [], isVIP: Math.random() > 0.8, ...user, id: user.id!, identification: user.identification!, name: user.name!, avatarUrl: user.avatarUrl!, 
                level: 1, 
                xp: 0,
                photos: [], // Deprecating this field, use obras instead
                chatPermission: 'all',
                pipEnabled: false,
                locationPermission: 'prompt',
                showActivityStatus: true,
                showLocation: true,
                ownedFrames: [],
                activeFrameId: null,
                frameExpiration: null,
                privateStreamSettings: {
                    privateInvite: true,
                    followersOnly: true,
                    fansOnly: false,
                    friendsOnly: false,
                },
            };
            users.set(user.id!, completeUser);
        }
    });

    users.forEach(user => {
        if (!followingMap.has(user.id)) {
            followingMap.set(user.id, new Set());
        }
        if (!fansMap.has(user.id)) {
            fansMap.set(user.id, new Set());
        }
    });
    
    // Manually set up some friend relationships (mutual follows)
    const jumaId = 'user-juma';
    const anaId = 'user-ana';

    // Current user and Juma are friends
    followingMap.get(CURRENT_USER_ID)!.add(jumaId);
    followingMap.get(jumaId)!.add(CURRENT_USER_ID);
    fansMap.get(jumaId)!.add(CURRENT_USER_ID);
    fansMap.get(CURRENT_USER_ID)!.add(jumaId);
    
    // Current user and Ana are friends
    followingMap.get(CURRENT_USER_ID)!.add(anaId);
    followingMap.get(anaId)!.add(CURRENT_USER_ID);
    fansMap.get(anaId)!.add(CURRENT_USER_ID);
    fansMap.get(CURRENT_USER_ID)!.add(anaId);
    
    // After setting relationships, recalculate and update user counts for consistency
    users.forEach(user => {
        if (user) {
            user.following = followingMap.get(user.id)?.size || 0;
            user.fans = fansMap.get(user.id)?.size || 0;
        }
    });


    permissions.set(CURRENT_USER_ID, { camera: 'prompt', microphone: 'prompt' });
    notificationSettings.set(CURRENT_USER_ID, {
        newMessages: true,
        streamerLive: true,
        followedPosts: true,
        pedido: true,
        interactive: true,
    });
    const contributions = new Map<string, number>();
    const messages = new Map<string, Message>();
    const streamRooms = new Map<string, Set<string>>();
    const purchases: PurchaseRecord[] = [];
    const orders = new Map<string, Order>(); // Added orders collection

    // Pre-populate some contributions for realism
    const userIds = Array.from(users.keys());
    for(let i = 0; i < 50; i++) { // give contributions to 50 random users
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const existingContribution = contributions.get(randomUserId) || 0;
        contributions.set(randomUserId, existingContribution + Math.floor(Math.random() * 5000) + 10);
    }

    // Pre-populate some rooms for realism to match static viewer counts
    const allUserIds = Array.from(users.keys());
    streamersData.forEach(stream => {
        const room = new Set<string>();
        // Host is always in their own room
        room.add(stream.hostId);

        // Add random viewers up to the static viewer count
        const targetViewerCount = stream.viewers || Math.floor(Math.random() * 100);
        // Ensure we don't try to add more users than exist, minus the host
        const usersToAdd = Math.min(targetViewerCount - 1, allUserIds.length - 1);
        
        let addedCount = 0;
        let attempts = 0; // Prevent infinite loop if we can't find unique users
        while (addedCount < usersToAdd && attempts < allUserIds.length * 2) {
            const randomUserId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
            // Ensure we don't add the host again or a duplicate user
            if (!room.has(randomUserId)) {
                room.add(randomUserId);
                addedCount++;
            }
            attempts++;
        }
        streamRooms.set(stream.id, room);
    });

    const allUsersForFeed = Array.from(users.values());
    const photoFeedData: FeedPhoto[] = [
        { id: 'pf1', photoUrl: 'https://picsum.photos/seed/pf1/600/800', user: allUsersForFeed.find(u => u.name === 'MIRELLA')!, likes: 123, isLiked: false },
        { id: 'pf2', photoUrl: 'https://picsum.photos/seed/pf2/600/800', user: allUsersForFeed.find(u => u.name === 'SARAH')!, likes: 45, isLiked: true },
        { id: 'pf3', photoUrl: 'https://picsum.photos/seed/pf3/600/800', user: allUsersForFeed.find(u => u.name === 'princesa')!, likes: 89, isLiked: false },
        { id: 'pf4', photoUrl: 'https://picsum.photos/seed/pf4/600/800', user: allUsersForFeed.find(u => u.name === 'JuFe')!, likes: 234, isLiked: false },
        { id: 'pf5', photoUrl: 'https://picsum.photos/seed/pf5/600/800', user: allUsersForFeed.find(u => u.name === 'Isa')!, likes: 56, isLiked: true },
        { id: 'pf6', photoUrl: 'https://picsum.photos/seed/pf6/600/800', user: allUsersForFeed.find(u => u.name === 'Laura')!, likes: 199, isLiked: false },
        { id: 'pf7', photoUrl: 'https://picsum.photos/seed/pf7/600/800', user: allUsersForFeed.find(u => u.name === 'Juma')!, likes: 78, isLiked: false },
        { id: 'pf8', photoUrl: 'https://picsum.photos/seed/pf8/600/800', user: allUsersForFeed.find(u => u.name === 'Ana')!, likes: 432, isLiked: true },
        { id: 'pf9', photoUrl: 'https://picsum.photos/seed/pf9/600/800', user: allUsersForFeed.find(u => u.name === 'QUALITY')!, likes: 31, isLiked: false },
        { id: 'pf10', photoUrl: 'https://picsum.photos/seed/pf10/600/800', user: allUsersForFeed.find(u => u.name === 'nachodaddy')!, likes: 67, isLiked: false },
        { id: 'pf11', photoUrl: 'https://picsum.photos/seed/pf11/600/800', user: allUsersForFeed.find(u => u.name === 'Biazinha ✨')!, likes: 88, isLiked: false },
        { id: 'pf12', photoUrl: 'https://picsum.photos/seed/pf12/600/800', user: allUsersForFeed.find(u => u.name === 'MineiraFake ✨ Ui ✨')!, likes: 150, isLiked: true },
    ];
    
    return {
        db_version: DB_VERSION,
        platform_earnings: 0,
        users,
        following: followingMap,
        fans: fansMap,
        gifts,
        countries,
        conversations,
        sentGifts: new Map<string, (Gift & { count: number })[]>(),
        receivedGifts: new Map(receivedGiftsByStreamer),
        contributions,
        streamRooms,
        streamers: streamersData,
        friends: friendsData,
        followingUsers: followingUsersData,
        fansUsers: fansUsersData,
        visits: new Map<string, { visitorId: string, timestamp: string }[]>(),
        topFansUsers: topFansUsersData,
        liveStreamManual: liveStreamManualData,
        beautyEffects: beautyEffectsData,
        beautySettings,
        blocklist: new Map<string, Set<string>>(),
        messages,
        permissions,
        notificationSettings,
        giftNotificationSettings,
        purchases,
        contributionLog: [],
        history: { actions: [], transactions: [], liveEvents: [] },
        streamHistory: [] as StreamHistoryEntry[],
        photoFeed: photoFeedData,
        photoLikes: new Map<string, Set<string>>(),
        liveSessions: new Map<string, Partial<LiveSessionState & { viewerSet: Set<string>; isMicrophoneMuted: boolean; isStreamMuted: boolean; giftSenders: Map<string, EligibleUser>, isAutoFollowEnabled: boolean; isAutoPrivateInviteEnabled: boolean; }>>(),
        kickedUsers: new Map<string, Set<string>>(),
        moderators: new Map<string, Set<string>>(),
        pkDefaultConfig: { duration: 7 },
        pkBattles: new Map<string, PKBattleState>(),
        reports: [] as { reporterId: string, reportedId: string, reason: string, timestamp: string }[],
        chatMetadata: new Map<string, { systemNotificationSent: boolean }>(),
        googleAccounts: googleAccountsData,
        userConnectedAccounts,
        orders,
        liveNotifications: [] as LiveNotification[], // Added liveNotifications
        invitations: [] as Invitation[],
    };
};

type LiveGoDB = ReturnType<typeof constructInitialDb>;

const migrateDb = (dbInstance: LiveGoDB) => {
    console.log('[DB] Running migration to reset inconsistent data...');
    const users = dbInstance.users;
    const following = dbInstance.following;
    const fans = dbInstance.fans;
    
    if (!users || !following || !fans) {
        console.error('[DB] Migration failed: core data maps not found.');
        return dbInstance;
    }

    users.forEach((user, userId) => {
        user.receptores = 0;
        user.enviados = 0;
        user.following = following.get(userId)?.size || 0;
        user.fans = fans.get(userId)?.size || 0;
    });

    console.log('[DB] Migration complete. Counters have been reset and recalculated.');
    return dbInstance;
};

// This function now initializes the data store.
// In a real backend, this would be replaced by Mongoose models interacting with the live DB.
// The data from `constructInitialDb` is now treated as a "seed" for a development database,
// ensuring the app has data to work with on the first run if the database is empty.
const initializeDataStore = (): LiveGoDB => {
    console.log('[DB] Initializing data store. Using initial data as a seed for development environment.');
    return constructInitialDb();
};

export let db: LiveGoDB = initializeDataStore();

// This function is now a no-op. In a real backend, data persistence is handled
// by the database driver (e.g., Mongoose) on each create/update/delete operation.
// Any calls to `saveDb()` will do nothing, simulating that data is saved automatically.
export const saveDb = () => {
    // console.log('[DB] Data persistence is now handled by the live database connection.');
};

// Initialize the database connection when the service starts.
connectToDatabase();


// For debugging in browser console:
(window as any).resetLiveGoDb = () => {
  localStorage.removeItem('livego_db');
  window.location.reload();
};
(window as any).getLiveGoDb = () => {
  console.log(db);
};