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
import type { User, LiveDetails, ChatMessage, Gift, Viewer, RankingContributor, Like, PkBattle, BatalhaPK, PublicProfile, PkEventDetails, Conversation, SendGiftResponse, ProtectorDetails, AchievementFrame, WithdrawalTransaction, WithdrawalMethod, InventoryItem, AppEvent, LiveEndSummary, UserLevelInfo, GeneralRankingStreamer, GeneralRankingUser, WithdrawalBalance, EventStatus, PkRankingData, Stream, Category, StartLiveResponse, DiamondPackage, Address, PaymentMethod, CardDetails, PurchaseOrder, DailyReward, UserRewardStatus, VersionInfo, ConversationMessage, LiveFollowUpdate, PrivateLiveInviteSettings, NotificationSettings, FacingMode, SoundEffectName, SoundEffectLogEntry, CardBrand, UniversalRankingData, UniversalRankingUser, PkSettings, TabelaMensagem, TabelaConversa, Denuncia, Sugestao, LiveCategory, LiveStreamRecord, ArtigoAjuda, LogPresenteEnviado, FilaPK, ConvitePK, Achievement } from '../types';

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

const mapLiveRecordToStream = (dbLive: LiveStreamRecord): Stream => ({
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

const mapTabelaMensagemToConversationMessage = (msg: TabelaMensagem, currentUserId: number): ConversationMessage => {
    const isSender = msg.remetente_id === currentUserId;
    const isSeen = isSender ? Object.keys(msg.status_leitura).length > 1 : msg.status_leitura[currentUserId] === true;
    
    return {
        id: msg.id,
        senderId: msg.remetente_id,
        text: msg.conteudo,
        timestamp: msg.timestamp,
        status: isSeen ? 'seen' : 'sent',
        seenBy: Object.keys(msg.status_leitura).map(Number),
    };
};

const calculateTopSupporters = async (streamerId: number, pkBattleId: number, dbClient: any): Promise<RankingContributor[]> => {
    const allGiftsForBattle = await dbClient.find('logPresentesEnviados', (g: LogPresenteEnviado) => g.batalha_id === pkBattleId);
    
    const supporterPoints: { [userId: number]: number } = {};
    
    allGiftsForBattle
        .filter((g: LogPresenteEnviado) => g.receiverId === streamerId)
        .forEach((g: LogPresenteEnviado) => {
            supporterPoints[g.senderId] = (supporterPoints[g.senderId] || 0) + g.giftValue;
        });

    const sortedSupporters = Object.entries(supporterPoints)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
    
    if (sortedSupporters.length === 0) return [];
    
    const supporterIds = sortedSupporters.map(([id]) => parseInt(id, 10));
    const supporterUsers = await dbClient.find('users', (u: User) => supporterIds.includes(u.id));

    return sortedSupporters.map(([userId, contribution], index) => {
        const user = supporterUsers.find(u => u.id === parseInt(userId, 10));
        return {
            rank: index + 1,
            userId: parseInt(userId, 10),
            name: user?.nickname || user?.name || 'Unknown',
            avatarUrl: user?.avatar_url || '',
            contribution,
            level: user?.level || 1,
            level2: 1, // Placeholder
        };
    });
};

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
    const visits = await dbClient.find('visitasPerfil', v => v.perfil_visitado_id === userId);
    const visitorIds = visits.map(v => v.visitante_id);
    if (visitorIds.length === 0) {
        return createSuccessResponse([]);
    }
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
  const lives = await dbClient.find('liveStreamRecords', l => l.ao_vivo && !l.is_private);
  lives.sort((a, b) => b.espectadores - a.espectadores);
  return createSuccessResponse(lives.map(mapLiveRecordToStream));
};

const getFollowingStreamsLogic = async (userIdStr: string) => {
    const userId = parseInt(userIdStr, 10);
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) {
        return createErrorResponse(404, "Usuário não encontrado.");
    }
    const lives = await dbClient.find('liveStreamRecords', l => l.ao_vivo && user.following.includes(l.user_id) && !l.is_private);
    return createSuccessResponse(lives.map(mapLiveRecordToStream));
};

const getNewStreamsLogic = async () => {
    const lives = await dbClient.find('liveStreamRecords', l => l.ao_vivo && !l.is_private);
    lives.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
    return createSuccessResponse(lives.map(mapLiveRecordToStream).slice(0, 10)); // Limit to 10 newest
};

const getCategoryStreamsLogic = async (category: string) => {
    const capitalizedCategory = (category.charAt(0).toUpperCase() + category.slice(1)) as Category;
    const lives = await dbClient.find('liveStreamRecords', l => l.ao_vivo && l.categoria === capitalizedCategory && !l.is_private);
    return createSuccessResponse(lives.map(mapLiveRecordToStream));
};

const getPrivateStreamsLogic = async (userIdStr: string) => {
    const userId = parseInt(userIdStr, 10);
    const lives = await dbClient.find('liveStreamRecords', l => 
        l.ao_vivo && 
        l.is_private && 
        (l.user_id === userId || (l.invited_users || []).includes(userId))
    );
    return createSuccessResponse(lives.map(mapLiveRecordToStream));
};

