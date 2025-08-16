// =================================================================
// MOCK BACKEND API SERVER
// This file simulates a backend server. It receives requests from the
// apiClient, routes them to the correct logic function, and returns
// a simulated HTTP response. All business logic and database
// interactions are centralized here.
// =================================================================

import * as db from './mockDb';
import * as levelService from './levelService';
import { dbClient } from './dbClient';
import { notifyStreamListeners, notifyChatMessageListeners, notifyMuteStatusListeners, notifyUserKickedListeners, notifySoundEffectListeners, notifyUserBlockedListeners, notifyUserUnblockedListeners } from './liveStreamService';
import type { User, LiveDetails, ChatMessage, Gift, Viewer, RankingContributor, Like, PkBattle, PkSession, PublicProfile, PkEventDetails, Conversation, SendGiftResponse, ProtectorDetails, AchievementFrame, WithdrawalTransaction, WithdrawalMethod, InventoryItem, AppEvent, LiveEndSummary, UserLevelInfo, GeneralRankingStreamer, GeneralRankingUser, WithdrawalBalance, EventStatus, PkRankingData, ReportPayload, SuggestionPayload, Stream, DbLive, Category, StartLiveResponse, DiamondPackage, Address, PaymentMethod, CardDetails, PurchaseOrder, HelpArticle, DailyReward, UserRewardStatus, VersionInfo, ConversationMessage, PkInvitation, LiveFollowUpdate, PrivateLiveInviteSettings, NotificationSettings, FacingMode, SoundEffectName, SoundEffectLogEntry, CardBrand, UniversalRankingData, UniversalRankingUser, GiftTransaction } from '../types';

// Connect to the database when the API module is initialized
dbClient.connect();

// =================================================================
// TYPES & HELPERS
// =================================================================
interface ApiResponse {
  status: number;
  body: any;
}

const EARNING_TO_BRL_RATE = 0.0115;
const WITHDRAWAL_FEE_RATE = 0.20;

const createSuccessResponse = (body: any): ApiResponse => ({
  status: 200,
  body,
});

const createErrorResponse = (status: number, message: string): ApiResponse => ({
  status,
  body: { message },
});

const calculateAge = (birthday: string | null | undefined): number => {
    if (!birthday) return 0;
    const [year, month, day] = birthday.split('-').map(Number);
    if (!year || !month || !day) return 0;
    
    const birthDate = new Date(year, month - 1, day);
    // FORCED_YEAR_CHANGE: Assume current year is 2025 to match user's age expectation of 32.
    const today = new Date();
    today.setFullYear(2025); 

    if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day || birthDate > today) {
        return 0;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return Math.max(0, age);
};

const mapDbLiveToStream = (dbLive: DbLive): Stream => ({
    id: dbLive.id,
    userId: dbLive.user_id,
    titulo: dbLive.titulo,
    nomeStreamer: dbLive.nome_streamer,
    thumbnailUrl: dbLive.thumbnail_url,
    espectadores: dbLive.espectadores,
    categoria: dbLive.categoria,
    aoVivo: dbLive.ao_vivo,
    emPK: dbLive.em_pk,
    isPrivate: dbLive.is_private,
    entryFee: dbLive.entry_fee,
    meta: dbLive.meta,
    inicio: dbLive.inicio,
    permitePk: dbLive.permite_pk,
    cameraFacingMode: dbLive.camera_facing_mode,
    voiceEnabled: dbLive.voice_enabled,
});

// =================================================================
// AUTH & USER LOGIC
// =================================================================

const loginWithGoogleLogic = async () => {
  let user = await dbClient.findOne('users', u => u.email === 'usuario@livego.com');
  if (!user) {
    user = await dbClient.findOne('users', u => u.id === 10755083);
    if (!user) return createErrorResponse(404, 'Usuário principal não encontrado.');
  }
  
  if (user.birthday) {
      user.age = calculateAge(user.birthday);
  }
  
  return createSuccessResponse(user);
};

const getUserProfileLogic = async (userIdStr: string) => {
  const userId = parseInt(userIdStr, 10);
  const user = await dbClient.findOne('users', u => u.id === userId);
  if (!user) {
    return createErrorResponse(404, 'Usuário não encontrado.');
  }
  if (user.birthday) {
      user.age = calculateAge(user.birthday);
  }
  return createSuccessResponse(user);
};

const getFollowingUsersLogic = async (userIdStr: string) => {
    const userId = parseInt(userIdStr, 10);
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) {
        return createErrorResponse(404, "Usuário não encontrado.");
    }
    const following = await dbClient.find('users', u => user.following.includes(u.id));
    return createSuccessResponse(following);
};

const getFollowersLogic = async (userIdStr: string) => {
    const userId = parseInt(userIdStr, 10);
    // This is a simplified simulation. A real DB would have a followers table.
    const followers = await dbClient.find('users', u => u.following.includes(userId));
    return createSuccessResponse(followers);
};

const getVisitorsLogic = async (userIdStr: string) => {
    const userId = parseInt(userIdStr, 10);
    const visitorIds = db.mockProfileVisitors[userId] || [];
    const visitors = await dbClient.find('users', u => visitorIds.includes(u.id));
    return createSuccessResponse(visitors);
};


const uploadProfilePhotoLogic = async (userIdStr: string, body: any) => {
  const userId = parseInt(userIdStr, 10);
  const updatedUser = await dbClient.update('users', userId, {
    avatar_url: body.photoDataUrl,
    has_uploaded_real_photo: true
  });
  if (!updatedUser) {
    return createErrorResponse(404, 'Usuário não encontrado.');
  }
  return createSuccessResponse(updatedUser);
};

const updateUserProfileLogic = async (userIdStr: string, body: any) => {
  const userId = parseInt(userIdStr, 10);
  const user = await dbClient.findOne('users', u => u.id === userId);
  if (!user) {
    return createErrorResponse(404, 'Usuário não encontrado.');
  }

  const updates: Partial<User> = {
    ...body,
    has_completed_profile: true,
  };
  
  if (body.birthday) {
    updates.age = calculateAge(body.birthday);
  }

  const updatedUser = await dbClient.update('users', userId, updates);
  return createSuccessResponse(updatedUser);
};

const changeEmailLogic = async (userIdStr: string, body: any) => {
  const userId = parseInt(userIdStr, 10);
  const { newEmail } = body;
  const existingUser = await dbClient.findOne('users', u => u.email === newEmail && u.id !== userId);
  if (existingUser) {
    return createErrorResponse(400, "Este e-mail já está em uso por outra conta.");
  }
  const updatedUser = await dbClient.update('users', userId, { email: newEmail });
  if (!updatedUser) {
    return createErrorResponse(404, "Usuário não encontrado.");
  }
  return createSuccessResponse(updatedUser);
};

const deleteAccountLogic = async (userIdStr: string) => {
    const userId = parseInt(userIdStr, 10);
    const success = await dbClient.delete('users', (u) => u.id === userId);
    if (!success) {
        return createErrorResponse(404, "Usuário não encontrado.");
    }
    // In a real app, you would also delete related data (lives, chats, etc.)
    return createSuccessResponse({ success: true });
};

const searchUsersLogic = async (query: string) => {
    const lowerQuery = query.toLowerCase();
    const results = await dbClient.find('users', u => 
        u.name.toLowerCase().includes(lowerQuery) ||
        (u.nickname && u.nickname.toLowerCase().includes(lowerQuery)) ||
        String(u.id).includes(lowerQuery)
    );
    return createSuccessResponse(results);
};

// =================================================================
// USER BLOCKING LOGIC
// =================================================================
const blockUserLogic = async (body: any) => {
    const { blockerId, targetId } = body;
    const existing = await dbClient.findOne('blockedRelationships', r => r.blockerId === blockerId && r.targetId === targetId);
    if (!existing) {
        await dbClient.insert('blockedRelationships', { blockerId, targetId });
    }
    // Notify in real-time that a user was blocked
    notifyUserBlockedListeners({ blockerId, targetId });
    return createSuccessResponse({ success: true });
};

const unblockUserLogic = async (body: any) => {
    const { unblockerId, targetId } = body;
    await dbClient.delete('blockedRelationships', r => r.blockerId === unblockerId && r.targetId === targetId);
    // Notify in real-time that a user was unblocked
    notifyUserUnblockedListeners({ unblockerId, targetId });
    return createSuccessResponse({ success: true });
};

