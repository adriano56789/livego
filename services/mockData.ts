
import { User, Streamer, Gift, Conversation, RankedUser, MusicTrack } from '@/types';
import { GIFTS } from '@/constants';

const defaultUserFields = {
    coverUrl: 'https://picsum.photos/seed/default/800/1200',
    diamonds: 0,
    level: 1,
    xp: 0,
    isLive: false,
    earnings: 0,
    earnings_withdrawn: 0,
    following: 0,
    fans: 0,
    gender: 'not_specified' as const,
    age: 18,
    location: 'Brasil',
    obras: [],
    curtidas: [],
    ownedFrames: [],
    receptores: 0,
    enviados: 0,
    topFansAvatars: []
};

export const mockData = {
    currentUser: {
        ...defaultUserFields,
        id: '5582931',
        identification: '5582931',
        name: 'Adriano MDK',
        email: 'adrianomdk5@gmail.com',
        avatarUrl: 'https://picsum.photos/seed/5582931/200',
        coverUrl: 'https://picsum.photos/seed/5582931-c/800/1200',
        diamonds: 25000,
        level: 18,
        xp: 3400,
        earnings: 12400,
        earnings_withdrawn: 0,
        following: 84,
        fans: 156,
        gender: 'male',
        age: 26,
        location: 'São Paulo, BR',
        isVIP: true,
        ownedFrames: [{ frameId: 'FrameBlazingSun', expirationDate: '2025-12-31' }],
        ownedGifts: [{ giftId: 'gift-126', quantity: 2 }, { giftId: 'gift-134', quantity: 1 }],
        notificationSettings: {
            newMessages: true,
            streamerLive: true,
            newFollower: false,
            followedPosts: true,
            pedido: true,
            interactive: true,
            push: true,
            giftAlertsOnScreen: true,
            giftSoundEffects: true,
            giftLuxuryBanners: false,
        }
    } as User,
    streamCategories: [
        { id: 'popular', label: 'Popular' },
        { id: 'followed', label: 'Seguido' },
        { id: 'nearby', label: 'Perto' },
        { id: 'pk', label: 'PK' },
        { id: 'new', label: 'Novo' },
        { id: 'music', label: 'Música' },
        { id: 'dance', label: 'Dança' },
        { id: 'game', label: 'Jogos' },
        { id: 'voice', label: 'Voz' },
        { id: 'party', label: 'Festa' },
        { id: 'private', label: 'Privada' }
    ],
    streams: [
        { id: '8827364', hostId: '9928374', name: 'Mirella Oficial', avatar: 'https://picsum.photos/seed/9928374/200', location: 'São Paulo', viewers: 12500, category: 'Popular', tags: ['Festa', 'Música'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_9928374/400/600' },
        { id: '7721938', hostId: '2239485', name: 'DJ Arromba', avatar: 'https://picsum.photos/seed/2239485/200', location: 'Rio de Janeiro', viewers: 8300, category: 'Música', tags: ['Eletrônica'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_2239485/400/600' },
        { id: '4455667', hostId: '1122334', name: 'Gamer Master', avatar: 'https://picsum.photos/seed/1122334/200', location: 'Curitiba', viewers: 2100, category: 'Jogos', tags: ['Ranked'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_1122334/400/600' },
        { id: '1199228', hostId: '3344556', name: 'Alice Star', avatar: 'https://picsum.photos/seed/3344556/200', location: 'Miami', viewers: 3500, category: 'Popular', tags: ['Chat'], country: 'en', isLive: true, thumbnail: 'https://picsum.photos/seed/live_3344556/400/600' },
        { id: '5566778', hostId: '4455667', name: 'Dance Queen', avatar: 'https://picsum.photos/seed/4455667/200', location: 'Salvador', viewers: 980, category: 'Dança', tags: ['Funk', 'Axé'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_4455667/400/600' },
        { id: '9988776', hostId: '5566778', name: 'Voz da Noite', avatar: 'https://picsum.photos/seed/5566778/200', location: 'Belo Horizonte', viewers: 1540, category: 'Voz', tags: ['Sertanejo', 'Acústico'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_5566778/400/600' },
        { id: '1231231', hostId: '6677889', name: 'PK Host', avatar: 'https://picsum.photos/seed/6677889/200', location: 'Porto Alegre', viewers: 5200, category: 'PK', tags: ['Batalha'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_6677889/400/600' },
        { id: '4564564', hostId: '7788990', name: 'Festa em Casa', avatar: 'https://picsum.photos/seed/7788990/200', location: 'Recife', viewers: 2800, category: 'Festa', tags: ['Social'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_7788990/400/600' },
        { id: '7897897', hostId: '8899001', name: 'New Talent', avatar: 'https://picsum.photos/seed/8899001/200', location: 'Brasília', viewers: 350, category: 'Novo', tags: ['Descoberta'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_8899001/400/600' },
        { id: '9879879', hostId: '9900112', name: 'John Plays', avatar: 'https://picsum.photos/seed/9900112/200', location: 'Los Angeles', viewers: 11200, category: 'Jogos', tags: ['FPS'], country: 'en', isLive: true, thumbnail: 'https://picsum.photos/seed/live_9900112/400/600' },
        { id: '6546546', hostId: '1122333', name: 'Carla Dança', avatar: 'https://picsum.photos/seed/1122333/200', location: 'Fortaleza', viewers: 760, category: 'Dança', tags: ['FitDance'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_1122333/400/600' },
        { id: '3213213', hostId: '2233444', name: 'Prive Room', avatar: 'https://picsum.photos/seed/2233444/200', location: 'Manaus', viewers: 5, category: 'Privada', tags: ['Exclusivo'], country: 'pt', isLive: true, isPrivate: true, thumbnail: 'https://picsum.photos/seed/live_2233444/400/600' },
    ] as Streamer[],
    gifts: GIFTS,
    conversations: [
        {
            id: 'conv-101',
            friend: { ...defaultUserFields, id: '1234567', identification: '1234567', name: 'Suporte VIP', avatarUrl: 'https://picsum.photos/seed/1234567/200', isOnline: true, level: 99 } as User,
            lastMessage: 'Olá! Como podemos ajudar você hoje?',
            unreadCount: 1,
            updatedAt: new Date().toISOString()
        }
    ],
    onlineUsers: [
        { ...defaultUserFields, id: '3456754', identification: '3456754', name: 'Ricardo G.', avatarUrl: 'https://picsum.photos/seed/3456754/100', level: 12, age: 24, gender: 'male', value: 1500, isOnline: true },
        { ...defaultUserFields, id: '8827361', identification: '8827361', name: 'Juliana P.', avatarUrl: 'https://picsum.photos/seed/8827361/100', level: 22, age: 21, gender: 'female', value: 4200, isOnline: true },
        { ...defaultUserFields, id: '9921823', identification: '9921823', name: 'Marcos Dev', avatarUrl: 'https://picsum.photos/seed/9921823/100', level: 8, age: 28, gender: 'male', value: 300, isOnline: true }
    ] as (User & { value: number })[],
    ranking: [
        { ...defaultUserFields, id: '8827361', identification: '8827361', name: 'Juliana P.', avatarUrl: 'https://picsum.photos/seed/8827361/100', level: 22, value: 50000, rank: 1, gender: 'female' } as RankedUser,
        { ...defaultUserFields, id: '3456754', identification: '3456754', name: 'Ricardo G.', avatarUrl: 'https://picsum.photos/seed/3456754/100', level: 12, value: 30000, rank: 2, gender: 'male' } as RankedUser
    ],
    frames: [
        { id: 'FrameBlazingSun', name: 'Sol Escaldante', price: 500, category: 'avatar' },
        { id: 'FrameBlueCrystal', name: 'Cristal Azul', price: 300, category: 'avatar' }
    ],
    music: [
        { id: 'm-501', title: 'Viral Mix 2024', artist: 'LiveGo Hits', url: '#', duration: 165 }
    ]
};
