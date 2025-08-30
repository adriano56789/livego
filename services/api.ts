// This file contains the complete mock API server, including the in-memory database,
// routing logic, and all endpoint handlers. It fully simulates the backend.

import * as levelService from './levelService';
import { database, getRawDb } from './database';
import { mongoObjectId } from './mongoObjectId';
// FIX: Added missing UniversalRankingUser type import.
import type { User, LiveStreamRecord, Stream, PkBattle, PkBattleState, PurchaseOrder, ConvitePK, LiveCategory, Category, StartLiveResponse, FacingMode, LiveDetails, ChatMessage, Viewer, PublicProfile, AppEvent, ArtigoAjuda, CanalContato, HealthCheckResult, PrivateLiveInviteSettings, NotificationSettings, GiftNotificationSettings, PrivacySettings, LiveFollowUpdate, WithdrawalBalance, UserLevelInfo, InventoryItem, WithdrawalTransaction, RankingContributor, Conversation, ConversationMessage, UniversalRankingData, UniversalRankingUser, GeneralRankingStreamer, GeneralRankingUser } from '../types';

// --- SIMULATED ENVIRONMENT VARIABLES ---
const SRS_URL_PUBLISH = 'rtmp://localhost/live';
const SRS_URL_PLAY_WEBRTC = 'webrtc://localhost/live';
const SRS_URL_PLAY_HLS = 'http://localhost:8080/live';

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
                const allConvos = await database.conversations.find();
                const userConvos = allConvos.filter(c => c.participants.includes(userId));

                const viewModels = await Promise.all(userConvos.map(async (convo: any) => {
                    const otherUserId = convo.participants.find((pId: number) => pId !== userId);
                    if (!otherUserId) return null;

                    const otherUser = await database.users.findOne({ id: otherUserId });
                    if (!otherUser) return null;
                    
                    const messages = convo.messages || [];
                    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

                    const unreadCount = messages.filter((msg: any) => msg.senderId !== userId && !(msg.seenBy || []).includes(userId)).length;

                    return {
                        id: convo.id,
                        participants: convo.participants,
                        otherUserId: otherUserId,
                        otherUserName: otherUser.nickname || otherUser.name,
                        otherUserAvatarUrl: otherUser.avatar_url || '',
                        isFriend: true, // simplified for now
                        unreadCount,
                        messages: lastMessage ? [lastMessage] : [],
                    } as Conversation;
                }));

                let convos = viewModels.filter(vm => vm !== null).sort((a, b) => {
                     const lastMsgA = a!.messages[0];
                     const lastMsgB = b!.messages[0];
                     if (!lastMsgB) return -1;
                     if (!lastMsgA) return 1;
                     return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
                }) as Conversation[];
                
                 // Mock friend requests summary
                const allUsers = await database.users.find();
                const requests = allUsers.filter(u => (u.following || []).includes(userId));
                const currentUser = await database.users.findOne({ id: userId });
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
        }
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

    if (method === 'GET' && chatMatch) {
        const liveId = parseInt(chatMatch[1], 10);
        const stream = await database.liveStreams.findOne({ id: liveId });
        return stream?.chatMessages || [];
    }
    
    if (liveDetailMatch) {
        const liveId = parseInt(liveDetailMatch[1], 10);
        if (method === 'GET') {
            const liveStream = await database.liveStreams.findOne({ id: liveId });
            if (!liveStream) throw new Error('Live stream not found');
            const streamer = await database.users.findOne({ id: liveStream.user_id });
            if (!streamer) throw new Error('Streamer not found');
            
            const details: LiveDetails = {
                streamerName: streamer.nickname || streamer.name