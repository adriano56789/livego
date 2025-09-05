import { apiClient } from './apiClient';
import type { User, LiveDetails, ChatMessage, Gift, Viewer, RankingContributor, Like, PkBattle, PkBattleState, PublicProfile, PkEventDetails, Conversation, SendGiftResponse, ProtectorDetails, WithdrawalTransaction, WithdrawalMethod, InventoryItem, AppEvent, LiveEndSummary, UserLevelInfo, GeneralRankingStreamer, GeneralRankingUser, WithdrawalBalance, EventStatus, PkRankingData, Stream, Category, StartLiveResponse, ConvitePK, LiveFollowUpdate, PrivateLiveInviteSettings, NotificationSettings, FacingMode, SoundEffectName, UniversalRankingData, UserListRankingPeriod, PkSettings, LiveCategory, StreamUpdateListener, MuteStatusListener, UserKickedListener, SoundEffectListener, MuteStatusUpdate, UserKickedUpdate, SoundEffectUpdate, UserBlockedUpdate, UserUnblockedUpdate, UserBlockedListener, UserUnblockedListener, Region, PrivacySettings, IncomingPrivateLiveInvite, GiftNotificationSettings, TopFanDetails, RouletteSettings } from '../types';

// --- Listener Infrastructure ---
type Listener<T> = (data: T) => void;

function createListenerManager<T>() {
  const listeners = new Set<Listener<T>>();
  return {
    add: (listener: Listener<T>) => { listeners.add(listener); },
    remove: (listener: Listener<T>) => { listeners.delete(listener); },
    dispatch: (data: T) => listeners.forEach(listener => listener(data)),
  };
}

export type ChatMessageListener = (liveId: number, messages: ChatMessage[]) => void;

const streamUpdateManager = createListenerManager<Stream[]>();
const chatListeners = new Set<ChatMessageListener>();
const muteStatusManager = createListenerManager<MuteStatusUpdate>();
const userKickedManager = createListenerManager<UserKickedUpdate>();
const soundEffectManager = createListenerManager<SoundEffectUpdate>();
const userBlockedManager = createListenerManager<UserBlockedUpdate>();
const userUnblockedManager = createListenerManager<UserUnblockedUpdate>();
const liveUpdateManager = createListenerManager<number>(); // dispatches liveId

export const addStreamListener = (listener: StreamUpdateListener) => streamUpdateManager.add(listener);
export const removeStreamListener = (listener: StreamUpdateListener) => streamUpdateManager.remove(listener);

export const addChatMessageListener = (listener: ChatMessageListener) => chatListeners.add(listener);
export const removeChatMessageListener = (listener: ChatMessageListener) => { chatListeners.delete(listener); };

export const addMuteStatusListener = (listener: MuteStatusListener) => muteStatusManager.add(listener);
export const removeMuteStatusListener = (listener: MuteStatusListener) => muteStatusManager.remove(listener);

export const addUserKickedListener = (listener: UserKickedListener) => userKickedManager.add(listener);
export const removeUserKickedListener = (listener: UserKickedListener) => userKickedManager.remove(listener);

export const addSoundEffectListener = (listener: SoundEffectListener) => soundEffectManager.add(listener);
export const removeSoundEffectListener = (listener: SoundEffectListener) => soundEffectManager.remove(listener);

export const addUserBlockedListener = (listener: UserBlockedListener) => userBlockedManager.add(listener);
export const removeUserBlockedListener = (listener: UserBlockedListener) => userBlockedManager.remove(listener);

export const addUserUnblockedListener = (listener: UserUnblockedListener) => userUnblockedManager.add(listener);
export const removeUserUnblockedListener = (listener: UserUnblockedListener) => userUnblockedManager.remove(listener);

export const addLiveUpdateListener = (listener: Listener<number>) => liveUpdateManager.add(listener);
export const removeLiveUpdateListener = (listener: Listener<number>) => liveUpdateManager.remove(listener);


// --- STREAMING API FUNCTIONS ---

export const getRegions = (): Promise<Region[]> => apiClient('/api/regions');

export const getLiveKitToken = (roomName: string, participantIdentity: string): Promise<{ token: string }> => {
    return apiClient('/api/livekit/token', {
        method: 'POST',
        body: JSON.stringify({ roomName, participantIdentity }),
    });
};

