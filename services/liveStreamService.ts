import { apiClient } from './apiClient';
import type { User, LiveDetails, ChatMessage, Gift, Viewer, RankingContributor, Like, PkBattle, PkBattleState, PublicProfile, PkEventDetails, Conversation, SendGiftResponse, ProtectorDetails, WithdrawalTransaction, WithdrawalMethod, InventoryItem, AppEvent, LiveEndSummary, UserLevelInfo, GeneralRankingStreamer, GeneralRankingUser, WithdrawalBalance, EventStatus, PkRankingData, Stream, Category, StartLiveResponse, ConvitePK, LiveFollowUpdate, PrivateLiveInviteSettings, NotificationSettings, FacingMode, SoundEffectName, UniversalRankingData, UserListRankingPeriod, PkSettings, LiveCategory, StreamUpdateListener, MuteStatusListener, UserKickedListener, SoundEffectListener, MuteStatusUpdate, UserKickedUpdate, SoundEffectUpdate, UserBlockedUpdate, UserUnblockedUpdate, UserBlockedListener, UserUnblockedListener, Region, PrivacySettings } from '../types';

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
    return apiClient(`/api/lives/${streamId}/pay-entry`, {
        method: 'POST',
        body: JSON.stringify({ viewerId })
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
    // After sending, refetch all messages to simulate update and dispatch
    const updatedMessages = await getChatMessages(liveId);
    chatListeners.forEach(l => l(liveId, updatedMessages));
    return newMsg;
};

export const getGiftCatalog = (): Promise<Gift[]> => apiClient('/api/gifts');
export const sendGift = (liveId: number, senderId: number, giftId: number, receiverId?: number): Promise<SendGiftResponse> => {
    return apiClient(`/api/lives/${liveId}/gift`, {
        method: 'POST',
        body: JSON.stringify({ senderId, giftId, receiverId })
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
    return apiClient(`/api/lives/${liveId}/like`, { method: 'POST', body: JSON.stringify({ userId }) });
};

export const getLiveEndSummary = (liveId: number): Promise<LiveEndSummary> => apiClient(`/api/lives/${liveId}/summary`);
export const getPublicProfile = (userId: number): Promise<PublicProfile> => apiClient(`/api/users/${userId}/profile`);
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

export const followUser = (followerId: number, followingId: number): Promise<User> => {
    return apiClient('/api/follows', { method: 'POST', body: JSON.stringify({ followerId, followingId }) });
};

export const unfollowUser = (followerId: number, followingId: number): Promise<User> => {
    return apiClient(`/api/follows/${followerId}/${followingId}`, { method: 'DELETE' });
};

export const getFriendRequests = (userId: number): Promise<User[]> => {
    return apiClient(`/api/users/${userId}/friend-requests`);
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
export const getStreamerRanking = (): Promise<GeneralRankingStreamer[]> => apiClient('/api/ranking/streamers');
export const getUserRanking = (): Promise<GeneralRankingUser[]> => apiClient('/api/ranking/users');

export const joinLiveStream = (userId: number, liveId: number): Promise<{ success: boolean }> => apiClient(`/api/lives/${liveId}/join`, { method: 'POST', body: JSON.stringify({ userId }) });
export const leaveLiveStream = (userId: number, liveId: number): Promise<{ success: boolean }> => apiClient(`/api/lives/${liveId}/leave`, { method: 'POST', body: JSON.stringify({ userId }) });
export const muteUser = (liveId: number, targetUserId: number, mute: boolean, durationMinutes: number = 5): Promise<{ success: boolean }> => apiClient<{ success: boolean }>(`/api/lives/${liveId}/mute`, { method: 'POST', body: JSON.stringify({ targetUserId, mute, durationMinutes }) }).then(res => {
    if(res.success) muteStatusManager.dispatch({ liveId, userId: targetUserId, isMuted: mute, mutedUntil: new Date(Date.now() + durationMinutes * 60000).toISOString() });
    return res;
});
export const kickUser = (liveId: number, targetUserId: number): Promise<{ success: boolean }> => apiClient<{ success: boolean }>(`/api/lives/${liveId}/kick`, { method: 'POST', body: JSON.stringify({ targetUserId }) }).then(res => {
    if(res.success) userKickedManager.dispatch({ liveId, kickedUserId: targetUserId });
    return res;
});
export const playSoundEffect = (liveId: number, triggeredBy: number, effectName: SoundEffectName): Promise<{ success: boolean }> => apiClient<{ success: boolean }>(`/api/lives/${liveId}/sound-effect`, { method: 'POST', body: JSON.stringify({ triggeredBy, effectName }) }).then(res => {
    if(res.success) soundEffectManager.dispatch({ liveId, triggeredBy, effectName });
    return res;
});
export const reportUser = (reporterId: number, reportedId: number): Promise<{ success: boolean }> => {
    const reportData = {
        reporterId,
        reportedId: String(reportedId),
        reason: "Denúncia do perfil",
        reportDetails: `Usuário ${reporterId} denunciou o usuário ${reportedId} a partir de seu perfil.`,
        fileName: ''
    };
    return apiClient('/api/reports', { method: 'POST', body: JSON.stringify(reportData) });
};

export const getNotificationSettings = (userId: number): Promise<NotificationSettings> => apiClient(`/api/users/${userId}/notification-settings`);
export const updateNotificationSettings = (userId: number, settings: Partial<Omit<NotificationSettings, 'userId'>>): Promise<NotificationSettings> => apiClient(`/api/users/${userId}/notification-settings`, { method: 'PATCH', body: JSON.stringify(settings) });
export const getPushSettings = (userId: number): Promise<Record<number, boolean>> => apiClient(`/api/users/${userId}/push-settings`);
export const updatePushSetting = (userId: number, followedUserId: number, enabled: boolean): Promise<{ success: boolean }> => apiClient(`/api/users/${userId}/push-settings`, { method: 'PATCH', body: JSON.stringify({ followedUserId, enabled }) });
export const getPrivateLiveInviteSettings = (userId: number): Promise<PrivateLiveInviteSettings> => apiClient(`/api/users/${userId}/private-live-invite-settings`);
export const updatePrivateLiveInviteSettings = (userId: number, settings: Partial<Omit<PrivateLiveInviteSettings, 'userId'>>): Promise<PrivateLiveInviteSettings> => apiClient(`/api/users/${userId}/private-live-invite-settings`, { method: 'PUT', body: JSON.stringify(settings) });

export const getUserLivePreferences = (userId: number): Promise<{ isPkEnabled: boolean; lastCameraUsed: FacingMode; lastSelectedCategory: Category }> => {
    return apiClient(`/api/users/${userId}/live-preferences`);
};

export const updateUserPkPreference = (userId: number, isPkEnabled: boolean): Promise<{ success: boolean }> => {
    return apiClient(`/api/users/${userId}/pk-preference`, { method: 'PUT', body: JSON.stringify({ isPkEnabled }) });
};

export const getCoHostFriends = (currentUserId: number): Promise<User[]> => apiClient(`/api/users/${currentUserId}/cohost-friends`);
export const getInvitableOpponents = (currentUserId: number): Promise<User[]> => apiClient(`/api/lives/invitable/${currentUserId}`);

export const sendDisputeInvitation = (inviterId: number, inviteeId: number): Promise<ConvitePK> => {
    return apiClient('/api/pk/dispute/invite', {
        method: 'POST',
        body: JSON.stringify({ inviterId, inviteeId }),
    });
};

export const getPendingPkInvitation = (userId: number): Promise<ConvitePK | null> => apiClient(`/api/pk/invites/pending/${userId}`);
export const getPkInvitationStatus = (invitationId: string): Promise<{ invitation: ConvitePK, battle?: PkBattle }> => apiClient(`/api/pk/invites/status/${invitationId}`);

export const joinPkMatchmakingQueue = (userId: number): Promise<{ success: boolean }> => apiClient('/api/pk/matchmaking/join', { method: 'POST', body: JSON.stringify({ userId }) });
export const leavePkMatchmakingQueue = (userId: number): Promise<{ success: boolean }> => apiClient('/api/pk/matchmaking/leave', { method: 'POST', body: JSON.stringify({ userId }) });
export const checkPkMatchmakingStatus = (userId: number): Promise<{ status: 'aguardando' | 'pareado', battle?: PkBattle }> => apiClient(`/api/pk/matchmaking/status/${userId}`);

export const getPkSettings = (userId: number): Promise<{ durationSeconds: number }> => apiClient(`/api/pk-settings/${userId}`);
export const updatePkSettings = (userId: number, durationSeconds: number): Promise<{ success: boolean }> => apiClient(`/api/pk-settings/${userId}`, { method: 'POST', body: JSON.stringify({ durationSeconds }) });
export const helpHostRankUp = (helperId: number, hostId: number, giftValue: number): Promise<{ updatedUser: User | null; success: boolean; message: string }> => apiClient('/api/ranking/help-host', { method: 'POST', body: JSON.stringify({ helperId, hostId, giftValue }) });

export const simulateReceivePkGift = (pkBattleId: number | string, receiverId: number, giftValue: number): Promise<PkBattleState> => {
    return apiClient(`/api/batalhas-pk/${pkBattleId}/simulate-gift`, {
        method: 'POST',
        body: JSON.stringify({ receiverId, giftValue })
    });
};

export const sendCoHostInvitation = (inviterId: number, inviteeId: number): Promise<ConvitePK> => {
    return apiClient('/api/pk/cohost/send-invite', {
        method: 'POST',
        body: JSON.stringify({ inviterId, inviteeId }),
    });
};

export const inviteToCoHostPk = (inviterId: number, inviteeId: number): Promise<PkBattle> => {
    return apiClient('/api/pk/cohost/invite', {
        method: 'POST',
        body: JSON.stringify({ inviterId, inviteeId }),
    });
};

export const blockAvatarAttempt = (userId: number, avatarImage: string): Promise<{ success: boolean }> => {
    return apiClient('/api/avatar/protection/block', {
        method: 'POST',
        body: JSON.stringify({ userId, avatarImage }),
    });
};

export const acceptPkInvitation = (invitationId: string): Promise<{ success: boolean, invitation: ConvitePK, battle?: PkBattle }> => apiClient(`/api/pk/invites/${invitationId}/accept`, { method: 'POST' });
export const declinePkInvitation = (invitationId: string): Promise<{ success: boolean }> => apiClient(`/api/pk/invites/${invitationId}/decline`, { method: 'POST' });
export const cancelPkInvitation = (invitationId: string): Promise<{ success: boolean }> => apiClient(`/api/pk/invites/${invitationId}/cancel`, { method: 'POST' });

// --- LOCATION SERVICES (NEW) ---
export const requestLocationPermission = (accuracy: 'exact' | 'approximate'): Promise<{ permission: 'granted', location: { lat: number, lon: number } }> => {
    console.log(`[Mock API] Simulating request for ${accuracy} location permission.`);
    // Simulate getting a location in Brazil
    return Promise.resolve({
        permission: 'granted',
        location: {
            lat: -23.5505,
            lon: -46.6333
        }
    });
};

export const saveUserLocationPreference = (userId: number, accuracy: 'exact' | 'approximate'): Promise<{ success: boolean }> => {
    console.log(`[Mock API] Saving location preference for user ${userId}: ${accuracy}`);
    return Promise.resolve({ success: true });
};

export const getNearbyStreams = (userId: number, accuracy: 'exact' | 'approximate'): Promise<Stream[]> => {
    console.log(`[Mock API] Fetching nearby streams for user ${userId} with ${accuracy} accuracy.`);
    // Simulate nearby streams by just shuffling popular streams and maybe changing a few details
    return apiClient<Stream[]>('/api/lives?category=popular&region=BR').then(streams => {
        return streams
            .map(stream => ({ ...stream, titulo: `Perto: ${stream.titulo}` }))
            .sort(() => Math.random() - 0.5);
    });
};

// --- PRIVACY SETTINGS (NEW) ---
export const getPrivacySettings = (userId: number): Promise<PrivacySettings> => {
    return apiClient(`/api/users/${userId}/privacy-settings`);
};

export const updatePrivacySettings = (userId: number, settings: Partial<Omit<PrivacySettings, 'userId'>>): Promise<PrivacySettings> => {
    return apiClient(`/api/users/${userId}/privacy-settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings)
    });
};