const getBlockedUsersLogic = async (userIdStr: string) => {
    const currentUserId = parseInt(userIdStr, 10);
    const relationships = await dbClient.find('blockedRelationships', r => r.blockerId === currentUserId);
    const blockedIds = relationships.map(r => r.targetId);
    if (blockedIds.length === 0) {
        return createSuccessResponse([]);
    }
    const blockedUsers = await dbClient.find('users', u => blockedIds.includes(u.id));
    return createSuccessResponse(blockedUsers);
};

const isUserBlockedLogic = async (body: any) => {
    const { blockerId, targetId } = body;
    const relationship = await dbClient.findOne('blockedRelationships', r => r.blockerId === blockerId && r.targetId === targetId);
    return createSuccessResponse({ isBlocked: !!relationship });
};


// =================================================================
// LIVE STREAM & CHAT LOGIC
// =================================================================

const getPopularStreamsLogic = async () => {
  const lives = await dbClient.find('lives', l => l.ao_vivo && !l.is_private);
  lives.sort((a, b) => b.espectadores - a.espectadores);
  return createSuccessResponse(lives.map(mapDbLiveToStream));
};

const getFollowingStreamsLogic = async (userIdStr: string) => {
    const userId = parseInt(userIdStr, 10);
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) {
        return createErrorResponse(404, "Usuário não encontrado.");
    }
    const lives = await dbClient.find('lives', l => l.ao_vivo && user.following.includes(l.user_id) && !l.is_private);
    return createSuccessResponse(lives.map(mapDbLiveToStream));
};

const getNewStreamsLogic = async () => {
    const lives = await dbClient.find('lives', l => l.ao_vivo && !l.is_private);
    lives.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
    return createSuccessResponse(lives.map(mapDbLiveToStream).slice(0, 10)); // Limit to 10 newest
};

const getCategoryStreamsLogic = async (category: string) => {
    const capitalizedCategory = (category.charAt(0).toUpperCase() + category.slice(1)) as Category;
    const lives = await dbClient.find('lives', l => l.ao_vivo && l.categoria === capitalizedCategory && !l.is_private);
    return createSuccessResponse(lives.map(mapDbLiveToStream));
};

const getPrivateStreamsLogic = async (userIdStr: string) => {
    const userId = parseInt(userIdStr, 10);
    const lives = await dbClient.find('lives', l => 
        l.ao_vivo && 
        l.is_private && 
        (l.user_id === userId || (l.invited_users || []).includes(userId))
    );
    return createSuccessResponse(lives.map(mapDbLiveToStream));
};

const getPkBattlesLogic = async () => {
    const pkSessions = await dbClient.find('pkSessions', s => s.endTime === null);
    const battles: PkBattle[] = [];

    for (const session of pkSessions) {
        const [stream1, stream2] = await Promise.all([
            dbClient.findOne('lives', l => l.id === session.stream1Id),
            dbClient.findOne('lives', l => l.id === session.stream2Id)
        ]);
        const [user1, user2] = await Promise.all([
            dbClient.findOne('users', u => u.id === stream1?.user_id),
            dbClient.findOne('users', u => u.id === stream2?.user_id)
        ]);

        if (stream1 && stream2 && user1 && user2) {
            battles.push({
                id: session.id,
                title: `${stream1.nome_streamer} vs ${stream2.nome_streamer}`,
                streamer1: {
                    userId: user1.id,
                    streamId: stream1.id,
                    name: user1.nickname || user1.name,
                    score: session.score1,
                    avatarUrl: user1.avatar_url || ''
                },
                streamer2: {
                    userId: user2.id,
                    streamId: stream2.id,
                    name: user2.nickname || user2.name,
                    score: session.score2,
                    avatarUrl: user2.avatar_url || ''
                }
            });
        }
    }
    return createSuccessResponse(battles);
};

const startLiveStreamLogic = async (body: any): Promise<ApiResponse> => {
    const { userId, title, meta, category, isPrivate, isPkEnabled, thumbnailUrl, entryFee, cameraUsed } = body;
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) {
        return createErrorResponse(404, "Usuário não encontrado.");
    }

    const existingLive = await dbClient.findOne('lives', l => l.user_id === userId && l.ao_vivo);
    if (existingLive) {
        return createErrorResponse(400, "Usuário já está ao vivo.");
    }
    
    // Create new DbLive object
    const newLive: Omit<DbLive, 'id'> = {
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
    
    const createdLive = await dbClient.insert('lives', newLive);
    
    // Update user's last camera and category
    await dbClient.update('users', userId, { last_camera_used: cameraUsed, last_selected_category: category });

    const response: StartLiveResponse = {
        live: mapDbLiveToStream(createdLive),
        urls: {
            rtmp: `rtmp://live.livego.com/app/${createdLive.id}`,
            hls: `https://hls.livego.com/app/${createdLive.id}.m3u8`,
            webrtc: `wss://webrtc.livego.com/app/${createdLive.id}`,
            streamKey: `sk_${createdLive.id}_${Math.random().toString(36).substring(2)}`
        }
    };
    
    // Notify listeners about the new stream
    const allStreams = (await dbClient.find('lives', l => l.ao_vivo)).map(mapDbLiveToStream);
    notifyStreamListeners(allStreams);

    return createSuccessResponse(response);
};

const stopLiveStreamLogic = async (userIdStr: string) => {
    const userId = parseInt(userIdStr, 10);
    const live = await dbClient.findOne('lives', l => l.user_id === userId && l.ao_vivo);
    if (!live) {
        return createErrorResponse(404, "Nenhuma transmissão ao vivo encontrada para este usuário.");
    }
    await dbClient.update('lives', live.id, { ao_vivo: false });

    // Also end any active PK session
    const pkSession = await dbClient.findOne('pkSessions', s => (s.stream1Id === live.id || s.stream2Id === live.id) && !s.endTime);
    if (pkSession) {
        await dbClient.update('pkSessions', pkSession.id, { endTime: new Date().toISOString() });
    }
    
     // Notify listeners about the change
    const allStreams = (await dbClient.find('lives', l => l.ao_vivo)).map(mapDbLiveToStream);
    notifyStreamListeners(allStreams);

    return createSuccessResponse({ success: true });
};

const getLiveStreamDetailsLogic = async (liveIdStr: string) => {
  const liveId = parseInt(liveIdStr, 10);
  const live = await dbClient.findOne('lives', l => l.id === liveId);
  if (!live) return createErrorResponse(404, 'Transmissão ao vivo não encontrada.');

  const streamer = await dbClient.findOne('users', u => u.id === live.user_id);
  if (!streamer) return createErrorResponse(404, 'Streamer não encontrado.');
  
  const totalVisitors = Object.values(db.mockLiveConnections).reduce((acc, userSet) => userSet.has(liveId) ? acc + 1 : acc, 0);
  
  const giftTransactions = await dbClient.find('giftTransactions', t => t.liveId === liveId);
  const receivedGiftsValue = giftTransactions.reduce((sum, tx) => sum + tx.giftValue, 0);

  const details: LiveDetails = {
    streamerName: streamer.nickname || streamer.name,
    streamerAvatarUrl: streamer.avatar_url || '',
    streamerFollowers: streamer.followers,
    viewerCount: live.espectadores,
    totalVisitors: totalVisitors,
    receivedGiftsValue: receivedGiftsValue,
    rankingPosition: 'Top 10%',
    status: 'ao vivo',
    likeCount: db.mockLikes[liveId]?.length || 0,
    title: live.titulo,
    meta: live.meta,
  };

  return createSuccessResponse(details);
};

const getChatMessagesLogic = async (liveIdStr: string) => {
    const liveId = parseInt(liveIdStr, 10);
    if (!db.mockChatDatabase[liveId]) {
        db.mockChatDatabase[liveId] = [];
    }
    return createSuccessResponse(db.mockChatDatabase[liveId]);
};

