// This file contains the complete mock API server, including the in-memory database,
// routing logic, and all endpoint handlers. It fully simulates the backend.

import type * as types from '../types';
import * as levelService from './levelService';
// FIX: Import 'getRawDb' to resolve 'Cannot find name' error.
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

// Helper for new stream-specific leveling
const getStreamLevelAndBadge = (xp: number) => {
    const level = Math.floor(xp / 100) + 1; // 100 XP per level
    let badge = null;
    if (level >= 5) {
        badge = { text: 'Top Fã', icon: 'crown' };
    }
    return { level, badge };
};

const notFound = (endpoint: string) => { throw new Error(`Endpoint ${endpoint} não encontrado`); };

// --- SIMULATED API ROUTER ---
export const handleApiRequest = async (method: string, path: string, body: any, query: URLSearchParams): Promise<any> => {
    console.log(`[API] ${method} ${path}`, { body, query: Object.fromEntries(query.entries()) });

    // AUTH
    if (path === '/api/auth/google' && method === 'POST') {
        const user = await database.users.findOne({ id: 10755083 });
        if (!user) throw new Error("Usuário principal não encontrado na simulação.");
        return user;
    }

    // USERS
    let match = path.match(/^\/api\/users\/(\d+)$/);
    if (match && method === 'GET') {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) return notFound(path);
        
        const followers = await database.users.find({ following: { $in: [userId] } });
        const visitors = await database.profileVisits.find({ visitedId: userId });

        return {
            ...user,
            followers: followers.length,
            visitors: visitors.length,
            age: calculateAge(user.birthday),
        };
    }
    
    match = path.match(/^\/api\/users\/(\d+)\/live-status$/);
    if (match && method === 'GET') {
        const userId = parseInt(match[1], 10);
        const liveStream = await database.liveStreams.findOne({ user_id: userId, ao_vivo: true });
        return !!liveStream;
    }
    
    match = path.match(/^\/api\/users\/(\d+)\/notification-settings$/);
    if (match && method === 'GET') {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) return notFound(path);
        
        return user.settings?.notifications || {
            userId,
            newMessages: true,
            streamerLive: true,
            followedPost: true,
            order: true,
            interactive: true
        };
    }
    
    match = path.match(/^\/api\/users\/(\d+)\/pending-invites$/);
    if (match && method === 'GET') {
        const userId = parseInt(match[1], 10);
        // This is a simplified mock. In a real app, you'd check a dedicated invites collection.
        // For now, we'll return no pending invites.
        return { invite: null };
    }

    match = path.match(/^\/api\/users\/(\d+)\/avatar$/);
    if (match && method === 'PATCH') {
        const userId = parseInt(match[1], 10);
        await database.users.updateOne({ id: userId }, { $set: { avatar_url: body.photoDataUrl, has_uploaded_real_photo: true } });
        return database.users.findOne({ id: userId });
    }

    match = path.match(/^\/api\/users\/(\d+)$/);
    if (match && method === 'PUT') {
        const userId = parseInt(match[1], 10);
        await database.users.updateOne({ id: userId }, { $set: { ...body, has_completed_profile: true } });
        return database.users.findOne({ id: userId });
    }
    
    match = path.match(/^\/api\/users\/(\d+)\/following$/);
    if (match && method === 'GET') {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) return [];
        return database.users.find({ id: { $in: user.following || [] } });
    }
    
    match = path.match(/^\/api\/users\/(\d+)\/privacy-settings$/);
    if (match && method === 'GET') {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) return notFound(path);
        
        return user.settings?.privacy || {
            userId,
            showLocation: true,
            showActiveStatus: true,
            showInNearby: true,
            protectionEnabled: false
        };
    }
    
    match = path.match(/^\/api\/users\/(\d+)\/gift-notification-settings$/);
    if (match && method === 'GET') {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
         if (!user) return notFound(path);
        
        return user.settings?.giftNotifications || { userId, enabledGifts: {} };
    }
    
     match = path.match(/^\/api\/users\/(\d+)\/live-preferences$/);
    if (match && method === 'GET') {
        const userId = parseInt(match[1], 10);
        const user = await database.users.findOne({ id: userId });
        if (!user) return notFound(path);
        return {
            isPkEnabled: user.pk_enabled_preference ?? true,
            lastCameraUsed: user.last_camera_used || 'user',
            lastSelectedCategory: user.last_selected_category || 'Popular',
            lastLiveTitle: user.lastLiveTitle || '',
            lastLiveMeta: user.lastLiveMeta || '',
        };
    }


    // LIVES
    if (path === '/api/lives' && method === 'GET') {
        const category = query.get('category');
        const userId = query.get('userId');
        const region = query.get('region');

        let allStreams = await database.liveStreams.find({ ao_vivo: true });
        
        if (region && region !== 'global') {
            allStreams = allStreams.filter(s => s.country_code === region);
        }

        switch (category) {
            case 'seguindo': {
                if (!userId) return [];
                const user = await database.users.findOne({ id: parseInt(userId, 10) });
                if (!user) return [];
                const followingIds = user.following || [];
                return allStreams
                    .filter(s => followingIds.includes(s.user_id))
                    .map(mapLiveRecordToStream);
            }
            case 'Perto':
            case 'novo':
            case 'popular':
            case 'música':
            case 'dança':
                 return allStreams
                    .filter(s => category === 'popular' || s.categoria.toLowerCase() === category)
                    .sort((a,b) => b.espectadores - a.espectadores)
                    .map(mapLiveRecordToStream);
            default:
                return allStreams.map(mapLiveRecordToStream);
        }
    }
    
     if (path === '/api/live/start' && method === 'POST') {
        const { userId, title, meta, category, isPrivate, isPkEnabled, thumbnailUrl, entryFee, cameraUsed } = body;
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error("Usuário não encontrado para iniciar a stream.");

        const newStreamId = Math.max(0, ...getRawDb().liveStreams.map((s: types.LiveStreamRecord) => s.id)) + 1;
        
        const newStreamRecord: types.LiveStreamRecord = {
            id: newStreamId,
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
            received_gifts_value: 0,
            like_count: 0,
            country_code: user.country || 'BR',
            camera_facing_mode: cameraUsed,
            current_viewers: [],
            chatMessages: [],
        };
        
        getRawDb().liveStreams.push(newStreamRecord);
        const streamViewModel = mapLiveRecordToStream(newStreamRecord);
        
        return {
            live: streamViewModel,
            urls: {
                rtmp: `${SRS_URL_PUBLISH}/${streamViewModel.id}`,
                hls: `${SRS_URL_PLAY_HLS}/${streamViewModel.id}.m3u8`,
                webrtc: `${SRS_URL_PLAY_WEBRTC}/${streamViewModel.id}`,
                streamKey: `sk_${streamViewModel.id}_${new Date().getTime()}`
            }
        };
    }
    
    // PK
    if (path === '/api/lives/pk' && method === 'GET') {
        const battles = await database.pkBattles.find({ status: 'ativa' });
        const battleViewModels: types.PkBattle[] = [];
        for (const battle of battles) {
            const [streamerA, streamerB] = await Promise.all([
                database.users.findOne({ id: battle.streamer_A_id }),
                database.users.findOne({ id: battle.streamer_B_id })
            ]);
            if (streamerA && streamerB) {
                 const [streamA, streamB] = await Promise.all([
                    database.liveStreams.findOne({ user_id: streamerA.id, ao_vivo: true }),
                    database.liveStreams.findOne({ user_id: streamerB.id, ao_vivo: true })
                ]);

                if (streamA && streamB) {
                    battleViewModels.push({
                        id: battle.id as number,
                        title: `${streamerA.nickname} vs ${streamerB.nickname}`,
                        streamer1: { userId: streamerA.id, streamId: streamA.id, name: streamerA.nickname || streamerA.name, score: battle.pontuacao_A, avatarUrl: streamerA.avatar_url || '', isVerified: true, countryCode: streamerA.country },
                        streamer2: { userId: streamerB.id, streamId: streamB.id, name: streamerB.nickname || streamerB.name, score: battle.pontuacao_B, avatarUrl: streamerB.avatar_url || '', isVerified: false, countryCode: streamerB.country },
                    });
                }
            }
        }
        return battleViewModels;
    }
    
    // CHAT
    match = path.match(/^\/api\/chat\/live\/(\d+)$/);
    if (match && method === 'GET') {
        const liveId = parseInt(match[1], 10);
        const stream = await database.liveStreams.findOne({ id: liveId });
        return stream?.chatMessages || [];
    }

    match = path.match(/^\/api\/chat\/live\/(\d+)$/);
    if (match && method === 'POST') {
        const liveId = parseInt(match[1], 10);
        const { userId, message, imageUrl } = body;
        const user = await database.users.findOne({ id: userId });
        if (!user) throw new Error("Usuário não encontrado para enviar mensagem.");

        const stream = await database.liveStreams.findOne({ id: liveId });
        if (!stream) throw new Error("Live não encontrada.");

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
            age: calculateAge(user.birthday),
            gender: user.gender,
        };
        if (!stream.chatMessages) {
            stream.chatMessages = [];
        }
        stream.chatMessages.push(newMessage);
        await database.liveStreams.updateOne({ id: liveId }, { $set: { chatMessages: stream.chatMessages } });
        return newMessage;
    }

    // LIVE DETAILS
    match = path.match(/^\/api\/lives\/(\d+)$/);
    if (match && method === 'GET') {
        const liveId = parseInt(match[1], 10);
        const stream = await database.liveStreams.findOne({ id: liveId });
        if (!stream || !stream.ao_vivo) return notFound(path);
        
        const streamer = await database.users.findOne({ id: stream.user_id });
        if (!streamer) return notFound(path);
        
        const followers = await database.users.find({ following: { $in: [streamer.id] } });
        
        return {
            streamerName: streamer.nickname || streamer.name,
            streamerAvatarUrl: streamer.avatar_url,
            streamerFollowers: followers.length,
            viewerCount: stream.current_viewers?.length || 0,
            totalVisitors: stream.espectadores,
            receivedGiftsValue: stream.received_gifts_value || 0,
            rankingPosition: '1',
            status: 'ao vivo',
            likeCount: stream.like_count || 0,
            streamerIsAvatarProtected: streamer.is_avatar_protected || false,
            title: stream.titulo,
            meta: stream.meta,
        };
    }
    
    match = path.match(/^\/api\/lives\/(\d+)\/viewers$/);
    if (match && method === 'GET') {
        const liveId = parseInt(match[1], 10);
        const stream = await database.liveStreams.findOne({ id: liveId });
        if (!stream) return [];

        const viewerIds = stream.current_viewers || [];
        const viewers = await database.users.find({ id: { $in: viewerIds } });
        
        const viewerDetails: types.Viewer[] = await Promise.all(viewers.map(async (v) => {
             const giftsSent = await database.sentGifts.find({ liveId: liveId, senderId: v.id });
             const contribution = giftsSent.reduce((sum, gift) => sum + (gift.diamondCost * gift.quantity), 0);
             const streamStats = await database.streamUserStats.findOne({ liveId: liveId, userId: v.id });
             const { level: streamLevel } = getStreamLevelAndBadge(streamStats?.xp || 0);

            return {
                id: v.id,
                name: v.nickname || v.name,
                avatarUrl: v.avatar_url || '',
                entryTime: new Date().toISOString(),
                contribution,
                level: v.level,
                level2: streamLevel,
            }
        }));

        return viewerDetails.sort((a,b) => b.contribution - a.contribution);
    }
    
    match = path.match(/^\/api\/users\/(\d+)\/profile$/);
    if (match && method === 'GET') {
        const userId = parseInt(match[1], 10);
        const viewerId = query.get('viewerId') ? parseInt(query.get('viewerId') as string, 10) : null;
        
        const [user, viewer, liveStream, followers] = await Promise.all([
            database.users.findOne({ id: userId }),
            viewerId ? database.users.findOne({ id: viewerId }) : null,
            database.liveStreams.findOne({ user_id: userId, ao_vivo: true }),
            database.users.find({ following: { $in: [userId] } })
        ]);

        if (!user) return notFound(path);

        const sent_gifts = await database.sentGifts.find({ senderId: userId });
        const totalSent = sent_gifts.reduce((sum, g) => sum + (g.diamondCost * g.quantity), 0);

        const received_gifts = await database.sentGifts.find({ receiverId: userId });
        const totalReceived = received_gifts.reduce((sum, g) => sum + (g.giftValue * g.quantity), 0);

        const protectors = await database.sentGifts.find({ receiverId: userId });
        const protectorContributions: { [key: number]: number } = {};
        for(const gift of protectors) {
            protectorContributions[gift.senderId] = (protectorContributions[gift.senderId] || 0) + gift.diamondCost;
        }
        
        const topProtectorIds = Object.entries(protectorContributions).sort((a,b) => b[1] - a[1]).slice(0,3).map(([id]) => parseInt(id, 10));
        const topProtectorUsers = await database.users.find({ id: { $in: topProtectorIds } });

        return {
          id: user.id,
          name: user.name,
          nickname: user.nickname,
          avatarUrl: user.avatar_url,
          age: calculateAge(user.birthday),
          gender: user.gender,
          birthday: user.birthday,
          isLive: !!liveStream,
          isFollowing: viewer ? (viewer.following || []).includes(userId) : false,
          followers: followers.length,
          followingCount: (user.following || []).length,
          coverPhotoUrl: 'https://picsum.photos/seed/cover-' + user.id + '/800/400',
          stats: { value: totalReceived, icon: 'coin' },
          badges: [
            { text: String(user.level), type: 'level' },
            ...(user.gender ? [{ text: String(calculateAge(user.birthday)), type: 'gender_age', icon: user.gender }] : [])
          ],
          protectors: topProtectorUsers.map((p, i) => ({
              rank: i + 1,
              userId: p.id,
              name: p.nickname || p.name,
              avatarUrl: p.avatar_url || '',
              protectionValue: protectorContributions[p.id] || 0
          })).sort((a, b) => b.protectionValue - a.protectionValue),
          achievements: [],
          personalityTags: user.personalityTags || [],
          personalSignature: user.personalSignature || '',
          is_avatar_protected: user.is_avatar_protected,
          privacy: user.settings?.privacy,
        };
    }

    match = path.match(/^\/api\/users\/(\d+)\/blocked$/);
    if (match && method === 'GET') {
        const userId = parseInt(match[1], 10);
        const blockedRecords = await database.blockedUsers.find({ blockerId: userId });
        const blockedIds = blockedRecords.map(r => r.blockedId);
        return database.users.find({ id: { $in: blockedIds } });
    }


    throw new Error(`Endpoint ${method} ${path} não encontrado`);
};
