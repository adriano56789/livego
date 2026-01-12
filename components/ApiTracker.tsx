import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiTrackerService, LogEntry } from '../services/apiTrackerService';
import { ChevronLeftIcon, TrashIcon, PlayIcon, DatabaseIcon } from './icons';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

interface ApiTrackerProps {
    isVisible: boolean;
    onClose: () => void;
}

interface ScanResult extends LogEntry {
    response?: any;
    paramsSent?: any;
}

interface EndpointDefinition {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    path: string;
    func: (...args: any[]) => Promise<any>;
    params: { name: string; default?: any }[];
    buildPayload?: (p: any) => any;
    collections: string[];
}

// FIX: Export getApiDefinitions function to be used in other components, resolving circular dependency.
export const getApiDefinitions = (): Array<{ group: string, endpoints: EndpointDefinition[] }> => [
    {
        group: 'Auth',
        endpoints: [
            { method: 'POST', path: '/auth/login', func: api.auth.login, params: [{ name: 'email', default: 'admin@livego.com' }, { name: 'password', default: '123' }], buildPayload: (p: any) => ({ email: p.email, password: p.password }), collections: ['users'] },
            { method: 'POST', path: '/auth/register', func: api.auth.register, params: [{ name: 'name', default: 'Tester' }, { name: 'email', default: `test${Date.now()}@test.com` }, { name: 'password', default: '123' }], buildPayload: (p: any) => ({ name: p.name, email: p.email, password: p.password }), collections: ['users'] },
            { method: 'POST', path: '/auth/logout', func: api.auth.logout, params: [], collections: ['users'] },
            { method: 'GET', path: '/auth/last-email', func: api.auth.getLastEmail, params: [], collections: [] },
            { method: 'POST', path: '/auth/save-email', func: api.auth.saveLastEmail, params: [{ name: 'email', default: 'saved@test.com' }], buildPayload: (p: any) => ({ email: p.email }), collections: [] }
        ]
    },
    {
        group: 'Users',
        endpoints: [
            { method: 'GET', path: '/users/me', func: api.users.me, params: [], collections: ['users'] },
            { method: 'GET', path: '/users/:id', func: api.users.get, params: [{ name: 'id', default: '5582931' }], collections: ['users'] },
            { method: 'GET', path: '/users/online', func: api.users.getOnlineUsers, params: [{ name: 'roomId', default: 'global' }], collections: ['users'] },
            { method: 'GET', path: '/users/:id/fans', func: api.users.getFansUsers, params: [{ name: 'id', default: 'me' }], collections: ['users'] },
            { method: 'GET', path: '/users/:id/friends', func: api.users.getFriends, params: [{ name: 'id', default: 'me' }], collections: ['users'] },
            { method: 'GET', path: '/users/search', func: api.users.search, params: [{ name: 'q', default: 'Mirella' }], collections: ['users'] },
            { method: 'POST', path: '/users/me/language', func: api.users.setLanguage, params: [{ name: 'code', default: 'en' }], buildPayload: (p: any) => ({code: p.code}), collections: ['users'] },
            { method: 'POST', path: '/users/:id', func: api.users.update, params: [{ name: 'id', default: 'me' }, { name: 'data', default: '{"bio":"Nova bio de teste"}' }], buildPayload: (p: any) => JSON.parse(p.data), collections: ['users'] },
            { method: 'POST', path: '/users/:id/follow', func: api.users.toggleFollow, params: [{ name: 'id', default: '9928374' }], collections: ['users'] },
            { method: 'GET', path: '/users/me/withdrawal-history', func: api.users.getWithdrawalHistory, params: [{ name: 'status', default: 'Todos' }], collections: ['transactions'] },
            { method: 'POST', path: '/users/me/blocklist/:userId', func: api.users.blockUser, params: [{ name: 'userId', default: '1122334' }], collections: ['users'] },
            // FIX: Corrected api.users.getBlocklist call to use api.getBlocklist as defined in services/api.ts.
            { method: 'GET', path: '/users/me/blocklist', func: api.getBlocklist, params: [], collections: ['users'] },
            // FIX: Corrected api.users.unblockUser call to use api.unblockUser as defined in services/api.ts.
            { method: 'POST', path: '/users/me/blocklist/:userId/unblock', func: api.unblockUser, params: [{ name: 'userId', default: '1122334' }], collections: ['users'] },
            { method: 'GET', path: '/users/:userId/following', func: api.getFollowingUsers, params: [{ name: 'userId', default: 'me' }], collections: ['users'] },
            { method: 'GET', path: '/users/:userId/visitors', func: api.getVisitors, params: [{ name: 'userId', default: 'me' }], collections: ['users'] },
            { method: 'GET', path: '/users/me/history', func: api.getStreamHistory, params: [], collections: [] },
            { method: 'GET', path: '/users/me/reminders', func: api.getReminders, params: [], collections: [] },
            { method: 'DELETE', path: '/users/me/reminders/:id', func: api.removeReminder, params: [{ name: 'id', default: 'rem-1' }], collections: [] },
            { method: 'POST', path: '/users/:userId/active-frame', func: api.setActiveFrame, params: [{ name: 'userId', default: 'me' }, { name: 'frameId', default: 'FrameBlueCrystal' }], buildPayload: (p) => ({ frameId: p.frameId }), collections: ['users'] },
            // FIX: Corrected API call path
            { method: 'POST', path: '/users/me/billing-address', func: api.users.updateBillingAddress, params: [{ name: 'address', default: '{"street":"Test St", "number":"123"}' }], buildPayload: (p) => JSON.parse(p.address), collections: ['users'] },
            // FIX: Corrected API call path
            { method: 'POST', path: '/users/me/credit-card', func: api.users.updateCreditCard, params: [{ name: 'card', default: '{"number":"4242424242424242"}' }], buildPayload: (p) => JSON.parse(p.card), collections: ['users'] }
        ]
    },
    {
        group: 'Chats',
        endpoints: [
            { method: 'GET', path: '/chats/conversations', func: api.chats.listConversations, params: [], collections: ['conversations', 'users'] },
            { method: 'POST', path: '/chats/start', func: api.chats.start, params: [{ name: 'userId', default: '9928374' }], buildPayload: (p: any) => ({ userId: p.userId }), collections: ['conversations', 'users'] }
        ]
    },
    {
        group: 'Gifts & Wallet',
        endpoints: [
            { method: 'GET', path: '/gifts', func: api.gifts.list, params: [{ name: 'category', default: 'Popular' }], collections: ['gifts'] },
            { method: 'GET', path: '/gifts/gallery', func: api.gifts.getGallery, params: [], collections: ['gifts'] },
            { method: 'POST', path: '/presentes/recarregar', func: api.gifts.recharge, params: [], collections: ['users'] },
            { method: 'POST', path: '/gift', func: api.sendGift, params: [{ name: 'from', default: 'me' }, { name: 'streamId', default: '8827364' }, { name: 'giftName', default: 'Rosa' }, { name: 'count', default: 1 }, { name: 'targetId', default: '9928374' }], collections: ['users', 'transactions'] },
            { method: 'GET', path: '/wallet/balance', func: api.diamonds.getBalance, params: [{ name: 'userId', default: 'me' }], collections: ['users'] },
            { method: 'POST', path: '/users/:userId/purchase', func: api.diamonds.purchase, params: [{ name: 'userId', default: 'me' }, { name: 'diamonds', default: 800 }, { name: 'price', default: 7 }], buildPayload: (p) => ({ diamonds: p.diamonds, price: p.price }), collections: ['users', 'transactions'] },
            { method: 'POST', path: '/wallet/confirm-purchase', func: api.confirmPurchaseTransaction, params: [{ name: 'details', default: '{"diamonds":800, "price":7}' }, { name: 'method', default: 'card' }], buildPayload: (p) => ({ details: JSON.parse(p.details), method: p.method }), collections: ['transactions', 'users'] },
            { method: 'POST', path: '/wallet/cancel-purchase', func: api.cancelPurchaseTransaction, params: [], collections: [] }
        ]
    },
    {
        group: 'Earnings & Admin',
        endpoints: [
            { method: 'POST', path: '/earnings/withdraw/calculate', func: api.earnings.withdraw.calculate, params: [{ name: 'amount', default: 10000 }], buildPayload: (p) => ({ amount: p.amount }), collections: ['users'] },
            { method: 'POST', path: '/earnings/withdraw/request', func: api.earnings.withdraw.request, params: [{ name: 'amount', default: 10000 }, { name: 'method', default: '{"method":"pix", "details":{"key":"test@test.com"}}' }], buildPayload: (p) => ({ amount: p.amount, method: JSON.parse(p.method) }), collections: ['users', 'transactions'] },
            { method: 'POST', path: '/earnings/withdraw/methods', func: api.earnings.withdraw.methods.update, params: [{ name: 'method', default: 'pix' }, { name: 'details', default: '{"key":"new@test.com"}' }], collections: ['users'] },
            { method: 'GET', path: '/admin/withdrawals', func: api.admin.getAdminWithdrawalHistory, params: [], collections: ['transactions'] },
            { method: 'POST', path: '/admin/withdrawals/request', func: api.admin.withdraw.request, params: [{ name: 'amount', default: 100 }], buildPayload: (p) => ({ amount: p.amount }), collections: ['transactions', 'users'] },
            { method: 'POST', path: '/admin/withdrawals/method', func: api.admin.saveAdminWithdrawalMethod, params: [{ name: 'details', default: '{"type":"email", "email":"admin@livego.com"}' }], buildPayload: (p) => JSON.parse(p.details), collections: ['users'] }
        ]
    },
    {
        group: 'Streams & Live',
        endpoints: [
            { method: 'GET', path: '/live/:category', func: api.streams.listByCategory, params: [{ name: 'category', default: 'popular' }, { name: 'region', default: 'global' }], collections: ['streamers'] },
            { method: 'POST', path: '/streams', func: api.streams.create, params: [{ name: 'data', default: '{"name":"Live de Teste", "hostId":"me"}' }], buildPayload: (p: any) => JSON.parse(p.data), collections: ['streamers', 'users'] },
            { method: 'PATCH', path: '/streams/:id', func: api.streams.update, params: [{ name: 'id', default: '8827364' }, { name: 'data', default: '{"isPrivate":true}' }], buildPayload: (p) => JSON.parse(p.data), collections: ['streamers'] },
            { method: 'PATCH', path: '/streams/:id/quality', func: api.streams.updateVideoQuality, params: [{ name: 'id', default: '8827364' }, { name: 'quality', default: '1080p' }], buildPayload: (p) => ({ quality: p.quality }), collections: ['streamers'] },
            { method: 'GET', path: '/streams/:streamId/donors', func: api.streams.getGiftDonors, params: [{ name: 'streamId', default: '8827364' }], collections: ['users'] },
            { method: 'GET', path: '/streams/search', func: api.streams.search, params: [{ name: 'q', default: 'Live' }], collections: ['streamers'] },
            { method: 'POST', path: '/streams/:streamId/invite', func: api.streams.inviteToPrivateRoom, params: [{ name: 'streamId', default: '8827364' }, { name: 'userId', default: '3456754' }], buildPayload: (p) => ({ userId: p.userId }), collections: [] },
            { method: 'POST', path: '/streams/:streamId/cohost/invite', func: api.inviteFriendForCoHost, params: [{ name: 'streamId', default: '8827364' }, { name: 'friendId', default: '8827361' }], buildPayload: (p) => ({ friendId: p.friendId }), collections: [] },
            { method: 'POST', path: '/streams/:r/kick', func: api.kickUser, params: [{ name: 'r', default: '8827364' }, { name: 'u', default: '3456754' }], buildPayload: (p) => ({ userId: p.u }), collections: [] },
            { method: 'POST', path: '/streams/:r/moderator', func: api.makeModerator, params: [{ name: 'r', default: '8827364' }, { name: 'u', default: '3456754' }], buildPayload: (p) => ({ userId: p.u }), collections: [] },
            { method: 'GET', path: '/streams/beauty-settings', func: api.streams.getBeautySettings, params: [], collections: [] },
            { method: 'POST', path: '/streams/beauty-settings', func: api.streams.saveBeautySettings, params: [{ name: 'settings', default: '{"smooth": 50}' }], buildPayload: (p) => JSON.parse(p.settings), collections: [] },
            { method: 'POST', path: '/streams/beauty-settings/reset', func: api.streams.resetBeautySettings, params: [], collections: [] },
            { method: 'POST', path: '/live/toggle-mic', func: api.toggleMicrophone, params: [], collections: [] },
            { method: 'POST', path: '/live/toggle-sound', func: api.toggleStreamSound, params: [], collections: [] },
            { method: 'POST', path: '/live/toggle-autofollow', func: api.toggleAutoFollow, params: [], collections: [] },
            { method: 'POST', path: '/live/toggle-autoinvite', func: api.toggleAutoPrivateInvite, params: [], collections: [] }
        ]
    },
    {
        group: 'Assets & Misc',
        endpoints: [
            { method: 'GET', path: '/ranking/daily', func: api.getDailyRanking, params: [], collections: ['users'] },
            { method: 'GET', path: '/ranking/weekly', func: api.getWeeklyRanking, params: [], collections: ['users'] },
            { method: 'GET', path: '/ranking/monthly', func: api.getMonthlyRanking, params: [], collections: ['users'] },
            { method: 'GET', path: '/ranking/top-fans', func: api.getTopFans, params: [], collections: ['users'] },
            { method: 'GET', path: '/tasks/quick-friends', func: api.getQuickCompleteFriends, params: [], collections: ['users'] },
            { method: 'POST', path: '/tasks/quick-friends/:friendId/complete', func: api.completeQuickFriendTask, params: [{ name: 'friendId', default: 'qf1' }], collections: [] },
            { method: 'GET', path: '/assets/music', func: api.getMusicLibrary, params: [], collections: ['music'] },
            { method: 'GET', path: '/assets/frames', func: api.getAvatarFrames, params: [], collections: ['frames'] },
            { method: 'POST', path: '/posts', func: api.createFeedPost, params: [{ name: 'data', default: '{"type":"image", "mediaData":"base64..."}' }], buildPayload: (p) => JSON.parse(p.data), collections: ['users', 'posts'] },
            { method: 'POST', path: '/translate', func: api.translate, params: [{ name: 'text', default: 'hello world' }], buildPayload: (p) => ({ text: p.text }), collections: [] }
        ]
    },
    {
        group: 'Database',
        endpoints: [
            { method: 'GET', path: '/db/collections', func: api.db.checkCollections, params: [], collections: ['*'] },
            { method: 'POST', path: '/db/setup', func: api.db.setupDatabase, params: [{ name: 'collections', default: '["users", "gifts"]' }], buildPayload: (p) => ({ collections: JSON.parse(p.collections) }), collections: ['*'] }
        ]
    },
    {
        group: 'SRS (Streaming)',
        endpoints: [
            { method: 'GET', path: '/v1/versions', func: api.srs.getVersions, params: [], collections: [] },
            { method: 'GET', path: '/v1/summaries', func: api.srs.getSummaries, params: [], collections: [] },
            { method: 'GET', path: '/v1/features', func: api.srs.getFeatures, params: [], collections: [] },
            { method: 'GET', path: '/v1/clients', func: api.srs.getClients, params: [], collections: [] },
            { method: 'GET', path: '/v1/clients/:id', func: api.srs.getClientById, params: [{ name: 'id', default: 'cli_xyz789' }], collections: [] },
            { method: 'GET', path: '/v1/streams', func: api.srs.getStreams, params: [], collections: [] },
            { method: 'GET', path: '/v1/streams/:id', func: api.srs.getStreamById, params: [{ name: 'id', default: 'str_abc123' }], collections: [] },
            { method: 'DELETE', path: '/v1/streams/:id', func: api.srs.deleteStreamById, params: [{ name: 'id', default: 'str_abc123' }], collections: [] },
            { method: 'GET', path: '/v1/connections', func: api.srs.getConnections, params: [], collections: [] },
            { method: 'GET', path: '/v1/connections/:id', func: api.srs.getConnectionById, params: [{ name: 'id', default: 'cli_xyz789' }], collections: [] },
            { method: 'DELETE', path: '/v1/connections/:id', func: api.srs.deleteConnectionById, params: [{ name: 'id', default: 'cli_xyz789' }], collections: [] },
            { method: 'GET', path: '/v1/configs', func: api.srs.getConfigs, params: [], collections: [] },
            { method: 'PUT', path: '/v1/configs', func: api.srs.updateConfigs, params: [{ name: 'config', default: 'vhost __defaultVhost__ {}' }], buildPayload: (p: any) => p.config, collections: [] },
            { method: 'GET', path: '/v1/metrics', func: api.srs.getMetrics, params: [], collections: [] },
            { method: 'POST', path: '/v1/rtc/publish', func: api.srs.rtcPublish, params: [{ name: 'sdp', default: 'v=0...' }, { name: 'streamUrl', default: 'webrtc://test/live/test' }], buildPayload: (p) => ({ sdp: p.sdp, streamUrl: p.streamUrl }), collections: [] },
            { method: 'POST', path: '/v1/rtc/trickle/:sessionId', func: api.srs.trickleIce, params: [{ name: 'sessionId', default: 'rtc-session-123' }, { name: 'candidate', default: '{"candidate":"..."}' }], buildPayload: (p) => JSON.parse(p.candidate), collections: [] }
        ]
    },
    {
        group: 'LiveKit (WebRTC)',
        endpoints: [
            { method: 'POST', path: '/livekit/token/generate', func: api.livekit.token.generate, params: [{ name: 'userId', default: 'user-123' }, { name: 'userName', default: 'Test User' }], buildPayload: (p) => ({ userId: p.userId, userName: p.userName }), collections: [] },
            { method: 'GET', path: '/livekit/rooms', func: api.livekit.room.list, params: [], collections: [] },
            { method: 'POST', path: '/livekit/room/create', func: api.livekit.room.create, params: [{ name: 'roomId', default: `test-room-${Date.now()}` }], buildPayload: (p) => ({ roomId: p.roomId }), collections: [] },
            { method: 'GET', path: '/livekit/room/:roomId', func: api.livekit.room.get, params: [{ name: 'roomId', default: 'minha-sala-teste' }], collections: [] },
            { method: 'DELETE', path: '/livekit/room/:roomId', func: api.livekit.room.delete, params: [{ name: 'roomId', default: 'test-room' }], collections: [] },
            { method: 'GET', path: '/livekit/room/:roomId/participants', func: api.livekit.participants.list, params: [{ name: 'roomId', default: 'minha-sala-teste' }], collections: [] },
            { method: 'GET', path: '/livekit/room/:roomId/participants/:participantId', func: api.livekit.participants.get, params: [{ name: 'roomId', default: 'minha-sala-teste' }, { name: 'participantId', default: 'participante-exemplo' }], collections: [] },
            { method: 'POST', path: '/livekit/room/:roomId/participants/:participantId/remove', func: api.livekit.participants.remove, params: [{ name: 'roomId', default: 'minha-sala-teste' }, { name: 'participantId', default: 'participante-exemplo' }], collections: [] },
            { method: 'POST', path: '/livekit/room/:roomId/participants/:participantId/mute', func: api.livekit.participants.mute, params: [{ name: 'roomId', default: 'minha-sala-teste' }, { name: 'participantId', default: 'participante-exemplo' }], collections: [] },
            { method: 'POST', path: '/livekit/room/:roomId/participants/:participantId/unmute', func: api.livekit.participants.unmute, params: [{ name: 'roomId', default: 'minha-sala-teste' }, { name: 'participantId', default: 'participante-exemplo' }], collections: [] },
            { method: 'GET', path: '/livekit/tracks/:roomId', func: api.livekit.tracks.list, params: [{ name: 'roomId', default: 'minha-sala-teste' }], collections: [] },
            { method: 'POST', path: '/livekit/tracks/:roomId/:trackId/mute', func: api.livekit.tracks.mute, params: [{ name: 'roomId', default: 'minha-sala-teste' }, { name: 'trackId', default: 'TR_audio123' }], collections: [] },
            { method: 'POST', path: '/livekit/tracks/:roomId/:trackId/unmute', func: api.livekit.tracks.unmute, params: [{ name: 'roomId', default: 'minha-sala-teste' }, { name: 'trackId', default: 'TR_audio123' }], collections: [] },
            { method: 'DELETE', path: '/livekit/tracks/:roomId/:trackId', func: api.livekit.tracks.remove, params: [{ name: 'roomId', default: 'minha-sala-teste' }, { name: 'trackId', default: 'TR_audio123' }], collections: [] },
            { method: 'POST', path: '/livekit/record/:roomId/start', func: api.livekit.record.start, params: [{ name: 'roomId', default: 'minha-sala-teste' }], collections: [] },
            { method: 'POST', path: '/livekit/record/:roomId/stop', func: api.livekit.record.stop, params: [{ name: 'roomId', default: 'minha-sala-teste' }], collections: [] },
            { method: 'POST', path: '/livekit/ingest/:roomId', func: api.livekit.ingest, params: [{ name: 'roomId', default: 'minha-sala-teste' }], collections: [] },
            { method: 'GET', path: '/livekit/system/health', func: api.livekit.monitoring.health, params: [], collections: [] },
            { method: 'GET', path: '/livekit/system/info', func: api.livekit.monitoring.info, params: [], collections: [] },
            { method: 'GET', path: '/livekit/system/stats', func: api.livekit.monitoring.stats, params: [{ name: 'roomId', default: 'minha-sala-teste' }], collections: [] },
            { method: 'GET', path: '/livekit/system/logs', func: api.livekit.monitoring.logs, params: [], collections: [] },
            { method: 'GET', path: '/livekit/system/config', func: api.livekit.monitoring.getConfig, params: [], collections: [] },
            { method: 'PUT', path: '/livekit/system/config', func: api.livekit.monitoring.updateConfig, params: [{ name: 'config', default: '{"rtc": {"port": 7882}}' }], buildPayload: (p) => JSON.parse(p.config), collections: [] },
            { method: 'POST', path: '/livekit/webhook/register', func: api.livekit.webhook.register, params: [{ name: 'url', default: 'https://example.com/webhook' }], buildPayload: (p) => ({ url: p.url }), collections: [] },
            { method: 'DELETE', path: '/livekit/webhook/:id', func: api.livekit.webhook.delete, params: [{ name: 'id', default: 'wh_abc' }], collections: [] },
        ]
    }
];

