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
import { notifyStreamListeners, notifyChatMessageListeners, notifyMuteStatusListeners, notifyUserKickedListeners, notifySoundEffectListeners } from './liveStreamService';
import type { User, LiveDetails, ChatMessage, Gift, Viewer, RankingContributor, Like, PkBattle, PkSession, PublicProfile, PkEventDetails, Conversation, SendGiftResponse, ProtectorDetails, AchievementFrame, WithdrawalTransaction, WithdrawalMethod, InventoryItem, AppEvent, LiveEndSummary, UserLevelInfo, GeneralRankingStreamer, GeneralRankingUser, WithdrawalBalance, EventStatus, PkRankingData, ReportPayload, SuggestionPayload, Stream, DbLive, Category, StartLiveResponse, DiamondPackage, Address, PaymentMethod, CardDetails, PurchaseOrder, HelpArticle, DailyReward, UserRewardStatus, VersionInfo, ConversationMessage, PkInvitation, LiveFollowUpdate, PrivateLiveInviteSettings, NotificationSettings, FacingMode, SoundEffectName, SoundEffectLogEntry, CardBrand, UniversalRankingData } from '../types';

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

const findItemDefinition = (itemId: string): Omit<InventoryItem, 'quantity'> | null => {
    // Check all existing inventories for a definition
    for (const inventory of Object.values(db.mockUserInventory)) {
        const item = inventory.find(i => i.id === itemId);
        if (item) {
            return item;
        }
    }
    // Could check a future master item catalog here
    return null;
};


// =================================================================
// REAL-TIME SIMULATION (PK SCORES & CHAT)
// =================================================================

setInterval(async () => {
    const activeSessions = await dbClient.find('pkSessions', session => !session.endTime);
    for (const session of activeSessions) {
        const score1Update = session.score1 + Math.floor(Math.random() * 150);
        const score2Update = session.score2 + Math.floor(Math.random() * 150);
        await dbClient.update('pkSessions', session.id, { score1: score1Update, score2: score2Update });
    }
}, 2000);


// Simulate other people chatting
setInterval(async () => {
    const activeLives = await dbClient.find('lives', l => l.ao_vivo);
    const activeLiveIds = activeLives.map(l => l.id);
    if (activeLiveIds.length === 0) return;

    const randomLiveId = activeLiveIds[Math.floor(Math.random() * activeLiveIds.length)];
    
    const otherChatters = [
        { id: 1201, name: 'LiveGoFan', level: 3, emojis: '👍' },
        { id: 1202, name: 'SuperUser', level: 10, emojis: '👾' },
        { id: 1203, name: 'LiveStar', level: 32, emojis: '✨' },
    ];
    const randomChatter = otherChatters[Math.floor(Math.random() * otherChatters.length)];
    const randomMessage = ['oi', 'legal!', '❤️❤️❤️', 'top!', 'manda salve'][Math.floor(Math.random() * 5)];

    const newMessage: ChatMessage = {
        id: Date.now() + Math.random(),
        type: 'message',
        level: randomChatter.level,
        username: randomChatter.name,
        userId: randomChatter.id,
        message: randomMessage,
        emojis: randomChatter.emojis,
        color: 'pink',
        timestamp: new Date().toISOString(),
    };
    
    if (!db.mockChatDatabase[randomLiveId]) {
        db.mockChatDatabase[randomLiveId] = [];
    }
    db.mockChatDatabase[randomLiveId].push(newMessage);
    notifyChatMessageListeners(randomLiveId, db.mockChatDatabase[randomLiveId]);

}, 7000); // Every 7 seconds, a random user chats in a random live.

setInterval(async () => {
    const pendingOrder = (await dbClient.find('purchaseOrders', order => order.status === 'pending'))[0];
    if (pendingOrder) {
        const user = await dbClient.findOne('users', u => u.id === pendingOrder.userId);
        if (user) {
            const newDiamonds = user.wallet_diamonds + pendingOrder.package.diamonds;
            await dbClient.update('users', user.id, { wallet_diamonds: newDiamonds });
            await dbClient.update('purchaseOrders', pendingOrder.orderId, { status: 'completed' });
        } else {
            await dbClient.update('purchaseOrders', pendingOrder.orderId, { status: 'failed' });
        }
    }
}, 15000);


// Expire PK invitations after 60 seconds
setInterval(async () => {
    const now = Date.now();
    const INVITATION_EXPIRATION_MS = 60 * 1000; // 60 seconds

    const pendingInvites = await dbClient.find('pkInvitations', i => i.status === 'pending');
    for (const invite of pendingInvites) {
        const inviteTimestamp = new Date(invite.timestamp).getTime();
        if (now - inviteTimestamp > INVITATION_EXPIRATION_MS) {
            console.log(`[Mock API] Expiring PK invitation ${invite.id}`);
            await dbClient.update('pkInvitations', invite.id, { status: 'expired' });
        }
    }
}, 10000);


// =================================================================
// API LOGIC FUNCTIONS
// =================================================================

// --- Auth & User ---

const loginWithGoogleLogic = async (): Promise<User> => {
    const user = await dbClient.findOne('users', u => u.id === 10755083);
    if (!user) throw new Error("Usuário de teste não encontrado");
    return user;
};

const getUserProfileLogic = async (userId: number): Promise<User> => {
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) throw new Error("Usuário não encontrado");
    return user;
};

const uploadProfilePhotoLogic = async (userId: number, photoDataUrl: string): Promise<User> => {
    const updatedUser = await dbClient.update('users', userId, {
      avatar_url: photoDataUrl,
      has_uploaded_real_photo: true,
    });
    if (!updatedUser) throw new Error("Usuário não encontrado");
    return updatedUser;
};

const generateNicknameLogic = async (): Promise<{ newNickname: string }> => {
    const nicknames = ['PlayerOne', 'LiveStar', 'VibeMaster', 'StreamFan', 'GoLivePro', 'Ninja', 'Vex', 'Poki', 'Rocket', 'GamerX'];
    const emojis = ['🥸', '🥹', '🦊', '🔥', '✨', '🚀', '👑', '😎', '🎮', '💡'];
    const baseName = nicknames[Math.floor(Math.random() * nicknames.length)];
    const emojiCount = Math.floor(Math.random() * 3) + 1;
    let finalNickname = baseName;
    const usedEmojis = new Set<string>();
    while (usedEmojis.size < emojiCount && usedEmojis.size < emojis.length) {
        usedEmojis.add(emojis[Math.floor(Math.random() * emojis.length)]);
    }
    finalNickname += Array.from(usedEmojis).join('');
    return { newNickname: finalNickname };
};

const updateUserProfileLogic = async (userId: number, profileData: Partial<Pick<User, 'nickname' | 'gender' | 'birthday' | 'invite_code'>>): Promise<User> => {
    const age = profileData.birthday ? calculateAge(profileData.birthday) : undefined;
    const updatedUser = await dbClient.update('users', userId, {
        ...profileData,
        age: age || undefined,
        has_completed_profile: true,
    });
    if (!updatedUser) throw new Error("Usuário não encontrado");
    return updatedUser;
};

