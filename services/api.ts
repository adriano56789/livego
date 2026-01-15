
import { API_CONFIG } from './config';
import { User, PurchaseRecord, Gift, Streamer, RankedUser, MusicTrack, FeedPhoto } from '@/types';
import { apiTrackerService } from './apiTrackerService';
import { mockData } from './mockData';
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
    console.log(`[MOCK API] ${method} ${endpoint}`, payload);
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400));
    const url = new URL(`http://mock.com${endpoint}`);
    const params = url.searchParams;

    // --- MOCK (New endpoint as requested) ---
    if (endpoint.startsWith('/mock/')) {
        if (endpoint === '/mock/view-history' && method === 'POST') {
            console.log(`[MOCK] Histórico de visualização salvo para streamerId: ${payload.streamerId}`);
            // In a real scenario, you'd find the stream and add it to a history array for the current user.
            return { success: true, message: 'Histórico de visualização mockado com sucesso.' };
        }
    }

    // --- AUTH ---
    if (endpoint.startsWith('/auth/')) {
        if (endpoint === '/auth/login' && method === 'POST') {
            return { user: mockData.currentUser, token: 'fake-jwt-token' };
        }
        if (endpoint === '/auth/register' && method === 'POST') {
            return { success: true };
        }
        if (endpoint === '/auth/logout' && method === 'POST') {
            return { success: true };
        }
        if (endpoint === '/auth/last-email' && method === 'GET') {
            return { email: 'adrianomdk5@gmail.com' };
        }
        if (endpoint === '/auth/save-last-email' && method === 'POST') {
            return { success: true };
        }
    }

    // --- USERS ---
    if (endpoint.startsWith('/users/')) {
        const parts = endpoint.split('/');
        const userId = parts[2];
        const action = parts[3];

        if (endpoint === '/users/me/history') {
            if (method === 'GET') {
                const history = mockData.streams.slice(3, 7).map(s => ({
                    id: s.id, // stream id
                    streamerId: s.hostId,
                    name: s.name,
                    avatar: s.avatar,
                    isLive: Math.random() > 0.5,
                    lastWatchedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
                }));
                return history;
            }
            if (method === 'POST') {
                console.log('[MOCK] Histórico de visualização salvo:', payload);
                return { success: true };
            }
            if (method === 'DELETE') {
                console.log('[MOCK] Histórico de visualização limpo.');
                return { success: true };
            }
        }

        if (userId === 'me') {
            if (method === 'POST') {
                 const updatedUser = { ...mockData.currentUser, ...payload };
                 mockData.currentUser = updatedUser as User;
                 storage.setUser(updatedUser as User);
                 return { success: true, user: updatedUser };
            }
            if (!action) return mockData.currentUser;
            if (action === 'withdrawal-history') {
                 const mockHistory: PurchaseRecord[] = [
                    { id: 'wh-1', userId: 'me', amountBRL: 150.00, status: 'Concluído', type: 'withdrawal', timestamp: new Date(Date.now() - 86400000).toISOString(), description: 'Saque PIX' },
                    { id: 'wh-2', userId: 'me', amountBRL: 200.00, status: 'Pendente', type: 'withdrawal', timestamp: new Date().toISOString(), description: 'Saque PIX' },
                    { id: 'wh-3', userId: 'me', amountBRL: 75.50, status: 'Cancelado', type: 'withdrawal', timestamp: new Date(Date.now() - 172800000).toISOString(), description: 'Saque PIX' },
                ];
                const status = params.get('status');
                if (status && status !== 'Todos') {
                    return mockHistory.filter(item => item.status === status);
                }
                return mockHistory;
            }
            if (action === 'blocklist') {
                 if(method === 'GET') return [mockData.onlineUsers[2]];
                 if(method === 'POST') return { success: true };
            }
             if (action === 'reminders') {
                 if(method === 'GET') return mockData.streams.slice(0, 3).map(s => ({...s, isLive: Math.random() > 0.5}));
                 if(method === 'DELETE') return { success: true };
             }
        }
        if (endpoint.startsWith('/users/search')) {
            const query = params.get('q')?.toLowerCase() || '';
            return mockData.onlineUsers.filter(u => u.name.toLowerCase().includes(query));
        }
        if (endpoint.startsWith('/users/online')) {
            return mockData.onlineUsers;
        }
         // Fallback for /users/:id
        const allUsers = [...mockData.onlineUsers, ...mockData.ranking, mockData.currentUser];
        const foundUser = allUsers.find(u => u.id === userId);
        if(foundUser) return foundUser;
        return { ...mockData.currentUser, id: userId, name: `User ${userId}` };
    }

    // --- STREAMS & LIVE ---
    if (endpoint.startsWith('/streams') || endpoint.startsWith('/live')) {
        if (endpoint.includes('/invite')) {
            const { userId: invitedUserId } = payload;
            const streamId = endpoint.split('/')[2];
            const streamData = mockData.streams.find(s => s.id === streamId);
            const allUsers = [...mockData.onlineUsers, mockData.currentUser];
            const invitedUser = allUsers.find(u => u.id === invitedUserId);
            
            if (streamData && invitedUser) {
                const invitePayload = {
                    fromUser: mockData.currentUser,
                    toUser: invitedUser,
                    streamId: streamId,
                    streamData: { ...streamData, isPrivate: true }
                };
                webSocketManager.emitSimulatedEvent('privateRoomInvite', invitePayload);
            }
            return { success: true };
        }
        if (endpoint === '/streams/categories') return mockData.streamCategories;
        if (endpoint.startsWith('/live/')) {
            const category = url.pathname.split('/')[2];
            if (category === 'popular') return mockData.streams;
            return mockData.streams.filter((s: Streamer) => s.category?.toLowerCase() === category || s.tags.map((t: string) => t.toLowerCase()).includes(category));
        }
        if(endpoint.endsWith('/gift')) {
             const { giftName, amount } = payload;
             const sentGift = mockData.gifts.find((g: Gift) => g.name === giftName);
             if (!sentGift) throw new Error('Presente não encontrado.');
             const totalCost = sentGift.price * (amount || 1);
             if (mockData.currentUser.diamonds < totalCost) throw new Error('Diamantes insuficientes.');
             const updatedSender = { ...mockData.currentUser, diamonds: mockData.currentUser.diamonds - totalCost };
             mockData.currentUser = updatedSender as User;
             storage.setUser(updatedSender as User);
             return { success: true, updatedSender };
        }
        if(endpoint.endsWith('/donors')) return mockData.ranking;
        if(endpoint === '/streams/beauty-settings') {
             return {
                tabs: [{ id: 'basic', label: 'Básico' }, { id: 'filters', label: 'Filtros' }],
                effects: {
                    basic: [{ id: 'smooth', label: 'Suavizar', icon: 'FaceSmoothIcon', defaultValue: 50 }, { id: 'whiten', label: 'Clarear', icon: 'SunIcon', defaultValue: 30 }, { id: 'contrast', label: 'Contraste', icon: 'ContrastIcon', defaultValue: 20 }, { id: 'none', label: 'Nenhum', icon: 'BanIcon', defaultValue: 0 }],
                    filters: [{ id: 'vintage', label: 'Vintage', image: 'https://picsum.photos/seed/vintage/100' }, { id: 'bw', label: 'Preto & Branco', image: 'https://picsum.photos/seed/bw/100' }],
                },
                slider: { label: 'Intensidade' },
                actions: [{ id: 'save', label: 'Salvar' }, { id: 'reset', label: 'Resetar' }]
            };
        }
        // Default success for other stream actions
        return { success: true };
    }

    // --- GIFTS & WALLET & EARNINGS ---
    if (endpoint.startsWith('/gifts') || endpoint.startsWith('/wallet') || endpoint.startsWith('/earnings') || endpoint.startsWith('/mercadopago')) {
        if (endpoint === '/gifts') return mockData.gifts;
        if (endpoint === '/gifts/gallery') return mockData.gifts.slice(0,3).map((g: Gift, i: number) => ({...g, count: (i+1) * 2}));
        if (endpoint === '/wallet/balance') return { diamonds: mockData.currentUser.diamonds, earnings: mockData.currentUser.earnings, userEarnings: { available_diamonds: mockData.currentUser.earnings, gross_brl: (mockData.currentUser.earnings || 0) * 0.05, platform_fee_brl: (mockData.currentUser.earnings || 0) * 0.05 * 0.2, net_brl: (mockData.currentUser.earnings || 0) * 0.05 * 0.8 }};
        if (endpoint === '/wallet/confirm-purchase') {
            mockData.currentUser.diamonds += payload.details.diamonds;
            return [{ success: true, user: mockData.currentUser }];
        }
        if (endpoint === '/mercadopago/create_preference') return { preferenceId: `mp-pref-${Date.now()}` };
        if (endpoint === '/earnings/withdraw/calculate') return { gross_value: payload.amount * 0.05, platform_fee: (payload.amount * 0.05) * 0.2, net_value: (payload.amount * 0.05) * 0.8 };
        if (endpoint === '/earnings/withdraw/request') {
             mockData.currentUser.earnings = (mockData.currentUser.earnings || 0) - payload.amount;
             return { success: true, message: 'Saque solicitado.' };
        }
        // Default success for others
        return { success: true, user: mockData.currentUser };
    }

    // --- ADMIN ---
    if (endpoint.startsWith('/admin/')) {
        if(endpoint === '/admin/withdrawals') return [{ id: 'adm-wh-1', userId: 'admin', amountBRL: 500, status: 'Concluído', type: 'withdrawal', timestamp: new Date().toISOString() }];
        return { success: true };
    }
    
    // --- CHATS ---
    if (endpoint.startsWith('/chats/')) {
        if (endpoint === '/chats/conversations') return mockData.conversations;
        return { success: true };
    }
    
    // --- RANKING & TASKS ---
    if (endpoint.startsWith('/ranking/') || endpoint.startsWith('/tasks/')) {
        if(endpoint.includes('fans')) return mockData.ranking;
        if(endpoint.includes('friends')) return [{ id: 'qf-1', name: 'Amigo Rápido', status: 'pendente' }];
        return mockData.ranking;
    }

    // --- ASSETS ---
    if (endpoint.startsWith('/assets/')) {
        if (endpoint === '/assets/frames') return mockData.frames;
        if (endpoint === '/assets/music') return mockData.music;
    }
    
    // --- SOCIAL / FEED ---
    if (endpoint.startsWith('/feed/') || endpoint.startsWith('/posts')) {
        if (endpoint === '/feed/videos') return [{ ...mockData.streams[0], id: 'post-1', type: 'video', mediaUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', likes: 1234, commentCount: 56, description: 'Test video!', musicTitle: 'Test Music', user: { id: mockData.streams[0].hostId, name: mockData.streams[0].name, avatarUrl: mockData.streams[0].avatar } }];
        if (endpoint.endsWith('/like')) return { success: true };
        if (endpoint.endsWith('/comment')) return { success: true, comment: { id: `c-${Date.now()}`, user: mockData.currentUser, text: payload.text } };
        if (endpoint === '/posts') {
             return { success: true, user: mockData.currentUser, post: { id: `post-${Date.now()}`}};
        }
    }
    
    // --- DB ---
    if (endpoint.startsWith('/db/')) {
        if (endpoint === '/db/required-collections') return ['users', 'gifts', 'streamers', 'transactions', 'conversations', 'messages', 'posts', 'comments', 'likes', 'followers', 'notifications', 'frames', 'music', 'sessions', 'settings', 'reports', 'blocks', 'payouts', 'rankings', 'streamhistories'];
        if (endpoint === '/db/collections') return ['users', 'gifts', 'streamers', 'transactions', 'streamhistories'];
        if (endpoint === '/db/setup') return { success: true, message: 'Banco de dados verificado e sincronizado!' };
    }

    // --- SRS (WebRTC) ---
    if (endpoint.startsWith('/v1/')) {
        if (endpoint === '/v1/rtc/publish') {
            return { code: 0, sdp: `v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=Mock\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio 9000 RTP/AVP 111\r\na=rtpmap:111 opus/48000/2\r\n`, sessionid: `rtc-mock-${Date.now()}` };
        }
        return { success: true, code: 0 };
    }
    
    // --- LIVEKIT (WebRTC) ---
    if (endpoint.startsWith('/livekit/')) {
        if (endpoint.includes('token')) return { token: `lk-token-mock-${Date.now()}`};
        return { success: true, message: "Ação LiveKit simulada."};
    }

    // --- MISC ---
    if(endpoint === '/translate') return { translatedText: `(Traduzido) ${payload.text}`};

    console.warn(`[MOCK API] Unhandled endpoint: ${method} ${endpoint}`);
    return {}; // Default empty response for unhandled cases
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
        if (error.name !== 'AbortError') {
            apiTrackerService.updateLog(logId, { status: 'Error', error: error.message });
        }
        throw error;
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
        inviteToPrivateRoom: (streamId: string, userId: string): Promise<{ success: boolean }> => fetcher('POST', `/streams/${streamId}/invite`, { userId }),
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
    inviteFriendForCoHost: (streamId: string, friendId: string): Promise<{ success: boolean }> => fetcher('POST', `/streams/${streamId}/cohost/invite`, { friendId }),
    translate: (text: string): Promise<{ translatedText: string }> => fetcher('POST', '/translate', { text }),
};

export default api;
