

import React, { useState, useEffect } from 'react';
import type { PublicProfile, Stream, PkBattle, User } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import EllipsisIcon from './icons/EllipsisIcon';
import ActionsModal from './ActionsModal';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import ProfileBadge from './ProfileBadge';
import CopyIcon from './icons/CopyIcon';
import BlockScreen from './BlockScreen';
import SpiderIcon from './icons/SpiderIcon';
import ButterflyIcon from './icons/ButterflyIcon';
import CrownIcon from './icons/CrownIcon';
import ProtectIcon from './icons/ProtectIcon';
import AchievementBadge from './AchievementBadge';
import PersonalSignatureIcon from './icons/PersonalSignatureIcon';
import LightningIcon from './icons/LightningIcon';
import PineappleIcon from './icons/PineappleIcon';
import MoonIcon from './icons/MoonIcon';
import CoinIcon from './icons/CoinIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import SunglassesIcon from './icons/SunglassesIcon';
import GamepadIcon from './icons/GamepadIcon';
import PleadingFaceIcon from './icons/PleadingFaceIcon';
import JellyfishIcon from './icons/JellyfishIcon';
import WaveIcon from './icons/WaveIcon';
import SadButRelievedIcon from './icons/SadButRelievedIcon';
import EmbeddedChatView from './EmbeddedChatView';
import UserPlaceholderIcon from './icons/UserPlaceholderIcon';

interface UserProfileModalProps {
  userId: number;
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onClose: () => void;
  onNavigateToChat: (userId: number) => void;
  onViewProtectors: (userId: number) => void;
  onViewStream: (stream: Stream | PkBattle) => void;
}

const ProfileSection: React.FC<{ title: string; children: React.ReactNode; isLink?: boolean; icon?: React.ReactNode; onClick?: () => void }> = ({ title, children, isLink, icon, onClick }) => (
    <section className="mt-6">
        <button onClick={onClick} disabled={!onClick} className="w-full text-left">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="font-bold text-gray-200">{title}</h2>
                </div>
                {isLink && <span className="text-sm text-gray-500 font-bold">&gt;</span>}
            </div>
            <div>{children}</div>
        </button>
    </section>
);


