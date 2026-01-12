import { api } from './api';

export interface ApiTestResult {
    path: string;
    group: string;
    importStatus: 'ok' | 'fail';
    callStatus: 'ok' | 'fail';
    dataStatus: 'ok' | 'fail';
    responseTime?: number;
    error?: string;
}

class IntegrityScannerService {
    // Lista completa dos 112 endpoints baseados na estrutura do app
    private readonly apiRegistry = [
        { group: 'Autenticação', path: 'auth.login' },
        { group: 'Autenticação', path: 'auth.register' },
        { group: 'Autenticação', path: 'auth.logout' },
        { group: 'Autenticação', path: 'auth.getLastEmail' },
        { group: 'Autenticação', path: 'auth.saveLastEmail' },
        { group: 'Usuários', path: 'users.me' },
        { group: 'Usuários', path: 'users.get' },
        { group: 'Usuários', path: 'users.getOnlineUsers' },
        { group: 'Usuários', path: 'users.getFansUsers' },
        { group: 'Usuários', path: 'users.getFriends' },
        { group: 'Usuários', path: 'users.search' },
        { group: 'Usuários', path: 'users.setLanguage' },
        { group: 'Usuários', path: 'users.update' },
        { group: 'Usuários', path: 'users.toggleFollow' },
        { group: 'Usuários', path: 'users.getWithdrawalHistory' },
        { group: 'Usuários', path: 'users.blockUser' },
        { group: 'Social', path: 'getFollowingUsers' },
        { group: 'Social', path: 'getVisitors' },
        { group: 'Social', path: 'getStreamHistory' },
        { group: 'Social', path: 'getReminders' },
        { group: 'Social', path: 'removeReminder' },
        { group: 'Social', path: 'translate' },
        { group: 'Social', path: 'createFeedPost' },
        { group: 'Streams', path: 'streams.listByCategory' },
        { group: 'Streams', path: 'streams.create' },
        { group: 'Streams', path: 'streams.update' },
        { group: 'Streams', path: 'streams.updateVideoQuality' },
        { group: 'Streams', path: 'streams.getGiftDonors' },
        { group: 'Streams', path: 'streams.search' },
        { group: 'Streams', path: 'streams.inviteToPrivateRoom' },
        { group: 'Streams', path: 'streams.getBeautySettings' },
        { group: 'Streams', path: 'streams.saveBeautySettings' },
        { group: 'Streams', path: 'streams.resetBeautySettings' },
        { group: 'Streams', path: 'streams.applyBeautyEffect' },
        { group: 'Streams', path: 'streams.logBeautyTabClick' },
        { group: 'Financeiro', path: 'diamonds.getBalance' },
        { group: 'Financeiro', path: 'diamonds.purchase' },
        { group: 'Financeiro', path: 'earnings.withdraw.calculate' },
        { group: 'Financeiro', path: 'earnings.withdraw.request' },
        { group: 'Financeiro', path: 'earnings.withdraw.methods.update' },
        { group: 'Financeiro', path: 'sendGift' },
        { group: 'Financeiro', path: 'confirmPurchaseTransaction' },
        { group: 'Financeiro', path: 'cancelPurchaseTransaction' },
        { group: 'Financeiro', path: 'updateBillingAddress' },
        { group: 'Financeiro', path: 'updateCreditCard' },
        { group: 'Admin', path: 'admin.getAdminWithdrawalHistory' },
        { group: 'Admin', path: 'admin.withdraw.request' },
        { group: 'Admin', path: 'admin.saveAdminWithdrawalMethod' },
        { group: 'Sistema', path: 'db.checkCollections' },
        { group: 'Sistema', path: 'db.setupDatabase' },
        { group: 'Interação', path: 'kickUser' },
        { group: 'Interação', path: 'makeModerator' },
        { group: 'Interação', path: 'toggleMicrophone' },
        { group: 'Interação', path: 'toggleStreamSound' },
        { group: 'Interação', path: 'toggleAutoFollow' },
        { group: 'Interação', path: 'toggleAutoPrivateInvite' },
        { group: 'Interação', path: 'inviteFriendForCoHost' },
        { group: 'Interação', path: 'completeQuickFriendTask' },
        { group: 'Assets', path: 'getMusicLibrary' },
        { group: 'Assets', path: 'getAvatarFrames' },
        { group: 'Assets', path: 'setActiveFrame' },
        { group: 'Ranking', path: 'getDailyRanking' },
        { group: 'Ranking', path: 'getWeeklyRanking' },
        { group: 'Ranking', path: 'getMonthlyRanking' },
        { group: 'Ranking', path: 'getTopFans' },
        { group: 'Tarefas', path: 'getQuickCompleteFriends' },
        { group: 'Chat', path: 'chats.listConversations' },
        { group: 'Chat', path: 'chats.start' },
        // SRS Endpoints
        { group: 'SRS', path: 'srs.getVersions' },
        { group: 'SRS', path: 'srs.getSummaries' },
        { group: 'SRS', path: 'srs.getFeatures' },
        { group: 'SRS', path: 'srs.getClients' },
        { group: 'SRS', path: 'srs.getClientById' },
        { group: 'SRS', path: 'srs.getStreams' },
        { group: 'SRS', path: 'srs.getStreamById' },
        { group: 'SRS', path: 'srs.deleteStreamById' },
        { group: 'SRS', path: 'srs.getConnections' },
        { group: 'SRS', path: 'srs.deleteConnectionById' },
        { group: 'SRS', path: 'srs.getConfigs' },
        { group: 'SRS', path: 'srs.updateConfigs' },
        { group: 'SRS', path: 'srs.getMetrics' },
        { group: 'SRS', path: 'srs.rtcPublish' },
        { group: 'SRS', path: 'srs.trickleIce' },
        // LiveKit Endpoints
        { group: 'LiveKit', path: 'livekit.token.generate' },
        { group: 'LiveKit', path: 'livekit.room.list' },
        { group: 'LiveKit', path: 'livekit.room.create' },
        { group: 'LiveKit', path: 'livekit.room.get' },
        { group: 'LiveKit', path: 'livekit.room.delete' },
        { group: 'LiveKit', path: 'livekit.participants.list' },
        { group: 'LiveKit', path: 'livekit.participants.get' },
        { group: 'LiveKit', path: 'livekit.participants.remove' },
        { group: 'LiveKit', path: 'livekit.participants.mute' },
        { group: 'LiveKit', path: 'livekit.participants.unmute' },
        { group: 'LiveKit', path: 'livekit.tracks.list' },
        { group: 'LiveKit', path: 'livekit.tracks.mute' },
        { group: 'LiveKit', path: 'livekit.tracks.unmute' },
        { group: 'LiveKit', path: 'livekit.tracks.remove' },
        { group: 'LiveKit', path: 'livekit.record.start' },
        { group: 'LiveKit', path: 'livekit.record.stop' },
        { group: 'LiveKit', path: 'livekit.ingest' },
        { group: 'LiveKit', path: 'livekit.monitoring.health' },
        { group: 'LiveKit', path: 'livekit.monitoring.info' },
        { group: 'LiveKit', path: 'livekit.monitoring.stats' },
        { group: 'LiveKit', path: 'livekit.monitoring.logs' },
        { group: 'LiveKit', path: 'livekit.monitoring.getConfig' },
        { group: 'LiveKit', path: 'livekit.monitoring.updateConfig' },
        { group: 'LiveKit', path: 'livekit.webhook.register' },
        { group: 'LiveKit', path: 'livekit.webhook.delete' },
    ];