const sendChatMessageLogic = async (liveIdStr: string, body: any) => {
    const liveId = parseInt(liveIdStr, 10);
    const { userId, message } = body;

    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return createErrorResponse(404, 'Usuário não encontrado.');
    
    const live = await dbClient.findOne('lives', l => l.id === liveId);
    if (!live) return createErrorResponse(404, 'Live não encontrada.');

    // Server-side check for blocked user
    const isBlocked = await dbClient.findOne('blockedRelationships', r => r.blockerId === live.user_id && r.targetId === userId);
    if (isBlocked) {
        return createErrorResponse(403, 'Você está bloqueado e não pode enviar mensagens.');
    }

    if (!db.mockChatDatabase[liveId]) {
        db.mockChatDatabase[liveId] = [];
    }
    
    const newMessage: ChatMessage = {
        id: db.mockChatDatabase[liveId].length + 1,
        type: 'message',
        level: user.level,
        username: user.nickname || user.name,
        userId: user.id,
        message,
        timestamp: new Date().toISOString()
    };
    db.mockChatDatabase[liveId].push(newMessage);
    
    // Simulate notifying all clients watching this live stream
    notifyChatMessageListeners(liveId, db.mockChatDatabase[liveId]);
    
    return createSuccessResponse(newMessage);
};

const sendGiftLogic = async (liveIdStr: string, body: any) => {
    const liveId = parseInt(liveIdStr, 10);
    const { senderId, giftId } = body;
    
    const sender = await dbClient.findOne('users', u => u.id === senderId);
    const live = await dbClient.findOne('lives', l => l.id === liveId);
    
    if (!sender || !live) {
        return createErrorResponse(404, "Usuário ou live não encontrado.");
    }
    
    const gift = db.mockGiftCatalog.find(g => g.id === giftId);
    if (!gift) {
        return createErrorResponse(404, "Presente não encontrado.");
    }

    if (sender.wallet_diamonds < gift.price) {
        return createSuccessResponse({ success: false, updatedUser: null, message: "Diamantes insuficientes." });
    }
    
    // Deduct diamonds from sender and add earnings to receiver
    const updatedSender = await dbClient.update('users', senderId, { wallet_diamonds: sender.wallet_diamonds - gift.price });
    const receiver = await dbClient.findOne('users', u => u.id === live.user_id);
    if (receiver) {
        const earnings = gift.price; // 1 diamond = 1 earning
        await dbClient.update('users', receiver.id, { wallet_earnings: receiver.wallet_earnings + earnings });
    }

    // Add gift transaction to log
    await dbClient.insert('giftTransactions', {
        senderId,
        receiverId: live.user_id,
        liveId,
        giftId,
        giftValue: gift.price,
        timestamp: new Date().toISOString(),
    });

    // Add a gift message to chat
    if (!db.mockChatDatabase[liveId]) {
        db.mockChatDatabase[liveId] = [];
    }
    const giftMessage: ChatMessage = {
        id: db.mockChatDatabase[liveId].length + 1,
        type: 'gift',
        username: sender.nickname || sender.name,
        userId: sender.id,
        message: `enviou um ${gift.name}`,
        giftName: gift.name,
        giftAnimationUrl: gift.animationUrl,
        timestamp: new Date().toISOString()
    };
    db.mockChatDatabase[liveId].push(giftMessage);

    notifyChatMessageListeners(liveId, db.mockChatDatabase[liveId]);

    return createSuccessResponse({ success: true, updatedUser: updatedSender, message: "Presente enviado com sucesso!" });
};

const joinLiveStreamLogic = async (liveIdStr: string, body: any) => {
    const liveId = parseInt(liveIdStr, 10);
    const { userId } = body;
    const live = await dbClient.findOne('lives', l => l.id === liveId);
    if (!live || !live.ao_vivo) {
        return createErrorResponse(404, "Transmissão ao vivo não encontrada ou encerrada.");
    }
    
    const kickedUsers = db.mockKickedUsersFromLive[liveId] || [];
    if(kickedUsers.includes(userId)) {
        return createErrorResponse(403, "Você foi removido desta sala pelo anfitrião.");
    }

    if (!db.mockLiveConnections[liveId]) {
        db.mockLiveConnections[liveId] = new Set();
    }
    if (!db.mockLiveConnections[liveId].has(userId)) {
        db.mockLiveConnections[liveId].add(userId);
        
        const updatedLive = await dbClient.update('lives', liveId, { espectadores: live.espectadores + 1 });
        
        // Notify all clients about the stream changes
        const allStreams = (await dbClient.find('lives', l => l.ao_vivo)).map(mapDbLiveToStream);
        notifyStreamListeners(allStreams);
    }
    return createSuccessResponse({ success: true });
};

const leaveLiveStreamLogic = async (liveIdStr: string, body: any) => {
    const liveId = parseInt(liveIdStr, 10);
    const { userId } = body;
    const live = await dbClient.findOne('lives', l => l.id === liveId);
    if (!live) {
        return createSuccessResponse({ success: true }); // Already gone
    }
    if (db.mockLiveConnections[liveId] && db.mockLiveConnections[liveId].has(userId)) {
        db.mockLiveConnections[liveId].delete(userId);
        await dbClient.update('lives', liveId, { espectadores: Math.max(0, live.espectadores - 1) });
        const allStreams = (await dbClient.find('lives', l => l.ao_vivo)).map(mapDbLiveToStream);
        notifyStreamListeners(allStreams);
    }
    return createSuccessResponse({ success: true });
};


// =================================================================
// API ROUTER (SIMULATED)
// =================================================================
type ApiLogicFunction = (param: string, body: any, query: string) => Promise<ApiResponse>;

const routes: { [method: string]: { [path: string]: ApiLogicFunction } } = {
  GET: {},
  POST: {},
  PATCH: {},
  PUT: {},
  DELETE: {}
};

const router = {
  get: (path: string, handler: (param: string, query: string) => Promise<ApiResponse>) => {
    routes.GET[path] = (param, _, query) => handler(param, query);
  },
  post: (path: string, handler: (param: string, body: any) => Promise<ApiResponse>) => {
    routes.POST[path] = handler;
  },
  patch: (path: string, handler: (param: string, body: any) => Promise<ApiResponse>) => {
    routes.PATCH[path] = handler;
  },
   put: (path: string, handler: (param: string, body: any) => Promise<ApiResponse>) => {
    routes.PUT[path] = handler;
  },
  delete: (path: string, handler: (param: string) => Promise<ApiResponse>) => {
    routes.DELETE[path] = (param, _, __) => handler(param);
  }
};

// --- Auth & User Routes ---
router.post('/api/auth/google', (_, __) => loginWithGoogleLogic());
router.get('/api/users/:id', (id, _) => getUserProfileLogic(id));
router.get('/api/users/:id/following', (id, _) => getFollowingUsersLogic(id));
router.get('/api/users/:id/followers', (id, _) => getFollowersLogic(id));
router.get('/api/users/:id/visitors', (id, _) => getVisitorsLogic(id));
router.patch('/api/users/:id/avatar', (id, body) => uploadProfilePhotoLogic(id, body));
router.patch('/api/users/:id', (id, body) => updateUserProfileLogic(id, body));
router.patch('/api/users/:id/email', (id, body) => changeEmailLogic(id, body));
router.delete('/api/users/:id', (id) => deleteAccountLogic(id));
router.get('/api/users/search', (_, query) => searchUsersLogic(query));

// --- Blocking Routes ---
router.post('/api/users/block', (_, body) => blockUserLogic(body));
router.post('/api/users/unblock', (_, body) => unblockUserLogic(body));
router.get('/api/users/:id/blocked', (id, _) => getBlockedUsersLogic(id));
router.post('/api/users/is-blocked', (_, body) => isUserBlockedLogic(body));


// --- Live Stream Routes ---
router.get('/api/lives/popular', (_, __) => getPopularStreamsLogic());
router.get('/api/lives/seguindo/:id', (id, _) => getFollowingStreamsLogic(id));
router.get('/api/lives/novas', (_, __) => getNewStreamsLogic());
router.get('/api/lives/categoria/:category', (category, _) => getCategoryStreamsLogic(category));
router.get('/api/lives/private/:id', (id, _) => getPrivateStreamsLogic(id));
router.get('/api/lives/pk', (_, __) => getPkBattlesLogic());
router.post('/api/lives/create', (_, body) => startLiveStreamLogic(body));
router.post('/api/users/:id/stop-live', (id, _) => stopLiveStreamLogic(id));
router.get('/api/lives/:id/details', (id, _) => getLiveStreamDetailsLogic(id));
router.post('/api/lives/:id/join', (id, body) => joinLiveStreamLogic(id, body));
router.post('/api/lives/:id/leave', (id, body) => leaveLiveStreamLogic(id, body));

