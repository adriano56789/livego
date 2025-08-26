

import React, { useState, useEffect } from 'react';
import type { User, AppView, PublicProfile, Stream, PkBattle } from '../types';
import { getGiftsReceived, getGiftsSent, getUserProfile } from '../services/authService';
import * as liveStreamService from '../services/liveStreamService';

import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PencilIcon from './icons/PencilIcon';
import EllipsisIcon from './icons/EllipsisIcon';
import BrazilFlagIcon from './icons/BrazilFlagIcon';
import MaleIcon from './icons/MaleIcon';
import FemaleIcon from './icons/FemaleIcon';
import StarIcon from './icons/StarIcon';
import CopyIcon from './icons/CopyIcon';
import LocationPinIcon from './icons/LocationPinIcon';
import CoinIcon from './icons/CoinIcon';
import DiamondIcon from './icons/DiamondIcon';
import ClockIcon from './icons/ClockIcon';
import VideoIcon from './icons/VideoIcon';
import MenuIcon from './icons/MenuIcon';
import CheckIcon from './icons/CheckIcon';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';
import BlockScreen from './BlockScreen';
import EmbeddedChatView from './EmbeddedChatView';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import LockSolidIcon from './icons/LockSolidIcon';
import FollowingScreen from './FollowingScreen';
import UsersIcon from './icons/UsersIcon';
import LiveBadge from './LiveBadge';


interface EditProfileScreenProps {
  user: User; // If isOwnProfile, this is the user data. If viewing another profile, this is the current logged-in user.
  onNavigate?: (view: AppView) => void;
  // New props for viewing other profiles
  isViewingOtherProfile?: boolean;
  viewedUserId?: number;
  onExit?: () => void;
  onFollowToggle?: (userId: number, optimisticCallback?: (action: 'follow' | 'unfollow') => void) => Promise<void>;
  onNavigateToChat?: (userId: number) => void;
  onViewStream?: (stream: Stream | PkBattle) => void;
  onUpdateUser?: (user: User) => void;
  onViewProfile?: (userId: number) => void;
}


const Stat: React.FC<{ value: string; label: string; icon?: React.ReactNode; onClick?: () => void; disabled?: boolean; }> = ({ value, label, icon, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled || !onClick} className="text-center w-full p-1 rounded-lg transition-colors hover:enabled:bg-gray-800 disabled:cursor-default">
    <p className="font-bold text-lg text-white">{value}</p>
    <div className="flex items-center justify-center gap-1">
      {icon}
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  </button>
);

const Tab: React.FC<{ label: string; icon: React.ReactNode; active?: boolean; onClick: () => void; }> = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 pb-2 relative w-full">
    {icon}
    <span className={`text-sm font-semibold ${active ? 'text-purple-500' : 'text-gray-400'}`}>{label}</span>
    {active && <div className="absolute bottom-0 w-1/2 h-1 bg-purple-500 rounded-full"></div>}
  </button>
);

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between items-center py-3">
    <span className="text-gray-400">{label}</span>
    <div className="text-white font-semibold">{children}</div>
  </div>
);

const ActionMenu: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onBlock: () => void;
    onReport: () => void;
    onUnfollow: () => void;
    isFollowing: boolean;
}> = ({ isOpen, onClose, onBlock, onReport, onUnfollow, isFollowing }) => {
    if (!isOpen) return null;
    return (
        <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
        >
            <div 
                className="absolute bottom-0 left-0 right-0 bg-[#1c1c1e] rounded-t-xl p-2 animate-slide-up-fast"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-[#2c2c2e] rounded-xl text-lg text-center">
                    {isFollowing && (
                         <>
                            <button onClick={onUnfollow} className="w-full p-3.5 text-red-400">Deixar de Seguir</button>
                            <div className="h-px bg-gray-600/50 mx-4"></div>
                         </>
                    )}
                    <button onClick={onBlock} className="w-full p-3.5 text-red-400">Adicionar à lista de bloqueio</button>
                    <div className="h-px bg-gray-600/50 mx-4"></div>
                    <button onClick={onReport} className="w-full p-3.5 text-white">Denunciar</button>
                </div>
                <button onClick={onClose} className="w-full mt-2 text-center p-3.5 bg-[#2c2c2e] rounded-xl text-blue-400 font-semibold">
                    Cancelar
                </button>
            </div>
             <style>{`
                @keyframes slide-up-fast { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up-fast { animation: slide-up-fast 0.25s ease-out forwards; }
            `}</style>
        </div>
    );
};


const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ 
    user, 
    onNavigate,
    isViewingOtherProfile,
    viewedUserId,
    onExit,
    onFollowToggle,
    onNavigateToChat,
    onViewStream,
    onUpdateUser,
    onViewProfile,
}) => {
  const isOwnProfile = !isViewingOtherProfile;
  const loggedInUser = user;
  
  const [profileData, setProfileData] = useState<User | PublicProfile | null>(isOwnProfile ? user : null);
  const [isLoading, setIsLoading] = useState(!isOwnProfile);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const [idCopied, setIdCopied] = useState(false);
  const [giftsReceived, setGiftsReceived] = useState(0);
  const [giftsSent, setGiftsSent] = useState(0);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  
  const [isFollowing, setIsFollowing] = useState((loggedInUser.following || []).includes(viewedUserId || -1));
  const [activeTab, setActiveTab] = useState<'obras' | 'curtidas' | 'detalhes'>('obras');

  useEffect(() => {
    setIsFollowing((loggedInUser.following || []).includes(viewedUserId || -1));
  }, [loggedInUser.following, viewedUserId]);

  useEffect(() => {
      const fetchData = async () => {
          if (!isOwnProfile && viewedUserId) {
              setIsLoading(true);
              try {
                  const [userToView, received, sent, isBlockedStatus] = await Promise.all([
                    liveStreamService.getPublicProfile(viewedUserId, loggedInUser.id),
                    getGiftsReceived(viewedUserId),
                    getGiftsSent(viewedUserId),
                    liveStreamService.isUserBlocked(loggedInUser.id, viewedUserId),
                  ]);
                  setIsBlocked(isBlockedStatus.isBlocked);
                  setProfileData(userToView);
                  setGiftsReceived(received.totalValue);
                  setGiftsSent(sent.totalValue);
              } catch (error) {
                  console.error("Failed to fetch user profile", error);
                  onExit?.();
              } finally {
                  setIsLoading(false);
              }
          } else if (isOwnProfile) {
              setProfileData(user);
              getGiftsReceived(user.id).then(data => setGiftsReceived(data.totalValue));
              getGiftsSent(user.id).then(data => setGiftsSent(data.totalValue));
          }
      };
      fetchData();
  }, [isOwnProfile, viewedUserId, user, onExit, loggedInUser.id]);

  useEffect(() => {
    if (!isViewingOtherProfile || !viewedUserId) return;

    const pollLiveStatus = async () => {
        // Don't poll if tab is not active or a modal is open
        if (document.visibilityState !== 'visible' || isActionMenuOpen || isBlocked) return; 
        try {
            const isCurrentlyLive = await liveStreamService.getUserLiveStatus(viewedUserId);
            
            setProfileData(prev => {
                if (!prev || !('isLive' in prev) || prev.isLive === isCurrentlyLive) {
                    return prev; // No change needed
                }
                return { ...prev, isLive: isCurrentlyLive };
            });
            
        } catch (error) {
            console.warn("Failed to poll live status, stopping poll.", error);
            clearInterval(intervalId); // Stop polling on error
        }
    };

    const intervalId = setInterval(pollLiveStatus, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [isViewingOtherProfile, viewedUserId, isActionMenuOpen, isBlocked]);
  
  const handleFollowClick = async () => {
    if (isFollowLoading || !onFollowToggle || !profileData) return;
    
    setIsFollowLoading(true);
    try {
        const optimisticCallback = (action: 'follow' | 'unfollow') => {
            if ('followers' in profileData) {
                setProfileData(prevProfile => {
                    if (!prevProfile || !('followers' in prevProfile)) return prevProfile;
                    return {
                        ...prevProfile,
                        followers: prevProfile.followers + (action === 'follow' ? 1 : -1)
                    };
                });
            }
        };
        await onFollowToggle(profileData.id, optimisticCallback);
    } catch (error) {
        console.error("Follow/unfollow failed", error);
    } finally {
        setIsFollowLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!profileData) return;
    setIsActionMenuOpen(false);
    await liveStreamService.blockUser(loggedInUser.id, profileData.id);
    setIsBlocked(true);
  };

  const handleUnblock = async () => {
      if (!profileData) return;
      await liveStreamService.unblockUser(loggedInUser.id, profileData.id);
      setIsBlocked(false);
  };

  const handleReport = async () => {
    if (!profileData) return;
    await liveStreamService.reportUser(loggedInUser.id, profileData.id);
    alert(`Denúncia sobre ${profileData.nickname || profileData.name} foi enviada.`);
    setIsActionMenuOpen(false);
  };

  const handleBackClick = () => {
    if (onExit) {
      onExit();
    }
  };

  const handleStatClick = (view: AppView) => {
    if (onNavigate) {
        onNavigate(view);
    }
  };
    
  const handleEnterLive = async () => {
    if (!profileData || !onViewStream) return;

    try {
        // Use the correct service function that only finds active streams.
        const streamToEnter = await liveStreamService.getActiveStreamForUser(profileData.id);
        
        if (streamToEnter) {
            // Check if it's part of a PK battle
            const pkBattleDb = await liveStreamService.findActivePkBattleForStream(streamToEnter.id);
            if (pkBattleDb) {
                const pkBattle = await liveStreamService.getPkBattleDetails(Number(pkBattleDb.id));
                onViewStream(pkBattle);
            } else {
                onViewStream(streamToEnter);
            }
        } else {
            // If no active stream is found, inform the user and update the UI state.
            alert("O streamer não está ao vivo no momento.");
            if ('isLive' in profileData) {
                setProfileData(prev => {
                    if (!prev || !('isLive' in prev)) return prev;
                    return { ...prev, isLive: false };
                });
            }
        }
    } catch (error) {
        console.error("Failed to enter live stream from profile:", error);
        alert("Ocorreu um erro ao tentar entrar na live.");
    }
  };


  const formatStat = (num: number): string => {
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  const handleCopyId = () => {
    if (!profileData) return;
    navigator.clipboard.writeText(String(profileData.id));
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  if (isLoading || !profileData) {
    return (
        <div className="h-full w-full bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (isBlocked) {
    return (
        <BlockScreen
            userName={profileData.nickname || profileData.name}
            onUnblock={handleUnblock}
            onExit={onExit!}
            bgColor="bg-black"
        />
    );
  }

  // Type-safe accessors for properties that differ or might not exist
  const avatarUrl = 'avatarUrl' in profileData ? profileData.avatarUrl : user.avatar_url;
  const coverPhotoUrl = 'coverPhotoUrl' in profileData ? profileData.coverPhotoUrl : 'https://picsum.photos/seed/default-cover/800/400';
  const isAvatarProtected = 'is_avatar_protected' in profileData && !!profileData.is_avatar_protected;
  const isProfileProtected = 'privacy' in profileData && !!profileData.privacy?.protectionEnabled;
  const level = 'level' in profileData ? profileData.level : parseInt(profileData.badges?.find(b => b.type === 'level')?.text || '1', 10);
  
  const formattedBirthday = profileData.birthday 
    ? new Date(profileData.birthday + 'T00:00:00').toLocaleDateString('pt-BR')
    : 'Não especificado';

  const genderText = profileData.gender === 'male' ? 'Masculino' : profileData.gender === 'female' ? 'Feminino' : 'Não especificado';
  const followersCount = 'followers' in profileData ? profileData.followers : 0;
  const followingCount = 'followingCount' in profileData ? profileData.followingCount : ('following' in profileData && Array.isArray(profileData.following)) ? profileData.following.length : 0;


  return (
    <>
      <div className="h-full w-full bg-black flex flex-col font-sans">
        <header className="relative h-48 bg-gray-800 shrink-0">
          {'coverPhotoUrl' in profileData && profileData.coverPhotoUrl ? (
            <img src={coverPhotoUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-purple-500"></div> // Fallback
          )}
          <div className="absolute inset-0 bg-black/30"></div>
          
          <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-20">
            <button onClick={handleBackClick} className="p-2 -m-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"><ArrowLeftIcon className="w-6 h-6 text-white" /></button>
            <div className="flex items-center gap-3">
                {isOwnProfile && (
                    <>
                        <button onClick={() => onNavigate?.('avatar-protection')} className="p-2 -m-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors" title="Proteção de Avatar">
                            <ShieldCheckIcon className="w-6 h-6 text-white" />
                        </button>
                        <button onClick={() => onNavigate?.('profile-editor')} className="p-2 -m-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors" title="Editar Perfil">
                            <PencilIcon className="w-6 h-6 text-white" />
                        </button>
                    </>
                )}
                {!isOwnProfile && (
                     <button onClick={() => setIsActionMenuOpen(true)} className="p-2 -m-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors">
                        <EllipsisIcon className="w-6 h-6 text-white" />
                     </button>
                )}
            </div>
          </div>
          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-28 h-28 z-10">
            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-400 p-1.5 shadow-lg">
                <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                   {avatarUrl ? (
                        <img src={avatarUrl} alt={profileData.name} className="w-full h-full object-cover" />
                    ) : (
                        <UserPlaceholderIcon className="w-full h-full text-gray-500 p-1" />
                    )}
                </div>
                 {isAvatarProtected ? (
                    <div className="absolute -bottom-2 right-0 w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center border-2 border-black animate-protection-glow">
                        <ShieldCheckIcon className="w-7 h-7 text-black"/>
                    </div>
                ) : !isOwnProfile ? (
                    <div className="absolute -bottom-1 -right-1">
                        <BrazilFlagIcon className="w-8 h-8"/>
                    </div>
                ) : null}
            </div>
          </div>
        </header>

        <main className="relative flex-grow pt-16 px-4 pb-4 overflow-y-auto scrollbar-hide">
          <section className="text-center">
            <div className="flex justify-center items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{profileData.nickname || profileData.name}</h1>
              {'isLive' in profileData && profileData.isLive && (
                <LiveBadge onClick={handleEnterLive} />
              )}
            </div>
            <div className="flex justify-center items-center gap-2 mt-2">
                {isProfileProtected && (
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-blue-500 text-white`}>
                      <LockSolidIcon className="w-3.5 h-3.5"/>
                      <span>Protegido</span>
                  </div>
                )}
                {profileData.gender && <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${profileData.gender === 'female' ? 'bg-[#ff2d55]' : 'bg-[#007aff]'} text-white`}>
                    {profileData.gender === 'female' ? <FemaleIcon className="w-3 h-3"/> : <MaleIcon className="w-3 h-3"/>}
                    <span>{profileData.age || ''}</span>
                </div>}
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-yellow-400 text-black">
                    <StarIcon className="w-3 h-3"/>
                    <span>{level}</span>
                </div>
            </div>
             <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-2">
                <span>ID: {profileData.id}</span>
                <button onClick={handleCopyId} title="Copiar ID" className="flex items-center gap-1">
                    {idCopied ? <CheckIcon className="w-4 h-4 text-green-500"/> : <CopyIcon className="w-4 h-4" />}
                </button>
                <LocationPinIcon className="w-4 h-4" />
                <span>BR</span>
            </div>
          </section>

          <section className="grid grid-cols-4 my-4">
              <Stat value={formatStat(followersCount)} label="Fãs" onClick={() => handleStatClick('fans')} />
              <Stat value={formatStat(followingCount)} label="Seguindo" onClick={() => handleStatClick('following')} />
              <Stat value={formatStat(giftsReceived)} label="Recebidos" icon={<CoinIcon className="w-3 h-3 text-yellow-500"/>} />
              <Stat value={formatStat(giftsSent)} label="Enviados" icon={<DiamondIcon className="w-3 h-3"/>} />
          </section>

          <section className="border-t border-gray-800/50">
             <div className="grid grid-cols-3">
                 <Tab label="Obras" icon={<VideoIcon className="w-6 h-6"/>} active={activeTab === 'obras'} onClick={() => setActiveTab('obras')} />
                 <Tab label="Curtidas" icon={<ClockIcon className="w-6 h-6"/>} active={activeTab === 'curtidas'} onClick={() => setActiveTab('curtidas')} />
                 <Tab label="Detalhes" icon={<MenuIcon className="w-6 h-6"/>} active={activeTab === 'detalhes'} onClick={() => setActiveTab('detalhes')} />
             </div>
             <div className="pt-2">
                {activeTab === 'obras' && (
                    <div className="pt-10 text-center text-gray-500">
                        Nenhuma obra publicada.
                    </div>
                )}
                {activeTab === 'curtidas' && (
                    <div className="pt-10 text-center text-gray-500">
                        Nenhuma curtida encontrada.
                    </div>
                )}
                {activeTab === 'detalhes' && (
                    <div className="divide-y divide-gray-800/50">
                        {profileData.personalSignature && (
                            <div className="py-4">
                                <p className="text-white font-medium">{profileData.personalSignature}</p>
                            </div>
                        )}
                        <DetailRow label="Aniversário">{formattedBirthday}</DetailRow>
                        <DetailRow label="Gênero">{genderText}</DetailRow>
                        {isOwnProfile && <DetailRow label="Residência atual">{(profileData as User).country || 'Não especificado'}</DetailRow>}
                        {isOwnProfile && <DetailRow label="Estado emocional">{(profileData as User).emotionalState || 'Não especificado'}</DetailRow>}
                        {profileData.personalityTags && profileData.personalityTags.length > 0 && (
                            <div className="py-4">
                                <span className="text-gray-400">Tags de personalidade</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {profileData.personalityTags.map(tag => (
                                        <span key={tag.id} className="bg-gray-700 text-gray-200 text-sm px-3 py-1 rounded-full">{tag.label}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {isOwnProfile && <DetailRow label="Profissão">{(profileData as User).profession || 'Não especificado'}</DetailRow>}
                        {isOwnProfile && <DetailRow label="Língua dominada">{((profileData as User).languages && (profileData as User).languages?.join(', ')) || 'Não especificado'}</DetailRow>}
                        {isOwnProfile && <DetailRow label="Altura">{(profileData as User).height ? `${(profileData as User).height} cm` : 'Não especificado'}</DetailRow>}
                        {isOwnProfile && <DetailRow label="Peso corporal">{(profileData as User).weight ? `${(profileData as User).weight} Kg` : 'Não especificado'}</DetailRow>}
                    </div>
                )}
             </div>
          </section>
        </main>
        
        {!isOwnProfile && (
          <footer className="p-4 bg-black border-t border-gray-800/50 shrink-0">
              <div className="flex items-center justify-center gap-4">
                  <button
                      onClick={() => onNavigateToChat?.(profileData.id)}
                      className="py-3.5 px-8 rounded-full font-semibold transition-colors bg-[#2c2c2e] text-gray-300 hover:bg-gray-700"
                  >
                      Conversar
                  </button>
                  <button
                      onClick={handleFollowClick}
                      disabled={isFollowLoading}
                      className={`flex-grow py-3.5 rounded-full font-semibold transition-colors text-white disabled:opacity-70 ${
                        isFollowing
                          ? 'bg-blue-600 hover:bg-blue-500'
                          : 'bg-purple-600 hover:bg-purple-500'
                      }`}
                  >
                      {isFollowLoading ? 'Aguarde...' : (isFollowing ? 'Seguindo' : 'Seguir')}
                  </button>
              </div>
          </footer>
        )}
      </div>
      {!isOwnProfile && (
        <ActionMenu 
            isOpen={isActionMenuOpen}
            onClose={() => setIsActionMenuOpen(false)}
            onBlock={handleBlock}
            onReport={handleReport}
            onUnfollow={() => {
                setIsActionMenuOpen(false);
                handleFollowClick();
            }}
            isFollowing={isFollowing}
        />
      )}
    </>
  );
};

export default EditProfileScreen;