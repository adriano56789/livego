
/// <reference types="vite/client" />

import { User, Gift, Streamer, Message, RankedUser, Country, Conversation, NotificationSettings, BeautySettings, BeautyEffectsData, PurchaseRecord, EligibleUser, FeedPhoto, Obra, GoogleAccount, LiveSessionState, StreamHistoryEntry, Visitor, LevelInfo, Order, DiamondPackage, LiveNotification, Invitation, PixPaymentResponse, CreditCardPaymentRequest, SRSResponse, SRSPlayResponse, SRSStreamInfo } from '../types';
import axios, { Method } from 'axios';

const getApiBaseUrl = () => {
    // Em desenvolvimento, detectar automaticamente o IP do backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000'; // Usar localhost em desenvolvimento
    }
    
    // Em produção, usar o mesmo domínio
    return `${window.location.protocol}//${window.location.hostname}`;
};

const API_BASE_URL = getApiBaseUrl();

const getCurrentUserId = () => {
    try {
        // Tentar obter do localStorage 'user' (LoginScreen)
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            return user?.id;
        }

        // Fallback para 'user_storage' (Zustand/Persist se houver)
        const userStorageStr = localStorage.getItem('user_storage');
        if (userStorageStr) {
            const userStorage = JSON.parse(userStorageStr);
            return userStorage?.state?.user?.id || userStorage?.id;
        }
    } catch (e) {
    }
    return null;
};

const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Core API Caller
 * Performs real HTTP requests to the backend.
 */
const callApi = async <T>(method: string, path: string, body?: any, customBaseUrl?: string): Promise<T> => {
    const requestKey = `${method}:${path}:${JSON.stringify(body || {})}`;

    if (method === 'GET' && inFlightRequests.has(requestKey)) {
        return inFlightRequests.get(requestKey) as Promise<T>;
    }


    const requestPromise = (async () => {
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Evitar 304 Not Modified — forçar o browser a sempre buscar dados frescos
            if (method === 'GET') {
                headers['Cache-Control'] = 'no-cache';
                headers['Pragma'] = 'no-cache';
            }

            const baseUrl = customBaseUrl || API_BASE_URL;

            const response = await axios({
                method: method as Method,
                url: `${baseUrl}${path}`,
                headers,
                data: body,
                params: method === 'GET' && body ? body : undefined
            });

            // Check for HTML response
            const contentType = response.headers['content-type'];
            if (contentType && contentType.includes('text/html')) {
                throw new Error('API returned HTML instead of JSON');
            }
            if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
                throw new Error('API returned HTML-like string instead of JSON');
            }

            // Tratar status 304 Not Modified - dados não modificados
            if (response.status === 304) {
                return response.data as T;
            }

            return response.data as T;
        } catch (error: any) {

            // Tratar status 304 Not Modified mesmo no bloco catch
            if (error.response?.status === 304) {
                return error.response?.data as T;
            }

            throw new Error(error.response?.data?.error || `HTTP Error ${error.response?.status || 'Unknown'}`);
        } finally {
            if (method === 'GET') {
                inFlightRequests.delete(requestKey);
            }
        }
    })();

    if (method === 'GET') {
        inFlightRequests.set(requestKey, requestPromise);
    }

    return requestPromise;
};