const getEndpointKey = (endpoint: EndpointDefinition) => `${endpoint.method}-${endpoint.path}`;

const PostmanResult: React.FC<{ result: ScanResult }> = ({ result }) => {
    const statusColor = result.status === 'Success' ? 'text-green-400' : 'text-red-400';
    return (
        <div className="mt-3 bg-black/40 font-mono text-xs space-y-3 p-4">
            <div className="flex justify-between items-center text-gray-400 text-[10px]">
                <span className={`font-bold ${statusColor}`}>STATUS: {result.status.toUpperCase()}{result.statusCode ? ` (${result.statusCode})` : ''}</span>
                <span>DURAÇÃO: {result.duration}ms</span>
            </div>
            {result.paramsSent && Object.keys(result.paramsSent).length > 0 && (
                <div>
                    <h4 className="font-bold text-gray-500 text-[9px] uppercase tracking-wider">Parâmetros</h4>
                    <pre className="text-gray-300 bg-black/30 p-2 rounded mt-1 text-[10px] whitespace-pre-wrap">{JSON.stringify(result.paramsSent, null, 2)}</pre>
                </div>
            )}
            <div>
                <h4 className="font-bold text-gray-500 text-[9px] uppercase tracking-wider">Resposta</h4>
                <pre className={`${statusColor} bg-black/30 p-2 rounded mt-1 text-[10px] whitespace-pre-wrap`}>
                    {result.status === 'Success' ? JSON.stringify(result.response, null, 2) : result.error}
                </pre>
            </div>
        </div>
    );
};