const followUserLogic = async (body: { currentUserId: number, targetUserId: number }): Promise<User> => {
    const { currentUserId, targetUserId } = body;
    const currentUser = await dbClient.findOne('users', u => u.id === currentUserId);
    if (!currentUser) throw new Error("Usuário atual não encontrado");

    const targetUser = await dbClient.findOne('users', u => u.id === targetUserId);
    if (!targetUser) throw new Error("Usuário alvo não encontrado");

    if (!currentUser.following.includes(targetUserId)) {
        const newFollowing = [...currentUser.following, targetUserId];
        await dbClient.update('users', targetUser.id, { followers: targetUser.followers + 1 });
        const updatedCurrentUser = await dbClient.update('users', currentUser.id, { following: newFollowing });
        return updatedCurrentUser!;
    }

    return currentUser;
};

const unfollowUserLogic = async (body: { currentUserId: number, targetUserId: number }): Promise<User> => {
    const { currentUserId, targetUserId } = body;
    const currentUser = await dbClient.findOne('users', u => u.id === currentUserId);
    if (!currentUser) throw new Error("Usuário atual não encontrado");

    const targetUser = await dbClient.findOne('users', u => u.id === targetUserId);
    if (!targetUser) throw new Error("Usuário alvo não encontrado");

    const followIndex = currentUser.following.indexOf(targetUserId);
    if (followIndex > -1) {
        const newFollowing = currentUser.following.filter(id => id !== targetUserId);
        await dbClient.update('users', targetUser.id, { followers: Math.max(0, targetUser.followers - 1) });
        const updatedCurrentUser = await dbClient.update('users', currentUser.id, { following: newFollowing });
        return updatedCurrentUser!;
    }

    return currentUser;
};

const getPublicProfileLogic = async (targetUserId: number): Promise<PublicProfile> => {
    const user = await dbClient.findOne('users', u => u.id === targetUserId);
    if (!user) throw new Error("Usuário não encontrado para perfil público");

    const mainUser = await dbClient.findOne('users', u => u.id === 10755083);
    const isFollowing = mainUser ? mainUser.following.includes(targetUserId) : false;
    
    const activeLive = await dbClient.findOne('lives', l => l.user_id === targetUserId && l.ao_vivo);

    const publicProfileData = db.mockPublicProfiles[targetUserId] || {};

    const age = calculateAge(user.birthday);
    const profile: PublicProfile = {
        id: user.id, name: user.name, nickname: user.nickname || user.name, avatarUrl: user.avatar_url || '',
        age: age > 0 ? age : null, gender: user.gender || null, birthday: user.birthday || null,
        isLive: !!activeLive, isFollowing: isFollowing, 
        coverPhotoUrl: publicProfileData.coverPhotoUrl || 'https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg?auto=compress&cs=tinysrgb&w=800&h=400',
        stats: publicProfileData.stats || { value: Math.floor(Math.random() * 500000), icon: 'moon' },
        badges: publicProfileData.badges || [], 
        protectors: publicProfileData.protectors || [], 
        achievements: publicProfileData.achievements || [], 
        personalityTags: publicProfileData.personalityTags || [], 
        personalSignature: publicProfileData.personalSignature || 'Esta pessoa é preguiçosa e não deixou nada',
    };
    
    if (profile.age && profile.gender && !profile.badges.some(b => b.type === 'gender_age')) {
        profile.badges.unshift({ text: String(profile.age), type: 'gender_age', icon: profile.gender });
    }
    if (user.level && !profile.badges.some(b => b.type === 'level')) {
        profile.badges.unshift({ text: String(user.level), type: 'level' });
    }

    return profile;
};

const searchUsersLogic = async (query: string): Promise<User[]> => {
  if (!query.trim()) return [];
  const lowerCaseQuery = query.toLowerCase();
  return dbClient.find('users', user =>
    user.name.toLowerCase().includes(lowerCaseQuery) ||
    (user.nickname && user.nickname.toLowerCase().includes(lowerCaseQuery)) ||
    String(user.id).includes(lowerCaseQuery)
  );
};

const getFollowersLogic = async (userId: number): Promise<User[]> => {
    return dbClient.find('users', u => u.following.includes(userId));
};

const getFollowingLogic = async (userId: number): Promise<User[]> => {
    const currentUser = await dbClient.findOne('users', u => u.id === userId);
    if (!currentUser) return [];
    return dbClient.find('users', u => currentUser.following.includes(u.id));
};

const getProfileVisitorsLogic = async (userId: number): Promise<User[]> => {
    const visitorIds = db.mockProfileVisitors[userId] || [];
    return dbClient.find('users', u => visitorIds.includes(u.id));
};

const getFollowingLiveStatusLogic = async (userId: number): Promise<LiveFollowUpdate[]> => {
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user || !user.following) return [];

    const followingIds = user.following;
    const liveUpdates: LiveFollowUpdate[] = await Promise.all(
        followingIds.map(async (followedId) => {
            const liveStreamDb = await dbClient.findOne('lives', live => live.user_id === followedId && live.ao_vivo);
            return {
                userId: followedId,
                isLive: !!liveStreamDb,
                stream: liveStreamDb ? mapDbLiveToStream(liveStreamDb) : null,
            };
        })
    );
    return liveUpdates;
};

const getUserLiveStatusLogic = async (userId: number): Promise<boolean> => {
    const liveStream = await dbClient.findOne('lives', live => live.user_id === userId && live.ao_vivo);
    return !!liveStream;
};

const stopLiveStreamLogic = async (userId: number): Promise<{ success: boolean }> => {
    const live = await dbClient.findOne('lives', l => l.user_id === userId && l.ao_vivo);
    if (live) {
        await dbClient.update('lives', live.id, { ao_vivo: false, em_pk: false });
        
        const pkSession = await dbClient.findOne('pkSessions', p => (p.stream1Id === live.id || p.stream2Id === live.id) && !p.endTime);
        if (pkSession) {
            await dbClient.update('pkSessions', pkSession.id, { endTime: new Date().toISOString() });
        }

        const allLives = await dbClient.find('lives', () => true);
        notifyStreamListeners(allLives.map(mapDbLiveToStream));
    }
    return { success: true };
};

const getLiveStreamDetailsLogic = async (liveId: number): Promise<LiveDetails> => {
    const live = await dbClient.findOne('lives', l => l.id === liveId);
    if (!live) throw new Error('Transmissão ao vivo não encontrada.');

    const streamer = await dbClient.findOne('users', u => u.id === live.user_id);
    if (!streamer) throw new Error('Streamer não encontrado.');
    
    const allStreams = await dbClient.find('lives', s => s.ao_vivo && !s.is_private);
    allStreams.sort((a, b) => b.espectadores - a.espectadores);
    const rank = allStreams.findIndex(s => s.id === liveId) + 1;

    return {
        streamerName: live.nome_streamer, streamerAvatarUrl: streamer.avatar_url || '',
        streamerFollowers: streamer.followers || 0, viewerCount: live.espectadores,
        totalVisitors: live.espectadores + Math.floor(Math.random() * 50),
        receivedGiftsValue: live.received_gifts_value || 0,
        rankingPosition: rank > 0 ? `Hora NO.${rank}` : 'N/A',
        status: live.ao_vivo ? 'ao vivo' : 'finalizada',
    };
};

