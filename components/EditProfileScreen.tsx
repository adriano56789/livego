import React, { useState, useEffect } from 'react';
import type { User, AppView, PublicProfile, Stream, PkBattle } from '../types';
import * as liveStreamService from '../services/liveStreamService';

import ArrowLeftIcon from './icons/ArrowLeftIcon';
import EllipsisIcon from './icons/EllipsisIcon';
import CopyIcon from './icons/CopyIcon';
import BlockScreen from './BlockScreen';
import MessageIcon from './icons/MessageIcon';
import LocationPinIcon from './icons/LocationPinIcon';
import ProfileBadge from './ProfileBadge';
import MaleIcon from './icons/MaleIcon';
import FemaleIcon from './icons/FemaleIcon';
import LiveIndicatorIcon from './icons/LiveIndicatorIcon';
import CoinReceivedIcon from './icons/CoinReceivedIcon';
import DiamondSentIcon from './icons/DiamondSentIcon';
import PlayOutlineIcon from './icons/PlayOutlineIcon';
import ClockIcon from './icons/ClockIcon';
import MenuIcon from './icons/MenuIcon';


// Action sheet that slides from the bottom
const ActionSheetMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onUnfriend: () => void;
  onBlock: () => void;
  onReport: () => void;
  isFollowing: boolean;
}> = ({ isOpen, onClose, onUnfriend, onBlock, onReport, isFollowing }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div 
        className="bg-[#1c1c1e] w-full max-w-md mx-auto p-2 flex flex-col gap-2 animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#2c2c2e] rounded-xl">
          {isFollowing && (
            <>
              <button onClick={onUnfriend} className="w-full text-center p-3.5 text-red-500 text-lg">
                Cancelar a amizade
              </button>
              <div className="h-px bg-gray-600/50 mx-4"></div>
            </>
          )}
          <button onClick={onBlock} className="w-full text-center p-3.5 text-red-500 text-lg">
            Adicionar à lista de bloqueio
          </button>
          <div className="h-px bg-gray-600/50 mx-4"></div>
          <button onClick={onReport} className="w-full text-center p-3.5 text-white text-lg">
            Relatório
          </button>
        </div>
        <button onClick={onClose} className="w-full text-center p-3.5 bg-[#2c2c2e] rounded-xl text-sky-400 text-lg font-semibold">
          Cancelar
        </button>
      </div>
    </div>
  );
};


const Stat: React.FC<{ value: string; label: string; icon?: React.ReactNode }> = ({ value, label, icon }) => (
    <div className="flex flex-col items-center justify-center">
        <p className="font-bold text-xl text-white">{value}</p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
            {icon}
            <p className="text-sm text-gray-400">{label}</p>
        </div>
    </div>
);

const StatButton: React.FC<{ value: string; label: string; onClick: () => void; }> = ({ value, label, onClick }) => (
    <button onClick={onClick} className="text-center w-full hover:bg-gray-700/30 rounded-lg py-2 transition-colors flex flex-col items-center justify-center">
        <p className="font-bold text-xl text-white">{value}</p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
            <p className="text-sm text-gray-400">{label}</p>
        </div>
    </button>
);

type Tab = 'obras' | 'curtidas' | 'detalhes';

const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; }> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 flex-1 pb-2 relative transition-opacity hover:opacity-80">
        <div className={`w-7 h-7 ${isActive ? 'text-purple-400' : 'text-gray-500'}`}>{icon}</div>
        <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-500'}`}>{label}</span>
        {isActive && <div className="absolute bottom-0 w-8 h-1 bg-purple-500 rounded-full"></div>}
    </button>
);