// --- Chat & Gift Routes ---
router.get('/api/chat/live/:id', (id, _) => getChatMessagesLogic(id));
router.post('/api/chat/live/:id', (id, body) => sendChatMessageLogic(id, body));
router.post('/api/lives/:id/gift', (id, body) => sendGiftLogic(id, body));
router.get('/api/gifts', async (_, __) => createSuccessResponse(db.mockGiftCatalog));

// --- Private Chat ---
router.get('/api/users/:id/conversations', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const conversations = await dbClient.find('conversations', c => c.participants.includes(userId));
    
    const enrichedConversations = await Promise.all(conversations.map(async c => {
        const otherUserId = c.participants.find(pId => pId !== userId);
        if (!otherUserId) return null;
        
        const otherUser = await dbClient.findOne('users', u => u.id === otherUserId);
        const unreadCount = c.messages.filter(m => m.senderId !== userId && !m.seenBy.includes(userId)).length;
        
        return {
            ...c,
            otherUserId: otherUser?.id || 0,
            otherUserName: otherUser?.nickname || otherUser?.name || 'Unknown',
            otherUserAvatarUrl: otherUser?.avatar_url || '',
            unreadCount
        };
    }));

    const validConversations = enrichedConversations
        .filter(c => c !== null)
        .sort((a, b) => {
            const lastMsgA = a!.messages[a!.messages.length - 1];
            const lastMsgB = b!.messages[b!.messages.length - 1];
            if (!lastMsgA) return 1;
            if (!lastMsgB) return -1;
            return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
        });

    return createSuccessResponse(validConversations);
});

router.get('/api/chat/private/:id', async (id, query) => {
    const currentUserId = parseInt(new URLSearchParams(query).get('userId') || '0', 10);
    const conversation = await dbClient.findOne('conversations', c => c.id === id);
    if (!conversation) return createErrorResponse(404, "Conversa não encontrada.");
    
    const otherUserId = conversation.participants.find(pId => pId !== currentUserId);
    const otherUser = await dbClient.findOne('users', u => u.id === otherUserId);

    const enrichedConversation = {
        ...conversation,
        otherUserId: otherUser?.id || 0,
        otherUserName: otherUser?.nickname || otherUser?.name || 'Unknown',
        otherUserAvatarUrl: otherUser?.avatar_url || '',
        unreadCount: conversation.messages.filter(m => m.senderId !== currentUserId && m.status !== 'seen').length
    };

    return createSuccessResponse(enrichedConversation);
});

router.post('/api/chat/private/get-or-create', async (_, body) => {
    const { currentUserId, otherUserId } = body;
    let conversation = await dbClient.findOne('conversations', c => c.participants.includes(currentUserId) && c.participants.includes(otherUserId));
    if (!conversation) {
        conversation = await dbClient.insert('conversations', {
            participants: [currentUserId, otherUserId],
            otherUserId: otherUserId,
            unreadCount: 0,
            messages: [],
        });
    }

    const otherUser = await dbClient.findOne('users', u => u.id === otherUserId);
    const enrichedConversation = {
        ...conversation,
        otherUserId: otherUser?.id || 0,
        otherUserName: otherUser?.nickname || otherUser?.name || 'Unknown',
        otherUserAvatarUrl: otherUser?.avatar_url || '',
        unreadCount: conversation.messages.filter(m => m.senderId !== currentUserId && m.status !== 'seen').length
    };
    return createSuccessResponse(enrichedConversation);
});


router.post('/api/chat/private/:id', async (id, body) => {
    const { senderId, text } = body;
    const conversation = await dbClient.findOne('conversations', c => c.id === id);
    if (!conversation) return createErrorResponse(404, "Conversa não encontrada.");
    
    const newMessage: ConversationMessage = {
        id: (conversation.messages[conversation.messages.length - 1]?.id || 0) + 1,
        senderId,
        text,
        timestamp: new Date().toISOString(),
        status: 'sent',
        seenBy: [senderId],
    };
    
    conversation.messages.push(newMessage);
    const updatedConversation = await dbClient.update('conversations', id, { messages: conversation.messages });
    
    const otherUserId = updatedConversation!.participants.find(pId => pId !== senderId);
    const otherUser = await dbClient.findOne('users', u => u.id === otherUserId);

    const enrichedConversation = {
        ...updatedConversation,
        otherUserId: otherUser?.id || 0,
        otherUserName: otherUser?.nickname || otherUser?.name || 'Unknown',
        otherUserAvatarUrl: otherUser?.avatar_url || '',
        unreadCount: 0 // Assume it's 0 for the sender
    };

    return createSuccessResponse(enrichedConversation);
});

router.post('/api/chat/viewed', async (_, body) => {
    const { conversationId, viewerId } = body;
    const conversation = await dbClient.findOne('conversations', c => c.id === conversationId);
    if (!conversation) return createErrorResponse(404, "Conversa não encontrada.");

    const updatedMessages = conversation.messages.map(msg => {
        if (msg.senderId !== viewerId && !msg.seenBy.includes(viewerId)) {
            return { ...msg, status: 'seen' as const, seenBy: [...msg.seenBy, viewerId] };
        }
        return msg;
    });

    await dbClient.update('conversations', conversationId, { messages: updatedMessages });
    return createSuccessResponse({ success: true });
});

// --- Purchase ---
router.get('/api/diamonds/packages', async () => createSuccessResponse(db.mockDiamondPackages));

router.post('/api/purchase', async (_, body) => {
    const { userId, packageId, address, paymentDetails } = body;
    const user = await dbClient.findOne('users', u => u.id === userId);
    const pkg = db.mockDiamondPackages.find(p => p.id === packageId);

    if (!user || !pkg) {
        return createErrorResponse(404, "Usuário ou pacote não encontrado.");
    }
    
    const order: PurchaseOrder = {
        orderId: `ord_${Date.now()}`,
        userId,
        package: pkg,
        address,
        paymentDetails,
        status: paymentDetails?.method === 'card' ? 'completed' : 'pending',
        timestamp: new Date().toISOString(),
    };
    
    await dbClient.insert('purchaseOrders', order);
    
    let updatedUser = user;
    if (order.status === 'completed') {
        updatedUser = await dbClient.update('users', userId, {
            wallet_diamonds: user.wallet_diamonds + pkg.diamonds
        }) as User;
    }
    
    return createSuccessResponse({ updatedUser, order });
});

router.get('/api/users/:id/purchase-history', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const orders = await dbClient.find('purchaseOrders', o => o.userId === userId);
    orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return createSuccessResponse(orders);
});

router.get('/api/purchase/status/:id', async (id) => {
    let order = await dbClient.findOne('purchaseOrders', o => o.orderId === id);
    if (order && order.status === 'pending') {
        // Simulate a small chance of the order completing
        if (Math.random() < 0.2) {
             order = await dbClient.update('purchaseOrders', id, { status: 'completed' });
             if (order) {
                 const user = await dbClient.findOne('users', u => u.id === order.userId);
                 if (user) {
                     await dbClient.update('users', user.id, { wallet_diamonds: user.wallet_diamonds + order.package.diamonds });
                 }
             }
        }
    }
    return createSuccessResponse({ order });
});

router.post('/api/payment/detect-brand', async (_, body) => {
    const { cardNumber } = body;
    let brand: CardBrand = null;
    if (cardNumber.startsWith('4')) brand = 'visa';
    else if (cardNumber.startsWith('5')) brand = 'mastercard';
    else if (cardNumber.startsWith('34') || cardNumber.startsWith('37')) brand = 'amex';
    else if (cardNumber.startsWith('6')) brand = 'elo';
    return createSuccessResponse({ brand });
});


// --- PK Battle ---
router.get('/api/lives/invitable/:id', async (idStr) => {
    const currentUserId = parseInt(idStr, 10);
    const lives = await dbClient.find('lives', l => l.ao_vivo && l.permite_pk && l.user_id !== currentUserId);
    const userIds = lives.map(l => l.user_id);
    const users = await dbClient.find('users', u => userIds.includes(u.id));
    return createSuccessResponse(users);
});

