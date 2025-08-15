import { apiClient } from './apiClient';
import type { User, LiveDetails, ChatMessage, Gift, Viewer, RankingContributor, Like, PkBattle, PkSession, PublicProfile, PkEventDetails, Conversation, SendGiftResponse, ProtectorDetails, WithdrawalTransaction, WithdrawalMethod, InventoryItem, AppEvent, LiveEndSummary, UserLevelInfo, GeneralRankingStreamer, GeneralRankingUser, WithdrawalBalance, EventStatus, PkRankingData, ReportPayload, SuggestionPayload, Stream, Category, StreamUpdateListener, StartLiveResponse, PkInvitation, LiveFollowUpdate, PrivateLiveInviteSettings, NotificationSettings, FacingMode, SoundEffectName, MuteStatusListener, UserKickedListener, SoundEffectListener, UniversalRankingData } from '../types';

// NOTE: Listener logic remains client-side for real-time simulation without websockets
const streamListeners = new Set<StreamUpdateListener>();
export const addStreamListener = (listener: StreamUpdateListener) => { streamListeners.add(listener); };
export const removeStreamListener = (listener: StreamUpdateListener) => { streamListeners.delete(listener); };

// This function will be called from the mock API to push updates to the client
export const notifyStreamListeners = (allStreams: Stream[]) => {
    streamListeners.forEach(listener => listener([...allStreams]));
};

// --- CHAT WEB-SOCKET SIMULATION ---
export type ChatUpdateListener = (liveId: number, messages: ChatMessage[]) => void;
const chatListeners = new Set<ChatUpdateListener>();
export const addChatMessageListener = (listener: ChatUpdateListener) => { chatListeners.add(listener); };
export const removeChatMessageListener = (listener: ChatUpdateListener) => { chatListeners.delete(listener); };

export const notifyChatMessageListeners = (liveId: number, allMessages: ChatMessage[]) => {
    chatListeners.forEach(listener => listener(liveId, [...allMessages]));
};

// --- MODERATION & INTERACTION WEB-SOCKET SIMULATION ---

// Mute Status
const muteStatusListeners = new Set<MuteStatusListener>();
export const addMuteStatusListener = (listener: MuteStatusListener) => { muteStatusListeners.add(listener); };
export const removeMuteStatusListener = (listener: MuteStatusListener) => { muteStatusListeners.delete(listener); };
export const notifyMuteStatusListeners = (update: { liveId: number; userId: number; isMuted: boolean; mutedUntil?: string }) => {
    muteStatusListeners.forEach(listener => listener(update));
};

// User Kicked
const userKickedListeners = new Set<UserKickedListener>();
export const addUserKickedListener = (listener: UserKickedListener) => { userKickedListeners.add(listener); };
export const removeUserKickedListener = (listener: UserKickedListener) => { userKickedListeners.delete(listener); };
export const notifyUserKickedListeners = (update: { liveId: number; kickedUserId: number }) => {
    userKickedListeners.forEach(listener => listener(update));
};

// Sound Effect
const soundEffectListeners = new Set<SoundEffectListener>();
export const addSoundEffectListener = (listener: SoundEffectListener) => { soundEffectListeners.add(listener); };
export const removeSoundEffectListener = (listener: SoundEffectListener) => { soundEffectListeners.delete(listener); };
export const notifySoundEffectListeners = (update: { liveId: number; effectName: SoundEffectName; triggeredBy: number; }) => {
    soundEffectListeners.forEach(listener => listener(update));
};


// --- STREAMING API FUNCTIONS ---

