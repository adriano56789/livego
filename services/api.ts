// This file contains the complete mock API server, including the in-memory database,
// routing logic, and all endpoint handlers. It fully simulates the backend.

import type * as types from '../types';
import * as levelService from './levelService';
import { database, getRawDb } from './database';
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

// FIX: Create a helper function to avoid circular dependencies and code duplication.
const createPkBattle = async (inviterId: number, inviteeId: number): Promise<types.PkBattle> => {
    const [inviter, invitee, inviterStream, inviteeStream] = await Promise.all([
      getDynamicUser(inviterId),
      getDynamicUser(inviteeId),
      database.liveStreams.findOne({ user_id: inviterId, ao_vivo: true }),
      database.liveStreams.findOne({ user_id: inviteeId, ao_vivo: true })
    ]);

    if (!inviter || !invitee || !inviterStream || !inviteeStream) {
      throw new Error("Both users must be live to start a PK battle.");
    }
    
    await database.liveStreams.updateOne({ id: inviterStream.id }, { $set: { em_pk: true } });
    await database.liveStreams.updateOne({ id: inviteeStream.id }, { $set: { em_pk: true } });

    const newPkBattleData: Omit<types.TabelaBatalhaPK, 'id'> & { id: number } = {
      id: Math.floor(Math.random() * 100000),
      streamer_A_id: inviterId,
      streamer_B_id: inviteeId,
      pontuacao_A: 0,
      pontuacao_B: 0,
      status: 'ativa',
      data_inicio: new Date().toISOString(),
      data_fim: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      duracao_segundos: 300,
    };
    
    await database.pkBattles.insertOne(newPkBattleData as any);

    const battleViewModel: types.PkBattle = {
      id: newPkBattleData.id,
      title: `${inviter.nickname} VS ${invitee.nickname}`,
      streamer1: { userId: inviter.id, streamId: inviterStream.id, name: inviter.nickname || inviter.name, score: 0, avatarUrl: inviter.avatar_url || '', isVerified: true, countryCode: inviter.country },
      streamer2: { userId: invitee.id, streamId: inviteeStream.id, name: invitee.nickname || invitee.name, score: 0, avatarUrl: invitee.avatar_url || '', isVerified: false, countryCode: invitee.country },
    };

    return battleViewModel;
}

