import React from 'react';
import { User } from '../../types';
import { useTranslation } from '../../i18n';
import { 
    WalletIcon,
    SettingsIcon,
    ChevronRightIcon,
    ShopIcon,
    BanIcon,
    MailIcon,
    MessageIcon,
    UserPlusIcon,
    CopyIcon,
    MarsIcon,
    VenusIcon,
    BankIcon,
    StarIcon,
    SolidDiamondIcon,
    BrazilFlagIcon,
    HelpIcon,
    SoundWaveIcon,
    DatabaseIcon,
    ZapIcon,
    ShieldIcon,
    CpuIcon,
    WebRTCIcon,
    BellIcon
} from '../icons';
import { LevelBadge } from '../LevelBadge';
import { api } from '../../services/api';

interface ProfileScreenProps {
    currentUser: User;
    onOpenUserDetail: () => void;
    onOpenWallet: (initialTab?: 'Diamante' | 'Ganhos') => void;
    onOpenFollowing: () => void;
    onOpenFans: () => void;
    onOpenVisitors: () => void;
    onNavigateToMessages: () => void;
    onOpenMarket: () => void;
    onOpenMyLevel: () => void;
    onOpenBlockList: () => void;
    onOpenFAQ: () => void;
    onOpenSettings: () => void;
    onOpenSupportChat: () => void;
    onOpenAdminWallet: () => void;
    onOpenApiTracker: () => void;
    onOpenDatabaseMonitor: () => void;
    onOpenHealthMonitor: () => void;
    onOpenIntegrityTester: () => void; 
    onOpenFullApiCheckup: () => void;
    onOpenLiveKitMonitor: () => void;
    onOpenStreamingPanel: () => void;
    visitors: User[];
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
    currentUser,
    onOpenUserDetail,
    onOpenWallet,
    onOpenFollowing,
    onOpenFans,
    onOpenVisitors,
    onNavigateToMessages,
    onOpenMarket,
    onOpenMyLevel,
    onOpenBlockList,
    onOpenFAQ,
    onOpenSettings,
    onOpenSupportChat,
    onOpenAdminWallet,
    onOpenApiTracker,
    onOpenDatabaseMonitor,
    onOpenHealthMonitor,
    onOpenIntegrityTester,
    onOpenFullApiCheckup,
    onOpenLiveKitMonitor,
    onOpenStreamingPanel,
    visitors = []
}) => {
    const { t } = useTranslation();

    // Verificação de Administrador (Dono do App)
    const isAdmin = currentUser.email === 'adrianomdk5@gmail.com' || currentUser.level >= 99;

    const handleCopyId = () => {
        if (currentUser?.identification) {
            navigator.clipboard.writeText(currentUser.identification);
        }
    };
    
    return (
        <div className="h-full w-full bg-[#121212] text-white overflow-y-auto no-scrollbar scroll-smooth flex flex-col font-sans select-none">
            {/* --- Header Section --- */}
            <div className="flex flex-col items-center pt-10 pb-6 bg-[#121212]">
                <div className="relative mb-3 cursor-pointer" onClick={onOpenUserDetail}>
                    <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-[#7c3aed] to-[#3b82f6]">
                        <img 
                            src={currentUser.avatarUrl} 
                            alt={currentUser.name} 
                            className="w-full h-full rounded-full object-cover border-[3px] border-[#121212]"
                        />
                    </div>
                    <div className="absolute bottom-0 right-1 rounded-full border-2 border-[#121212] overflow-hidden w-6 h-6">
                        <BrazilFlagIcon className="w-full h-full" />
                    </div>
                </div>
                
                <h1 className="text-xl font-bold text-white mb-2 tracking-wide">{currentUser.name}</h1>
                
                <div className="flex items-center gap-2 mb-2">
                    <div className={`flex items-center rounded-full px-2 py-[2px] gap-1 min-w-[40px] justify-center ${currentUser.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                        {currentUser.gender === 'female' ? <VenusIcon size={10} className="text-white fill-white" /> : <MarsIcon size={10} className="text-white fill-white" />}
                        <span className="text-[11px] font-black italic">{currentUser.age || 18}</span>
                    </div>
                    <LevelBadge level={currentUser.level} />
                </div>
                
                <div className="flex items-center gap-2 mb-1 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    <span className="text-xs font-black text-gray-300">ID: {currentUser.identification}</span>
                    <button onClick={handleCopyId} className="hover:text-white transition-colors active:scale-90">
                        <CopyIcon size={12} className="text-purple-400" />
                    </button>
                </div>
                
                <div className="text-[11px] text-gray-500 mb-8 font-medium">
                    Brasil | Global Access
                </div>
                
                <div className="flex justify-around w-full max-w-sm px-8 mb-4">
                    <div className="flex flex-col items-center cursor-pointer active:opacity-70 transition-opacity" onClick={onOpenFollowing}>
                        <span className="text-xl font-bold text-white leading-none mb-1">{currentUser.following || 0}</span>
                        <span className="text-xs text-gray-400">Seguindo</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer active:opacity-70 transition-opacity" onClick={onOpenFans}>
                        <span className="text-xl font-bold text-white leading-none mb-1">{currentUser.fans || 0}</span>
                        <span className="text-xs text-gray-400">Fãs</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer active:opacity-70 transition-opacity" onClick={onOpenVisitors}>
                        <span className="text-xl font-bold text-white leading-none mb-1">{visitors.length}</span>
                        <span className="text-xs text-gray-400">Visitantes</span>
                    </div>
                </div>
            </div>
            
            {/* --- Menu List --- */}
            <div className="mt-4 flex flex-col bg-[#121212] flex-1">
                <div onClick={() => onOpenWallet()} className="flex items-center justify-between py-4 px-4 active:bg-white/5 cursor-pointer bg-[#121212]">
                    <div className="flex items-center gap-3">
                        <WalletIcon className="w-5 h-5 text-[#fbbf24]" /> 
                        <span className="text-sm font-medium text-white">Carteira</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <SolidDiamondIcon className="w-3 h-3 text-[#fbbf24]" />
                            <span className="text-xs text-gray-200 font-medium">{(currentUser.diamonds || 0).toLocaleString()}</span>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-gray-600 ml-1" />
                    </div>
                </div>

                <MenuItem icon={ShopIcon} color="text-blue-400" label="Loja VIP" onClick={onOpenMarket} />
                <MenuItem icon={StarIcon} color="text-yellow-500" label="Minha Patente" onClick={onOpenMyLevel} />
                <MenuItem icon={UserPlusIcon} color="text-green-400" label="Meus Fãs" onClick={onOpenFans} />
                <MenuItem icon={BanIcon} color="text-red-500" label="Lista de Bloqueio" onClick={onOpenBlockList} />
                <MenuItem icon={MailIcon} color="text-teal-400" label="Suporte Oficial" onClick={onOpenSupportChat} />
                <MenuItem icon={MessageIcon} color="text-gray-400" label="Mensagens" onClick={onNavigateToMessages} />
                <MenuItem icon={HelpIcon} color="text-gray-400" label="FAQ" onClick={onOpenFAQ} />
                <MenuItem icon={SettingsIcon} color="text-gray-400" label="Configurações" onClick={onOpenSettings} />
                
                {/* --- FUNÇÕES EXCLUSIVAS PARA ADMIN --- */}
                {isAdmin && (
                    <>
                        <div className="h-px bg-white/5 my-2 mx-4"></div>
                        <MenuItem icon={BankIcon} color="text-orange-500" label="Admin Wallet" onClick={onOpenAdminWallet} />
                        <MenuItem icon={SoundWaveIcon} color="text-cyan-400" label="Monitoramento de API" onClick={onOpenApiTracker} />
                    </>
                )}
                
                <div className="flex-1 bg-[#121212] min-h-[100px] pb-20"></div>
            </div>
        </div>
    );
};

const MenuItem = ({ icon: Icon, color, label, onClick }: any) => (
    <div 
        onClick={onClick}
        className="flex items-center justify-between py-4 px-4 active:bg-white/5 cursor-pointer bg-[#121212]"
    >
        <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
            <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <ChevronRightIcon className="w-4 h-4 text-gray-600" />
    </div>
);

export default ProfileScreen;