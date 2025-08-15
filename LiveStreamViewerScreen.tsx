

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Stream, PkBattle, ChatMessage, LiveDetails, RankingContributor, Viewer, PkInvitation, SoundEffectName, MuteStatusListener, UserKickedListener, SoundEffectListener } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import * as soundService from '../services/soundService';
import { useApiViewer } from './ApiContext';

import CrossIcon from './icons/CrossIcon';
import ViewersIcon from './icons/ViewersIcon';
import DiamondIcon from './icons/DiamondIcon';
import SwordsIcon from './icons/SwordsIcon';
import WhiteBalloonIcon from './icons/WhiteBalloonIcon';

// Modal Imports
import OnlineUsersModal from './OnlineUsersModal';
import UserProfileModal from './UserProfileModal';
import HourlyRankingModal from './HourlyRankingModal';
import GiftPanel from './GiftPanel';
import EndStreamConfirmationModal from './EndStreamConfirmationModal';
import SelectOpponentModal from './SelectOpponentModal';
import AcceptPkInviteModal from './AcceptPkInviteModal';
import InviteToPartyModal from './InviteToPartyModal';
import ChatArea from './ChatArea';
import ArcoraToolModal from './ArcoraToolModal';
import MuteUserModal from './MuteUserModal';
import SoundEffectModal from './SoundEffectModal';
import MutedNotificationModal from './MutedNotificationModal';
import KickedFromStreamModal from './KickedFromStreamModal';
import CoracaoIcon from './icons/CoracaoIcon';
import WaterDropIcon from './icons/WaterDropIcon';
import ShoppingBasketIcon from './icons/ShoppingBasketIcon';
import ChatInput from './ChatInput';

interface LiveStreamViewerScreenProps {
  user: User;
  stream: Stream | PkBattle;
  onExit: () => void;
  onNavigateToChat: (userId: number) => void;
  onRequirePurchase: () => void;
  onUpdateUser: (user: User) => void;
  onViewProtectors: (userId: number) => void;
  onViewStream: (stream: Stream | PkBattle) => void;
  onStreamEnded: (streamId: number) => void;
  onStopStream?: (streamerId: number, streamId: number) => void;
}

const formatStatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
};