export const api = {
    // --- Auth & Accounts ---
    login: (credentials: any) => callApi<{ success: boolean, token: string, user: User }>('POST', '/api/auth/login', credentials),
    register: (userData: any) => callApi<{ success: boolean, token: string, user: User }>('POST', '/api/auth/register', userData),
    logout: (userId?: string) => callApi<{ success: boolean }>('POST', '/api/auth/logout', { id: userId }),
    getGoogleAccounts: () => callApi<GoogleAccount[]>('GET', '/api/accounts/google'),
    getConnectedGoogleAccounts: () => callApi<GoogleAccount[]>('GET', '/api/accounts/google/connected'),
    disconnectGoogleAccount: (email: string) => callApi<{ success: boolean }>('POST', '/api/accounts/google/disconnect', { email }),

    // --- Users ---
    getCurrentUser: () => callApi<User>('GET', '/api/users/me'),
    getAllUsers: () => callApi<User[]>('GET', '/api/users'),
    getUser: (userId: string) => callApi<User>('GET', `/api/users/${userId}`),
    deleteAccount: (userId: string) => callApi<{ success: boolean }>('DELETE', `/api/users/${userId}`),
    updateProfile: (userId: string, updates: Partial<User>) => callApi<{ success: boolean, user: User }>('PATCH', `/api/users/${userId}`, updates),
    followUser: (followerId: string, followedId: string, streamId?: string) => callApi<{ success: boolean, updatedFollower: User, updatedFollowed: User, isFriendship?: boolean }>('POST', `/api/users/${followedId}/toggle-follow`, { streamId }),
    blockUser: (userIdToBlock: string) => callApi<{ success: boolean }>('POST', `/api/users/${userIdToBlock}/block`),
    unblockUser: (userIdToUnblock: string) => callApi<{ success: boolean }>('DELETE', `/api/users/${userIdToUnblock}/unblock`),
    reportUser: (userIdToReport: string, reason: string) => callApi<{ success: boolean }>('POST', `/api/users/${userIdToReport}/report`, { reason }),
    getFansUsers: (userId: string) => callApi<User[]>('GET', `/api/users/${userId}/fans`),
    getFollowingUsers: (userId: string) => callApi<User[]>('GET', `/api/users/${userId}/following`),
    getFriends: (userId: string) => callApi<User[]>('GET', `/api/users/${userId}/friends`),
    getConversations: (userId: string) => callApi<Conversation[]>('GET', `/api/users/${userId}/messages`),
    getBlockedUsers: () => callApi<User[]>('GET', '/api/users/me/blocklist'),
    getUserPhotos: (userId: string) => callApi<FeedPhoto[]>('GET', `/api/users/${userId}/photos`),
    getLikedPhotos: (userId: string) => callApi<FeedPhoto[]>('GET', `/api/users/${userId}/liked-photos`),
    getLevelInfo: (userId: string) => callApi<LevelInfo>('GET', `/api/users/${userId}/level-info`),
    recordVisit: (profileId: string, visitorId: string) => callApi<void>('POST', `/api/users/${profileId}/visit`, { userId: visitorId }),

    // --- Sistema de Nível (NOVO) ---
    level: {
      // Obter informações completas do nível
      getLevelInfo: (userId: string) => callApi<{
        level: number;
        currentExp: number;
        expForNextLevel: number;
        totalExp: number;
        progress: number;
        expNeeded: number;
        lastGain: { amount: number; reason: string; timestamp: string };
        levelHistory: Array<{ level: number; reachedAt: string; expRequired: number }>;
        rank: string;
      }>('GET', `/api/level/${userId}`),

      // Adicionar EXP ao usuário
      addExp: (userId: string, amount: number, reason?: string) => callApi<{
        leveledUp: boolean;
        newLevels: number[];
        currentLevel: number;
        currentExp: number;
        expForNextLevel: number;
        totalExp: number;
        progress: number;
      }>('POST', `/api/level/${userId}/add-exp`, { amount, reason }),

      // Adicionar EXP múltiplas vezes (batch)
      addMultipleExp: (userId: string, expGains: Array<{ amount: number; reason: string }>) => callApi<{
        leveledUp: boolean;
        newLevels: number[];
        currentLevel: number;
        currentExp: number;
        expForNextLevel: number;
        totalExp: number;
        progress: number;
        totalGained: number;
        levelUps: number[];
      }>('POST', `/api/level/${userId}/multi-add`, { expGains }),

      // Obter ranking de usuários
      getLeaderboard: (limit?: number, offset?: number) => callApi<Array<{
        rank: number;
        user: User;
        level: number;
        totalExp: number;
        currentExp: number;
        expForNextLevel: number;
        progress: number;
      }>>('GET', `/api/level/leaderboard?limit=${limit || 50}&offset=${offset || 0}`),

      // Calcular EXP necessária para um nível específico
      calculateExpForLevel: (level: number) => callApi<{
        level: number;
        expForLevel: number;
        totalExpNeeded: number;
        difficulty: string;
      }>('GET', `/api/level/calculate/${level}`),

      // Adicionar EXP por ações específicas
      addExpForAction: async (userId: string, action: 'login' | 'message' | 'gift' | 'follow' | 'stream_start' | 'stream_end', metadata?: any) => {
        const expValues = {
          login: { amount: 5, reason: 'Login diário' },
          message: { amount: 2, reason: 'Mensagem enviada' },
          gift: { amount: 10, reason: 'Presente enviado' },
          follow: { amount: 15, reason: 'Seguiu usuário' },
          stream_start: { amount: 25, reason: 'Iniciou transmissão' },
          stream_end: { amount: 50, reason: 'Finalizou transmissão' }
        };

        const expConfig = expValues[action];
        if (!expConfig) return null;

        return api.level.addExp(userId, expConfig.amount, expConfig.reason);
      }
    },

    // --- Profile Management (Correct Routes) ---
    profile: {
        getImages: (userId?: string) => callApi<FeedPhoto[]>('GET', userId ? `/api/users/${userId}/photos` : '/api/users/me/photos'),
        deleteImage: (id: string, userId?: string) => callApi<{ success: boolean }>('DELETE', userId ? `/api/users/${userId}/photos/${id}` : `/api/users/me/photos/${id}`),
        setMainImage: (id: string, userId?: string) => callApi<{ success: boolean }>('PUT', userId ? `/api/users/${userId}/photos/${id}/set-main` : `/api/users/me/photos/${id}/set-main`),
        reorderImages: (orderedIds: string[], userId?: string) => callApi<{ success: boolean, images: FeedPhoto[] }>('PUT', userId ? `/api/users/${userId}/photos/reorder` : `/api/users/me/photos/reorder`, { orderedIds }),

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
    getEarningsInfo: (userId: string) => callApi<{
        withdrawal_method: boolean; available_diamonds: number; brl_value: number; conversion_rate: string; 
    }>('GET', `/api/wallet/earnings/get/${userId}`),
    getFreshUserData: (userId: string) => callApi<User>('GET', `/api/users/${userId}`),
    calculateWithdrawal: (amount: number) => {
        return callApi<{ diamonds: number; gross_brl: number; platform_fee_brl: number; net_brl: number; breakdown: { conversion: string; fee: string; final: string; } }>('POST', '/api/wallet/earnings/calculate', { amount });
    },
    confirmWithdrawal: (userId: string, amount: number) => {
        return callApi<{ success: boolean, amount: number, newEarnings: number, brl_amount: number, platform_fee: number, message: string }>('POST', `/api/wallet/withdraw/${userId}`, { amount });
    },
    setWithdrawalMethod: (method: string, details: any) => {
        return callApi<{ success: boolean, user: User }>('POST', `/api/wallet/earnings/method/set/${getCurrentUserId()}`, { method, details });
    },
    
    // --- Gift Counters ---
    validateGiftCounters: (userId: string) => callApi<{ userId: any; current: any; real: any; differences: any; needsUpdate: boolean; transactions: any; details: any; }>('GET', `/api/wallet/gifts/validate/${userId}`),
    syncGiftCounters: (userId: string) => callApi<{ success: boolean; userId: string; updated: any; previous: any; changes: any; transactions: any; }>('POST', `/api/wallet/gifts/sync/${userId}`),
    syncAllGiftCounters: () => callApi<{ success: boolean; totalUsers: number; updated: number; totalDifferences: any; }>('POST', '/api/wallet/gifts/sync-all'),

    // --- Checkout & Payments (New) ---
    getDiamondPackages: () => {
        return callApi<DiamondPackage[]>('GET', '/api/checkout/pack');
    },
    createOrder: (userId: string, packageId: string, amount: number, diamonds: number) => {
        return callApi<Order>('POST', '/api/checkout/order', { userId, packageId, amount, diamonds });
    },
    processPixPayment: (orderId: string) => {
        return callApi<PixPaymentResponse>('POST', '/api/checkout/pix', { orderId });
    },
    processCreditCardPayment: (data: CreditCardPaymentRequest) => {
        return callApi<{ success: boolean, message: string, orderId: string }>('POST', '/api/checkout/credit-card', data);
    },
    confirmPurchase: (orderId: string) => {
        return callApi<{ success: boolean, user: User, order: Order }>('POST', '/api/purchase/confirm', { orderId });
    },
    checkPixPaymentStatus: (orderId: string) => {
        return callApi<{ success: boolean, status: string, order: Order, payment?: any }>('GET', `/api/payments/pix/status/${orderId}`);
    },

    // --- Admin Control ---
    saveAdminWithdrawalMethod: (email: string) => {
        return callApi<{ success: boolean, user: User }>('POST', '/api/admin/withdrawal-method', { email });
    },
    requestAdminWithdrawal: () => {
        return callApi<{ success: boolean, message: string }>('POST', '/api/admin/withdraw');
    },
    getAdminWithdrawalHistory: (status: string) => {
        return callApi<PurchaseRecord[]>('GET', `/api/admin/history?status=${status}`);
    },

    // --- Metadata & Catalog ---
    getRankingForPeriod: async (period: string, userId?: string): Promise<RankedUser[]> => {
        try {
            if (!period) {
                return [];
            }

            // Forçar cache-busting adicionando timestamp
            const timestamp = Date.now();
            const url = userId 
                ? `/api/ranking/${period}?userId=${userId}&_t=${timestamp}`
                : `/api/ranking/${period}?_t=${timestamp}`;
            const response = await callApi<RankedUser[]>(`GET`, url);

            // Garantir que sempre retorne um array válido
            if (!response) {
                return [];
            }

            if (!Array.isArray(response)) {
                return [];
            }

            // Validar e filtrar usuários
            const validUsers = response.filter(user => {
                const isValid = user &&
                    typeof user === 'object' &&
                    user.id &&
                    user.name &&
                    typeof user.contribution === 'number' &&
                    user.contribution >= 0;
                
                return isValid;
            });

            return validUsers;

        } catch (error) {
            return []; // Sempre retornar array vazio em caso de erro
        }
    },
    getGifts: () => callApi<Gift[]>('GET', '/api/gifts'),
    getGiftsByCategory: (category: string) => callApi<Gift[]>('GET', `/api/gifts/category/${category}`),
    getReceivedGifts: (userId: string) => callApi<Gift[]>('GET', `/api/gifts/received/${userId}`),
    getRegions: () => callApi<Country[]>('GET', '/api/regions'),
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

    // --- Location ---
    updateLocation: (latitude: number, longitude: number) => callApi<{ success: boolean, user: User }>('POST', '/api/location/update', { latitude, longitude }),
    getNearbyUsers: (latitude: number, longitude: number) => callApi<User[]>('GET', `/api/location/nearby?latitude=${latitude}&longitude=${longitude}`),
    getUserLocation: () => callApi<{ success: boolean; location: any; permission: string; showLocation: boolean }>('GET', '/api/location/user'),

    // --- Permissions ---
    getCameraPermission: (userId: string) => callApi<{ status: 'granted' | 'denied' | 'prompt' }>('GET', `/api/permissions/camera/${userId}`),
    updateCameraPermission: (userId: string, status: string) => callApi<void>('POST', `/api/permissions/camera/${userId}`, { status }),
    getMicrophonePermission: (userId: string) => callApi<{ status: 'granted' | 'denied' | 'prompt' }>('GET', `/api/permissions/microphone/${userId}`),
    updateMicrophonePermission: (userId: string, status: string) => callApi<void>('POST', `/api/permissions/microphone/${userId}`, { status }),
    getLocationPermission: (userId: string) => callApi<{ status: 'granted' | 'denied' | 'prompt' }>('GET', `/api/users/${userId}/location-permission`),
    updateLocationPermission: (userId: string, status: string) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/location-permission`, { status }),
    getChatPermissionStatus: (userId: string) => callApi<{ permission: 'all' | 'followers' | 'none' }>('GET', `/api/chat-permission/status/${userId}`),
    updateChatPermission: (userId: string, permission: string) => callApi<{ success: boolean, user: User }>('POST', `/api/chat-permission/update/${userId}`, { permission }),

    // --- Live Stream & Online Users ---
    joinStream: async (streamId: string, userId: string) => {
        try {
            const response = await callApi<{ success: boolean }>('POST', `/api/streams/${streamId}/join`, { userId });
            return response?.success || false;
        } catch (error) {
            return false;
        }
    },

    leaveStream: async (streamId: string, userId: string) => {
        try {
            const response = await callApi<{ success: boolean }>('POST', `/api/streams/${streamId}/leave`, { userId });
            return response?.success || false;
        } catch (error) {
            return false;
        }
    },

    getLiveStreamers: (category: string, country?: string, userId?: string) => {
        let url = `/api/live/${category}?`;
        if (country && country !== 'ICON_GLOBE') url += `country=${country}&`;
        if (userId) url += `userId=${userId}`;
        return callApi<Streamer[]>('GET', url);
    },
    createStream: (userId: string, options: Partial<Streamer>) => callApi<Streamer>('POST', `/api/streams`, { ...options, hostId: userId }),
    updateStream: (streamId: string, updates: Partial<Streamer>, p0: { isPrivate: boolean; }) => callApi<Streamer>('PUT', `/api/streams/${streamId}`, updates),
    patchStream: (streamId: string, updates: Partial<Streamer>) => callApi<{ success: boolean, stream: Streamer }>('PATCH', `/api/streams/${streamId}`, updates),
    saveStream: (streamId: string, updates: any) => callApi<{ success: boolean, stream: Streamer }>('POST', `/api/streams/${streamId}/save`, updates),
    uploadStreamCover: (streamId: string, coverData: any) => callApi<{ success: boolean, stream: Streamer }>('POST', `/api/streams/${streamId}/cover`, coverData),
    getStreamManual: () => callApi<any[]>('GET', '/api/streams/manual'),
    getBeautyEffects: () => callApi<BeautyEffectsData>('GET', '/api/interactions/effects/beauty'),
    endLiveSession: (streamId: string, sessionData: LiveSessionState) => callApi<{ success: boolean, user: User }>('POST', `/api/streams/${streamId}/end-session`, { session: sessionData }),
    removeLiveCard: (streamId: string, userId: string) => callApi<{ success: boolean }>('DELETE', `/api/cards/${streamId}?userId=${userId}`),
    sendGift: (fromUserId: string, toUserId: string, streamId: string, giftName: string, amount: number) => callApi<{ success: boolean; error?: string; updatedSender: User; updatedReceiver: User; }>('POST', `/api/streams/${streamId}/gift`, { fromUserId, toUserId, giftName, amount }),
    updateSimStatus: (isOnline: boolean) => callApi<{ success: boolean, user: User }>('POST', '/api/sim/status', { isOnline }),

    // ... (rest of the code remains the same)
    publishWebRTC: (streamUrl: string, sdp: string, streamKey?: string) => callApi<SRSResponse>('POST', '/api/rtc/v1/publish', { streamUrl, sdp, streamKey }),
    playWebRTC: (streamUrl: string, sdp: string) => callApi<SRSPlayResponse>('POST', '/api/rtc/v1/play', { streamUrl, sdp }),
    stopWebRTC: (streamUrl: string) => callApi<SRSResponse>('DELETE', '/api/rtc/v1/stop', { streamUrl }),
    getStreamInfo: (streamId: string) => callApi<SRSStreamInfo>('GET', `/api/v1/streams/${streamId}`),

    // --- PK & Interaction ---
    getPKConfig: () => callApi<{ duration: number }>('GET', '/api/pk/config'),
    updatePKConfig: (duration: number) => callApi<{ success: boolean, config: any }>('POST', '/api/pk/config', { duration }),
    startPKBattle: (userId: string, streamId: string, opponentId: string) => callApi<{ success: boolean }>('POST', `/api/pk/start`, { userId, streamId, opponentId }),
    endPKBattle: (userId: string, streamId: string) => callApi<{ success: boolean }>('POST', `/api/pk/end`, { userId, streamId }),
    sendPKHeart: (roomId: string, team: 'A' | 'B') => callApi<{ success: boolean }>('POST', '/api/pk/heart', { roomId, team }),
    getGiftSendersForStream: (streamId: string) => callApi<any>('GET', `/api/interactions/presents/live/${streamId}`),
    sendPrivateInviteToGifter: (streamId: string, gifterId: string) => callApi<void>('POST', `/api/interactions/streams/${streamId}/private-invite`, { userId: gifterId }),
    inviteUserToPrivateStream: (streamId: string, userId: string) => callApi<{ success: boolean }>('POST', `/api/interactions/streams/${streamId}/private-invite`, { userId }),
    checkPrivateStreamAccess: (streamId: string, userId: string) => callApi<{ canJoin: boolean }>('GET', `/api/streams/${streamId}/access-check?userId=${userId}`),
    inviteFriendForCoHost: (streamId: string, inviteeId: string) => callApi<{ success: boolean, message?: string, error?: string }>('POST', '/api/friends/invite', { streamId, inviteeId }),
    sendStreamInteraction: (streamId: string, type: string, data: any) => callApi<{ success: boolean }>('POST', `/api/streams/${streamId}/interactions`, { type, ...data }),

    // --- Stream Controls ---
    toggleStreamSound: (streamId: string) => callApi<{ success: boolean }>('POST', `/api/streams/${streamId}/toggle-sound`),

    // --- Private Room Invitations ---
    sendInvitation: (roomId: string, userId: string) => callApi<{ success: boolean }>('POST', '/api/invitations/send', { roomId, userId }),
    getReceivedInvitations: () => callApi<Invitation[]>('GET', '/api/invitations/received'),
    getRoomDetails: (roomId: string) => callApi<Streamer>('GET', `/api/rooms/${roomId}`),
    getPrivateRooms: (userId?: string) => callApi<Streamer[]>('GET', `/api/rooms?category=private&userId=${userId || getCurrentUserId()}`),
    getStreamMessages: (streamId: string) => callApi<Message[]>('GET', `/api/streams/${streamId}/messages`),

    // --- Feed & Photos ---
    getPhotoFeed: () => callApi<FeedPhoto[]>('GET', '/api/interactions/feed/photos'),
    likePhoto: (photoId: string, userId?: string) => callApi<{ success: boolean; likes: number; isLiked: boolean; }>('POST', `/api/photos/${photoId}/like`, { userId: userId || getCurrentUserId() }),
    uploadChatPhoto: (userId: string, base64Image: string) => callApi<{ success: boolean; url: string; photo: { id: string; url: string; } }>('POST', `/api/interactions/photos/upload/${userId}`, { image: base64Image }),

    // Upload de avatar (arquivo) - retorna URL persistida, evita bloqueio de Base64
    uploadAvatar: async (userId: string, file: File): Promise<{ success: boolean; avatarUrl: string }> => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('avatar', file);
        // USAR VPS PARA PRODUÇÃO 100%
        const response = await axios({
            method: 'POST',
            url: `https://api.livego.store/api/upload/avatar/${userId}`,
            data: formData,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        return response.data;
    },

    // --- Search ---
    searchUsers: (query: string, limit?: number) => callApi<{ success: boolean; users: User[]; count: number }>('GET', `/api/search/users?q=${encodeURIComponent(query)}${limit ? `&limit=${limit}` : ''}`),

    // --- Chat & Messages ---
    getChatMessages: (userId: string, currentUserId?: string) => callApi<{ success: boolean, messages: Message[], total: number }>('GET', `/api/messages/chats/${userId}/messages?currentUserId=${currentUserId || getCurrentUserId()}`).then(res => res ? res.messages : []),
    sendChatMessage: (from: string, to: string, text?: string, imageUrl?: string, tempId?: string): Promise<{ success: boolean; message: Message }> => callApi<{ success: boolean; message: Message }>('POST', '/api/chats/send', { from, to, text, imageUrl, tempId }) as Promise<{ success: boolean; message: Message }>,
    deleteMessage: (messageId: string, userId?: string): Promise<{ success: boolean }> => callApi<{ success: boolean }>('DELETE', `/api/messages/${messageId}?userId=${userId || getCurrentUserId()}`),
    markMessagesAsRead: (messageIds: string[], userId: string) => callApi<{ success: boolean }>('PUT', `/api/messages/messages/${messageIds[0]}/read`, { userId }),
    getVisitors: (userId: string) => callApi<Visitor[]>('GET', `/api/interactions/visitors/list/${userId}`),
    clearVisitors: (userId: string) => callApi<{ success: boolean }>('DELETE', `/api/interactions/visitors/clear/${userId}`),
    updateVideoQuality: (streamId: string, quality: string, userId?: string) => callApi<{ success: boolean, stream: Streamer }>('PUT', `/api/streams/${streamId}/quality`, { quality, userId: userId || getCurrentUserId() }),
    toggleMicrophone: (streamId: string) => callApi<void>('POST', `/api/streams/${streamId}/toggle-mic`),
    toggleAutoFollow: (streamId: string, isEnabled: boolean) => callApi<void>('POST', `/api/streams/${streamId}/toggle-auto-follow`, { isEnabled }),
    toggleAutoPrivateInvite: (streamId: string, isEnabled: boolean) => callApi<void>('POST', `/api/streams/${streamId}/toggle-auto-invite`, { isEnabled }),
    purchaseFrame: (userId: string, frameId: string) => callApi<{ success: boolean, user: User }>('POST', `/api/effects/purchase-frame/${userId}`, { frameId }),
    setActiveFrame: (userId: string, frameId: string | null) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/set-active-frame`, { frameId }),
    buyFrame: async (userId: string, frameId: string, price: number, duration: number) => {
      return callApi<{ success: boolean; user: any }>('POST', `/api/users/${userId}/frames/buy`, {
        frameId,
        price,
        duration
      });
    },
    equipFrame: async (userId: string, frameId: string | null) => {
      if (frameId) {
        return callApi<{ success: boolean; user: any }>('POST', `/api/users/${userId}/frames/equip`, {
          frameId
        });
      } else {
        return callApi<{ success: boolean; user: any }>('POST', `/api/users/${userId}/frames/unequip`);
      }
    },
    getUserFrames: async (userId: string) => {
      return callApi<{ ownedFrames: any[]; activeFrameId: string; diamonds: number }>('GET', `/api/users/${userId}/frames`);
    },
    getAvatarFrames: () => callApi<Array<{ id: string, name: string, price: number, duration: number }>>('GET', '/api/interactions/effects/frames'),
    // --- Avatar & Profile APIs ---
    getUserAvatar: (userId: string) => callApi<{ photoUrl: string }>('GET', `/api/users/${userId}/photos/avatar`),
    getUserStream: (userId: string) => callApi<{ streamId: string, isLive: boolean, streamUrl?: string }>('GET', `/api/lives/${userId}/stream`),
    subscribeToVIP: (userId: string) => callApi<{ success: boolean, user: User }>('POST', `/api/vip/subscribe/${userId}`),
    purchaseEffect: (userId: string, gift: Gift) => callApi<{ success: boolean, user: User }>('POST', `/api/effects/purchase/${userId}`, { giftId: gift.name }),
    getAvatarProtectionStatus: (userId: string) => callApi<{ isEnabled: boolean }>('GET', `/api/users/${userId}/avatar-protection`),
    toggleAvatarProtection: (userId: string, isEnabled: boolean) => callApi<{ success: boolean, user: User }>('POST', `/api/users/${userId}/avatar-protection`, { isEnabled }),
    kickUser: (streamId: string, userId: string, kickerId: string) => callApi<void>('POST', `/api/streams/${streamId}/kick`, { userId, kickerId }),
    makeModerator: (streamId: string, userId: string, hostId: string) => callApi<void>('POST', `/api/streams/${streamId}/moderator`, { userId, hostId }),
    endLiveStream: (streamId: string) => callApi<{ success: boolean }>('POST', `/api/lives/${streamId}/end`),

    // --- Manual de Transmissão ---
    getManualTransmissao: () => callApi<{ success: boolean, data: { titulo: string; secoes: Array<{ titulo: string; itens: string[] }> } }>('GET', '/api/manual-transmissao'),

    // --- Live Notifications ---
    startLiveStream: (streamId: string) => callApi<{ success: boolean }>('POST', '/api/lives/start', { streamId }),
    getNotifications: () => callApi<LiveNotification[]>('GET', '/api/notifications'),
    markNotificationRead: (id: string) => callApi<{ success: boolean }>('PATCH', `/api/notifications/${id}/read`),
    getLiveDetails: (liveId: string) => callApi<Streamer>('GET', `/api/lives/${liveId}`),

    // --- Withdrawal via Pix (cash-out) ---
    withdrawViaPix: (userId: string, amount: number, pixKey: string, pixKeyType: string) => {
        return callApi<any>('POST', '/api/withdrawals/pix', { userId, amount, pixKey, pixKeyType });
    },

    // Get withdrawal status
    getWithdrawalStatus: (transferId: string) => {
        return callApi<any>('GET', `/api/withdrawals/status/${transferId}`);
    },

    // Get withdrawal history
    getWithdrawalHistory: (userId: string, limit?: number, offset?: number) => {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());
        const url = `/api/withdrawals/history/${userId}${params.toString() ? '?' + params.toString() : ''}`;
        return callApi<any>('GET', url);
    },

    // --- Zoom Settings ---
    getZoomSettings: (userId: string) => callApi<{ userId: string; zoomLevel: number; isDefault: boolean }>('GET', `/api/zoom/user/${userId}`),
    updateZoomSettings: (userId: string, zoomLevel: number) => callApi<{ success: boolean; zoomSettings: any }>('PUT', `/api/zoom/user/${userId}`, { zoomLevel }),
    resetZoomSettings: (userId: string) => callApi<{ success: boolean; zoomSettings: any }>('POST', `/api/zoom/user/${userId}/reset`),

    // --- User Status (Online/Offline) ---
    getUserStatus: (userId: string) => callApi<{ user_id: string; is_online: boolean; last_seen: string; updated_at: string }>('GET', `/api/user/${userId}/status`),
    setUserOnline: (userId: string) => callApi<{ success: boolean; message: string }>('POST', `/api/user/${userId}/online`),
    setUserOffline: (userId: string) => callApi<{ success: boolean; message: string }>('POST', `/api/user/${userId}/offline`),
    updateUserStatus: (userId: string, isOnline: boolean) => callApi<{ success: boolean; message: string }>('PUT', `/api/user/${userId}/status`, { is_online: isOnline }),
    getOnlineUsers: (limit = 50, offset = 0) => callApi<{ users: Array<{ user_id: string; last_seen: string; updated_at: string }>; total: number; limit: number; offset: number }>('GET', `/api/online?limit=${limit}&offset=${offset}`),
    getStreamOnlineUsers: (streamId: string) => callApi<Array<User & { value: number }>>('GET', `/api/streams/${streamId}/online-users`),
    getBatchUserStatus: (userIds: string[]) => callApi<{ users: Array<{ user_id: string; is_online: boolean; last_seen: string; updated_at: string }>; total: number }>('POST', `/api/batch-status`, { user_ids: userIds }),

    // --- Transaction Protection (Anti-Blocking Abuse) ---
    checkBlockStatus: (userId: string, targetUserId: string) => callApi<{ 
        success: boolean; 
        canBlock: boolean; 
        reason: string; 
        restrictions: string[]; 
        message: string 
    }>('GET', `/api/transaction-protection/check-block-status/${userId}/${targetUserId}`),

    registerBlockAttempt: (userId: string, targetUserId: string, reason?: string, success?: boolean) => callApi<{ success: boolean }>('POST', '/api/transaction-protection/register-block-attempt', { 
        userId, 
        targetUserId, 
        reason, 
        success 
    })
};

export { callApi };
