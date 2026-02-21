
import { mockApiRouter } from './server';
import { User, Gift, Streamer, Message, RankedUser, Country, Conversation, NotificationSettings, BeautySettings, PurchaseRecord, EligibleUser, FeedPhoto, Obra, GoogleAccount, LiveSessionState, StreamHistoryEntry, Visitor, LevelInfo, Order, DiamondPackage, LiveNotification, Invitation, PixPaymentResponse, CreditCardPaymentRequest, SRSResponse, SRSPlayResponse, SRSStreamInfo } from '../types';
import { delay, CURRENT_USER_ID } from './database';

/**
 * Core API Caller
 * Routes all requests to the mockApiRouter during simulation.
 * Paths used here are identical to what the real VPS backend will expect.
 */
const callApi = async <T>(method: string, path: string, body?: any): Promise<T> => {
    // Log outgoing "Network" request for simulation visibility
    console.log(`[API ${method}] ${path}`, body ? body : '');
    
    // Simulate network delay
    await delay(Math.random() * 100 + 50); 
    
    // Route to the simulated server logic
    const { status, data, error } = await mockApiRouter(method, path, body);
    
    if (status >= 400) {
        throw new Error(error || `API Error: ${status}`);
    }
    
    return data as T;
};

export const api = {
    // --- Auth & Accounts ---
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

    // --- Profile Management (Specific Routes) ---
    profile: {
        getImages: () => callApi<Obra[]>('GET', '/api/perfil/imagens'),
        deleteImage: (id: string) => callApi<{ success: boolean }>('DELETE', `/api/perfil/imagens/${id}`),
        reorderImages: (orderedIds: string[]) => callApi<{ success: boolean, images: Obra[] }>('PUT', '/api/perfil/imagens/ordenar', { orderedIds }),
        
        getNickname: () => callApi<{ value: string }>('GET', '/api/perfil/apelido'),
        updateNickname: (value: string) => callApi<{ success: boolean }>('PUT', '/api/perfil/apelido', { value }),
        
        getGender: () => callApi<{ value: User['gender'] }>('GET', '/api/perfil/genero'),
        updateGender: (value: User['gender']) => callApi<{ success: boolean }>('PUT', '/api/perfil/genero', { value }),
        
        getBirthday: () => callApi<{ value: string }>('GET', '/api/perfil/aniversario'),
        updateBirthday: (value: string) => callApi<{ success: boolean }>('PUT', '/api/perfil/aniversario', { value }),
        
        getBio: () => callApi<{ value: string }>('GET', '/api/perfil/apresentacao'),
        updateBio: (value: string) => callApi<{ success: boolean }>('PUT', '/api/perfil/apresentacao', { value }),
        
        getResidence: () => callApi<{ value: string }>('GET', '/api/perfil/residencia'),
        updateResidence: (value: string) => callApi<{ success: boolean }>('PUT', '/api/perfil/residencia', { value }),
        
        getEmotionalStatus: () => callApi<{ value: string }>('GET', '/api/perfil/estado-emocional'),
        updateEmotionalStatus: (value: string) => callApi<{ success: boolean }>('PUT', '/api/perfil/estado-emocional', { value }),
        
        getTags: () => callApi<{ value: string }>('GET', '/api/perfil/tags'),
        updateTags: (value: string) => callApi<{ success: boolean }>('PUT', '/api/perfil/tags', { value }),
        
        getProfession: () => callApi<{ value: string }>('GET', '/api/perfil/profissao'),
        updateProfession: (value: string) => callApi<{ success: boolean }>('PUT', '/api/perfil/profissao', { value }),
    },


    // --- Wallet & Transactions ---
    buyDiamonds: (userId: string, amount: number, price: number) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/buy-diamonds`, { amount, price }),
    getPurchaseHistory: (userId: string) => callApi<PurchaseRecord[]>('GET', `/api/purchases/history/${userId}`),
    getEarningsInfo: (userId: string) => callApi<{ available_diamonds: number; gross_brl: number; platform_fee_brl: number; net_brl: number; }>('GET', `/api/earnings/get/${userId}`),
    calculateWithdrawal: (amount: number) => callApi<{ gross_value: number; platform_fee: number; net_value: number }>('POST', '/api/earnings/calculate', { amount }),
    confirmWithdrawal: (userId: string, amount: number) => callApi<{ success: boolean, user: User }>('POST', `/api/earnings/withdraw/${userId}`, { amount }),
    setWithdrawalMethod: (method: string, details: any) => callApi<{ success: boolean, user: User }>('POST', `/api/earnings/method/set/${CURRENT_USER_ID}`, { method, details }),

    // --- Checkout & Payments (New) ---
    getDiamondPackages: () => callApi<DiamondPackage[]>('GET', '/api/checkout/pack'),
    createOrder: (userId: string, packageId: string, amount: number, diamonds: number) => callApi<Order>('POST', '/api/checkout/order', { userId, packageId, amount, diamonds }),
    processPixPayment: (orderId: string) => callApi<PixPaymentResponse>('POST', '/api/payment/pix', { orderId }),
    processCreditCardPayment: (data: CreditCardPaymentRequest) => callApi<{ success: boolean, message: string, orderId: string }>('POST', '/api/payment/credit-card', data),
    confirmPurchase: (orderId: string) => callApi<{ success: boolean, user: User, order: Order }>('POST', '/api/purchase/confirm', { orderId }),

    // --- Admin Control ---
    saveAdminWithdrawalMethod: (email: string) => callApi<{ success: boolean, user: User }>('POST', '/api/admin/withdrawal-method', { email }),
    requestAdminWithdrawal: () => callApi<{ success: boolean, message: string }>('POST', '/api/admin/withdraw'),
    getAdminWithdrawalHistory: (status: string) => callApi<PurchaseRecord[]>('GET', `/api/admin/history?status=${status}`),

    // --- Metadata & Catalog ---
    getRankingForPeriod: (period: string) => callApi<RankedUser[]>('GET', `/api/ranking/${period}`),
    getGifts: () => callApi<Gift[]>('GET', '/api/gifts'),
    getCountries: () => callApi<Country[]>('GET', '/api/regions'),
    getReminders: () => callApi<Streamer[]>('GET', '/api/reminders'),
    getStreamHistory: () => callApi<StreamHistoryEntry[]>('GET', '/api/history/streams'),
    addStreamToHistory: (entry: StreamHistoryEntry) => callApi<{ success: boolean }>('POST', '/api/history/streams', entry),

    // --- Settings & Preferences ---
    getNotificationSettings: (userId: string) => callApi<NotificationSettings>('GET', `/api/notifications/settings/${userId}`),
    updateNotificationSettings: (userId: string, settings: Partial<NotificationSettings>) => callApi<{ settings: NotificationSettings }>('POST', `/api/notifications/settings/${userId}`, settings),
    getGiftNotificationSettings: (userId: string) => callApi<{ settings: Record<string, boolean> }>('GET', `/api/settings/gift-notifications/${userId}`),
    updateGiftNotificationSettings: (userId: string, settings: Record<string, boolean>) => callApi<{ success: boolean }>('POST', `/api/settings/gift-notifications/${userId}`, { settings }),
    getBeautySettings: (userId: string) => callApi<BeautySettings>('GET', `/api/settings/beauty/${userId}`),
    updateBeautySettings: (userId: string, settings: BeautySettings) => callApi<{ success: boolean }>('POST', `/api/settings/beauty/${userId}`, { settings }),
    getPrivateStreamSettings: (userId: string) => callApi<{ settings: User['privateStreamSettings'] }>('GET', `/api/settings/private-stream/${userId}`),
    updatePrivateStreamSettings: (userId: string, settings: Partial<User['privateStreamSettings']>) => callApi<{ success: boolean, user: User }>('POST', `/api/settings/private-stream/${userId}`, { settings }),
    togglePip: (userId: string, enabled: boolean) => callApi<{ success: boolean, user: User }>('POST', `/api/settings/pip/toggle/${userId}`, { enabled }),
    updateActivityPreference: (userId: string, show: boolean) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/privacy/activity`, { show }),
    updateLocationVisibility: (userId: string, show: boolean) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/privacy/location`, { show }),
    
    // --- Permissions ---
    getCameraPermission: (userId: string) => callApi<{ status: 'granted' | 'denied' | 'prompt' }>('GET', `/api/permissions/camera/${userId}`),
    updateCameraPermission: (userId: string, status: string) => callApi<void>('POST', `/api/permissions/camera/${userId}`, { status }),
    getMicrophonePermission: (userId: string) => callApi<{ status: 'granted' | 'denied' | 'prompt' }>('GET', `/api/permissions/microphone/${userId}`),
    updateMicrophonePermission: (userId: string, status: string) => callApi<void>('POST', `/api/permissions/microphone/${userId}`, { status }),
    getLocationPermission: (userId: string) => callApi<{ status: 'granted' | 'denied' | 'prompt' }>('GET', `/api/users/${userId}/location-permission`),
    updateLocationPermission: (userId: string, status: string) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/location-permission`, { status }),
    getChatPermissionStatus: (userId: string) => callApi<{ permission: 'all' | 'followers' | 'none' }>('GET', `/api/chat-permission/status/${userId}`),
    updateChatPermission: (userId: string, permission: string) => callApi<{ success: boolean, user: User }>('POST', `/api/chat-permission/update/${userId}`, { permission }),

    // --- Live Stream Management ---
    getLiveStreamers: (category: string, country?: string, userId?: string) => {
        let url = `/api/live/${category}?`;
        if (country && country !== 'ICON_GLOBE') url += `country=${country}&`;
        if (userId) url += `userId=${userId}`;
        return callApi<Streamer[]>('GET', url);
    },
    createStream: (options: Partial<Streamer>) => callApi<Streamer>('POST', '/api/streams', options),
    updateStream: (streamId: string, updates: Partial<Streamer>) => callApi<Streamer>('PUT', `/api/streams/${streamId}`, updates),
    patchStream: (streamId: string, updates: Partial<Streamer>) => callApi<{ success: boolean, stream: Streamer }>('PATCH', `/api/streams/${streamId}`, updates),
    saveStream: (streamId: string, updates: any) => callApi<{ success: boolean, stream: Streamer }>('POST', `/api/streams/${streamId}/save`, updates),
    uploadStreamCover: (streamId: string, coverData: any) => callApi<{ success: boolean, stream: Streamer }>('POST', `/api/streams/${streamId}/cover`, coverData),
    getStreamManual: () => callApi<any[]>('GET', '/api/streams/manual'),
    getBeautyEffects: () => callApi<any>('GET', '/api/streams/effects'),
    getOnlineUsers: (streamId: string) => callApi<(User & { value: number })[]>('GET', `/api/streams/${streamId}/online-users`),
    endLiveSession: (streamId: string, sessionData: LiveSessionState) => callApi<{ success: boolean, user: User }>('POST', `/api/streams/${streamId}/end-session`, { session: sessionData }),
    getReceivedGifts: (userId: string) => callApi<(Gift & { count: number })[]>('GET', `/api/users/${userId}/received-gifts`),
    sendGift: (fromUserId: string, streamId: string, giftName: string, amount: number) => callApi<{ success: boolean; error?: string; updatedSender: User; updatedReceiver: User; }>('POST', `/api/streams/${streamId}/gift`, { fromUserId, giftName, amount }),
    updateSimStatus: (isOnline: boolean) => callApi<{ success: boolean, user: User }>('POST', '/api/sim/status', { isOnline }),
    
    // --- SRS & WebRTC Signaling ---
    publishWebRTC: (streamUrl: string, sdp: string) => callApi<SRSResponse>('POST', '/api/rtc/v1/publish', { streamUrl, sdp }),
    playWebRTC: (streamUrl: string, sdp: string) => callApi<SRSPlayResponse>('POST', '/api/rtc/v1/play', { streamUrl, sdp }),
    stopWebRTC: (streamUrl: string) => callApi<SRSResponse>('DELETE', '/api/rtc/v1/stop', { streamUrl }),
    getStreamInfo: (streamId: string) => callApi<SRSStreamInfo>('GET', `/api/v1/streams/${streamId}`),

    // --- PK & Interaction ---
    getPKConfig: () => callApi<{ duration: number }>('GET', '/api/pk/config'),
    updatePKConfig: (duration: number) => callApi<{ success: boolean, config: any }>('POST', '/api/pk/config', { duration }),
    startPKBattle: (streamId: string, opponentId: string) => callApi<{ success: boolean }>('POST', '/api/pk/start', { streamId, opponentId }),
    endPKBattle: (streamId: string) => callApi<{ success: boolean }>('POST', '/api/pk/end', { streamId }),
    sendPKHeart: (roomId: string, team: 'A' | 'B') => callApi<{ success: boolean }>('POST', '/api/pk/heart', { roomId, team }),
    getGiftSendersForStream: (streamId: string) => callApi<EligibleUser[]>('GET', `/api/presents/live/${streamId}`),
    sendPrivateInviteToGifter: (streamId: string, gifterId: string) => callApi<void>('POST', `/api/streams/${streamId}/private-invite`, { userId: gifterId }),
    inviteUserToPrivateStream: (streamId: string, userId: string) => callApi<{ success: boolean }>('POST', `/api/streams/${streamId}/private-invite`, { userId }),
    checkPrivateStreamAccess: (streamId: string, userId: string) => callApi<{ canJoin: boolean }>('GET', `/api/streams/${streamId}/access-check?userId=${userId}`),
    inviteFriendForCoHost: (streamId: string, inviteeId: string) => callApi<{success: boolean, message?: string, error?: string}>('POST', `/api/friends/invite`, { streamId, inviteeId }),
    sendStreamInteraction: (streamId: string, type: string, data: any) => callApi<{ success: boolean }>('POST', `/api/streams/${streamId}/interactions`, { type, ...data }),

    // --- Private Room Invitations ---
    sendInvitation: (roomId: string, userId: string) => callApi<{ success: boolean }>('POST', '/api/invitations/send', { roomId, userId }),
    getReceivedInvitations: () => callApi<Invitation[]>('GET', '/api/invitations/received'),
    getRoomDetails: (roomId: string) => callApi<Streamer>('GET', `/api/rooms/${roomId}`),
    joinRoom: (roomId: string, userId: string) => callApi<{ success: boolean, canJoin: boolean }>('POST', `/api/rooms/${roomId}/join`, { userId }),
    getPrivateRooms: () => callApi<Streamer[]>('GET', `/api/rooms?category=private&userId=${CURRENT_USER_ID}`),
    getStreamMessages: (streamId: string) => callApi<Message[]>('GET', `/api/streams/${streamId}/messages`),

    // --- Feed & Photos ---
    getPhotoFeed: () => callApi<FeedPhoto[]>('GET', '/api/feed/photos'),
    likePhoto: (photoId: string) => callApi<{ success: boolean; likes: number; isLiked: boolean; }>('POST', `/api/photos/${photoId}/like`, { userId: CURRENT_USER_ID }),
    uploadChatPhoto: (userId: string, base64Image: string) => callApi<{ url: string }>('POST', `/api/photos/upload/${userId}`, { image: base64Image }),
    
    // --- Miscellaneous ---
    getVisitors: (userId: string) => callApi<Visitor[]>('GET', `/api/visitors/list/${userId}`),
    clearVisitors: (userId: string) => callApi<{ success: boolean }>('DELETE', `/api/visitors/clear/${userId}`),
    getChatMessages: (otherUserId: string) => callApi<Message[]>('GET', `/api/chats/${otherUserId}/messages`),
    updateVideoQuality: (streamId: string, quality: string) => callApi<{ success: boolean, stream: Streamer }>('PUT', `/api/streams/${streamId}/quality`, { quality }),
    toggleMicrophone: (streamId: string) => callApi<void>('POST', `/api/streams/${streamId}/toggle-mic`),
    toggleStreamSound: (streamId: string) => callApi<void>('POST', `/api/streams/${streamId}/toggle-sound`),
    toggleAutoFollow: (streamId: string, isEnabled: boolean) => callApi<void>('POST', `/api/streams/${streamId}/toggle-auto-follow`, { isEnabled }),
    toggleAutoPrivateInvite: (streamId: string, isEnabled: boolean) => callApi<void>('POST', `/api/streams/${streamId}/toggle-auto-invite`, { isEnabled }),
    purchaseFrame: (userId: string, frameId: string) => callApi<{ success: boolean, user: User }>('POST', `/api/effects/purchase-frame/${userId}`, { frameId }),
    setActiveFrame: (userId: string, frameId: string | null) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/set-active-frame`, { frameId }),
    subscribeToVIP: (userId: string) => callApi<{ success: boolean, user: User }>('POST', `/api/vip/subscribe/${userId}`),
    purchaseEffect: (userId: string, gift: Gift) => callApi<{ success: boolean, user: User }>('POST', `/api/effects/purchase/${userId}`, { giftId: gift.name }),
    getAvatarProtectionStatus: (userId: string) => callApi<{ isEnabled: boolean }>('GET', `/api/users/${userId}/avatar-protection`),
    toggleAvatarProtection: (userId: string, isEnabled: boolean) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/avatar-protection`, { isEnabled }),
    markMessagesAsRead: (messageIds: string[], readerId: string) => callApi<void>('POST', '/api/chats/mark-read', { messageIds, readerId }),
    sendChatMessage: (from: string, to: string, text: string, imageUrl?: string, tempId?: string) => callApi<void>('POST', '/api/chats/send', { from, to, text, imageUrl, tempId }),
    kickUser: (streamId: string, userId: string, kickerId: string) => callApi<void>('POST', `/api/streams/${streamId}/kick`, { userId, kickerId }),
    makeModerator: (streamId: string, userId: string, hostId: string) => callApi<void>('POST', `/api/streams/${streamId}/moderator`, { userId, hostId }),
    endLiveStream: (streamId: string) => callApi<{ success: boolean }>('POST', `/api/lives/${streamId}/end`),

    // --- Live Notifications ---
    startLiveStream: (streamId: string) => callApi<{ success: boolean }>('POST', '/api/lives/start', { streamId }),
    getNotifications: () => callApi<LiveNotification[]>('GET', '/api/notifications'),
    markNotificationRead: (id: string) => callApi<{ success: boolean }>('PATCH', `/api/notifications/${id}/read`),
    getLiveDetails: (liveId: string) => callApi<Streamer>('GET', `/api/lives/${liveId}`),
};