const LiveStreamViewerScreen: React.FC<LiveStreamViewerScreenProps> = ({
  user,
  stream: initialStream,
  onExit,
  onNavigateToChat,
  onRequirePurchase,
  onUpdateUser,
  onViewProtectors,
  onViewStream,
  onStreamEnded,
  onStopStream,
}) => {
    const { showApiResponse } = useApiViewer();
    const liveId = 'streamer1' in initialStream ? initialStream.streamer1.userId : initialStream.id;
    const streamerId = 'streamer1' in initialStream ? initialStream.streamer1.userId : initialStream.userId;
    const isHost = user.id === streamerId;

    const [liveDetails, setLiveDetails] = useState<LiveDetails | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isFollowing, setIsFollowing] = useState(user.following.includes(streamerId));
    
    // Modal states
    const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);
    const [viewingUserId, setViewingUserId] = useState<number | null>(null);
    const [isGiftPanelOpen, setIsGiftPanelOpen] = useState(false);
    const [isArcoraToolModalOpen, setIsArcoraToolModalOpen] = useState(false);
    const [isMuteUserModalOpen, setIsMuteUserModalOpen] = useState(false);
    const [isSoundEffectModalOpen, setIsSoundEffectModalOpen] = useState(false);
    const [mutedUsers, setMutedUsers] = useState<Record<number, { mutedUntil: string }>>({});
    const [kickedNotification, setKickedNotification] = useState(false);
    const [muteNotification, setMuteNotification] = useState<{ type: 'muted' | 'unmuted' } | null>(null);
    const [isHourlyRankingModalOpen, setIsHourlyRankingModalOpen] = useState(false);


    useEffect(() => {
        setIsFollowing(user.following.includes(streamerId));
    }, [user.following, streamerId]);

    const handleOpenUserProfile = (userId: number) => {
        setViewingUserId(userId);
    };

    const handleFollowToggle = async () => {
        const func = isFollowing ? liveStreamService.unfollowUser : liveStreamService.followUser;
        try {
            const updatedUser = await func(user.id, streamerId);
            onUpdateUser(updatedUser);
            showApiResponse(`POST /api/users/${isFollowing ? 'unfollow' : 'follow'}`, { success: true });
        } catch (error) {
            console.error("Follow/unfollow failed", error);
        }
    };
    
    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [details, messages] = await Promise.all([
                    liveStreamService.getLiveStreamDetails(liveId),
                    liveStreamService.getChatMessages(liveId),
                ]);
                setLiveDetails(details);
                setChatMessages(messages);
            } catch (error) {
                console.error("Failed to fetch initial live data", error);
                alert("Não foi possível carregar os dados da live.");
                onExit();
            }
        };
        fetchData();
    }, [liveId, onExit]);

    // Setup listeners
    useEffect(() => {
        const handleChatMessageUpdate = (id: number, messages: ChatMessage[]) => {
            if (id === liveId) {
                setChatMessages(messages);
            }
        };
        const handleMuteStatus: MuteStatusListener = (update) => {
            if (update.liveId === liveId) {
                setMutedUsers(prev => {
                    const newMuted = { ...prev };
                    if (update.isMuted && update.mutedUntil) {
                        newMuted[update.userId] = { mutedUntil: update.mutedUntil };
                        if (update.userId === user.id) setMuteNotification({ type: 'muted' });
                    } else {
                        delete newMuted[update.userId];
                         if (update.userId === user.id) setMuteNotification({ type: 'unmuted' });
                    }
                    return newMuted;
                });
            }
        };
        const handleUserKicked: UserKickedListener = (update) => {
            if (update.liveId === liveId && update.kickedUserId === user.id) {
                setKickedNotification(true);
            }
        };
        const handleSoundEffect: SoundEffectListener = (update) => {
            if (update.liveId === liveId && update.triggeredBy !== user.id) {
                soundService.playSound(update.effectName);
            }
        };

        liveStreamService.addChatMessageListener(handleChatMessageUpdate);
        liveStreamService.addMuteStatusListener(handleMuteStatus);
        liveStreamService.addUserKickedListener(handleUserKicked);
        liveStreamService.addSoundEffectListener(handleSoundEffect);
        return () => {
            liveStreamService.removeChatMessageListener(handleChatMessageUpdate);
            liveStreamService.removeMuteStatusListener(handleMuteStatus);
            liveStreamService.removeUserKickedListener(handleUserKicked);
            liveStreamService.removeSoundEffectListener(handleSoundEffect);
        };
    }, [liveId, user.id]);

    // Join stream effect
    useEffect(() => {
        liveStreamService.joinLiveStream(user.id, liveId).catch(error => {
            console.error("Failed to join stream:", error);
            alert(error.message);
            onExit();
        });
        if (user.equipped_entry_effect_id) {
            liveStreamService.postSpecialEntryMessage(liveId, user.id);
        }
    }, [user.id, liveId, onExit, user.equipped_entry_effect_id]);
    
    const handleSendMessage = async (message: string) => {
        try {
            await liveStreamService.sendChatMessage(liveId, user.id, message);
        } catch (error) {
            console.error("Send message failed:", error);
            alert((error as Error).message);
        }
    };
    
    const handleSendGift = async (giftId: number) => {
        try {
            const response = await liveStreamService.sendGift(liveId, user.id, giftId);
            if (response.success && response.updatedUser) {
                onUpdateUser(response.updatedUser);
            } else {
                 alert(response.message);
                 if (response.message.includes('insuficientes')) {
                     onRequirePurchase();
                 }
            }
            setIsGiftPanelOpen(false);
        } catch (error) {
             console.error("Send gift failed", error);
             alert((error as Error).message);
        }
    };

    const handleMuteUser = async (targetUserId: number, mute: boolean) => {
        try {
            await liveStreamService.muteUser(liveId, targetUserId, mute);
        } catch (error) {
            alert(`Falha ao ${mute ? 'silenciar' : 'dessilenciar'} usuário.`);
        }
    };
    
    const handleKickUser = async (targetUserId: number) => {
        try {
            await liveStreamService.kickUser(liveId, targetUserId);
        } catch (error) {
            alert('Falha ao expulsar usuário.');
        }
    };

    const handlePlaySoundEffect = (effectName: SoundEffectName) => {
        soundService.playSound(effectName); // Immediate feedback for host
        liveStreamService.playSoundEffect(liveId, user.id, effectName);
    };
    
    const thumbnailUrl = 'thumbnailUrl' in initialStream 
        ? initialStream.thumbnailUrl 
        : ('streamer1' in initialStream ? initialStream.streamer1.avatarUrl : undefined);

    return (
        <div className="h-screen w-full bg-black text-white font-sans flex flex-col">
            <div className="absolute inset-0 z-0">
                <img src={thumbnailUrl || 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200'} alt="Stream background" className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full p-2 sm:p-4">
                 <header className="flex items-start justify-between shrink-0">
                    <div className="bg-black/40 backdrop-blur-sm p-2 rounded-lg flex flex-col items-start">
                        <div className="flex items-center gap-2">
                            <img src={liveDetails?.streamerAvatarUrl} alt={liveDetails?.streamerName} className="w-10 h-10 rounded-full object-cover"/>
                            <div>
                                <p className="font-bold text-sm truncate max-w-[120px]">{liveDetails?.streamerName}</p>
                                <p className="text-xs text-gray-300">{formatStatNumber(liveDetails?.streamerFollowers || 0)} seguidores</p>
                            </div>
                            {!isHost && (
                                <button
                                    onClick={handleFollowToggle}
                                    className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${isFollowing ? 'bg-gray-600 text-gray-200' : 'bg-green-500 text-black'}`}
                                >
                                    {isFollowing ? 'Seguindo' : 'Seguir'}
                                </button>
                            )}
                        </div>
                        <button onClick={() => setIsHourlyRankingModalOpen(true)} className="flex items-center gap-1.5 mt-1.5 pl-1">
                            <DiamondIcon className="w-4 h-4"/>
                            <span className="font-semibold text-sm text-white">{formatStatNumber(liveDetails?.receivedGiftsValue || 0)}</span>
                            <span className="text-gray-400 text-sm font-bold ml-1">&gt;</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsOnlineUsersModalOpen(true)} className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full">
                           <ViewersIcon className="w-5 h-5"/>
                           <span className="font-bold text-sm">{formatStatNumber(liveDetails?.viewerCount || 0)}</span>
                        </button>
                        <button onClick={onExit} className="p-2 bg-black/40 rounded-full"><CrossIcon className="w-6 h-6"/></button>
                    </div>
                </header>

                <main className="flex-grow flex flex-col justify-end overflow-hidden pointer-events-none">
                    <div className="w-full md:w-3/4 lg:w-1/2 pointer-events-auto">
                        <ChatArea messages={chatMessages} onUserClick={handleOpenUserProfile} />
                    </div>
                </main>
                
                <footer className="shrink-0 pt-2 pointer-events-auto">
                    <div className="flex items-center gap-2">
                        <div className="flex-grow">
                            <ChatInput onSendMessage={handleSendMessage} />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                             {isHost && (
                                <button
                                    onClick={() => setIsArcoraToolModalOpen(true)}
                                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                                >
                                    <WhiteBalloonIcon className="w-6 h-6 text-purple-300"/>
                                </button>
                            )}
                            <button
                                onClick={() => liveStreamService.sendLike(liveId, user.id)}
                                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                            >
                                <WaterDropIcon className="w-6 h-6 text-purple-200" />
                            </button>
                            <button
                                onClick={() => setIsGiftPanelOpen(true)}
                                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                            >
                                <ShoppingBasketIcon className="w-6 h-6 text-yellow-200" />
                            </button>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Modals */}
             {isOnlineUsersModalOpen && (
                <OnlineUsersModal liveId={liveId} onClose={() => setIsOnlineUsersModalOpen(false)} onUserClick={handleOpenUserProfile} />
             )}
             {isHourlyRankingModalOpen && (
                <HourlyRankingModal
                    liveId={liveId}
                    onClose={() => setIsHourlyRankingModalOpen(false)}
                    onUserClick={(userId) => {
                        setIsHourlyRankingModalOpen(false);
                        handleOpenUserProfile(userId);
                    }}
                />
             )}
             {isMuteUserModalOpen && (
                <MuteUserModal 
                    liveId={liveId}
                    mutedUsers={mutedUsers}
                    onMuteUser={handleMuteUser}
                    onKickUser={handleKickUser}
                    onClose={() => setIsMuteUserModalOpen(false)}
                />
            )}
            {isSoundEffectModalOpen && (
                <SoundEffectModal 
                    onClose={() => setIsSoundEffectModalOpen(false)}
                    onPlaySoundEffect={handlePlaySoundEffect}
                />
            )}
            {isArcoraToolModalOpen && (
                <ArcoraToolModal 
                    onClose={() => setIsArcoraToolModalOpen(false)} 
                    onOpenMuteModal={() => { setIsArcoraToolModalOpen(false); setIsMuteUserModalOpen(true); }}
                    onOpenSoundEffectModal={() => { setIsArcoraToolModalOpen(false); setIsSoundEffectModalOpen(true); }}
                />
            )}
            {isGiftPanelOpen && (
                <GiftPanel
                    user={user}
                    liveId={liveId}
                    onClose={() => setIsGiftPanelOpen(false)}
                    onSendGift={handleSendGift}
                    onRechargeClick={() => { setIsGiftPanelOpen(false); onRequirePurchase(); }}
                />
            )}
             {viewingUserId && (
                <UserProfileModal
                    userId={viewingUserId}
                    currentUser={user}
                    onUpdateUser={onUpdateUser}
                    onClose={() => setViewingUserId(null)}
                    onNavigateToChat={onNavigateToChat}
                    onViewProtectors={onViewProtectors}
                    onViewStream={onViewStream}
                />
            )}
             {kickedNotification && <KickedFromStreamModal onExit={onExit} />}
             {muteNotification && (
                <MutedNotificationModal 
                    type={muteNotification.type} 
                    onClose={() => setMuteNotification(null)} 
                />
             )}
        </div>
    );
};

export default LiveStreamViewerScreen;