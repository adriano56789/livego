
import React, { useState, useEffect } from 'react';
import type { User, AppView, PublicProfile, Stream, PkBattle } from '../types';
import * as liveStreamService from '../services/liveStreamService';

import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PencilIcon from './icons/PencilIcon';
import EllipsisIcon from './icons/EllipsisIcon';
import MaleIcon from './icons/MaleIcon';
import FemaleIcon from './icons/FemaleIcon';
import CopyIcon from './icons/CopyIcon';
import CoinIcon from './icons/CoinIcon';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';
import BlockScreen from './BlockScreen';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import LiveBadge from './LiveBadge';
import ProfileBadge from './ProfileBadge';
import PlayOutlineIcon from './icons/PlayOutlineIcon';
import ClockIcon from './icons/ClockIcon';
import MenuIcon from './icons/MenuIcon';
import DiamondIcon from './icons/DiamondIcon';


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
    <div className={`${active ? 'text-purple-400' : 'text-gray-400'}`}>{icon}</div>
    <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-400'}`}>{label}</span>
    {active && <div className="absolute bottom-0 w-1/2 h-1 bg-purple-400 rounded-full"></div>}
  </button>
);

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between items-center py-3">
    <span className="text-gray-400">{label}</span>
    <div className="text-white font-semibold">{children}</div>
  </div>
);