const getPopularStreamsLogic = async (): Promise<Stream[]> => {
    const lives = await dbClient.find('lives', s => s.ao_vivo && !s.is_private);
    return lives.sort((a, b) => b.espectadores - a.espectadores).slice(0, 10).map(mapDbLiveToStream);
};

const getNewStreamsLogic = async (): Promise<Stream[]> => {
    const lives = await dbClient.find('lives', s => s.ao_vivo && !s.is_private);
    return lives.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime()).slice(0, 20).map(mapDbLiveToStream);
};

const getFollowingStreamsLogic = async (userId: number): Promise<Stream[]> => {
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return [];
    const followingIds = user.following;
    const lives = await dbClient.find('lives', s => s.ao_vivo && followingIds.includes(s.user_id));
    return lives.sort((a, b) => b.espectadores - a.espectadores).map(mapDbLiveToStream);
};

const getPrivateStreamsLogic = async (userId: number): Promise<Stream[]> => {
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) return [];
    
    const lives = await dbClient.find('lives', s => s.ao_vivo && s.is_private);
    return lives.sort((a, b) => {
        const aIsFollowed = user.following.includes(a.user_id);
        const bIsFollowed = user.following.includes(b.user_id);
        if (aIsFollowed && !bIsFollowed) return -1;
        if (!aIsFollowed && bIsFollowed) return 1;
        return b.espectadores - a.espectadores;
    }).map(mapDbLiveToStream);
};

const getStreamsForCategoryLogic = async (category: string): Promise<Stream[]> => {
    const lowercasedCategory = category.toLowerCase();
    const lives = await dbClient.find('lives', s => s.ao_vivo && s.categoria.toLowerCase() === lowercasedCategory && !s.is_private);
    return lives.sort((a, b) => b.espectadores - a.espectadores).map(mapDbLiveToStream);
};

const getPkBattlesLogic = async (): Promise<PkBattle[]> => {
    const activePkSessions = await dbClient.find('pkSessions', p => !p.endTime);
    const battles: PkBattle[] = [];

    for (const session of activePkSessions) {
        const stream1Db = await dbClient.findOne('lives', l => l.id === session.stream1Id && l.ao_vivo);
        const stream2Db = await dbClient.findOne('lives', l => l.id === session.stream2Id && l.ao_vivo);
        
        if (stream1Db && stream2Db) {
            const streamer1 = await dbClient.findOne('users', u => u.id === stream1Db.user_id);
            const streamer2 = await dbClient.findOne('users', u => u.id === stream2Db.user_id);

            if (streamer1 && streamer2) {
                battles.push({
                    id: session.id, title: `${streamer1.name} vs ${streamer2.name}`,
                    streamer1: { userId: streamer1.id, streamId: stream1Db.id, name: streamer1.name, score: session.score1, avatarUrl: streamer1.avatar_url || '' },
                    streamer2: { userId: streamer2.id, streamId: stream2Db.id, name: streamer2.name, score: session.score2, avatarUrl: streamer2.avatar_url || '' },
                });
            }
        }
    }
    return battles;
};

const sendGiftLogic = async (liveId: number, senderId: number, giftId: number): Promise<SendGiftResponse> => {
    const gift = db.mockGiftCatalog.find(g => g.id === giftId);
    if (!gift) throw new Error("Presente não encontrado");

    const sender = await dbClient.findOne('users', u => u.id === senderId);
    if (!sender) throw new Error("Remetente não encontrado");

    if (db.mockMutedUsersInLive[liveId]?.[senderId]) {
        const mutedInfo = db.mockMutedUsersInLive[liveId][senderId];
        if (new Date(mutedInfo.mutedUntil) > new Date()) {
            return { success: false, updatedUser: null, message: 'Você está silenciado e não pode enviar presentes.' };
        }
    }

    if (sender.wallet_diamonds < gift.price) {
        return { success: false, updatedUser: null, message: 'Diamantes insuficientes. Por favor, recarregue.' };
    }

    const live = await dbClient.findOne('lives', l => l.id === liveId);
    if (!live || !live.ao_vivo) throw new Error("Transmissão não encontrada ou não está ao vivo");

    const streamer = await dbClient.findOne('users', u => u.id === live.user_id);
    if (!streamer) throw new Error("Streamer não encontrado");

    // Deduct from sender's wallet, add XP, and check for level up
    const newXp = (sender.xp || 0) + gift.price;
    const newLevel = levelService.calculateLevelFromXp(newXp);
    const hasLeveledUp = newLevel > (sender.level || 1);
    
    const updatedSender = await dbClient.update('users', senderId, {
        wallet_diamonds: sender.wallet_diamonds - gift.price,
        xp: newXp,
        level: newLevel
    });

    // Add to streamer's earnings
    await dbClient.update('users', streamer.id, { wallet_earnings: streamer.wallet_earnings + gift.price });
    await dbClient.update('lives', liveId, { received_gifts_value: (live.received_gifts_value || 0) + gift.price });
    
    // Manage real-time data (not in dbClient as it simulates cache/sockets)
    if (!db.mockViewers[liveId]) db.mockViewers[liveId] = [];
    let viewer = db.mockViewers[liveId].find(v => v.id === senderId);
    if (viewer) viewer.contribution += gift.price;

    for (const period of ['hourly', 'daily'] as const) {
        if (!db.mockRankings[liveId]?.[period]) {
            if (!db.mockRankings[liveId]) db.mockRankings[liveId] = { hourly: [], daily: [], weekly: [], monthly: [] };
             db.mockRankings[liveId][period] = [];
        }
        let contributor = db.mockRankings[liveId][period].find(c => c.userId === senderId);
        if (contributor) {
            contributor.contribution += gift.price;
        } else {
            db.mockRankings[liveId][period].push({
                rank: 0, userId: sender.id, name: sender.nickname || sender.name, avatarUrl: sender.avatar_url || '',
                contribution: gift.price, level: newLevel, level2: 25
            });
        }
        db.mockRankings[liveId][period].sort((a, b) => b.contribution - a.contribution).forEach((c, i) => c.rank = i + 1);
    }
    
    // Add messages to chat and notify
    if (!db.mockChatDatabase[liveId]) db.mockChatDatabase[liveId] = [];
    const chatMessagesToAdd: ChatMessage[] = [{
        id: Date.now(), type: 'gift', username: sender.nickname || sender.name, userId: sender.id,
        message: `enviou um(a) ${gift.name}!`, giftName: gift.name, giftImageUrl: gift.imageUrl, timestamp: new Date().toISOString(),
    }];
    if (hasLeveledUp) {
        chatMessagesToAdd.push({
             id: Date.now() + 1, type: 'levelup', username: sender.nickname || sender.name, userId: sender.id,
             message: `subiu para o Nível ${newLevel}!`, level: newLevel, timestamp: new Date().toISOString(),
        });
    }
    db.mockChatDatabase[liveId].push(...chatMessagesToAdd);
    notifyChatMessageListeners(liveId, db.mockChatDatabase[liveId]);

    if (!updatedSender) throw new Error("Falha ao atualizar o remetente");

    return { success: true, updatedUser: updatedSender, message: 'Presente enviado com sucesso!' };
};


