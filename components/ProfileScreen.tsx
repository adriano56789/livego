





import React, { useMemo, useState, useEffect } from 'react';
import type { User, AppView } from '../types';
import * as profileService from '../services/profileService';
import Flag from './Flag';
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
import TrophySolidIcon from './icons/TrophySolidIcon';

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
    
    const [countryName, setCountryName] = useState('');

    useEffect(() => {
        if (user.country) {
            profileService.getCountries().then(countries => {
                const c = countries.find(c => c.id === user.country);
                if (c) setCountryName(c.label);
                else setCountryName(user.country || ''); // fallback to code
            });
        }
    }, [user.country]);

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
        { icon: <TrophySolidIcon className="w-6 h-6 text-yellow-400" />, label: "Top Fãs", onClick: () => onNavigate('top-fans') },
        { icon: <ShieldCheckIcon className="w-6 h-6 text-sky-400" />, label: "Proteção de Avatar", onClick: () => onNavigate('avatar-protection') },
        { icon: <PlayOutlineIcon className="w-6 h-6 text-red-400" />, label: "Aplicativo ao Vivo", onClick: onGoLiveClick },
        { icon: <HeadsetIcon className="w-6 h-6 text-blue-400" />, label: "Atendimento ao Cliente", onClick: () => onNavigate('customer-service') },
        { icon: <WarningIcon className="w-6 h-6 text-yellow-500" />, label: "Denúncias & Sugestões", onClick: () => onNavigate('report-and-suggestion') },
        { icon: <HelpIcon className="w-6 h-6 text-gray-400" />, label: "Central de Ajuda", onClick: () => onNavigate('help-center') },
        { icon: <BlockedIcon className="w-6 h-6 text-gray-400" />, label: "Lista de Bloqueio", onClick: () => onNavigate('blocked-list') },
        { icon: <SettingsIcon className="w-6 h-6 text-gray-400" />, label: "Configurações", onClick: () => onNavigate('settings') },
    ];

    return (
        <div className="bg-[#1C1F24] text-white h-full flex flex-col font-sans">
            <main className="flex-grow p-4 overflow-y-auto pt-10 scrollbar-hide">
                
                {/* Header */}
                <header className="flex flex-col items-center gap-3 mb-6">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                        <button onClick={() => onNavigate('view-self-profile')} className="w-full h-full rounded-full overflow-hidden shrink-0 bg-gray-700 p-1.5 bg-gradient-to-tr from-purple-600 to-fuchsia-400">
                           <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                             {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
                            )}
                           </div>
                        </button>
                        {user.level >= 5 && (
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-black shadow-lg">
                                <span className="text-white font-black text-base sm:text-lg italic">V</span>
                            </div>
                        )}
                        {user.country && (
                           <Flag code={user.country} className="w-8 h-8 rounded-full border-2 border-black absolute bottom-0 right-0" />
                        )}
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
                           {userAge && user.gender && (
                                <ProfileBadge badge={{ text: String(userAge), type: 'gender_age', icon: user.gender }} />
                           )}
                           {user.level2 && user.level2 > 0 && (
                                <ProfileBadge badge={{ text: String(user.level2), type: 'level2', icon: 'leaf' }} />
                           )}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-2">
                            <span>ID: {user.id}</span>
                            <button onClick={() => navigator.clipboard.writeText(String(user.id))}><CopyIcon className="w-4 h-4" /></button>
                        </div>
                         {user.country && countryName && (
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-2">
                                <span>{countryName}{user.region ? `, ${user.region}` : ''}</span>
                            </div>
                        )}
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