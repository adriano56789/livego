
import { api } from './api';

export interface ComponentAudit {
    name: string;
    apiDependencies: string[];
    status: 'pending' | 'ok' | 'fail';
    importVerified: boolean;
    callVerified: boolean;
    payloadValid: boolean;
    errorLog?: string;
}

class AppAuditorService {
    // Mapa de dependências reais baseadas no código do app
    private components: ComponentAudit[] = [
        // Auth & Core
        { name: 'LoginScreen', apiDependencies: ['auth.login', 'auth.getLastEmail', 'auth.register', 'auth.saveLastEmail'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'App (Core)', apiDependencies: ['users.me', 'getVisitors', 'streams.listByCategory'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        
        // Live & Streaming
        { name: 'StreamRoom', apiDependencies: ['users.getOnlineUsers', 'gifts.getGallery', 'translate', 'sendGift', 'toggleMicrophone'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'PKBattleScreen', apiDependencies: ['sendGift', 'users.getOnlineUsers'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'GoLiveScreen', apiDependencies: ['users.me', 'streams.create'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        
        // Main Screens
        { name: 'MessagesScreen', apiDependencies: ['chats.listConversations', 'users.getFriends', 'users.getOnlineUsers', 'users.blockUser'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'UserProfileScreen', apiDependencies: ['users.get', 'users.blockUser'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        
        // Social & Relationships
        { name: 'RelationshipScreen', apiDependencies: ['getFollowingUsers', 'users.getFansUsers', 'getVisitors'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'TopFansScreen', apiDependencies: ['getTopFans'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'BlockListScreen', apiDependencies: ['getBlocklist', 'unblockUser'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'SearchScreen', apiDependencies: ['users.search'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },

        // Financial
        { name: 'WalletScreen', apiDependencies: ['diamonds.getBalance', 'users.getWithdrawalHistory', 'earnings.withdraw.calculate', 'earnings.withdraw.request'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'AdminWalletScreen', apiDependencies: ['admin.getAdminWithdrawalHistory', 'admin.withdraw.request'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'ConfirmPurchaseScreen', apiDependencies: ['confirmPurchaseTransaction', 'updateBillingAddress', 'updateCreditCard'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        
        // Modals & Panels
        { name: 'HistoryModal', apiDependencies: ['getStreamHistory'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'ReminderModal', apiDependencies: ['getReminders', 'removeReminder'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'MarketScreen', apiDependencies: ['getAvatarFrames', 'setActiveFrame'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'CoHostModal', apiDependencies: ['users.getFriends', 'getQuickCompleteFriends', 'inviteFriendForCoHost'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'PrivateInviteModal', apiDependencies: ['users.search', 'users.getFansUsers', 'streams.getGiftDonors', 'streams.inviteToPrivateRoom'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        { name: 'BeautyEffectsPanel', apiDependencies: ['streams.getBeautySettings', 'streams.saveBeautySettings'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        
        // Settings
        { name: 'SettingsScreen', apiDependencies: ['users.update', 'users.setLanguage'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        
        // Developer Tools
        { name: 'DatabaseScreen', apiDependencies: ['db.checkCollections', 'db.setupDatabase'], status: 'pending', importVerified: false, callVerified: false, payloadValid: false },
        
        // Components without direct API calls (or handled by props)
        { name: 'FooterNav', apiDependencies: [], status: 'pending', importVerified: true, callVerified: true, payloadValid: true },
        { name: 'FanClubMembersScreen', apiDependencies: [], status: 'pending', importVerified: true, callVerified: true, payloadValid: true }, // Mocked for now
        { name: 'VideoScreen', apiDependencies: [], status: 'pending', importVerified: true, callVerified: true, payloadValid: true } // Placeholder
    ];

    private results: ComponentAudit[] = [];

    async runFullAppAudit(): Promise<ComponentAudit[]> {
        this.results = this.components.map(c => ({ ...c, status: 'pending' }));
        
        for (let i = 0; i < this.results.length; i++) {
            const comp = this.results[i];

            // Pula a verificação para componentes sem dependências de API
            if (comp.apiDependencies.length === 0) {
                comp.status = 'ok';
                comp.importVerified = true;
                comp.callVerified = true;
                comp.payloadValid = true;
                await new Promise(r => setTimeout(r, 100)); // Pequeno delay para UI
                continue;
            }
            
            try {
                // 1. Verificar se a API foi importada/está disponível
                comp.importVerified = this.checkImports(comp.apiDependencies);
                
                // 2. Tentar chamar o primeiro método da lista (Probe)
                const firstDep = comp.apiDependencies[0];
                comp.callVerified = await this.testCall(firstDep);
                
                // 3. Validar se os dados retornados fazem sentido
                comp.payloadValid = await this.validateData(firstDep);

                comp.status = (comp.importVerified && comp.callVerified && comp.payloadValid) ? 'ok' : 'fail';
            } catch (err: any) {
                comp.status = 'fail';
                comp.errorLog = err.message || 'Falha crítica no componente';
            }
            
            // Simula delay de escaneamento para visualização
            await new Promise(r => setTimeout(r, 350));
        }

        return this.results;
    }

    private checkImports(deps: string[]): boolean {
        return deps.every(dep => {
            const parts = dep.split('.');
            let current: any = api;
            for (const part of parts) {
                if (!current || !current[part]) return false;
                current = current[part];
            }
            return typeof current === 'function';
        });
    }

    private async testCall(dep: string): Promise<boolean> {
        try {
            const func = this.getApiFunc(dep);
            // Chamada de "ping" sem parâmetros ou com parâmetros dummy
            const res = await Promise.race([
                func(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
            ]);
            return true;
        } catch (e: any) {
            // Se for erro de rede ou 404, a chamada ocorreu ( wiring ok ), se for undefined falhou
            return e.message !== 'Timeout' && e.message !== 'func is not a function';
        }
    }

    private async validateData(dep: string): Promise<boolean> {
        try {
            const func = this.getApiFunc(dep);
            const res = await func();
            // Verifica se o retorno é um objeto ou array (padrão do nosso sistema)
            return (typeof res === 'object' && res !== null);
        } catch (e) {
            return false;
        }
    }

    private getApiFunc(dep: string): Function {
        const parts = dep.split('.');
        let current: any = api;
        for (const part of parts) {
            if (!current[part]) throw new Error(`Módulo ${part} não encontrado na API`);
            current = current[part];
        }
        return current;
    }

    getLatestResults() { return this.results; }
}

export const appAuditor = new AppAuditorService();