const LogItem: React.FC<{ log: LogEntry }> = ({ log }) => {
    const statusColor = useMemo(() => {
        switch(log.status) {
            case 'Success': return 'text-green-400';
            case 'Error': return 'text-red-400';
            case 'Timeout': return 'text-yellow-400';
            default: return 'text-gray-500 animate-pulse';
        }
    }, [log.status]);

    return (
        <div className="border-b border-white/5 last:border-b-0">
            <div className={`flex items-center justify-between py-2.5 px-3 text-xs font-mono`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`font-bold w-10 text-center ${log.method === 'GET' ? 'text-blue-400' : 'text-orange-400'}`}>{log.method}</span>
                    <span className="text-gray-300 truncate">{log.endpoint}</span>
                </div>
                <div className="flex items-center gap-4 pl-4">
                    <span className={`${statusColor} font-bold w-24 text-left`}>{log.status}{log.statusCode ? ` (${log.statusCode})` : ''}</span>
                    <span className="text-gray-500 w-16 text-right">{log.duration ? `${log.duration}ms` : '...'}</span>
                </div>
            </div>
        </div>
    );
};


const ApiTracker: React.FC<ApiTrackerProps> = ({ isVisible, onClose }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [failures, setFailures] = useState<LogEntry[]>([]);
    const [activeTab, setActiveTab] = useState('Executar Teste');
    const API_DEFINITIONS = getApiDefinitions();

    const [isFullScanning, setIsFullScanning] = useState(false);
    const [resultsMap, setResultsMap] = useState<Map<string, ScanResult>>(new Map());
    const [scanStats, setScanStats] = useState({ success: 0, error: 0, total: 0 });

    const tabs = ['Executar Teste', 'Resultados', 'Logs', 'Falhas'];

    useEffect(() => {
        if (!isVisible) return;
        const unsubscribeLogs = apiTrackerService.subscribe(setLogs);
        const unsubscribeFailures = apiTrackerService.subscribeToFailures(setFailures);
        return () => {
            unsubscribeLogs();
            unsubscribeFailures();
        };
    }, [isVisible]);
    
    const handleRunFullScan = async () => {
        apiTrackerService.clearLogs();
        setIsFullScanning(true);
        setActiveTab('Resultados');
        setResultsMap(new Map());
        setScanStats({ success: 0, error: 0, total: 0 });

        const allEndpoints = API_DEFINITIONS.flatMap(group => group.endpoints);
        setScanStats(prev => ({ ...prev, total: allEndpoints.length }));

        for (const endpoint of allEndpoints) {
            const key = getEndpointKey(endpoint);
            const startTime = Date.now();
            
            const resultEntry: Partial<ScanResult> = {
                id: key,
                method: endpoint.method,
                endpoint: endpoint.path,
                startTime
            };

            try {
                const defaultParams: Record<string, any> = {};
                endpoint.params.forEach(p => { defaultParams[p.name] = p.default ?? ''; });
                resultEntry.paramsSent = defaultParams;
                const args = endpoint.params.map(p => defaultParams[p.name]);
                
                let response;
                if (endpoint.buildPayload) {
                    const payload = endpoint.buildPayload(defaultParams);
                    resultEntry.paramsSent = payload;
                    const finalArgs = endpoint.func.length === 1 ? [payload] : [args[0], payload];
                    response = await endpoint.func(...finalArgs);
                } else {
                    response = await endpoint.func(...args);
                }
                
                resultEntry.status = 'Success';
                resultEntry.response = response;
                setScanStats(prev => ({ ...prev, success: prev.success + 1 }));

            } catch (error: any) {
                resultEntry.status = 'Error';
                resultEntry.error = (error as Error).message || 'Unknown Error';
                if(error.status) resultEntry.statusCode = error.status;
                setScanStats(prev => ({ ...prev, error: prev.error + 1 }));
            } finally {
                resultEntry.duration = Date.now() - startTime;
                setResultsMap(prev => new Map(prev).set(key, resultEntry as ScanResult));
            }
        }
        setIsFullScanning(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-[#121212] flex flex-col font-sans animate-in fade-in duration-300">
            <header className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1C1C1E] shrink-0">
                <button onClick={onClose}><ChevronLeftIcon className="w-6 h-6 text-white" /></button>
                <h1 className="text-white font-bold text-lg">LiveGo API Monitor</h1>
                <div className="w-6"></div>
            </header>
            <div className="flex p-2 bg-[#1C1C1E] border-b border-white/10 shrink-0">
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>{tab}</button>
                ))}
            </div>

            {activeTab === 'Executar Teste' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#121212]">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-6 shadow-2xl shadow-purple-900/30">
                        <DatabaseIcon className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Verificador de Integridade da API</h2>
                    <p className="text-gray-400 max-w-sm mb-8 text-sm">
                        Execute um teste completo em todos os {API_DEFINITIONS.flatMap(g => g.endpoints).length} endpoints para garantir que a API está operando corretamente.
                    </p>
                    <button 
                        onClick={handleRunFullScan} 
                        disabled={isFullScanning} 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-3 shadow-lg shadow-purple-900/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <PlayIcon className="w-6 h-6" />
                        EXECUTAR TESTE COMPLETO
                    </button>
                </div>
            )}

            {activeTab === 'Resultados' && (
                <div className="flex-1 flex flex-col overflow-hidden bg-[#121212]">
                    {(isFullScanning || resultsMap.size > 0) && (
                        <div className="px-4 py-3 bg-[#1C1C1E] border-b border-white/10 shrink-0 z-10">
                            <div className="flex items-center gap-4 text-sm font-medium p-3 bg-black/30 rounded-lg border border-white/10">
                                <span className="text-green-400">Sucesso: {scanStats.success}</span>
                                <span className="text-red-400">Falhas: {scanStats.error}</span>
                                <span className="text-gray-400">Total: {scanStats.success + scanStats.error} / {scanStats.total}</span>
                                {isFullScanning && <div className="ml-auto"><LoadingSpinner /></div>}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex-1 overflow-y-auto">
                       {resultsMap.size === 0 && !isFullScanning ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-8">
                                <DatabaseIcon className="w-16 h-16 mb-4 opacity-20" />
                                <h3 className="font-bold text-base text-gray-400">Nenhum resultado</h3>
                                <p className="text-xs mt-1">Vá para a aba "Executar Teste" para iniciar uma verificação.</p>
                            </div>
                       ) : (
                        API_DEFINITIONS.map(group => (
                           <div key={group.group}>
                               <h4 className="font-bold text-sm text-purple-300 bg-black/40 px-4 py-2 sticky top-0 z-10 border-y border-white/10">{group.group}</h4>
                               <div className="divide-y divide-white/5">
                                   {group.endpoints.map(endpoint => {
                                       const key = getEndpointKey(endpoint);
                                       const result = resultsMap.get(key);
                                       return (
                                           <div key={key}>
                                               <div className="px-4 py-3 flex items-center text-sm">
                                                    <span className={`font-bold w-12 text-center ${endpoint.method === 'GET' ? 'text-blue-400' : 'text-orange-400'}`}>{endpoint.method}</span>
                                                    <span className="text-gray-300">{endpoint.path}</span>
                                               </div>
                                               {result && <PostmanResult result={result} />}
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                       )))}
                    </div>
                </div>
            )}
            
            {activeTab === 'Logs' && (
                <div className="flex-1 flex flex-col overflow-hidden bg-[#121212]">
                    <div className="flex justify-end p-2 border-b border-white/10 sticky top-0 bg-[#1C1C1E] shrink-0"><button onClick={() => apiTrackerService.clearLogs()} className="text-xs text-gray-500 flex items-center gap-1"><TrashIcon className="w-3 h-3"/> Limpar Logs</button></div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="bg-[#1C1C1E] border-y border-white/10">
                            {logs.map(log => <LogItem key={log.id} log={log} />)}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'Falhas' && (
                 <div className="flex-1 flex flex-col overflow-hidden bg-[#121212]">
                    <div className="flex justify-end p-2 border-b border-white/10 sticky top-0 bg-[#1C1C1E] shrink-0"><button onClick={() => apiTrackerService.clearFailures()} className="text-xs text-gray-500 flex items-center gap-1"><TrashIcon className="w-3 h-3"/> Limpar Falhas</button></div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="bg-[#1C1C1E] border-y border-white/10">
                            {failures.map(log => <LogItem key={log.id} log={log} />)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiTracker;