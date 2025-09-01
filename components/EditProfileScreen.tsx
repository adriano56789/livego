

import React, { useState, useEffect, useCallback } from 'react';
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
import PencilIcon from './icons/PencilIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import CrownIcon from './icons/CrownIcon';


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
  onViewStream,
}) => {
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [idCopied, setIdCopied] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('obras');

    const isOwnProfile = user.id === viewedUserId;

    useEffect(() => {
        if (!viewedUserId) {
            setIsLoading(false);
            console.error("EditProfileScreen was rendered without a viewedUserId.");
            return;
        }
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
                setProfile(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [viewedUserId, user.id]);
    
    const handleEnterLive = useCallback(async () => {
        if (!profile || !profile.isLive || !onViewStream) return;
        try {
            const streamToEnter = await liveStreamService.getActiveStreamForUser(profile.id);
            if (streamToEnter) {
                const pkBattleDb = await liveStreamService.findActivePkBattleForStream(streamToEnter.id);
                if (pkBattleDb) {
                    const pkBattle = await liveStreamService.getPkBattleDetails(Number(pkBattleDb.id));
                    onViewStream(pkBattle);
                } else {
                    onViewStream(streamToEnter);
                }
            } else {
                alert("Não foi possível encontrar a transmissão ao vivo do usuário.");
            }
        } catch (error) {
            console.error("Failed to enter live stream:", error);
            alert("Ocorreu um erro ao tentar entrar na transmissão.");
        }
    }, [profile, onViewStream]);

    const handleFollowToggleWrapper = async () => {
        if (!profile) {
            return;
        }
        
        setIsFollowLoading(true);
        const originalFollowingState = isFollowing;
        setIsFollowing(!originalFollowingState);

        try {
             await onFollowToggle(profile.id, (action) => {
                setProfile(p => p ? {...p, followers: p.followers + (action === 'follow' ? 1 : -1), isFollowing: action === 'follow'} : null);
             });
        } catch(e) {
            setIsFollowing(originalFollowingState);
        } finally {
            setIsFollowLoading(false);
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
    
    const handleNavigateToChatWrapper = () => {
        if (profile) {
            onNavigateToChat(profile.id);
        }
    };

    const formatStatNumber = (num: number) => {
        if (num > 999) {
            return (num / 1000).toFixed(1).replace('.', ',') + ' mil';
        }
        return String(num);
    };
    
    const formatRecebidos = (num: number) => {
         if (num > 999999) { // Milhões
            return (num / 1000000).toFixed(2).replace('.', ',') + ' mi';
         }
         if (num > 999) { // Mil
            return (num / 1000).toFixed(2).replace('.', ',') + ' mil';
        }
        return String(num);
    }

    if (isLoading) {
        return (
            <div className="h-full w-full bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile) {
        return (
             <div className="h-full w-full bg-black flex flex-col font-sans">
                 <header className="relative h-48">
                    <img src="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg" alt="Cover" className="w-full h-full object-cover opacity-30 blur-sm"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                        <button onClick={onExit} className="p-2 bg-black/40 rounded-full backdrop-blur-sm"><ArrowLeftIcon className="w-6 h-6 text-white"/></button>
                    </div>
                </header>
                <main className="px-4 pb-4 text-center flex-grow flex flex-col items-center justify-center -mt-16">
                     <h1 className="text-2xl font-bold text-red-400">Erro ao carregar perfil</h1>
                     <p className="text-gray-400 mt-2">Não foi possível encontrar o usuário. Por favor, volte e tente novamente.</p>
                </main>
            </div>
        );
    }
    
    if (isBlocked) {
        return <BlockScreen userName={profile.nickname} onUnblock={handleUnblock} onExit={onExit} bgColor="bg-black" />;
    }

    return (
      <>
        <div className="h-full w-full bg-black flex flex-col font-sans">
            <div className="flex-grow overflow-y-auto scrollbar-hide">
                <header className="relative h-48">
                    <img src={profile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                        <button onClick={onExit} className="p-2 bg-black/40 rounded-full backdrop-blur-sm"><ArrowLeftIcon className="w-6 h-6 text-white"/></button>
                        <div className="flex items-center gap-2">
                           {isOwnProfile && (
                                <button onClick={() => onNavigate?.('profile-editor')} className="p-2 bg-black/40 rounded-full backdrop-blur-sm" aria-label="Editar perfil">
                                    <PencilIcon className="w-6 h-6 text-white"/>
                                </button>
                            )}
                           <button onClick={() => setIsOptionsMenuOpen(true)} className="p-2 bg-black/40 rounded-full backdrop-blur-sm"><EllipsisIcon className="w-6 h-6 text-white"/></button>
                        </div>
                    </div>

                    <div className="absolute -bottom-10 left-4">
                        <div className="w-24 h-24 rounded-full border-4 border-black bg-gray-800 overflow-hidden">
                            <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" />
                        </div>
                    </div>
                     {profile.isLive && (
                         <button 
                            onClick={handleEnterLive} 
                            className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-pink-500/80 backdrop-blur-sm text-white font-bold px-3 py-1.5 rounded-full text-sm hover:bg-pink-600/80 transition-colors">
                            <LiveIndicatorIcon />
                            <span>LIVE</span>
                         </button>
                     )}
                </header>

                <main className="px-4 pb-4">
                    <div className="mt-12">
                        <h1 className="text-2xl font-bold text-white">{profile.nickname}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <span>ID: {profile.id}</span>
                            <button onClick={handleCopyId} title="Copiar ID">
                                {idCopied ? <span className="text-xs text-lime-400">Copiado</span> : <CopyIcon className="w-4 h-4 text-gray-500 hover:text-white" />}
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {profile.badges?.map((badge, index) => (
                                <ProfileBadge key={index} badge={badge} />
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 my-6 text-center">
                        <StatButton value={formatStatNumber(profile.followers)} label="Fãs" onClick={() => onNavigate?.('fans')} />
                        <StatButton value={formatStatNumber(profile.followingCount)} label="Seguindo" onClick={() => onNavigate?.('following')} />
                         <Stat value={formatRecebidos(profile.recebidos)} label="Recebidos" icon={<CoinReceivedIcon />} />
                        <Stat value={formatStatNumber(profile.enviados)} label="Enviados" icon={<DiamondSentIcon />} />
                    </div>

                    {profile.topFans && profile.topFans.length > 0 && (
                        <button
                            onClick={() => onNavigate?.('top-fans')}
                            className="w-full bg-[#2c2c2e] rounded-lg p-3 -mt-2 mb-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
                        >
                            <span className="font-semibold text-white">Top fãs</span>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center -space-x-4">
                                    {profile.topFans.map((fan) => (
                                        <div key={fan.userId} className="relative">
                                            <img
                                                src={fan.avatarUrl}
                                                alt={fan.name}
                                                className="w-9 h-9 rounded-full border-2 border-black object-cover"
                                            />
                                            {fan.rank === 1 && <CrownIcon className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 text-yellow-400" />}
                                        </div>
                                    ))}
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                            </div>
                        </button>
                    )}

                    <div className="w-full h-px bg-gray-800 my-4"></div>

                     <div className="flex justify-around items-center">
                        <TabButton label="Obras" icon={<PlayOutlineIcon />} isActive={activeTab === 'obras'} onClick={() => setActiveTab('obras')} />
                        <TabButton label="Curtidas" icon={<ClockIcon />} isActive={activeTab === 'curtidas'} onClick={() => setActiveTab('curtidas')} />
                        <TabButton label="Detalhes" icon={<MenuIcon />} isActive={activeTab === 'detalhes'} onClick={() => setActiveTab('detalhes')} />
                    </div>
                </main>
                <div className="text-center text-gray-600 py-10">
                    <p>Nenhuma obra publicada.</p>
                </div>
            </div>
            
            <footer className="p-4 bg-black border-t border-gray-800/50 shrink-0">
                {isFollowing ? (
                    <button
                        onClick={handleNavigateToChatWrapper}
                        className="w-full py-3.5 rounded-full font-semibold transition-colors bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white"
                    >
                        Conversar
                    </button>
                ) : (
                    <button
                        onClick={handleFollowToggleWrapper}
                        disabled={isFollowLoading}
                        className="w-full py-3.5 rounded-full font-semibold transition-colors bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white disabled:opacity-50"
                    >
                        {isFollowLoading ? '...' : 'Seguir'}
                    </button>
                )}
            </footer>
        </div>

        <ActionSheetMenu 
            isOpen={isOptionsMenuOpen}
            onClose={() => setIsOptionsMenuOpen(false)}
            isFollowing={isFollowing}
            onUnfriend={handleUnfriend}
            onBlock={handleBlockUser}
            onReport={handleReportUser}
        />
      </>
    );
};

export default EditProfileScreen;