const getViewersLogic = async (liveId: number): Promise<Viewer[]> => {
    const userIds = Array.from(db.mockLiveConnections[liveId] || []);
    if (userIds.length === 0) return [];
    
    const users = await dbClient.find('users', u => userIds.includes(u.id));
    const userMap = new Map(users.map(u => [u.id, u]));

    const viewers = userIds.map(userId => {
        const user = userMap.get(userId);
        const existingViewerData = (db.mockViewers[liveId] || []).find(v => v.id === userId);
        return {
            id: userId,
            name: user?.nickname || user?.name || `User ${userId}`,
            avatarUrl: user?.avatar_url || '',
            entryTime: existingViewerData?.entryTime || new Date().toISOString(),
            contribution: existingViewerData?.contribution || 0,
            level: user?.level || 1,
            level2: existingViewerData?.level2 || 25,
        };
    }).sort((a, b) => b.contribution - a.contribution);
    
    return viewers;
};

const getRankingLogic = (liveId: number, period: 'hourly' | 'daily' = 'daily'): RankingContributor[] => {
    return (db.mockRankings[liveId] && db.mockRankings[liveId][period]) || [];
};

const getUniversalRankingLogic = (type: string): UniversalRankingData => {
    const data = db.mockUniversalRankingData[type];
    if (!data) {
        return { podium: [], list: [] };
    }
    return data;
};


const getChatMessagesLogic = (liveId: number): ChatMessage[] => db.mockChatDatabase[liveId] || [];

const sendChatMessageLogic = async (liveId: number, userId: number, message: string): Promise<ChatMessage> => {
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) throw new Error("Usuário não encontrado.");
    
    if (db.mockMutedUsersInLive[liveId]?.[userId]) {
        const mutedInfo = db.mockMutedUsersInLive[liveId][userId];
        if (new Date(mutedInfo.mutedUntil) > new Date()) throw new Error("Você está silenciado e não pode enviar mensagens.");
    }

    const newMessage: ChatMessage = {
        id: Date.now(), type: 'message', level: user.level, username: user.nickname || user.name,
        userId: user.id, message: message, emojis: '💬', color: 'pink', timestamp: new Date().toISOString(),
    };

    if (!db.mockChatDatabase[liveId]) db.mockChatDatabase[liveId] = [];
    db.mockChatDatabase[liveId].push(newMessage);
    notifyChatMessageListeners(liveId, db.mockChatDatabase[liveId]);
    return newMessage;
};

const sendLikeLogic = (liveId: number, userId: number): Like => {
    if (!db.mockLikes[liveId]) db.mockLikes[liveId] = [];
    const newLike: Like = { id: Date.now(), userId, timestamp: new Date().toISOString() };
    db.mockLikes[liveId].push(newLike);
    return newLike;
};

const startLiveStreamLogic = async (userId: number, details: { title: string, meta: string; category: Category, isPrivate: boolean, isPkEnabled: boolean, thumbnailUrl?: string, entryFee?: number, cameraUsed: FacingMode }): Promise<StartLiveResponse> => {
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) throw new Error('Usuário não encontrado.');

    const existingLive = await dbClient.findOne('lives', l => l.user_id === userId && l.ao_vivo);
    if (existingLive) throw new Error('Usuário já está ao vivo.');

    const newLiveDb = await dbClient.insert('lives', {
        user_id: userId, titulo: details.title, nome_streamer: user.nickname || user.name,
        thumbnail_url: details.thumbnailUrl, espectadores: 0, categoria: details.category,
        ao_vivo: true, em_pk: false, is_private: details.isPrivate,
        entry_fee: details.entryFee || null, meta: details.meta,
        inicio: new Date().toISOString(), permite_pk: details.isPkEnabled,
        received_gifts_value: 0, camera_facing_mode: details.cameraUsed, voice_enabled: true,
    });
    
    await dbClient.update('users', userId, {
      last_camera_used: details.cameraUsed,
      last_selected_category: details.category,
    });

    const allLives = await dbClient.find('lives', () => true);
    notifyStreamListeners(allLives.map(mapDbLiveToStream));

    return {
        live: mapDbLiveToStream(newLiveDb),
        urls: { rtmp: `rtmp://livego.example.com/app/${newLiveDb.id}`, hls: `https://livego.example.com/hls/${newLiveDb.id}.m3u8`, webrtc: `wss://livego.example.com/webrtc/${newLiveDb.id}`, streamKey: `sk_${userId}_${Date.now()}` }
    };
};

const getLiveEndSummaryLogic = async (liveId: number): Promise<LiveEndSummary> => {
    const live = await dbClient.findOne('lives', l => l.id === liveId);
    if (!live) throw new Error("Live não encontrada.");

    const streamer = await dbClient.findOne('users', u => u.id === live.user_id);
    if (!streamer) throw new Error("Streamer não encontrado.");
    
    const contributors = (db.mockRankings[liveId]?.daily || []).slice(0, 3).map((c, i) => ({ ...c, rank: i + 1 }));
    const durationSeconds = (new Date().getTime() - new Date(live.inicio).getTime()) / 1000;

    return {
        streamerId: streamer.id, streamerName: streamer.nickname || streamer.name, streamerAvatarUrl: streamer.avatar_url || '',
        durationSeconds: Math.round(durationSeconds), peakViewers: live.espectadores + Math.floor(Math.random() * 50),
        totalEarnings: live.received_gifts_value || 0, topContributors: contributors
    };
};

const getConversationsLogic = async (userId: number): Promise<Conversation[]> => {
    const convos = await dbClient.find('conversations', c => true); // simplified for mock
    
    return Promise.all(convos.map(async (convo) => {
        const otherUser = await dbClient.findOne('users', u => u.id === convo.otherUserId);
        return {
            ...convo,
            otherUserName: otherUser?.nickname || otherUser?.name || `Usuário ${convo.otherUserId}`,
            otherUserAvatarUrl: otherUser?.avatar_url || 'https://i.pravatar.cc/150?u=other_user'
        };
    }));
};

const getConversationByIdLogic = async (conversationId: string, params: URLSearchParams): Promise<Conversation> => {
    const userIdStr = params.get('userId');
    if (!userIdStr) throw new Error("Missing userId in request for conversation");
    const currentUserId = parseInt(userIdStr, 10);
    
    let convo = await dbClient.findOne('conversations', c => c.id === conversationId);
    if (!convo && conversationId === `conv-support-${currentUserId}`) {
        convo = db.mockSupportConversation;
    }
    if (!convo) throw new Error("Conversa não encontrada");

    const otherUser = await dbClient.findOne('users', u => u.id === convo.otherUserId);
    if (!otherUser) throw new Error("Usuário da conversa não encontrado");

    return { ...convo, otherUserName: otherUser.nickname || otherUser.name, otherUserAvatarUrl: otherUser.avatar_url || '' };
};