export const getPopularStreams = (regionCode: string): Promise<Stream[]> => apiClient<Stream[]>(`/api/lives?category=popular&region=${regionCode}`).then(d => { streamUpdateManager.dispatch(d); return d; });
export const getFollowingStreams = (userId: number, regionCode: string): Promise<Stream[]> => apiClient<Stream[]>(`/api/lives?category=seguindo&userId=${userId}&region=${regionCode}`).then(d => { streamUpdateManager.dispatch(d); return d; });
export const getNewStreams = (regionCode: string): Promise<Stream[]> => apiClient<Stream[]>(`/api/lives?category=novo&region=${regionCode}`).then(d => { streamUpdateManager.dispatch(d); return d; });
export const getStreamsForCategory = (category: Category, regionCode: string): Promise<Stream[]> => apiClient<Stream[]>(`/api/lives?category=${category.toLowerCase()}&region=${regionCode}`).then(d => { streamUpdateManager.dispatch(d); return d; });
export const getPrivateStreams = (userId: number, regionCode: string): Promise<Stream[]> => apiClient<Stream[]>(`/api/lives?category=privada&userId=${userId}&region=${regionCode}`).then(d => { streamUpdateManager.dispatch(d); return d; });
export const getPkBattles = (regionCode: string): Promise<PkBattle[]> => apiClient<PkBattle[]>(`/api/lives/pk?region=${regionCode}`);
export const getPkBattleDetails = (pkId: number): Promise<PkBattle> => apiClient(`/api/pk-battles/${pkId}`);
export const getActivePkBattle = (pkBattleId: number | string): Promise<PkBattleState> => apiClient(`/api/batalhas-pk/${pkBattleId}`);
export const findActivePkBattleForStream = (streamId: number): Promise<PkBattleState | null> => apiClient(`/api/streams/${streamId}/batalha-pk`);
export const getUserLiveStatus = (userId: number): Promise<boolean> => apiClient(`/api/users/${userId}/live-status`);
export const getFollowingLiveStatus = (userId: number): Promise<LiveFollowUpdate[]> => apiClient(`/api/users/${userId}/following-live-status`);
export const getActiveStreamForUser = (userId: number): Promise<Stream | null> => apiClient(`/api/users/${userId}/active-stream`);
export const getUserLives = (userId: number): Promise<Stream[]> => apiClient(`/api/users/${userId}/lives`);

export const getLiveCategories = (): Promise<LiveCategory[]> => apiClient('/api/live/categories');

export const uploadLiveThumbnail = (thumbnailBase64: string): Promise<{ thumbnailUrl: string }> => {
    return apiClient('/api/lives/thumbnail', {
        method: 'POST',
        body: JSON.stringify({ thumbnailBase64 })
    });
};

export const startLiveStream = (user: User, details: { title: string, meta: string; category: Category, isPrivate: boolean, isPkEnabled: boolean, thumbnailUrl?: string, entryFee?: number, cameraUsed: FacingMode }): Promise<StartLiveResponse> => {
    return apiClient('/api/live/start', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, ...details })
    });
};

export const stopLiveStream = (userId: number): Promise<void> => {
    return apiClient(`/api/users/${userId}/stop-live`, { method: 'POST' });
};

export const endPkBattle = (pkBattleId: number, userId: number): Promise<{ success: boolean }> => {
    return apiClient(`/api/pk-battles/${pkBattleId}/end`, { 
        method: 'POST',
        body: JSON.stringify({ userId }) 
    });
};

export const payStreamEntryFee = (viewerId: number, streamId: number): Promise<User> => {
    return apiClient<{ updatedUser: User, entryMessage: ChatMessage }>(`/api/lives/${streamId}/pay-entry`, {
        method: 'POST',
        body: JSON.stringify({ viewerId })
    }).then(response => {
        // Dispatch the system message to listeners
        if (response.entryMessage) {
            chatListeners.forEach(listener => listener(streamId, [response.entryMessage]));
        }
        return response.updatedUser;
    });
};