export const getPopularStreams = (): Promise<Stream[]> => apiClient('/api/lives/popular');
export const getFollowingStreams = (userId: number): Promise<Stream[]> => apiClient(`/api/lives/seguindo/${userId}`);
export const getNewStreams = (): Promise<Stream[]> => apiClient('/api/lives/novas');
export const getStreamsForCategory = (category: Category): Promise<Stream[]> => apiClient(`/api/lives/categoria/${category.toLowerCase()}`);
export const getPrivateStreams = (userId: number): Promise<Stream[]> => apiClient(`/api/lives/private/${userId}`);
export const getPkBattles = (): Promise<PkBattle[]> => apiClient('/api/lives/pk');
export const getPkBattleDetails = (pkId: number): Promise<PkBattle> => apiClient(`/api/pk-battles/${pkId}`);
export const getPkSessionDetails = (pkSessionId: number): Promise<PkSession> => apiClient(`/api/pk-sessions/${pkSessionId}`);
export const findPkSessionForStream = (streamId: number): Promise<PkSession | null> => apiClient(`/api/streams/${streamId}/pk-session`);
export const getUserLiveStatus = (userId: number): Promise<boolean> => apiClient(`/api/users/${userId}/live-status`);
export const getFollowingLiveStatus = (userId: number): Promise<LiveFollowUpdate[]> => apiClient(`/api/users/${userId}/following-live-status`);
export const getActiveStreamForUser = (userId: number): Promise<Stream | null> => apiClient(`/api/users/${userId}/active-stream`);
export const getUserLives = (userId: number): Promise<Stream[]> => apiClient(`/api/users/${userId}/lives`);

export const uploadLiveThumbnail = (thumbnailBase64: string): Promise<{ thumbnailUrl: string }> => {
    return apiClient('/api/lives/thumbnail', {
        method: 'POST',
        body: JSON.stringify({ thumbnailBase64 })
    });
};

export const startLiveStream = (user: User, details: { title: string, meta: string; category: Category, isPrivate: boolean, isPkEnabled: boolean, thumbnailUrl?: string, entryFee?: number, cameraUsed: FacingMode }): Promise<StartLiveResponse> => {
    return apiClient('/api/lives/create', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, ...details })
    });
};