router.post('/api/pk/invite', async (_, body) => {
    const { inviterId, inviteeId } = body;
    const existing = await dbClient.findOne('pkInvitations', i => 
        (i.inviterId === inviterId && i.inviteeId === inviteeId && i.status === 'pending') ||
        (i.inviterId === inviteeId && i.inviteeId === inviterId && i.status === 'pending')
    );
    if(existing) {
        return createErrorResponse(400, "Já existe um convite pendente entre esses usuários.");
    }
    const inviter = await dbClient.findOne('users', u => u.id === inviterId);
    if (!inviter) {
        return createErrorResponse(404, "Usuário convidante não encontrado.");
    }
    const invitation = await dbClient.insert('pkInvitations', {
        inviterId,
        inviterName: inviter.nickname || inviter.name,
        inviterAvatarUrl: inviter.avatar_url || '',
        inviteeId,
        status: 'pending',
        timestamp: new Date().toISOString(),
    });
    return createSuccessResponse(invitation);
});

router.get('/api/pk/invites/pending/:id', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const invitation = await dbClient.findOne('pkInvitations', i => i.inviteeId === userId && i.status === 'pending');
    return createSuccessResponse(invitation);
});

router.post('/api/pk/invites/:id/accept', async (id) => {
    const invitation = await dbClient.findOne('pkInvitations', i => i.id === id);
    if (!invitation || invitation.status !== 'pending') {
        return createErrorResponse(400, "Convite inválido ou expirado.");
    }
    
    await dbClient.update('pkInvitations', id, { status: 'accepted' });
    
    const [inviterLive, inviteeLive] = await Promise.all([
        dbClient.findOne('lives', l => l.user_id === invitation.inviterId && l.ao_vivo),
        dbClient.findOne('lives', l => l.user_id === invitation.inviteeId && l.ao_vivo)
    ]);

    if (!inviterLive || !inviteeLive) {
        return createErrorResponse(400, "Um dos streamers não está mais ao vivo.");
    }
    
    await dbClient.update('lives', inviterLive.id, { em_pk: true });
    await dbClient.update('lives', inviteeLive.id, { em_pk: true });

    const newPkSession = await dbClient.insert('pkSessions', {
        stream1Id: inviterLive.id,
        stream2Id: inviteeLive.id,
        score1: 0,
        score2: 0,
        startTime: new Date().toISOString(),
        endTime: null,
    });
    
    const battles = await getPkBattlesLogic();
    const newBattle = (battles.body as PkBattle[]).find(b => b.id === newPkSession.id);
    
    return createSuccessResponse(newBattle);
});

router.post('/api/pk/invites/:id/decline', async (id) => {
    await dbClient.update('pkInvitations', id, { status: 'declined' });
    return createSuccessResponse({ success: true });
});

router.get('/api/pk-battles/:id', async (idStr) => {
    const pkId = parseInt(idStr, 10);
    const battles = await getPkBattlesLogic();
    const battle = (battles.body as PkBattle[]).find(b => b.id === pkId);
    if (!battle) return createErrorResponse(404, "Batalha não encontrada.");
    return createSuccessResponse(battle);
});

router.get('/api/pk-sessions/:id', async (idStr) => {
    const pkId = parseInt(idStr, 10);
    const session = await dbClient.findOne('pkSessions', s => s.id === pkId);
    if (!session) return createErrorResponse(404, "Sessão PK não encontrada.");

    // Simulate score updates
    session.score1 += Math.floor(Math.random() * 50);
    session.score2 += Math.floor(Math.random() * 50);
    await dbClient.update('pkSessions', session.id, { score1: session.score1, score2: session.score2 });

    return createSuccessResponse(session);
});

router.get('/api/streams/:id/pk-session', async (idStr) => {
    const streamId = parseInt(idStr, 10);
    const session = await dbClient.findOne('pkSessions', s => (s.stream1Id === streamId || s.stream2Id === streamId) && s.endTime === null);
    return createSuccessResponse(session);
});


// --- Misc ---
router.get('/api/version', async () => createSuccessResponse(db.mockVersionInfo));
router.post('/api/users/generate-nickname', async () => createSuccessResponse({ newNickname: `User${Math.floor(Math.random() * 9000) + 1000}` }));
router.post('/api/users/generate-id', async () => createSuccessResponse({ newId: Math.floor(Math.random() * 90000000) + 10000000 }));

router.get('/api/users/:id/profile', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return createErrorResponse(404, 'Usuário não encontrado.');

    const liveStream = await dbClient.findOne('lives', l => l.user_id === userId && l.ao_vivo);
    const protectors = (db.mockProtectorsList[userId] || []).slice(0,3);

    const profile: PublicProfile = {
        id: user.id,
        name: user.name,
        nickname: user.nickname || user.name,
        avatarUrl: user.avatar_url || '',
        age: calculateAge(user.birthday),
        gender: user.gender,
        birthday: user.birthday,
        isLive: !!liveStream,
        isFollowing: false, // This should be set client-side based on current user
        coverPhotoUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        stats: { value: 123456, icon: 'moon' },
        badges: [
            { text: String(user.level), type: 'level' },
            { text: 'Top', type: 'top', icon: 'play' },
        ],
        protectors: protectors,
        achievements: [],
        personalityTags: [{id: '1', label: 'Amigável'}, {id: '2', label: 'Música'}],
        personalSignature: 'Vivendo a vida um stream de cada vez ✨'
    };
    if (user.gender) {
        profile.badges.unshift({ text: String(profile.age), type: 'gender_age', icon: user.gender });
    }
    return createSuccessResponse(profile);
});

router.get('/api/pk-event/details', async () => {
    const streamerRanking = db.mockPkRankingData.streamerRanking.map(s => ({
        ...s,
        score: s.score + Math.floor(Math.random() * 100),
    })).sort((a,b) => b.score - a.score).map((s,i) => ({ ...s, rank: i + 1 }));

    return createSuccessResponse({
        ...db.mockPkRankingData,
        streamerRanking,
    });
});

router.get('/api/users/:id/protectors', async (idStr) => {
    const userId = parseInt(idStr, 10);
    return createSuccessResponse(db.mockProtectorsList[userId] || []);
});

router.post('/api/users/follow', async (_, body) => {
    const { currentUserId, targetUserId } = body;
    const currentUser = await dbClient.findOne('users', u => u.id === currentUserId);
    if (!currentUser) return createErrorResponse(404, "Usuário atual não encontrado.");
    
    if (!currentUser.following.includes(targetUserId)) {
        currentUser.following.push(targetUserId);
        const updatedUser = await dbClient.update('users', currentUserId, { following: currentUser.following });
        
        const targetUser = await dbClient.findOne('users', u => u.id === targetUserId);
        if(targetUser) {
            await dbClient.update('users', targetUserId, { followers: (targetUser.followers || 0) + 1 });
        }
        
        return createSuccessResponse(updatedUser);
    }
    return createSuccessResponse(currentUser);
});

router.post('/api/users/unfollow', async (_, body) => {
    const { currentUserId, targetUserId } = body;
    const currentUser = await dbClient.findOne('users', u => u.id === currentUserId);
    if (!currentUser) return createErrorResponse(404, "Usuário atual não encontrado.");

    const index = currentUser.following.indexOf(targetUserId);
    if (index > -1) {
        currentUser.following.splice(index, 1);
        const updatedUser = await dbClient.update('users', currentUserId, { following: currentUser.following });

        const targetUser = await dbClient.findOne('users', u => u.id === targetUserId);
        if(targetUser) {
            await dbClient.update('users', targetUserId, { followers: Math.max(0, (targetUser.followers || 0) - 1) });
        }
        
        return createSuccessResponse(updatedUser);
    }
    return createSuccessResponse(currentUser);
});


router.put('/api/users/:id/withdrawal-method', async (idStr, body) => {
    const userId = parseInt(idStr, 10);
    const { method, account } = body;
    const user = await dbClient.update('users', userId, { withdrawal_method: { method, account }});
    if (!user) return createErrorResponse(404, "Usuário não encontrado.");
    return createSuccessResponse(user);
});

router.get('/api/users/:id/withdrawal-balance', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return createErrorResponse(404, "Usuário não encontrado.");
    
    const balance: WithdrawalBalance = {
        totalEarnings: user.wallet_earnings,
        pendingWithdrawals: 0, // Simplified for now
        availableBalance: user.wallet_earnings,
    };
    return createSuccessResponse(balance);
});

router.get('/api/users/:id/withdrawal-history', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const history = await dbClient.find('withdrawalTransactions', t => t.userId === userId);
    history.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return createSuccessResponse(history);
});

router.post('/api/withdrawals/initiate', async (_, body) => {
    const { userId, earningsToWithdraw } = body;
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user || !user.withdrawal_method) return createErrorResponse(400, "Usuário ou método de saque inválido.");
    if (user.wallet_earnings < earningsToWithdraw) return createErrorResponse(400, "Ganhos insuficientes.");
    
    const amount_brl = earningsToWithdraw * EARNING_TO_BRL_RATE;
    const fee_brl = amount_brl * WITHDRAWAL_FEE_RATE;
    const net_amount_brl = amount_brl - fee_brl;

    const transaction: Omit<WithdrawalTransaction, 'id'> = {
        userId,
        earnings_withdrawn: earningsToWithdraw,
        amount_brl,
        fee_brl,
        net_amount_brl,
        status: 'pending',
        timestamp: new Date().toISOString(),
        withdrawal_method: user.withdrawal_method,
    };
    
    const createdTransaction = await dbClient.insert('withdrawalTransactions', transaction);
    
    const updatedUser = await dbClient.update('users', userId, {
        wallet_earnings: user.wallet_earnings - earningsToWithdraw
    });

    return createSuccessResponse({ updatedUser, transaction: createdTransaction });
});


router.get('/api/users/:id/inventory', async (idStr) => {
    const userId = parseInt(idStr, 10);
    return createSuccessResponse(db.mockUserInventory[userId] || []);
});

router.post('/api/users/:id/equip-item', async (idStr, body) => {
    const userId = parseInt(idStr, 10);
    const { itemId } = body;
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return createErrorResponse(404, "Usuário não encontrado.");

    const newEquippedId = user.equipped_entry_effect_id === itemId ? null : itemId;
    const updatedUser = await dbClient.update('users', userId, { equipped_entry_effect_id: newEquippedId });
    return createSuccessResponse(updatedUser);
});

router.post('/api/lives/:id/special-entry', async (idStr, body) => {
    const liveId = parseInt(idStr, 10);
    const { userId } = body;
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user || !user.equipped_entry_effect_id) return createErrorResponse(400, "Usuário ou item não encontrado.");
    
    const item = db.mockUserInventory[userId]?.find(i => i.id === user.equipped_entry_effect_id);
    if (!item) return createErrorResponse(400, "Item não encontrado no inventário.");
    
    const entryMessage: ChatMessage = {
        id: (db.mockChatDatabase[liveId]?.length || 0) + 1,
        type: 'special_entry',
        username: user.nickname || user.name,
        userId: user.id,
        message: 'entrou na sala com um efeito especial!',
        giftName: item.name,
        giftAnimationUrl: item.imageUrl,
        timestamp: new Date().toISOString()
    };
    
    if (!db.mockChatDatabase[liveId]) db.mockChatDatabase[liveId] = [];
    db.mockChatDatabase[liveId].push(entryMessage);
    notifyChatMessageListeners(liveId, db.mockChatDatabase[liveId]);

    return createSuccessResponse({ success: true });
});

router.get('/api/support/conversation/:id', async (idStr) => {
    return createSuccessResponse(db.mockSupportConversation);
});

router.post('/api/support/messages', async (_, body) => {
    const { userId, text } = body;
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return createErrorResponse(404, "User not found");
    
    // User's message
    db.mockSupportConversation.messages.push({
        id: db.mockSupportConversation.messages.length + 1,
        senderId: userId,
        text,
        timestamp: new Date().toISOString(),
        status: 'sent',
        seenBy: [userId],
    });
    
    // Simulated auto-reply
    setTimeout(() => {
        db.mockSupportConversation.messages.push({
            id: db.mockSupportConversation.messages.length + 1,
            senderId: 0, // 0 for support
            text: "Obrigado por entrar em contato. Um agente responderá em breve.",
            timestamp: new Date().toISOString(),
            status: 'sent',
            seenBy: [],
        });
    }, 1500);

    return createSuccessResponse(db.mockSupportConversation);
});

router.post('/api/reports', async (_, body: ReportPayload) => {
    await dbClient.insert('reports', { ...body, timestamp: new Date().toISOString() });
    return createSuccessResponse({ success: true });
});
router.post('/api/suggestions', async (_, body: SuggestionPayload) => {
    await dbClient.insert('suggestions', { ...body, timestamp: new Date().toISOString() });
    return createSuccessResponse({ success: true });
});

router.get('/api/events', async (_, query) => {
    const status = new URLSearchParams(query).get('status') as EventStatus;
    const events = db.mockEvents.filter(e => e.status === status);
    return createSuccessResponse(events);
});
router.get('/api/events/:id', async (id) => {
    const event = db.mockEvents.find(e => e.id === id);
    if (!event) return createErrorResponse(404, "Evento não encontrado.");
    return createSuccessResponse(event);
});

router.get('/api/users/:id/level', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return createErrorResponse(404, "Usuário não encontrado.");
    
    const info: UserLevelInfo = {
        currentLevel: user.level,
        currentXp: user.xp,
        xpForNextLevel: levelService.getXpForLevel(user.level + 1),
    };
    return createSuccessResponse(info);
});

router.get('/api/ranking/streamers', async () => {
    const users = await dbClient.find('users', () => true);
    const streamers = users
        .sort((a,b) => b.followers - a.followers)
        .map((u, i): GeneralRankingStreamer => ({
            rank: i + 1,
            userId: u.id,
            username: u.nickname || u.name,
            avatarUrl: u.avatar_url || '',
            level: u.level,
            followers: u.followers
        }));
    return createSuccessResponse(streamers);
});
router.get('/api/ranking/users', async () => {
    const users = await dbClient.find('users', () => true);
    const rankedUsers = users
        .sort((a,b) => b.xp - a.xp)
        .map((u, i): GeneralRankingUser => ({
            rank: i + 1,
            userId: u.id,
            username: u.nickname || u.name,
            avatarUrl: u.avatar_url || '',
            level: u.level,
            xp: u.xp
        }));
    return createSuccessResponse(rankedUsers);
});

router.get('/api/lives/:id/viewers', async (idStr) => {
    const liveId = parseInt(idStr, 10);
    const userIds = Array.from(db.mockLiveConnections[liveId] || []);
    if (userIds.length === 0) return createSuccessResponse([]);

    const users = await dbClient.find('users', u => userIds.includes(u.id));
    const viewers: Viewer[] = users.map(u => ({
        id: u.id,
        name: u.nickname || u.name,
        avatarUrl: u.avatar_url || '',
        entryTime: new Date().toISOString(),
        contribution: Math.floor(Math.random() * 5000),
        level: u.level,
        level2: 1 // placeholder
    }));
    return createSuccessResponse(viewers);
});

router.get('/api/lives/:id/ranking', async (idStr) => {
    return createSuccessResponse([]); // Placeholder
});

router.post('/api/lives/:id/like', async (idStr, body) => {
    const liveId = parseInt(idStr, 10);
    if (!db.mockLikes[liveId]) db.mockLikes[liveId] = [];
    const like: Like = { id: db.mockLikes[liveId].length + 1, userId: body.userId, timestamp: new Date().toISOString() };
    db.mockLikes[liveId].push(like);
    return createSuccessResponse(like);
});

router.get('/api/lives/:id/summary', async (idStr) => {
    const liveId = parseInt(idStr, 10);
    const live = await dbClient.findOne('lives', l => l.id === liveId);
    if (!live) return createErrorResponse(404, "Live não encontrada.");
    
    const streamer = await dbClient.findOne('users', u => u.id === live.user_id);
    if (!streamer) return createErrorResponse(404, "Streamer não encontrado.");

    const summary: LiveEndSummary = {
        streamerId: streamer.id,
        streamerName: streamer.nickname || streamer.name,
        streamerAvatarUrl: streamer.avatar_url || '',
        durationSeconds: Math.floor((new Date().getTime() - new Date(live.inicio).getTime()) / 1000),
        peakViewers: live.espectadores + Math.floor(Math.random() * 20),
        totalEarnings: (live.received_gifts_value || 0) + Math.floor(Math.random() * 500),
        newFollowers: Math.floor(Math.random() * 5),
        newMembers: Math.floor(Math.random() * 2),
        newFans: Math.floor(Math.random() * 10),
    };
    return createSuccessResponse(summary);
});

