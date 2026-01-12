
import React, { useState } from 'react';
import { 
    ChevronLeftIcon, ChevronRightIcon, LinkIcon, BellIcon, GiftIcon, 
    LockIcon, ShieldIcon, BankIcon, GlobeIcon, 
    InfoIcon, FileTextIcon, LogOutIcon, PlayIcon, RefreshIcon, TypeIcon, UserPlusIcon, MinusIcon,
    CheckIcon, GoogleIcon, FacebookIcon, MessageIcon
} from '../icons';
import { User, ToastType, NotificationSettings } from '../../types';
import { api } from '../../services/api';
import { LoadingSpinner } from '../Loading';
import WhoCanMessageScreen from './WhoCanMessageScreen';

interface SettingsScreenProps {
    onClose: () => void;
    onLogout: () => void;
    currentUser: User | null;
    onOpenBlockList?: () => void;
    onOpenWallet?: (tab?: 'Diamante' | 'Ganhos') => void;
    onOpenLanguageModal?: () => void;
    onOpenVIPCenter?: () => void;
    gifts?: any[];
    updateUser: (user: User) => void;
    addToast: (type: ToastType, msg: string) => void;
    onOpenZoomSettings?: () => void;
}

const Toggle = ({ active, onToggle, loading = false }: { active: boolean, onToggle: () => void, loading?: boolean }) => (
    <div 
        onClick={(e) => { e.stopPropagation(); if(!loading) onToggle(); }}
        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${active ? 'bg-purple-600' : 'bg-gray-700'} ${loading ? 'opacity-50' : ''}`}
    >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center`}>
            {loading && <div className="w-2 h-2 border border-purple-500 border-t-transparent animate-spin rounded-full"></div>}
        </div>
    </div>
);

const SettingRow = ({ label, subLabel, children, onClick, icon: Icon, color = "text-gray-400" }: any) => (
    <div 
        onClick={onClick}
        className="flex items-center justify-between py-4 px-4 active:bg-white/5 bg-[#121212] border-none shrink-0 cursor-pointer select-text"
    >
        <div className="flex items-center gap-3 max-w-[80%] pointer-events-none">
            {Icon && <Icon className={`w-5 h-5 ${color}`} />}
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-white select-text pointer-events-auto">{label}</span>
                {subLabel && <span className="text-[10px] text-gray-500 leading-tight select-text pointer-events-auto">{subLabel}</span>}
            </div>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
            {children}
        </div>
    </div>
);

const SubPage = ({ title, onBack, children }: { title: string, onBack: () => void, children?: React.ReactNode }) => (
    <div className="absolute inset-0 bg-[#121212] flex flex-col z-[160] animate-in slide-in-from-right duration-200 overflow-hidden select-text">
        <div className="flex items-center justify-between px-4 py-3 bg-[#121212] shrink-0 border-b border-white/5">
            <button onClick={onBack} className="p-1">
                <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
            <h2 className="text-white font-bold text-lg select-text">{title}</h2>
            <div className="w-6"></div>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#121212] no-scrollbar touch-pan-y overscroll-contain">
            {children}
        </div>
    </div>
);