interface EditProfileScreenProps {
  user: User; // The current logged-in user.
  onNavigate?: (view: AppView) => void;
  isViewingOtherProfile: boolean;
  viewedUserId: number;
  onExit: () => void;
  onFollowToggle: (userId: number, optimisticCallback?: (action: 'follow' | 'unfollow') => void) => Promise<void>;
  onNavigateToChat: (userId: number) => void;
  onViewStream?: (stream: Stream | PkBattle) => void;
  onUpdateUser?: (user: User) => void;
  onViewProfile?: (userId: number) => void;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  user,
  viewedUserId,
  onExit,
  onFollowToggle,
  onNavigateToChat,
  onNavigate,
}) => {
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [idCopied, setIdCopied] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('obras');


    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                if (user.id !== viewedUserId) {
                    const blockData = await liveStreamService.isUserBlocked(user.id, viewedUserId);
                    if (blockData.isBlocked) {
                        setIsBlocked(true);
                        setIsLoading(false);
                        return;
                    }
                }
                const data = await liveStreamService.getPublicProfile(viewedUserId, user.id);
                setProfile(data);
                setIsFollowing(data.isFollowing);
            } catch (error) {
                console.error(`Failed to fetch profile for user ${viewedUserId}:`, error);
                // Don't alert here as it might be an expected "not found"
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [viewedUserId, user.id, onExit]);
    
    const handleFollowToggleWrapper = async () => {
        if (!profile) return;
        
        const originalFollowingState = isFollowing;
        setIsFollowing(!originalFollowingState);

        try {
             await onFollowToggle(profile.id, (action) => {
                setProfile(p => p ? {...p, followers: p.followers + (action === 'follow' ? 1 : -1), isFollowing: action === 'follow'} : null);
             });
        } catch(e) {
            setIsFollowing(originalFollowingState);
        }
    };
    
    const handleUnfriend = () => {
        if (profile && isFollowing) {
            handleFollowToggleWrapper();
        }
        setIsOptionsMenuOpen(false);
    };

    const handleBlockUser = async () => {
        if (!profile) return;
        await liveStreamService.blockUser(user.id, profile.id);
        setIsOptionsMenuOpen(false);
        setIsBlocked(true);
    };

    const handleReportUser = () => {
        alert('A funcionalidade de relatório não está implementada.');
        setIsOptionsMenuOpen(false);
    };
    
    const handleUnblock = async () => {
        if (!profile) return;
        await liveStreamService.unblockUser(user.id, profile.id);
        setIsBlocked(false);
    };

    const handleCopyId = () => {
        if (!profile) return;
        navigator.clipboard.writeText(String(profile.id));
        setIdCopied(true);
        setTimeout(() => setIdCopied(false), 2000);
    };

    const formatStatNumber = (num: number) => {
        if (num > 999) {
            return (num / 1000).toFixed(1).replace('.', ',') + ' mil';
        }
        return String(num);
    };
    
    const formatRecebidos = (num: number) => {
         if (num > 999) {
            return (num / 1000).toFixed(2).replace('.', ',') + ' mil';
        }
        return String(num);
    }

    if (isLoading || !profile) {
        return (
            <div className="h-full w-full bg-[#1C1F24] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (isBlocked) {
        return <BlockScreen userName={profile.nickname} onUnblock={handleUnblock} onExit={onExit} bgColor="bg-[#1C1F24]"/>;
    }

    return (
        <div className="h-full w-full bg-black flex flex-col font-sans">
            <header className="absolute top-0 left-0 right-0 z-20 px-4 pt-8 pb-4 flex items-center justify-between">
                <button onClick={onExit} className="p-2 bg-black/30 rounded-full backdrop-blur-sm text-white">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <button onClick={() => setIsOptionsMenuOpen(true)} className="p-2 bg-black/30 rounded-full backdrop-blur-sm text-white">
                    <EllipsisIcon className="w-6 h-6" />
                </button>
            </header>
            
            <ActionSheetMenu
                isOpen={isOptionsMenuOpen}
                onClose={() => setIsOptionsMenuOpen(false)}
                onUnfriend={handleUnfriend}
                onBlock={handleBlockUser}
                onReport={handleReportUser}
                isFollowing={isFollowing}
            />

            <main className="flex-grow overflow-y-auto scrollbar-hide">
                 <div className="relative h-40 bg-gray-800">
                    <img src={profile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                </div>

                <div className="relative px-4 -mt-14">
                     <div className="flex items-end justify-between">
                         <div className="relative w-28 h-28 shrink-0">
                            <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full rounded-full border-4 border-black object-cover" />
                         </div>
                         <button className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-3 py-1.5 rounded-full text-sm shadow-lg">
                            <LiveIndicatorIcon />
                            <span>LIVE</span>
                        </button>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-white mt-3">{profile.nickname}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <span>ID: {profile.id}</span>
                        <button onClick={handleCopyId} title="Copiar ID">
                            {idCopied ? <span className="text-xs text-purple-400">Copiado</span> : <CopyIcon className="w-4 h-4 text-gray-400 hover:text-white" />}
                        </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 my-3">
                        {profile.badges.map((badge, index) => {
                            if(badge.type === 'gender_age' && profile.gender && profile.age) {
                                return (
                                    <div key={index} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${profile.gender === 'female' ? 'bg-[#ff2d55]' : 'bg-[#007aff]'} text-white`}>
                                        {profile.gender === 'female' ? <FemaleIcon className="w-3 h-3" /> : <MaleIcon className="w-3 h-3" />}
                                        <span>{profile.age}</span>
                                    </div>
                                );
                            }
                            return <ProfileBadge key={index} badge={badge} />;
                        })}
                    </div>


                    <div className="grid grid-cols-4 gap-2 my-4">
                        <StatButton value={formatStatNumber(profile.followers)} label="Fãs" onClick={() => onNavigate?.('fans')} />
                        <StatButton value={profile.followingCount.toLocaleString()} label="Seguindo" onClick={() => onNavigate?.('following')} />
                        <Stat value={formatRecebidos(profile.recebidos)} label="Recebidos" icon={<CoinReceivedIcon className="w-3 h-3"/>} />
                        <Stat value={String(profile.enviados)} label="Enviados" icon={<DiamondSentIcon className="w-3 h-3"/>} />
                    </div>

                    <div className="flex items-center justify-around mt-4 border-t border-gray-800 pt-3">
                        <TabButton label="Obras" icon={<PlayOutlineIcon className="w-6 h-6" />} isActive={activeTab === 'obras'} onClick={() => setActiveTab('obras')} />
                        <TabButton label="Curtidas" icon={<ClockIcon className="w-6 h-6" />} isActive={activeTab === 'curtidas'} onClick={() => setActiveTab('curtidas')} />
                        <TabButton label="Detalhes" icon={<MenuIcon className="w-6 h-6" />} isActive={activeTab === 'detalhes'} onClick={() => setActiveTab('detalhes')} />
                    </div>
                    
                    <div className="text-center py-12">
                        {activeTab === 'obras' && <p className="text-gray-500">Nenhuma obra publicada.</p>}
                        {activeTab === 'curtidas' && <p className="text-gray-500">Nenhum conteúdo curtido.</p>}
                        {activeTab === 'detalhes' && <p className="text-gray-500">Detalhes do perfil não disponíveis.</p>}
                    </div>
                </div>
            </main>
             <footer className="p-4 bg-black border-t border-gray-800/50 shrink-0">
                <div className="flex items-center gap-4">
                    {isFollowing ? (
                        <button onClick={() => onNavigateToChat(profile.id)} className="flex-grow py-3 rounded-full font-semibold text-lg text-white transition-colors bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 flex items-center justify-center gap-2">
                            <MessageIcon className="w-6 h-6"/>
                            Conversa
                        </button>
                    ) : (
                        <button onClick={handleFollowToggleWrapper} className="flex-grow py-3 rounded-full font-semibold text-lg transition-colors bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90">
                            Seguir
                        </button>
                    )}
                </div>
            </footer>
             <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                 @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
            `}</style>
        </div>
    );
};
export default EditProfileScreen;