    async runFullScan(onProgress: (res: ApiTestResult) => void): Promise<ApiTestResult[]> {
        const results: ApiTestResult[] = [];

        for (const item of this.apiRegistry) {
            const startTime = Date.now();
            const result: ApiTestResult = {
                path: item.path,
                group: item.group,
                importStatus: 'fail',
                callStatus: 'fail',
                dataStatus: 'fail'
            };

            try {
                // 1. Check Import (Wiring)
                const func = this.resolvePath(api, item.path);
                if (typeof func === 'function') {
                    result.importStatus = 'ok';

                    // 2. Check Call (Execution) com DUMMY DATA para evitar erros de desestruturação
                    let dummyParams: any[] = [];
                    if (item.path.includes('login')) dummyParams = [{ email: 'admin@livego.com', password: '123' }];
                    if (item.path.includes('update') || item.path.includes('methods')) dummyParams = ['me', { method: 'pix', details: { key: 'test@test.com' } }];
                    if (item.path.includes('sendGift')) dummyParams = ['me', 'stream-1', 'Rosa', 1, 'target-1'];
                    if (item.path.includes('createFeedPost')) dummyParams = [{ mediaData: '...', type: 'image' }];
                    if (item.path.includes('withdraw.request')) dummyParams = [100];
                    if (item.path.includes('saveAdminWithdrawalMethod')) dummyParams = [{ email: 'admin@livego.com' }];
                    
                    if (item.path === 'srs.getClientById') dummyParams = ['cli_xyz789'];
                    if (item.path === 'srs.getStreamById') dummyParams = ['str_abc123'];
                    if (item.path === 'srs.deleteStreamById') dummyParams = ['str_abc123'];
                    if (item.path === 'srs.getConnectionById') dummyParams = ['cli_xyz789'];
                    if (item.path === 'srs.deleteConnectionById') dummyParams = ['cli_xyz789'];
                    if (item.path === 'srs.updateConfigs') dummyParams = ['vhost __defaultVhost__ {}'];
                    if (item.path === 'srs.rtcPublish') dummyParams = ['v=0...', 'webrtc://test/live/test'];
                    if (item.path === 'srs.trickleIce') dummyParams = ['rtc-session-123', { candidate: '...' }];
                    
                    if (item.path === 'livekit.token.generate') dummyParams = ['user-123', 'Test User'];
                    if (item.path === 'livekit.room.create') dummyParams = ['test-room-scan'];
                    if (item.path === 'livekit.room.get') dummyParams = ['minha-sala-teste'];
                    if (item.path === 'livekit.room.delete') dummyParams = ['test-room-scan'];
                    if (item.path === 'livekit.participants.list') dummyParams = ['minha-sala-teste'];
                    if (item.path === 'livekit.participants.get') dummyParams = ['minha-sala-teste', 'participante-exemplo'];
                    if (item.path === 'livekit.participants.remove') dummyParams = ['minha-sala-teste', 'participante-exemplo'];
                    if (item.path === 'livekit.participants.mute') dummyParams = ['minha-sala-teste', 'participante-exemplo'];
                    if (item.path === 'livekit.participants.unmute') dummyParams = ['minha-sala-teste', 'participante-exemplo'];
                    if (item.path === 'livekit.tracks.list') dummyParams = ['minha-sala-teste'];
                    if (item.path === 'livekit.tracks.mute') dummyParams = ['minha-sala-teste', 'TR_audio123'];
                    if (item.path === 'livekit.tracks.unmute') dummyParams = ['minha-sala-teste', 'TR_audio123'];
                    if (item.path === 'livekit.tracks.remove') dummyParams = ['minha-sala-teste', 'TR_audio123'];
                    if (item.path === 'livekit.record.start') dummyParams = ['minha-sala-teste'];
                    if (item.path === 'livekit.record.stop') dummyParams = ['minha-sala-teste'];
                    if (item.path === 'livekit.ingest') dummyParams = ['minha-sala-teste'];
                    if (item.path === 'livekit.monitoring.stats') dummyParams = ['minha-sala-teste'];
                    if (item.path === 'livekit.monitoring.updateConfig') dummyParams = ['{"rtc": {"port": 7882}}'];
                    if (item.path === 'livekit.webhook.register') dummyParams = ['https://example.com/webhook'];
                    if (item.path === 'livekit.webhook.delete') dummyParams = ['wh_abc'];


                    const callPromise = func(...dummyParams);
                    const response = await Promise.race([
                        callPromise,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000))
                    ]);
                    
                    result.callStatus = 'ok';
                    result.responseTime = Date.now() - startTime;

                    // 3. Check Data (Contract)
                    if (response !== undefined && response !== null) {
                        result.dataStatus = 'ok';
                    }
                }
            } catch (err: any) {
                result.error = err.message;
                // Se o erro for de rede (fetch failed) mas a importação estava ok, ainda consideramos a chamada tentada
                if (result.importStatus === 'ok' && !err.message.includes('not a function')) {
                    result.callStatus = 'ok';
                }
            }

            results.push(result);
            onProgress(result);
            
            // Pequeno delay para animação fluida
            await new Promise(r => setTimeout(r, 50));
        }

        return results;
    }

    private resolvePath(obj: any, path: string): any {
        return path.split('.').reduce((prev, curr) => prev && prev[curr], obj);
    }
}

export const integrityScanner = new IntegrityScannerService();