// Helper function to build a PublicProfile view model
const buildPublicProfileViewModel = async (userToView: types.User, viewerId?: number): Promise<types.PublicProfile> => {
    // Get all users to calculate following/followers
    const allUsers = await database.users.find();
    
    // Is the viewer following the user they are looking at?
    let isFollowing = false;
    if (viewerId) {
        const viewer = allUsers.find(u => u.id === viewerId);
        isFollowing = (viewer?.following || []).includes(userToView.id);
    }
    
    const isFriend = isFollowing && (userToView.following || []).includes(viewerId!);
    
    // Check live status
    const liveStream = await database.liveStreams.findOne({ user_id: userToView.id, ao_vivo: true });
    
    // Get protectors
    const gifts = await database.sentGifts.find({ receiverId: userToView.id });
    const supporterMap = new Map<number, number>();
    gifts.forEach(g => {
        supporterMap.set(g.senderId, (supporterMap.get(g.senderId) || 0) + g.giftValue);
    });
    const sortedSupporters = Array.from(supporterMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const protectorDetails: types.ProtectorDetails[] = await Promise.all(
        sortedSupporters.map(async ([userId, value], index) => {
            const protectorUser = allUsers.find(u => u.id === userId)!;
            return {
                rank: index + 1,
                userId: userId,
                name: protectorUser.nickname || protectorUser.name,
                avatarUrl: protectorUser.avatar_url || '',
                protectionValue: value,
            };
        })
    );
    
    const achievements: types.Achievement[] = [
        { id: '1', name: 'Superstar', imageUrl: `https://i.pravatar.cc/150?u=ach1-${userToView.id}`, frameType: 'golden-winged' },
        { id: '2', name: 'Generoso', imageUrl: `https://i.pravatar.cc/150?u=ach2-${userToView.id}`, frameType: 'silver-winged' },
    ];
    
    const followersCount = allUsers.filter(u => (u.following || []).includes(userToView.id)).length;
    const age = calculateAge(userToView.birthday);
    
    const badges: types.ProfileBadgeType[] = [];
    if (userToView.gender && age) {
        badges.push({ text: String(age), type: 'gender_age', icon: userToView.gender });
    }
    badges.push({ text: String(userToView.level), type: 'level' });

    // Calculate received and sent gifts
    const giftsReceived = await database.sentGifts.find({ receiverId: userToView.id });
    const recebidos = giftsReceived.reduce((sum, gift) => sum + gift.giftValue * gift.quantity, 0);

    const giftsSent = await database.sentGifts.find({ senderId: userToView.id });
    const enviados = giftsSent.reduce((sum, gift) => sum + gift.diamondCost * gift.quantity, 0);

    // Get visitor count (use the logic from getDynamicUser)
    const profileVisits = await database.profileVisits.find({ visitedId: userToView.id });
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // @ts-ignore
    const recentVisits = profileVisits.filter((v: any) => new Date(v.date) > sevenDaysAgo);
    // @ts-ignore
    const uniqueVisitorIds = new Set(recentVisits.map((v: any) => v.visitorId));
    
    return {
        id: userToView.id,
        name: userToView.name,
        nickname: userToView.nickname || userToView.name,
        avatarUrl: userToView.avatar_url || '',
        age: age,
        gender: userToView.gender,
        birthday: userToView.birthday,
        isLive: !!liveStream,
        isFollowing: isFollowing,
        isFriend: isFriend,
        followers: followersCount,
        followingCount: (userToView.following || []).length,
        recebidos,
        enviados,
        coverPhotoUrl: 'https://picsum.photos/seed/' + userToView.id + '/800/400',
        stats: {
            value: uniqueVisitorIds.size,
            icon: 'moon',
        },
        badges: badges,
        protectors: protectorDetails,
        achievements: achievements,
        personalityTags: userToView.personalityTags || [],
        personalSignature: userToView.personalSignature || 'Este usuário é muito preguiçoso para deixar uma assinatura.',
        is_avatar_protected: userToView.is_avatar_protected,
        privacy: userToView.settings?.privacy,
    };
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

  if (method === 'GET' && path === '/api/diamonds/packages') {
    const packages = await database.diamondPackages.find();
    return packages;
  }

  if (method === 'POST' && path === '/api/auth/google') {
    const accountId = body?.accountId;
    // If no ID is passed (e.g., from an old call), default to the main user.
    const userToLoginId = accountId !== undefined ? accountId : 10755083;
    const user = await getDynamicUser(userToLoginId); 
    if (!user) {
      throw new Error(`Usuário com ID ${userToLoginId} não encontrado.`);
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
    if (regionCode && regionCode.toLowerCase() !== 'global') {
        return lives.filter(l => (l as types.LiveStreamRecord).country_code === regionCode);
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
  const liveSummaryMatch = path.match(/^\/api\/lives\/(\d+)\/summary$/);
  const liveGiftMatch = path.match(/^\/api\/lives\/(\d+)\/gift$/);
  const liveLikeMatch = path.match(/^\/api\/lives\/(\d+)\/like$/);
  const liveJoinMatch = path.match(/^\/api\/lives\/(\d+)\/join$/);
  const liveLeaveMatch = path.match(/^\/api\/lives\/(\d+)\/leave$/);
  const liveMicToggleMatch = path.match(/^\/api\/lives\/(\d+)\/mic-toggle$/);
  const liveViewersMatch = path.match(/^\/api\/lives\/(\d+)\/viewers$/);
  const liveChatMatch = path.match(/^\/api\/chat\/live\/(\d+)$/);
  const privateChatMatch = path.match(/^\/api\/chat\/private\/(.+)$/);
  const livePkMatch = path.match(/^\/api\/lives\/pk$/);
  const liveStartMatch = path.match(/^\/api\/live\/start$/);
  const hourlyRankingMatch = path.match(/^\/api\/ranking\/hourly$/);
  const userListRankingMatch = path.match(/^\/api\/ranking\/user-list$/);
  const userLiveStatusMatch = path.match(/^\/api\/users\/(\d+)\/live-status$/);
  const userLevelMatch = path.match(/^\/api\/users\/(\d+)\/level$/);
  const userLivePreferencesMatch = path.match(/^\/api\/users\/(\d+)\/live-preferences$/);
  const userWithdrawalBalanceMatch = path.match(/^\/api\/users\/(\d+)\/withdrawal-balance$/);
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
  const userStopLiveMatch = path.match(/^\/api\/users\/(\d+)\/stop-live$/);
  const userFollowingLiveStatusMatch = path.match(/^\/api\/users\/(\d+)\/following-live-status$/);
  const userPrivateLiveInviteSettingsMatch = path.match(/^\/api\/users\/(\d+)\/private-live-invite-settings$/);
  const userGiftNotificationSettingsMatch = path.match(/^\/api\/users\/(\d+)\/gift-notification-settings$/);
  const userNotificationSettingsMatch = path.match(/^\/api\/users\/(\d+)\/notification-settings$/);
  const userPendingInvitesMatch = path.match(/^\/api\/users\/(\d+)\/pending-invites$/);
  const pkBattleDetailsMatch = path.match(/^\/api\/pk-battles\/(\d+)$/);
  const pkActiveBattleMatch = path.match(/^\/api\/batalhas-pk\/(\d+)$/);
  const streamPkBattleMatch = path.match(/^\/api\/streams\/(\d+)\/batalha-pk$/);
  const blocksMatch = path.match(/^\/api\/blocks$/);
  const blockStatusOrUnblockMatch = path.match(/^\/api\/blocks\/(\d+)\/(\d+)$/);
  const pkPendingInviteMatch = path.match(/^\/api\/pk\/invites\/pending\/(\d+)$/);
  const pkInviteStatusMatch = path.match(/^\/api\/pk\/invites\/status\/(.+)$/);
  const pkAcceptInviteMatch = path.match(/^\/api\/pk\/invites\/(.+)\/accept$/);
  const pkDeclineInviteMatch = path.match(/^\/api\/pk\/invites\/(.+)\/decline$/);
  const pkCancelInviteMatch = path.match(/^\/api\/pk\/invites\/(.+)\/cancel$/);
  const pkCohostInviteMatch = path.match(/^\/api\/pk\/cohost-invite$/);
  const followsMatch = path.match(/^\/api\/follows$/);
  const unfollowMatch = path.match(/^\/api\/follows\/(\d+)\/(\d+)$/);
  const streamerRankingMatch = path.match(/^\/api\/ranking\/streamers$/);
  const userRankingMatch = path.match(/^\/api\/ranking\/users$/);


  // --- ROUTE HANDLERS ---
  
   if (method === 'POST' && followsMatch) {
    const { followerId, followingId } = body;
    const user = await database.users.findOne({ id: followerId });
    if (user) {
        if (!user.following) user.following = [];
        if (!user.following.includes(followingId)) {
            user.following.push(followingId);
            await database.users.updateOne({ id: followerId }, { $set: { following: user.following }});
        }
        return getDynamicUser(followerId);
    }
    throw new Error('User not found');
  }

  if (method === 'DELETE' && unfollowMatch) {
    const followerId = parseInt(unfollowMatch[1], 10);
    const followingId = parseInt(unfollowMatch[2], 10);
    const user = await database.users.findOne({ id: followerId });
    if (user && user.following) {
        const index = user.following.indexOf(followingId);
        if (index > -1) {
            user.following.splice(index, 1);
            await database.users.updateOne({ id: followerId }, { $set: { following: user.following }});
        }
        return getDynamicUser(followerId);
    }
    throw new Error('User not found or not following');
  }

  if (userGiftNotificationSettingsMatch) {
    const userId = parseInt(userGiftNotificationSettingsMatch[1], 10);
    
    if (method === 'GET') {
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error("User not found");
        
        const settings = user.settings?.giftNotifications || { enabledGifts: {} };
        
        return {
            userId,
            enabledGifts: settings.enabledGifts
        };
    }
    
    if (method === 'PATCH') {
        const { giftId, isEnabled } = body;
        
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error("User not found");
    
        // The key for updateOne needs to use dot notation for nested objects
        // The database helper `setNestedValue` handles this.
        const updatePath = `settings.giftNotifications.enabledGifts.${giftId}`;
        await database.users.updateOne({ id: userId }, { $set: { [updatePath]: isEnabled } });
    
        const updatedUser = await database.users.findOne({ id: userId });
        
        return {
            userId,
            enabledGifts: updatedUser?.settings?.giftNotifications?.enabledGifts || {}
        };
    }
  }

  if (method === 'GET' && userWithdrawalBalanceMatch) {
    const userId = parseInt(userWithdrawalBalanceMatch[1], 10);
    const user = await database.users.findOne({ id: userId });
    if (!user) {
        throw new Error('User not found');
    }

    const transactions = await database.withdrawalTransactions.find({ userId });
    const pendingWithdrawals = transactions
        .filter(tx => tx.status === 'pending')
        .reduce((sum, tx) => sum + tx.earnings_withdrawn, 0);

    const totalEarnings = user.wallet_earnings;
    const availableBalance = totalEarnings - pendingWithdrawals;

    const balance: types.WithdrawalBalance = {
        totalEarnings,
        pendingWithdrawals,
        availableBalance,
    };
    return balance;
  }
  
  if (userPrivateLiveInviteSettingsMatch) {
    const userId = parseInt(userPrivateLiveInviteSettingsMatch[1], 10);
    const user = await database.users.findOne({ id: userId });
    if (!user) throw new Error("User not found");

    if (method === 'GET') {
        const settings = user.settings?.privateLiveInvite || {
            privateInvites: true,
            onlyFollowing: true,
            onlyFans: false,
            onlyFriends: false,
            acceptOnlyFriendPkInvites: false,
        };
        return {
            userId,
            ...settings
        };
    }

    if (method === 'PATCH') {
        const updates = body as Partial<Omit<types.PrivateLiveInviteSettings, 'userId'>>;
        for (const key in updates) {
            const updatePath = `settings.privateLiveInvite.${key}`;
            // @ts-ignore
            await database.users.updateOne({ id: userId }, { $set: { [updatePath]: updates[key] } });
        }
        
        const updatedUser = await database.users.findOne({ id: userId });
        const newSettings = updatedUser?.settings?.privateLiveInvite || {};
        return {
            userId,
            ...newSettings
        };
    }
  }
  
  if (method === 'POST' && liveMicToggleMatch) {
    const liveId = parseInt(liveMicToggleMatch[1], 10);
    const { enabled } = body;
    
    const live = await database.liveStreams.findOne({ id: liveId });
    if (!live || !live.ao_vivo) {
        throw new Error("Live stream not found or has ended.");
    }
    
    await database.liveStreams.updateOne({ id: liveId }, { $set: { voice_enabled: enabled } });
    return { success: true };
  }
  
  if (userNotificationSettingsMatch) {
    const userId = parseInt(userNotificationSettingsMatch[1], 10);
    const user = await database.users.findOne({ id: userId });
    if (!user) throw new Error("User not found");

    if (method === 'GET') {
        const settings = user.settings?.notifications || {
            newMessages: true,
            streamerLive: true,
            followedPost: true,
            order: true,
            interactive: true,
        };
        return {
            userId,
            ...settings
        };
    }

    if (method === 'PATCH') {
        const updates = body as Partial<Omit<types.NotificationSettings, 'userId'>>;
        for (const key in updates) {
            const updatePath = `settings.notifications.${key}`;
            // @ts-ignore
            await database.users.updateOne({ id: userId }, { $set: { [updatePath]: updates[key] } });
        }
        
        const updatedUser = await database.users.findOne({ id: userId });
        const newSettings = updatedUser?.settings?.notifications || {};
        return {
            userId,
            ...newSettings
        };
    }
  }

  if (method === 'GET' && userCoHostFriendsMatch) {
      const userId = parseInt(userCoHostFriendsMatch[1], 10);
      const user = await database.users.findOne({ id: userId });
      if (!user) throw new Error("User not found");
      
      const followingIds = user.following || [];
      const allUsers = await database.users.find();
      const liveStreams = await database.liveStreams.find({ ao_vivo: true });
      const liveStreamerIds = new Set(liveStreams.map((s: any) => s.user_id));

      const friends = allUsers.filter(u => 
          followingIds.includes(u.id) &&
          (u.following || []).includes(userId) &&
          liveStreamerIds.has(u.id)
      );

      // Add dynamic coHostHistory
      return friends.map((friend, index) => ({
          ...friend,
          coHostHistory: index % 2 === 0 ? 'Co-host com Você' : `Última vez há ${index + 1} dias`
      }));
  }
  
  if (method === 'GET' && userGiftsReceivedMatch) {
    const userId = parseInt(userGiftsReceivedMatch[1], 10);
    const gifts = await database.sentGifts.find({ receiverId: userId });
    const totalValue = gifts.reduce((sum, gift) => sum + (gift.giftValue * gift.quantity), 0);
    return { totalValue };
  }

  if (method === 'GET' && userGiftsSentMatch) {
    const userId = parseInt(userGiftsSentMatch[1], 10);
    const gifts = await database.sentGifts.find({ senderId: userId });
    const totalValue = gifts.reduce((sum, gift) => sum + (gift.diamondCost * gift.quantity), 0);
    return { totalValue };
  }
  
  if (method === 'GET' && pkPendingInviteMatch) {
    const userId = parseInt(pkPendingInviteMatch[1], 10);
    const now = new Date();
    const pendingInvite = await database.pkInvitations.findOne({
      destinatario_id: userId,
      status: 'pendente'
    });
    
    if (pendingInvite && new Date(pendingInvite.data_expiracao) > now) {
      return pendingInvite;
    }
    return null; // No pending invite or it expired
  }

  if (method === 'GET' && pkInviteStatusMatch) {
    const inviteId = pkInviteStatusMatch[1];
    const invitation = await database.pkInvitations.findOne({ id: inviteId });
    if (!invitation) throw new Error("Invitation not found");
    
    let battle = null;
    if (invitation.status === 'aceito' && invitation.batalha_id) {
       const pkBattle = await database.pkBattles.findOne({ id: invitation.batalha_id });
       if (pkBattle) {
           const [streamer1, streamer2] = await Promise.all([
               getDynamicUser(pkBattle.streamer_A_id),
               getDynamicUser(pkBattle.streamer_B_id)
           ]);
            if(streamer1 && streamer2) {
                battle = {
                    id: pkBattle.id,
                    title: `${streamer1.nickname} VS ${streamer2.nickname}`,
                    streamer1: { userId: streamer1.id, streamId: -1, name: streamer1.nickname || streamer1.name, score: 0, avatarUrl: streamer1.avatar_url || '', isVerified: true },
                    streamer2: { userId: streamer2.id, streamId: -1, name: streamer2.nickname || streamer2.name, score: 0, avatarUrl: streamer2.avatar_url || '', isVerified: false },
                };
            }
       }
    }
    return { invitation, battle };
  }
  
  if (method === 'POST' && pkAcceptInviteMatch) {
    const inviteId = pkAcceptInviteMatch[1];
    await database.pkInvitations.updateOne({ id: inviteId }, { $set: { status: 'aceito' } });
    const invitation = await database.pkInvitations.findOne({ id: inviteId });
    if(!invitation) throw new Error("Invitation not found after update");

    // FIX: Replace call to liveStreamService with local helper function.
    const battle = await createPkBattle(invitation.remetente_id, invitation.destinatario_id);
    await database.pkInvitations.updateOne({ id: inviteId }, { $set: { batalha_id: battle.id } });
    return { battle };
  }

  if (method === 'POST' && pkDeclineInviteMatch) {
    const inviteId = pkDeclineInviteMatch[1];
    await database.pkInvitations.updateOne({ id: inviteId }, { $set: { status: 'recusado' } });
    return { success: true };
  }

  if (method === 'POST' && pkCancelInviteMatch) {
    const inviteId = pkCancelInviteMatch[1];
    await database.pkInvitations.updateOne({ id: inviteId }, { $set: { status: 'cancelado' } });
    return { success: true };
  }

  if (method === 'POST' && pkCohostInviteMatch) {
    const { inviterId, inviteeId } = body;
    // FIX: Replace call to liveStreamService with local helper function.
    const battle = await createPkBattle(inviterId, inviteeId);
    return battle;
  }
  
  if (method === 'GET' && userDetailsMatch) {
    const userId = parseInt(userDetailsMatch[1], 10);
    const user = await getDynamicUser(userId);
    if (user) {
      return user;
    }
    throw new Error('User not found');
  }

  if (method === 'GET' && userProfileMatch) {
    const userId = parseInt(userProfileMatch[1], 10);
    const viewerId = query.get('viewerId') ? parseInt(query.get('viewerId')!, 10) : undefined;
    const user = await database.users.findOne({ id: userId });
    if (!user) {
        throw new Error('User not found');
    }
    return buildPublicProfileViewModel(user as unknown as types.User, viewerId);
  }

  if (method === 'GET' && userFollowersMatch) {
    const userId = parseInt(userFollowersMatch[1], 10);
    const allUsers = await database.users.find();
    const followers = allUsers.filter((u: any) => (u.following || []).includes(userId));
    return followers.map(u => ({...u, level: levelService.calculateLevelFromXp(u.xp)}));
  }

  if (method === 'GET' && userFollowingMatch) {
    const userId = parseInt(userFollowingMatch[1], 10);
    const user = await database.users.findOne({ id: userId });
    if (!user) throw new Error(`User with ID ${userId} not found`);
    const followingIds = user.following || [];
    if (followingIds.length === 0) return [];
    
    const allUsers = await database.users.find();
    const followingUsers = allUsers.filter(u => followingIds.includes(u.id));
    return followingUsers.map(u => ({...u, level: levelService.calculateLevelFromXp(u.xp)}));
  }

  if (method === 'GET' && userFansMatch) {
    const userId = parseInt(userFansMatch[1], 10);
    const allUsers = await database.users.find();
    const fans = allUsers.filter((u: any) => (u.following || []).includes(userId));
    return fans.map(u => ({...u, level: levelService.calculateLevelFromXp(u.xp)}));
  }

  if (method === 'GET' && userFriendsMatch) {
    const userId = parseInt(userFriendsMatch[1], 10);
    const user = await database.users.findOne({ id: userId });
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
    const followingIds = user.following || [];
    const allUsers = await database.users.find();
    
    const friends = allUsers.filter(otherUser => 
        followingIds.includes(otherUser.id) &&
        (otherUser.following || []).includes(userId)
    );
    
    return friends.map(u => ({...u, level: levelService.calculateLevelFromXp(u.xp)}));
  }

  if (method === 'GET' && userVisitorsMatch) {
    const userId = parseInt(userVisitorsMatch[1], 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentVisits = await database.profileVisits.find({ visitedId: userId });

    const recentUniqueVisits = recentVisits
        // @ts-ignore
        .filter((v: any) => new Date(v.date) > sevenDaysAgo)
        .reduce((acc: Record<number, any>, visit) => {
            if (!acc[visit.visitorId] || new Date(acc[visit.visitorId].date) < new Date(visit.date)) {
                acc[visit.visitorId] = visit;
            }
            return acc;
        }, {});
    
    const sortedVisits = Object.values(recentUniqueVisits).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const visitorIds = sortedVisits.map((v: any) => v.visitorId);

    if (visitorIds.length === 0) return [];
    
    const allUsers = await database.users.find();
    const visitors = allUsers
        .filter(u => visitorIds.includes(u.id))
        .map(u => {
            const visit = sortedVisits.find((v: any) => v.visitorId === u.id);
            return {
                ...u,
                last_visit_date: visit?.date.toISOString(),
                level: levelService.calculateLevelFromXp(u.xp)
            };
        })
        .sort((a, b) => new Date(b.last_visit_date!).getTime() - new Date(a.last_visit_date!).getTime());

    return visitors;
  }
  
  if (method === 'GET' && userPendingInvitesMatch) {
    const userId = parseInt(userPendingInvitesMatch[1], 10);
    
    const inviteRecord = await database.privateLiveInvites.findOne({ inviteeId: userId, status: 'pending' });

    if (!inviteRecord) {
        return { invite: null };
    }

    // In a real app, you might update status to 'delivered'. Here we remove it to prevent re-polling.
    await database.privateLiveInvites.deleteOne({ _id: inviteRecord._id });

    const [streamRecord, inviter, invitee] = await Promise.all([
        database.liveStreams.findOne({ id: inviteRecord.streamId }),
        getDynamicUser(inviteRecord.inviterId),
        getDynamicUser(inviteRecord.inviteeId),
    ]);
    
    if (!streamRecord || !inviter || !invitee) {
        console.error("Data integrity issue fetching private invite details.");
        return { invite: null };
    }

    const invite: types.IncomingPrivateLiveInvite = {
        stream: mapLiveRecordToStream(streamRecord),
        inviter: inviter,
        invitee: invitee,
    };
    
    return { invite };
  }
  
  if (method === 'GET' && liveSummaryMatch) {
    const liveId = parseInt(liveSummaryMatch[1], 10);
    const live = await database.liveStreams.findOne({ id: liveId });

    if (!live) {
        throw new Error(`Live stream with ID ${liveId} not found for summary`);
    }

    const streamer = await database.users.findOne({ id: live.user_id });
    if (!streamer) {
        throw new Error(`Streamer with ID ${live.user_id} not found`);
    }
    
    const durationSeconds = (new Date().getTime() - new Date(live.inicio).getTime()) / 1000;

    const summary: types.LiveEndSummary = {
        streamerId: streamer.id,
        streamerName: streamer.nickname || streamer.name,
        streamerAvatarUrl: streamer.avatar_url || '',
        durationSeconds: Math.round(durationSeconds),
        peakViewers: live.espectadores || 0,
        totalEarnings: live.received_gifts_value || 0,
        newFollowers: Math.floor(Math.random() * (live.espectadores / 10 + 1)),
        newMembers: Math.floor(Math.random() * (live.espectadores / 50 + 1)),
        newFans: Math.floor(Math.random() * (live.espectadores / 20 + 1)),
    };

    return summary;
  }

  if (method === 'GET' && userConversationsMatch) {
    const userId = parseInt(userConversationsMatch[1], 10);
    const currentUser = await database.users.findOne({ id: userId });
    if (!currentUser) throw new Error("User not found");

    const allUsers = await database.users.find();
    const allConvos = await database.conversations.find();
    
    const userConvosRecords = allConvos.filter(c => c.participants.includes(userId));
    const conversationViewModels = userConvosRecords.map(c => buildConversationViewModel(c, userId, allUsers));

    // Friend requests: users who follow the current user, but the current user does not follow back.
    const friendRequests = allUsers.filter(u => 
        (u.following || []).includes(userId) && 
        !(currentUser.following || []).includes(u.id)
    );

    if (friendRequests.length > 0) {
        const friendRequestSummary: types.Conversation = {
            id: 'friend-requests-summary',
            type: 'friend_requests_summary',
            participants: [userId],
            otherUserId: -1,
            otherUserName: "Pedidos de amizade",
            otherUserAvatarUrl: '', // Will be handled by UI
            unreadCount: friendRequests.length,
            messages: [{
                id: 'fr-msg',
                senderId: -1,
                type: 'system',
                text: `${friendRequests.length} novos pedidos de amizade`,
                imageUrl: null,
                timestamp: new Date().toISOString(),
                status: 'sent',
                seenBy: []
            }]
        };
        return [friendRequestSummary, ...conversationViewModels];
    }
    
    return conversationViewModels;
  }
  
  if (blockStatusOrUnblockMatch) {
    const loggedUserId = parseInt(blockStatusOrUnblockMatch[1], 10);
    const targetUserId = parseInt(blockStatusOrUnblockMatch[2], 10);
    
    if (method === 'GET') {
      const blockRecord = await database.blockedUsers.findOne({ blockerId: loggedUserId, blockedId: targetUserId });
      return { isBlocked: !!blockRecord };
    }
    
    if (method === 'DELETE') {
      const { deletedCount } = await database.blockedUsers.deleteOne({ blockerId: loggedUserId, blockedId: targetUserId });
      // In a real app, you might dispatch an event here for real-time updates
      return { success: deletedCount > 0 };
    }
  }

  if (method === 'GET' && liveListMatch) {
    const category = query.get('category')?.toLowerCase();
    const userId = query.get('userId') ? parseInt(query.get('userId')!, 10) : null;
    let allLive = await database.liveStreams.find({ ao_vivo: true });
    let results: types.LiveStreamRecord[] = [];

    switch (category) {
        case 'seguindo':
            if (!userId) throw new Error("userId is required for 'seguindo' category");
            const user = await database.users.findOne({ id: userId });
            const followingIds = user?.following || [];
            results = allLive.filter((l: any) => followingIds.includes(l.user_id));
            break;
        case 'novo':
        case 'atualizado': // Treat 'Atualizado' as 'Novo'
            results = allLive.sort((a: any, b: any) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
            break;
        case 'privada':
             if (!userId) throw new Error("userId is required for 'privada' category");
             results = allLive.filter((l: any) => l.is_private && (l.invited_users?.includes(userId) || l.user_id === userId));
             break;
        case 'música':
             results = allLive.filter((l: any) => l.categoria === 'Música');
             break;
        case 'dança':
             results = allLive.filter((l: any) => l.categoria === 'Dança');
             break;
        case 'pk':
            // This is handled by /api/lives/pk, but as a fallback filter here
            results = allLive.filter((l: any) => l.em_pk);
            break;
        case 'perto':
            // 'Perto' is handled by a separate endpoint, but as a fallback, return popular
        case 'popular':
        default:
            results = allLive.sort((a: any, b: any) => (b.current_viewers?.length || 0) - (a.current_viewers?.length || 0));
            break;
    }
    
    const filteredByRegion = filterByRegion(results, query.get('region'));
    return filteredByRegion.map(mapLiveRecordToStream);
  }

  if (method === 'GET' && userLiveStatusMatch) {
      const userId = parseInt(userLiveStatusMatch[1], 10);
      const liveStream = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
      return !!liveStream;
  }

  if (method === 'GET' && userFollowingLiveStatusMatch) {
    const userId = parseInt(userFollowingLiveStatusMatch[1], 10);
    const user = await database.users.findOne({ id: userId });
    const followingIds = user?.following || [];
    if (followingIds.length === 0) return [];
    
    const liveStreams = await database.liveStreams.find({ ao_vivo: true });
    const liveStreamerIds = new Set(liveStreams.map((s: any) => s.user_id));

    return followingIds.map(id => {
        const isLive = liveStreamerIds.has(id);
        const streamRecord = isLive ? liveStreams.find((s: any) => s.user_id === id) : null;
        return {
            userId: id,
            isLive: isLive,
            stream: streamRecord ? mapLiveRecordToStream(streamRecord) : null
        };
    });
  }

  if (method === 'GET' && streamerRankingMatch) {
    const allUsers = await database.users.find();
    const allGifts = await database.sentGifts.find();
    
    const streamerScores: Record<number, number> = {};
    allGifts.forEach(gift => {
        streamerScores[gift.receiverId] = (streamerScores[gift.receiverId] || 0) + gift.giftValue * gift.quantity;
    });

    const rankedStreamers = allUsers
        .map(user => ({
            userId: user.id,
            username: user.nickname || user.name,
            avatarUrl: user.avatar_url || '',
            level: user.level,
            score: streamerScores[user.id] || 0,
        }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((s, index) => ({ ...s, rank: index + 1 }));

    return rankedStreamers;
  }

  if (method === 'GET' && userRankingMatch) {
    const allUsers = await database.users.find();
    const allGifts = await database.sentGifts.find();
    
    const userScores: Record<number, number> = {};
    allGifts.forEach(gift => {
        userScores[gift.senderId] = (userScores[gift.senderId] || 0) + gift.diamondCost * gift.quantity;
    });

    const rankedUsers = allUsers
        .map(user => ({
            userId: user.id,
            username: user.nickname || user.name,
            avatarUrl: user.avatar_url || '',
            level: user.level,
            score: userScores[user.id] || 0,
        }))
        .filter(u => u.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((u, index) => ({ ...u, rank: index + 1 }));

    return rankedUsers;
  }
  
  if (privateChatMatch) {
    const conversationId = privateChatMatch[1];
    if (method === 'GET') {
      const currentUserId = parseInt(query.get('userId')!, 10);
      const convoRecord = await database.conversations.findOne({ id: conversationId });
      if (!convoRecord) throw new Error("Conversa não encontrada");
      const allUsers = await database.users.find();
      return buildConversationViewModel(convoRecord, currentUserId, allUsers);
    }
    if (method === 'POST') {
      const { senderId, text, imageUrl } = body;
      const convo = await database.conversations.findOne({ id: conversationId });
      if (!convo) throw new Error("Conversa não encontrada");
      const newMessage = {
        id: mongoObjectId(),
        senderId,
        text,
        imageUrl,
        timestamp: new Date().toISOString(),
        status: 'sent',
        seenBy: [senderId],
      };
      if (!convo.messages) convo.messages = [];
      convo.messages.push(newMessage as any);
      // FIX: The property name was 'last_message_text', but the type 'TabelaConversa' expects 'ultima_mensagem_texto'.
      (convo as any).ultima_mensagem_texto = text || 'Imagem';
      // FIX: The property name was 'last_message_timestamp', but the type 'TabelaConversa' expects 'ultima_mensagem_timestamp'.
      (convo as any).ultima_mensagem_timestamp = newMessage.timestamp;
      await database.conversations.updateOne({ id: conversationId }, { $set: convo });
      const allUsers = await database.users.find();
      return buildConversationViewModel(convo, senderId, allUsers);
    }
  }

  if (method === 'GET' && userLevelMatch) {
    const userId = parseInt(userLevelMatch[1], 10);
    const user = await database.users.findOne({ id: userId });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    const currentLevel = levelService.calculateLevelFromXp(user.xp);
    const xpForNextLevel = levelService.getXpForLevel(currentLevel + 1);
    return {
      currentLevel,
      currentXp: user.xp,
      xpForNextLevel,
    };
  }
  
  if (method === 'GET' && liveDetailsMatch) {
    const liveId = parseInt(liveDetailsMatch[1], 10);
    const live = await database.liveStreams.findOne({ id: liveId });
    if (!live || !live.ao_vivo) {
      throw new Error(`Live stream with ID ${liveId} not found or has ended`);
    }
    const streamer = await getDynamicUser(live.user_id);
    if (!streamer) {
      throw new Error(`Streamer with ID ${live.user_id} not found`);
    }
    const details: types.LiveDetails = {
      streamerName: streamer.nickname || streamer.name,
      streamerAvatarUrl: streamer.avatar_url || '',
      streamerFollowers: streamer.followers || 0,
      viewerCount: live.current_viewers?.length || 0,
      totalVisitors: (live.espectadores || 0) + (live.current_viewers?.length || 0),
      receivedGiftsValue: live.received_gifts_value || 0,
      rankingPosition: 'Top 5',
      status: 'ao vivo',
      likeCount: live.like_count || 0,
      streamerIsAvatarProtected: streamer.is_avatar_protected,
      title: live.titulo,
      meta: live.meta,
    };
    return details;
  }
  
  if (method === 'POST' && liveJoinMatch) {
    const liveId = parseInt(liveJoinMatch[1], 10);
    const { userId } = body;
    const live = await database.liveStreams.findOne({ id: liveId });
    if (live && live.ao_vivo) {
      if (!live.current_viewers) {
        live.current_viewers = [];
      }
      if (!live.current_viewers.includes(userId)) {
        live.current_viewers.push(userId);
        await database.liveStreams.updateOne({ id: liveId }, { $set: { current_viewers: live.current_viewers } });
      }
      return { success: true };
    }
    throw new Error('Live stream not found or has ended.');
  }

  if (method === 'POST' && liveLeaveMatch) {
    const liveId = parseInt(liveLeaveMatch[1], 10);
    const { userId } = body;
    const live = await database.liveStreams.findOne({ id: liveId });
    if (live) {
      if (live.current_viewers) {
        const index = live.current_viewers.indexOf(userId);
        if (index > -1) {
          live.current_viewers.splice(index, 1);
          await database.liveStreams.updateOne({ id: liveId }, { $set: { current_viewers: live.current_viewers } });
        }
      }
      return { success: true };
    }
    return { success: false };
  }

  if (method === 'GET' && liveViewersMatch) {
    const liveId = parseInt(liveViewersMatch[1], 10);
    const live = await database.liveStreams.findOne({ id: liveId });

    if (!live || !live.ao_vivo) {
      throw new Error(`Live stream with ID ${liveId} not found or has ended`);
    }

    const viewerIds = live.current_viewers || [];
    if (viewerIds.length === 0) {
      return [];
    }

    const allUsers = await database.users.find();
    const giftsInLive = await database.sentGifts.find({ liveId });

    const contributions: Record<number, number> = {};
    giftsInLive.forEach(gift => {
      contributions[gift.senderId] = (contributions[gift.senderId] || 0) + (gift.diamondCost * gift.quantity);
    });

    const viewers: types.Viewer[] = viewerIds.map(userId => {
      const user = allUsers.find(u => u.id === userId);
      if (!user) return null;

      return {
        id: user.id,
        name: user.nickname || user.name,
        avatarUrl: user.avatar_url || '',
        entryTime: new Date().toISOString(),
        contribution: contributions[user.id] || 0,
        level: user.level,
        level2: user.level2 || 1,
      };
    }).filter((v): v is types.Viewer => v !== null)
      .sort((a, b) => b.contribution - a.contribution);
    
    const streamer = allUsers.find(u => u.id === live.user_id);
    if (streamer) {
        viewers.unshift({
            id: streamer.id,
            name: streamer.nickname || streamer.name,
            avatarUrl: streamer.avatar_url || '',
            entryTime: live.inicio,
            contribution: 999999, // High number to keep at top
            level: streamer.level,
            level2: streamer.level2 || 1,
        });
    }

    return viewers;
  }
  
  if (liveChatMatch) {
    const liveId = parseInt(liveChatMatch[1], 10);
    if (method === 'GET') {
        const live = await database.liveStreams.findOne({ id: liveId });
        if (live && live.ao_vivo) {
            if (!live.chatMessages) {
                // Initialize chat if it doesn't exist
                await initializeChatForLive(liveId, await database.users.find(), await database.liveStreams.find());
                const updatedLive = await database.liveStreams.findOne({ id: liveId });
                return updatedLive?.chatMessages || [];
            }
            return live.chatMessages;
        }
        // Throw an error if the stream is not found, which will be caught by the component
        throw new Error(`Live stream com ID ${liveId} não encontrada ou encerrada.`);
    }

    if (method === 'POST') {
        const { userId, message, imageUrl } = body;
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error("User not found");
        const live = await database.liveStreams.findOne({ id: liveId });
        if (!live || !live.ao_vivo) throw new Error("Live stream not found");

        const age = calculateAge(user.birthday);

        const newMsg: types.ChatMessage = {
            id: Date.now(),
            type: imageUrl ? 'image' : 'message',
            userId: userId,
            username: user.nickname || user.name,
            message: message,
            imageUrl: imageUrl,
            timestamp: new Date().toISOString(),
            globalLevel: user.level,
            avatarUrl: user.avatar_url,
            age: age,
            gender: user.gender,
        };

        await database.liveStreams.updateOne({ id: liveId }, { $push: { chatMessages: newMsg } });
        return newMsg;
    }
  }

  if (method === 'GET' && userActiveStreamMatch) {
    const userId = parseInt(userActiveStreamMatch[1], 10);
    const liveRecord = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
    if (liveRecord) {
      return mapLiveRecordToStream(liveRecord);
    }
    return null;
  }
  
  if (method === 'GET' && userLivePreferencesMatch) {
      const userId = parseInt(userLivePreferencesMatch[1], 10);
      const user = await database.users.findOne({ id: userId });
      if (!user) throw new Error("User not found");
      return {
          isPkEnabled: user.pk_enabled_preference ?? true,
          lastCameraUsed: user.last_camera_used || 'user',
          lastSelectedCategory: user.last_selected_category || 'Popular',
          lastLiveTitle: user.lastLiveTitle || '',
          lastLiveMeta: user.lastLiveMeta || '',
      };
  }
  
  if (method === 'POST' && liveStartMatch) {
    const { userId, title, meta, category, isPrivate, isPkEnabled, thumbnailUrl, entryFee, cameraUsed } = body;
    const user = await database.users.findOne({ id: userId });
    if (!user) throw new Error("User not found");

    const existingLive = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
    if (existingLive) {
        throw new Error("User is already live.");
    }
    
    // FIX: Removed the `_id` property from this object literal, as it is not defined in the `LiveStreamRecord` type and is handled by the mock DB's `insertOne` method.
    const newLiveStream: types.LiveStreamRecord = {
        id: Math.floor(Math.random() * 900000) + 100000,
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
        voice_enabled: true,
        like_count: 0,
        country_code: user.country,
        current_viewers: [userId],
    };
    
    await database.liveStreams.insertOne(newLiveStream);
    
    await database.users.updateOne({ id: userId }, { $set: { last_selected_category: category }});
    
    const streamViewModel = mapLiveRecordToStream(newLiveStream);
    const streamKey = `sk_${userId}_${newLiveStream.id}`;

    return {
        live: streamViewModel,
        urls: {
            rtmp: `${SRS_URL_PUBLISH}/${streamKey}`,
            hls: `${SRS_URL_PLAY_HLS}/${streamKey}.m3u8`,
            webrtc: `${SRS_URL_PLAY_WEBRTC}/${streamKey}`,
            streamKey: streamKey,
        },
    };
  }

  // --- Fallback ---
  notFound();
};