const getOrCreateConversationWithUserLogic = async (currentUserId: number, otherUserId: number): Promise<Conversation> => {
    const existingConvo = await dbClient.findOne('conversations', c => c.otherUserId === otherUserId); // Simplified logic
    if (existingConvo) {
        const params = new URLSearchParams({ userId: String(currentUserId) });
        return getConversationByIdLogic(existingConvo.id, params);
    }
    
    const otherUser = await dbClient.findOne('users', u => u.id === otherUserId);
    if (!otherUser) throw new Error("Usuário não encontrado.");
    
    const newConvo = await dbClient.insert('conversations', {
        otherUserId: otherUserId, unreadCount: 0, messages: [],
    });
    
    return { ...newConvo, otherUserName: otherUser.nickname || otherUser.name, otherUserAvatarUrl: otherUser.avatar_url || '' };
};

const sendMessageToConversationLogic = async (conversationId: string, senderId: number, text: string): Promise<Conversation> => {
    const convo = await dbClient.findOne('conversations', c => c.id === conversationId);
    if (!convo) throw new Error("Conversa não encontrada");

    const newMessage: ConversationMessage = { id: Date.now(), senderId, text, timestamp: new Date().toISOString(), status: 'sent', seenBy: [] };
    const updatedMessages = [...convo.messages, newMessage];
    
    await dbClient.update('conversations', conversationId, { messages: updatedMessages });
    
    const params = new URLSearchParams({ userId: String(senderId) });
    return getConversationByIdLogic(conversationId, params);
};

const markMessagesAsSeenLogic = async (body: { conversationId: string, viewerId: number }): Promise<{ success: boolean }> => {
    const { conversationId, viewerId } = body;
    const convo = await dbClient.findOne('conversations', c => c.id === conversationId);

    if (convo) {
        // Handle regular conversations
        const updatedMessages = convo.messages.map(msg => {
            if (msg.senderId !== viewerId && !msg.seenBy.includes(viewerId)) {
                return { ...msg, seenBy: [...msg.seenBy, viewerId], status: 'seen' as const };
            }
            return msg;
        });

        await dbClient.update('conversations', conversationId, {
            messages: updatedMessages,
            unreadCount: 0
        });

        return { success: true };
    }

    // Handle support conversation if not found in main db
    if (db.mockSupportConversation.id === conversationId) {
        db.mockSupportConversation.messages.forEach(msg => {
            if (msg.senderId !== viewerId && !msg.seenBy.includes(viewerId)) {
                msg.seenBy.push(viewerId);
                msg.status = 'seen';
            }
        });
        db.mockSupportConversation.unreadCount = 0;
        return { success: true };
    }
    
    throw new Error("Conversa não encontrada para marcar como lida.");
};

const joinLiveStreamLogic = async (userId: number, liveId: number): Promise<{ success: boolean }> => {
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) throw new Error("Usuário não encontrado.");

    const live = await dbClient.findOne('lives', l => l.id === liveId);
    if (!live || !live.ao_vivo) throw new Error("Live não encontrada ou encerrada.");
    
    if (!db.mockLiveConnections[liveId]) db.mockLiveConnections[liveId] = new Set();
    db.mockLiveConnections[liveId].add(userId);
    
    await dbClient.update('lives', liveId, { espectadores: db.mockLiveConnections[liveId].size });
    const allLives = await dbClient.find('lives', () => true);
    notifyStreamListeners(allLives.map(mapDbLiveToStream));

    if (!db.mockViewers[liveId]) db.mockViewers[liveId] = [];
    if (!db.mockViewers[liveId].some(v => v.id === userId)) {
        db.mockViewers[liveId].push({
            id: user.id, name: user.nickname || user.name, avatarUrl: user.avatar_url || '',
            entryTime: new Date().toISOString(), contribution: 0, level: user.level, level2: 25,
        });
    }
    
    if ((db.mockKickedUsersFromLive[liveId] || []).includes(userId)) {
        throw new Error("Você foi removido desta sala e não pode entrar novamente.");
    }
    
    return { success: true };
};

const leaveLiveStreamLogic = async (liveId: number, body: { userId: number }): Promise<{ success: boolean }> => {
    const { userId } = body;
    const connections = db.mockLiveConnections[liveId];
    if (connections) {
        connections.delete(userId);
        const live = await dbClient.findOne('lives', l => l.id === liveId);
        if (live && live.ao_vivo) {
            await dbClient.update('lives', liveId, { espectadores: connections.size });
            const allLives = await dbClient.find('lives', () => true);
            notifyStreamListeners(allLives.map(mapDbLiveToStream));
        }
    }
    return { success: true };
};


const postSpecialEntryMessage = async (liveId: number, userId: number): Promise<void> => {
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user || !user.equipped_entry_effect_id) return;

    const effect = findItemDefinition(user.equipped_entry_effect_id);
    if (!effect) return;
    
    if (!db.mockChatDatabase[liveId]) db.mockChatDatabase[liveId] = [];
    
    db.mockChatDatabase[liveId].push({
        id: Date.now(), type: 'special_entry', username: user.nickname || user.name, userId: user.id,
        message: `entrou usando o efeito "${effect.name}"!`, giftName: effect.name,
        giftImageUrl: effect.imageUrl, timestamp: new Date().toISOString(),
    });
    notifyChatMessageListeners(liveId, db.mockChatDatabase[liveId]);
};

const purchaseDiamondsLogic = async (body: { userId: number, packageId: number, address: Address, paymentDetails?: { method: PaymentMethod; card?: CardDetails } }): Promise<{ updatedUser: User, order: PurchaseOrder }> => {
    const { userId, packageId, address, paymentDetails } = body;

    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) throw new Error("Usuário não encontrado.");

    const pkg = db.mockDiamondPackages.find(p => p.id === packageId);
    if (!pkg) throw new Error("Pacote de diamantes não encontrado.");

    const order: PurchaseOrder = {
        orderId: `ord-${Date.now()}`,
        userId,
        package: pkg,
        address,
        paymentDetails: {
            method: paymentDetails?.method || 'transfer',
            card: paymentDetails?.card,
        },
        status: paymentDetails?.method === 'card' ? 'completed' : 'pending',
        timestamp: new Date().toISOString(),
    };

    await dbClient.insert('purchaseOrders', order);
    
    let updatedUser = user;

    if (order.status === 'completed') {
        const newDiamonds = user.wallet_diamonds + pkg.diamonds;
        updatedUser = await dbClient.update('users', userId, { wallet_diamonds: newDiamonds }) as User;
    }
    
    if (!updatedUser) throw new Error("Falha ao atualizar usuário após a compra.");

    return { updatedUser, order };
};