router.get('/api/users/:id/live-status', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const live = await dbClient.findOne('lives', l => l.user_id === userId && l.ao_vivo);
    return createSuccessResponse(!!live);
});

router.get('/api/users/:id/following-live-status', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return createSuccessResponse([]);
    
    const followingIds = user.following;
    const lives = await dbClient.find('lives', l => l.ao_vivo && followingIds.includes(l.user_id));
    const liveUserIds = new Set(lives.map(l => l.user_id));

    const updates: LiveFollowUpdate[] = followingIds.map(id => {
        const isLive = liveUserIds.has(id);
        const stream = isLive ? mapDbLiveToStream(lives.find(l => l.user_id === id)!) : null;
        return { userId: id, isLive, stream };
    });
    return createSuccessResponse(updates);
});

router.get('/api/users/:id/active-stream', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const live = await dbClient.findOne('lives', l => l.user_id === userId && l.ao_vivo);
    return createSuccessResponse(live ? mapDbLiveToStream(live) : null);
});

router.get('/api/users/:id/lives', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const lives = await dbClient.find('lives', l => l.user_id === userId);
    return createSuccessResponse(lives.map(mapDbLiveToStream));
});

router.post('/api/lives/thumbnail', async (_, body) => {
    return createSuccessResponse({ thumbnailUrl: body.thumbnailBase64 });
});

router.post('/api/lives/:id/pay-entry', async (idStr, body) => {
    const liveId = parseInt(idStr, 10);
    const { viewerId } = body;
    const live = await dbClient.findOne('lives', l => l.id === liveId);
    if (!live || !live.is_private || !live.entry_fee) return createErrorResponse(400, "Esta não é uma live privada paga.");
    
    const viewer = await dbClient.findOne('users', u => u.id === viewerId);
    if (!viewer) return createErrorResponse(404, "Usuário não encontrado.");
    
    if (viewer.wallet_diamonds < live.entry_fee) return createErrorResponse(402, "Diamantes insuficientes.");

    const updatedViewer = await dbClient.update('users', viewerId, { wallet_diamonds: viewer.wallet_diamonds - live.entry_fee });
    await dbClient.update('users', live.user_id, { wallet_earnings: db.mockUserDatabase.find(u=>u.id === live.user_id)!.wallet_earnings + live.entry_fee });

    return createSuccessResponse(updatedViewer);
});

router.post('/api/lives/:id/invite', async (idStr, body) => {
    const liveId = parseInt(idStr, 10);
    const { inviteeId } = body;
    const live = await dbClient.findOne('lives', l => l.id === liveId);
    if (!live) return createErrorResponse(404, "Live não encontrada.");
    
    if (!live.invited_users) live.invited_users = [];
    if (!live.invited_users.includes(inviteeId)) {
        live.invited_users.push(inviteeId);
        await dbClient.update('lives', liveId, { invited_users: live.invited_users });
    }
    return createSuccessResponse({ success: true });
});

router.get('/api/users/:id/pk-preference', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const isEnabled = db.mockPkPreferences[userId] ?? true;
    return createSuccessResponse({ isPkEnabled: isEnabled });
});

router.patch('/api/users/:id/pk-preference', async (idStr, body) => {
    const userId = parseInt(idStr, 10);
    db.mockPkPreferences[userId] = body.isPkEnabled;
    return createSuccessResponse({ success: true });
});

router.get('/api/users/:id/private-live-invite-settings', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const settings = await dbClient.findOne('privateLiveInviteSettings', s => s.userId === userId);
    if (settings) {
        return createSuccessResponse(settings);
    }
    const defaultSettings = { userId, privateInvites: true, onlyFollowing: true, onlyFans: false, onlyFriends: false };
    await dbClient.insert('privateLiveInviteSettings', defaultSettings);
    return createSuccessResponse(defaultSettings);
});

router.put('/api/users/:id/private-live-invite-settings', async (idStr, body) => {
    const userId = parseInt(idStr, 10);
    const updated = await dbClient.update('privateLiveInviteSettings', userId, body);
    return createSuccessResponse(updated);
});

router.get('/api/users/:id/notification-settings', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const settings = await dbClient.findOne('notificationSettings', s => s.userId === userId);
    if (settings) {
        return createSuccessResponse(settings);
    }
    const defaultSettings = { userId, newMessages: true, streamerLive: true, followedPost: true, order: true, interactive: true };
    await dbClient.insert('notificationSettings', defaultSettings);
    return createSuccessResponse(defaultSettings);
});

router.patch('/api/users/:id/notification-settings', async (idStr, body) => {
    const userId = parseInt(idStr, 10);
    const updated = await dbClient.update('notificationSettings', userId, body);
    return createSuccessResponse(updated);
});

router.get('/api/users/:id/push-settings', async (idStr) => {
    const userId = parseInt(idStr, 10);
    return createSuccessResponse(db.mockPushSettings[userId] || {});
});

router.patch('/api/users/:id/push-settings', async (idStr, body) => {
    const userId = parseInt(idStr, 10);
    const { followedUserId, enabled } = body;
    if (!db.mockPushSettings[userId]) {
        db.mockPushSettings[userId] = {};
    }
    db.mockPushSettings[userId][followedUserId] = enabled;
    return createSuccessResponse({ success: true });
});

router.get('/api/help/articles/:id', async (id) => {
    const article = db.mockHelpArticles.find(a => a.id === id);
    if (article) return createSuccessResponse(article);
    // Generic FAQ fallback
    return createSuccessResponse({ id: 'faq', title: 'Perguntas Frequentes', content: '<p>Nossos artigos de ajuda estão sendo atualizados. Por favor, entre em contato com o suporte ao vivo para assistência imediata.</p>' });
});

router.get('/api/users/:id/daily-rewards', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const status = db.mockUserRewardsStatus[userId] || null;
    let canClaimToday = false;
    if (!status) {
        canClaimToday = true;
    } else {
        const lastClaimDate = new Date(status.lastClaimTimestamp);
        const today = new Date();
        if (today.toDateString() !== lastClaimDate.toDateString()) {
            canClaimToday = true;
        }
    }
    return createSuccessResponse({ rewards: db.mockDailyRewards, status, canClaimToday });
});

router.post('/api/users/:id/daily-rewards/claim', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const status = db.mockUserRewardsStatus[userId] || { lastClaimedDay: 0, streak: 0, lastClaimTimestamp: '' };
    const today = new Date();
    if (status.lastClaimTimestamp && new Date(status.lastClaimTimestamp).toDateString() === today.toDateString()) {
        return createErrorResponse(400, "Recompensa de hoje já coletada.");
    }
    
    const lastClaimDate = status.lastClaimTimestamp ? new Date(status.lastClaimTimestamp) : new Date(0);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let newStreak = (lastClaimDate.toDateString() === yesterday.toDateString()) ? status.streak + 1 : 1;
    if (newStreak > 7) newStreak = 1;

    const claimedReward = db.mockDailyRewards.find(r => r.day === newStreak);
    if (!claimedReward) return createErrorResponse(500, "Configuração de recompensa inválida.");
    
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return createErrorResponse(404, "Usuário não encontrado.");
    
    let updatedUser = user;
    if (claimedReward.type === 'diamonds' && claimedReward.amount) {
        updatedUser = await dbClient.update('users', userId, { wallet_diamonds: user.wallet_diamonds + claimedReward.amount }) as User;
    } else if (claimedReward.type === 'item' && claimedReward.itemId) {
        // Add to inventory logic here if it existed
    }
    
    db.mockUserRewardsStatus[userId] = {
        lastClaimedDay: newStreak,
        streak: newStreak,
        lastClaimTimestamp: today.toISOString(),
    };
    
    return createSuccessResponse({ updatedUser, claimedReward });
});

router.post('/api/lives/:id/mute', async (idStr, body) => {
    const liveId = parseInt(idStr, 10);
    const { targetUserId, mute, durationMinutes } = body;
    if (!db.mockMutedUsersInLive[liveId]) db.mockMutedUsersInLive[liveId] = {};
    
    let mutedUntil;
    if (mute) {
        const mutedDate = new Date();
        mutedDate.setMinutes(mutedDate.getMinutes() + durationMinutes);
        mutedUntil = mutedDate.toISOString();
        db.mockMutedUsersInLive[liveId][targetUserId] = { mutedUntil };
    } else {
        delete db.mockMutedUsersInLive[liveId][targetUserId];
    }
    
    notifyMuteStatusListeners({ liveId, userId: targetUserId, isMuted: mute, mutedUntil });
    return createSuccessResponse({ success: true });
});

