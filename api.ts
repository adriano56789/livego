import { mockApiRouter } from './server';
import { User, Gift, Streamer, Message, RankedUser, Country, Conversation, NotificationSettings, BeautySettings, PurchaseRecord, Visitor, EligibleUser, FeedPhoto, LiveSessionState, LevelInfo, GoogleAccount, StreamHistoryEntry, Comment, MusicTrack } from '../types';
import { delay, CURRENT_USER_ID } from './database';
import { webSocketManager } from './websocket';

const callApi = async <T>(method: string, path: string, body?: any): Promise<T> => {
    await delay(Math.random() * 150 + 50); // Simulate network latency
    const { status, data, error } = mockApiRouter(method, path, body);
    if (status >= 400) {
        throw new Error(error || `API Error: ${status}`);
    }
    return data as T;
};

// This is the client-side API object that components will import and use.
export const api = {
    // --- Translation ---
    translate: (text: string, targetLang: string) => callApi<{ translatedText: string }>('POST', '/api/translate', { text, targetLang }),

    // --- Auth ---
    getGoogleAccounts: () => callApi<GoogleAccount[]>('GET', '/api/accounts/google'),
    getConnectedGoogleAccounts: () => callApi<GoogleAccount[]>('GET', '/api/accounts/google/connected'),
    disconnectGoogleAccount: (email: string) => callApi<{ success: boolean }>('POST', '/api/accounts/google/disconnect', { email }),
    
    // --- Users ---
    getCurrentUser: () => callApi<User>('GET', '/api/users/me'),
    getAllUsers: () => callApi<User[]>('GET', '/api/users'),
    getUser: (userId: string) => callApi<User>('GET', `/api/users/${userId}`),
    deleteAccount: (userId: string) => callApi<{ success: boolean }>('DELETE', `/api/users/${userId}`),
    updateProfile: (userId: string, updates: Partial<User>) => callApi<{ success: boolean, user: User }>('PATCH', `/api/users/${userId}`, updates),
    followUser: (followerId: string, followedId: string, streamId?: string) => callApi<{ success: boolean, updatedFollower: User, updatedFollowed: User }>('POST', `/api/users/${followedId}/toggle-follow`, { streamId }),
    blockUser: (userIdToBlock: string) => callApi<{ success: boolean }>('POST', `/api/users/${userIdToBlock}/block`),
    unblockUser: (userIdToUnblock: string) => callApi<{ success: boolean }>('DELETE', `/api/users/${userIdToUnblock}/unblock`),
    reportUser: (userIdToReport: string, reason: string) => callApi<{ success: boolean }>('POST', `/api/users/${userIdToReport}/report`, { reason }),
    getFansUsers: (userId: string) => callApi<User[]>('GET', `/api/users/${userId}/fans`),
    getFollowingUsers: (userId: string) => callApi<User[]>('GET', `/api/users/${userId}/following`),
    getFriends: (userId: string) => callApi<User[]>('GET', `/api/users/${userId}/friends`),
    getConversations: (userId: string) => callApi<Conversation[]>('GET', `/api/users/${userId}/messages`),
    getBlockedUsers: () => callApi<User[]>('GET', '/api/users/me/blocklist'),
    getUserStatus: (userId: string) => callApi<{ isOnline: boolean; lastSeen: string }>('GET', `/api/users/${userId}/status`),
    getUserPhotos: (userId: string) => callApi<FeedPhoto[]>('GET', `/api/users/${userId}/photos`),
    getLikedPhotos: (userId: string) => callApi<FeedPhoto[]>('GET', `/api/users/${userId}/liked-photos`),
    getLevelInfo: (userId: string) => callApi<LevelInfo>('GET', `/api/users/${userId}/level-info`),
    recordVisit: (profileId: string, visitorId: string) => callApi<void>('POST', `/api/users/${profileId}/visit`, { userId: visitorId }),

    // --- Wallet & Purchases ---
    buyDiamonds: (userId: string, amount: number, price: number) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/buy-diamonds`, { amount, price }),
    getPurchaseHistory: (userId: string) => callApi<PurchaseRecord[]>('GET', `/api/purchases/history/${userId}`),
    getEarningsInfo: (userId: string) => callApi<{ available_diamonds: number; gross_brl: number; platform_fee_brl: number; net_brl: number; }>('GET', `/api/earnings/get/${userId}`),
    calculateWithdrawal: (amount: number) => callApi<{ gross_value: number; platform_fee: number; net_value: number }>('POST', '/api/earnings/calculate', { amount }),
    confirmWithdrawal: (userId: string, amount: number) => callApi<{ success: boolean, user: User }>('POST', `/api/earnings/withdraw/${userId}`, { amount }),
    setWithdrawalMethod: (method: string, details: any) => callApi<{ success: boolean, user: User }>('POST', `/api/earnings/method/set/${CURRENT_USER_ID}`, { method, details }),

    // --- Admin Wallet ---
    saveAdminWithdrawalMethod: (email: string) => callApi<{ success: boolean, user: User }>('POST', '/api/admin/withdrawal-method', { email }),
    requestAdminWithdrawal: () => callApi<{ success: boolean, message: string }>('POST', '/api/admin/withdraw'),
    getAdminWithdrawalHistory: (status: 'all' | 'Concluído' | 'Pendente' | 'Cancelado' = 'all') => 
        callApi<PurchaseRecord[]>('GET', `/api/admin/history?status=${status}`),

    // --- General Data ---
    getRankingForPeriod: (period: 'daily' | 'weekly' | 'monthly') => callApi<RankedUser[]>('GET', `/api/ranking/${period}`),
    getGifts: () => callApi<Gift[]>('GET', '/api/gifts'),
    getMusicLibrary: () => callApi<MusicTrack[]>('GET', '/api/music'),
    getVideosByMusicId: (musicId: string) => callApi<FeedPhoto[]>('GET', `/api/music/${musicId}/videos`),
    getCountries: () => callApi<Country[]>('GET', '/api/regions'),
    getReminders: () => callApi<Streamer[]>('GET', '/api/reminders'),
    getStreamHistory: () => callApi<StreamHistoryEntry[]>('GET', '/api/history/streams'),
    addStreamToHistory: (entry: StreamHistoryEntry) => callApi<{ success: boolean }>('POST', '/api/history/streams', entry),

    // --- Settings ---
    getNotificationSettings: (userId: string) => callApi<NotificationSettings>('GET', `/api/notifications/settings/${userId}`),
    updateNotificationSettings: (userId: string, settings: Partial<NotificationSettings>) => callApi<{ settings: NotificationSettings }>('POST', `/api/notifications/settings/${userId}`, settings),
    getGiftNotificationSettings: (userId: string) => callApi<{ settings: Record<string, boolean> }>('GET', `/api/settings/gift-notifications/${userId}`),
    updateGiftNotificationSettings: (userId: string, settings: Record<string, boolean>) => callApi<{ success: boolean }>('POST', `/api/settings/gift-notifications/${userId}`, { settings }),

    // --- Stream & Live ---
    getLiveStreamers: (category: string, country?: string) => callApi<Streamer[]>('GET', `/api/live/${category}${country ? `?country=${country}` : ''}`),
    createStream: (options: Partial<Streamer>) => callApi<Streamer>('POST', '/api/streams', options),
    updateStream: (streamId: string, updates: Partial<Streamer>) => callApi<Streamer>('PUT', `/api/streams/${streamId}`, updates),
    saveStream: (streamId: string, updates: { name?: string; message?: string; isPrivate?: boolean; tags?: string[] }) => callApi<{ success: boolean, stream: Streamer }>('POST', `/api/streams/${streamId}/save`, updates),
    uploadStreamCover: (streamId: string, coverData: any) => callApi<{ success: boolean, stream: Streamer }>('POST', `/api/streams/${streamId}/cover`, coverData),
    getStreamManual: () => callApi<any[]>('GET', '/api/streams/manual'),
    getBeautyEffects: () => callApi<{ filters: { name: string; icon?: string; img?: string; }[]; effects: { name: string; icon?: string; }[] }>('GET', '/api/streams/effects'),
    getOnlineUsers: (streamId: string) => callApi<(User & { value: number })[]>('GET', `/api/streams/${streamId}/online-users`),
    endLiveSession: (streamId: string, sessionData: LiveSessionState) => callApi<{ success: boolean, user: User }>('POST', `/api/streams/${streamId}/end-session`, { session: sessionData }),
    getReceivedGifts: (userId: string) => callApi<(Gift & { count: number })[]>('GET', `/api/users/${userId}/received-gifts`),
    sendGift: (fromUserId: string, streamId: string, giftName: string, amount: number) => callApi<{ success: boolean; error?: string; updatedSender: User; updatedReceiver: User; }>('POST', `/api/streams/${streamId}/gift`, { fromUserId, giftName, amount }),
    updateSimStatus: (isOnline: boolean) => callApi<{ success: boolean, user: User }>('POST', '/api/sim/status', { isOnline }),

    // --- Feed & Photos ---
    getPhotoFeed: () => callApi<FeedPhoto[]>('GET', '/api/feed/photos'),
    likePhoto: (photoId: string) => callApi<{ success: boolean; likes: number; isLiked: boolean; }>('POST', `/api/photos/${photoId}/like`, { userId: CURRENT_USER_ID }),
    uploadChatPhoto: (userId: string, base64Image: string) => callApi<{ url: string }>('POST', `/api/photos/upload/${userId}`, { image: base64Image }),
    getComments: (photoId: string) => callApi<Comment[]>('GET', `/api/photos/${photoId}/comments`),
    postComment: (photoId: string, text: string) => callApi<{ success: boolean; comment: Comment }>('POST', `/api/photos/${photoId}/comments`, { text, userId: CURRENT_USER_ID }),
    createFeedPost: (postData: any) => callApi<{ success: boolean }>('POST', '/api/feed/posts', postData),

    // --- PK Battle ---
    getPKConfig: () => callApi<{ duration: number }>('GET', '/api/pk/config'),
    updatePKConfig: (duration: number) => callApi<{ success: boolean, config: any }>('POST', '/api/pk/config', { duration }),
    startPKBattle: (streamId: string, opponentId: string) => callApi<{ success: boolean }>('POST', '/api/pk/start', { streamId, opponentId }),
    endPKBattle: (streamId: string) => callApi<{ success: boolean }>('POST', '/api/pk/end', { streamId }),
    sendPKHeart: (roomId: string, team: 'A' | 'B') => callApi<{ success: boolean }>('POST', '/api/pk/heart', { roomId, team }),
    getGiftSendersForStream: (streamId: string) => callApi<EligibleUser[]>('GET', `/api/presents/live/${streamId}`),
    
    // --- Live Moderation ---
    kickUser: (roomId: string, userId: string, byUserId: string) => webSocketManager.sendKickRequest(roomId, userId, byUserId),
    makeModerator: (roomId: string, userId: string, byUserId: string) => webSocketManager.sendModeratorRequest(roomId, userId, byUserId),

    // --- Live Settings ---
    updateVideoQuality: (streamId: string, quality: string) => callApi<{ success: true, stream: Streamer }>('PUT', `/api/streams/${streamId}/quality`, { quality }),
    toggleMicrophone: (streamId: string) => callApi<void>('POST', `/api/streams/${streamId}/toggle-mic`),
    toggleStreamSound: (streamId: string) => callApi<void>('POST', `/api/streams/${streamId}/toggle-sound`),
    toggleAutoFollow: (streamId: string, isEnabled: boolean) => callApi<void>('POST', `/api/streams/${streamId}/toggle-auto-follow`, { isEnabled }),
    toggleAutoPrivateInvite: (streamId: string, isEnabled: boolean) => callApi<void>('POST', `/api/streams/${streamId}/toggle-auto-invite`, { isEnabled }),

    // --- Visitors ---
    getVisitors: (userId: string) => callApi<Visitor[]>('GET', `/api/visitors/list/${userId}`),
    clearVisitors: (userId: string) => callApi<{ success: boolean }>('DELETE', `/api/visitors/clear/${userId}`),

    // --- Chat ---
    getChatMessages: (otherUserId: string) => callApi<Message[]>('GET', `/api/chats/${otherUserId}/messages`),
    sendChatMessage: (from: string, to: string, text: string, imageUrl?: string, tempId?: string) => callApi<Message>('POST', `/api/chats/${to}/messages`, { fromUserId: from, text, imageUrl, tempId }),
    markMessagesAsRead: (messageIds: string[], otherUserId: string) => webSocketManager.markAsRead(messageIds, otherUserId),

    // --- Permissions & Privacy ---
    getAvatarProtectionStatus: (userId: string) => callApi<{ isEnabled: boolean }>('GET', `/api/avatar/protection/status/${userId}`),
    toggleAvatarProtection: (userId: string, isProtected: boolean) => callApi<{ success: boolean, user: User }>('POST', `/api/avatar/protection/toggle/${userId}`, { protected: isProtected }),
    getCameraPermission: (userId: string) => callApi<{ status: 'granted' | 'denied' | 'prompt' }>('GET', `/api/permissions/camera/${userId}`),
    updateCameraPermission: (userId: string, status: 'granted' | 'denied') => callApi<void>('POST', `/api/permissions/camera/${userId}`, { status }),
    getMicrophonePermission: (userId: string) => callApi<{ status: 'granted' | 'denied' | 'prompt' }>('GET', `/api/permissions/microphone/${userId}`),
    updateMicrophonePermission: (userId: string, status: 'granted' | 'denied') => callApi<void>('POST', `/api/permissions/microphone/${userId}`, { status }),
    getLocationPermission: (userId: string) => callApi<{ status: 'granted' | 'denied' | 'prompt' }>('GET', `/api/users/${userId}/location-permission`),
    updateLocationPermission: (userId: string, status: 'granted' | 'denied' | 'prompt') => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/location-permission`, { status }),
    getChatPermissionStatus: (userId: string) => callApi<{ permission: 'all' | 'followers' | 'none' }>('GET', `/api/chat-permission/status/${userId}`),
    updateChatPermission: (userId: string, permission: 'all' | 'followers' | 'none') => callApi<{ success: boolean, user: User }>('POST', `/api/chat-permission/update/${userId}`, { permission }),
    togglePip: (userId: string, enabled: boolean) => callApi<{ success: boolean, user: User }>('POST', `/api/settings/pip/toggle/${userId}`, { enabled }),
    updateActivityPreference: (userId: string, show: boolean) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/privacy/activity`, { show }),
    updateLocationVisibility: (userId: string, show: boolean) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/privacy/location`, { show }),
    getPrivateStreamSettings: (userId: string) => callApi<{ settings: User['privateStreamSettings'] }>('GET', `/api/settings/private-stream/${userId}`),
    updatePrivateStreamSettings: (userId: string, settings: Partial<User['privateStreamSettings']>) => callApi<{ success: boolean, user: User }>('POST', `/api/settings/private-stream/${userId}`, { settings }),
    
    // --- VIP & Effects ---
    subscribeToVIP: (userId: string) => callApi<{ success: boolean, user: User }>('POST', `/api/vip/subscribe/${userId}`),
    purchaseEffect: (userId: string, gift: Gift) => callApi<{ success: boolean, user: User }>('POST', `/api/effects/purchase/${userId}`, { giftId: gift.name }),
    getBeautySettings: (userId: string) => callApi<BeautySettings>('GET', `/api/settings/beauty/${userId}`),
    updateBeautySettings: (userId: string, settings: BeautySettings) => callApi<{ success: boolean }>('POST', `/api/settings/beauty/${userId}`, { settings }),
    purchaseFrame: (userId: string, frameId: string) => callApi<{ success: boolean, user: User }>('POST', `/api/effects/purchase-frame/${userId}`, { frameId }),
    setActiveFrame: (userId: string, frameId: string | null) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/set-active-frame`, { frameId }),

    // --- Private Invites ---
    sendPrivateInviteToGifter: (streamId: string, gifterId: string) => callApi<void>('POST', `/api/streams/${streamId}/private-invite`, { userId: gifterId }),
    checkPrivateStreamAccess: (streamId: string, userId: string) => callApi<{ canJoin: boolean }>('GET', `/api/streams/${streamId}/access-check?userId=${userId}`),
    inviteFriendForCoHost: (streamId: string, inviteeId: string) => callApi<{success: boolean, message?: string, error?: string}>('POST', `/api/friends/invite`, { streamId, inviteeId }),

    // --- Fan Club ---
    getFanClubMembers: (streamerId: string) => callApi<User[]>('GET', `/api/fanclub/${streamerId}/members`),
};