interface ActionMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onBlock: () => void;
    onReport: () => void;
    onUnfollow: () => void;
    isFollowing: boolean;
    isFriend: boolean;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ isOpen, onClose, onBlock, onReport, onUnfollow, isFollowing, isFriend }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={onClose}>
            <div className="bg-[#1c1c1e] w-full rounded-t-xl" onClick={e => e.stopPropagation()}>
                {isFollowing && (
                    <>
                        <button onClick={onUnfollow} className="w-full text-center p-4 text-red-500 text-lg">
                            {isFriend ? 'Cancelar Amizade' : 'Deixar de Seguir'}
                        </button>
                        <div className="h-px bg-gray-600/50 mx-4"></div>
                    </>
                )}
                <button onClick={onBlock} className="w-full text-center p-4 text-red-500 text-lg">
                    Adicionar à lista de bloqueio
                </button>
                <div className="h-px bg-gray-600/50 mx-4"></div>
                <button onClick={onReport} className="w-full text-center p-4 text-red-500 text-lg">
                    Denunciar
                </button>
                <div className="h-2 bg-black/50"></div>
                <button onClick={onClose} className="w-full text-center p-4 text-white text-lg font-semibold">
                    Cancelar
                </button>
            </div>
        </div>
    );
};

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  user,
  onNavigate,
  isViewingOtherProfile = false,
  viewedUserId,
  onExit,
  onFollowToggle,
  onNavigateToChat,
  onViewStream,
}) => {
    const userIdToView = isViewingOtherProfile ? viewedUserId : user.id;

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [activeTab, setActiveTab] = useState<'obras' | 'curtidas' | 'detalhes'>('obras');
    const [idCopied, setIdCopied] = useState(false);
    const [optimisticFollowerCount, setOptimisticFollowerCount] = useState<number | null>(null);

    const isOwnProfile = user.id === userIdToView;

    useEffect(() => {
        if (!userIdToView) {
            onExit?.();
            return;
        }

        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                if (!isOwnProfile) {
                    const blockData = await liveStreamService.isUserBlocked(user.id, userIdToView);
                    if (blockData.isBlocked) {
                        setIsBlocked(true);
                        setIsLoading(false);
                        return;
                    }
                }

                const data = await liveStreamService.getPublicProfile(userIdToView, user.id);
                setProfile(data);
                setOptimisticFollowerCount(data.followers);
            } catch (error) {
                console.error(`Failed to fetch profile for user ${userIdToView}:`, error);
                if (onExit) {
                  alert("Não foi possível carregar o perfil.");
                  onExit();
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [userIdToView, user.id, onExit, isOwnProfile]);

    const handleFollowToggleWrapper = async () => {
        if (!profile || !onFollowToggle) return;

        await onFollowToggle(profile.id, (action) => {
            setOptimisticFollowerCount(currentCount => {
                if (currentCount === null) return null;
                return action === 'follow' ? currentCount + 1 : currentCount - 1;
            });
             setProfile(p => p ? {...p, isFollowing: !p.isFollowing, isFriend: action === 'follow' ? p.isFriend : false} : null);
        });
    };

    const handleEnterLive = async () => {
        if (!profile || !profile.isLive || !onViewStream) return;
        const activeStream = await liveStreamService.getActiveStreamForUser(profile.id);
        if (activeStream) {
            const pkBattleDb = await liveStreamService.findActivePkBattleForStream(activeStream.id);
            if (pkBattleDb) {
                const pkBattle = await liveStreamService.getPkBattleDetails(Number(pkBattleDb.id));
                onViewStream(pkBattle);
            } else {
                onViewStream(activeStream);
            }
        }
    };
    
    const handleBlock = async () => {
        if (!profile) return;
        await liveStreamService.blockUser(user.id, profile.id);
        setIsActionsMenuOpen(false);
        setIsBlocked(true);
    };

    const handleReport = () => {
        if (!profile) return;
        liveStreamService.reportUser(user.id, profile.id);
        alert(`Denúncia sobre ${profile.nickname} enviada.`);
        setIsActionsMenuOpen(false);
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

    if (isLoading || !profile) {
        return (
            <div className="h-full w-full bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (isBlocked) {
        return <BlockScreen userName={profile.nickname} onUnblock={handleUnblock} onExit={onExit || (() => {})} />;
    }

    const followerCount = optimisticFollowerCount !== null ? optimisticFollowerCount : profile.followers;

    const renderHeaderButtons = () => {
        if (isOwnProfile) {
            return (
                 <div className="flex items-center gap-3">
                    <button onClick={() => onNavigate?.('avatar-protection')} className="p-2 bg-black/30 rounded-full backdrop-blur-sm">
                        <ShieldCheckIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => onNavigate?.('profile-editor')} className="p-2 bg-black/30 rounded-full backdrop-blur-sm">
                        <PencilIcon className="w-6 h-6" />
                    </button>
                </div>
            )
        }
        return (
            <button onClick={() => setIsActionsMenuOpen(true)} className="p-2 bg-black/30 rounded-full backdrop-blur-sm">
                <EllipsisIcon className="w-6 h-6" />
            </button>
        )
    }

    return (
        <div className="h-full w-full bg-black flex flex-col text-white font-sans">
            <header className="absolute top-0 left-0 right-0 z-20 px-4 pt-8 pb-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
                <button onClick={onExit} className="p-2 bg-black/30 rounded-full backdrop-blur-sm">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                {renderHeaderButtons()}
            </header>

            <main className="flex-grow overflow-y-auto scrollbar-hide">
                 <div className="h-48 bg-purple-900">
                    <img src={profile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover"/>
                 </div>
                 <div className="p-4 -mt-16 relative">
                    <div className="flex justify-between items-end">
                        <div className="relative w-28 h-28">
                             <div className={`w-28 h-28 rounded-full border-4 border-black overflow-hidden shrink-0 bg-gray-700 flex items-center justify-center ${profile.is_avatar_protected ? 'animate-protection-glow' : ''}`}>
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" />
                                ) : (
                                    <UserPlaceholderIcon className="w-24 h-24 text-gray-500" />
                                )}
                            </div>
                            {profile.is_avatar_protected && (
                                 <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-sky-400 rounded-full flex items-center justify-center border-2 border-black">
                                    <ShieldCheckIcon className="w-5 h-5 text-black"/>
                                </div>
                            )}
                        </div>
                         {profile.isLive && <LiveBadge onClick={handleEnterLive} />}
                    </div>

                    <h1 className="text-2xl font-bold mt-4">{isOwnProfile ? 'Seu Perfil' : profile.nickname}</h1>

                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-2">
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

                    <div className="grid grid-cols-4 gap-2 my-6">
                        <Stat value={followerCount.toLocaleString()} label="Fãs" onClick={() => onNavigate?.('fans')} />
                        <Stat value={profile.followingCount.toLocaleString()} label="Seguindo" onClick={() => onNavigate?.('following')} />
                        <Stat value={(profile.recebidos || 0).toLocaleString()} label="Recebidos" icon={<CoinIcon className="w-4 h-4 text-orange-400" />} />
                        <Stat value={(profile.enviados || 0).toLocaleString()} label="Enviados" icon={<DiamondIcon className="w-4 h-4" />} />
                    </div>


                    {!isOwnProfile && (
                         <div className="flex items-center gap-2">
                            <button onClick={() => onNavigateToChat?.(profile.id)} className="w-full py-3.5 rounded-full font-semibold transition-colors bg-[#2c2c2e] text-white hover:bg-gray-700">Mensagem</button>
                            <button onClick={handleFollowToggleWrapper} className={`w-full py-3.5 rounded-full font-semibold transition-colors ${profile.isFollowing ? 'bg-gray-600 text-gray-200' : 'bg-green-500 text-black'}`}>
                                {profile.isFollowing ? 'Seguindo' : 'Seguir'}
                            </button>
                         </div>
                    )}
                    
                     <div className="flex justify-around border-b border-gray-800 mt-6">
                        <Tab label="Obras" icon={<PlayOutlineIcon className="w-6 h-6"/>} active={activeTab === 'obras'} onClick={() => setActiveTab('obras')} />
                        <Tab label="Curtidas" icon={<ClockIcon className="w-6 h-6"/>} active={activeTab === 'curtidas'} onClick={() => setActiveTab('curtidas')} />
                        <Tab label="Detalhes" icon={<MenuIcon className="w-6 h-6"/>} active={activeTab === 'detalhes'} onClick={() => setActiveTab('detalhes')} />
                    </div>

                     {activeTab === 'obras' && (
                        <div className="py-8 text-center text-gray-500">
                           <p>Nenhuma obra publicada.</p>
                        </div>
                     )}
                     {activeTab === 'curtidas' && (
                        <div className="py-8 text-center text-gray-500">
                           <p>Nenhum item curtido.</p>
                        </div>
                     )}
                     {activeTab === 'detalhes' && (
                        <div className="py-4">
                           {profile.personalSignature && <p className="text-gray-300 italic mb-4">{profile.personalSignature}</p>}
                           <p className="text-sm text-gray-500">Detalhes do perfil aparecerão aqui.</p>
                        </div>
                     )}
                 </div>
            </main>
            
            <ActionMenu 
                isOpen={isActionsMenuOpen}
                onClose={() => setIsActionsMenuOpen(false)}
                onBlock={handleBlock}
                onReport={handleReport}
                onUnfollow={handleFollowToggleWrapper}
                isFollowing={profile.isFollowing}
                isFriend={profile.isFriend}
            />
        </div>
    );
};
export default EditProfileScreen;