export default function SettingsScreen({ 
    onClose, onLogout, currentUser, onOpenBlockList, onOpenWallet, updateUser, addToast, onOpenZoomSettings
}: SettingsScreenProps) {
    const [view, setView] = useState<string>('root');
    const [isUpdating, setIsUpdating] = useState(false);

    if (!currentUser) return null;

    const handleBack = () => {
        if (view === 'root') onClose();
        else setView('root');
    };

    const handleSettingUpdate = async (updates: Partial<User>) => {
        if (isUpdating || !updateUser) return;
        setIsUpdating(true);
        try {
            const { success, user } = await api.users.update('me', updates);
            if (success && user) {
                updateUser(user);
                addToast?.(ToastType.Success, "Alteração salva com sucesso!");
            }
        } catch (error) {
            addToast?.(ToastType.Error, "Erro ao conectar com a API.");
        } finally {
            setIsUpdating(false);
        }
    };

    // FIX: Corrected a TypeScript error where an incomplete `NotificationSettings` object could be created.
    // The function now ensures that the required properties `newMessages` and `streamerLive` are always present
    // by providing default values, thus satisfying the type constraints.
    const toggleNotification = (key: keyof NotificationSettings) => {
        const currentNotifs = currentUser.notificationSettings;
        const newNotifs: NotificationSettings = {
            // Provide defaults for required fields to satisfy the type.
            newMessages: false,
            streamerLive: false,
            // Spread existing settings to override defaults and keep other optional values.
            ...currentNotifs,
            // Toggle the specific key. If the key was optional and not present, it becomes true.
            [key]: !currentNotifs?.[key],
        };
        handleSettingUpdate({ notificationSettings: newNotifs });
    };

    const togglePrivacy = (key: keyof User) => {
        handleSettingUpdate({ [key]: !((currentUser as any)[key]) });
    };

    const handleLanguageChange = async (code: string, label: string) => {
        if (!updateUser) return;
        setIsUpdating(true);
        try {
            await api.users.setLanguage(code);
            const { success, user } = await api.users.update('me', { country: code });
            if (success && user) {
                updateUser(user);
                addToast?.(ToastType.Success, `Idioma alterado para ${label}`);
                setView('root');
            }
        } catch (e) {
            addToast?.(ToastType.Error, "Falha na sincronização do idioma.");
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleLink = (provider: 'google' | 'facebook') => {
        const newAccount = {
            id: `${provider === 'google' ? 'g' : 'fb'}-${Date.now()}`,
            provider,
            name: currentUser.name,
            email: currentUser.email || 'mock@email.com'
        };
        const updatedAccounts = [...(currentUser.connectedAccounts || []), newAccount];
        handleSettingUpdate({ connectedAccounts: updatedAccounts });
    };

    const handleUnlink = (provider: 'google' | 'facebook') => {
        const updatedAccounts = currentUser.connectedAccounts?.filter(acc => acc.provider !== provider) || [];
        handleSettingUpdate({ connectedAccounts: updatedAccounts });
    };


    const handleClearCache = () => {
        addToast?.(ToastType.Info, "Limpando cache...");
        setTimeout(() => {
            addToast?.(ToastType.Success, "Cache limpo! 34MB liberados.");
        }, 1000);
    };

    const navigate = (page: string) => setView(page);

    const chatPermissionLabels = {
        'all': 'Todos',
        'followers': 'Apenas Seguidores',
        'none': 'Ninguém'
    };

    return (
        <div className="fixed inset-0 z-[150] bg-[#121212] flex flex-col font-sans animate-in slide-in-from-right duration-300 overflow-hidden select-text">
            <div className="relative flex-1 flex flex-col overflow-hidden">
                
                {view === 'root' && (
                    <>
                        <div className="flex items-center justify-between px-4 py-3 bg-[#121212] shrink-0 border-b border-white/5">
                            <button onClick={handleBack} className="p-1">
                                <ChevronLeftIcon className="w-6 h-6 text-white" />
                            </button>
                            <h2 className="text-white font-bold text-lg select-text">Configurações</h2>
                            <div className="w-6"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-[#121212] no-scrollbar touch-pan-y overscroll-contain pb-20">
                            <div className="flex flex-col bg-[#121212]">
                                <SettingRow icon={LinkIcon} label="Contas Conectadas" onClick={() => navigate('Contas')}><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={BellIcon} label="Notificações" onClick={() => navigate('Notificações')}><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={GiftIcon} label="Configuração de Notificação de Presentes" onClick={() => navigate('NotifPresentes')}><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={LockIcon} label="Privacidade" onClick={() => navigate('Privacidade')}><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={ShieldIcon} label="Proteção de Avatar" onClick={() => navigate('ProtAvatar')}><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={UserPlusIcon} label="Convite privado ao vivo" onClick={() => navigate('ConvitePrivado')}><span className="text-gray-500 text-xs">{currentUser.privateInvitePermission || 'Todos'}</span><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={MinusIcon} label="Lista de bloqueio" onClick={() => onOpenBlockList ? onOpenBlockList() : navigate('Bloqueio')}><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={BankIcon} label="Meus Ganhos" onClick={() => onOpenWallet ? onOpenWallet('Ganhos') : navigate('Ganhos')}><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={TypeIcon} label="Tamanho da fonte" onClick={onOpenZoomSettings}><span className="text-gray-500 text-sm">Padrão</span><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={GlobeIcon} label="Idiomas" onClick={() => navigate('Idiomas')}><span className="text-gray-400 text-sm">{currentUser.country === 'en' ? 'English' : 'Português'}</span><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={InfoIcon} label="Sobre LiveGo" onClick={() => navigate('SobreLG')}><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={FileTextIcon} label="Contrato do Usuário" onClick={() => navigate('Contrato')}><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={FileTextIcon} label="Política de Privacidade" onClick={() => navigate('Politica')}><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={PlayIcon} label="Sobre" onClick={() => navigate('SobreApp')}><span className="text-gray-400 text-sm">V1.0.0</span><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>
                                <SettingRow icon={RefreshIcon} label="Limpar cache" onClick={handleClearCache}><span className="text-gray-400 text-sm">34MB</span><ChevronRightIcon className="w-4 h-4 text-gray-600" /></SettingRow>

                                <div className="mt-8 mb-12 px-4 space-y-4 bg-[#121212]">
                                    <button onClick={onLogout} className="w-full py-4 rounded-full bg-[#2C2C2E] text-white font-bold text-sm flex items-center justify-center gap-2 active:bg-white/5 transition-colors">
                                        <LogOutIcon className="w-4 h-4 text-red-500" /> Sair
                                    </button>
                                    <div className="flex justify-center pb-10">
                                        <button className="text-gray-500 text-xs hover:text-gray-300 transition-colors py-2">Excluir conta</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* --- SUB PAGES --- */}

                {view === 'Contas' && (
                    <SubPage title="Contas Conectadas" onBack={handleBack}>
                        {(() => {
                            const googleAccount = currentUser.connectedAccounts?.find(acc => acc.provider === 'google');
                            const facebookAccount = currentUser.connectedAccounts?.find(acc => acc.provider === 'facebook');
                            return (
                                <>
                                    <SettingRow label="Google" subLabel={googleAccount ? googleAccount.email : "Vincule para login rápido"} icon={GoogleIcon}>
                                        <button 
                                            onClick={() => googleAccount ? handleUnlink('google') : handleLink('google')}
                                            disabled={isUpdating}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-50 ${googleAccount ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-gray-300'}`}
                                        >
                                            {googleAccount ? 'Desvincular' : 'Vincular'}
                                        </button>
                                    </SettingRow>
                                    <SettingRow label="Facebook" subLabel={facebookAccount ? facebookAccount.email : "Sincronize seus amigos"} icon={FacebookIcon}>
                                        <button 
                                            onClick={() => facebookAccount ? handleUnlink('facebook') : handleLink('facebook')}
                                            disabled={isUpdating}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-50 ${facebookAccount ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-gray-300'}`}
                                        >
                                            {facebookAccount ? 'Desvincular' : 'Vincular'}
                                        </button>
                                    </SettingRow>
                                </>
                            );
                        })()}
                    </SubPage>
                )}


                {view === 'Notificações' && (
                    <SubPage title="Notificações" onBack={handleBack}>
                        <SettingRow label="Novas Mensagens" subLabel="Alertar ao receber mensagens privadas">
                            <Toggle active={!!currentUser.notificationSettings?.newMessages} onToggle={() => toggleNotification('newMessages')} loading={isUpdating} />
                        </SettingRow>
                        <SettingRow label="Streamer Ao Vivo" subLabel="Notificar quando ídolos iniciarem live">
                            <Toggle active={!!currentUser.notificationSettings?.streamerLive} onToggle={() => toggleNotification('streamerLive')} loading={isUpdating} />
                        </SettingRow>
                        <SettingRow label="Novos Seguidores" subLabel="Alertar quando alguém te seguir">
                            <Toggle active={!!currentUser.notificationSettings?.newFollower} onToggle={() => toggleNotification('newFollower')} loading={isUpdating} />
                        </SettingRow>
                        <SettingRow label="Postagens de Seguidos" subLabel="Sempre que alguém que você segue postar algo">
                            <Toggle active={!!currentUser.notificationSettings?.followedPosts} onToggle={() => toggleNotification('followedPosts')} loading={isUpdating} />
                        </SettingRow>
                         <SettingRow label="Pedidos de Amizade" subLabel="Receber alertas de novos pedidos de amizade">
                            <Toggle active={!!currentUser.notificationSettings?.pedido} onToggle={() => toggleNotification('pedido')} loading={isUpdating} />
                        </SettingRow>
                        <SettingRow label="Notificações Interativas" subLabel="Alertas sobre eventos e atividades na plataforma">
                            <Toggle active={!!currentUser.notificationSettings?.interactive} onToggle={() => toggleNotification('interactive')} loading={isUpdating} />
                        </SettingRow>
                         <SettingRow label="Notificações Push" subLabel="Permitir que o app envie notificações para o celular">
                            <Toggle active={!!currentUser.notificationSettings?.push} onToggle={() => toggleNotification('push')} loading={isUpdating} />
                        </SettingRow>
                    </SubPage>
                )}

                {view === 'NotifPresentes' && (
                    <SubPage title="Notificação de Presentes" onBack={handleBack}>
                        <SettingRow label="Alertas na Tela" subLabel="Mostrar animações de presentes na live">
                            <Toggle active={!!currentUser.notificationSettings?.giftAlertsOnScreen} onToggle={() => toggleNotification('giftAlertsOnScreen')} loading={isUpdating} />
                        </SettingRow>
                        <SettingRow label="Efeitos Sonoros" subLabel="Reproduzir sons de moedas e presentes">
                            <Toggle active={!!currentUser.notificationSettings?.giftSoundEffects} onToggle={() => toggleNotification('giftSoundEffects')} loading={isUpdating} />
                        </SettingRow>
                        <SettingRow label="Banners de Luxo" subLabel="Mostrar avisos de presentes raros">
                            <Toggle active={!!currentUser.notificationSettings?.giftLuxuryBanners} onToggle={() => toggleNotification('giftLuxuryBanners')} loading={isUpdating} />
                        </SettingRow>
                    </SubPage>
                )}

                {view === 'Privacidade' && (
                    <SubPage title="Privacidade" onBack={handleBack}>
                        <SettingRow label="Mostrar Localização" subLabel="Permitir ver sua cidade no perfil">
                            <Toggle active={!!currentUser.showLocation} onToggle={() => togglePrivacy('showLocation')} loading={isUpdating} />
                        </SettingRow>
                        <SettingRow label="Status de Atividade" subLabel="Mostrar quando você esteve ativo pela última vez">
                            <Toggle active={!!currentUser.showActivityStatus} onToggle={() => togglePrivacy('showActivityStatus')} loading={isUpdating} />
                        </SettingRow>
                        <SettingRow label="Esconder Minhas Curtidas" subLabel="Outros não verão o que você curtiu">
                            <Toggle active={!!currentUser.hideLikes} onToggle={() => togglePrivacy('hideLikes')} loading={isUpdating} />
                        </SettingRow>
                         <SettingRow icon={MessageIcon} label="Quem pode me enviar mensagens" onClick={() => navigate('who_can_message')}>
                            <span className="text-gray-500 text-xs">{chatPermissionLabels[currentUser.chatPermission || 'all']}</span>
                            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                        </SettingRow>
                    </SubPage>
                )}
                
                {view === 'who_can_message' && addToast && updateUser && (
                    <WhoCanMessageScreen
                        onBack={() => setView('Privacidade')}
                        currentUser={currentUser}
                        updateUser={updateUser}
                        addToast={addToast}
                    />
                )}

                {view === 'ProtAvatar' && (
                    <SubPage title="Proteção de Avatar" onBack={handleBack}>
                        <div className="p-6 bg-blue-500/10 m-4 rounded-2xl border border-blue-500/20">
                            <ShieldIcon className="w-10 h-10 text-blue-400 mb-4" />
                            <h3 className="text-white font-bold mb-2">Segurança de Imagem</h3>
                            <p className="text-gray-400 text-xs leading-relaxed">Ao ativar a proteção, impedimos que seu avatar seja baixado ou printado em alta resolução por terceiros.</p>
                        </div>
                        <SettingRow label="Ativar Proteção">
                            <Toggle active={!!currentUser.isAvatarProtected} onToggle={() => togglePrivacy('isAvatarProtected')} loading={isUpdating} />
                        </SettingRow>
                    </SubPage>
                )}

                {view === 'ConvitePrivado' && (
                    <SubPage title="Convites Privados" onBack={handleBack}>
                        {['all', 'followers', 'none'].map(opt => {
                            const label = opt === 'all' ? 'Todos' : opt === 'followers' ? 'Apenas Seguidores' : 'Ninguém';
                            return (
                                <SettingRow key={opt} label={label} onClick={() => handleSettingUpdate({ privateInvitePermission: opt as any })}>
                                    {currentUser.privateInvitePermission === opt && <CheckIcon className="w-5 h-5 text-purple-500" />}
                                </SettingRow>
                            );
                        })}
                    </SubPage>
                )}

                {view === 'Idiomas' && (
                    <SubPage title="Idiomas" onBack={handleBack}>
                        <SettingRow label="Português (Brasil)" onClick={() => handleLanguageChange('pt', 'Português')}>
                            {currentUser.country === 'pt' && <CheckIcon className="w-5 h-5 text-purple-500" />}
                        </SettingRow>
                        <SettingRow label="English (US)" onClick={() => handleLanguageChange('en', 'English')}>
                            {currentUser.country === 'en' && <CheckIcon className="w-5 h-5 text-purple-500" />}
                        </SettingRow>
                    </SubPage>
                )}

                {view === 'SobreLG' && (
                    <SubPage title="Sobre LiveGo" onBack={handleBack}>
                        <div className="p-6 space-y-6 text-gray-400 text-sm leading-relaxed">
                            <div className="flex justify-center mb-8">
                                <h1 className="text-4xl font-black text-white italic">LiveGo</h1>
                            </div>
                            <p>O LiveGo é a plataforma líder em transmissões ao vivo interativas, conectando talentos e fãs em todo o mundo através de tecnologia de ponta e um sistema de presentes inovador.</p>
                            <p>Nossa missão é criar um ambiente seguro e divertido para criadores de conteúdo prosperarem e comunidades se formarem.</p>
                        </div>
                    </SubPage>
                )}

                {view === 'SobreApp' && (
                    <SubPage title="Sobre o Aplicativo" onBack={handleBack}>
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-3xl shadow-xl flex items-center justify-center">
                                <PlayIcon className="w-10 h-10 text-white fill-white ml-1" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-white font-black text-xl">LiveGo Premium</h3>
                                <p className="text-gray-500 text-sm">Versão 1.0.0 (Build 2024.01)</p>
                            </div>
                            <p className="text-gray-600 text-xs mt-10">© 2024 LiveGo Inc. Todos os direitos reservados.</p>
                        </div>
                    </SubPage>
                )}
            </div>
        </div>
    );
}