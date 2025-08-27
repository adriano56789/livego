




import React, { useMemo } from 'react';
import type { User, AppView } from '../types';
import CopyIcon from './icons/CopyIcon';
import StarIcon from './icons/StarIcon';
import CoinIcon from './icons/CoinIcon';
import ShopIcon from './icons/ShopIcon';
import HeadsetIcon from './icons/HeadsetIcon';
import HelpIcon from './icons/HelpIcon';
import MenuListItem from './MenuListItem';
import BlockedIcon from './icons/BlockedIcon';
import UpArrowDiamondIcon from './icons/UpArrowDiamondIcon';
import PlayOutlineIcon from './icons/PlayOutlineIcon';
import WarningIcon from './icons/WarningIcon';
import PencilIcon from './icons/PencilIcon';
import SettingsIcon from './icons/SettingsIcon';
import ProfileBadge from './ProfileBadge';
import MaleIcon from './icons/MaleIcon';
import FemaleIcon from './icons/FemaleIcon';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

interface ProfileScreenProps {
  user: User;
  onNavigate: (view: AppView) => void;
  onGoLiveClick: () => void;
}

const StatItem: React.FC<{ value: string; label: string; onClick?: () => void; }> = ({ value, label, onClick }) => (
  <button onClick={onClick} className="text-center w-full hover:bg-gray-700/30 rounded-lg py-2" disabled={!onClick}>
    <p className="font-bold text-lg text-white">{value}</p>
    <p className="text-xs text-gray-400">{label}</p>
  </button>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onNavigate, onGoLiveClick }) => {
    
    const userAge = useMemo(() => {
        if (!user.birthday) return null;
        const birthDate = new Date(user.birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }, [user.birthday]);

    const menuItems = [
        { icon: <ShopIcon className="w-6 h-6 text-blue-400" />, label: "Loja", onClick: () => onNavigate('diamond-purchase') },
        { icon: <StarIcon className="w-6 h-6 text-yellow-400" />, label: "Meu Nível", onClick: () => onNavigate('my-level') },
        { icon: <ShieldCheckIcon className="w-6 h-6 text-sky-400" />, label: "Proteção de Avatar", onClick: () => onNavigate('avatar-protection') },
        { icon: <PlayOutlineIcon className="w-6 h-6 text-red-400" />, label: "Aplicativo ao Vivo", onClick: onGoLiveClick },
        { icon: <HeadsetIcon className="w-6 h-6 text-blue-400" />, label: "Atendimento ao Cliente", onClick: () => onNavigate('customer-service') },
        { icon: <WarningIcon className="w-6 h-6 text-yellow-500" />, label: "Denúncias & Sugestões", onClick: () => onNavigate('report-and-suggestion') },
        { icon: <HelpIcon className="w-6 h-6 text-gray-400" />, label: "Central de Ajuda", onClick: () => onNavigate('customer-service') },
        { icon: <BlockedIcon className="w-6 h-6 text-gray-400" />, label: "Lista de Bloqueio", onClick: () => onNavigate('blocked-list') },
        { icon: <SettingsIcon className="w-6 h-6 text-gray-400" />, label: "Configurações", onClick: () => onNavigate('settings') },
    ];

    return (
        <div className="bg-[#1C1F24] text-white h-full flex flex-col font-sans">
            <main className="flex-grow p-4 overflow-y-auto pt-10 scrollbar-hide">
                
                {/* Header */}
                <header className="flex flex-col items-center gap-3 mb-6">
                    <div className="relative">
                        <button onClick={() => onNavigate('view-self-profile')} className="w-28 h-28 rounded-full overflow-hidden shrink-0 bg-gray-700 p-1.5 bg-gradient-to-tr from-purple-600 to-fuchsia-400">
                           <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                             {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
                            )}
                           </div>
                        </button>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">{user.nickname || user.name}</h1>
                        <div className="flex items-center justify-center gap-2 mt-2">
                           {user.is_avatar_protected && (
                               <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-sky-500 text-white animate-protection-glow`}>
                                   <ShieldCheckIcon className="w-3.5 h-3.5"/>
                                   <span>Protegido</span>
                               </div>
                           )}
                           <ProfileBadge badge={{ text: String(user.level), type: 'level' }} />
                            {userAge && (
                               <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${user.gender === 'female' ? 'bg-[#ff2d55]' : 'bg-[#007aff]'} text-white`}>
                                   {user.gender === 'female' ? <FemaleIcon className="w-3 h-3" /> : <MaleIcon className="w-3 h-3" />}
                                   <span>{userAge}</span>
                               </div>
                            )}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-2">
                            <span>ID: {user.id}</span>
                            <button onClick={() => navigator.clipboard.writeText(String(user.id))}><CopyIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-3 mb-6">
                    <StatItem value={(user.following || []).length.toLocaleString('pt-BR')} label="Seguindo" onClick={() => onNavigate('following')} />
                    <StatItem value={(user.followers || 0).toLocaleString('pt-BR')} label="Fãs" onClick={() => onNavigate('fans')} />
                    <StatItem value={(user.visitors || 0).toLocaleString('pt-BR')} label="Visitantes" onClick={() => onNavigate('visitors')} />
                </div>

                <div className="bg-[#1C1F24] rounded-2xl">
                    {/* Wallet Item */}
                    <button
                        onClick={() => onNavigate('diamond-purchase')}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-700/50 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <CoinIcon className="w-6 h-6 text-yellow-400" />
                            <span className="font-medium text-white">Carteira</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <UpArrowDiamondIcon className="w-5 h-5 text-cyan-400"/>
                                <span className="font-semibold text-sm text-white">{(user.wallet_diamonds || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CoinIcon className="w-5 h-5"/>
                                <span className="font-semibold text-sm text-white">{(user.wallet_earnings || 0).toLocaleString('pt-BR')}</span>
                            </div>
                            <span className="text-gray-600 text-lg">&gt;</span>
                        </div>
                    </button>
                    
                    <div className="border-t border-gray-700/50 mx-3" />

                    {menuItems.map((item) => (
                        <MenuListItem key={item.label} icon={item.icon} label={item.label} onClick={item.onClick} />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default ProfileScreen;