export const inviteUserToPrivateLive = (liveId: number, inviteeId: number): Promise<{ success: boolean }> => {
    return apiClient(`/api/lives/${liveId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ inviteeId })
    });
};

export const cancelPrivateLiveInvite = (liveId: number, inviteeId: number): Promise<{ success: boolean }> => {
    return apiClient(`/api/lives/${liveId}/cancel-invite`, {
        method: 'POST',
        body: JSON.stringify({ inviteeId })
    });
};

export const getLiveStreamDetails = (liveId: number): Promise<LiveDetails> => apiClient(`/api/lives/${liveId}`);
export const getChatMessages = (liveId: number): Promise<ChatMessage[]> => apiClient(`/api/chat/live/${liveId}`);
export const sendChatMessage = async (liveId: number, userId: number, message: string, imageUrl?: string): Promise<ChatMessage> => {
    const newMsg = await apiClient<ChatMessage>(`/api/chat/live/${liveId}`, {
        method: 'POST',
        body: JSON.stringify({ userId, message, imageUrl }),
    });
    // Dispatch to all chat listeners to simulate real-time update
    chatListeners.forEach(listener => listener(liveId, [newMsg]));
    liveUpdateManager.dispatch(liveId);
    return newMsg;
};

export const getGiftCatalog = (): Promise<Gift[]> => apiClient('/api/gifts');
export const sendGift = (liveId: number, senderId: number, giftId: number, quantity: number, receiverId?: number): Promise<SendGiftResponse> => {
    return apiClient<SendGiftResponse>(`/api/lives/${liveId}/gift`, {
        method: 'POST',
        body: JSON.stringify({ senderId, giftId, quantity, receiverId })
    }).then(response => {
        if (response.success) {
            liveUpdateManager.dispatch(liveId);
            if (response.giftMessage) {
                chatListeners.forEach(listener => listener(liveId, [response.giftMessage]));
            }
        }
        return response;
    });
};

export const getViewers = (liveId: number): Promise<Viewer[]> => apiClient(`/api/lives/${liveId}/viewers`);
export const getRanking = (liveId: number, period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<RankingContributor[]> => {
    return apiClient(`/api/lives/${liveId}/ranking?period=${period}`);
};

export const getHourlyRanking = (liveId: number, region: 'brazil' | 'global'): Promise<UniversalRankingData> => {
    return apiClient(`/api/ranking/hourly?liveId=${liveId}&region=${region}`);
};

export const getUserListRanking = (period: UserListRankingPeriod): Promise<UniversalRankingData> => {
    return apiClient(`/api/ranking/user-list?period=${period}`);
};

export const sendLike = (liveId: number, userId: number): Promise<Like> => {
    return apiClient<Like>(`/api/lives/${liveId}/like`, { method: 'POST', body: JSON.stringify({ userId }) }).then(like => {
        liveUpdateManager.dispatch(liveId);
        return like;
    });
};

export const getLiveEndSummary = (liveId: number): Promise<LiveEndSummary> => apiClient(`/api/lives/${liveId}/summary`);
export const getPublicProfile = (userId: number, viewerId?: number): Promise<PublicProfile> => apiClient(`/api/users/${userId}/profile${viewerId ? `?viewerId=${viewerId}` : ''}`);
export const getPkRankingInfo = (): Promise<PkEventDetails> => apiClient('/api/pk-event/details');

export const blockUser = (blockerId: number, targetId: number): Promise<{ success: boolean }> => {
    return apiClient<{ success: boolean }>('/api/blocks', { method: 'POST', body: JSON.stringify({ blockerId, blockedId: targetId }) }).then(res => {
        if(res.success) userBlockedManager.dispatch({ blockerId, targetId });
        return res;
    });
};

export const unblockUser = (loggedUserId: number, targetUserId: number): Promise<{ success: boolean }> => {
    return apiClient<{ success: boolean }>(`/api/blocks/${loggedUserId}/${targetUserId}`, { method: 'DELETE' }).then(res => {
        if(res.success) userUnblockedManager.dispatch({ unblockerId: loggedUserId, targetId: targetUserId });
        return res;
    });
};

export const getBlockedUsers = (currentUserId: number): Promise<User[]> => apiClient(`/api/users/${currentUserId}/blocked`);

export const isUserBlocked = (loggedUserId: number, targetUserId: number): Promise<{ isBlocked: boolean }> => {
    return apiClient(`/api/blocks/${loggedUserId}/${targetUserId}`);
};

export const getConversationById = (conversationId: string, currentUserId: number): Promise<Conversation> => apiClient(`/api/chat/private/${conversationId}?userId=${currentUserId}`);
export const getOrCreateConversationWithUser = (currentUserId: number, otherUserId: number): Promise<Conversation> => {
    return apiClient('/api/chat/private/get-or-create', { method: 'POST', body: JSON.stringify({ currentUserId, otherUserId }) });
};
export const sendMessageToConversation = (conversationId: string, senderId: number, content: { text?: string; imageUrl?: string }): Promise<Conversation> => {
    return apiClient(`/api/chat/private/${conversationId}`, { method: 'POST', body: JSON.stringify({ senderId, ...content }) });
};
export const markMessagesAsSeen = (conversationId: string, viewerId: number): Promise<{ success: boolean }> => {
    return apiClient('/api/chat/viewed', { method: 'POST', body: JSON.stringify({ conversationId, viewerId }) });
};

export const uploadChatImage = (imageDataUrl: string): Promise<{ url: string }> => {
    return apiClient('/api/chat/upload', {
        method: 'POST',
        body: JSON.stringify({ imageDataUrl })
    });
};

export const getProtectorsList = (streamerId: number): Promise<ProtectorDetails[]> => apiClient(`/api/users/${streamerId}/protectors`);
export const getTopFans = (userId: number): Promise<TopFanDetails[]> => apiClient(`/api/users/${userId}/top-fans`);

export const followUser = (followerId: number, followingId: number): Promise<User> => {
    return apiClient('/api/follows', { method: 'POST', body: JSON.stringify({ followerId, followingId }) });
};

export const unfollowUser = (followerId: number, followingId: number): Promise<User> => {
    return apiClient(`/api/follows/${followerId}/${followingId}`, { method: 'DELETE' });
};

export const getFriendRequests = (userId: number): Promise<User[]> => {
    return apiClient(`/api/users/${userId}/friend-requests`);
};

export const declineFriendRequest = (currentUserId: number, userIdToDecline: number): Promise<{ success: boolean }> => {
    return apiClient('/api/friend-requests/decline', {
        method: 'POST',
        body: JSON.stringify({ currentUserId, userIdToDecline })
    });
};

export const saveWithdrawalMethod = (userId: number, method: 'pix' | 'mercado_pago', account: string): Promise<User> => {
    return apiClient(`/api/users/${userId}/withdrawal-method`, { method: 'PUT', body: JSON.stringify({ method, account }) });
};
export const getWithdrawalBalance = (userId: number): Promise<WithdrawalBalance> => apiClient(`/api/users/${userId}/withdrawal-balance`);
export const getWithdrawalHistory = (userId: number): Promise<WithdrawalTransaction[]> => apiClient(`/api/users/${userId}/withdrawal-history`);
export const initiateWithdrawal = (userId: number, earningsToWithdraw: number): Promise<{ updatedUser: User, transaction: WithdrawalTransaction }> => {
    return apiClient('/api/withdrawals/initiate', { method: 'POST', body: JSON.stringify({ userId, earningsToWithdraw }) });
};

export const getUserInventory = (userId: number): Promise<InventoryItem[]> => apiClient(`/api/users/${userId}/inventory`);
export const equipItem = (userId: number, itemId: string): Promise<User> => {
    return apiClient(`/api/users/${userId}/equip-item`, { method: 'POST', body: JSON.stringify({ itemId }) });
};
export const postSpecialEntryMessage = (liveId: number, userId: number): Promise<void> => {
    return apiClient(`/api/lives/${liveId}/special-entry`, { method: 'POST', body: JSON.stringify({ userId }) });
};

export const getSupportConversation = (userId: number): Promise<Conversation> => apiClient(`/api/support/conversation/${userId}`);
export const sendMessageToSupport = (userId: number, text: string): Promise<Conversation> => {
    return apiClient('/api/support/messages', { method: 'POST', body: JSON.stringify({ userId, text }) });
};

export const submitReport = (reportData: { reporterId: number, reportedId: string; reportReason: string; reportDetails: string; fileName: string; }): Promise<{ success: boolean }> => {
    return apiClient('/api/reports', {
        method: 'POST',
        body: JSON.stringify(reportData)
    });
};

export const submitSuggestion = (suggestionData: { suggesterId: number; suggestion: string }): Promise<{ success: boolean }> => {
    return apiClient('/api/suggestions', {
        method: 'POST',
        body: JSON.stringify(suggestionData)
    });
};

export const getEventsByStatus = (status: EventStatus): Promise<AppEvent[]> => apiClient(`/api/events?status=${status}`);
export const getEventById = (eventId: string): Promise<AppEvent> => apiClient(`/api/events/${eventId}`);
export const getUserLevelInfo = (userId: number): Promise<UserLevelInfo> => apiClient(`/api/users/${userId}/level`);
export const getStreamerRanking = (period: UserListRankingPeriod): Promise<GeneralRankingStreamer[]> => apiClient(`/api/ranking/streamers?period=${period}`);
export const getUserRanking = (period: UserListRankingPeriod): Promise<GeneralRankingUser[]> => apiClient(`/api/ranking/users?period=${period}`);

export const joinLiveStream = (userId: number, liveId: number): Promise<{ success: boolean }> => apiClient<{ success: boolean }>(`/api/lives/${liveId}/join`, { method: 'POST', body: JSON.stringify({ userId }) }).then(response => {
    if (response.success) liveUpdateManager.dispatch(liveId);
    return response;
});
export const leaveLiveStream = (userId: number, liveId: number): Promise<{ success: boolean }> => apiClient<{ success: boolean }>(`/api/lives/${liveId}/leave`, { method: 'POST', body: JSON.stringify({ userId }) }).then(response => {
    if (response.success) liveUpdateManager.dispatch(liveId);
    return response;
});
export const muteUser = (liveId: number, targetUserId: number, mute: boolean, durationMinutes: number = 5): Promise<{ success: boolean }> => apiClient<{ success: boolean }>(`/api/lives/${liveId}/mute`, { method: 'POST', body: JSON.stringify({ targetUserId, mute, durationMinutes }) }).then(res => {
    if(res.success) muteStatusManager.dispatch({ liveId, userId: targetUserId, isMuted: mute, mutedUntil: new Date(Date.now() + durationMinutes * 60000).toISOString() });
    return res;
});
export const kickUser = (liveId: number, targetUserId: number): Promise<{ success: boolean }> => apiClient<{ success: boolean }>(`/api/lives/${liveId}/kick`, { method: 'POST', body: JSON.stringify({ targetUserId }) }).then(res => {
    if(res.success) userKickedManager.dispatch({ liveId, kickedUserId: targetUserId });
    return res;
});
export const playSoundEffect = (liveId: number, triggeredBy: number, effectName: SoundEffectName): Promise<{ success: boolean }> => apiClient<{ success: boolean }>(`/api/lives/${liveId}/sound-effect`, { method: 'POST', body: JSON.stringify({ triggeredBy, effectName }) }).then(res => {
    if(res.success) soundEffectManager.dispatch({ liveId, effectName, triggeredBy });
    return res;
});

export const getNearbyStreams = async (userId: number, accuracy: 'exact' | 'approximate'): Promise<Stream[]> => {
    return apiClient(`/api/lives/nearby?userId=${userId}&accuracy=${accuracy}`);
};

export const requestLocationPermission = async (accuracy: 'exact' | 'approximate'): Promise<{ latitude: number, longitude: number }> => {
    // This is a placeholder for a native call that would request permissions.
    // In a web environment, we could use navigator.geolocation.
    console.log(`[Mock Service] Requesting location with accuracy: ${accuracy}`);
    return new Promise((resolve, reject) => {
        // Simulate a successful permission grant with mock coordinates.
        setTimeout(() => resolve({ latitude: -23.5505, longitude: -46.6333 }), 500);
    });
};

export const saveUserLocationPreference = (userId: number, accuracy: 'exact' | 'approximate'): Promise<{ success: boolean }> => {
    return apiClient('/api/users/location-preference', {
        method: 'POST',
        body: JSON.stringify({ userId, accuracy })
    });
};

export const getNotificationSettings = (userId: number): Promise<NotificationSettings> => apiClient(`/api/users/${userId}/notification-settings`);
export const updateNotificationSettings = (userId: number, settings: Partial<Omit<NotificationSettings, 'userId'>>): Promise<NotificationSettings> => {
    return apiClient(`/api/users/${userId}/notification-settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings)
    });
};

