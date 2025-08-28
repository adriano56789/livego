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
        isFriend,
        unreadCount: unreadCount,
        messages: messagesForConvo
    };
};

// A single source of truth for constructing a full User view model
const getFullUser = async (userId: number): Promise<types.User | null> => {
    const user = await database.users.findOne({ id: userId });
    if (!user) return null;

    const followers = await database.users.find({ following: { $in: [userId] } });
    const visitors = await database.profileVisits.find({ visitedId: userId });

    // This ensures that even if the DB record is missing an array, the frontend gets an empty one.
    // It also adds dynamically calculated fields.
    const fullUser: types.User = {
        ...user,
        followers: followers.length,
        visitors: visitors.length,
        level: levelService.calculateLevelFromXp(user.xp),
        age: calculateAge(user.birthday),
        following: user.following || [],
        photo_gallery: user.photo_gallery || [],
        personalityTags: user.personalityTags || [],
        achievements: user.achievements || [],
        languages: user.languages || [],
        paid_stream_ids: user.paid_stream_ids || [],
        settings: {
            notifications: user.settings?.notifications ?? { newMessages: true, streamerLive: true, followedPost: true, order: true, interactive: true },
            privacy: user.settings?.privacy ?? { showLocation: true, showActiveStatus: true, showInNearby: true, protectionEnabled: false },
            privateLiveInvite: user.settings?.privateLiveInvite ?? { privateInvites: true, onlyFollowing: true, onlyFans: false, onlyFriends: false, acceptOnlyFriendPkInvites: false },
            giftNotifications: user.settings?.giftNotifications ?? { userId, enabledGifts: {} }
        }
    };
    return fullUser;
};


