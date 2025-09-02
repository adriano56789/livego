// This file contains the complete mock API server, including the in-memory database,
// routing logic, and all endpoint handlers. It fully simulates the backend.

import * as levelService from './levelService';
import { database, getRawDb } from './database';
import { mongoObjectId } from './mongoObjectId';
// FIX: Added missing type imports to resolve compilation errors.
import type { User, LiveStreamRecord, Stream, PkBattle, PkBattleState, PurchaseOrder, ConvitePK, LiveCategory, Category, StartLiveResponse, FacingMode, LiveDetails, ChatMessage, Viewer, PublicProfile, AppEvent, ArtigoAjuda, CanalContato, HealthCheckResult, PrivateLiveInviteSettings, NotificationSettings, GiftNotificationSettings, PrivacySettings, LiveFollowUpdate, WithdrawalBalance, UserLevelInfo, InventoryItem, WithdrawalTransaction, RankingContributor, Conversation, ConversationMessage, Gift, DiamondPackage, PkSettings, SelectableOption, SecurityLogEntry, UniversalRankingUser, LiveEndSummary, TopFanDetails, UniversalRankingData, GeneralRankingStreamer } from '../types';

// --- SIMULATED ENVIRONMENT VARIABLES ---
const SRS_URL_PUBLISH = 'rtmp://localhost/live';
const SRS_URL_PLAY_WEBRTC = 'webrtc://localhost/live';
const SRS_URL_PLAY_HLS = 'http://localhost:8080/live';

// FIX: Added missing delay function.
// Helper function to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const mapLiveRecordToStream = (record: LiveStreamRecord): Stream => ({
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

