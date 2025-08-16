
import React from 'react';
import type { User, AppView } from '../types';
import VideoIcon from './icons/VideoIcon';
import LiveIcon from './icons/LiveIcon';
import MessageIcon from './icons/MessageIcon';
import ProfileIcon from './icons/ProfileIcon';
import GoLiveIcon from './icons/LockIcon';

interface BottomNavProps {
    user: User;
    activeView: AppView;
    onNavigate: (view: AppView) => void;
    onGoLiveClick: () => void;
}

const BottomNavItem: React.FC<{ icon: React.ReactNode; label: string; isActive?: boolean; hasNotification?: boolean; onClick: () => void; isLiveActive?: boolean; }> = ({ icon, label, isActive, hasNotification, onClick, isLiveActive }) => (
    <button onClick={onClick} className="relative flex flex-col items-center justify-center gap-1 w-full h-full text-center">
        <div className={`relative w-7 h-7 flex items-center justify-center transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-gray-400'}`}>
            {icon}
            {isLiveActive && (
                 <div className="absolute -top-1.5 right-1/2 translate-x-1/2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-md">
                    AO VIVO
                </div>
            )}
        </div>
        <span className={`text-xs font-medium transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400'}`}>{label}</span>
        {hasNotification && (
             <div className="absolute top-1 right-1/2 -mr-5">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            </div>
        )}
    </button>
);


const BottomNav: React.FC<BottomNavProps> = ({ user, activeView, onNavigate, onGoLiveClick }) => {
    return (
        <footer className="bg-[#191919] border-t border-gray-800/50 shrink-0 h-16">
            <div className="flex justify-around items-center h-full">
                <BottomNavItem
                    icon={<LiveIcon />}
                    label="Live"
                    isActive={activeView === 'feed'}
                    isLiveActive={activeView === 'feed'}
                    onClick={() => onNavigate('feed')}
                />
                 <BottomNavItem
                    icon={<VideoIcon />}
                    label="Vídeo"
                    isActive={activeView === 'video'}
                    onClick={() => onNavigate('video')}
                />
                
                <button 
                    onClick={onGoLiveClick} 
                    className="w-16 h-16 -mt-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform"
                    aria-label="Go Live"
                >
                    <GoLiveIcon className="w-9 h-9 text-white" />
                </button>

                <BottomNavItem
                    icon={<MessageIcon />}
                    label="Mensagem"
                    isActive={activeView === 'messages'}
                    hasNotification={true}
                    onClick={() => onNavigate('messages')}
                />
                <BottomNavItem
                    icon={<ProfileIcon avatarUrl={user.avatar_url} />}
                    label="Eu"
                    isActive={activeView === 'profile'}
                    onClick={() => onNavigate('profile')}
                />
            </div>
        </footer>
    );
};

export default BottomNav;