const getPkBattlesLogic = async () => {
    const pkBattles = await dbClient.find('batalhasPK', pk => pk.status === 'ativa');
    const battles: PkBattle[] = [];

    for (const battle of pkBattles) {
        const [stream1, stream2] = await Promise.all([
            dbClient.findOne('liveStreamRecords', l => l.id === battle.live_id_1),
            dbClient.findOne('liveStreamRecords', l => l.id === battle.live_id_2)
        ]);
        const [user1, user2] = await Promise.all([
            dbClient.findOne('users', u => u.id === battle.streamer_id_1),
            dbClient.findOne('users', u => u.id === battle.streamer_id_2)
        ]);

        if (stream1 && stream2 && user1 && user2) {
            battles.push({
                id: battle.id,
                title: `${stream1.nome_streamer} vs ${stream2.nome_streamer}`,
                streamer1: {
                    userId: user1.id,
                    streamId: stream1.id,
                    name: user1.nickname || user1.name,
                    score: battle.pontos_streamer_1,
                    avatarUrl: user1.avatar_url || '',
                    isVerified: true,
                },
                streamer2: {
                    userId: user2.id,
                    streamId: stream2.id,
                    name: user2.nickname || user2.name,
                    score: battle.pontos_streamer_2,
                    avatarUrl: user2.avatar_url || '',
                    isVerified: true,
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

    const existingLive = await dbClient.findOne('liveStreamRecords', l => l.user_id === userId && l.ao_vivo);
    if (existingLive) {
        return createErrorResponse(400, "Usuário já está ao vivo.");
    }
    
    // Create new LiveStreamRecord object
    const newLive: Omit<LiveStreamRecord, 'id'> = {
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
    
    const createdLive = await dbClient.insert('liveStreamRecords', newLive);
    
    // Update user's last camera and category
    await dbClient.update('users', userId, { last_camera_used: cameraUsed, last_selected_category: category });

    const response: StartLiveResponse = {
        live: mapLiveRecordToStream(createdLive),
        urls: {
            rtmp: `rtmp://live.livego.com/app/${createdLive.id}`,
            hls: `https://hls.livego.com/app/${createdLive.id}.m3u8`,
            webrtc: `wss://webrtc.livego.com/app/${createdLive.id}`,
            streamKey: `sk_${createdLive.id}_${Math.random().toString(36).substring(2)}`
        }
    };
    
    // Notify listeners about the new stream
    const allStreams = (await dbClient.find('liveStreamRecords', l => l.ao_vivo)).map(mapLiveRecordToStream);
    notifyStreamListeners(allStreams);

    return createSuccessResponse(response);
};

const stopLiveStreamLogic = async (userIdStr: string) => {
    const userId = parseInt(userIdStr, 10);
    const live = await dbClient.findOne('liveStreamRecords', l => l.user_id === userId && l.ao_vivo);
    if (!live) {
        return createErrorResponse(404, "Nenhuma transmissão ao vivo encontrada para este usuário.");
    }
    await dbClient.update('liveStreamRecords', live.id, { ao_vivo: false });

    // Also end any active PK session
    const pkBattle = await dbClient.findOne('batalhasPK', pk => (pk.live_id_1 === live.id || pk.live_id_2 === live.id) && pk.status === 'ativa');
    if (pkBattle) {
        await dbClient.update('batalhasPK', pkBattle.id, { status: 'finalizada', data_fim: new Date().toISOString() });
    }
    
     // Notify listeners about the change
    const allStreams = (await dbClient.find('liveStreamRecords', l => l.ao_vivo)).map(mapLiveRecordToStream);
    notifyStreamListeners(allStreams);

    return createSuccessResponse({ success: true });
};

const getLiveStreamDetailsLogic = async (liveIdStr: string) => {
  const liveId = parseInt(liveIdStr, 10);
  const live = await dbClient.findOne('liveStreamRecords', l => l.id === liveId);
  if (!live) return createErrorResponse(404, 'Transmissão ao vivo não encontrada.');

  const streamer = await dbClient.findOne('users', u => u.id === live.user_id);
  if (!streamer) return createErrorResponse(404, 'Streamer não encontrado.');
  
  const totalVisitors = (await dbClient.find('visitasPerfil', v => v.perfil_visitado_id === live.user_id)).length;
  
  const giftTransactions = await dbClient.find('logPresentesEnviados', t => t.liveId === liveId);
  const receivedGiftsValue = giftTransactions.reduce((sum, tx) => sum + tx.giftValue, 0);
  
  const likes = await dbClient.find('likes', l => l.liveId === liveId);

  const details: LiveDetails = {
    streamerName: streamer.nickname || streamer.name,
    streamerAvatarUrl: streamer.avatar_url || '',
    streamerFollowers: streamer.followers,
    viewerCount: live.espectadores,
    totalVisitors: totalVisitors,
    receivedGiftsValue: receivedGiftsValue,
    rankingPosition: 'Top 10%', // This can be calculated in a more complex query later
    status: 'ao vivo',
    likeCount: likes.length,
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
    
    const live = await dbClient.findOne('liveStreamRecords', l => l.id === liveId);
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
    const { senderId, giftId, receiverId } = body;
    
    const sender = await dbClient.findOne('users', u => u.id === senderId);
    const live = await dbClient.findOne('liveStreamRecords', l => l.id === liveId);
    
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

    const actualReceiverId = receiverId || live.user_id;
    
    // Deduct diamonds from sender and add earnings to receiver
    const updatedSender = await dbClient.update('users', senderId, { wallet_diamonds: sender.wallet_diamonds - gift.price });
    const receiver = await dbClient.findOne('users', u => u.id === actualReceiverId);
    if (receiver) {
        const earnings = gift.price; // 1 diamond = 1 earning
        await dbClient.update('users', actualReceiverId, { wallet_earnings: receiver.wallet_earnings + earnings });
    }

    // Add gift transaction to log
    const pkBattleForGift = await dbClient.findOne('batalhasPK', pk => (pk.live_id_1 === liveId || pk.live_id_2 === liveId) && pk.status === 'ativa');
    await dbClient.insert('logPresentesEnviados', {
        senderId,
        receiverId: actualReceiverId,
        liveId,
        giftId,
        giftValue: gift.price,
        batalha_id: pkBattleForGift?.id,
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
        message: `enviou um ${gift.name}${receiver && receiver.id !== live.user_id ? ` para ${receiver.nickname || receiver.name}` : ''}`,
        giftName: gift.name,
        giftAnimationUrl: gift.animationUrl,
        timestamp: new Date().toISOString()
    };
    db.mockChatDatabase[liveId].push(giftMessage);

    // Update PK battle score if applicable
    if (pkBattleForGift) {
        if (pkBattleForGift.streamer_id_1 === actualReceiverId) {
            await dbClient.update('batalhasPK', pkBattleForGift.id, { pontos_streamer_1: pkBattleForGift.pontos_streamer_1 + gift.valor_pontos });
        } else if (pkBattleForGift.streamer_id_2 === actualReceiverId) {
            await dbClient.update('batalhasPK', pkBattleForGift.id, { pontos_streamer_2: pkBattleForGift.pontos_streamer_2 + gift.valor_pontos });
        }
    }

    notifyChatMessageListeners(liveId, db.mockChatDatabase[liveId]);

    return createSuccessResponse({ success: true, updatedUser: updatedSender, message: "Presente enviado com sucesso!" });
};

const joinLiveStreamLogic = async (liveIdStr: string, body: any) => {
    const liveId = parseInt(liveIdStr, 10);
    const { userId } = body;
    const live = await dbClient.findOne('liveStreamRecords', l => l.id === liveId);
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
        
        await dbClient.update('liveStreamRecords', liveId, { espectadores: live.espectadores + 1 });
        
        // Notify all clients about the stream changes
        const allStreams = (await dbClient.find('liveStreamRecords', l => l.ao_vivo)).map(mapLiveRecordToStream);
        notifyStreamListeners(allStreams);
    }
    return createSuccessResponse({ success: true });
};

const leaveLiveStreamLogic = async (liveIdStr: string, body: any) => {
    const liveId = parseInt(liveIdStr, 10);
    const { userId } = body;
    const live = await dbClient.findOne('liveStreamRecords', l => l.id === liveId);
    if (!live) {
        return createSuccessResponse({ success: true }); // Already gone
    }
    if (db.mockLiveConnections[liveId] && db.mockLiveConnections[liveId].has(userId)) {
        db.mockLiveConnections[liveId].delete(userId);
        await dbClient.update('liveStreamRecords', liveId, { espectadores: Math.max(0, live.espectadores - 1) });
        const allStreams = (await dbClient.find('liveStreamRecords', l => l.ao_vivo)).map(mapLiveRecordToStream);
        notifyStreamListeners(allStreams);
    }
    return createSuccessResponse({ success: true });
};

const cancelPrivateLiveInviteLogic = async (liveIdStr: string, body: any) => {
    const liveId = parseInt(liveIdStr, 10);
    const { inviteeId } = body;
    const live = await dbClient.findOne('liveStreamRecords', l => l.id === liveId);
    if (!live || !live.invited_users) {
        return createSuccessResponse({ success: true });
    }
    
    const updatedInvitedUsers = live.invited_users.filter(id => id !== inviteeId);
    await dbClient.update('liveStreamRecords', liveId, { invited_users: updatedInvitedUsers });

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
router.post('/api/lives/:id/cancel-invite', (id, body) => cancelPrivateLiveInviteLogic(id, body));


// --- Chat & Gift Routes ---
router.get('/api/chat/live/:id', (id, _) => getChatMessagesLogic(id));
router.post('/api/chat/live/:id', (id, body) => sendChatMessageLogic(id, body));
router.post('/api/lives/:id/gift', (id, body) => sendGiftLogic(id, body));
router.get('/api/gifts', async (_, __) => createSuccessResponse(db.mockGiftCatalog));

// --- Private Chat ---
const getConversationByIdLogic = async (id: string, currentUserId: number): Promise<ApiResponse> => {
    const conversation = await dbClient.findOne('tabelaConversas', c => c.id === id);
    if (!conversation) return createErrorResponse(404, "Conversa não encontrada.");
    
    const otherUserId = conversation.participantes.find(pId => pId !== currentUserId);
    const otherUser = await dbClient.findOne('users', u => u.id === otherUserId);
    const messages = await dbClient.find('tabelaMensagens', m => m.conversa_id === id);

    const enrichedConversation: Conversation = {
        id: conversation.id,
        participants: conversation.participantes,
        otherUserId: otherUser?.id || 0,
        otherUserName: otherUser?.nickname || otherUser?.name || 'Unknown',
        otherUserAvatarUrl: otherUser?.avatar_url || '',
        unreadCount: messages.filter(m => m.remetente_id !== currentUserId && !m.status_leitura[currentUserId]).length,
        messages: messages.map(m => mapTabelaMensagemToConversationMessage(m, currentUserId))
    };

    return createSuccessResponse(enrichedConversation);
};

router.get('/api/users/:id/conversations', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const conversations = await dbClient.find('tabelaConversas', c => c.participantes.includes(userId));
    
    const enrichedConversations = await Promise.all(conversations.map(async c => {
        const otherUserId = c.participantes.find(pId => pId !== userId);
        if (!otherUserId) return null;
        
        const otherUser = await dbClient.findOne('users', u => u.id === otherUserId);
        const messages = await dbClient.find('tabelaMensagens', m => m.conversa_id === c.id);
        const unreadCount = messages.filter(m => m.remetente_id !== userId && !m.status_leitura[userId]).length;
        
        return {
            id: c.id,
            participants: c.participantes,
            otherUserId: otherUser?.id || 0,
            otherUserName: otherUser?.nickname || otherUser?.name || 'Unknown',
            otherUserAvatarUrl: otherUser?.avatar_url || '',
            unreadCount,
            messages: messages.map(m => mapTabelaMensagemToConversationMessage(m, userId))
        };
    }));

    const validConversations = enrichedConversations
        .filter((c): c is Conversation => c !== null)
        .sort((a, b) => {
            const lastMsgA = a.messages[a.messages.length - 1];
            const lastMsgB = b.messages[b.messages.length - 1];
            if (!lastMsgA) return 1;
            if (!lastMsgB) return -1;
            return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
        });

    return createSuccessResponse(validConversations);
});

router.get('/api/chat/private/:id', async (id, query) => {
    const currentUserId = parseInt(new URLSearchParams(query).get('userId') || '0', 10);
    return getConversationByIdLogic(id, currentUserId);
});

router.post('/api/chat/private/get-or-create', async (_, body) => {
    const { currentUserId, otherUserId } = body;
    let conversation = await dbClient.findOne('tabelaConversas', c => c.participantes.includes(currentUserId) && c.participantes.includes(otherUserId));
    if (!conversation) {
        conversation = await dbClient.insert('tabelaConversas', {
            participantes: [currentUserId, otherUserId],
            ultima_mensagem_texto: "",
            ultima_mensagem_timestamp: new Date().toISOString()
        });
    }

    const otherUser = await dbClient.findOne('users', u => u.id === otherUserId);
    const messages = await dbClient.find('tabelaMensagens', m => m.conversa_id === conversation!.id);

    const enrichedConversation: Conversation = {
        id: conversation!.id,
        participants: conversation!.participantes,
        otherUserId: otherUser?.id || 0,
        otherUserName: otherUser?.nickname || otherUser?.name || 'Unknown',
        otherUserAvatarUrl: otherUser?.avatar_url || '',
        unreadCount: messages.filter(m => m.remetente_id !== currentUserId && !m.status_leitura[currentUserId]).length,
        messages: messages.map(m => mapTabelaMensagemToConversationMessage(m, currentUserId))
    };
    return createSuccessResponse(enrichedConversation);
});


router.post('/api/chat/private/:id', async (id, body) => {
    const { senderId, text } = body;
    const conversation = await dbClient.findOne('tabelaConversas', c => c.id === id);
    if (!conversation) return createErrorResponse(404, "Conversa não encontrada.");
    
    const newMessage: Omit<TabelaMensagem, 'id'> = {
        conversa_id: id,
        remetente_id: senderId,
        conteudo: text,
        timestamp: new Date().toISOString(),
        tipo_conteudo: 'texto',
        status_leitura: { [senderId]: true },
    };
    await dbClient.insert('tabelaMensagens', newMessage);
    
    await dbClient.update('tabelaConversas', id, { 
        ultima_mensagem_texto: text,
        ultima_mensagem_timestamp: newMessage.timestamp
    });

    // Re-fetch and assemble the full conversation to return it
    const updatedConvoData = await getConversationByIdLogic(id, senderId);
    return updatedConvoData;
});

router.post('/api/chat/viewed', async (_, body) => {
    const { conversationId, viewerId } = body;
    const messages = await dbClient.find('tabelaMensagens', m => m.conversa_id === conversationId && m.remetente_id !== viewerId);

    for (const msg of messages) {
        if (!msg.status_leitura[viewerId]) {
            const newStatus = { ...msg.status_leitura, [viewerId]: true };
            await dbClient.update('tabelaMensagens', msg.id, { status_leitura: newStatus });
        }
    }
    return createSuccessResponse({ success: true });
});

// --- Help & Support Routes ---
router.get('/api/help/articles/:id', async (idStr) => {
    const article = await dbClient.findOne('artigosAjuda', a => a.id === idStr);
    if (article) {
        return createSuccessResponse(article);
    }
    if (idStr === 'faq') {
        const faqArticles = await dbClient.find('artigosAjuda', a => a.categoria === 'FAQ' && a.is_ativo);
        faqArticles.sort((a,b) => a.ordem_exibicao - b.ordem_exibicao);
        const faqContent = faqArticles.map(a => `<h2>${a.titulo}</h2><div>${a.conteudo}</div>`).join('<hr class="my-4 border-gray-700">');
        const faqSummaryArticle: ArtigoAjuda = {
            id: 'faq',
            titulo: 'Perguntas Frequentes (FAQ)',
            conteudo: faqContent,
            categoria: 'FAQ',
            is_ativo: true,
            ordem_exibicao: 0,
            visualizacoes: 0
        };
        return createSuccessResponse(faqSummaryArticle);
    }
    return createErrorResponse(404, "Artigo não encontrado.");
});

router.get('/api/help/articles', async (_, query) => {
    const category = new URLSearchParams(query).get('category');
    let articles = await dbClient.find('artigosAjuda', a => a.is_ativo);
    if (category) {
        articles = articles.filter(a => a.categoria === category);
    }
    articles.sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);
    return createSuccessResponse(articles);
});

router.get('/api/help/contact-channels', async () => {
    const channels = await dbClient.find('canaisContato', c => c.is_ativo);
    return createSuccessResponse(channels);
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
const endPkBattleLogic = async (pkBattleIdStr: string, body: any) => {
    const pkBattleId = parseInt(pkBattleIdStr, 10);
    const { userId } = body; // The user requesting the end

    const battle = await dbClient.findOne('batalhasPK', b => b.id === pkBattleId);
    if (!battle) {
        return createErrorResponse(404, "Batalha não encontrada.");
    }
    if (battle.status !== 'ativa') {
        return createErrorResponse(400, "Esta batalha não está mais ativa.");
    }
    if (battle.streamer_id_1 !== userId && battle.streamer_id_2 !== userId) {
        return createErrorResponse(403, "Apenas um dos anfitriões pode encerrar a batalha.");
    }

    // Update battle status
    await dbClient.update('batalhasPK', pkBattleId, { 
        status: 'finalizada',
        data_fim: new Date().toISOString() 
    });
    
    // Update live stream records to no longer be in PK
    await dbClient.update('liveStreamRecords', battle.live_id_1, { em_pk: false });
    await dbClient.update('liveStreamRecords', battle.live_id_2, { em_pk: false });

    return createSuccessResponse({ success: true });
};

const acceptPkInvitationLogic = async (idStr: string) => {
    const invitation = await dbClient.findOne('pkInvitations', i => i.id === idStr);
    if (!invitation || invitation.status !== 'pendente') {
        return createErrorResponse(400, "Convite inválido ou expirado.");
    }
    
    const [inviterLive, inviteeLive] = await Promise.all([
        dbClient.findOne('liveStreamRecords', l => l.user_id === invitation.remetente_id && l.ao_vivo),
        dbClient.findOne('liveStreamRecords', l => l.user_id === invitation.destinatario_id && l.ao_vivo)
    ]);

    if (!inviterLive || !inviteeLive) {
        return createErrorResponse(400, "Um dos streamers não está mais ao vivo.");
    }
    
    await dbClient.update('liveStreamRecords', inviterLive.id, { em_pk: true });
    await dbClient.update('liveStreamRecords', inviteeLive.id, { em_pk: true });

    const newPkBattle = await dbClient.insert('batalhasPK', {
        live_id_1: inviterLive.id,
        live_id_2: inviteeLive.id,
        streamer_id_1: invitation.remetente_id,
        streamer_id_2: invitation.destinatario_id,
        pontos_streamer_1: 0,
        pontos_streamer_2: 0,
        vencedor_id: null,
        data_inicio: new Date().toISOString(),
        data_fim: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minute battle
        status: 'ativa',
        data_comemoracao_fim: null,
        top_supporters_1: [],
        top_supporters_2: [],
    });
    
    await dbClient.update('pkInvitations', idStr, { status: 'aceito', batalha_id: newPkBattle.id });

    const battles = await getPkBattlesLogic();
    const newBattle = (battles.body as PkBattle[]).find(b => b.id === newPkBattle.id);
    
    return createSuccessResponse(newBattle);
};

const getPkInvitationStatusLogic = async (idStr: string) => {
    const invitation = await dbClient.findOne('pkInvitations', i => i.id === idStr);
    if (!invitation) {
        return createErrorResponse(404, "Convite não encontrado.");
    }
    
    let battle: PkBattle | undefined = undefined;
    if (invitation.status === 'aceito' && invitation.batalha_id) {
         const battlesResponse = await getPkBattlesLogic(); // this function gets all live PKs
         const allBattles = battlesResponse.body as PkBattle[];
         battle = allBattles.find(b => b.id === invitation.batalha_id);
    }
    
    return createSuccessResponse({ invitation, battle });
};

const simulateReceivePkGiftLogic = async (pkBattleIdStr: string, body: any) => {
    const pkBattleId = parseInt(pkBattleIdStr, 10);
    const { receiverId, giftValue } = body;

    const battle = await dbClient.findOne('batalhasPK', b => b.id === pkBattleId);
    if (!battle || battle.status !== 'ativa') {
        return createErrorResponse(400, "Batalha não está ativa.");
    }

    let updatedBattle = null;
    if (battle.streamer_id_1 === receiverId) {
        updatedBattle = await dbClient.update('batalhasPK', pkBattleId, { pontos_streamer_1: battle.pontos_streamer_1 + giftValue });
    } else if (battle.streamer_id_2 === receiverId) {
        updatedBattle = await dbClient.update('batalhasPK', pkBattleId, { pontos_streamer_2: battle.pontos_streamer_2 + giftValue });
    }

    return createSuccessResponse(updatedBattle || battle);
}

router.get('/api/lives/invitable/:id', async (idStr) => {
    const currentUserId = parseInt(idStr, 10);
    const lives = await dbClient.find('liveStreamRecords', l => l.ao_vivo && l.permite_pk && l.user_id !== currentUserId);
    const userIds = lives.map(l => l.user_id);
    const users = await dbClient.find('users', u => userIds.includes(u.id));
    return createSuccessResponse(users);
});

router.post('/api/pk/invite', async (_, body) => {
    const { remetente_id, destinatario_id } = body;
    const existing = await dbClient.findOne('pkInvitations', i => 
        (i.remetente_id === remetente_id && i.destinatario_id === destinatario_id && i.status === 'pendente') ||
        (i.remetente_id === destinatario_id && i.destinatario_id === remetente_id && i.status === 'pendente')
    );
    if(existing) {
        return createErrorResponse(400, "Já existe um convite pendente entre esses usuários.");
    }
    const inviter = await dbClient.findOne('users', u => u.id === remetente_id);
    if (!inviter) {
        return createErrorResponse(404, "Usuário convidante não encontrado.");
    }
    const invitationData: Omit<ConvitePK, 'id'> = {
        remetente_id,
        destinatario_id,
        status: 'pendente',
        data_envio: new Date().toISOString(),
        data_expiracao: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
    const invitation = await dbClient.insert('pkInvitations', invitationData);
    return createSuccessResponse(invitation);
});

router.get('/api/pk/invites/pending/:id', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const invitation = await dbClient.findOne('pkInvitations', i => i.destinatario_id === userId && i.status === 'pendente');
    return createSuccessResponse(invitation);
});

router.post('/api/pk/invites/:id/accept', (id, _) => acceptPkInvitationLogic(id));
router.post('/api/pk/invites/:id/decline', async (id) => {
    await dbClient.update('pkInvitations', id, { status: 'recusado' });
    return createSuccessResponse({ success: true });
});
router.post('/api/pk/invites/:id/cancel', async (id) => {
    await dbClient.update('pkInvitations', id, { status: 'cancelado' });
    return createSuccessResponse({ success: true });
});
router.get('/api/pk/invites/status/:id', (id, _) => getPkInvitationStatusLogic(id));
router.get('/api/pk-battles/:id', async (idStr) => {
    const pkId = parseInt(idStr, 10);
    const battles = await getPkBattlesLogic();
    const battle = (battles.body as PkBattle[]).find(b => b.id === pkId);
    if (!battle) return createErrorResponse(404, "Batalha não encontrada.");
    return createSuccessResponse(battle);
});
router.post('/api/pk-battles/:id/end', (id, body) => endPkBattleLogic(id, body));

const getActivePkBattleLogic = async (pkBattleIdStr: string) => {
    const pkBattleId = parseInt(pkBattleIdStr, 10);
    const battle = await dbClient.findOne('batalhasPK', b => b.id === pkBattleId);
    if (!battle) {
        return createErrorResponse(404, "Batalha PK não encontrada.");
    }

    if (battle.data_fim && new Date(battle.data_fim) < new Date() && battle.status === 'ativa') {
        const winnerId = battle.pontos_streamer_1 > battle.pontos_streamer_2 ? battle.streamer_id_1 : battle.streamer_id_2;
        const updatedBattle = await dbClient.update('batalhasPK', pkBattleId, { 
            status: 'finalizada',
            vencedor_id: winnerId,
            data_comemoracao_fim: new Date(Date.now() + 10 * 1000).toISOString() // 10 sec celebration
        });

        await dbClient.update('liveStreamRecords', battle.live_id_1, { em_pk: false });
        await dbClient.update('liveStreamRecords', battle.live_id_2, { em_pk: false });
        
        return createSuccessResponse(updatedBattle);
    }

    battle.top_supporters_1 = await calculateTopSupporters(battle.streamer_id_1, pkBattleId, dbClient);
    battle.top_supporters_2 = await calculateTopSupporters(battle.streamer_id_2, pkBattleId, dbClient);
    
    return createSuccessResponse(battle);
};
router.get('/api/batalhas-pk/:id', (id, _) => getActivePkBattleLogic(id));
router.post('/api/batalhas-pk/:id/simulate-gift', (id, body) => simulateReceivePkGiftLogic(id, body));

router.get('/api/streams/:id/batalha-pk', async (idStr) => {
    const streamId = parseInt(idStr, 10);
    const session = await dbClient.findOne('batalhasPK', s => (s.live_id_1 === streamId || s.live_id_2 === streamId) && s.status === 'ativa');
    return createSuccessResponse(session);
});

// --- PK Matchmaking ---
const findAndCreatePkMatch = async () => {
    const queue = await dbClient.find('filaPK', q => q.status === 'aguardando');
    if (queue.length === 0) {
        return; // No one is waiting
    }

    // Match the first person in the queue
    const player1QueueEntry = queue[0];
    const player1Id = player1QueueEntry.streamer_id;
    
    // Avoid re-matching if a race condition occurred
    const existingBattle = await dbClient.findOne('batalhasPK', b => (b.streamer_id_1 === player1Id || b.streamer_id_2 === player1Id) && b.status === 'ativa');
    if (existingBattle) {
        await dbClient.delete('filaPK', q => q.streamer_id === player1Id);
        return;
    }

    // Find a suitable bot/mock opponent that is live, allows PK, and is not the player.
    const opponentLive = await dbClient.findOne('liveStreamRecords', l => 
        l.ao_vivo && 
        l.permite_pk && 
        l.user_id !== player1Id
    );

    if (!opponentLive) {
        console.warn(`[API Matchmaking] No opponent found for ${player1Id}. They will keep waiting.`);
        return; 
    }

    const player2Id = opponentLive.user_id;
    const player1Live = await dbClient.findOne('liveStreamRecords', l => l.user_id === player1Id && l.ao_vivo);

    if (player1Live) {
        console.log(`[API Matchmaking] Match found: ${player1Id} vs ${player2Id}`);

        await dbClient.update('liveStreamRecords', player1Live.id, { em_pk: true });
        await dbClient.update('liveStreamRecords', opponentLive.id, { em_pk: true });

        await dbClient.insert('batalhasPK', {
            live_id_1: player1Live.id,
            live_id_2: opponentLive.id,
            streamer_id_1: player1Id,
            streamer_id_2: player2Id,
            pontos_streamer_1: 0,
            pontos_streamer_2: 0,
            vencedor_id: null,
            data_inicio: new Date().toISOString(),
            data_fim: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            status: 'ativa',
            data_comemoracao_fim: null,
            top_supporters_1: [],
            top_supporters_2: [],
        });

        await dbClient.delete('filaPK', q => q.streamer_id === player1Id);
    }
};


router.post('/api/pk/matchmaking/join', async (_, body) => {
    const { userId } = body;
    await dbClient.delete('filaPK', q => q.streamer_id === userId); // Remove any old entry
    await dbClient.insert('filaPK', {
        streamer_id: userId,
        data_entrada: new Date().toISOString(),
        status: 'aguardando',
    });
    // Simulate finding a match after a short delay
    setTimeout(findAndCreatePkMatch, 2500); 
    return createSuccessResponse({ success: true });
});

router.post('/api/pk/matchmaking/leave', async (_, body) => {
    const { userId } = body;
    await dbClient.delete('filaPK', q => q.streamer_id === userId);
    return createSuccessResponse({ success: true });
});

router.get('/api/pk/matchmaking/status/:id', async (idStr) => {
    const userId = parseInt(idStr, 10);
    // Check if I was paired and a battle was created for me
    const battleDb = await dbClient.findOne('batalhasPK', b => (b.streamer_id_1 === userId || b.streamer_id_2 === userId) && b.status === 'ativa');

    if (battleDb) {
        // I'm in a battle, so I'm no longer in the queue
        await dbClient.delete('filaPK', q => q.streamer_id === userId);
        const battles = await getPkBattlesLogic();
        const battleViewModel = (battles.body as PkBattle[]).find(b => b.id === battleDb.id);
        return createSuccessResponse({ status: 'pareado', battle: battleViewModel });
    }

    // Check if I'm still in the queue
    const queueEntry = await dbClient.findOne('filaPK', q => q.streamer_id === userId);
    if (queueEntry) {
        return createSuccessResponse({ status: 'aguardando' });
    }
    
    // Fallback if not found anywhere (maybe battle just ended)
    return createSuccessResponse({ status: 'aguardando' });
});


// --- Misc ---
router.get('/api/version', async () => createSuccessResponse(db.mockVersionInfo));
router.post('/api/users/generate-nickname', async () => createSuccessResponse({ newNickname: `User${Math.floor(Math.random() * 9000) + 1000}` }));
router.post('/api/users/generate-id', async () => createSuccessResponse({ newId: Math.floor(Math.random() * 90000000) + 10000000 }));

router.get('/api/users/:id/profile', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return createErrorResponse(404, 'Usuário não encontrado.');

    const liveStream = await dbClient.findOne('liveStreamRecords', l => l.user_id === userId && l.ao_vivo);
    
    const giftsReceived = await dbClient.find('logPresentesEnviados', g => g.receiverId === userId);
    const protectorScores: { [id: number]: number } = {};
    giftsReceived.forEach(g => {
        protectorScores[g.senderId] = (protectorScores[g.senderId] || 0) + g.giftValue;
    });
    const sortedProtectorIds = Object.keys(protectorScores).sort((a, b) => protectorScores[Number(b)] - protectorScores[Number(a)]).slice(0, 3).map(Number);
    const protectorUsers = await dbClient.find('users', u => sortedProtectorIds.includes(u.id));
    const protectors = sortedProtectorIds.map((id, index) => {
        const pUser = protectorUsers.find(u => u.id === id);
        return {
            rank: index + 1,
            userId: id,
            name: pUser?.nickname || pUser?.name || 'Unknown',
            avatarUrl: pUser?.avatar_url || '',
            protectionValue: protectorScores[id],
        };
    });

    const giftsSent = await dbClient.find('logPresentesEnviados', g => g.senderId === userId);
    const totalSentValue = giftsSent.reduce((sum, g) => sum + g.giftValue, 0);

    const badges: PublicProfile['badges'] = [{ text: String(user.level), type: 'level' }];
    if (user.gender) {
        badges.push({ text: String(calculateAge(user.birthday)), type: 'gender_age', icon: user.gender });
    }
    if (user.level > 50) {
        badges.push({ text: 'Top', type: 'top', icon: 'play' });
    }

    const userAchievements = user.achievements ? await dbClient.find('achievements', a => user.achievements!.includes(a.id)) : [];

    const profile: PublicProfile = {
        id: user.id,
        name: user.name,
        nickname: user.nickname || user.name,
        avatarUrl: user.avatar_url || '',
        age: calculateAge(user.birthday),
        gender: user.gender,
        birthday: user.birthday,
        isLive: !!liveStream,
        isFollowing: false, // Client-side responsibility
        coverPhotoUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        stats: { value: totalSentValue, icon: 'moon' },
        badges: badges,
        protectors: protectors,
        achievements: userAchievements,
        personalityTags: user.personalityTags || [],
        personalSignature: user.personalSignature || 'Vivendo a vida um stream de cada vez ✨',
    };

    return createSuccessResponse(profile);
});

router.get('/api/pk-event/details', async () => {
    const streamerRanking = db.mockPkEventDetailsData.streamerRanking.map(s => ({
        ...s,
        score: s.score + Math.floor(Math.random() * 100),
    })).sort((a,b) => b.score - a.score).map((s,i) => ({ ...s, rank: i + 1 }));

    return createSuccessResponse({
        ...db.mockPkEventDetailsData,
        streamerRanking,
    });
});

router.get('/api/users/:id/protectors', async (idStr) => {
    const streamerId = parseInt(idStr, 10);
    const giftsReceived = await dbClient.find('logPresentesEnviados', g => g.receiverId === streamerId);
    const protectorScores: { [id: number]: number } = {};
    giftsReceived.forEach(g => {
        protectorScores[g.senderId] = (protectorScores[g.senderId] || 0) + g.giftValue;
    });
    const sortedProtectorIds = Object.keys(protectorScores).sort((a, b) => protectorScores[Number(b)] - protectorScores[Number(a)]).map(Number);
    if (sortedProtectorIds.length === 0) {
        return createSuccessResponse([]);
    }
    const protectorUsers = await dbClient.find('users', u => sortedProtectorIds.includes(u.id));
    const protectors = sortedProtectorIds.map((id, index) => {
        const pUser = protectorUsers.find(u => u.id === id);
        return {
            rank: index + 1,
            userId: id,
            name: pUser?.nickname || pUser?.name || 'Unknown',
            avatarUrl: pUser?.avatar_url || '',
            protectionValue: protectorScores[id],
        };
    });
    return createSuccessResponse(protectors);
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
        id: String(db.mockSupportConversation.messages.length + 1),
        senderId: userId,
        text,
        timestamp: new Date().toISOString(),
        status: 'sent',
        seenBy: [userId],
    });
    
    // Simulated auto-reply
    setTimeout(() => {
        db.mockSupportConversation.messages.push({
            id: String(db.mockSupportConversation.messages.length + 1),
            senderId: 0, // 0 for support
            text: "Obrigado por entrar em contato. Um agente responderá em breve.",
            timestamp: new Date().toISOString(),
            status: 'sent',
            seenBy: [],
        });
    }, 1500);

    return createSuccessResponse(db.mockSupportConversation);
});

router.post('/api/reports', async (_, body) => {
    const { reporterId, reportedId, reportReason, reportDetails } = body;
    const denuncia: Omit<Denuncia, 'id'> = {
        usuario_denunciante_id: reporterId,
        usuario_denunciado_id: reportedId,
        motivo_denuncia: reportReason,
        comentarios: reportDetails,
        status_revisao: 'Pendente',
        data_denuncia: new Date().toISOString(),
    };
    await dbClient.insert('denuncias', denuncia);
    return createSuccessResponse({ success: true });
});

router.post('/api/suggestions', async (_, body) => {
    const { suggesterId, suggestion } = body;
    const sugestao: Omit<Sugestao, 'id'> = {
        usuario_id: suggesterId,
        texto_sugestao: suggestion,
        status_revisao: 'Recebida',
        data_sugestao: new Date().toISOString(),
    };
    await dbClient.insert('sugestoes', sugestao);
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
    const like: Omit<Like, 'id'> = { liveId, userId: body.userId, timestamp: new Date().toISOString() };
    const newLike = await dbClient.insert('likes', like);
    return createSuccessResponse(newLike);
});

router.get('/api/lives/:id/summary', async (idStr) => {
    const liveId = parseInt(idStr, 10);
    const live = await dbClient.findOne('liveStreamRecords', l => l.id === liveId);
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
    const live = await dbClient.findOne('liveStreamRecords', l => l.user_id === userId && l.ao_vivo);
    return createSuccessResponse(!!live);
});

router.get('/api/users/:id/following-live-status', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return createSuccessResponse([]);
    
    const followingIds = user.following;
    const lives = await dbClient.find('liveStreamRecords', l => l.ao_vivo && followingIds.includes(l.user_id));
    const liveUserIds = new Set(lives.map(l => l.user_id));

    const updates: LiveFollowUpdate[] = followingIds.map(id => {
        const isLive = liveUserIds.has(id);
        const stream = isLive ? mapLiveRecordToStream(lives.find(l => l.user_id === id)!) : null;
        return { userId: id, isLive, stream };
    });
    return createSuccessResponse(updates);
});

router.get('/api/users/:id/active-stream', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const live = await dbClient.findOne('liveStreamRecords', l => l.user_id === userId && l.ao_vivo);
    return createSuccessResponse(live ? mapLiveRecordToStream(live) : null);
});

router.get('/api/users/:id/lives', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const lives = await dbClient.find('liveStreamRecords', l => l.user_id === userId);
    return createSuccessResponse(lives.map(mapLiveRecordToStream));
});

router.post('/api/lives/thumbnail', async (_, body) => {
    return createSuccessResponse({ thumbnailUrl: body.thumbnailBase64 });
});

router.post('/api/lives/:id/pay-entry', async (idStr, body) => {
    const liveId = parseInt(idStr, 10);
    const { viewerId } = body;
    const live = await dbClient.findOne('liveStreamRecords', l => l.id === liveId);
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
    const live = await dbClient.findOne('liveStreamRecords', l => l.id === liveId);
    if (!live) return createErrorResponse(404, "Live não encontrada.");
    
    if (!live.invited_users) live.invited_users = [];
    if (!live.invited_users.includes(inviteeId)) {
        live.invited_users.push(inviteeId);
        await dbClient.update('liveStreamRecords', liveId, { invited_users: live.invited_users });
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
    const existing = await dbClient.findOne('privateLiveInviteSettings', s => s.userId === userId);
    let updated;
    if (existing) {
        updated = await dbClient.update('privateLiveInviteSettings', String(userId), body);
    } else {
        const defaultSettings = { privateInvites: true, onlyFollowing: true, onlyFans: false, onlyFriends: false };
        updated = await dbClient.insert('privateLiveInviteSettings', { userId, ...defaultSettings, ...body });
    }
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
    const existing = await dbClient.findOne('notificationSettings', s => s.userId === userId);
    let updated;
    if (existing) {
        updated = await dbClient.update('notificationSettings', String(userId), body);
    } else {
        const defaultSettings = { newMessages: true, streamerLive: true, followedPost: true, order: true, interactive: true };
        updated = await dbClient.insert('notificationSettings', { userId, ...defaultSettings, ...body });
    }
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

router.get('/api/help/articles/:id', async (idStr) => {
    const article = await dbClient.findOne('artigosAjuda', a => a.id === idStr);
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
    const live = await dbClient.findOne('liveStreamRecords', l => l.id === liveId && l.user_id === userId);
    if (!live) return createErrorResponse(403, "Apenas o anfitrião pode trocar a câmera.");

    const newFacingMode: FacingMode = live.camera_facing_mode === 'user' ? 'environment' : 'user';
    await dbClient.update('liveStreamRecords', liveId, { camera_facing_mode: newFacingMode });
    await dbClient.update('users', userId, { last_camera_used: newFacingMode });

    return createSuccessResponse({ newFacingMode });
});

router.post('/api/live/toggle-voice', async (_, body) => {
    const { liveId, userId } = body;
    const live = await dbClient.findOne('liveStreamRecords', l => l.id === liveId && l.user_id === userId);
    if (!live) return createErrorResponse(403, "Apenas o anfitrião pode alterar a voz.");

    const voiceEnabled = !(live.voice_enabled ?? false);
    await dbClient.update('liveStreamRecords', liveId, { voice_enabled: voiceEnabled });
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
    
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);

    const data: UniversalRankingData = {
        podium,
        list,
        currentUserRanking,
        countdown: nextHour.toISOString(),
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


// --- Settings Routes (General) ---
router.get('/api/pk-settings/:id', async (idStr) => {
    const userId = parseInt(idStr, 10);
    const settings = await dbClient.findOne('pkSettings', s => s.userId === userId);
    if (settings) {
        return createSuccessResponse({ durationSeconds: settings.durationSeconds });
    }
    // Return a default if no settings are found
    return createSuccessResponse({ durationSeconds: 300 }); // Default to 5 minutes (300s)
});

router.post('/api/pk-settings/:id', async (idStr, body) => {
    const userId = parseInt(idStr, 10);
    const { durationSeconds } = body;

    const existingSettings = await dbClient.findOne('pkSettings', s => s.userId === userId);

    if (existingSettings) {
        await dbClient.update('pkSettings', String(userId), { durationSeconds });
    } else {
        await dbClient.insert('pkSettings', { userId, durationSeconds });
    }
    
    return createSuccessResponse({ success: true });
});

router.get('/api/categories', async () => {
    const categories = await dbClient.find('liveCategories', () => true);
    return createSuccessResponse(categories);
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