export const getGiftNotificationSettings = (userId: number): Promise<GiftNotificationSettings> => apiClient(`/api/users/${userId}/gift-notification-settings`);
export const updateGiftNotificationSetting = (userId: number, giftId: number, isEnabled: boolean): Promise<GiftNotificationSettings> => {
    return apiClient(`/api/users/${userId}/gift-notification-settings`, {
        method: 'PATCH',
        body: JSON.stringify({ giftId, isEnabled })
    });
};


export const getPushSettings = (userId: number): Promise<Record<number, boolean>> => apiClient(`/api/users/${userId}/push-settings`);
export const updatePushSetting = (userId: number, followedUserId: number, enabled: boolean): Promise<{ success: boolean }> => {
    return apiClient(`/api/users/${userId}/push-settings`, {
        method: 'PATCH',
        body: JSON.stringify({ followedUserId, enabled })
    });
};

export const getPrivateLiveInviteSettings = (userId: number): Promise<PrivateLiveInviteSettings> => apiClient(`/api/users/${userId}/private-live-invite-settings`);
export const updatePrivateLiveInviteSettings = (userId: number, settings: Partial<Omit<PrivateLiveInviteSettings, 'userId'>>): Promise<PrivateLiveInviteSettings> => {
    return apiClient(`/api/users/${userId}/private-live-invite-settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings)
    });
};

export const getPrivacySettings = (userId: number): Promise<PrivacySettings> => apiClient(`/api/users/${userId}/privacy-settings`);
export const updatePrivacySettings = (userId: number, settings: Partial<Omit<PrivacySettings, 'userId'>>): Promise<PrivacySettings> => {
    return apiClient(`/api/users/${userId}/privacy-settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings)
    });
};