export const stopLiveStream = (userId: number): Promise<void> => {
    return apiClient(`/api/users/${userId}/stop-live`, { method: 'POST' });
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

export const getLiveStreamDetails = (liveId: number): Promise<LiveDetails> => apiClient(`/api/lives/${liveId}/details`);
export const getChatMessages = (liveId: number): Promise<ChatMessage[]> => apiClient(`/api/chat/live/${liveId}`);
export const sendChatMessage = (liveId: number, userId: number, message: string): Promise<ChatMessage> => {
    return apiClient(`/api/chat/live/${liveId}`, {
        method: 'POST',
        body: JSON.stringify({ userId, message })
    });
};

export const getGiftCatalog = (): Promise<Gift[]> => apiClient('/api/gifts');
export const sendGift = (liveId: number, senderId: number, giftId: number): Promise<SendGiftResponse> => {
    return apiClient(`/api/lives/${liveId}/gift`, {
        method: 'POST',
        body: JSON.stringify({ senderId, giftId })
    });
};

/**
 * 2. FRONTEND SERVICE: Esta função consome a API real para obter os espectadores de uma live.
 * Ela usa o apiClient para fazer uma requisição GET para /api/lives/:liveId/viewers.
 */
export const getViewers = (liveId: number): Promise<Viewer[]> => apiClient(`/api/lives/${liveId}/viewers`);
export const getRanking = (liveId: number, period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<RankingContributor[]> => {
    return apiClient(`/api/lives/${liveId}/ranking?period=${period}`);
};

export const getUniversalRanking = (type: 'hourly_venezuela' | 'hourly_global' | 'daily' | 'weekly' | 'total' | 'hourly_brazil'): Promise<UniversalRankingData> => {
    return apiClient(`/api/ranking/universal?type=${type}`);
};

export const sendLike = (liveId: number, userId: number): Promise<Like> => {
    return apiClient(`/api/lives/${liveId}/like`, { method: 'POST', body: JSON.stringify({ userId }) });
};

export const getLiveEndSummary = (liveId: number): Promise<LiveEndSummary> => apiClient(`/api/lives/${liveId}/summary`);
export const getPublicProfile = (userId: number): Promise<PublicProfile> => apiClient(`/api/users/${userId}/profile`);
export const getPkRankingInfo = (): Promise<PkEventDetails> => apiClient('/api/pk-event/details');
export const blockUser = (blockerId: number, targetId: number): Promise<{ success: boolean }> => {
    return apiClient('/api/users/block', { method: 'POST', body: JSON.stringify({ blockerId, targetId }) });
};
export const unblockUser = (unblockerId: number, targetId: number): Promise<{ success: boolean }> => {
    return apiClient('/api/users/unblock', { method: 'POST', body: JSON.stringify({ unblockerId, targetId }) });
};
export const getBlockedUsers = (currentUserId: number): Promise<User[]> => apiClient(`/api/users/${currentUserId}/blocked`);

export const getConversationById = (conversationId: string, currentUserId: number): Promise<Conversation> => apiClient(`/api/chat/private/${conversationId}?userId=${currentUserId}`);
export const getOrCreateConversationWithUser = (currentUserId: number, otherUserId: number): Promise<Conversation> => {
    return apiClient('/api/chat/private/get-or-create', { method: 'POST', body: JSON.stringify({ currentUserId, otherUserId }) });
};
export const sendMessageToConversation = (conversationId: string, senderId: number, text: string): Promise<Conversation> => {
    return apiClient(`/api/chat/private/${conversationId}`, { method: 'POST', body: JSON.stringify({ senderId, text }) });
};
export const markMessagesAsSeen = (conversationId: string, viewerId: number): Promise<{ success: boolean }> => {
    return apiClient('/api/chat/viewed', { method: 'POST', body: JSON.stringify({ conversationId, viewerId }) });
};

export const getProtectorsList = (streamerId: number): Promise<ProtectorDetails[]> => apiClient(`/api/users/${streamerId}/protectors`);
export const followUser = (currentUserId: number, targetUserId: number): Promise<User> => {
    return apiClient('/api/users/follow', { method: 'POST', body: JSON.stringify({ currentUserId, targetUserId }) });
};
export const unfollowUser = (currentUserId: number, targetUserId: number): Promise<User> => {
    return apiClient('/api/users/unfollow', { method: 'POST', body: JSON.stringify({ currentUserId, targetUserId }) });
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

export const submitReport = (data: ReportPayload): Promise<{ success: boolean }> => {
    return apiClient('/api/reports', { method: 'POST', body: JSON.stringify(data) });
};
export const reportUser = (reporterId: number, reportedId: number, reason = 'Reported from profile'): Promise<{ success: boolean }> => {
    return submitReport({
        reportedId: String(reportedId),
        reportReason: reason,
        reportDetails: `Reported by user ${reporterId}`,
        fileName: '',
    });
};
export const submitSuggestion = (data: SuggestionPayload): Promise<{ success: boolean }> => {
    return apiClient('/api/suggestions', { method: 'POST', body: JSON.stringify(data) });
};

export const getEventsByStatus = (status: EventStatus): Promise<AppEvent[]> => apiClient(`/api/events?status=${status}`);
export const getEventById = (eventId: string): Promise<AppEvent> => apiClient(`/api/events/${eventId}`);
export const getUserLevelInfo = (userId: number): Promise<UserLevelInfo> => apiClient(`/api/users/${userId}/level`);
export const getStreamerRanking = (): Promise<GeneralRankingStreamer[]> => apiClient('/api/ranking/streamers');
export const getUserRanking = (): Promise<GeneralRankingUser[]> => apiClient('/api/ranking/users');
export const joinLiveStream = (userId: number, liveId: number): Promise<{ success: boolean }> => {
    return apiClient(`/api/lives/${liveId}/join`, { method: 'POST', body: JSON.stringify({ userId }) });
};
export const leaveLiveStream = (userId: number, liveId: number): Promise<{ success: boolean }> => {
    return apiClient(`/api/lives/${liveId}/leave`, {
        method: 'POST',
        body: JSON.stringify({ userId })
    });
};


// --- PK Battle Functions ---
export const getInvitableOpponents = (currentUserId: number): Promise<User[]> => apiClient(`/api/lives/invitable/${currentUserId}`);
export const sendPkInvitation = (inviterId: number, inviteeId: number): Promise<PkInvitation> => apiClient('/api/pk/invite', { method: 'POST', body: JSON.stringify({ inviterId, inviteeId }) });
export const getPendingPkInvitation = (userId: number): Promise<PkInvitation | null> => apiClient(`/api/pk/invites/pending/${userId}`);
export const acceptPkInvitation = (invitationId: string): Promise<PkBattle> => apiClient(`/api/pk/invites/${invitationId}/accept`, { method: 'POST' });
export const declinePkInvitation = (invitationId: string): Promise<{ success: boolean }> => apiClient(`/api/pk/invites/${invitationId}/decline`, { method: 'POST' });
export const endPkBattle = (pkSessionId: number): Promise<{ success: boolean }> => apiClient(`/api/pk/battles/${pkSessionId}/end`, { method: 'POST' });

// --- Settings Functions ---
export const getUserPkPreference = (userId: number): Promise<{ isPkEnabled: boolean }> => {
    return apiClient(`/api/users/${userId}/pk-preference`);
};

export const updateUserPkPreference = (userId: number, isPkEnabled: boolean): Promise<{ success: boolean }> => {
    return apiClient(`/api/users/${userId}/pk-preference`, {
        method: 'PATCH',
        body: JSON.stringify({ isPkEnabled })
    });
};

export const getPrivateLiveInviteSettings = (userId: number): Promise<PrivateLiveInviteSettings> => {
    return apiClient(`/api/users/${userId}/private-live-invite-settings`);
};

export const updatePrivateLiveInviteSettings = (userId: number, settings: Partial<Omit<PrivateLiveInviteSettings, 'userId'>>): Promise<PrivateLiveInviteSettings> => {
    return apiClient(`/api/users/${userId}/private-live-invite-settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
    });
};

export const getNotificationSettings = (userId: number): Promise<NotificationSettings> => {
    return apiClient(`/api/users/${userId}/notification-settings`);
};

export const updateNotificationSettings = (userId: number, settings: Partial<Omit<NotificationSettings, 'userId'>>): Promise<NotificationSettings> => {
    return apiClient(`/api/users/${userId}/notification-settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
    });
};

export const getPushSettings = (userId: number): Promise<Record<number, boolean>> => {
    return apiClient(`/api/users/${userId}/push-settings`);
};

export const updatePushSetting = (userId: number, followedUserId: number, enabled: boolean): Promise<{ success: boolean }> => {
    return apiClient(`/api/users/${userId}/push-settings`, {
        method: 'PATCH',
        body: JSON.stringify({ followedUserId, enabled }),
    });
};

// --- Moderation Functions ---
export const muteUser = (liveId: number, targetUserId: number, mute: boolean, durationMinutes: number = 5): Promise<{ success: boolean }> => {
    return apiClient(`/api/lives/${liveId}/mute`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId, mute, durationMinutes })
    });
};

export const kickUser = (liveId: number, targetUserId: number): Promise<{ success: boolean }> => {
    return apiClient(`/api/lives/${liveId}/kick`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
    });
};

export const playSoundEffect = (liveId: number, triggeredBy: number, effectName: SoundEffectName): Promise<{ success: boolean }> => {
    return apiClient(`/api/lives/${liveId}/sound-effect`, {
        method: 'POST',
        body: JSON.stringify({ triggeredBy, effectName })
    });
};

export const switchCamera = (liveId: number, userId: number): Promise<{ newFacingMode: FacingMode }> => {
    return apiClient('/api/live/switch-camera', {
        method: 'POST',
        body: JSON.stringify({ liveId, userId })
    });
};

export const toggleVoice = (liveId: number, userId: number): Promise<{ voiceEnabled: boolean }> => {
    return apiClient('/api/live/toggle-voice', {
        method: 'POST',
        body: JSON.stringify({ liveId, userId })
    });
};