const regions = [
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

const liveCategories: LiveCategory[] = [
    { id: '1', name: 'Popular', slug: 'popular' },
    { id: '2', name: 'Seguindo', slug: 'seguindo' },
    { id: '3', name: 'Perto', slug: 'perto' },
    { id: '4', name: 'Novo', slug: 'novo' },
    { id: '5', name: 'PK', slug: 'pk' },
    { id: '6', name: 'Música', slug: 'musica' },
    { id: '7', name: 'Dança', slug: 'danca' },
    { id: '8', name: 'Festa', slug: 'festa' },
];

// --- HELPER for building conversation view model ---
const buildConversationViewModel = async (convo: any, currentUserId: number): Promise<Conversation | null> => {
    const otherUserId = convo.participants.find((pId: number) => pId !== currentUserId);
    if (otherUserId === undefined) return null;

    const [otherUser, currentUser] = await Promise.all([
        database.users.findOne({ id: otherUserId }),
        database.users.findOne({ id: currentUserId })
    ]);

    if (!otherUser || !currentUser) return null;

    const messages = convo.messages || [];
    const unreadCount = messages.filter((msg: any) => msg.senderId !== currentUserId && !(msg.seenBy || []).includes(currentUserId)).length;
    
    const isFriend = (currentUser.following || []).includes(otherUserId) && (otherUser.following || []).includes(currentUser.id);

    return {
        id: convo.id,
        participants: convo.participants,
        otherUserId: otherUserId,
        otherUserName: otherUser.nickname || otherUser.name,
        otherUserAvatarUrl: otherUser.avatar_url || '',
        isFriend: isFriend,
        unreadCount,
        messages: messages.map((msg: any) => ({
            id: msg.id, 
            senderId: msg.senderId, 
            type: msg.type,
            text: msg.text, 
            imageUrl: msg.imageUrl, 
            timestamp: msg.timestamp,
            status: (msg.seenBy || []).length > 1 ? 'seen' : 'sent',
            seenBy: msg.seenBy || []
        }))
    };
};


// --- API ROUTER ---

export const handleApiRequest = async (method: string, path: string, body: any, query: URLSearchParams): Promise<any> => {
    console.log(`[Mock API] ${method} ${path}`, { body, query: Object.fromEntries(query) });
    
    // --- HELPER FUNCTIONS FOR PK BATTLES ---
    const getPkBattleViewModel = async (battleId: number | string): Promise<PkBattle | null> => {
        const battleState = await database.pkBattles.findOne({ id: Number(battleId) });
        if (!battleState) return null;

        const streamerA = battleState.streamer_A;
        const streamerB = battleState.streamer_B;

        // Make lookup more resilient: find the last known stream for each user, even if not currently live.
        // This handles cases where a stream might have ended abruptly without cleaning up the PK battle state.
        const streamA = (await database.liveStreams.find({ user_id: streamerA.id })).sort((a,b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())[0];
        const streamB = (await database.liveStreams.find({ user_id: streamerB.id })).sort((a,b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())[0];

        // We still need both streams to exist to construct a valid PkBattle object.
        // If they don't exist at all, it's unrecoverable.
        if (!streamA || !streamB) {
            console.error(`Could not find streams for both PK participants (${streamerA.id}, ${streamerB.id}) in battle ${battleId}`);
            return null;
        }

        return {
            id: battleState.id,
            title: `${streamerA.nickname} vs ${streamerB.nickname}`,
            streamer1: { userId: streamerA.id, streamId: streamA.id, name: streamerA.nickname || streamerA.name, score: battleState.pontuacao_A, avatarUrl: streamerA.avatar_url || '', isVerified: true, countryCode: streamerA.country || undefined },
            streamer2: { userId: streamerB.id, streamId: streamB.id, name: streamerB.nickname || streamerB.name, score: battleState.pontuacao_B, avatarUrl: streamerB.avatar_url || '', isVerified: false, countryCode: streamerB.country || undefined },
            isCoHost: battleState.is_co_host,
        };
    };

    const acceptPkInvite = async (inviteId: string): Promise<{ battle: PkBattle }> => {
        const invite = await database.pkInvitations.findOne({ id: inviteId });
        if (!invite || invite.status !== 'pendente') {
            throw new Error("Invalid or expired invitation.");
        }

        const [inviter, invitee] = await Promise.all([
            database.users.findOne({ id: invite.remetente_id }),
            database.users.findOne({ id: invite.destinatario_id })
        ]);
        if (!inviter || !invitee) throw new Error("Participants not found");

        const [inviterStream, inviteeStream] = await Promise.all([
            database.liveStreams.findOne({ user_id: inviter.id, ao_vivo: true }),
            database.liveStreams.findOne({ user_id: invitee.id, ao_vivo: true })
        ]);
        if (!inviterStream || !inviteeStream) throw new Error("One or both participants are not live.");

        const newBattle: PkBattleState = {
            id: Date.now(),
            streamer_A: inviter,
            streamer_B: invitee,
            streamer_A_id: inviter.id,
            streamer_B_id: invitee.id,
            pontuacao_A: 0,
            pontuacao_B: 0,
            status: 'ativa',
            data_inicio: new Date().toISOString(),
            duracao_segundos: 300,
            data_fim: new Date(Date.now() + 300 * 1000).toISOString(),
            top_supporters_A: [],
            top_supporters_B: [],
            is_co_host: invite.is_co_host,
        };
        await database.pkBattles.insertOne(newBattle);
        await database.pkInvitations.updateOne({ id: inviteId }, { $set: { status: 'aceito', batalha_id: newBattle.id } });
        await database.liveStreams.updateOne({ id: inviterStream.id }, { $set: { em_pk: true } });
        await database.liveStreams.updateOne({ id: inviteeStream.id }, { $set: { em_pk: true } });
        
        const battleViewModel = await getPkBattleViewModel(newBattle.id);
        if (!battleViewModel) throw new Error("Failed to create battle view model");

        return { battle: battleViewModel };
    };
    // --- END HELPER FUNCTIONS ---


    const liveDetailRegex = /^\/api\/lives\/(\d+)$/;
    const liveSubpathRegex = /^\/api\/lives\/(\d+)\/(\w+)$/;
    const pkInvitePendingRegex = /^\/api\/pk\/invites\/pending\/(\d+)$/;
    const pkInviteStatusRegex = /^\/api\/pk\/invites\/status\/([\w-]+)$/;
    const pkInviteActionRegex = /^\/api\/pk\/invites\/([\w-]+)\/(accept|decline|cancel)$/;
    const pkBattleDetailsRegex = /^\/api\/batalhas-pk\/([\w-]+)$/;
    const pkDetailsRegex = /^\/api\/pk-battles\/([\w-]+)$/;
    const chatRegex = /^\/api\/chat\/live\/(\d+)$/;
    const userUpdateRegex = /^\/api\/users\/(\d+)$/;
    const privateChatRegex = /^\/api\/chat\/private\/([\w-]+)$/;
    const followsRegex = /^\/api\/follows$/;
    const unfollowRegex = /^\/api\/follows\/(\d+)\/(\d+)$/;
    const blockStatusOrDeleteRegex = /^\/api\/blocks\/(\d+)\/(\d+)$/;
    const rankingHourlyRegex = /^\/api\/ranking\/hourly$/;
    const rankingStreamersRegex = /^\/api\/ranking\/streamers$/;
    const rankingUsersRegex = /^\/api\/ranking\/users$/;
    const helpArticleByIdRegex = /^\/api\/help\/articles\/([\w-]+)$/;
    const streamPkBattleRegex = /^\/api\/streams\/(\d+)\/batalha-pk$/;
    const privateLiveSettingsRegex = /^\/api\/users\/(\d+)\/private-live-invite-settings$/;

    const streamPkBattleMatch = path.match(streamPkBattleRegex);
    if (method === 'GET' && streamPkBattleMatch) {
        const streamId = parseInt(streamPkBattleMatch[1], 10);
        const stream = await database.liveStreams.findOne({ id: streamId, ao_vivo: true });
        if (!stream || !stream.em_pk) {
            return null;
        }
        const streamerId = stream.user_id;
        const battle = await database.pkBattles.findOne({
            $or: [{ streamer_A_id: streamerId }, { streamer_B_id: streamerId }],
            status: 'ativa'
        });
        return battle;
    }

    if (method === 'GET' && path === '/api/regions') {
        return regions;
    }

    if (method === 'GET' && path === '/api/genders') {
        return await database.genders.find();
    }
    if (method === 'GET' && path === '/api/countries') {
        return await database.countries.find();
    }
    if (method === 'GET' && path === '/api/emotional_states') {
        return await database.emotionalStates.find();
    }
    if (method === 'GET' && path === '/api/professions') {
        return await database.professions.find();
    }
    if (method === 'GET' && path === '/api/languages') {
        return await database.languages.find();
    }

    // --- USER & AUTH ---
    if (method === 'POST' && path === '/api/auth/google') {
        const user = await database.users.findOne({ id: body.accountId });
        if (!user) throw new Error('User not found');
        return user;
    }

    if (method === 'POST' && path.match(followsRegex)) {
        const { followerId, followingId } = body;
        const follower = await database.users.findOne({ id: followerId });
        if (!follower) throw new Error('Follower not found');
        
        const isAlreadyFollowing = (follower.following || []).includes(followingId);
        if (!isAlreadyFollowing) {
            const updatedFollowing = [...(follower.following || []), followingId];
            await database.users.updateOne({ id: followerId }, { $set: { following: updatedFollowing } });

            const followed = await database.users.findOne({ id: followingId });
            if (!followed) throw new Error('Followed user not found');
            await database.users.updateOne({ id: followingId }, { $set: { followers: (followed.followers || 0) + 1 } });
        }

        const updatedFollower = await database.users.findOne({ id: followerId });
        if (!updatedFollower) throw new Error('Could not retrieve updated follower');
        return updatedFollower;
    }

    const unfollowMatch = path.match(unfollowRegex);
    if (method === 'DELETE' && unfollowMatch) {
        const followerId = parseInt(unfollowMatch[1], 10);
        const followingId = parseInt(unfollowMatch[2], 10);
        
        const follower = await database.users.findOne({ id: followerId });
        if (!follower) throw new Error('Follower not found');
        
        const isFollowing = (follower.following || []).includes(followingId);
        if (isFollowing) {
            const updatedFollowing = (follower.following || []).filter(id => id !== followingId);
            await database.users.updateOne({ id: followerId }, { $set: { following: updatedFollowing } });
            
            const followed = await database.users.findOne({ id: followingId });
            if (!followed) throw new Error('Followed user not found');
            await database.users.updateOne({ id: followingId }, { $set: { followers: Math.max(0, (followed.followers || 0) - 1) } });
        }

        const updatedFollower = await database.users.findOne({ id: followerId });
        if (!updatedFollower) throw new Error('Could not retrieve updated follower');
        return updatedFollower;
    }

    const blockStatusOrDeleteMatch = path.match(blockStatusOrDeleteRegex);
    if (blockStatusOrDeleteMatch) {
        const blockerId = parseInt(blockStatusOrDeleteMatch[1], 10);
        const blockedId = parseInt(blockStatusOrDeleteMatch[2], 10);

        if (method === 'GET') {
            const blockRecord = await database.blockedUsers.findOne({ blockerId, blockedId });
            return { isBlocked: !!blockRecord };
        }

        if (method === 'DELETE') {
            await database.blockedUsers.deleteOne({ blockerId: blockerId, blockedId: blockedId });
            return { success: true };
        }
    }

    if (method === 'GET' && path === '/api/users/search') {
        const queryStr = query.get('q')?.toLowerCase() || '';
        if (!queryStr) {
            return [];
        }

        const allUsers = await database.users.find();
        
        const filteredUsers = allUsers.filter(user => {
            const nameMatch = user.name.toLowerCase().includes(queryStr);
            const nicknameMatch = user.nickname?.toLowerCase().includes(queryStr);
            const idMatch = String(user.id).includes(queryStr);
            return nameMatch || nicknameMatch || idMatch;
        });

        return filteredUsers;
    }

    const userUpdateMatch = path.match(userUpdateRegex);
    if (method === 'PUT' && userUpdateMatch) {
        const userId = parseInt(userUpdateMatch[1], 10);
        await database.users.updateOne({ id: userId }, { $set: body });
        const updatedUser = await database.users.findOne({ id: userId });
        return updatedUser;
    }
    
    if (method === 'GET' && path.startsWith('/api/users/')) {
        const parts = path.split('/');
        const userId = parseInt(parts[3], 10);
        const subPath = parts[4];
        
        if (!subPath) {
             const user = await database.users.findOne({ id: userId });
             if (!user) throw new Error('User not found');
             return user;
        }
        
        // Handle multi-segment paths like /api/users/:userId/gifts/received
        if (subPath === 'gifts') {
            const direction = parts[5]; // received or sent
            if (direction === 'received') {
                const user = await database.users.findOne({ id: userId });
                return { totalValue: user?.wallet_earnings || 0 };
            }
            if (direction === 'sent') {
                const sentGifts = await database.sentGifts.find({ senderId: userId });
                const totalValue = sentGifts.reduce((sum, gift) => sum + gift.diamondCost, 0);
                return { totalValue };
            }
        }
        
        switch(subPath) {
            case 'profile': {
                 const viewerId = query.get('viewerId') ? parseInt(query.get('viewerId')!, 10) : undefined;
                 const user = await database.users.findOne({ id: userId });
                 if (!user) throw new Error('User not found');
        
                 const isFollowing = viewerId ? (await database.users.findOne({id: viewerId}))?.following.includes(userId) : false;
                 
                 const allSentGifts = await database.sentGifts.find({ receiverId: userId });
                const contributions: { [senderId: number]: number } = {};
                for (const gift of allSentGifts) {
                    contributions[gift.senderId] = (contributions[gift.senderId] || 0) + gift.diamondCost;
                }
                const sortedContributors = Object.entries(contributions)
                    .map(([senderId, total]) => ({ senderId: Number(senderId), total }))
                    .sort((a, b) => b.total - a.total);
                
                const topFansList: TopFanDetails[] = [];
                for (let i = 0; i < sortedContributors.length; i++) {
                    const contributor = sortedContributors[i];
                    const fanUser = await database.users.findOne({ id: contributor.senderId });
                    if (fanUser) {
                        topFansList.push({
                            rank: i + 1,
                            userId: fanUser.id,
                            name: fanUser.nickname || fanUser.name,
                            avatarUrl: fanUser.avatar_url || '',
                            contribution: contributor.total,
                            country: fanUser.country,
                        });
                    }
                }
                const top3Fans = topFansList.slice(0, 3);
        
                 const publicProfile: PublicProfile = {
                    id: user.id,
                    name: user.name,
                    nickname: user.nickname || user.name,
                    avatarUrl: user.avatar_url || '',
                    age: user.age,
                    gender: user.gender,
                    birthday: user.birthday,
                    isLive: (await database.liveStreams.findOne({ user_id: userId, ao_vivo: true })) !== null,
                    isFollowing,
                    isFriend: isFollowing && (user.following || []).includes(viewerId!),
                    followers: user.followers || 0,
                    followingCount: (user.following || []).length,
                    recebidos: user.wallet_earnings,
                    enviados: 0, // Mocked
                    coverPhotoUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
                    stats: { value: 12345, icon: 'coin' },
                    badges: [
                        { text: String(user.level), type: 'level' },
                        ...(user.gender && user.age ? [{ text: String(user.age), type: 'gender_age' as const, icon: user.gender as 'male'|'female' }] : [])
                    ],
                    protectors: [], // Mocked
                    topFans: top3Fans,
                    achievements: [], // Mocked
                    personalityTags: user.personalityTags || [],
                    personalSignature: user.personalSignature || '',
                    is_avatar_protected: user.is_avatar_protected,
                    privacy: user.settings?.privacy,
                 };
                 return publicProfile;
            }
            case 'following': {
                const user = await database.users.findOne({ id: userId });
                if (!user) return [];
                const followingUsers = await database.users.find({ id: { '$in': user.following } });
                return followingUsers;
            }
            case 'followers':
            case 'fans': {
                 const usersWhoFollow = await database.users.find({ following: { '$in': [userId] } });
                 return usersWhoFollow;
            }
             case 'friends': {
                const user = await database.users.findOne({ id: userId });
                if (!user) return [];
                const usersWhoFollow = await database.users.find({ following: { '$in': [userId] } });
                const friendIds = usersWhoFollow.filter(u => user.following.includes(u.id)).map(u => u.id);
                return await database.users.find({ id: { '$in': friendIds } });
            }
            case 'visitors':
                return await database.users.find({ id: { '$in': [55218901, 66345102] } }); // Mocked
            case 'live-status': {
                const stream = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
                return !!stream;
            }
            case 'following-live-status': {
                const user = await database.users.findOne({ id: userId });
                if (!user || !user.following) return [];
                const followingIds = user.following;
                const liveStreams = await database.liveStreams.find({ user_id: { '$in': followingIds }, ao_vivo: true });
                const liveStreamMap = new Map(liveStreams.map(s => [s.user_id, s]));

                const statuses: LiveFollowUpdate[] = followingIds.map(id => {
                    const streamRecord = liveStreamMap.get(id);
                    return {
                        userId: id,
                        isLive: !!streamRecord,
                        stream: streamRecord ? mapLiveRecordToStream(streamRecord) : null,
                    };
                });
                return statuses;
            }
            case 'conversations': {
                const allConvos = await database.conversations.find({ participants: { '$in': [userId] } });
                const currentUser = await database.users.findOne({ id: userId });
                if (!currentUser) return [];

                const viewModels = await Promise.all(allConvos.map(async (convo: any) => {
                    const viewModel = await buildConversationViewModel(convo, userId);
                    if (viewModel) {
                        const lastMessage = viewModel.messages.length > 0 ? [viewModel.messages[viewModel.messages.length - 1]] : [];
                        return { ...viewModel, messages: lastMessage };
                    }
                    return null;
                }));

                let convos = viewModels.filter((vm): vm is Conversation => vm !== null).sort((a, b) => {
                     const lastMsgA = a.messages[0];
                     const lastMsgB = b.messages[0];
                     if (!lastMsgB) return -1;
                     if (!lastMsgA) return 1;
                     return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
                });
                
                 // Mock friend requests summary
                const allUsers = await database.users.find();
                const requests = allUsers.filter(u => (u.following || []).includes(userId));
                const friendRequests = requests.filter(u => !(currentUser?.following || []).includes(u.id));

                if (friendRequests.length > 0) {
                    convos.unshift({
                        id: 'friend-requests', type: 'friend_requests_summary',
                        participants: [userId], otherUserId: -1, otherUserName: 'Pedidos de amizade', otherUserAvatarUrl: '', unreadCount: friendRequests.length,
                        messages: [{ id: 'fr-summary-msg', senderId: -1, type: 'system', text: `${friendRequests.length} novo(s) pedido(s)`, imageUrl: null, timestamp: new Date().toISOString(), status: 'sent', seenBy: [] }]
                    } as Conversation);
                }
                return convos;
            }
            case 'purchase-history': {
                return await database.purchaseOrders.find({ userId: userId });
            }
            case 'friend-requests': {
                const allUsers = await database.users.find();
                const requests = allUsers.filter(u => (u.following || []).includes(userId));
                const currentUser = await database.users.findOne({ id: userId });
                return requests.filter(u => !(currentUser?.following || []).includes(u.id));
            }
            case 'connected-accounts': {
                const user = await database.users.findOne({ id: userId });
                return [{ provider: 'google', email: user?.email }];
            }
            case 'earnings': {
                const user = await database.users.findOne({ id: userId });
                return { total: user?.wallet_earnings || 0, lastMonth: (user?.wallet_earnings || 0) * 0.3, conversionRate: 0.0115, feeRate: 0.20 };
            }
            case 'active-stream': {
                const stream = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
                return stream ? mapLiveRecordToStream(stream) : null;
            }
            case 'lives': {
                const streams = await database.liveStreams.find({ user_id: userId });
                return streams.map(mapLiveRecordToStream);
            }
            case 'blocked': {
                const blocks = await database.blockedUsers.find({ blockerId: userId });
                const blockedIds = blocks.map(b => b.blockedId);
                return await database.users.find({ id: { '$in': blockedIds } });
            }
            case 'withdrawal-balance': {
                const user = await database.users.findOne({ id: userId });
                const pending = (await database.withdrawalTransactions.find({ userId, status: 'pending' })).reduce((sum, tx) => sum + tx.earnings_withdrawn, 0);
                const balance: WithdrawalBalance = { totalEarnings: user?.wallet_earnings || 0, pendingWithdrawals: pending, availableBalance: (user?.wallet_earnings || 0) - pending };
                return balance;
            }
            case 'withdrawal-history': {
                 const history: WithdrawalTransaction[] = await database.withdrawalTransactions.find({ userId });
                 return history;
            }
            case 'inventory': {
                const inventory: InventoryItem[] = [
                    { id: 'entry-effect-1', name: 'Nave Espacial', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/rocket_gift.png', quantity: 1, category: 'decoration', sub_type: 'entry_effect', description: 'Um efeito de entrada incrível.' },
                    { id: 'profile-frame-1', name: 'Moldura Dourada', imageUrl: 'https://storage.googleapis.com/genai-assets/livego/gold_frame.png', quantity: 1, category: 'decoration', sub_type: 'profile_frame', description: 'Mostre seu status com esta moldura.' },
                ];
                return inventory;
            }
            case 'level': {
                const user = await database.users.findOne({ id: userId });
                if (!user) throw new Error('User not found for level info');
                const levelInfo: UserLevelInfo = { currentLevel: user.level, currentXp: user.xp, xpForNextLevel: levelService.getXpForLevel(user.level + 1) };
                return levelInfo;
            }
            case 'notification-settings': {
                const user = await database.users.findOne({ id: userId });
                return user?.settings?.notifications || { newMessages: true, streamerLive: true, followedPost: true, order: true, interactive: true };
            }
            case 'gift-notification-settings': {
                const user = await database.users.findOne({ id: userId });
                return user?.settings?.giftNotifications || { enabledGifts: {} };
            }
            case 'push-settings': {
                return {};
            }
            case 'private-live-invite-settings': {
                const user = await database.users.findOne({ id: userId });
                return user?.settings?.privateLiveInvite || { privateInvites: true, onlyFollowing: true, onlyFans: false, onlyFriends: false, acceptOnlyFriendPkInvites: false };
            }
            case 'privacy-settings': {
                const user = await database.users.findOne({ id: userId });
                return user?.settings?.privacy || { showLocation: true, showActiveStatus: true, showInNearby: true, protectionEnabled: false };
            }
            case 'pending-invites': {
                return { invite: null }; // Mock as no pending invites for now to reduce noise
            }
            case 'cohost-friends': {
                const user = await database.users.findOne({ id: userId });
                if (!user) return [];
                const following = user.following || [];
                const potentialFriends = await database.users.find({ id: { '$in': following } });
                const friends = potentialFriends.filter(pf => (pf.following || []).includes(userId));
                
                // Add dynamic properties for the modal
                const liveStreams = await database.liveStreams.find({ ao_vivo: true });
                const liveUserIds = new Set(liveStreams.map(s => s.user_id));

                return friends.map(f => ({
                    ...f,
                    online_status: liveUserIds.has(f.id),
                    coHostHistory: `Co-host ${Math.floor(Math.random() * 5) + 1} vez(es)`
                }));
            }
            case 'live-preferences': {
                const user = await database.users.findOne({ id: userId });
                if (!user) throw new Error("User not found");
                return { isPkEnabled: user.pk_enabled_preference ?? true, lastCameraUsed: user.last_camera_used ?? 'user', lastSelectedCategory: user.last_selected_category ?? 'Popular', lastLiveTitle: user.lastLiveTitle || '', lastLiveMeta: user.lastLiveMeta || '' };
            }
             case 'top-fans': {
                const allSentGifts = await database.sentGifts.find({ receiverId: userId });
                const contributions: { [senderId: number]: number } = {};
                for (const gift of allSentGifts) {
                    contributions[gift.senderId] = (contributions[gift.senderId] || 0) + gift.diamondCost;
                }
                const sortedContributors = Object.entries(contributions)
                    .map(([senderId, total]) => ({ senderId: Number(senderId), total }))
                    .sort((a, b) => b.total - a.total);
                
                const topFans: TopFanDetails[] = [];
                for (let i = 0; i < sortedContributors.length; i++) {
                    const contributor = sortedContributors[i];
                    const fanUser = await database.users.findOne({ id: contributor.senderId });
                    if (fanUser) {
                        topFans.push({
                            rank: i + 1,
                            userId: fanUser.id,
                            name: fanUser.nickname || fanUser.name,
                            avatarUrl: fanUser.avatar_url || '',
                            contribution: contributor.total,
                            country: fanUser.country,
                        });
                    }
                }
                return topFans;
            }
        }
    }
    
    const privateLiveSettingsMatch = path.match(privateLiveSettingsRegex);
    if (method === 'PATCH' && privateLiveSettingsMatch) {
        const userId = parseInt(privateLiveSettingsMatch[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error('User not found');

        const currentSettings = user.settings?.privateLiveInvite || {};
        const newSettings = { ...currentSettings, ...body };
        await database.users.updateOne({ id: userId }, { $set: { 'settings.privateLiveInvite': newSettings } });
        
        const updatedUser = await database.users.findOne({ id: userId });
        if (!updatedUser) throw new Error('Failed to retrieve updated user');
        
        return updatedUser.settings?.privateLiveInvite;
    }

    if (method === 'POST' && path === '/api/livekit/token') {
        return { token: `mock_token_for_${body.roomName}_user_${body.participantIdentity}` };
    }

    // --- PK INVITES ---
    if (method === 'POST' && path === '/api/pk/invites') {
        const { inviterId, inviteeId, isCoHost } = body;
        const newInvite: ConvitePK = {
            id: mongoObjectId(),
            remetente_id: inviterId,
            destinatario_id: inviteeId,
            status: 'pendente',
            data_envio: new Date().toISOString(),
            data_expiracao: new Date(Date.now() + 60 * 1000).toISOString(),
            is_co_host: isCoHost,
        };
        await database.pkInvitations.insertOne(newInvite);
        return newInvite;
    }

    const pkInviteStatusMatch = path.match(pkInviteStatusRegex);
    if (method === 'GET' && pkInviteStatusMatch) {
        const inviteId = pkInviteStatusMatch[1];
        const invite = await database.pkInvitations.findOne({ id: inviteId });
        if (!invite) throw new Error("Invitation not found");

        if (invite.status === 'pendente') {
            const sentDate = new Date(invite.data_envio).getTime();
            if (Date.now() - sentDate > 4000) { // Simulate acceptance after 4 seconds
                const { battle } = await acceptPkInvite(inviteId);
                const acceptedInvite = await database.pkInvitations.findOne({ id: inviteId });
                return { invitation: acceptedInvite, battle };
            }
        }
        
        let battle: PkBattle | null = null;
        if (invite.status === 'aceito' && invite.batalha_id) {
            battle = await getPkBattleViewModel(invite.batalha_id);
        }

        return { invitation: invite, battle };
    }

    const pkInviteActionMatch = path.match(pkInviteActionRegex);
    if (method === 'POST' && pkInviteActionMatch) {
        const inviteId = pkInviteActionMatch[1];
        const action = pkInviteActionMatch[2];

        if (action === 'accept') {
            return await acceptPkInvite(inviteId);
        }

        if (action === 'decline' || action === 'cancel') {
            await database.pkInvitations.updateOne({ id: inviteId }, { $set: { status: action === 'decline' ? 'recusado' : 'cancelado' as 'recusado' | 'cancelado' } });
            return { success: true };
        }
    }

    const pkBattleDetailsMatch = path.match(pkBattleDetailsRegex);
    if (method === 'GET' && pkBattleDetailsMatch) {
        const battleId = pkBattleDetailsMatch[1];
        const battle = await database.pkBattles.findOne({ id: Number(battleId) });
        if (!battle) throw new Error("PK Battle not found");
        return battle;
    }
    
    const pkDetailsMatch = path.match(pkDetailsRegex);
    if (method === 'GET' && pkDetailsMatch) {
        const pkId = pkDetailsMatch[1];
        const battle = await getPkBattleViewModel(pkId);
        if (!battle) throw new Error("PK Battle details not found");
        return battle;
    }

    // --- DIAMONDS & PURCHASE ---
    if (method === 'GET' && path === '/api/diamonds/packages') {
        const packages = await database.diamondPackages.find();
        return packages;
    }

    // --- LIVE STREAMS LIST ---
    if(method === 'GET' && path === '/api/lives') {
        const category = query.get('category');
        if (category === 'pk') {
            const pkStreams = await database.liveStreams.find({ em_pk: true, ao_vivo: true });
            const battles: PkBattle[] = pkStreams.slice(0, Math.floor(pkStreams.length / 2) * 2).reduce((acc, stream, index, arr) => {
                if (index % 2 === 0) {
                    const streamer1 = stream;
                    const streamer2 = arr[index + 1];
                    acc.push({
                        id: streamer1.id + streamer2.id, // simple unique id
                        title: `${streamer1.nome_streamer} vs ${streamer2.nome_streamer}`,
                        streamer1: { userId: streamer1.user_id, streamId: streamer1.id, name: streamer1.nome_streamer, score: 1234, avatarUrl: (getRawDb().users.find(u => u.id === streamer1.user_id) as User)?.avatar_url || '', isVerified: true },
                        streamer2: { userId: streamer2.user_id, streamId: streamer2.id, name: streamer2.nome_streamer, score: 5678, avatarUrl: (getRawDb().users.find(u => u.id === streamer2.user_id) as User)?.avatar_url || '', isVerified: false },
                    });
                }
                return acc;
            }, [] as PkBattle[]);
            return battles;
        }
        const liveRecords = await database.liveStreams.find({ ao_vivo: true });
        return liveRecords.map(mapLiveRecordToStream);
    }
    
    // --- LIVE STREAM DETAILS & ACTIONS ---
    const liveDetailMatch = path.match(liveDetailRegex);
    const liveSubpathMatch = path.match(liveSubpathRegex);
    const chatMatch = path.match(chatRegex);

    if (chatMatch) {
        const liveId = parseInt(chatMatch[1], 10);
        const stream = await database.liveStreams.findOne({ id: liveId });

        if (method === 'GET') {
            return stream?.chatMessages || [];
        }

        if (method === 'POST') {
            if (!stream) throw new Error('Live stream not found');

            const { userId, message, imageUrl } = body;
            const sender = await database.users.findOne({ id: userId });
            if (!sender) throw new Error('Sender not found');
            
            const newChatMessage: ChatMessage = {
                id: Date.now(),
                type: imageUrl ? 'image' : 'message',
                userId: sender.id,
                username: sender.nickname || sender.name,
                message: message,
                imageUrl: imageUrl,
                timestamp: new Date().toISOString(),
                globalLevel: sender.level,
                avatarUrl: sender.avatar_url,
                age: sender.age,
                gender: sender.gender,
            };

            if (!stream.chatMessages) {
                stream.chatMessages = [];
            }
            stream.chatMessages.push(newChatMessage);

            await database.liveStreams.updateOne({ id: liveId }, { $set: { chatMessages: stream.chatMessages } });
            
            return newChatMessage;
        }
    }
    
    if (liveDetailMatch) {
        const liveId = parseInt(liveDetailMatch[1], 10);
        if (method === 'GET') {
            const liveStream = await database.liveStreams.findOne({ id: liveId });
            if (!liveStream) throw new Error('Live stream not found');
            const streamer = await database.users.findOne({ id: liveStream.user_id });
            if (!streamer) throw new Error('Streamer not found');
            
            // FIX: The LiveDetails object was missing several required properties.
            // This completes the object to satisfy the LiveDetails interface.
            const details: LiveDetails = {
                streamerName: streamer.nickname || streamer.name,
                streamerAvatarUrl: streamer.avatar_url || '',
                streamerFollowers: streamer.followers || 0,
                viewerCount: liveStream.current_viewers?.length || 0,
                totalVisitors: (liveStream.current_viewers?.length || 0) + Math.floor(Math.random() * 20), // mock
                receivedGiftsValue: liveStream.received_gifts_value || 0,
                rankingPosition: `Top ${Math.floor(Math.random() * 10) + 1}%`, // mock
                status: 'ao vivo',
                likeCount: liveStream.like_count || 0,
                streamerIsAvatarProtected: streamer.is_avatar_protected,
                title: liveStream.titulo,
                meta: liveStream.meta ?? undefined,
            };
            return details;
        }
    }
    
    if (liveSubpathMatch) {
        const liveId = parseInt(liveSubpathMatch[1], 10);
        const action = liveSubpathMatch[2];
        const liveStream = await database.liveStreams.findOne({ id: liveId });
        if (!liveStream) throw new Error('Live stream not found for action');

        switch(action) {
            case 'join':
                if (!liveStream.current_viewers?.includes(body.userId)) {
                    await database.liveStreams.updateOne({ id: liveId }, { $push: { current_viewers: body.userId } });
                }
                return { success: true };
            case 'leave':
                await database.liveStreams.updateOne({ id: liveId }, { $pull: { current_viewers: body.userId } });
                return { success: true };
            case 'viewers':
                 const viewers = await database.users.find({ id: { '$in': liveStream.current_viewers || [] } });
                 const streamer = await database.users.findOne({ id: liveStream.user_id });
                 const allGiftsInStream = await database.sentGifts.find({ liveId: liveId });
                 
                 const contributions: { [viewerId: number]: number } = {};
                 for (const gift of allGiftsInStream) {
                    if (gift.receiverId === liveStream.user_id) { // Only count gifts to the main host
                        contributions[gift.senderId] = (contributions[gift.senderId] || 0) + gift.diamondCost;
                    }
                 }

                 const viewerModels: Viewer[] = viewers.map(v => ({
                     id: v.id, name: v.nickname || v.name, avatarUrl: v.avatar_url || '',
                     entryTime: new Date().toISOString(), contribution: contributions[v.id] || 0,
                     level: v.level, level2: v.level2 || 1
                 }));

                 if (streamer) {
                    viewerModels.unshift({
                         id: streamer.id, name: streamer.nickname || streamer.name, avatarUrl: streamer.avatar_url || '',
                         entryTime: liveStream.inicio, contribution: 999999, // Host has max contribution
                         level: streamer.level, level2: streamer.level2 || 1
                    });
                 }
                 return viewerModels.sort((a,b) => b.contribution - a.contribution);
            case 'like':
                await database.liveStreams.updateOne({ id: liveId }, { $set: { like_count: (liveStream.like_count || 0) + 1 } });
                const like = { id: Date.now(), userId: body.userId, liveId, timestamp: new Date().toISOString() };
                await database.likes.insertOne(like);
                return like;
            case 'gift':
                 const { senderId, giftId, quantity, receiverId } = body;
                 const sender = await database.users.findOne({ id: senderId });
                 const gift = await database.gifts.findOne({ id: giftId });
                 if (!sender || !gift) throw new Error('Sender or gift not found');

                 const totalCost = gift.price * quantity;
                 if (sender.wallet_diamonds < totalCost) {
                     return { success: false, updatedUser: sender, message: 'Diamantes insuficientes.' };
                 }

                 sender.wallet_diamonds -= totalCost;
                 sender.xp += gift.valor_pontos * quantity;
                 sender.level = levelService.calculateLevelFromXp(sender.xp);
                 await database.users.updateOne({ id: senderId }, { $set: sender });

                 const targetReceiverId = receiverId || liveStream.user_id;
                 const receiver = await database.users.findOne({ id: targetReceiverId });
                 if (receiver) {
                     receiver.wallet_earnings += gift.valor_pontos * quantity;
                     await database.users.updateOne({ id: targetReceiverId }, { $set: receiver });
                 }
                 
                 // Update stream gift value
                 liveStream.received_gifts_value = (liveStream.received_gifts_value || 0) + (gift.valor_pontos * quantity);
                 
                 // Add to chat
                 const receiverUser = await database.users.findOne({ id: targetReceiverId });
                 const chatMessage: ChatMessage = {
                    id: Date.now(), type: 'gift', userId: senderId, username: sender.nickname || sender.name,
                    message: `enviou ${gift.name}!`, giftId: gift.id, giftName: gift.name, giftValue: gift.price,
                    giftAnimationUrl: gift.animationUrl, giftImageUrl: gift.imageUrl, recipientName: receiverUser?.nickname || 'o anfitrião',
                    quantity, timestamp: new Date().toISOString(), globalLevel: sender.level, avatarUrl: sender.avatar_url,
                 };
                 if (!liveStream.chatMessages) liveStream.chatMessages = [];
                 liveStream.chatMessages.push(chatMessage);

                 await database.liveStreams.updateOne({ id: liveId }, { $set: liveStream });
                 
                 // Log sent gift
                 await database.sentGifts.insertOne({
                    id: Date.now(),
                    senderId,
                    receiverId: targetReceiverId,
                    liveId,
                    giftId,
                    giftValue: gift.valor_pontos,
                    diamondCost: totalCost,
                    quantity,
                    timestamp: new Date().toISOString()
                 });

                 return { success: true, updatedUser: sender, message: 'Presente enviado!' };
            case 'summary':
                const streamerForSummary = await database.users.findOne({ id: liveStream.user_id });
                const summary: LiveEndSummary = {
                    streamerId: liveStream.user_id,
                    streamerName: streamerForSummary?.nickname || 'Streamer',
                    streamerAvatarUrl: streamerForSummary?.avatar_url || '',
                    durationSeconds: (new Date().getTime() - new Date(liveStream.inicio).getTime()) / 1000,
                    peakViewers: (liveStream.current_viewers?.length || 0) + 10,
                    totalEarnings: liveStream.received_gifts_value || 0,
                    newFollowers: 5,
                    newMembers: 2,
                    newFans: 1
                };
                return summary;
        }
    }
    
    // --- Live Stream Start/Stop ---
    if (method === 'POST' && path === '/api/live/start') {
// FIX: A destructuring declaration must have an initializer.
        const { userId, title, meta, category, isPrivate, isPkEnabled, thumbnailUrl, entryFee, cameraUsed } = body;
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error('User not found');

        // Stop any existing stream for the user
        await database.liveStreams.updateOne({ user_id: userId, ao_vivo: true }, { $set: { ao_vivo: false } });

        const newStream: LiveStreamRecord = {
            id: Date.now(),
            user_id: userId,
            titulo: title,
            meta: meta,
            nome_streamer: user.nickname || user.name,
            thumbnail_url: thumbnailUrl,
            espectadores: 0,
            categoria: category,
            ao_vivo: true,
            em_pk: false,
            is_private: isPrivate,
            entry_fee: entryFee,
            inicio: new Date().toISOString(),
            permite_pk: isPkEnabled,
            camera_facing_mode: cameraUsed,
            current_viewers: [],
            chatMessages: [],
        };
        await database.liveStreams.insertOne(newStream);
        
        // Save preferences
        await database.users.updateOne({ id: userId }, { $set: {
            last_camera_used: cameraUsed,
            last_selected_category: category,
            pk_enabled_preference: isPkEnabled,
            lastLiveTitle: title,
            lastLiveMeta: meta,
        }});

        const response: StartLiveResponse = {
            live: mapLiveRecordToStream(newStream),
            urls: {
                rtmp: `${SRS_URL_PUBLISH}/${newStream.id}`,
                hls: `${SRS_URL_PLAY_HLS}/${newStream.id}.m3u8`,
                webrtc: `${SRS_URL_PLAY_WEBRTC}/${newStream.id}`,
                streamKey: `sk_${newStream.id}_${userId}`
            }
        };
        return response;
    }

    if (method === 'POST' && path.startsWith('/api/users/') && path.endsWith('/stop-live')) {
        const userId = parseInt(path.split('/')[3], 10);
        await database.liveStreams.updateOne({ user_id: userId, ao_vivo: true }, { $set: { ao_vivo: false, em_pk: false } });
        return { success: true };
    }

    // --- Private Chat ---
    const privateChatMatch = path.match(privateChatRegex);
    if (method === 'GET' && privateChatMatch) {
        const convoId = privateChatMatch[1];
        const currentUserId = parseInt(query.get('userId') || '0');
        const convo = await database.conversations.findOne({ id: convoId });
        if (!convo || !convo.participants.includes(currentUserId)) throw new Error('Conversation not found or access denied.');

        // Mark messages as seen
        (convo.messages || []).forEach((msg: any) => {
            if (msg.senderId !== currentUserId && !(msg.seenBy || []).includes(currentUserId)) {
                if (!msg.seenBy) msg.seenBy = [];
                msg.seenBy.push(currentUserId);
                msg.status = 'seen';
            }
        });
        await database.conversations.updateOne({ id: convoId }, { $set: { messages: convo.messages } });

        const viewModel = await buildConversationViewModel(convo, currentUserId);
        if (!viewModel) {
            throw new Error("Could not build conversation view model");
        }
        return viewModel;
    }
    
    if (method === 'POST' && path === '/api/chat/viewed') {
        const { conversationId, viewerId } = body;
        const convo = await database.conversations.findOne({ id: conversationId });
        if (!convo) {
            // This can happen for virtual conversations like "friend requests"
            // or if the convo was deleted. Returning success prevents an error cascade.
            return { success: true };
        }

        let modified = false;
        (convo.messages || []).forEach((msg: any) => {
            if (msg.senderId !== viewerId) {
                if (!msg.seenBy) {
                    msg.seenBy = [];
                }
                if (!msg.seenBy.includes(viewerId)) {
                    msg.seenBy.push(viewerId);
                    modified = true;
                }
            }
        });
        
        if (modified) {
            await database.conversations.updateOne({ id: conversationId }, { $set: { messages: convo.messages } });
        }
        
        return { success: true };
    }

    if (method === 'POST' && privateChatMatch) {
        const convoId = privateChatMatch[1];
        const { senderId, text, imageUrl } = body;
        const convo = await database.conversations.findOne({ id: convoId });
        if (!convo) throw new Error('Conversation not found');

        const newMessage: ConversationMessage = {
            id: mongoObjectId(),
            senderId: senderId,
            type: imageUrl ? 'image' : 'text',
            text: text || null,
            imageUrl: imageUrl || null,
            timestamp: new Date().toISOString(),
            status: 'sent',
            seenBy: [senderId]
        };
        
        await database.conversations.updateOne({ id: convoId }, { $push: { messages: newMessage } });

        const updatedConvoRaw = await database.conversations.findOne({ id: convoId });
        if (!updatedConvoRaw) throw new Error("Could not retrieve updated conversation");

        const updatedViewModel = await buildConversationViewModel(updatedConvoRaw, senderId);
        if (!updatedViewModel) throw new Error("Could not build updated conversation view model");
        
        return updatedViewModel;
    }
    
    if (method === 'POST' && path === '/api/chat/private/get-or-create') {
        const { currentUserId, otherUserId } = body;
        let convo = await database.conversations.findOne({
            participants: { $all: [currentUserId, otherUserId], $size: 2 }
        });

        if (!convo) {
            const p1 = Math.min(currentUserId, otherUserId);
            const p2 = Math.max(currentUserId, otherUserId);
            const newConvoData = {
                id: `convo_${p1}_${p2}`,
                participants: [currentUserId, otherUserId],
                messages: []
            };
            await database.conversations.insertOne(newConvoData);
            // Re-fetch to get the full object from the "database"
            convo = await database.conversations.findOne({ id: newConvoData.id });
        }
        
        if (!convo) {
            // This should not happen if insert was successful.
            throw new Error("Failed to create and then find conversation.");
        }
        
        const viewModel = await buildConversationViewModel(convo, currentUserId);
        if (!viewModel) {
            throw new Error("Could not build conversation view model");
        }
        return viewModel;
    }
    
    // --- GIFTS ---
    if (method === 'GET' && path === '/api/gifts') {
        return await database.gifts.find();
    }

    if (method === 'POST' && path === '/api/ranking/help-host') {
        const { senderId, hostId, giftValue } = body;
        const sender = await database.users.findOne({ id: senderId });
        if (!sender) {
            return { success: false, message: "Remetente não encontrado.", updatedUser: null };
        }
        if (sender.wallet_diamonds < giftValue) {
            return { success: false, message: "Diamantes insuficientes.", updatedUser: sender };
        }

        sender.wallet_diamonds -= giftValue;
        sender.xp += giftValue; // Give sender some XP for helping
        sender.level = levelService.calculateLevelFromXp(sender.xp);
        await database.users.updateOne({ id: senderId }, { $set: sender });

        // Update host's score (represented by earnings)
        const host = await database.users.findOne({ id: hostId });
        if (host) {
            const updatedEarnings = (host.wallet_earnings || 0) + giftValue;
            await database.users.updateOne({ id: hostId }, { $set: { wallet_earnings: updatedEarnings } });
        }

        return { success: true, message: "Host ajudado com sucesso!", updatedUser: sender };
    }
    
    // --- Ranking ---
    const rankingUserListMatch = path.match(rankingUsersRegex);
    if(method === 'GET' && rankingUserListMatch) {
        const users = await database.users.find();
        users.sort((a,b) => b.xp - a.xp); // Rank by XP
        const userRanking: UniversalRankingUser[] = users.map((u, i) => ({
            rank: i + 1,
            userId: u.id,
            avatarUrl: u.avatar_url || '',
            name: u.nickname || u.name,
            score: (u.wallet_diamonds || 0) * 10,
            level: u.level,
            gender: u.gender,
            badges: [
                { type: 'flag', value: u.country === 'BR' ? '🇧🇷' : '🇺🇸' },
                { type: 'level', value: u.level },
            ]
        }));
        const response: UniversalRankingData = {
            podium: userRanking.slice(0,3),
            list: userRanking.slice(3, 20),
        };
        return response;
    }

    const rankingStreamersMatch = path.match(rankingStreamersRegex);
    if(method === 'GET' && rankingStreamersMatch) {
        const users = await database.users.find();
        users.sort((a,b) => (b.wallet_earnings || 0) - (a.wallet_earnings || 0)); // Rank by earnings
        const streamerRanking: GeneralRankingStreamer[] = users.slice(0, 20).map((u, i) => ({
             rank: i + 1,
             userId: u.id,
             username: u.nickname || u.name,
             avatarUrl: u.avatar_url || '',
             level: u.level,
             score: u.wallet_earnings || 0,
        }));
        return streamerRanking;
    }
    
    const rankingHourlyMatch = path.match(rankingHourlyRegex);
    if (method === 'GET' && rankingHourlyMatch) {
        const allUsers = await database.users.find();
        // Give everyone a random score to simulate a global ranking, based on their earnings
        const usersWithScores = allUsers.map(u => ({
            ...u,
            score: Math.floor(Math.random() * 5000) + (u.wallet_earnings || 0) + (u.wallet_diamonds || 0)
        })).sort((a, b) => b.score - a.score);

        const ranking: UniversalRankingUser[] = usersWithScores.slice(0, 100).map((u, i) => ({
            rank: i + 1,
            userId: u.id,
            avatarUrl: u.avatar_url || '',
            name: u.nickname || u.name,
            score: u.score,
            level: u.level,
            gender: u.gender,
            badges: [
                 { type: 'flag', value: u.country === 'BR' ? '🇧🇷' : '🇺🇸' },
                 { type: 'level', value: u.level },
            ]
        }));
        
        const currentUserInRanking = ranking.find(u => u.userId === 10755083) || {
            rank: '>99', userId: 10755083, avatarUrl: (await database.users.findOne({id:10755083}))!.avatar_url!, name: 'Você', score: 123, level: 1, gender: 'male', badges: [{type: 'flag', value: '🇧🇷'}, {type: 'level', value: 1}]
        };

        const response: UniversalRankingData = {
            // FIX: The 'rank' property in UniversalRankingUser can be a string (e.g., '>99'), but in this context, 
            // it's always a number from the array creation logic. Cast to number to satisfy the compiler.
            podium: ranking.filter(u => (u.rank as number) <= 3),
            // FIX: The 'rank' property in UniversalRankingUser can be a string (e.g., '>99'), but in this context, 
            // it's always a number from the array creation logic. Cast to number to satisfy the compiler.
            list: ranking.filter(u => (u.rank as number) > 3),
            currentUserRanking: currentUserInRanking,
            countdown: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            footerButtons: {
                primary: { text: "Ajude este usuário a subir no ranking.", value: "100" },
                secondary: { text: "Saiba mais sobre o ranking", value: "more" }
            }
        };
        return response;
    }

    // --- HELP ARTICLES & CONTACTS ---
    const helpArticleMatch = path.match(helpArticleByIdRegex);
    if(method === 'GET' && helpArticleMatch) {
        const articleId = helpArticleMatch[1];
        if (articleId === 'faq') { // Special case for FAQ summary
            const faqArticles = await database.helpArticles.find({ categoria: 'FAQ' });
            return {
                id: 'faq',
                titulo: 'Perguntas Frequentes (FAQ)',
                conteudo: faqArticles.map(a => `<h3>${a.titulo}</h3><div>${a.conteudo}</div>`).join('<hr class="my-4 border-gray-700">'),
                categoria: 'FAQ' as const,
                ordem_exibicao: 0, visualizacoes: 0, is_ativo: false
            };
        }
        const article = await database.helpArticles.findOne({ id: articleId });
        if (!article) throw new Error('Article not found');
        return article;
    }

    if(method === 'GET' && path === '/api/help/articles') {
        const category = query.get('category');
        if (category) {
            return await database.helpArticles.find({ categoria: category });
        }
        return await database.helpArticles.find();
    }
    
    if(method === 'GET' && path === '/api/help/contact-channels') {
        return await database.contactChannels.find();
    }
    
    if(method === 'GET' && path === '/api/version') {
        return {
            minVersion: '1.0.0',
            latestVersion: '1.0.0',
            updateUrl: 'https://example.com/update'
        };
    }

    if (method === 'GET' && path === '/api/live/categories') {
        return liveCategories;
    }

    // --- MONITORING & DIAGNOSTICS ---
    if (method === 'GET' && path === '/api/monitor/health-check') {
        await delay(500); // Simulate network latency for the check itself
        const MOCK_USER_ID = 10755083;
        const MOCK_LIVE_ID = 101;

        const endpointsToTest = [
            { endpoint: '/api/lives', method: 'GET', details: 'Popular stream list' },
            { endpoint: `/api/lives/${MOCK_LIVE_ID}`, method: 'GET', details: 'Live stream details' },
            { endpoint: `/api/chat/live/${MOCK_LIVE_ID}`, method: 'GET', details: 'Live chat history' },
            { endpoint: '/api/auth/google', method: 'POST', details: 'User authentication' },
            { endpoint: `/api/users/${MOCK_USER_ID}/profile`, method: 'GET', details: 'User public profile' },
            { endpoint: `/api/users/${MOCK_USER_ID}/following`, method: 'GET', details: 'User following list' },
            { endpoint: '/api/gifts', method: 'GET', details: 'Gift catalog' },
            { endpoint: '/api/purchase', method: 'POST', details: 'Purchase initiation endpoint' },
            { endpoint: `/api/users/${MOCK_USER_ID}/withdrawal-balance`, method: 'GET', details: 'Withdrawal balance' },
            { endpoint: '/api/lives/pk', method: 'GET', details: 'PK battles list' },
            { endpoint: `/api/users/search?q=test`, method: 'GET', details: 'User search' },
            { endpoint: `/api/users/${MOCK_USER_ID}/privacy-settings`, method: 'GET', details: 'User privacy settings' },
            { endpoint: '/api/non-existent-path', method: 'GET', details: 'Non-existent endpoint check', expectError: true },
        ];
        
        const results: HealthCheckResult[] = [];

        for (const test of endpointsToTest) {
            try {
                // In a real scenario, you'd actually call the handler.
                // Here, we just simulate success unless it's an expected error test.
                if (test.expectError) {
                    results.push({ endpoint: test.endpoint, method: test.method, status: 'NOT_FOUND', details: `${test.details} responded correctly.` });
                } else {
                    results.push({ endpoint: test.endpoint, method: test.method, status: 'OK', details: `${test.details} is operational.` });
                }
            } catch (e: any) {
                 results.push({ endpoint: test.endpoint, method: test.method, status: 'ERROR', details: e.message });
            }
        }
        return results;
    }

    if (method === 'GET' && path === '/api/diagnostics/full-test') {
        await delay(1500); // Simulate a longer test
        const db = getRawDb();
        const report = `
        ## Full API Diagnostics Report
        - **Timestamp:** ${new Date().toISOString()}
        - **Test Duration:** 1489ms
        
        ### Latency Test (Internal vs. External)
        - **Internal DB (mock):** 45ms average
        - **External Service (mock):** 250ms average
        - **Conclusion:** No significant latency issues detected.

        ### Database Integrity Check
        - User Count: ${db.users.length}
        - Active Streams: ${db.liveStreams.filter(s => s.ao_vivo).length}
        - **Conclusion:** All data integrity checks passed.
        `;
        return { report };
    }

    // --- SUPPORT CHAT ---
    if (path.startsWith('/api/support/conversation/')) {
        const userId = parseInt(path.split('/').pop()!, 10);
        let convo = await database.conversations.findOne({ participants: { $all: [userId, 999], $size: 2 } });
        if (!convo) {
            const newConvoData = {
                id: `support_${userId}`,
                participants: [userId, 999],
                messages: [{ id: mongoObjectId(), senderId: 999, type: 'text' as const, text: 'Olá! Como podemos ajudar você hoje?', imageUrl: null, timestamp: new Date().toISOString(), status: 'sent' as const, seenBy: [999] }]
            };
            await database.conversations.insertOne(newConvoData);
            convo = await database.conversations.findOne({ id: newConvoData.id });
        }
        
        if(!convo) {
            throw new Error("Failed to get or create support conversation.");
        }

        const viewModel = await buildConversationViewModel(convo, userId);
        if (!viewModel) {
            throw new Error("Could not build support conversation view model");
        }
        
        return viewModel;
    }

    // Fallback for unhandled routes
    throw new Error(`[Mock API] 404 Not Found: ${method} ${path}`);
};