const getPurchaseHistoryLogic = async (userId: number): Promise<PurchaseOrder[]> => {
    const orders = await dbClient.find('purchaseOrders', o => o.userId === userId);
    return orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const checkOrderStatusLogic = async (orderId: string): Promise<{ order: PurchaseOrder | null }> => {
    const order = await dbClient.findOne('purchaseOrders', o => o.orderId === orderId);
    return { order };
};

// --- Moderation, Reports, and other logic that modify non-db state or simple structures ---
const muteUserLogic = (liveId: number, targetUserId: number, mute: boolean, durationMinutes: number): { success: boolean } => {
    if (!db.mockMutedUsersInLive[liveId]) db.mockMutedUsersInLive[liveId] = {};
    let update: { liveId: number; userId: number; isMuted: boolean; mutedUntil?: string };
    if (mute) {
        const mutedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
        db.mockMutedUsersInLive[liveId][targetUserId] = { mutedUntil };
        update = { liveId, userId: targetUserId, isMuted: true, mutedUntil };
    } else {
        delete db.mockMutedUsersInLive[liveId][targetUserId];
        update = { liveId, userId: targetUserId, isMuted: false };
    }
    notifyMuteStatusListeners(update);
    return { success: true };
};

const kickUserLogic = (liveId: number, targetUserId: number): { success: boolean } => {
    if (!db.mockKickedUsersFromLive[liveId]) db.mockKickedUsersFromLive[liveId] = [];
    if (!db.mockKickedUsersFromLive[liveId].includes(targetUserId)) {
        db.mockKickedUsersFromLive[liveId].push(targetUserId);
    }
    if (db.mockViewers[liveId]) db.mockViewers[liveId] = db.mockViewers[liveId].filter(v => v.id !== targetUserId);
    notifyUserKickedListeners({ liveId, kickedUserId: targetUserId });
    return { success: true };
};

const playSoundEffectLogic = (liveId: number, triggeredBy: number, effectName: SoundEffectName): { success: boolean } => {
    db.mockSoundEffectLog.push({
        id: db.mockSoundEffectLog.length + 1, liveId, effectName,
        triggeredBy, timestamp: new Date().toISOString()
    });
    notifySoundEffectListeners({ liveId, effectName, triggeredBy });
    return { success: true };
};

const getUserPkPreferenceLogic = (userId: number): { isPkEnabled: boolean } => ({ isPkEnabled: db.mockPkPreferences[userId] ?? true });
const updateUserPkPreferenceLogic = (userId: number, body: { isPkEnabled: boolean }): { success: boolean } => {
    db.mockPkPreferences[userId] = body.isPkEnabled;
    return { success: true };
};

const getProtectorsListLogic = async (streamerId: number): Promise<ProtectorDetails[]> => {
    // The data is defined in mockDb.mockPublicProfiles.
    const predefinedProtectors = db.mockPublicProfiles[streamerId]?.protectors;
    if (predefinedProtectors) {
        // Clone to avoid mutation issues if any part of the app tries to modify it
        return structuredClone(predefinedProtectors);
    }

    // For any other user not in mockPublicProfiles, generate a dynamic list.
    const users = await dbClient.find('users', u => u.id !== streamerId && (u.wallet_earnings > 500 || u.level > 20));
    
    if (users.length === 0) return [];

    // Let's make the protection value more realistic, based on XP or earnings.
    const protectors = users
        .map(u => ({
            user: u,
            // A score based on a combination of earnings and XP
            score: (u.wallet_earnings * 5) + u.xp
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(users.length, 8)) // Get top 8 potential protectors
        .map((item, index) => ({
            rank: index + 1,
            userId: item.user.id,
            name: item.user.nickname || item.user.name,
            avatarUrl: item.user.avatar_url || '',
            protectionValue: Math.round(item.score / 2) // The protection value is half the score
        }));

    return protectors;
};

const getPkRankingInfoLogic = (): PkEventDetails => db.mockPkEventData;

const getStreamerRankingLogic = async (): Promise<GeneralRankingStreamer[]> => {
    const streamers = await dbClient.find('users', u => (u.followers || 0) > 1000); // Filter for users who are likely streamers
    streamers.sort((a, b) => (b.followers || 0) - (a.followers || 0));
    return streamers.slice(0, 50).map((s, i) => ({
        rank: i + 1,
        userId: s.id,
        username: s.nickname || s.name,
        avatarUrl: s.avatar_url || '',
        level: s.level,
        followers: s.followers
    }));
};

const getUserRankingLogic = async (): Promise<GeneralRankingUser[]> => {
    const users = await dbClient.find('users', () => true);
    users.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    return users.slice(0, 50).map((u, i) => ({
        rank: i + 1,
        userId: u.id,
        username: u.nickname || u.name,
        avatarUrl: u.avatar_url || '',
        level: u.level,
        xp: u.xp
    }));
};

const getArticleByIdLogic = (id: string): HelpArticle => {
    const article = db.mockHelpArticles.find(a => a.id === id);
    if (!article) throw new Error("Artigo não encontrado");
    return article;
};
const getDiamondPackagesLogic = (): DiamondPackage[] => db.mockDiamondPackages;

const getWithdrawalHistoryLogic = (userId: number): Promise<WithdrawalTransaction[]> => dbClient.find('withdrawalTransactions', tx => tx.userId === userId);

const getWithdrawalBalanceLogic = async (userId: number): Promise<WithdrawalBalance> => {
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) throw new Error("Usuário não encontrado.");
    const pendingTxs = await dbClient.find('withdrawalTransactions', tx => tx.userId === userId && tx.status === 'pending');
    const pendingWithdrawals = pendingTxs.reduce((sum, tx) => sum + tx.earnings_withdrawn, 0);
    return {
        totalEarnings: user.wallet_earnings,
        pendingWithdrawals,
        availableBalance: user.wallet_earnings - pendingWithdrawals,
    };
};

const getUserLevelInfoLogic = async (userId: number): Promise<UserLevelInfo> => {
    const user = await dbClient.findOne('users', u => u.id === userId);
    if (!user) throw new Error("Usuário não encontrado.");
    
    const currentLevel = levelService.calculateLevelFromXp(user.xp);
    if (user.level !== currentLevel) {
        await dbClient.update('users', userId, { level: currentLevel });
        user.level = currentLevel;
    }
    
    return { currentLevel: user.level, currentXp: user.xp, xpForNextLevel: levelService.getXpForLevel(currentLevel + 1) };
};

const switchCameraLogic = async (body: { liveId: number, userId: number }): Promise<{ newFacingMode: FacingMode }> => {
    const { liveId, userId } = body;
    const live = await dbClient.findOne('lives', l => l.user_id === userId && l.ao_vivo);
    if (!live) throw new Error("Live stream ativa do usuário não encontrada.");
    
    const newMode: FacingMode = (live.camera_facing_mode || 'user') === 'user' ? 'environment' : 'user';
    await dbClient.update('lives', live.id, { camera_facing_mode: newMode });
    await dbClient.update('users', userId, { last_camera_used: newMode });

    const allLives = await dbClient.find('lives', () => true);
    notifyStreamListeners(allLives.map(mapDbLiveToStream));
    return { newFacingMode: newMode };
};

const toggleVoiceLogic = async (body: { liveId: number, userId: number }): Promise<{ voiceEnabled: boolean }> => {
    const { liveId, userId } = body;
    const live = await dbClient.findOne('lives', l => l.user_id === userId && l.ao_vivo);
    if (!live) throw new Error("Live stream ativa do usuário não encontrada.");

    const newVoiceState = !(live.voice_enabled ?? true);
    await dbClient.update('lives', live.id, { voice_enabled: newVoiceState });

    const allLives = await dbClient.find('lives', () => true);
    notifyStreamListeners(allLives.map(mapDbLiveToStream));
    return { voiceEnabled: newVoiceState };
};

const blockUserLogic = (body: { blockerId: number, targetId: number }): { success: boolean } => {
    db.mockBlockedUsers.add(body.targetId);
    return { success: true };
};

const unblockUserLogic = (body: { unblockerId: number, targetId: number }): { success: boolean } => {
    db.mockBlockedUsers.delete(body.targetId);
    return { success: true };
};

const getBlockedUsersLogic = async (currentUserId: number): Promise<User[]> => {
    const blockedIds = Array.from(db.mockBlockedUsers);
    return dbClient.find('users', user => blockedIds.includes(user.id));
};

const submitReportLogic = async (payload: ReportPayload): Promise<{ success: boolean }> => {
    await dbClient.insert('reports', { ...payload, timestamp: new Date().toISOString() });
    return { success: true };
};

const submitSuggestionLogic = async (payload: SuggestionPayload): Promise<{ success: boolean }> => {
    await dbClient.insert('suggestions', { ...payload, timestamp: new Date().toISOString() });
    return { success: true };
};

const saveWithdrawalMethodLogic = async (userId: number, body: { method: 'pix' | 'mercado_pago', account: string }): Promise<User> => {
    const updatedUser = await dbClient.update('users', userId, { withdrawal_method: body });
    if (!updatedUser) throw new Error("Usuário não encontrado.");
    return updatedUser;
};

const detectCardBrandLogic = (body: { cardNumber: string }): { brand: CardBrand } => {
    const num = body.cardNumber.replace(/\D/g, '');
    let brand: CardBrand = null;

    if (/^4/.test(num)) {
        brand = 'visa';
    } else if (/^(5[1-5]|2[2-7])/.test(num)) {
        brand = 'mastercard';
    } else if (/^3[47]/.test(num)) {
        brand = 'amex';
    } else if (/^(50|63|65|4011|4312|4514|4576|4389)/.test(num)) {
        brand = 'elo';
    }

    return { brand };
};

const getPrivateLiveInviteSettingsLogic = async (userId: number): Promise<PrivateLiveInviteSettings> => {
    const settings = await dbClient.findOne('privateLiveInviteSettings', s => s.userId === userId);
    return settings || {
        userId,
        privateInvites: true,
        onlyFollowing: true,
        onlyFans: false,
        onlyFriends: false,
    };
};

const updatePrivateLiveInviteSettingsLogic = async (userId: number, body: Partial<Omit<PrivateLiveInviteSettings, 'userId'>>): Promise<PrivateLiveInviteSettings> => {
    const existingSettings = await getPrivateLiveInviteSettingsLogic(userId);
    const newSettings = { ...existingSettings, ...body };
    const updatedSettings = await dbClient.update('privateLiveInviteSettings', userId, newSettings);
    if (!updatedSettings) throw new Error("Failed to update private live invite settings.");
    return updatedSettings;
};

const getPkSessionDetailsLogic = async (sessionId: number): Promise<PkSession> => {
    const session = await dbClient.findOne('pkSessions', s => s.id === sessionId);
    if (!session) {
        throw new Error("PK Session not found");
    }
    return session;
};


// =================================================================
// ROUTER
// =================================================================
const routes: { [key: string]: { [method: string]: Function } } = {
    // Auth & User
    '/api/auth/google': { POST: loginWithGoogleLogic },
    '/api/users/generate-nickname': { POST: generateNicknameLogic },
    '/api/users/search': { GET: (params: URLSearchParams) => searchUsersLogic(params.get('q') || '') },
    '/api/users/:userId': {
        GET: (userId: number) => getUserProfileLogic(userId),
        PATCH: (userId: number, body: any) => updateUserProfileLogic(userId, body),
    },
    '/api/users/:userId/avatar': { PATCH: (userId: number, body: any) => uploadProfilePhotoLogic(userId, body.photoDataUrl) },
    '/api/users/:userId/profile': { GET: (userId: number) => getPublicProfileLogic(userId) },
    '/api/users/:userId/protectors': { GET: getProtectorsListLogic },
    '/api/users/:userId/pk-preference': { GET: getUserPkPreferenceLogic, PATCH: updateUserPkPreferenceLogic },
    '/api/users/:userId/followers': { GET: getFollowersLogic },
    '/api/users/:userId/following': { GET: getFollowingLogic },
    '/api/users/:userId/visitors': { GET: getProfileVisitorsLogic },
    '/api/users/:userId/level': { GET: getUserLevelInfoLogic },
    '/api/users/:userId/withdrawal-history': { GET: getWithdrawalHistoryLogic },
    '/api/users/:userId/withdrawal-balance': { GET: getWithdrawalBalanceLogic },
    '/api/users/:userId/withdrawal-method': { PUT: saveWithdrawalMethodLogic },
    '/api/users/block': { POST: blockUserLogic },
    '/api/users/unblock': { POST: unblockUserLogic },
    '/api/users/follow': { POST: followUserLogic },
    '/api/users/unfollow': { POST: unfollowUserLogic },
    '/api/users/:userId/blocked': { GET: getBlockedUsersLogic },
    '/api/users/:userId/purchase-history': { GET: getPurchaseHistoryLogic },
    '/api/users/:userId/private-live-invite-settings': { GET: getPrivateLiveInviteSettingsLogic, PUT: updatePrivateLiveInviteSettingsLogic },


    // Live Streams
    '/api/lives/popular': { GET: getPopularStreamsLogic },
    '/api/lives/novas': { GET: getNewStreamsLogic },
    '/api/lives/pk': { GET: getPkBattlesLogic },
    '/api/lives/seguindo/:userId': { GET: getFollowingStreamsLogic },
    '/api/lives/private/:userId': { GET: getPrivateStreamsLogic },
    '/api/lives/categoria/:category': { GET: (category: string) => getStreamsForCategoryLogic(category) },
    '/api/lives/create': { POST: (body: any) => startLiveStreamLogic(body.userId, body) },
    '/api/lives/:liveId/details': { GET: getLiveStreamDetailsLogic },
    '/api/lives/:liveId/summary': { GET: getLiveEndSummaryLogic },
    '/api/users/:userId/stop-live': { POST: (userId: number) => stopLiveStreamLogic(userId) },
    '/api/users/:userId/live-status': { GET: getUserLiveStatusLogic },
    '/api/users/:userId/following-live-status': { GET: getFollowingLiveStatusLogic },

    // Live Interactions
    '/api/lives/:liveId/join': { POST: (liveId: number, body: any) => joinLiveStreamLogic(body.userId, liveId) },
    '/api/lives/:liveId/leave': { POST: (liveId: number, body: any) => leaveLiveStreamLogic(liveId, body) },
    '/api/lives/:liveId/viewers': { GET: getViewersLogic },
    '/api/chat/live/:liveId': {
        GET: getChatMessagesLogic,
        POST: (liveId: number, body: any) => sendChatMessageLogic(liveId, body.userId, body.message)
    },
    '/api/lives/:liveId/like': { POST: (liveId: number, body: any) => sendLikeLogic(liveId, body.userId) },
    '/api/lives/:liveId/gift': { POST: (liveId: number, body: any) => sendGiftLogic(liveId, body.senderId, body.giftId) },
    '/api/lives/:liveId/ranking': { GET: (liveId: number, params: URLSearchParams) => getRankingLogic(liveId, params.get('period') as any) },
    '/api/ranking/universal': { GET: (params: URLSearchParams) => getUniversalRankingLogic(params.get('type') || 'total') },
    '/api/gifts': { GET: () => db.mockGiftCatalog },
    '/api/diamonds/packages': { GET: getDiamondPackagesLogic },
    '/api/live/switch-camera': { POST: switchCameraLogic },
    '/api/live/toggle-voice': { POST: toggleVoiceLogic },
    '/api/lives/:liveId/special-entry': { POST: (liveId: number, body: any) => postSpecialEntryMessage(liveId, body.userId) },


    // Live Moderation
    '/api/lives/:liveId/mute': { POST: (liveId: number, body: any) => muteUserLogic(liveId, body.targetUserId, body.mute, body.durationMinutes) },
    '/api/lives/:liveId/kick': { POST: (liveId: number, body: any) => kickUserLogic(liveId, body.targetUserId) },
    '/api/lives/:liveId/sound-effect': { POST: (liveId: number, body: any) => playSoundEffectLogic(liveId, body.triggeredBy, body.effectName) },

    // PK Battles
    '/api/pk-sessions/:sessionId': { GET: getPkSessionDetailsLogic },
    '/api/pk-battles/:pkId': { GET: async (pkId: number) => {
        const battles = await getPkBattlesLogic();
        const battle = battles.find(b => b.id === pkId);
        if(!battle) throw new Error("Batalha PK não encontrada");
        return battle;
    }},
    '/api/pk/invite': { POST: (body: any) => {
        // This is a simple implementation and can be expanded
        return dbClient.insert('pkInvitations', {
            inviterId: body.inviterId, inviterName: 'Inviter', inviterAvatarUrl: '',
            inviteeId: body.inviteeId, status: 'pending', timestamp: new Date().toISOString()
        });
    }},
    '/api/pk/invites/pending/:userId': { GET: (userId: number) => dbClient.findOne('pkInvitations', i => i.inviteeId === userId && i.status === 'pending') },

    // Conversations
    '/api/users/:userId/conversations': { GET: getConversationsLogic },
    '/api/chat/private/get-or-create': { POST: (body: any) => getOrCreateConversationWithUserLogic(body.currentUserId, body.otherUserId) },
    '/api/chat/private/:convoId': { 
        GET: (convoId: string, params: URLSearchParams) => getConversationByIdLogic(convoId, params),
        POST: (convoId: string, body: any) => sendMessageToConversationLogic(convoId, body.senderId, body.text) 
    },
    '/api/chat/viewed': { POST: markMessagesAsSeenLogic },
    
    // Help & Support
    '/api/help/articles/:articleId': { GET: getArticleByIdLogic },
    '/api/support/conversation/:userId': { GET: async (userId: number) => {
        const params = new URLSearchParams({ userId: String(userId) });
        return getConversationByIdLogic(`conv-support-${userId}`, params);
    }},
    '/api/support/messages': { POST: async (body: any) => {
        const user = await dbClient.findOne('users', u => u.id === body.userId);
        if (!user) throw new Error("Usuário não encontrado.");
        
        db.mockSupportConversation.messages.push({ id: Date.now(), senderId: user.id, text: body.text, timestamp: new Date().toISOString(), status: 'sent', seenBy: [] });
        setTimeout(() => {
             db.mockSupportConversation.messages.push({ id: Date.now() + 1, senderId: 999, text: "Obrigado por sua mensagem. Nossa equipe responderá em breve.", timestamp: new Date().toISOString(), status: 'sent', seenBy: [] });
        }, 2000);
        
        const params = new URLSearchParams({ userId: String(user.id) });
        return getConversationByIdLogic(`conv-support-${user.id}`, params);
    }},
    
    // Payment
    '/api/purchase': { POST: purchaseDiamondsLogic },
    '/api/purchase/status/:orderId': { GET: checkOrderStatusLogic },
    '/api/payment/detect-brand': { POST: detectCardBrandLogic },

    // Misc
    '/api/pk-event/details': { GET: getPkRankingInfoLogic },
    '/api/ranking/streamers': { GET: getStreamerRankingLogic },
    '/api/ranking/users': { GET: getUserRankingLogic },
    '/api/version': { GET: () => db.mockVersionInfo },
    '/api/reports': { POST: submitReportLogic },
    '/api/suggestions': { POST: submitSuggestionLogic },
};

export const getDbState = () => {
    return dbClient.getRawDb();
};


// =================================================================
// MAIN API HANDLER
// =================================================================
export const mockApi = async (url: string, options?: RequestInit): Promise<ApiResponse> => {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.parse(options.body as string) : {};

    console.log(`[Mock API] Handling ${method} ${url}`);

    const [path, queryString] = url.split('?');
    const params = new URLSearchParams(queryString);

    const staticRoutes = Object.keys(routes).filter(r => !r.includes(':')).sort((a, b) => b.length - a.length);
    const dynamicRoutes = Object.keys(routes).filter(r => r.includes(':')).sort((a,b) => b.length - a.length);
    const orderedRoutes = [...staticRoutes, ...dynamicRoutes];

    for (const route of orderedRoutes) {
        const paramNames: string[] = [];
        const regex = new RegExp('^' + route.replace(/:(\w+)/g, (_, name) => {
            paramNames.push(name);
            return '([^/]+)';
        }) + '$');

        const match = path.match(regex);
        if (match) {
            const handler = routes[route][method];
            if (handler) {
                try {
                    const args: any[] = match.slice(1).map(s => /^\d+$/.test(s) ? parseInt(s, 10) : s);
                    
                    if (method === 'GET' || method === 'DELETE') {
                        args.push(params);
                    } else {
                         args.push(body);
                    }
                    
                    const result = await handler(...args);
                    return createSuccessResponse(result);
                } catch (error) {
                    const message = error instanceof Error ? error.message : "An unknown error occurred in the API.";
                    console.error(`[Mock API] Error on ${method} ${url}:`, error);
                    return createErrorResponse(500, message);
                }
            } else {
                return createErrorResponse(405, `Method ${method} not allowed for ${path}`);
            }
        }
    }

    return createErrorResponse(404, `No route found for ${method} ${path}`);
};