export const getPendingPrivateLiveInvites = (userId: number): Promise<{ invite: IncomingPrivateLiveInvite | null }> => {
    return apiClient(`/api/users/${userId}/pending-invites`);
};

export const getCoHostFriends = (userId: number): Promise<User[]> => apiClient(`/api/users/${userId}/cohost-friends`);

export const getPkSettings = (userId: number): Promise<PkSettings> => apiClient(`/api/pk-settings/${userId}`);
export const updatePkSettings = (userId: number, durationSeconds: number): Promise<{success: boolean}> => {
    return apiClient(`/api/pk-settings/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ durationSeconds })
    });
};

export const getUserLivePreferences = (userId: number): Promise<{isPkEnabled: boolean, lastCameraUsed: FacingMode, lastSelectedCategory: Category, lastLiveTitle?: string, lastLiveMeta?: string}> => {
    return apiClient(`/api/users/${userId}/live-preferences`);
};
export const updateUserPkPreference = (userId: number, isPkEnabled: boolean): Promise<{success: boolean}> => {
    return apiClient(`/api/users/${userId}/pk-preference`, {
        method: 'POST',
        body: JSON.stringify({ isPkEnabled })
    });
};

export const updateStreamPrivacy = (liveId: number, isPrivate: boolean, entryFee?: number): Promise<Stream> => {
    return apiClient<{ updatedStream: Stream, kickedUserIds: number[] }>(`/api/lives/${liveId}/privacy`, {
        method: 'PATCH',
        body: JSON.stringify({ isPrivate, entryFee: entryFee || null })
    }).then(response => {
        response.kickedUserIds.forEach(userId => {
            userKickedManager.dispatch({ liveId, kickedUserId: userId });
        });
        liveUpdateManager.dispatch(liveId);
        return response.updatedStream;
    });
};

// FIX: Added missing 'getRouletteSettings' function.
export const getRouletteSettings = (liveId: number): Promise<RouletteSettings> => apiClient(`/api/lives/${liveId}/roulette-settings`);

export const updateRouletteSettings = (liveId: number, settings: RouletteSettings): Promise<{ success: boolean }> => {
    return apiClient(`/api/lives/${liveId}/roulette-settings`, {
        method: 'POST',
        body: JSON.stringify({ settings })
    });
};

// FIX: The `spinRoulette` function has been updated to handle the `announcementMessage` returned by the API.
// It now dispatches this message to chat listeners, ensuring roulette results appear in the chat, and then returns the expected data structure to the component.
export const spinRoulette = (liveId: number, userId: number): Promise<{ updatedUser: User; result: string; }> => {
    return apiClient<{ updatedUser: User, result: string, announcementMessage: ChatMessage }>(`/api/lives/${liveId}/roulette-spin`, {
        method: 'POST',
        body: JSON.stringify({ userId })
    }).then(response => {
        if (response.announcementMessage) {
            chatListeners.forEach(listener => listener(liveId, [response.announcementMessage]));
        }
        return { updatedUser: response.updatedUser, result: response.result };
    });
};

// --- NEWLY ADDED FUNCTIONS TO FIX ERRORS ---

export const getInvitableOpponents = (userId: number): Promise<User[]> => {
    return apiClient(`/api/pk/opponents/${userId}`);
};

export const createPkInvitation = (inviterId: number, inviteeId: number, isCoHost: boolean): Promise<ConvitePK> => {
    return apiClient('/api/pk/invites', {
        method: 'POST',
        body: JSON.stringify({ inviterId, inviteeId, isCoHost })
    });
};

//FIX: This function's name is confusing. It is used to *create* an invitation, but it returns a battle.
// The new `createPkInvitation` should be used instead. This one is kept for potential legacy reasons but now just returns a mock error.
export const inviteToCoHostPk = (inviterId: number, inviteeId: number): Promise<any> => {
    console.warn("`inviteToCoHostPk` is deprecated. Use `createPkInvitation` instead.");
    return Promise.reject(new Error("Função obsoleta."));
};

export const getPendingPkInvitation = (userId: number): Promise<ConvitePK | null> => {
    return apiClient(`/api/pk/invites/pending/${userId}`);
};

export const getPkInvitationStatus = (inviteId: string): Promise<{ invitation: ConvitePK, battle: PkBattle | null }> => {
    return apiClient(`/api/pk/invites/status/${inviteId}`);
};

export const acceptPkInvitation = (inviteId: string): Promise<{ battle: PkBattle }> => {
    return apiClient(`/api/pk/invites/${inviteId}/accept`, { method: 'POST' });
};

export const declinePkInvitation = (inviteId: string): Promise<{ success: boolean }> => {
    return apiClient(`/api/pk/invites/${inviteId}/decline`, { method: 'POST' });
};

export const cancelPkInvitation = (inviteId: string): Promise<{ success: boolean }> => {
    return apiClient(`/api/pk/invites/${inviteId}/cancel`, { method: 'POST' });
};

export const joinPkMatchmakingQueue = (userId: number): Promise<{ success: boolean }> => {
    return apiClient('/api/pk/matchmaking/join', { method: 'POST', body: JSON.stringify({ userId }) });
};

export const leavePkMatchmakingQueue = (userId: number): Promise<{ success: boolean }> => {
    return apiClient('/api/pk/matchmaking/leave', { method: 'POST', body: JSON.stringify({ userId }) });
};

export const checkPkMatchmakingStatus = (userId: number): Promise<{ status: 'aguardando' | 'em_pareamento' | 'pareado', battle: PkBattle | null }> => {
    return apiClient(`/api/pk/matchmaking/status/${userId}`);
};

export const blockAvatarAttempt = (userId: number, avatarImage: string): Promise<{ success: boolean }> => {
    return apiClient('/api/avatar/protection/block-attempt', {
        method: 'POST',
        body: JSON.stringify({ userId, avatarImage })
    });
};

export const reportUser = (reporterId: number, reportedId: number): Promise<{ success: boolean }> => {
    return apiClient('/api/reports/user', {
        method: 'POST',
        body: JSON.stringify({ reporterId, reportedId })
    });
};

export const flipCamera = (liveId: number): Promise<{ success: boolean, newFacingMode: FacingMode }> => {
    return apiClient(`/api/lives/${liveId}/flip-camera`, { method: 'POST' });
};

export const toggleMicrophone = (liveId: number, enabled: boolean): Promise<{ success: boolean }> => {
    return apiClient(`/api/lives/${liveId}/mic-toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
    });
};
// FIX: Added missing 'helpHostRankUp' function.
export const helpHostRankUp = (senderId: number, hostId: number, giftValue: number): Promise<{ updatedUser: User | null; success: boolean; message: string; }> => {
    return apiClient('/api/ranking/help-host', {
        method: 'POST',
        body: JSON.stringify({ senderId, hostId, giftValue })
    });
};
