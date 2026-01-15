
import { API_CONFIG } from './config';
import { User, PurchaseRecord, Gift, Streamer, RankedUser, MusicTrack, FeedPhoto } from '../types';
import { apiTrackerService } from './apiTrackerService';
import { webSocketManager } from './websocket';


const USE_MOCK = false; // Forçado para false para garantir operação com backend real
const TOKEN_KEY = '@LiveGo:token';
const USER_KEY = '@LiveGo:user';
const REQUEST_TIMEOUT = 10000; // 10 seconds

export const storage = {
    getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
    setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    getUser: (): User | null => {
        const userJson = localStorage.getItem(USER_KEY);
        try {
            return userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            console.error("Failed to parse user from storage", e);
            return null;
        }
    },
    setUser: (user: User) => {
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    },
    clear: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
};

const handleMockRequest = async (method: string, endpoint: string, payload?: any): Promise<any> => {
    throw new Error('Mock mode is disabled. Please enable USE_MOCK or connect to real backend.');
};

const fetcher = async (method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT', endpoint: string, payload?: any): Promise<any> => {
    if (USE_MOCK) {
        return handleMockRequest(method, endpoint, payload);
    }

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const logId = apiTrackerService.addLog(method, endpoint);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
        apiTrackerService.updateLog(logId, { status: 'Timeout' });
    }, REQUEST_TIMEOUT);

    try {
        const token = storage.getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options: RequestInit = {
            method,
            headers,
            signal: controller.signal,
        };

        if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
            options.body = JSON.stringify(payload);
        }

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        const textResponse = await response.text();
        const responseData = textResponse ? JSON.parse(textResponse) : {};

        apiTrackerService.updateLog(logId, { status: response.ok ? 'Success' : 'Error', statusCode: response.status });

        if (!response.ok) {
            const error = new Error(responseData.error || `Request failed with status ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }
        
        return responseData.data !== undefined ? responseData.data : responseData;
    } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Tratamento melhorado do AbortError
        if (error.name === 'AbortError') {
            // Verificar se foi timeout ou cancelamento manual
            const isTimeout = error.message.includes('timeout') || error.message.includes('Request timeout');
            
            if (isTimeout) {
                apiTrackerService.updateLog(logId, { 
                    status: 'Timeout', 
                    error: 'Request timeout - please check your connection' 
                });
                throw new Error('Request timeout - please check your connection');
            } else {
                // AbortError normal (Ctrl+C, navegação, etc.)
                apiTrackerService.updateLog(logId, { 
                    status: 'Cancelled', 
                    error: 'Request was cancelled by user' 
                });
                throw new Error('Request was cancelled by user');
            }
        } else {
            // Outros erros (rede, servidor, etc.)
            apiTrackerService.updateLog(logId, { 
                status: 'Error', 
                error: error.message || 'Request failed' 
            });
            throw error;
        }
    }
};


export const api = {
    auth: {
        login: (credentials: any): Promise<{ user: User, token: string }> => fetcher('POST', '/auth/login', credentials),
        register: (data: any): Promise<{ success: boolean }> => fetcher('POST', '/auth/register', data),
        logout: () => fetcher('POST', '/auth/logout'),
        getLastEmail: (): Promise<{ email: string }> => fetcher('GET', '/auth/last-email'),
        saveLastEmail: (email: string): Promise<void> => fetcher('POST', '/auth/save-last-email', { email }),
    },
    users: {
        me: (): Promise<User> => fetcher('GET', '/users/me'),
        get: (id: string): Promise<User> => fetcher('GET', `/users/${id}`),
        update: (id: 'me', data: Partial<User>): Promise<{ success: boolean, user: User }> => fetcher('POST', `/users/me`, data),
        getOnlineUsers: (roomId: string): Promise<User[]> => fetcher('GET', `/users/online?roomId=${roomId}`),
        getFansUsers: (id: string): Promise<User[]> => fetcher('GET', `/users/${id}/fans`),
        getFriends: (id: string): Promise<User[]> => fetcher('GET', `/users/${id}/friends`),
        search: (q: string): Promise<User[]> => fetcher('GET', `/users/search?q=${q}`),
        setLanguage: (code: string) => fetcher('POST', '/users/me/language', { code }),
        toggleFollow: (id: string) => fetcher('POST', `/users/${id}/follow`),
        getWithdrawalHistory: (status: string): Promise<PurchaseRecord[]> => fetcher('GET', `/users/me/withdrawal-history?status=${status}`),
        blockUser: (userId: string): Promise<{ success: boolean }> => fetcher('POST', `/users/me/blocklist/${userId}`),
        updateBillingAddress: (address: any) => fetcher('POST', '/users/me/billing-address', address),
        updateCreditCard: (card: any) => fetcher('POST', '/users/me/credit-card', card),
        updateUiSettings: (settings: any) => api.users.update('me', { uiSettings: settings }),
    },
    chats: {
        listConversations: (): Promise<any[]> => fetcher('GET', '/chats/conversations'),
        start: (userId: string) => fetcher('POST', '/chats/start', { userId }),
        sendMessage: (roomId: string, messagePayload: any) => fetcher('POST', `/chats/stream/${roomId}/message`, messagePayload),
    },
    gifts: {
        list: (category?: string): Promise<Gift[]> => fetcher('GET', `/gifts${category ? `?category=${category}` : ''}`),
        getGallery: (): Promise<(Gift & { count: number })[]> => fetcher('GET', '/gifts/gallery'),
        recharge: () => Promise.resolve({ success: true }),
    },
    mercadopago: {
        createPreference: (details: any): Promise<{ preferenceId: string }> => fetcher('POST', '/mercadopago/create_preference', { details }),
    },
    diamonds: {
        getBalance: (userId: string): Promise<any> => fetcher('GET', `/wallet/balance?userId=${userId}`),
        purchase: (userId: string, diamonds: number, price: number): Promise<{ success: boolean, user: User }> => fetcher('POST', `/users/${userId}/purchase`, { diamonds, price }),
    },
    earnings: {
        withdraw: {
            calculate: (amount: number): Promise<any> => fetcher('POST', '/earnings/withdraw/calculate', { amount }),
            request: (amount: number, method?: any): Promise<{ success: boolean; message: string }> => fetcher('POST', '/earnings/withdraw/request', { amount, method }),
            methods: {
                update: (method: string, details: any): Promise<{ success: boolean; user: User }> => fetcher('POST', '/earnings/withdraw/methods', { method, details }),
            },
        },
    },
    admin: {
        getAdminWithdrawalHistory: (): Promise<PurchaseRecord[]> => fetcher('GET', '/admin/withdrawals'),
        withdraw: {
            request: (amount: number): Promise<{ success: boolean }> => fetcher('POST', '/admin/withdrawals/request', { amount }),
        },
        saveAdminWithdrawalMethod: (details: any): Promise<{ success: boolean }> => fetcher('POST', '/admin/withdrawals/method', details),
    },
    streams: {
        listByCategory: (category: string, region: string): Promise<Streamer[]> => fetcher('GET', `/live/${category}?region=${region}`),
        create: (data: Partial<Streamer>): Promise<Streamer> => fetcher('POST', '/streams', data),
        update: (id: string, data: Partial<Streamer>): Promise<{ success: boolean }> => fetcher('PATCH', `/streams/${id}`, data),
        updateVideoQuality: (id: string, quality: string): Promise<{ success: boolean }> => fetcher('PATCH', `/streams/${id}/quality`, { quality }),
        getGiftDonors: (streamId: string): Promise<User[]> => fetcher('GET', `/streams/${streamId}/donors`),
        search: (query: string): Promise<Streamer[]> => fetcher('GET', `/streams/search?q=${query}`),
        inviteToPrivateRoom: (streamId: string, userId: string): Promise<{ success: boolean }> => {
            webSocketManager.emit('privateRoomInvite', { streamId, userId });
            return fetcher('POST', `/streams/${streamId}/invite`, { userId });
        },
        getCategories: (): Promise<{ id: string, label: string }[]> => fetcher('GET', '/streams/categories'),
        getBeautySettings: () => fetcher('GET', '/streams/beauty-settings'),
        saveBeautySettings: (settings: any) => fetcher('POST', '/streams/beauty-settings', settings),
        resetBeautySettings: () => fetcher('POST', '/streams/beauty-settings/reset'),
        applyBeautyEffect: (payload: { effectId: string }) => fetcher('POST', '/streams/beauty-settings/apply', payload),
        logBeautyTabClick: (payload: { tabId: string }) => fetcher('POST', '/streams/beauty-settings/log-tab', payload),
        deleteById: (id: string): Promise<{ success: boolean, message?: string }> => fetcher('DELETE', `/streams/${id}`),
    },
    srs: {
        getVersions: () => fetcher('GET', '/v1/versions'),
        getSummaries: () => fetcher('GET', '/v1/summaries'),
        getFeatures: () => fetcher('GET', '/v1/features'),
        getClients: () => fetcher('GET', '/v1/clients'),
        getClientById: (id: string) => fetcher('GET', `/v1/clients/${id}`),
        getStreams: () => fetcher('GET', '/v1/streams'),
        getStreamById: (id: string) => fetcher('GET', `/v1/streams/${id}`),
        deleteStreamById: (id: string) => fetcher('DELETE', `/v1/streams/${id}`),
        getConnections: () => fetcher('GET', '/v1/connections'),
        getConnectionById: (id: string) => fetcher('GET', `/v1/connections/${id}`),
        deleteConnectionById: (id: string) => fetcher('DELETE', `/v1/connections/${id}`),
        getConfigs: () => fetcher('GET', '/v1/configs'),
        updateConfigs: (config: string) => fetcher('PUT', '/v1/configs', config),
        getMetrics: () => fetcher('GET', '/v1/metrics'),
        rtcPublish: (sdp: string, streamUrl: string) => fetcher('POST', '/v1/rtc/publish', { sdp, streamUrl }),
        trickleIce: (sessionId: string, candidate: any) => fetcher('POST', `/v1/rtc/trickle/${sessionId}`, candidate),
    },
     livekit: {
        token: {
            generate: (userId: string, userName: string) => fetcher('POST', '/livekit/token/generate', { userId, userName }),
        },
        room: {
            list: () => fetcher('GET', '/livekit/rooms'),
            create: (roomId: string) => fetcher('POST', '/livekit/room/create', { roomId }),
            get: (roomId: string) => fetcher('GET', `/livekit/room/${roomId}`),
            delete: (roomId: string) => fetcher('DELETE', `/livekit/room/${roomId}`),
            join: (roomId: string) => Promise.resolve({ simulated: true }), // Ação de cliente
            leave: (roomId: string) => Promise.resolve({ simulated: true }), // Ação de cliente
        },
        participants: {
            list: (roomId: string) => fetcher('GET', `/livekit/room/${roomId}/participants`),
            get: (roomId: string, participantId: string) => fetcher('GET', `/livekit/room/${roomId}/participants/${participantId}`),
            remove: (roomId: string, participantId: string) => fetcher('POST', `/livekit/room/${roomId}/participants/${participantId}/remove`),
            mute: (roomId: string, participantId: string) => fetcher('POST', `/livekit/room/${roomId}/participants/${participantId}/mute`),
            unmute: (roomId: string, participantId: string) => fetcher('POST', `/livekit/room/${roomId}/participants/${participantId}/unmute`),
        },
        tracks: {
            list: (roomId: string) => fetcher('GET', `/livekit/tracks/${roomId}`),
            mute: (roomId: string, trackId: string) => fetcher('POST', `/livekit/tracks/${roomId}/${trackId}/mute`),
            unmute: (roomId: string, trackId: string) => fetcher('POST', `/livekit/tracks/${roomId}/${trackId}/unmute`),
            remove: (roomId: string, trackId: string) => fetcher('DELETE', `/livekit/tracks/${roomId}/${trackId}`),
        },
        record: {
            start: (roomId: string) => fetcher('POST', `/livekit/record/${roomId}/start`),
            stop: (roomId: string) => fetcher('POST', `/livekit/record/${roomId}/stop`),
        },
        ingest: (roomId: string) => fetcher('POST', `/livekit/ingest/${roomId}`),
        monitoring: {
            health: () => fetcher('GET', '/livekit/system/health'),
            info: () => fetcher('GET', '/livekit/system/info'),
            stats: (roomId: string) => fetcher('GET', `/livekit/system/stats?roomId=${roomId}`),
            logs: () => fetcher('GET', '/livekit/system/logs'),
            getConfig: () => fetcher('GET', '/livekit/system/config'),
            updateConfig: (config: string) => fetcher('PUT', '/livekit/system/config', config),
        },
        webhook: {
            register: (url: string) => fetcher('POST', '/livekit/webhook/register', { url }),
            delete: (id: string) => fetcher('DELETE', `/livekit/webhook/${id}`),
        }
    },
    db: {
        checkCollections: (): Promise<string[]> => fetcher('GET', '/db/collections'),
        getRequiredCollections: (): Promise<string[]> => fetcher('GET', '/db/required-collections'),
        setupDatabase: (): Promise<{ success: boolean; message: string }> => fetcher('POST', '/db/setup'),
    },
    getFollowingUsers: (userId: string): Promise<User[]> => fetcher('GET', `/users/${userId}/following`),
    getVisitors: (userId: string): Promise<User[]> => fetcher('GET', `/users/${userId}/visitors`),
    getBlocklist: (): Promise<User[]> => fetcher('GET', `/users/me/blocklist`),
    unblockUser: (userId: string): Promise<{ success: boolean }> => fetcher('POST', `/users/me/blocklist/${userId}/unblock`),
    getStreamHistory: (): Promise<any[]> => fetcher('GET', '/users/me/history'),
    clearStreamHistory: (): Promise<{ success: boolean }> => fetcher('DELETE', '/users/me/history'),
    getReminders: (): Promise<Streamer[]> => fetcher('GET', '/users/me/reminders'),
    removeReminder: (id: string): Promise<{ success: boolean }> => fetcher('DELETE', `/users/me/reminders/${id}`),
    getDailyRanking: (): Promise<RankedUser[]> => fetcher('GET', '/ranking/daily'),
    getWeeklyRanking: (): Promise<RankedUser[]> => fetcher('GET', '/ranking/weekly'),
    getMonthlyRanking: (): Promise<RankedUser[]> => fetcher('GET', '/ranking/monthly'),
    getTopFans: (): Promise<RankedUser[]> => fetcher('GET', '/ranking/top-fans'),
    getQuickCompleteFriends: (): Promise<any[]> => fetcher('GET', '/tasks/quick-friends'),
    completeQuickFriendTask: (friendId: string): Promise<{ success: boolean }> => fetcher('POST', `/tasks/quick-friends/${friendId}/complete`),
    getMusicLibrary: (): Promise<MusicTrack[]> => fetcher('GET', '/assets/music'),
    getAvatarFrames: (): Promise<any[]> => fetcher('GET', '/assets/frames'),
    setActiveFrame: (userId: string, frameId: string): Promise<User> => fetcher('POST', `/users/${userId}/active-frame`, { frameId }),
    createFeedPost: (data: { mediaData: string; type: 'image' | 'video'; caption?: string }): Promise<{ success: boolean; user: User; post: FeedPhoto }> => fetcher('POST', '/posts', data),
    getFeedVideos: (): Promise<FeedPhoto[]> => fetcher('GET', '/feed/videos'),
    likePost: (postId: string): Promise<{ success: boolean }> => fetcher('POST', `/posts/${postId}/like`),
    addComment: (postId: string, text: string): Promise<{ success: boolean; comment: any }> => fetcher('POST', `/posts/${postId}/comment`, { text }),
    sendGift: (fromUserId: string, streamId: string, giftName: string, count: number, targetId: string): Promise<{ success: boolean, updatedSender: User }> => fetcher('POST', `/streams/${streamId}/gift`, { from: fromUserId, giftName, amount: count, toUserId: targetId }),
    sendBackpackGift: (fromUserId: string, streamId: string, giftId: string, count: number, targetId: string): Promise<{ success: boolean, updatedSender: User }> => fetcher('POST', `/streams/${streamId}/backpack-gift`, { from: fromUserId, giftId, amount: count, toUserId: targetId }),
    confirmPurchaseTransaction: (details: any, method: string): Promise<[{ success: boolean; user: User }]> => fetcher('POST', '/wallet/confirm-purchase', { details, method }),
    cancelPurchaseTransaction: () => fetcher('POST', '/wallet/cancel-purchase'),
    kickUser: (roomId: string, userId: string) => fetcher('POST', `/streams/${roomId}/kick`, { userId }),
    makeModerator: (roomId: string, userId: string) => fetcher('POST', `/streams/${roomId}/moderator`, { userId }),
    toggleMicrophone: () => fetcher('POST', '/live/toggle-mic'),
    toggleStreamSound: () => fetcher('POST', '/live/toggle-sound'),
    toggleAutoFollow: () => fetcher('POST', '/live/toggle-autofollow'),
    toggleAutoPrivateInvite: () => fetcher('POST', '/live/toggle-autoinvite'),
    inviteFriendForCoHost: (streamId: string, friendId: string): Promise<{ success: boolean }> => {
            webSocketManager.emit('coHostInvite', { streamId, friendId });
            return fetcher('POST', `/streams/${streamId}/cohost/invite`, { friendId });
        },
    translate: (text: string): Promise<{ translatedText: string }> => fetcher('POST', '/translate', { text }),
};