router.post('/api/lives/:id/kick', async (idStr, body) => {
    const liveId = parseInt(idStr, 10);
    const { targetUserId } = body;
    if (!db.mockKickedUsersFromLive[liveId]) db.mockKickedUsersFromLive[liveId] = [];
    if (!db.mockKickedUsersFromLive[liveId].includes(targetUserId)) {
        db.mockKickedUsersFromLive[liveId].push(targetUserId);
    }
    
    notifyUserKickedListeners({ liveId, kickedUserId: targetUserId });
    return createSuccessResponse({ success: true });
});

router.post('/api/lives/:id/sound-effect', async (idStr, body) => {
    const liveId = parseInt(idStr, 10);
    const { triggeredBy, effectName } = body;
    notifySoundEffectListeners({ liveId, triggeredBy, effectName });
    // Log it
    if(!db.mockSoundEffectLog[liveId]) db.mockSoundEffectLog[liveId] = [];
    const logEntry: Omit<SoundEffectLogEntry, 'id'> = {
        liveId,
        effectName,
        triggeredBy,
        timestamp: new Date().toISOString()
    };
    db.mockSoundEffectLog[liveId].push({ ...logEntry, id: db.mockSoundEffectLog[liveId].length + 1 });
    return createSuccessResponse({ success: true });
});

router.post('/api/live/switch-camera', async (_, body) => {
    const { liveId, userId } = body;
    const live = await dbClient.findOne('lives', l => l.id === liveId && l.user_id === userId);
    if (!live) return createErrorResponse(403, "Apenas o anfitrião pode trocar a câmera.");

    const newFacingMode: FacingMode = live.camera_facing_mode === 'user' ? 'environment' : 'user';
    await dbClient.update('lives', liveId, { camera_facing_mode: newFacingMode });
    await dbClient.update('users', userId, { last_camera_used: newFacingMode });

    return createSuccessResponse({ newFacingMode });
});

router.post('/api/live/toggle-voice', async (_, body) => {
    const { liveId, userId } = body;
    const live = await dbClient.findOne('lives', l => l.id === liveId && l.user_id === userId);
    if (!live) return createErrorResponse(403, "Apenas o anfitrião pode alterar a voz.");

    const voiceEnabled = !(live.voice_enabled ?? false);
    await dbClient.update('lives', liveId, { voice_enabled: voiceEnabled });
    return createSuccessResponse({ voiceEnabled });
});

router.get('/api/ranking/hourly', async (_, query) => {
    const liveId = parseInt(new URLSearchParams(query).get('liveId') || '0', 10);
    const region = new URLSearchParams(query).get('region') || 'brazil';
    
    // Create some fake data for demonstration
    const podium: UniversalRankingUser[] = [
        { rank: 1, userId: 1203, avatarUrl: db.mockUserDatabase.find(u=>u.id===1203)!.avatar_url!, name: db.mockUserDatabase.find(u=>u.id===1203)!.nickname!, score: 125678, level: 32, gender: 'female', badges: [{type:'flag', value:'🇺🇸'}, {type:'v_badge', value: 'V'}, {type:'level', value: 32}] },
        { rank: 2, userId: 1202, avatarUrl: db.mockUserDatabase.find(u=>u.id===1202)!.avatar_url!, name: db.mockUserDatabase.find(u=>u.id===1202)!.nickname!, score: 98765, level: 10, gender: 'female', badges: [{type:'flag', value:'🇵🇹'}, {type:'level', value: 10}] },
        { rank: 3, userId: 1201, avatarUrl: db.mockUserDatabase.find(u=>u.id===1201)!.avatar_url!, name: db.mockUserDatabase.find(u=>u.id===1201)!.nickname!, score: 54321, level: 3, gender: 'male', badges: [{type:'flag', value:'🇧🇷'}, {type:'level', value: 3}, {type:'gender', value: 'male'}] },
    ];
    const list: UniversalRankingUser[] = [];
    for (let i = 4; i <= 20; i++) {
        const user = db.mockUserDatabase[i % db.mockUserDatabase.length];
        list.push({ rank: i, userId: user.id, avatarUrl: user.avatar_url!, name: user.nickname!, score: 54321 - (i * 1000), level: user.level, gender: user.gender, badges: [{type:'flag', value:'🇧🇷'}, {type:'level', value: user.level}, {type:'gender', value: user.gender as string}] });
    }
    
    const currentUserRanking: UniversalRankingUser = { rank: '50+', userId: 10755083, avatarUrl: db.mockUserDatabase.find(u=>u.id===10755083)!.avatar_url!, name: db.mockUserDatabase.find(u=>u.id===10755083)!.nickname!, score: 1234, level: 45, gender: 'male', badges: [{type:'flag', value:'🇧🇷'}, {type:'level', value: 45}] };
    
    const data: UniversalRankingData = {
        podium,
        list,
        currentUserRanking,
        countdown: '00:32:15',
        footerButtons: {
            primary: { text: "1º Lugar", value: '1060' },
            secondary: { text: "Entrar na lista", value: '203' }
        }
    };
    return createSuccessResponse(data);
});

router.get('/api/ranking/user-list', async (_, query) => {
    const period = new URLSearchParams(query).get('period') || 'daily';
    // Just return some fake data for now
    const podium: UniversalRankingUser[] = [
        { rank: 1, userId: 401, avatarUrl: db.mockUserDatabase.find(u=>u.id===401)!.avatar_url!, name: db.mockUserDatabase.find(u=>u.id===401)!.nickname!, score: 512000, level: 82, gender: 'female', badges: [{type:'flag', value:'🇧🇷'}, {type:'level', value: 82}] },
        { rank: 2, userId: 404, avatarUrl: db.mockUserDatabase.find(u=>u.id===404)!.avatar_url!, name: db.mockUserDatabase.find(u=>u.id===404)!.nickname!, score: 450000, level: 95, gender: 'male', badges: [{type:'flag', value:'🇺🇸'}, {type:'level', value: 95}] },
        { rank: 3, userId: 402, avatarUrl: db.mockUserDatabase.find(u=>u.id===402)!.avatar_url!, name: db.mockUserDatabase.find(u=>u.id===402)!.nickname!, score: 120000, level: 65, gender: 'female', badges: [{type:'flag', value:'🇵🇹'}, {type:'level', value: 65}] },
    ];
    return createSuccessResponse({ podium, list: [] });
});

router.post('/api/ranking/help-host', async (_, body) => {
    const { helperId, hostId, giftValue } = body;
    const helper = await dbClient.findOne('users', u => u.id === helperId);
    if (!helper) return createErrorResponse(404, "Helper not found.");
    if (helper.wallet_diamonds < giftValue) {
        return createSuccessResponse({ success: false, updatedUser: null, message: "Diamantes insuficientes." });
    }
    const updatedUser = await dbClient.update('users', helperId, { wallet_diamonds: helper.wallet_diamonds - giftValue });
    // In a real scenario, this would update the host's score in the ranking table.
    // For now, we just log it.
    console.log(`[API] User ${helperId} helped host ${hostId} with ${giftValue} diamonds.`);
    return createSuccessResponse({ success: true, updatedUser, message: "Ajuda enviada!" });
});


export const mockApi = async (url: string, options?: RequestInit): Promise<ApiResponse> => {
  const method = options?.method || 'GET';
  const urlParts = url.split('?');
  const path = urlParts[0];
  const query = urlParts[1] ? `?${urlParts[1]}` : '';
  
  const body = options?.body ? JSON.parse(options.body as string) : {};

  for (const routePath in routes[method]) {
    const paramMatch = routePath.match(/:(\w+)/);
    if (paramMatch) {
      const routeRegex = new RegExp(`^${routePath.replace(paramMatch[0], '([^/]+)')}$`);
      const pathMatch = path.match(routeRegex);
      if (pathMatch) {
        const paramValue = pathMatch[1];
        return routes[method][routePath](paramValue, body, query);
      }
    } else if (path === routePath) {
      return routes[method][routePath]('', body, query);
    }
  }

  return createErrorResponse(404, `Endpoint não encontrado: ${method} ${path}`);
};

export const getDbState = () => dbClient.getRawDb();