// --- THE BRAIN of the MOCK API ---
// This function acts as a router for all incoming API requests.
export const handleApiRequest = async (method: string, path: string, body: any, query: URLSearchParams): Promise<any> => {
    let match: RegExpMatchArray | null;

    // --- Version Check ---
    if (method === 'GET' && path === '/api/version') {
        return {
            minVersion: '1.0.0',
            latestVersion: '1.0.0',
            updateUrl: 'https://example.com/update',
        };
    }

    // --- Auth & User ---
    if (method === 'POST' && path === '/api/auth/google') {
        const accountId = body.accountId || 10755083; // Default to main user if no ID specified
        const user = await getFullUser(accountId);
        if (user) {
            return user;
        }
        throw new Error('Usuário não encontrado');
    }

    // --- User Profile & Lists ---
    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/profile$/))) {
        const userId = parseInt(match[1], 10);
        const viewerId = query.get('viewerId') ? parseInt(query.get('viewerId')!, 10) : null;
        
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error('Usuário não encontrado');
        
        const isLiveRecord = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
        const followers = await database.users.find({ following: { $in: [userId] } });
        const protectors = await database.sentGifts.find({ receiverId: userId });
        const giftsReceived = await database.sentGifts.find({ receiverId: userId });
        const giftsSent = await database.sentGifts.find({ senderId: userId });

        let isFollowing = false;
        let isFriend = false;
        if(viewerId) {
            const viewer = await database.users.findOne({ id: viewerId });
            isFollowing = (viewer?.following || []).includes(userId);
            isFriend = isFollowing && (user.following || []).includes(viewerId);
        }

        const receivedValue = giftsReceived.reduce((sum, gift) => sum + gift.diamondCost, 0);
        const sentValue = giftsSent.reduce((sum, gift) => sum + gift.diamondCost, 0);

        const publicProfile: types.PublicProfile = {
            id: user.id,
            name: user.name,
            nickname: user.nickname || user.name,
            avatarUrl: user.avatar_url || '',
            age: calculateAge(user.birthday),
            gender: user.gender,
            birthday: user.birthday,
            isLive: !!isLiveRecord,
            isFollowing,
            isFriend,
            followers: followers.length,
            followingCount: (user.following || []).length,
            recebidos: receivedValue,
            enviados: sentValue,
            coverPhotoUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
            stats: { value: 12345, icon: 'coin' },
            badges: [
                { text: String(user.level), type: 'level' },
                ...(user.gender && user.birthday ? [{ text: String(calculateAge(user.birthday)), type: 'gender_age', icon: user.gender }] : []),
            ] as types.ProfileBadgeType[],
            protectors: [],
            achievements: [],
            personalityTags: user.personalityTags || [{ id: 'sensual', label: 'Sensual' }],
            personalSignature: user.personalSignature || 'Novinha bem safadinha',
        };

        return publicProfile;
    }

    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)$/))) {
        const userId = parseInt(match[1], 10);
        const user = await getFullUser(userId);
        if (!user) throw new Error('Usuário não encontrado');
        return user;
    }

    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/following$/))) {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) {
            throw new Error('Usuário não encontrado');
        }
        if (!user.following || user.following.length === 0) {
            return [];
        }
        const followingUsers = await database.users.find({ id: { $in: user.following } });
        return followingUsers;
    }

    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/followers$/))) {
        const userId = parseInt(match[1], 10);
        const followers = await database.users.find({ following: { $in: [userId] } });
        return followers;
    }

    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/fans$/))) {
        // In this mock, fans are just followers. In a real app, this could be based on gift value.
        const userId = parseInt(match[1], 10);
        const followers = await database.users.find({ following: { $in: [userId] } });
        return followers;
    }

    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/visitors$/))) {
        const userId = parseInt(match[1], 10);
        const visits = await database.profileVisits.find({ visitedId: userId });
        const visitorIds = [...new Set(visits.map(v => v.visitorId))];
        const visitors = await database.users.find({ id: { $in: visitorIds } });
        // Add last visit date to the user object for display
        return visitors.map(v => {
            const lastVisit = visits.filter(visit => visit.visitorId === v.id).sort((a,b) => b.date.getTime() - a.date.getTime())[0];
            return { ...v, last_visit_date: lastVisit.date.toISOString() };
        });
    }

    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/friends$/))) {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error('Usuário não encontrado');
        const followingIds = user.following || [];
        const potentialFriends = await database.users.find({ id: { $in: followingIds } });
        const friends = potentialFriends.filter(pf => (pf.following || []).includes(userId));
        return friends;
    }
    
    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/friend-requests$/))) {
        const userId = parseInt(match[1], 10);
        const allUsers = await database.users.find({});
        const currentUser = allUsers.find(u => u.id === userId);
        if (!currentUser) throw new Error("Usuário não encontrado");
        
        const myFollowingList = (currentUser.following) || [];
        // A friend request is someone who follows me, but I don't follow back yet.
        const requests = allUsers.filter(u => 
            (u.following || []).includes(userId) && 
            !myFollowingList.includes(u.id)
        );

        // Add a fake timestamp for display purposes
        return requests.map(u => ({ ...u, followTimestamp: new Date().toISOString() }));
    }
     if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/cohost-friends$/))) {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error('Usuário não encontrado');
        const followingIds = user.following || [];
        if (followingIds.length === 0) return [];
        
        const potentialFriends = await database.users.find({ id: { $in: followingIds } });
        
        const friends = potentialFriends.filter(pf => (pf.following || []).includes(userId));

        // Add mock co-host history
        return friends.map((friend, index) => ({
            ...friend,
            coHostHistory: index % 2 === 0 ? 'Co-host com Você' : 'Recomendado'
        }));
    }

    // --- User Settings ---
    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/notification-settings$/))) {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error("Usuário não encontrado");
        return user.settings?.notifications ?? {
            newMessages: true,
            streamerLive: true,
            followedPost: true,
            order: true,
            interactive: true,
        };
    }

    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/gift-notification-settings$/))) {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error('Usuário não encontrado');
        return {
            userId,
            enabledGifts: user.settings?.giftNotifications?.enabledGifts || {},
        };
    }

    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/private-live-invite-settings$/))) {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error("Usuário não encontrado");
        
        const settings = user.settings?.privateLiveInvite ?? {
            privateInvites: true,
            onlyFollowing: true,
            onlyFans: false,
            onlyFriends: false,
            acceptOnlyFriendPkInvites: false,
        };
        
        return {
            userId,
            ...settings,
        } as types.PrivateLiveInviteSettings;
    }


    if (method === 'POST' && path === '/api/follows') {
        const { followerId, followingId } = body;
        await database.users.updateOne({ id: followerId }, { $push: { following: followingId } });
        const updatedUser = await getFullUser(followerId);
        if (!updatedUser) throw new Error('Usuário não encontrado após seguir');
        return updatedUser;
    }

    if (method === 'DELETE' && (match = path.match(/^\/api\/follows\/(\d+)\/(\d+)$/))) {
        const followerId = parseInt(match[1], 10);
        const followingId = parseInt(match[2], 10);
        await database.users.updateOne({ id: followerId }, { $pull: { following: followingId } });
        const updatedUser = await getFullUser(followerId);
        if (!updatedUser) throw new Error('Usuário não encontrado após deixar de seguir');
        return updatedUser;
    }

    if (method === 'PUT' && (match = path.match(/^\/api\/users\/(\d+)$/))) {
        const userId = parseInt(match[1], 10);
        await database.users.updateOne({ id: userId }, { $set: body });
        const updatedUser = await getFullUser(userId);
        if (!updatedUser) throw new Error('Usuário não encontrado');
        return updatedUser;
    }

    if (method === 'PATCH' && (match = path.match(/^\/api\/users\/(\d+)\/avatar$/))) {
        const userId = parseInt(match[1], 10);
        await database.users.updateOne({ id: userId }, { $set: { avatar_url: body.photoDataUrl, has_uploaded_real_photo: true } });
        const updatedUser = await getFullUser(userId);
        if (!updatedUser) throw new Error('Usuário não encontrado');
        return updatedUser;
    }

    // GET /api/users/:userId/conversations
    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/conversations$/))) {
        const userId = parseInt(match[1], 10);
        const allUsers = await database.users.find({});
        const currentUser = allUsers.find(u => u.id === userId);
        if (!currentUser) throw new Error("Usuário não encontrado");
        
        const userConversations = (await database.conversations.find({})).filter(c => c.participants.includes(userId));
        const viewModels = userConversations.map(c => buildConversationViewModel(c, userId, allUsers));

        // Create a summary for friend requests
        const myFollowingList = currentUser.following || [];
        const requests = allUsers.filter(u => 
            (u.following || []).includes(userId) && 
            !myFollowingList.includes(u.id)
        );
        if (requests.length > 0) {
            viewModels.unshift({
                id: 'friend-requests-summary',
                type: 'friend_requests_summary',
                participants: [userId],
                otherUserId: -1,
                otherUserName: 'Pedidos de amizade',
                otherUserAvatarUrl: '',
                unreadCount: requests.length,
                messages: [{ id: 'fr-msg', senderId: -1, type: 'system', text: `${requests.length} novo(s) pedido(s) de amizade`, imageUrl: null, timestamp: new Date().toISOString(), status: 'sent', seenBy: [] }]
            });
        }

        return viewModels.sort((a, b) => {
            const messagesA = a.messages || [];
            const messagesB = b.messages || [];
            if (messagesA.length === 0) return 1;
            if (messagesB.length === 0) return -1;
            const lastMsgA = messagesA[messagesA.length - 1];
            const lastMsgB = messagesB[messagesB.length - 1];
            return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
        });
    }

    // GET /api/users/:userId/live-preferences
    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/live-preferences$/))) {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) {
            // Return defaults if user not found or has no preferences
            return { isPkEnabled: true, lastCameraUsed: 'user', lastSelectedCategory: 'Popular' };
        }
        return {
            isPkEnabled: user.pk_enabled_preference ?? true,
            lastCameraUsed: user.last_camera_used || 'user',
            lastSelectedCategory: user.last_selected_category || 'Popular',
            lastLiveTitle: user.lastLiveTitle || '',
            lastLiveMeta: user.lastLiveMeta || '',
        };
    }

    // POST /api/live/start
    if (method === 'POST' && path === '/api/live/start') {
        const { userId, title, meta, category, isPrivate, isPkEnabled, thumbnailUrl, entryFee, cameraUsed } = body;
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error('Usuário não encontrado para iniciar a transmissão');

        const existingLive = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
        if (existingLive) {
            throw new Error('O usuário já está em uma transmissão ao vivo.');
        }
        
        await database.users.updateOne({ id: userId }, { $set: { 
            pk_enabled_preference: isPkEnabled, 
            last_camera_used: cameraUsed,
            last_selected_category: category,
            lastLiveTitle: title,
            lastLiveMeta: meta,
        }});
        
        const newStreamRecord: Omit<types.LiveStreamRecord, '_id' | 'id'> = {
            user_id: userId,
            titulo: title,
            meta: meta,
            nome_streamer: user.nickname || user.name,
            thumbnail_url: thumbnailUrl,
            espectadores: 1,
            categoria: category,
            ao_vivo: true,
            em_pk: false,
            is_private: isPrivate,
            entry_fee: entryFee || null,
            inicio: new Date().toISOString(),
            permite_pk: isPkEnabled,
            country_code: user.country,
            camera_facing_mode: cameraUsed,
            current_viewers: [userId],
            chatMessages: []
        };

        const insertedId = mongoObjectId();
        const newStreamWithId = { ...newStreamRecord, id: Date.now(), _id: insertedId };
        (getRawDb().liveStreams as any[]).push(newStreamWithId);
        
        const streamViewModel = mapLiveRecordToStream(newStreamWithId as types.LiveStreamRecord);

        const response: types.StartLiveResponse = {
            live: streamViewModel,
            urls: {
                rtmp: `${SRS_URL_PUBLISH}/${streamViewModel.id}`,
                hls: `${SRS_URL_PLAY_HLS}/${streamViewModel.id}.m3u8`,
                webrtc: `${SRS_URL_PLAY_WEBRTC}/${streamViewModel.id}`,
                streamKey: `sk_${streamViewModel.id}_${Math.random().toString(36).substring(7)}`
            }
        };
        return response;
    }

    if (method === 'POST' && (match = path.match(/^\/api\/users\/(\d+)\/stop-live$/))) {
        const userId = parseInt(match[1], 10);
        const liveStream = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });

        if (!liveStream) {
            // Stream might have been ended by other means (e.g. PK battle ending)
            // It's safe to return success.
            return { success: true };
        }
        
        // Set the stream to inactive
        await database.liveStreams.updateOne({ id: liveStream.id }, { $set: { ao_vivo: false } });

        // If the user was in a PK battle, end it.
        const pkBattle = await database.pkBattles.findOne({
            $or: [{ streamer_A_id: userId }, { streamer_B_id: userId }],
            status: 'ativa'
        });

        if (pkBattle) {
            await database.pkBattles.updateOne({ id: pkBattle.id }, { $set: { status: 'finalizada' } });
            // Also update the opponent's stream status to no longer be in PK
            const opponentId = pkBattle.streamer_A_id === userId ? pkBattle.streamer_B_id : pkBattle.streamer_A_id;
            const opponentStream = await database.liveStreams.findOne({ user_id: opponentId, ao_vivo: true });
            if (opponentStream) {
                await database.liveStreams.updateOne({ id: opponentStream.id }, { $set: { em_pk: false } });
            }
        }
        
        return { success: true };
    }

    // --- Live Stream Endpoints ---
     if (method === 'GET' && path === '/api/lives') {
        const category = query.get('category');
        const userId = query.get('userId') ? parseInt(query.get('userId')!, 10) : null;
        const allLives = await database.liveStreams.find({ ao_vivo: true });
        
        if (category === 'seguindo' && userId) {
            const user = await database.users.findOne({ id: userId });
            const followingIds = user?.following || [];
            const followingLives = allLives.filter(live => followingIds.includes(live.user_id));
            return followingLives.map(mapLiveRecordToStream);
        }
        
        return allLives.map(mapLiveRecordToStream);
    }

    if (method === 'GET' && path === '/api/lives/pk') {
        const allPks = await database.pkBattles.find({ status: 'ativa' });
        const allUsers = await database.users.find({});
        const allStreams = await database.liveStreams.find({ ao_vivo: true });

        const pkBattles: types.PkBattle[] = allPks.map(pk => {
            const streamerA = allUsers.find(u => u.id === pk.streamer_A_id)!;
            const streamerB = allUsers.find(u => u.id === pk.streamer_B_id)!;
            const streamA = allStreams.find(s => s.user_id === pk.streamer_A_id)!;
            const streamB = allStreams.find(s => s.user_id === pk.streamer_B_id)!;

            return {
                id: Number(pk.id),
                title: `${streamerA.nickname} vs ${streamerB.nickname}`,
                streamer1: {
                    userId: streamerA.id,
                    streamId: streamA.id,
                    name: streamerA.nickname || streamerA.name,
                    score: pk.pontuacao_A,
                    avatarUrl: streamerA.avatar_url || '',
                    isVerified: false,
                    countryCode: streamerA.country,
                },
                streamer2: {
                    userId: streamerB.id,
                    streamId: streamB.id,
                    name: streamerB.nickname || streamerB.name,
                    score: pk.pontuacao_B,
                    avatarUrl: streamerB.avatar_url || '',
                    isVerified: false,
                    countryCode: streamerB.country,
                },
            };
        });
        return pkBattles;
    }
    
    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/live-status$/))) {
        const userId = parseInt(match[1], 10);
        const liveStream = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
        return !!liveStream;
    }

    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/following-live-status$/))) {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user || !user.following) return [];

        const followingIds = user.following;
        const allLiveStreams = await database.liveStreams.find({ ao_vivo: true });
        
        const liveStatuses = await Promise.all(followingIds.map(async (followedId) => {
            const liveStream = allLiveStreams.find(s => s.user_id === followedId);
            return {
                userId: followedId,
                isLive: !!liveStream,
                stream: liveStream ? mapLiveRecordToStream(liveStream) : null
            };
        }));
        return liveStatuses;
    }
    
    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/active-stream$/))) {
        const userId = parseInt(match[1], 10);
        const activeStream = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
        if (activeStream) {
            return mapLiveRecordToStream(activeStream);
        }
        return null;
    }

    if (method === 'GET' && (match = path.match(/^\/api\/users\/(\d+)\/pending-invites$/))) {
        const userId = parseInt(match[1], 10);
        const invite = await database.privateLiveInvites.findOne({ inviteeId: userId, status: 'pending' });
        if (invite) {
            const [streamer, stream] = await Promise.all([
                getFullUser(invite.inviterId),
                database.liveStreams.findOne({ id: invite.streamId }),
            ]);
            if (streamer && stream) {
                const fullInvite: types.IncomingPrivateLiveInvite = {
                    stream: mapLiveRecordToStream(stream),
                    inviter: streamer,
                    invitee: (await getFullUser(userId))!,
                };
                return { invite: fullInvite };
            }
        }
        return { invite: null };
    }

    if (method === 'GET' && (match = path.match(/^\/api\/lives\/(\d+)\/summary$/))) {
        const liveId = parseInt(match[1], 10);
        const stream = await database.liveStreams.findOne({ id: liveId });
        if (!stream) throw new Error("Live stream not found");
        
        const durationSeconds = Math.floor((new Date().getTime() - new Date(stream.inicio).getTime()) / 1000);

        return {
            streamerId: stream.user_id,
            streamerName: stream.nome_streamer,
            streamerAvatarUrl: (await database.users.findOne({ id: stream.user_id }))?.avatar_url || '',
            durationSeconds,
            peakViewers: stream.espectadores,
            totalEarnings: stream.received_gifts_value || 0,
            newFollowers: Math.floor(Math.random() * 10), // Mock data
            newMembers: Math.floor(Math.random() * 5),
            newFans: Math.floor(Math.random() * 20),
        };
    }

    // --- Rankings ---
    if (method === 'GET' && path === '/api/ranking/hourly') {
        const liveId = query.get('liveId');
        const region = query.get('region');
        
        const allUsers = await database.users.find({});
        const rankingUsers: types.UniversalRankingUser[] = allUsers
            .filter(u => u.id !== 999)
            .slice(0, 15)
            .map((user, index) => ({
                rank: index + 1,
                userId: user.id,
                avatarUrl: user.avatar_url || '',
                name: user.nickname || user.name,
                score: Math.floor(Math.random() * 50000) + 100,
                level: user.level,
                gender: user.gender,
                badges: [
                    { type: 'flag', value: user.country === 'BR' ? '🇧🇷' : '🇺🇸' },
                    ...(user.level > 20 ? [{ type: 'v_badge', value: 'V' }] : []),
                    { type: 'level', value: user.level },
                    ...(user.gender ? [{ type: 'gender', value: user.gender }] : []),
                ] as any,
            }))
            .sort((a, b) => b.score - a.score)
            .map((u, index) => ({ ...u, rank: index + 1 }));

        const currentUser = allUsers.find(u => u.id === 10755083);
        const currentUserRanking = rankingUsers.find(u => u.userId === currentUser!.id) || {
            rank: '>20', userId: currentUser!.id, avatarUrl: currentUser!.avatar_url || '',
            name: currentUser!.nickname || currentUser!.name, score: 0, level: currentUser!.level,
            gender: currentUser!.gender, badges: [{ type: 'flag', value: '🇧🇷' }],
        };

        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

        const response: types.UniversalRankingData = {
            podium: rankingUsers.slice(0, 3),
            list: rankingUsers.slice(3),
            currentUserRanking: currentUserRanking,
            countdown: nextHour.toISOString(),
            footerButtons: {
                primary: { text: "Ajudar a ser o Nº 1", value: "1060" },
                secondary: { text: "Ajudar a entrar na lista", value: "203" },
            }
        };
        return response;
    }

    if (method === 'GET' && path === '/api/ranking/user-list') {
        const allUsers = await database.users.find({});
        const rankingUsers: types.UniversalRankingUser[] = allUsers
            .filter(u => u.id !== 999)
            .slice(0, 25)
            .map((user, index) => ({
                rank: index + 1,
                userId: user.id,
                avatarUrl: user.avatar_url || '',
                name: user.nickname || user.name,
                score: Math.floor(Math.random() * 200000) + 1000,
                level: user.level,
                gender: user.gender,
                badges: [
                    { type: 'flag', value: user.country === 'BR' ? '🇧🇷' : '🇺🇸' },
                    ...(user.level > 20 ? [{ type: 'v_badge', value: 'V' }] : []),
                     { type: 'level', value: user.level },
                    ...(user.gender ? [{ type: 'gender', value: user.gender }] : []),
                ] as any,
            }))
            .sort((a, b) => b.score - a.score)
            .map((u, index) => ({ ...u, rank: index + 1 }));

        const currentUser = allUsers.find(u => u.id === 10755083);
        const currentUserRanking = rankingUsers.find(u => u.userId === currentUser!.id) || {
            rank: '>25', userId: currentUser!.id, avatarUrl: currentUser!.avatar_url || '',
            name: currentUser!.nickname || currentUser!.name, score: 0, level: currentUser!.level,
            gender: currentUser!.gender, badges: [{ type: 'flag', value: '🇧🇷' }],
        };

        const response: types.UniversalRankingData = {
            podium: rankingUsers.slice(0, 3),
            list: rankingUsers.slice(3),
            currentUserRanking: currentUserRanking,
        };
        return response;
    }


    // --- Block/Unblock ---
    if (method === 'GET' && (match = path.match(/^\/api\/blocks\/(\d+)\/(\d+)$/))) {
        const blockerId = parseInt(match[1], 10);
        const blockedId = parseInt(match[2], 10);
        const blockRecord = await database.blockedUsers.findOne({ blockerId, blockedId });
        return { isBlocked: !!blockRecord };
    }

    // --- Chat ---
    if (method === 'POST' && path === '/api/chat/private/get-or-create') {
        const { currentUserId, otherUserId } = body;
        const allUsers = await database.users.find({});
        let existingConvo = (await database.conversations.find({})).find(c =>
            c.participants.length === 2 && c.participants.includes(currentUserId) && c.participants.includes(otherUserId)
        );

        if (existingConvo) {
            return buildConversationViewModel(existingConvo, currentUserId, allUsers);
        }

        const newConvoRecord = {
            _id: mongoObjectId(),
            id: `convo-${mongoObjectId()}`,
            participants: [currentUserId, otherUserId],
            last_message_text: 'Inicie a conversa!',
            last_message_timestamp: new Date().toISOString(),
            messages: [{
                id: 'system-start',
                senderId: -1,
                type: 'system',
                text: 'Vocês agora são amigos. Comecem a conversar!',
                timestamp: new Date().toISOString(),
                status: 'sent',
                seenBy: []
            }],
        };
        (getRawDb().conversations as any[]).push(newConvoRecord);
        return buildConversationViewModel(newConvoRecord, currentUserId, allUsers);
    }
    if (method === 'GET' && (match = path.match(/^\/api\/chat\/private\/([a-zA-Z0-9-]+)$/))) {
        const conversationId = match[1];
        const userId = parseInt(query.get('userId')!, 10);
        const convo = await database.conversations.findOne({ id: conversationId });
        const allUsers = await database.users.find({});
        if (!convo || !convo.participants.includes(userId)) throw new Error("Conversa não encontrada");
        return buildConversationViewModel(convo, userId, allUsers);
    }

    if (method === 'GET' && (match = path.match(/^\/api\/chat\/live\/(\d+)$/))) {
        const liveId = parseInt(match[1], 10);
        const stream = await database.liveStreams.findOne({ id: liveId });
        if (!stream) {
            return [];
        }
        return stream.chatMessages || [];
    }

    if (method === 'POST' && (match = path.match(/^\/api\/chat\/live\/(\d+)$/))) {
        const liveId = parseInt(match[1], 10);
        const { userId, message, imageUrl } = body;
        const user = await getFullUser(userId);
        if (!user) throw new Error("Usuário não encontrado para enviar mensagem");

        const stream = await database.liveStreams.findOne({ id: liveId });
        if (!stream) throw new Error("Stream não encontrado");

        const newMessage: types.ChatMessage = {
            id: Date.now(),
            type: imageUrl ? 'image' : 'message',
            userId: user.id,
            username: user.nickname || user.name,
            message: message,
            imageUrl: imageUrl,
            timestamp: new Date().toISOString(),
            globalLevel: user.level,
            avatarUrl: user.avatar_url,
            age: user.age,
            gender: user.gender,
        };
        
        const chatMessages = stream.chatMessages || [];
        chatMessages.push(newMessage);

        await database.liveStreams.updateOne({ id: liveId }, { $set: { chatMessages } });
        
        return newMessage;
    }

    if (method === 'GET' && path === '/api/live/categories') {
        const categories: types.LiveCategory[] = [
          { id: '1', name: 'Popular', slug: 'popular' },
          { id: '2', name: 'Perto', slug: 'perto' },
          { id: '3', name: 'Novo', slug: 'novo' },
          { id: '4', name: 'Música', slug: 'musica' },
          { id: '5', name: 'Dança', slug: 'danca' },
          { id: '6', name: 'Festa', slug: 'festa' },
        ];
        return categories;
    }

    if (method === 'POST' && path === '/api/livekit/token') {
        const { roomName, participantIdentity } = body;
        const token = `fake_livekit_token_for_${roomName}_user_${participantIdentity}_${Date.now()}`;
        return { token };
    }
    
    if (method === 'GET' && (match = path.match(/^\/api\/lives\/(\d+)$/))) {
        const liveId = parseInt(match[1], 10);
        const stream = await database.liveStreams.findOne({ id: liveId });
        if (!stream) throw new Error("Transmissão ao vivo não encontrada");

        const streamer = await getFullUser(stream.user_id);
        if (!streamer) throw new Error("Streamer não encontrado");
        
        const totalVisitors = (stream.current_viewers || []).length;
        
        return {
            streamerName: streamer.nickname || streamer.name,
            streamerAvatarUrl: streamer.avatar_url,
            streamerFollowers: streamer.followers,
            viewerCount: stream.espectadores,
            totalVisitors: totalVisitors,
            receivedGiftsValue: stream.received_gifts_value || 0,
            rankingPosition: '#1 Diário',
            status: stream.ao_vivo ? 'ao vivo' : 'finalizada',
            likeCount: stream.like_count || 0,
            streamerIsAvatarProtected: streamer.is_avatar_protected,
            title: stream.titulo,
            meta: stream.meta,
        } as types.LiveDetails;
    }

    if (method === 'GET' && (match = path.match(/^\/api\/lives\/(\d+)\/viewers$/))) {
        const liveId = parseInt(match[1], 10);
        const stream = await database.liveStreams.findOne({ id: liveId });
        if (!stream) {
            throw new Error('Stream not found when fetching viewers');
        }

        const viewerIds = stream.current_viewers || [];
        
        const users = viewerIds.length > 0 ? await database.users.find({ id: { $in: viewerIds } }) : [];
        
        const viewers: types.Viewer[] = users.map(user => ({
            id: user.id,
            name: user.nickname || user.name,
            avatarUrl: user.avatar_url || '',
            entryTime: new Date().toISOString(), // Mock entry time
            contribution: Math.floor(Math.random() * 5000), // Mock contribution
            level: levelService.calculateLevelFromXp(user.xp),
            level2: user.level2 || 1,
        }));
        
        const streamer = await database.users.findOne({ id: stream.user_id });
        if (streamer && !viewers.some(v => v.id === streamer.id)) {
             viewers.push({
                id: streamer.id,
                name: streamer.nickname || streamer.name,
                avatarUrl: streamer.avatar_url || '',
                entryTime: stream.inicio,
                contribution: 999999, // High value to identify the streamer
                level: levelService.calculateLevelFromXp(streamer.xp),
                level2: streamer.level2 || 1,
            });
        }

        return viewers.sort((a, b) => b.contribution - a.contribution);
    }


    if (method === 'POST' && (match = path.match(/^\/api\/lives\/(\d+)\/join$/))) {
        const liveId = parseInt(match[1], 10);
        const { userId } = body;
        const stream = await database.liveStreams.findOne({ id: liveId });
        if (!stream) throw new Error("Transmissão não encontrada para entrar");
        
        const viewers = stream.current_viewers || [];
        if (!viewers.includes(userId)) {
            viewers.push(userId);
        }
        await database.liveStreams.updateOne({ id: liveId }, { $set: { current_viewers: viewers, espectadores: viewers.length } });
        return { success: true };
    }

    if (method === 'POST' && (match = path.match(/^\/api\/lives\/(\d+)\/leave$/))) {
        const liveId = parseInt(match[1], 10);
        const { userId } = body;
        const stream = await database.liveStreams.findOne({ id: liveId });
        if (!stream || !stream.current_viewers) {
            return { success: true }; 
        }
        const viewers = stream.current_viewers.filter(id => id !== userId);
        await database.liveStreams.updateOne({ id: liveId }, { $set: { current_viewers: viewers, espectadores: viewers.length } });
        return { success: true };
    }
    
    // Catch-all for other unhandled endpoints
    throw new Error(`Endpoint ${method} ${path} não encontrado`);
};