const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, currentUser, onUpdateUser, onClose, onNavigateToChat, onViewProtectors, onViewStream }) => {
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [idCopied, setIdCopied] = useState(false);
    const [isFollowing, setIsFollowing] = useState((currentUser.following || []).includes(userId));
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const isOwnProfile = currentUser.id === userId;

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const data = await liveStreamService.getPublicProfile(userId);
                setProfile(data);
                setIsFollowing((currentUser.following || []).includes(data.id));
            } catch (error) {
                console.error(`Failed to fetch profile for user ${userId}:`, error);
                onClose(); // Close if profile not found
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [userId, onClose, currentUser.following]);

    const handleEnterLive = async () => {
        if (!profile || !profile.isLive) return;

        const activeStream = await liveStreamService.getActiveStreamForUser(profile.id);
        if (activeStream) {
            const pkBattleDb = await liveStreamService.findActivePkBattleForStream(activeStream.id);
            if (pkBattleDb) {
                const pkBattle = await liveStreamService.getPkBattleDetails(Number(pkBattleDb.id));
                onViewStream(pkBattle);
            } else {
                onViewStream(activeStream);
            }
            onClose(); // Close the profile modal
        } else {
            alert("Não foi possível encontrar a live ativa para este usuário.");
        }
    };
    
    const handleCopyId = () => {
        if (!profile) return;
        navigator.clipboard.writeText(profile.id.toString());
        setIdCopied(true);
        setTimeout(() => setIdCopied(false), 2000);
    };
    
    const handleFollowToggle = async () => {
        if (isOwnProfile) {
            alert('Você não pode seguir a si mesmo.');
            return;
        }

        setIsFollowLoading(true);
        const previousFollowingState = isFollowing;
        setIsFollowing(!previousFollowingState); // Optimistic update

        try {
            const updatedUser = previousFollowingState
                ? await liveStreamService.unfollowUser(currentUser.id, userId)
                : await liveStreamService.followUser(currentUser.id, userId);
            
            onUpdateUser(updatedUser); // Sync with global state
        } catch (error) {
            console.error("Follow/unfollow action failed in profile modal:", error);
            alert(`Ocorreu um erro: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
            setIsFollowing(previousFollowingState); // Revert UI on error
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleBlock = () => {
        if (!profile) return;
        liveStreamService.blockUser(currentUser.id, profile.id);
        setIsActionsModalOpen(false);
        setIsBlocked(true);
    };
    
    const handleReport = () => {
        if (!profile) return;
        liveStreamService.reportUser(currentUser.id, profile.id);
        alert(`Denúncia sobre ${profile.name} enviada.`);
        setIsActionsModalOpen(false);
    };

    const handleUnblock = async () => {
        if (!profile) return;
        try {
            await liveStreamService.unblockUser(currentUser.id, profile.id);
            setIsBlocked(false);
        } catch (err) {
            console.error("Failed to unblock user:", err);
            alert("Não foi possível desbloquear o usuário. Tente novamente.");
        }
    };
    
    const handleViewProfile = () => {
        setIsActionsModalOpen(false);
    };
    
    const renderNickname = (nickname: string) => {
        const name = nickname.replace(/🕷️|🦋|⚡|🍍|💡|😎|🎮|🥺|🐍|🌊|😥/g, '').trim();
        return (
            <h1 className="text-2xl font-bold flex items-center gap-1.5">
                <span>{name}</span>
                {nickname.includes('🕷️') && <SpiderIcon className="w-5 h-5 text-gray-300" />}
                {nickname.includes('🦋') && <ButterflyIcon className="w-5 h-5 text-purple-400" />}
                {nickname.includes('⚡') && <LightningIcon className="w-5 h-5 text-yellow-400" />}
                {nickname.includes('🍍') && <PineappleIcon className="w-5 h-5 text-yellow-400" />}
                {nickname.includes('💡') && <LightbulbIcon className="w-5 h-5 text-yellow-300" />}
                {nickname.includes('😎') && <SunglassesIcon className="w-5 h-5" />}
                {nickname.includes('🎮') && <GamepadIcon className="w-5 h-5 text-purple-400" />}
                {nickname.includes('🥺') && <PleadingFaceIcon className="w-5 h-5" />}
                {nickname.includes('🐍') && <JellyfishIcon className="w-5 h-5 text-cyan-400" />}
                {nickname.includes('🌊') && <WaveIcon className="w-5 h-5 text-blue-400" />}
                {nickname.includes('😥') && <SadButRelievedIcon className="w-5 h-5" />}
            </h1>
        );
    };
    
     const renderStatIcon = (iconType: PublicProfile['stats']['icon']) => {
        const icons = {
            coin: <CoinIcon className="w-5 h-5 text-yellow-400" />,
            moon: <MoonIcon className="w-5 h-5 text-yellow-400" />,
            crown: <>
                <CrownIcon className="w-5 h-5 text-yellow-400" />
                <CrownIcon className="w-5 h-5 text-yellow-400 -ml-3" />
            </>
        };
        return icons[iconType] || null;
    }

    const otherUserProfileForModal: PublicProfile | null = profile ? { ...profile } : null;

    if (isLoading || !profile) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (isBlocked) {
        return (
            <div className="fixed inset-0 z-50 bg-black animate-fade-in">
                 <BlockScreen
                    userName={profile.nickname}
                    onUnblock={handleUnblock}
                    onExit={onClose}
                    bgColor="bg-transparent"
                />
            </div>
        );
    }

    return (
        <div 
          className="fixed inset-0 z-50 bg-black w-full h-screen flex flex-col font-sans animate-fade-in"
        >
          {/* Scrollable Content */}
          <div className="flex-grow overflow-y-auto scrollbar-hide">
              <div className="relative">
                  <header className="absolute top-0 left-0 right-0 z-20 px-4 pt-8 pb-4 flex items-center justify-between">
                      <button onClick={onClose} className="p-2 bg-black/30 rounded-full backdrop-blur-sm">
                          <ArrowLeftIcon className="w-6 h-6" />
                      </button>
                      <button onClick={() => setIsActionsModalOpen(true)} className="p-2 bg-black/30 rounded-full backdrop-blur-sm">
                          <EllipsisIcon className="w-6 h-6" />
                      </button>
                  </header>
                  <div className="h-48 bg-black">
                      <img src={profile.coverPhotoUrl} alt={`${profile.name}'s cover`} className="w-full h-full object-cover" />
                  </div>
                  
                  <main className="bg-black p-4 -mt-16">
                      <div className="relative w-28 h-28">
                          <div className="w-28 h-28 rounded-full border-4 border-black overflow-hidden shrink-0 bg-gray-700 flex items-center justify-center">
                              {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                              ) : (
                                <UserPlaceholderIcon className="w-24 h-24 text-gray-500" />
                              )}
                          </div>
                      </div>

                      <div className="mt-4">
                          {renderNickname(profile.nickname)}
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-2">
                          {renderStatIcon(profile.stats.icon)}
                          <span className="font-bold text-base text-white">{profile.stats.value.toLocaleString('pt-BR')}</span>
                          <QuestionMarkIcon className="w-4 h-4 text-gray-500 ml-1" />
                      </div>
                      
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
                      
                      {profile.isLive && (
                          <div className="mt-4 p-3 bg-[#1c1c1c] rounded-lg flex justify-between items-center">
                              <span className="font-semibold text-white">Ao vivo</span>
                              <button onClick={handleEnterLive} className="text-gray-400 font-bold text-sm">Entrar &gt;</button>
                          </div>
                      )}

                      <ProfileSection title="Proteger" isLink icon={<ProtectIcon className="w-6 h-6"/>} onClick={() => onViewProtectors(profile.id)}>
                          {profile.protectors && profile.protectors.length > 0 ? (
                              <div className="flex items-center -space-x-3">
                                  {profile.protectors.slice(0, 5).map((protector) => (
                                      <img
                                          key={protector.userId}
                                          src={protector.avatarUrl}
                                          alt={protector.name}
                                          className="w-8 h-8 rounded-full border-2 border-black object-cover"
                                          title={protector.name}
                                      />
                                  ))}
                              </div>
                          ) : (
                              <p className="text-gray-400 text-sm">Ninguém protege esta pessoa ainda.</p>
                          )}
                      </ProfileSection>

                      <ProfileSection title="Tags de personalidade">
                          {profile.personalityTags && profile.personalityTags.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                  {profile.personalityTags.map(tag => (
                                      <span key={tag.id} className="bg-[#2c2c2e] text-gray-300 text-sm px-3 py-1.5 rounded-full">
                                          {tag.label}
                                      </span>
                                  ))}
                              </div>
                          ) : (
                              <p className="text-gray-400 text-sm">Nenhuma tag de personalidade adicionada.</p>
                          )}
                      </ProfileSection>

                      <ProfileSection title="Assinatura pessoal" icon={<PersonalSignatureIcon className="w-5 h-5 text-gray-400" />}>
                          <p className="text-gray-200 text-sm">{profile.personalSignature}</p>
                      </ProfileSection>
                  </main>
              </div>
          </div>

          <footer className="p-4 bg-black border-t border-gray-800/50 shrink-0">
              <div className="flex items-center justify-center gap-4">
                  <button 
                      onClick={() => setIsChatOpen(true)}
                      className="w-full py-3.5 rounded-full font-semibold transition-colors bg-[#2c2c2e] text-gray-300 hover:bg-gray-700"
                  >
                      Bate-papo
                  </button>
                  <button 
                      onClick={handleFollowToggle} 
                      disabled={isFollowLoading || isOwnProfile}
                      className={`w-full py-3.5 rounded-full font-semibold transition-colors ${isFollowing ? 'bg-gray-600' : 'bg-[#34C759]'} ${isFollowing ? 'text-gray-200' : 'text-black'} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                      {isFollowLoading ? 'Aguarde...' : (isFollowing ? 'Seguindo' : 'Seguir')}
                  </button>
              </div>
          </footer>
          
          {isChatOpen && profile && (
              <EmbeddedChatView 
                  currentUser={currentUser}
                  otherUser={profile}
                  onClose={() => setIsChatOpen(false)}
              />
          )}
          
          {isActionsModalOpen && profile && (
              <ActionsModal
                  isOpen={isActionsModalOpen}
                  onClose={() => setIsActionsModalOpen(false)}
                  user={profile}
                  onBlock={handleBlock}
                  onReport={handleReport}
              />
          )}
          <style>{`
              .scrollbar-hide::-webkit-scrollbar { display: none; }
              .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
              @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
              .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
          `}</style>
        </div>
    );
};

export default UserProfileModal;