// This file contains the complete mock API server, including the in-memory database,
// routing logic, and all endpoint handlers. It fully simulates the backend.

import type * as types from '../types';
import * as levelService from './levelService';
import { database } from './database';
import { mongoObjectId } from './mongoObjectId';

// --- SIMULATED ENVIRONMENT VARIABLES ---
const SRS_URL_PUBLISH = 'rtmp://localhost/live';
const SRS_URL_PLAY_WEBRTC = 'webrtc://localhost/live';
const SRS_URL_PLAY_HLS = 'http://localhost:8080/live';

// A simple helper to map DB records to frontend view models
// FIX: Changed record type from any to LiveStreamRecord for better type safety.
const mapLiveRecordToStream = (record: types.LiveStreamRecord): types.Stream => ({
    id: record.id,
    userId: record.user_id,
    titulo: record.titulo,
    nomeStreamer: record.nome_streamer,
    thumbnailUrl: record.thumbnail_url,
    espectadores: record.current_viewers?.length || 0,
    categoria: record.categoria,
    aoVivo: record.ao_vivo,
    emPk: record.em_pk,
    isPrivate: record.is_private,
    entryFee: record.entry_fee,
    meta: record.meta,
    inicio: new Date(record.inicio).toISOString(),
    permitePk: record.permite_pk,
    isParty: record.categoria === 'Festa',
    countryCode: record.country_code,
    cameraFacingMode: record.camera_facing_mode,
    voiceEnabled: record.voice_enabled ?? true,
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

// Helper to build a full Conversation view model
const buildConversationViewModel = (convoRecord: any, currentUserId: number, allUsers: any[]): types.Conversation => {
    const otherUserId = convoRecord.participants.find((pId: number) => pId !== currentUserId)!;
    const otherUser = allUsers.find((u: types.User) => u.id === otherUserId)!;
    const currentUser = allUsers.find((u: types.User) => u.id === currentUserId)!;

    const messagesForConvo = (convoRecord.messages || [])
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((m: any): types.ConversationMessage => ({
            id: m.id,
            senderId: m.senderId,
            type: m.senderId === -1 ? 'system' : m.imageUrl ? 'image' : 'text',
            text: m.text || null,
            imageUrl: m.imageUrl || null,
            timestamp: new Date(m.timestamp).toISOString(),
            status: (m.seenBy || []).length === convoRecord.participants.length ? 'seen' : 'sent',
            seenBy: m.seenBy || [],
        }));
    
    const unreadCount = messagesForConvo.filter(m => m.senderId === otherUserId && !(m.seenBy || []).includes(currentUserId)).length;
    
    // Check for mutual friendship
    const isFriend = (currentUser.following || []).includes(otherUserId) && (otherUser.following || []).includes(currentUserId);

    return {
        id: convoRecord.id,
        type: 'chat',
        participants: convoRecord.participants,
        otherUserId: otherUserId,
        otherUserName: otherUser.nickname || otherUser.name,
        otherUserAvatarUrl: otherUser.avatar_url || '',
        isFriend: isFriend,
        unreadCount,
        messages: messagesForConvo,
    };
};

// Function to initialize chat with some content if it's empty
const initializeChatForLive = async (liveId: number | string, allUsers: any[], allLives: any[]) => {
    const live = allLives.find((l: any) => l.id === liveId);
    if (live) {
        if (!live.chatMessages || live.chatMessages.length === 0) {
            const streamer = allUsers.find((u: any) => u.id === live.user_id);
            const initialMessage = {
                id: Date.now() - 10000,
                type: 'announcement',
                username: 'System',
                userId: 0,
                message: `Bem-vindo à live de ${streamer?.nickname || 'streamer'}!`,
                timestamp: new Date(Date.now() - 10000).toISOString(),
            };
            await database.liveStreams.updateOne({ id: liveId }, { $push: { chatMessages: initialMessage }});
        }
    }
};

// Helper to get a user object with dynamically calculated stats
const getDynamicUser = async (userId: number): Promise<types.User | undefined> => {
    const [user, allUsers, profileVisits] = await Promise.all([
      database.users.findOne({ id: userId }),
      database.users.find(),
      database.profileVisits.find({ visitedId: userId })
    ]);

    if (!user) {
        return undefined;
    }

    // Fans are all followers.
    const allFollowers = allUsers.filter((u: any) => (u.following || []).includes(userId));
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // @ts-ignore
    const recentVisits = profileVisits.filter((v: any) => new Date(v.date) > sevenDaysAgo);
    // @ts-ignore
    const uniqueVisitorIds = new Set(recentVisits.map((v: any) => v.visitorId));
    
    const age = calculateAge((user as types.User).birthday);

    return {
        ...user,
        followers: allFollowers.length, // This property is used for the "Fãs" count
        visitors: uniqueVisitorIds.size,
        age,
    } as unknown as types.User;
}

const getAllUsersWithDynamicFollowers = async (): Promise<any[]> => {
    const allUsers = await database.users.find();
    return allUsers.map(user => {
        const followersCount = allUsers.filter(u => (u.following || []).includes(user.id)).length;
        return { ...user, followers: followersCount };
    });
}

// Helper for new stream-specific leveling
const getStreamLevelAndBadge = (xp: number) => {
    const level = Math.floor(xp / 100) + 1; // 100 XP per level, starts at 1
    
    if (level >= 30) {
        return { level, badge: { text: 'LiveStar', icon: '✨' } };
    }
    if (level >= 10) {
        return { level, badge: { text: 'LiveGoFan', icon: '👍' } };
    }
    return { level, badge: { text: 'Recém-chegado', icon: '👋' } };
};

// Router function that simulates a backend API
export const handleApiRequest = async (method: string, path: string, body: any, query: URLSearchParams): Promise<any> => {
  console.log(`[Mock API] Handling: ${method} ${path}`);
  
  const notFound = () => { throw new Error(`Endpoint ${method} ${path} não encontrado`); };

  // Handle simple, non-parameterized routes first.
  if (method === 'GET' && path === '/api/version') {
    return {
      minVersion: '1.0.0',
      latestVersion: '1.0.0',
      updateUrl: 'https://example.com/update-app',
    };
  }

  if (method === 'POST' && path === '/api/auth/google') {
    const user = await getDynamicUser(10755083); // The main mock user
    if (!user) {
      throw new Error('Usuário principal não encontrado na base de dados simulada.');
    }
    return user;
  }
  
  if (method === 'POST' && path === '/api/livekit/token') {
    // Return a dummy token for simulation
    return { token: 'dummy-livekit-token.' + Math.random() };
  }
  
  if (method === 'GET' && path === '/api/users/search') {
    const q = query.get('q')?.toLowerCase() || '';
    if (!q) return [];
    const allUsers = await database.users.find();
    return allUsers.filter(u => 
        (u.nickname || '').toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        String(u.id).includes(q)
    );
  }
  
  if (method === 'GET' && path === '/api/help/contact-channels') {
      return [
          { id: '1', nome: 'Suporte ao Vivo', tipo: 'chat_interno', destino: 'support_chat', icone: 'headset', is_ativo: true, horario_funcionamento: '24/7' },
          { id: '2', nome: 'E-mail', tipo: 'email', destino: 'mailto:support@livego.com', icone: 'envelope', is_ativo: true },
          { id: '3', nome: 'WhatsApp', tipo: 'link_externo', destino: 'https://wa.me/123456789', icone: 'whatsapp', is_ativo: true },
      ]
  }

  // --- Profile Options Endpoints ---
  if (method === 'GET' && path === '/api/genders') {
    return [
      { id: 'male', label: 'Masculino' },
      { id: 'female', label: 'Feminino' },
    ];
  }

  if (method === 'GET' && path === '/api/countries') {
    return [
      { id: 'BR', label: 'Brasil' },
      { id: 'US', label: 'Estados Unidos' },
      { id: 'ES', label: 'Espanha' },
      { id: 'PT', label: 'Portugal' },
      { id: 'AR', label: 'Argentina' },
      { id: 'CO', label: 'Colômbia' },
      { id: 'MX', label: 'México' },
    ];
  }

  if (method === 'GET' && path === '/api/emotional_states') {
    return [
        { id: 'happy', label: 'Feliz' },
        { id: 'sad', label: 'Triste' },
        { id: 'in_love', label: 'Apaixonado(a)' },
        { id: 'neutral', label: 'Neutro' },
        { id: 'excited', label: 'Empolgado(a)'},
        { id: 'tired', label: 'Cansado(a)'}
    ];
  }
  
  if (method === 'GET' && path === '/api/professions') {
      return [
          { id: 'student', label: 'Estudante' },
          { id: 'developer', label: 'Desenvolvedor(a)' },
          { id: 'artist', label: 'Artista' },
          { id: 'teacher', label: 'Professor(a)' },
          { id: 'doctor', label: 'Médico(a)'},
          { id: 'engineer', label: 'Engenheiro(a)'}
      ];
  }

  if (method === 'GET' && path === '/api/languages') {
      return [
          { id: 'pt', label: 'Português' },
          { id: 'en', label: 'Inglês' },
          { id: 'es', label: 'Espanhol' },
          { id: 'fr', label: 'Francês' },
          { id: 'de', label: 'Alemão' },
      ];
  }

  const filterByRegion = (lives: any[], regionCode?: string | null): any[] => {
    const region = regionCode || query.get('region');
    if (region && region.toLowerCase() !== 'global') {
        return lives.filter(l => (l as types.LiveStreamRecord).country_code === region);
    }
    return lives;
  };
  
    if (method === 'GET' && path === '/api/regions') {
        return regions;
    }
    
    if (method === 'POST' && path === '/api/users/location-preference') {
        return { success: true };
    }
  
    if (method === 'GET' && path === '/api/lives/nearby') {
        const userId = query.get('userId') ? parseInt(query.get('userId')!, 10) : null;
        if (!userId) {
            throw new Error("userId is required for nearby streams");
        }
        
        const allLive = await database.liveStreams.find({ ao_vivo: true });
        const otherLives = allLive.filter((l: any) => l.user_id !== userId);
        const shuffled = otherLives.sort(() => 0.5 - Math.random());
        
        return shuffled.map(mapLiveRecordToStream);
    }

    if (method === 'POST' && path === '/api/chat/private/get-or-create') {
        const { currentUserId, otherUserId } = body;
        const participantsSorted = [currentUserId, otherUserId].sort((a,b) => a-b);

        let convoRecord = await database.conversations.findOne({ participants: participantsSorted });

        if (!convoRecord) {
            const newConvoData = {
                id: `convo-${currentUserId}-${otherUserId}-${Date.now()}`,
                participants: participantsSorted,
                ultima_mensagem_texto: "",
                ultima_mensagem_timestamp: new Date().toISOString(),
                messages: [],
            };
            await database.conversations.insertOne(newConvoData as any);
            convoRecord = await database.conversations.findOne({ id: newConvoData.id });
        }
        const allUsers = await database.users.find();
        return buildConversationViewModel(convoRecord, currentUserId, allUsers);
    }

    if (method === 'POST' && path === '/api/chat/viewed') {
        const { conversationId, viewerId } = body;
        if (!conversationId || !viewerId) {
            throw new Error('conversationId and viewerId are required');
        }
    
        const convo = await database.conversations.findOne({ id: conversationId });
        if (!convo) {
            // It's possible the convo doesn't exist yet if it's brand new.
            // Don't throw an error, just return success.
            return { success: true };
        }
    
        let modified = false;
        (convo.messages || []).forEach((msg: any) => {
            if (!msg.seenBy) {
                // Initialize seenBy with the sender's ID
                msg.seenBy = msg.senderId ? [msg.senderId] : [];
            }
            if (msg.senderId !== viewerId && !msg.seenBy.includes(viewerId)) {
                msg.seenBy.push(viewerId);
                modified = true;
            }
        });
    
        if (modified) {
            await database.conversations.updateOne({ id: conversationId }, { $set: { messages: convo.messages } });
        }
    
        return { success: true };
    }
    
    if (method === 'GET' && path === '/api/gifts') {
      const gifts = await database.gifts.find();
      return gifts;
    }

    if (method === 'GET' && path === '/api/live/categories') {
        const allCategories: types.Category[] = ['Popular', 'Seguindo', 'Perto', 'Atualizado', 'Privada', 'PK', 'Novo', 'Música', 'Dança'];
        return allCategories.map(cat => ({
            id: cat.toLowerCase().replace('ç', 'c').replace('ú', 'u'),
            name: cat,
            slug: cat.toLowerCase().replace('ç', 'c').replace('ú', 'u'),
        }));
    }

  // Use regex for paths with params
  const liveListMatch = path.match(/^\/api\/lives$/);
  const liveDetailsMatch = path.match(/^\/api\/lives\/(\d+)$/);
  const liveGiftMatch = path.match(/^\/api\/lives\/(\d+)\/gift$/);
  const liveLikeMatch = path.match(/^\/api\/lives\/(\d+)\/like$/);
  const liveJoinMatch = path.match(/^\/api\/lives\/(\d+)\/join$/);
  const liveLeaveMatch = path.match(/^\/api\/lives\/(\d+)\/leave$/);
  const liveMicToggleMatch = path.match(/^\/api\/lives\/(\d+)\/mic-toggle$/);
  const liveViewersMatch = path.match(/^\/api\/lives\/(\d+)\/viewers$/);
  const liveChatMatch = path.match(/^\/api\/chat\/live\/(\d+)$/);
  const livePkMatch = path.match(/^\/api\/lives\/pk$/);
  const liveStartMatch = path.match(/^\/api\/live\/start$/);
  const hourlyRankingMatch = path.match(/^\/api\/ranking\/hourly$/);
  const userListRankingMatch = path.match(/^\/api\/ranking\/user-list$/);
  const userLiveStatusMatch = path.match(/^\/api\/users\/(\d+)\/live-status$/);
  const userLevelMatch = path.match(/^\/api\/users\/(\d+)\/level$/);
  const userLivePreferencesMatch = path.match(/^\/api\/users\/(\d+)\/live-preferences$/);
  const userDetailsMatch = path.match(/^\/api\/users\/(\d+)$/);
  const userProfileMatch = path.match(/^\/api\/users\/(\d+)\/profile$/);
  const userFollowersMatch = path.match(/^\/api\/users\/(\d+)\/followers$/);
  const userFollowingMatch = path.match(/^\/api\/users\/(\d+)\/following$/);
  const userFansMatch = path.match(/^\/api\/users\/(\d+)\/fans$/);
  const userFriendsMatch = path.match(/^\/api\/users\/(\d+)\/friends$/);
  const userCoHostFriendsMatch = path.match(/^\/api\/users\/(\d+)\/cohost-friends$/);
  const userVisitorsMatch = path.match(/^\/api\/users\/(\d+)\/visitors$/);
  const userConversationsMatch = path.match(/^\/api\/users\/(\d+)\/conversations$/);
  const userPurchaseHistoryMatch = path.match(/^\/api\/users\/(\d+)\/purchase-history$/);
  const userActiveStreamMatch = path.match(/^\/api\/users\/(\d+)\/active-stream$/);
  const userGiftsReceivedMatch = path.match(/^\/api\/users\/(\d+)\/gifts\/received$/);
  const userGiftsSentMatch = path.match(/^\/api\/users\/(\d+)\/gifts\/sent$/);
  const userBlockedListMatch = path.match(/^\/api\/users\/(\d+)\/blocked$/);
  const userFollowingLiveStatusMatch = path.match(/^\/api\/users\/(\d+)\/following-live-status$/);
  const userFriendRequestsMatch = path.match(/^\/api\/users\/(\d+)\/friend-requests$/);
  const userProtectorsMatch = path.match(/^\/api\/users\/(\d+)\/protectors$/);
  const userWithdrawalBalanceMatch = path.match(/^\/api\/users\/(\d+)\/withdrawal-balance$/);
  const userWithdrawalHistoryMatch = path.match(/^\/api\/users\/(\d+)\/withdrawal-history$/);
  const pkBattleDetailsMatch = path.match(/^\/api\/pk-battles\/(\d+)$/);
  const activePkBattleMatch = path.match(/^\/api\/batalhas-pk\/(\d+)$/);
  const activePkForStreamMatch = path.match(/^\/api\/streams\/(\d+)\/batalha-pk$/);
  const privateChatMatch = path.match(/^\/api\/chat\/private\/([a-zA-Z0-9\-]+)$/);
  const diamondPackagesMatch = path.match(/^\/api\/diamonds\/packages$/);
  const purchaseStatusMatch = path.match(/^\/api\/purchase\/status\/([a-zA-Z0-9\-]+)$/);
  const userNotificationSettingsMatch = path.match(/^\/api\/users\/(\d+)\/notification-settings$/);
  const userGiftNotificationSettingsMatch = path.match(/^\/api\/users\/(\d+)\/gift-notification-settings$/);
  const userPendingInvitesMatch = path.match(/^\/api\/users\/(\d+)\/pending-invites$/);
  const liveInviteMatch = path.match(/^\/api\/lives\/(\d+)\/invite$/);
  const liveCancelInviteMatch = path.match(/^\/api\/lives\/(\d+)\/cancel-invite$/);
  const paymentDetectBrandMatch = path.match(/^\/api\/payment\/detect-brand$/);
  const pendingPkInviteMatch = path.match(/^\/api\/pk\/invites\/pending\/(\d+)$/);
  const pkInviteStatusMatch = path.match(/^\/api\/pk\/invites\/status\/([a-zA-Z0-9\-]+)$/);
  const pkInviteAcceptMatch = path.match(/^\/api\/pk\/invites\/([a-zA-Z0-9\-]+)\/accept$/);
  const pkInviteDeclineMatch = path.match(/^\/api\/pk\/invites\/([a-zA-Z0-9\-]+)\/decline$/);
  const pkInviteCancelMatch = path.match(/^\/api\/pk\/invites\/([a-zA-Z0-9\-]+)\/cancel$/);
  const cohostInviteMatch = path.match(/^\/api\/pk\/cohost-invite$/);

  if (method === 'GET' && liveListMatch) {
    const category = query.get('category');
    const userId = query.get('userId') ? parseInt(query.get('userId')!, 10) : null;
    const allLive = await database.liveStreams.find({ ao_vivo: true });
    
    let streams: any[];

    switch (category) {
        case 'seguindo':
            if (!userId) {
                throw new Error("userId is required for 'seguindo' category");
            }
            const user = await database.users.findOne({ id: userId });
            const followingIds = user?.following || [];
            streams = allLive.filter((l: any) => followingIds.includes(l.user_id));
            break;
        case 'novo':
            streams = allLive.sort((a: any, b: any) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
            break;
        case 'privada':
             if (!userId) {
                throw new Error("userId is required for 'privada' category");
            }
            streams = allLive.filter((l: any) => l.is_private && (l.invited_users || []).includes(userId));
            break;
        case 'música':
        case 'dança':
            streams = allLive.filter((l: any) => l.categoria.toLowerCase() === category);
            break;
        case 'popular':
        default:
            streams = allLive.sort((a: any, b: any) => b.espectadores - a.espectadores);
            break;
    }
    return filterByRegion(streams).map(mapLiveRecordToStream);
  }

  if (method === 'GET' && liveDetailsMatch) {
    const liveId = parseInt(liveDetailsMatch[1], 10);
    const live = await database.liveStreams.findOne({ id: liveId });
    if (!live || !live.ao_vivo) {
        throw new Error(`Live stream com ID ${liveId} não encontrado ou não está ao vivo.`);
    }
    const streamer = await getDynamicUser(live.user_id);
    if (!streamer) {
        throw new Error(`Streamer com ID ${live.user_id} não encontrado.`);
    }

    const totalVisitors = new Set(live.current_viewers || []);
    const sentGifts = await database.sentGifts.find({ liveId });
    // @ts-ignore
    const receivedGiftsValue = sentGifts.reduce((sum, gift) => sum + gift.diamondCost, 0);

    return {
        streamerName: streamer.nickname || streamer.name,
        streamerAvatarUrl: streamer.avatar_url,
        streamerFollowers: streamer.followers || 0,
        viewerCount: (live.current_viewers || []).length,
        totalVisitors: totalVisitors.size,
        receivedGiftsValue,
        rankingPosition: 'Top 5',
        status: 'ao vivo',
        likeCount: live.like_count || 0,
        streamerIsAvatarProtected: streamer.is_avatar_protected,
        title: live.titulo,
        meta: live.meta,
    };
  }
  
  if ((method === 'GET' || method === 'POST') && liveChatMatch) {
    const liveId = parseInt(liveChatMatch[1], 10);
    const live = await database.liveStreams.findOne({ id: liveId });

    if (!live) {
      throw new Error(`Live stream com ID ${liveId} não encontrado.`);
    }

    if (method === 'GET') {
      await initializeChatForLive(liveId, await database.users.find(), await database.liveStreams.find());
      const updatedLive = await database.liveStreams.findOne({ id: liveId });
      return updatedLive?.chatMessages || [];
    }

    // This must be POST
    const { userId, message, imageUrl } = body;
    const user = await database.users.findOne({ id: userId });
    if (!user) throw new Error(`Usuário ${userId} não encontrado.`);
    
    const newMsg: types.ChatMessage = {
        id: Date.now(),
        type: imageUrl ? 'image' : 'message',
        userId: user.id,
        username: user.nickname || user.name,
        message: message,
        imageUrl: imageUrl,
        timestamp: new Date().toISOString(),
        globalLevel: user.level,
        avatarUrl: user.avatar_url,
        age: calculateAge(user.birthday),
        gender: user.gender,
    };

    await database.liveStreams.updateOne({ id: liveId }, { $push: { chatMessages: newMsg } });
    return newMsg;
  }
  
  if (method === 'GET' && liveViewersMatch) {
    const liveId = parseInt(liveViewersMatch[1], 10);
    const live = await database.liveStreams.findOne({ id: liveId });
    if (!live) {
      throw new Error(`Live stream com ID ${liveId} não encontrado.`);
    }
    const allUsers = await database.users.find();
    const sentGifts = await database.sentGifts.find({ liveId: liveId });

    const viewers = (live.current_viewers || []).map((viewerId: number) => {
        const user = allUsers.find(u => u.id === viewerId);
        if (!user) return null;

        // @ts-ignore
        const contribution = sentGifts.filter(g => g.senderId === viewerId).reduce((sum, g) => sum + g.diamondCost, 0);

        return {
            id: user.id,
            name: user.nickname || user.name,
            avatarUrl: user.avatar_url,
            entryTime: new Date().toISOString(),
            contribution,
            level: user.level,
            level2: user.level2 || 1,
        }
    }).filter(Boolean);

    // @ts-ignore
    return viewers.sort((a, b) => b.contribution - a.contribution);
  }

  if (method === 'POST' && liveJoinMatch) {
    const liveId = parseInt(liveJoinMatch[1], 10);
    const { userId } = body;
    const live = await database.liveStreams.findOne({ id: liveId });
    if (live) {
        if (!(live.current_viewers || []).includes(userId)) {
            await database.liveStreams.updateOne({ id: liveId }, { $push: { current_viewers: userId } });
        }
    }
    return { success: true };
  }
  
  if (method === 'POST' && liveLeaveMatch) {
      const liveId = parseInt(liveLeaveMatch[1], 10);
      const { userId } = body;
      await database.liveStreams.updateOne({ id: liveId }, { $pull: { current_viewers: userId } });
      return { success: true };
  }
  
  if (method === 'POST' && liveMicToggleMatch) {
    const liveId = parseInt(liveMicToggleMatch[1], 10);
    const { enabled } = body;
    await database.liveStreams.updateOne({ id: liveId }, { $set: { voice_enabled: enabled } });
    return { success: true };
  }
  
  if (method === 'GET' && userLiveStatusMatch) {
      const userId = parseInt(userLiveStatusMatch[1], 10);
      const liveStream = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
      return !!liveStream;
  }
  
  if (method === 'GET' && userLevelMatch) {
      const userId = parseInt(userLevelMatch[1], 10);
      const user = await database.users.findOne({ id: userId });
      if (!user) {
          throw new Error('Usuário não encontrado');
      }
      return {
          currentLevel: user.level,
          currentXp: user.xp,
          xpForNextLevel: levelService.getXpForLevel(user.level + 1)
      };
  }

  if (method === 'GET' && userLivePreferencesMatch) {
    const userId = parseInt(userLivePreferencesMatch[1], 10);
    const user = await database.users.findOne({ id: userId });
    if (!user) {
        throw new Error(`Usuário com ID ${userId} não encontrado.`);
    }
    return {
        isPkEnabled: user.pk_enabled_preference ?? true,
        lastCameraUsed: user.last_camera_used || 'user',
        lastSelectedCategory: user.last_selected_category || 'Popular',
        lastLiveTitle: user.lastLiveTitle || '',
        lastLiveMeta: user.lastLiveMeta || '',
    };
  }
  
  if (method === 'GET' && diamondPackagesMatch) {
      const packages = await database.diamondPackages.find();
      return packages;
  }
  
  if (method === 'GET' && privateChatMatch) {
      const conversationId = privateChatMatch[1];
      const userId = parseInt(query.get('userId')!, 10);
      const convoRecord = await database.conversations.findOne({ id: conversationId });
      if (!convoRecord) {
          throw new Error(`Conversa com ID ${conversationId} não encontrada.`);
      }
      const allUsers = await database.users.find();
      return buildConversationViewModel(convoRecord, userId, allUsers);
  }

  if (method === 'POST' && privateChatMatch) {
        const conversationId = privateChatMatch[1];
        const { senderId, text, imageUrl } = body;
        const convo = await database.conversations.findOne({ id: conversationId });
        if (!convo) {
            throw new Error(`Conversa com ID ${conversationId} não encontrada.`);
        }
        
        const newMessage = {
            id: `msg-${conversationId}-${Date.now()}`,
            senderId,
            type: imageUrl ? 'image' : 'text',
            text: text || null,
            imageUrl: imageUrl || null,
            timestamp: new Date().toISOString(),
            seenBy: [senderId],
        };
        
        await database.conversations.updateOne(
            { id: conversationId },
            { 
                $push: { messages: newMessage },
                $set: { 
                    ultima_mensagem_texto: text || 'Imagem',
                    ultima_mensagem_timestamp: newMessage.timestamp 
                }
            }
        );
        
        const allUsers = await database.users.find();
        const updatedConvo = await database.conversations.findOne({ id: conversationId });
        return buildConversationViewModel(updatedConvo, senderId, allUsers);
  }

  if (method === 'GET' && userDetailsMatch) {
      const userId = parseInt(userDetailsMatch[1], 10);
      const user = await getDynamicUser(userId);
      if (!user) throw new Error('Usuário não encontrado');
      return user;
  }

  if (method === 'GET' && userProfileMatch) {
        const userId = parseInt(userProfileMatch[1], 10);
        const viewerId = query.get('viewerId') ? parseInt(query.get('viewerId')!, 10) : null;

        const [userToView, viewer, liveStream] = await Promise.all([
            getDynamicUser(userId),
            viewerId ? database.users.findOne({ id: viewerId }) : null,
            database.liveStreams.findOne({ user_id: userId, ao_vivo: true }),
        ]);

        if (!userToView) {
            throw new Error(`Usuário ${userId} não encontrado.`);
        }
        
        const sentGifts = await database.sentGifts.find({ senderId: userId });
        // @ts-ignore
        const sentValue = sentGifts.reduce((acc, gift) => acc + gift.diamondCost, 0);

        // Simulated badge logic
        const badges: types.ProfileBadgeType[] = [];
        if (userToView.gender) {
            badges.push({ text: String(userToView.age), type: 'gender_age', icon: userToView.gender });
        }
        badges.push({ text: String(userToView.level), type: 'level' });
        
        const protectors = await database.sentGifts.find({ receiverId: userId });
        const protectorContributions: { [key: number]: number } = {};
        // @ts-ignore
        protectors.forEach(gift => {
            // @ts-ignore
            protectorContributions[gift.senderId] = (protectorContributions[gift.senderId] || 0) + gift.giftValue;
        });
        const topProtectorIds = Object.entries(protectorContributions).sort((a, b) => b[1] - a[1]).slice(0, 3).map(entry => parseInt(entry[0]));
        const allUsers = await database.users.find();
        const protectorDetails = topProtectorIds.map((protectorId, index): types.ProtectorDetails => {
            const protectorUser = allUsers.find(u => u.id === protectorId);
            return {
                rank: index + 1,
                userId: protectorId,
                name: protectorUser?.nickname || 'Usuário',
                avatarUrl: protectorUser?.avatar_url || '',
                protectionValue: protectorContributions[protectorId]
            }
        });

        return {
            id: userToView.id,
            name: userToView.name,
            nickname: userToView.nickname,
            avatarUrl: userToView.avatar_url,
            age: userToView.age,
            gender: userToView.gender,
            isLive: !!liveStream,
            isFollowing: viewer && (viewer.following || []).includes(userId),
            followers: userToView.followers || 0,
            followingCount: (userToView.following || []).length,
            coverPhotoUrl: 'https://picsum.photos/seed/' + userId + '/800/400',
            stats: { value: sentValue, icon: 'moon' },
            badges,
            protectors: protectorDetails,
            achievements: [],
            personalityTags: userToView.personalityTags || [],
            personalSignature: userToView.personalSignature || 'Este usuário é muito preguiçoso para deixar uma assinatura.',
            is_avatar_protected: userToView.is_avatar_protected,
            privacy: { protectionEnabled: userToView.settings?.privacy?.protectionEnabled }
        };
    }

    if (method === 'GET' && userNotificationSettingsMatch) {
        const userId = parseInt(userNotificationSettingsMatch[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error('Usuário não encontrado');
        return user.settings?.notifications || {
            newMessages: true,
            streamerLive: true,
            followedPost: true,
            order: true,
            interactive: true,
        };
    }

    if (method === 'GET' && userGiftNotificationSettingsMatch) {
        const userId = parseInt(userGiftNotificationSettingsMatch[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error('Usuário não encontrado');
        const settings = user.settings?.giftNotifications || { enabledGifts: {} };
        return settings;
    }

    if (method === 'GET' && userFollowingLiveStatusMatch) {
        const userId = parseInt(userFollowingLiveStatusMatch[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) return [];

        const followingIds = user.following || [];
        if (followingIds.length === 0) return [];

        const allLiveStreams = await database.liveStreams.find({ ao_vivo: true });
        
        const liveStreamsByUserId = allLiveStreams.reduce((acc, stream) => {
            // @ts-ignore
            acc[stream.user_id] = stream;
            return acc;
        }, {} as Record<number, types.LiveStreamRecord>);

        const statuses = followingIds.map(followedId => {
            const liveStreamRecord = liveStreamsByUserId[followedId];
            return {
                userId: followedId,
                isLive: !!liveStreamRecord,
                stream: liveStreamRecord ? mapLiveRecordToStream(liveStreamRecord) : null,
            };
        });
        return statuses;
    }

    if (method === 'GET' && userPendingInvitesMatch) {
        const userId = parseInt(userPendingInvitesMatch[1], 10);
        // @ts-ignore
        const invite = await database.privateLiveInvites.findOne({ inviteeId: userId, status: 'pending' });
        if (!invite) {
            return { invite: null };
        }

        const [inviter, invitee, streamRecord] = await Promise.all([
            // @ts-ignore
            database.users.findOne({ id: invite.inviterId }),
            // @ts-ignore
            database.users.findOne({ id: invite.inviteeId }),
            // @ts-ignore
            database.liveStreams.findOne({ id: invite.liveId }),
        ]);

        if (!inviter || !invitee || !streamRecord) {
            // @ts-ignore
            await database.privateLiveInvites.deleteOne({ _id: invite._id });
            return { invite: null };
        }

        // After fetching, remove it to prevent re-notification
        // @ts-ignore
        await database.privateLiveInvites.deleteOne({ _id: invite._id });

        return {
            invite: {
                stream: mapLiveRecordToStream(streamRecord),
                inviter,
                invitee,
            }
        };
    }

    if (method === 'POST' && liveInviteMatch) {
        const liveId = parseInt(liveInviteMatch[1], 10);
        const { inviteeId } = body;
        const live = await database.liveStreams.findOne({ id: liveId });
        if (!live) throw new Error('Live não encontrada');

        await database.privateLiveInvites.insertOne({
            liveId,
            inviterId: live.user_id,
            inviteeId,
            status: 'pending'
        } as any);
        return { success: true };
    }

    if (method === 'POST' && liveCancelInviteMatch) {
        const liveId = parseInt(liveCancelInviteMatch[1], 10);
        const { inviteeId } = body;
        const live = await database.liveStreams.findOne({ id: liveId });
        if (!live) throw new Error('Live não encontrada');

        await database.privateLiveInvites.deleteOne({
            liveId,
            inviterId: live.user_id,
            inviteeId,
            status: 'pending'
        });
        return { success: true };
    }
  
  if (method === 'GET' && pendingPkInviteMatch) {
    const userId = parseInt(pendingPkInviteMatch[1], 10);
    // Find the first pending invitation for this user
    // @ts-ignore
    const invite = await database.pkInvitations.findOne({ destinatario_id: userId, status: 'pendente' });
    return invite || null;
  }

  if (method === 'GET' && pkInviteStatusMatch) {
    const inviteId = pkInviteStatusMatch[1];
    const invite = await database.pkInvitations.findOne({ id: inviteId });
    if (!invite) {
        throw new Error(`Convite com ID ${inviteId} não encontrado.`);
    }
    let battle = null;
    if (invite.batalha_id) {
        // @ts-ignore
        const pkBattleRecord = await database.pkBattles.findOne({ id: invite.batalha_id });
        if (pkBattleRecord) {
            const [streamerA, streamerB] = await Promise.all([
                getDynamicUser(pkBattleRecord.streamer_A_id),
                getDynamicUser(pkBattleRecord.streamer_B_id)
            ]);
            const streamA = await database.liveStreams.findOne({ user_id: pkBattleRecord.streamer_A_id, ao_vivo: true });
            const streamB = await database.liveStreams.findOne({ user_id: pkBattleRecord.streamer_B_id, ao_vivo: true });
            
            if (streamerA && streamerB && streamA && streamB) {
                battle = {
                    id: pkBattleRecord.id as number,
                    title: `Batalha: ${streamerA.nickname} vs ${streamerB.nickname}`,
                    streamer1: {
                        userId: streamerA.id,
                        streamId: streamA.id,
                        name: streamerA.nickname || streamerA.name,
                        score: pkBattleRecord.pontuacao_A,
                        avatarUrl: streamerA.avatar_url || '',
                        isVerified: true,
                    },
                    streamer2: {
                         userId: streamerB.id,
                        streamId: streamB.id,
                        name: streamerB.nickname || streamerB.name,
                        score: pkBattleRecord.pontuacao_B,
                        avatarUrl: streamerB.avatar_url || '',
                        isVerified: false,
                    }
                };
            }
        }
    }
    return { invitation: invite, battle };
  }
  
  if (method === 'POST' && pkInviteAcceptMatch) {
    const inviteId = pkInviteAcceptMatch[1];
    // @ts-ignore
    const invite = await database.pkInvitations.findOne({ id: inviteId, status: 'pendente' });
    if (!invite) {
        throw new Error("Convite inválido ou já respondido.");
    }

    const inviterId = invite.remetente_id;
    const inviteeId = invite.destinatario_id;

    const [inviter, invitee, inviterStream, inviteeStream] = await Promise.all([
        getDynamicUser(inviterId),
        getDynamicUser(inviteeId),
        database.liveStreams.findOne({ user_id: inviterId, ao_vivo: true }),
        database.liveStreams.findOne({ user_id: inviteeId, ao_vivo: true })
    ]);

    if (!inviter || !invitee || !inviterStream || !inviteeStream) {
        throw new Error("Um ou ambos os usuários não estão ao vivo ou não foram encontrados.");
    }

    const pkSettings = await database.pkSettings.findOne({ userId: inviterId });
    const durationSeconds = pkSettings?.durationSeconds || 300;

    const newPkBattle = {
        _id: mongoObjectId(),
        id: Math.floor(Math.random() * 1000) + 200,
        streamer_A_id: inviterId,
        streamer_B_id: inviteeId,
        pontuacao_A: 0,
        pontuacao_B: 0,
        status: 'ativa',
        data_inicio: new Date().toISOString(),
        data_fim: new Date(Date.now() + durationSeconds * 1000).toISOString(),
        duracao_segundos: durationSeconds,
    };
    // @ts-ignore
    await database.pkBattles.insertOne(newPkBattle);
    
    await database.liveStreams.updateOne({ id: inviterStream.id }, { $set: { em_pk: true } });
    await database.liveStreams.updateOne({ id: inviteeStream.id }, { $set: { em_pk: true } });
    
    // @ts-ignore
    await database.pkInvitations.updateOne({ id: inviteId }, { $set: { status: 'aceito', batalha_id: newPkBattle.id } });

    const battleViewModel = {
        id: newPkBattle.id,
        title: `Batalha: ${inviter.nickname} vs ${invitee.nickname}`,
        streamer1: { userId: inviter.id, streamId: inviterStream.id, name: inviter.nickname || inviter.name, score: 0, avatarUrl: inviter.avatar_url || '', isVerified: true },
        streamer2: { userId: invitee.id, streamId: inviteeStream.id, name: invitee.nickname || invitee.name, score: 0, avatarUrl: invitee.avatar_url || '', isVerified: false },
    };
    
    return { battle: battleViewModel };
  }
  
  if (method === 'POST' && pkInviteDeclineMatch) {
      const inviteId = pkInviteDeclineMatch[1];
      // @ts-ignore
      await database.pkInvitations.updateOne({ id: inviteId }, { $set: { status: 'recusado' } });
      return { success: true };
  }
  
  if (method === 'POST' && pkInviteCancelMatch) {
      const inviteId = pkInviteCancelMatch[1];
      // @ts-ignore
      await database.pkInvitations.updateOne({ id: inviteId }, { $set: { status: 'cancelado' } });
      return { success: true };
  }

  if (method === 'POST' && cohostInviteMatch) {
    const { inviterId, inviteeId } = body;
    const [inviter, invitee, inviterStream, inviteeStream] = await Promise.all([
        getDynamicUser(inviterId),
        getDynamicUser(inviteeId),
        database.liveStreams.findOne({ user_id: inviterId, ao_vivo: true }),
        database.liveStreams.findOne({ user_id: inviteeId, ao_vivo: true })
    ]);

    if (!inviter || !invitee || !inviterStream || !inviteeStream) {
        throw new Error("Um ou ambos os usuários não estão ao vivo ou não foram encontrados.");
    }

    const pkSettings = await database.pkSettings.findOne({ userId: inviterId });
    const durationSeconds = pkSettings?.durationSeconds || 300;

    const newPkBattle = {
        _id: mongoObjectId(),
        id: Math.floor(Math.random() * 1000) + 200,
        streamer_A_id: inviterId,
        streamer_B_id: inviteeId,
        pontuacao_A: 0,
        pontuacao_B: 0,
        status: 'ativa',
        data_inicio: new Date().toISOString(),
        data_fim: new Date(Date.now() + durationSeconds * 1000).toISOString(),
        duracao_segundos: durationSeconds,
    };
    // @ts-ignore
    await database.pkBattles.insertOne(newPkBattle);
    
    await database.liveStreams.updateOne({ id: inviterStream.id }, { $set: { em_pk: true } });
    await database.liveStreams.updateOne({ id: inviteeStream.id }, { $set: { em_pk: true } });
    
    // Unlike accept, this doesn't need to update an invitation.

    const battleViewModel = {
        id: newPkBattle.id,
        title: `Batalha: ${inviter.nickname} vs ${invitee.nickname}`,
        streamer1: { userId: inviter.id, streamId: inviterStream.id, name: inviter.nickname || inviter.name, score: 0, avatarUrl: inviter.avatar_url || '', isVerified: true },
        streamer2: { userId: invitee.id, streamId: inviteeStream.id, name: invitee.nickname || invitee.name, score: 0, avatarUrl: invitee.avatar_url || '', isVerified: false },
    };
    
    return battleViewModel;
  }


  if (method === 'POST' && liveStartMatch) {
    const { userId, title, meta, category, isPrivate, isPkEnabled, thumbnailUrl, entryFee, cameraUsed } = body;
    const user = await database.users.findOne({ id: userId });
    if (!user) {
        throw new Error(`Usuário com ID ${userId} não encontrado.`);
    }

    // Stop any existing live stream for this user
    await database.liveStreams.updateOne({ user_id: userId, ao_vivo: true }, { $set: { ao_vivo: false } });

    const newLiveId = Math.floor(Math.random() * 100000) + 200;
    const newLiveStream: types.LiveStreamRecord = {
        id: newLiveId,
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
        invited_users: isPrivate ? [] : undefined,
        received_gifts_value: 0,
        latitude: user.latitude,
        longitude: user.longitude,
        camera_facing_mode: cameraUsed,
        voice_enabled: true,
        like_count: 0,
        country_code: user.country || 'BR',
        chatMessages: [],
        current_viewers: []
    };
    
    // @ts-ignore
    await database.liveStreams.insertOne(newLiveStream);

    // Update user's preferences
    await database.users.updateOne(
        { id: userId }, 
        { $set: { last_camera_used: cameraUsed, last_selected_category: category, lastLiveTitle: title, lastLiveMeta: meta } }
    );

    const streamViewModel = mapLiveRecordToStream(newLiveStream);

    return {
        live: streamViewModel,
        urls: {
            rtmp: `${SRS_URL_PUBLISH}/${newLiveId}`,
            hls: `${SRS_URL_PLAY_HLS}/${newLiveId}.m3u8`,
            webrtc: `${SRS_URL_PLAY_WEBRTC}/${newLiveId}`,
            streamKey: `sk_${newLiveId}_${Math.random().toString(36).substring(7)}`,
        },
    };
  }
    
  if (method === 'POST' && liveGiftMatch) {
        const liveId = parseInt(liveGiftMatch[1], 10);
        const { senderId, giftId, quantity, receiverId } = body;

        const [sender, gift, live] = await Promise.all([
            database.users.findOne({ id: senderId }),
            database.gifts.findOne({ id: giftId }),
            database.liveStreams.findOne({ id: liveId })
        ]);

        if (!sender) throw new Error('Remetente não encontrado.');
        if (!gift) throw new Error('Presente não encontrado.');
        if (!live) throw new Error('Live não encontrada.');

        const totalCost = gift.price * quantity;
        if (sender.wallet_diamonds < totalCost) {
            return { success: false, updatedUser: null, message: 'Diamantes insuficientes.' };
        }

        // Update sender's wallet and XP
        sender.wallet_diamonds -= totalCost;
        sender.xp += totalCost; // Sender gets XP based on diamond cost
        sender.level = levelService.calculateLevelFromXp(sender.xp);

        const targetReceiverId = receiverId || live.user_id;
        
        // Update receiver's wallet and XP
        const receiver = await database.users.findOne({ id: targetReceiverId });
        if (receiver) {
            receiver.wallet_earnings += gift.valor_pontos * quantity;
            receiver.xp += gift.valor_pontos * quantity; // Receiver gets XP based on earnings value
            receiver.level = levelService.calculateLevelFromXp(receiver.xp);
            await database.users.updateOne({ id: receiver.id }, { $set: { wallet_earnings: receiver.wallet_earnings, xp: receiver.xp, level: receiver.level } });
        }

        // Update sender in DB
        await database.users.updateOne({ id: senderId }, { $set: { wallet_diamonds: sender.wallet_diamonds, xp: sender.xp, level: sender.level } });
        
        const giftMessage: types.ChatMessage = {
            id: Date.now(),
            type: 'gift',
            userId: sender.id,
            username: sender.nickname || sender.name,
            message: `enviou ${gift.name}!`,
            giftId: gift.id,
            giftName: gift.name,
            giftValue: gift.valor_pontos,
            giftAnimationUrl: gift.animationUrl,
            giftImageUrl: gift.imageUrl,
            recipientName: receiver?.nickname || 'o anfitrião',
            quantity: quantity,
            timestamp: new Date().toISOString(),
            globalLevel: sender.level,
            avatarUrl: sender.avatar_url,
        };
        
        // Update live stream chat
        await database.liveStreams.updateOne({ id: liveId }, { $push: { chatMessages: giftMessage as any } });

        // Handle PK score
        if (live.em_pk) {
            // @ts-ignore
            const pkBattle = await database.pkBattles.findOne({ $or: [{ streamer_A_id: live.user_id }, { streamer_B_id: live.user_id }], status: 'ativa' });
            if (pkBattle) {
                const scoreUpdate = gift.valor_pontos * quantity;
                if (targetReceiverId === pkBattle.streamer_A_id) {
                    await database.pkBattles.updateOne({ id: pkBattle.id }, { $set: { pontuacao_A: pkBattle.pontuacao_A + scoreUpdate } });
                } else if (targetReceiverId === pkBattle.streamer_B_id) {
                    await database.pkBattles.updateOne({ id: pkBattle.id }, { $set: { pontuacao_B: pkBattle.pontuacao_B + scoreUpdate } });
                }
            }
        }

        // Log the gift
        await database.sentGifts.insertOne({
            senderId: sender.id,
            receiverId: targetReceiverId,
            liveId: live.id,
            giftId: gift.id,
            giftValue: gift.valor_pontos * quantity,
            diamondCost: totalCost,
            quantity: quantity,
            timestamp: new Date().toISOString(),
        } as any);

        const updatedSender = await getDynamicUser(senderId);

        return { success: true, updatedUser: updatedSender, message: 'Presente enviado com sucesso!' };
    }

  if (method === 'GET' && hourlyRankingMatch) {
    const allUsers = await database.users.find();
    const sentGifts = await database.sentGifts.find();
    const userScores: { [key: number]: number } = {};
    // @ts-ignore
    sentGifts.forEach(gift => { userScores[gift.senderId] = (userScores[gift.senderId] || 0) + gift.diamondCost; });
    const rankedUsers = allUsers.map(u => ({ ...u, score: userScores[u.id] || 0 })).filter(u => u.score > 0).sort((a, b) => b.score - a.score).slice(0, 20).map((u, index): types.UniversalRankingUser => ({ rank: index + 1, userId: u.id, avatarUrl: u.avatar_url || '', name: u.nickname || u.name, score: u.score, level: u.level, gender: u.gender || null, badges: [{ type: 'flag', value: '🇧🇷' }] }));
    return { podium: rankedUsers.slice(0, 3), list: rankedUsers.slice(3), currentUserRanking: rankedUsers.find(u => u.userId === 10755083), countdown: new Date(Date.now() + 30 * 60000).toISOString(), footerButtons: { primary: { text: "Ajudar a conseguir o primeiro lugar", value: "1060" }, secondary: { text: "Ajudar a entrar na lista", value: "203" } } };
  }

  if (method === 'GET' && userListRankingMatch) {
      const period = query.get('period') as types.UserListRankingPeriod;
      const allUsers = await database.users.find();
      const sentGifts = await database.sentGifts.find();
      const userScores: { [key: number]: number } = {};
      // @ts-ignore
      sentGifts.forEach(gift => { userScores[gift.senderId] = (userScores[gift.senderId] || 0) + gift.diamondCost; });
      const rankedUsers = allUsers.map(u => ({ ...u, score: (userScores[u.id] || 0) * (period === 'weekly' ? 7 : period === 'total' ? 30 : 1) })).filter(u => u.score > 0).sort((a, b) => b.score - a.score).slice(0, 50).map((u, index): types.UniversalRankingUser => ({ rank: index + 1, userId: u.id, avatarUrl: u.avatar_url || '', name: u.nickname || u.name, score: u.score, level: u.level, gender: u.gender || null, badges: [{ type: 'flag', value: '🇧🇷' }] }));
      return { podium: rankedUsers.slice(0, 3), list: rankedUsers.slice(3) };
  }

  if (method === 'GET' && userWithdrawalBalanceMatch) {
      const userId = parseInt(userWithdrawalBalanceMatch[1], 10);
      const user = await database.users.findOne({ id: userId });
      if (!user) throw new Error('Usuário não encontrado');
      const pendingTransactions = await database.withdrawalTransactions.find({ userId, status: 'pending' });
      // @ts-ignore
      const pendingWithdrawals = pendingTransactions.reduce((sum, tx) => sum + tx.earnings_withdrawn, 0);
      const totalEarnings = user.wallet_earnings + pendingWithdrawals;
      const availableBalance = user.wallet_earnings;
      return { totalEarnings, pendingWithdrawals, availableBalance };
  }

  if (method === 'GET' && userPurchaseHistoryMatch) {
      const userId = parseInt(userPurchaseHistoryMatch[1], 10);
      const orders = await database.purchaseOrders.find({ userId });
      // @ts-ignore
      return orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  if (method === 'GET' && userConversationsMatch) {
    const userId = parseInt(userConversationsMatch[1], 10);
    const allUsers = await database.users.find();
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        throw new Error(`Usuário ${userId} não encontrado.`);
    }

    const allConvos = await database.conversations.find();
    // @ts-ignore
    const userConvos = allConvos.filter(c => c.participants.includes(userId));
    
    // @ts-ignore
    const convosViewModels = userConvos.map(c => buildConversationViewModel(c, userId, allUsers));
    
    const friendRequests = allUsers.filter(u => 
        (u.following || []).includes(userId) && // They follow the current user
        !(user.following || []).includes(u.id) // Current user does not follow them back
    );

    let friendRequestSummary: types.Conversation | null = null;
    if (friendRequests.length > 0) {
        friendRequestSummary = {
            id: 'friend-requests-summary',
            type: 'friend_requests_summary',
            participants: [userId],
            otherUserId: -1, // No specific user
            otherUserName: 'Pedidos de Amizade',
            otherUserAvatarUrl: '', // No avatar needed for this summary row
            unreadCount: friendRequests.length,
            messages: [{
                id: 'summary-msg',
                senderId: -1,
                type: 'system',
                text: `${friendRequests.length} novo(s) pedido(s) de amizade`,
                imageUrl: null,
                timestamp: new Date().toISOString(),
                status: 'sent',
                seenBy: [],
            }],
        };
    }
    
    // @ts-ignore
    const sortedConvos = convosViewModels.sort((a, b) => new Date(b.messages[b.messages.length - 1]?.timestamp || 0).getTime() - new Date(a.messages[a.messages.length - 1]?.timestamp || 0).getTime());
    
    return friendRequestSummary ? [friendRequestSummary, ...sortedConvos] : sortedConvos;
  }
  
  if (method === 'GET' && userActiveStreamMatch) {
    const userId = parseInt(userActiveStreamMatch[1], 10);
    const liveStream = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
    return liveStream ? mapLiveRecordToStream(liveStream) : null;
  }
  
  if (method === 'GET' && userFriendsMatch) {
    const userId = parseInt(userFriendsMatch[1], 10);
    const allUsers = await getAllUsersWithDynamicFollowers();
    const currentUser = allUsers.find(u => u.id === userId);
    if (!currentUser) return [];

    const friends = allUsers.filter(u => {
        const isMutual = (currentUser.following || []).includes(u.id) && (u.following || []).includes(currentUser.id);
        return u.id !== userId && isMutual;
    });
    return friends;
  }

  if (method === 'GET' && userCoHostFriendsMatch) {
    const userId = parseInt(userCoHostFriendsMatch[1], 10);
    const allUsers = await getAllUsersWithDynamicFollowers();
    const currentUser = allUsers.find(u => u.id === userId);
    if (!currentUser) throw new Error('Usuário não encontrado');

    const liveStreams = await database.liveStreams.find({ ao_vivo: true });
    const liveStreamerIds = new Set(liveStreams.map(s => s.user_id));

    const friends = allUsers.filter(u => {
        const isMutual = (currentUser.following || []).includes(u.id) && (u.following || []).includes(currentUser.id);
        return u.id !== userId && isMutual;
    });

    const coHostFriends = friends.filter(friend => liveStreamerIds.has(friend.id));
    
    // The UI also seems to have a `coHostHistory` field. Let's add that dynamically for the mock.
    return coHostFriends.map((friend, index) => ({
      ...friend,
      coHostHistory: index % 2 === 0 ? 'Co-host com Você' : `Última vez há ${index + 1} dias`
    }));
  }
  
  if (method === 'POST' && paymentDetectBrandMatch) {
    const { cardNumber } = body;
    if (!cardNumber || typeof cardNumber !== 'string') {
        throw new Error("Parâmetro 'cardNumber' ausente ou inválido.");
    }
    const cleanedCardNumber = cardNumber.replace(/\D/g, '');
    let brand: types.CardBrand = null;

    if (/^4/.test(cleanedCardNumber)) {
        brand = 'visa';
    } else if (/^5[1-5]/.test(cleanedCardNumber)) {
        brand = 'mastercard';
    } else if (/^3[47]/.test(cleanedCardNumber)) {
        brand = 'amex';
    } else if (/^(50|62|63)/.test(cleanedCardNumber)) { // Simple check for Elo
        brand = 'elo';
    }

    return { brand };
  }


  // Fallback for any unhandled routes
  notFound();
};
