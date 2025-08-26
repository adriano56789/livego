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
  const userStopLiveMatch = path.match(/^\/api\/users\/(\d+)\/stop-live$/);
  const userFollowingLiveStatusMatch = path.match(/^\/api\/users\/(\d+)\/following-live-status$/);
  const userGiftNotificationSettingsMatch = path.match(/^\/api\/users\/(\d+)\/gift-notification-settings$/);
  const userPendingInvitesMatch = path.match(/^\/api\/users\/(\d+)\/pending-invites$/);
  const pkBattleDetailsMatch = path.match(/^\/api\/pk-battles\/(\d+)$/);
  const pkActiveBattleMatch = path.match(/^\/api\/batalhas-pk\/(\d+)$/);
  const streamPkBattleMatch = path.match(/^\/api\/streams\/(\d+)\/batalha-pk$/);
  const blocksMatch = path.match(/^\/api\/blocks$/);
  const unblockMatch = path.match(/^\/api\/blocks\/(\d+)\/(\d+)$/);
  const blockStatusMatch = path.match(/^\/api\/blocks\/(\d+)\/(\d+)$/);
  const pkPendingInviteMatch = path.match(/^\/api\/pk\/invites\/pending\/(\d+)$/);
  const pkInviteStatusMatch = path.match(/^\/api\/pk\/invites\/status\/(.+)$/);
  const pkAcceptInviteMatch = path.match(/^\/api\/pk\/invites\/(.+)\/accept$/);
  const pkDeclineInviteMatch = path.match(/^\/api\/pk\/invites\/(.+)\/decline$/);
  const pkCancelInviteMatch = path.match(/^\/api\/pk\/invites\/(.+)\/cancel$/);
  const pkCohostInviteMatch = path.match(/^\/api\/pk\/cohost-invite$/);
  const followsMatch = path.match(/^\/api\/follows$/);
  const unfollowMatch = path.match(/^\/api\/follows\/(\d+)\/(\d+)$/);


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

  if (method === 'GET' && liveListMatch) {
    const category = query.get('category') as types.Category;
    const userId = query.get('userId') ? parseInt(query.get('userId')!, 10) : null;
    const allLive = await database.liveStreams.find({ ao_vivo: true });

    let streams;
    switch (category) {
        case 'Seguindo':
            if (!userId) throw new Error("userId is required for 'seguindo' category");
            const user = await database.users.findOne({ id: userId });
            const followingIds = user?.following || [];
            streams = allLive.filter((l: any) => followingIds.includes(l.user_id));
            break;
        case 'Privada':
             if (!userId) throw new Error("userId is required for 'privada' category");
             streams = allLive.filter((l: any) => l.is_private && (l.invited_users || []).includes(userId));
             break;
        case 'PK':
            streams = allLive.filter((l: any) => l.em_pk);
            break;
        case 'Novo':
             streams = allLive.sort((a: any, b: any) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime()).slice(0, 10);
            break;
        case 'Música':
        case 'Dança':
            streams = allLive.filter((l: any) => l.categoria === category);
            break;
        case 'Popular':
        default:
             streams = allLive.sort((a: any, b: any) => (b.espectadores || 0) - (a.espectadores || 0));
            break;
    }
    
    const regionFilteredStreams = filterByRegion(streams);
    return regionFilteredStreams.map(mapLiveRecordToStream);
  }

  // --- PK BATTLES ---
  if (method === 'GET' && livePkMatch) {
    const allBattles = await database.pkBattles.find({ status: 'ativa' });
    const battleDetails = await Promise.all(allBattles.map(async (battle) => {
        const [streamerA, streamerB, streamA, streamB] = await Promise.all([
            getDynamicUser(battle.streamer_A_id),
            getDynamicUser(battle.streamer_B_id),
            database.liveStreams.findOne({ user_id: battle.streamer_A_id, ao_vivo: true }),
            database.liveStreams.findOne({ user_id: battle.streamer_B_id, ao_vivo: true }),
        ]);

        if (!streamerA || !streamerB || !streamA || !streamB) return null;
        
        return {
            id: battle.id,
            title: `${streamerA.nickname} VS ${streamerB.nickname}`,
            streamer1: { userId: streamerA.id, streamId: streamA.id, name: streamerA.nickname || streamerA.name, score: battle.pontuacao_A, avatarUrl: streamerA.avatar_url || '', isVerified: true, countryCode: streamerA.country },
            streamer2: { userId: streamerB.id, streamId: streamB.id, name: streamerB.nickname || streamerB.name, score: battle.pontuacao_B, avatarUrl: streamerB.avatar_url || '', isVerified: false, countryCode: streamerB.country },
        };
    }));

    return filterByRegion(battleDetails.filter(Boolean) as types.PkBattle[]);
  }

  // ... (rest of the file remains the same)

  if (method === 'GET' && liveDetailsMatch) {
    const liveId = parseInt(liveDetailsMatch[1], 10);
    const live = await database.liveStreams.findOne({ id: liveId });
    if (!live || !live.ao_vivo) {
      throw new Error('Live stream not found or has ended');
    }
    const streamer = await getDynamicUser(live.user_id);
    if (!streamer) {
      throw new Error('Streamer not found');
    }
    
    // Simulate ranking
    const allStreams = await database.liveStreams.find({ ao_vivo: true });
    allStreams.sort((a: any, b: any) => (b.received_gifts_value || 0) - (a.received_gifts_value || 0));
    const rank = allStreams.findIndex((s: any) => s.id === liveId) + 1;

    return {
      streamerName: streamer.nickname || streamer.name,
      streamerAvatarUrl: streamer.avatar_url || '',
      streamerFollowers: streamer.followers,
      viewerCount: live.current_viewers?.length || 0,
      totalVisitors: live.espectadores,
      receivedGiftsValue: live.received_gifts_value || 0,
      rankingPosition: `${rank}`,
      status: 'ao vivo',
      likeCount: live.like_count || 0,
      title: live.titulo,
      meta: live.meta,
      streamerIsAvatarProtected: streamer.is_avatar_protected,
    };
  }
  
  if (method === 'GET' && userLiveStatusMatch) {
    const userId = parseInt(userLiveStatusMatch[1], 10);
    const liveStream = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
    return !!liveStream;
  }

  if (method === 'GET' && userActiveStreamMatch) {
    const userId = parseInt(userActiveStreamMatch[1], 10);
    const liveStream = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
    if(liveStream) {
        return mapLiveRecordToStream(liveStream);
    }
    return null;
  }
  
  if (method === 'GET' && userFollowingLiveStatusMatch) {
      const userId = parseInt(userFollowingLiveStatusMatch[1], 10);
      const user = await database.users.findOne({ id: userId });
      if (!user) return [];
      const followingIds = user.following || [];
      
      const liveStreams = await database.liveStreams.find({ ao_vivo: true });
      const liveFollowedIds = new Set(liveStreams.filter(s => followingIds.includes(s.user_id)).map(s => s.user_id));

      return followingIds.map(id => {
          const isLive = liveFollowedIds.has(id);
          const streamRecord = isLive ? liveStreams.find(s => s.user_id === id) : null;
          return {
              userId: id,
              isLive,
              stream: streamRecord ? mapLiveRecordToStream(streamRecord) : null
          };
      });
  }

  // ... (rest of the file)
  if (method === 'POST' && liveStartMatch) {
    const { userId, title, meta, category, isPrivate, isPkEnabled, thumbnailUrl, entryFee, cameraUsed } = body;
    
    // Stop any existing live stream for this user first
    await database.liveStreams.updateOne({ user_id: userId, ao_vivo: true }, { $set: { ao_vivo: false } });

    const streamer = await database.users.findOne({ id: userId });
    if (!streamer) throw new Error("Streamer not found");

    // FIX: Remove the `_id` property from the object literal to match the `LiveStreamRecord` type.
    // The `insertOne` function in `database.ts` will add the `_id` automatically.
    const newStream: types.LiveStreamRecord = {
        id: Math.floor(Math.random() * 100000),
        user_id: userId,
        titulo: title,
        nome_streamer: streamer.nickname || streamer.name,
        thumbnail_url: thumbnailUrl,
        espectadores: 0,
        categoria: category,
        ao_vivo: true,
        em_pk: false,
        is_private: isPrivate,
        entry_fee: entryFee || null,
        meta: meta || null,
        inicio: new Date().toISOString(),
        permite_pk: isPkEnabled,
        like_count: 0,
        country_code: streamer.country,
        camera_facing_mode: cameraUsed,
        chatMessages: [],
        current_viewers: []
    };
    
    await database.liveStreams.insertOne(newStream as any);

    return {
      live: mapLiveRecordToStream(newStream),
      urls: {
        rtmp: `${SRS_URL_PUBLISH}/${newStream.id}`,
        hls: `${SRS_URL_PLAY_HLS}/${newStream.id}.m3u8`,
        webrtc: `${SRS_URL_PLAY_WEBRTC}/${newStream.id}`,
        streamKey: `sk_${userId}_${newStream.id}`,
      },
    };
  }
  
  if (method === 'POST' && userStopLiveMatch) {
    const userId = parseInt(userStopLiveMatch[1], 10);
    const result = await database.liveStreams.updateOne({ user_id: userId, ao_vivo: true }, { $set: { ao_vivo: false }});
    if (result.modifiedCount === 0) {
        // Might be a PK battle, check that table too
        const activeBattle = await database.pkBattles.findOne({ status: 'ativa' });
        if (activeBattle && (activeBattle.streamer_A_id === userId || activeBattle.streamer_B_id === userId)) {
             await database.pkBattles.updateOne({ id: activeBattle.id }, { $set: { status: 'finalizada' }});
             // Also end the associated streams
             const streamA = await database.liveStreams.findOne({ user_id: activeBattle.streamer_A_id, ao_vivo: true });
             const streamB = await database.liveStreams.findOne({ user_id: activeBattle.streamer_B_id, ao_vivo: true });
             if(streamA) await database.liveStreams.updateOne({ id: streamA.id }, { $set: { ao_vivo: false, em_pk: false }});
             if(streamB) await database.liveStreams.updateOne({ id: streamB.id }, { $set: { ao_vivo: false, em_pk: false }});
             return { success: true };
        }
    }
    return { success: result.modifiedCount > 0 };
  }

  // Catch-all for any unhandled routes
  notFound();
};