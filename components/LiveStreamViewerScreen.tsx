
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Stream, PkBattle, ChatMessage, LiveDetails, PkInvitation, SoundEffectName, MuteStatusListener, UserKickedListener, SoundEffectListener, PublicProfile, PkSession } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import * as soundService from '../services/soundService';
import { useApiViewer } from './ApiContext';

import CrossIcon from './icons/CrossIcon';
import ViewersIcon from './icons/ViewersIcon';
import DiamondIcon from './icons/DiamondIcon';
import AnchorToolsIcon from './icons/AnchorToolsIcon';
import SwordsIcon from './icons/SwordsIcon';
import CoracaoIcon from './icons/CoracaoIcon';
import ShoppingBasketIcon from './icons/ShoppingBasketIcon';
import ChatBubbleIcon from './icons/ChatBubbleIcon';
import MessageIcon from './icons/MessageIcon';
import PlusIcon from './icons/PlusIcon';

// Modal Imports
import OnlineUsersModal from './OnlineUsersModal';
import UserProfileModal from './UserProfileModal';
import HourlyRankingModal from './HourlyRankingModal';
import GiftPanel from './GiftPanel';
import ArcoraToolModal from './ArcoraToolModal';
import MuteUserModal from './MuteUserModal';
import SoundEffectModal from './SoundEffectModal';
import MutedNotificationModal from './MutedNotificationModal';
import KickedFromStreamModal from './KickedFromStreamModal';
import ChatArea from './ChatArea';
import ChatInput from './ChatInput';
import EndStreamConfirmationModal from './EndStreamConfirmationModal';
import SelectOpponentModal from './SelectOpponentModal';
import AcceptPkInviteModal from './AcceptPkInviteModal';
import InviteToPartyModal from './InviteToPartyModal';
import QuickChatModal from './QuickChatModal';


interface LiveStreamViewerScreenProps {
  user: User;
  stream: Stream | PkBattle;
  onExit: () => void;
  onNavigateToChat: (userId: number) => void;
  onNavigateToMessages: () => void;
  onRequirePurchase: () => void;
  onUpdateUser: (user: User) => void;
  onViewProtectors: (userId: number) => void;
  onViewStream: (stream: Stream | PkBattle) => void;
  onStreamEnded: (streamId: number) => void;
  onStopStream: (streamerId: number, streamId: number) => void;
}

const formatStatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

const formatScore = (num: number): string => num.toLocaleString('en-US');

const LiveStreamViewerScreen: React.FC<LiveStreamViewerScreenProps> = ({
  user,
  stream: initialStream,
  onExit,
  onNavigateToChat,
  onNavigateToMessages,
  onRequirePurchase,
  onUpdateUser,
  onViewProtectors,
  onViewStream,
  onStreamEnded,
  onStopStream,
}) => {
    const { showApiResponse } = useApiViewer();
    const isPkBattle = 'streamer1' in initialStream;

    const [pkSession, setPkSession] = useState<PkSession | null>(null);

    // Common State
    const [liveDetails, setLiveDetails] = useState<LiveDetails | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isFollowing, setIsFollowing] = useState<Record<number, boolean>>({});
    
    // Modal states
    const [isFollowLoading, setIsFollowLoading] = useState<Record<number, boolean>>({});
    const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);
    const [viewingUserId, setViewingUserId] = useState<number | null>(null);
    const [isGiftPanelOpen, setIsGiftPanelOpen] = useState(false);
    const [isArcoraToolModalOpen, setIsArcoraToolModalOpen] = useState(false);
    const [isMuteUserModalOpen, setIsMuteUserModalOpen] = useState(false);
    const [isSoundEffectModalOpen, setIsSoundEffectModalOpen] = useState(false);
    const [mutedUsers, setMutedUsers] = useState<Record<number, { mutedUntil: string }>>({});
    const [kickedState, setKickedState] = useState<'none' | 'just_kicked' | 'banned_on_join'>('none');
    const [muteNotification, setMuteNotification] = useState<{ type: 'muted' | 'unmuted' } | null>(null);
    const [isHourlyRankingModalOpen, setIsHourlyRankingModalOpen] = useState(false);
    const [isEndStreamModalOpen, setIsEndStreamModalOpen] = useState(false);
    const [isSelectOpponentModalOpen, setIsSelectOpponentModalOpen] = useState(false);
    const [pendingPkInvitation, setPendingPkInvitation] = useState<PkInvitation | null>(null);
    const [isInviteToPartyModalOpen, setIsInviteToPartyModalOpen] = useState(false);
    const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);

    const liveId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : (initialStream as Stream).id;
    const streamerId = isPkBattle ? (initialStream as PkBattle).streamer1.userId : (initialStream as Stream).userId;
    const isHost = isPkBattle 
        ? user.id === (initialStream as PkBattle).streamer1.userId || user.id === (initialStream as PkBattle).streamer2.userId
        : user.id === streamerId;
    const isPrivateStream = !isPkBattle && (initialStream as Stream).isPrivate;

    useEffect(() => {
        const initialFollowing: Record<number, boolean> = {};
        if (isPkBattle) {
            const battle = initialStream as PkBattle;
            initialFollowing[battle.streamer1.userId] = user.following.includes(battle.streamer1.userId);
            initialFollowing[battle.streamer2.userId] = user.following.includes(battle.streamer2.userId);
        } else {
            const stream = initialStream as Stream;
            initialFollowing[stream.userId] = user.following.includes(stream.userId);
        }
        setIsFollowing(initialFollowing);
    }, [user.following, initialStream, isPkBattle]);
    
    const handleExitClick = () => {
        if (isHost) {
            setIsEndStreamModalOpen(true);
        } else {
            onExit();
        }
    };

    const confirmStopStream = () => {
        setIsEndStreamModalOpen(false);
        onStopStream(streamerId, liveId);
    };

    const handleOpenUserProfile = (userId: number) => { setViewingUserId(userId); };

    const handleFollowToggle = async (targetUserId: number) => {
        setIsFollowLoading(prev => ({ ...prev, [targetUserId]: true }));
        const currentlyFollowing = isFollowing[targetUserId];
        const func = currentlyFollowing ? liveStreamService.unfollowUser : liveStreamService.followUser;
        try {
            const updatedUser = await func(user.id, targetUserId);
            onUpdateUser(updatedUser);
            showApiResponse(`POST /api/users/${currentlyFollowing ? 'unfollow' : 'follow'}`, { success: true });
        } catch (error) {
            console.error("Follow/unfollow failed", error);
        } finally {
            setIsFollowLoading(prev => ({ ...prev, [targetUserId]: false }));
        }
    };

    useEffect(() => {
        if (!isHost) return;
        const checkInvites = async () => {
            try {
                const invite = await liveStreamService.getPendingPkInvitation(user.id);
                if (invite && !pendingPkInvitation) {
                    const inviter = await authService.getUserProfile(invite.inviterId);
                    setPendingPkInvitation({ ...invite, inviterName: inviter.nickname || inviter.name, inviterAvatarUrl: inviter.avatar_url || '' });
                }
            } catch (e) { console.error("Failed to check for PK invites:", e); }
        };
        const intervalId = setInterval(checkInvites, 5000);
        return () => clearInterval(intervalId);
    }, [isHost, user.id, pendingPkInvitation]);

    useEffect(() => {
        if (!isPkBattle) return;
        const pkBattleId = (initialStream as PkBattle).id;
        
        const fetchSession = async () => {
            try {
                const sessionData = await liveStreamService.getPkSessionDetails(pkBattleId);
                setPkSession(sessionData);
            } catch (e) {
                console.error("Failed to fetch PK session", e);
            }
        };
        
        fetchSession();
        const intervalId = setInterval(fetchSession, 3000);

        return () => clearInterval(intervalId);
    }, [isPkBattle, initialStream]);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [details, messages] = await Promise.all([
                    liveStreamService.getLiveStreamDetails(liveId),
                    liveStreamService.getChatMessages(liveId),
                ]);
                setLiveDetails(details);
                setChatMessages(messages);
            } catch (error) { console.error(error); onExit(); }
        };
        fetchData();
    }, [liveId, onExit]);

    useEffect(() => {
        const handleChatMessageUpdate = (id: number, messages: ChatMessage[]) => { if (id === liveId) setChatMessages(messages); };
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
        const handleUserKicked: UserKickedListener = (update) => { if (update.liveId === liveId && update.kickedUserId === user.id) setKickedState('just_kicked'); };
        const handleSoundEffect: SoundEffectListener = (update) => { if (update.liveId === liveId && update.triggeredBy !== user.id) soundService.playSound(update.effectName); };

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

    useEffect(() => {
        liveStreamService.joinLiveStream(user.id, liveId).catch(error => {
            if (error.message.includes('removido')) {
                setKickedState('banned_on_join');
            } else { onExit(); }
        });
        if (user.equipped_entry_effect_id) liveStreamService.postSpecialEntryMessage(liveId, user.id);
        return () => { liveStreamService.leaveLiveStream(user.id, liveId); };
    }, [user.id, liveId, onExit, user.equipped_entry_effect_id]);
    
    const handleSendMessage = async (message: string) => {
        try { await liveStreamService.sendChatMessage(liveId, user.id, message); } catch (error) { alert((error as Error).message); }
    };
    
    const handleSendGift = async (giftId: number) => {
        const targetStreamId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : liveId;
        try {
            const response = await liveStreamService.sendGift(targetStreamId, user.id, giftId);
            if (response.success && response.updatedUser) onUpdateUser(response.updatedUser);
            else { alert(response.message); if (response.message.includes('insuficientes')) onRequirePurchase(); }
            setIsGiftPanelOpen(false);
        } catch (error) { alert((error as Error).message); }
    };

    const handleMuteUser = async (targetUserId: number, mute: boolean) => {
      try { await liveStreamService.muteUser(liveId, targetUserId, mute); } catch (error) { alert(`Falha ao ${mute ? 'silenciar' : 'dessilenciar'} usuário.`); }
    };
    
    const handleKickUser = async (targetUserId: number) => {
      try { await liveStreamService.kickUser(liveId, targetUserId); } catch (error) { alert('Falha ao expulsar usuário.'); }
    };

    const handlePlaySoundEffect = (effectName: SoundEffectName) => {
      soundService.playSound(effectName);
      liveStreamService.playSoundEffect(liveId, user.id, effectName);
    };

    const handleAcceptPkInvite = async () => {
        if (!pendingPkInvitation) return;
        try {
            const pkBattle = await liveStreamService.acceptPkInvitation(pendingPkInvitation.id);
            showApiResponse(`POST /api/pk/invites/${pendingPkInvitation.id}/accept`, pkBattle);
            setPendingPkInvitation(null);
            onViewStream(pkBattle);
        } catch (error) { alert("Não foi possível aceitar o convite de PK."); setPendingPkInvitation(null); }
    };

    const handleDeclinePkInvite = async () => {
        if (!pendingPkInvitation) return;
        try { await liveStreamService.declinePkInvitation(pendingPkInvitation.id); } 
        catch (error) { console.error("Failed to decline PK invite:", error); } 
        finally { setPendingPkInvitation(null); }
    };

    const handleInviteToPk = (inviteeId: number) => {
        liveStreamService.sendPkInvitation(user.id, inviteeId)
            .then(() => alert(`Convite de PK enviado para o usuário ${inviteeId}!`))
            .catch(err => alert(`Falha ao enviar convite: ${err.message}`));
        setIsSelectOpponentModalOpen(false);
    };
    
    if (kickedState === 'banned_on_join') return <KickedFromStreamModal onExit={onExit} isJoinAttempt={true} />;
    
    const renderCommonFooterButtons = () => (
        <div className="flex items-center gap-2 shrink-0">
            {isHost && (
                <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <AnchorToolsIcon className="w-6 h-6 text-purple-300"/>
                </button>
            )}
            <button onClick={() => setIsQuickChatOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <ChatBubbleIcon className="w-6 h-6 text-white"/>
            </button>
            {!isHost && (
                <button onClick={onNavigateToMessages} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <MessageIcon className="w-6 h-6 text-white"/>
                </button>
            )}
            <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <ShoppingBasketIcon className="w-6 h-6 text-yellow-200" />
            </button>
             <button onClick={() => liveStreamService.sendLike(liveId, user.id)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <CoracaoIcon className="w-7 h-7 text-red-500" />
            </button>
        </div>
    );
    
    const PkBattleHeader = ({ battle, score1, score2 }: { battle: PkBattle; score1: number; score2: number }) => (
        <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm p-1 rounded-full">
                <div className="relative shrink-0">
                    <button onClick={() => handleOpenUserProfile(battle.streamer1.userId)}>
                        <img src={battle.streamer1.avatarUrl} alt={battle.streamer1.name} className="w-10 h-10 rounded-full object-cover"/>
                    </button>
                    {user.id !== battle.streamer1.userId && !isFollowing[battle.streamer1.userId] && (
                        <button
                            onClick={() => handleFollowToggle(battle.streamer1.userId)}
                            disabled={isFollowLoading[battle.streamer1.userId]}
                            className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-black/40 transform transition-transform hover:scale-110 disabled:bg-gray-500"
                            aria-label={`Seguir ${battle.streamer1.name}`}
                        >
                            {isFollowLoading[battle.streamer1.userId] ? 
                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 
                                <PlusIcon className="w-3 h-3 text-black" />
                            }
                        </button>
                    )}
                </div>
                <div className="pr-2">
                    <p className="font-bold text-sm truncate max-w-[80px]">{battle.streamer1.name}</p>
                    <p className="text-xs text-gray-300">Score: {formatScore(score1)}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setIsOnlineUsersModalOpen(true)} className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full">
                   <ViewersIcon className="w-5 h-5"/>
                   <span className="font-bold text-sm">{formatStatNumber(liveDetails?.viewerCount || 0)}</span>
                </button>
                <button onClick={handleExitClick} className="p-2 bg-black/40 rounded-full"><CrossIcon className="w-6 h-6"/></button>
            </div>
             <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm p-1 rounded-full">
                <div className="pl-2 text-right">
                    <p className="font-bold text-sm truncate max-w-[80px]">{battle.streamer2.name}</p>
                    <p className="text-xs text-gray-300">Score: {formatScore(score2)}</p>
                </div>
                <div className="relative shrink-0">
                    <button onClick={() => handleOpenUserProfile(battle.streamer2.userId)}>
                        <img src={battle.streamer2.avatarUrl} alt={battle.streamer2.name} className="w-10 h-10 rounded-full object-cover"/>
                    </button>
                    {user.id !== battle.streamer2.userId && !isFollowing[battle.streamer2.userId] && (
                        <button
                            onClick={() => handleFollowToggle(battle.streamer2.userId)}
                            disabled={isFollowLoading[battle.streamer2.userId]}
                            className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-black/40 transform transition-transform hover:scale-110 disabled:bg-gray-500"
                            aria-label={`Seguir ${battle.streamer2.name}`}
                        >
                            {isFollowLoading[battle.streamer2.userId] ? 
                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 
                                <PlusIcon className="w-3 h-3 text-black" />
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const renderSingleStreamView = () => {
        const stream = initialStream as Stream;
        return (
            <>
                <div className="absolute inset-0 z-0">
                    <img src={stream.thumbnailUrl || 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200'} alt="Stream background" className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                </div>
                <div className="relative z-10 flex flex-col h-full p-2 sm:p-4">
                    <header className="flex items-start justify-between shrink-0">
                        <div className="bg-black/40 backdrop-blur-sm p-2 rounded-lg flex flex-col items-start">
                           <div className="flex items-center gap-2">
                                <div className="relative shrink-0">
                                   <button onClick={() => handleOpenUserProfile(streamerId)}>
                                       <img src={liveDetails?.streamerAvatarUrl} alt={liveDetails?.streamerName} className="w-10 h-10 rounded-full object-cover"/>
                                   </button>
                                   {!isHost && !isFollowing[streamerId] && (
                                       <button
                                           onClick={() => handleFollowToggle(streamerId)}
                                           disabled={isFollowLoading[streamerId]}
                                           className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-black/40 transform transition-transform hover:scale-110 disabled:bg-gray-500"
                                           aria-label="Seguir streamer"
                                       >
                                           {isFollowLoading[streamerId] ? 
                                               <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : 
                                               <PlusIcon className="w-3 h-3 text-black" />
                                           }
                                       </button>
                                   )}
                               </div>
                               <button onClick={() => handleOpenUserProfile(streamerId)}>
                                   <div>
                                       <p className="font-bold text-sm truncate max-w-[120px]">{liveDetails?.streamerName}</p>
                                       <p className="text-xs text-gray-300">{formatStatNumber(liveDetails?.streamerFollowers || 0)} seguidores</p>
                                   </div>
                               </button>
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
                            <button onClick={handleExitClick} className="p-2 bg-black/40 rounded-full"><CrossIcon className="w-6 h-6"/></button>
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
                            {renderCommonFooterButtons()}
                        </div>
                    </footer>
                </div>
            </>
        )
    };
    
    const renderPkBattleView = () => {
        const battle = initialStream as PkBattle;
        const score1 = pkSession?.score1 ?? battle.streamer1.score;
        const score2 = pkSession?.score2 ?? battle.streamer2.score;
        const totalScore = score1 + score2;
        const streamer1Percent = totalScore > 0 ? (score1 / totalScore) * 100 : 50;

        return (
            <>
                <div className="absolute inset-0 z-0 flex">
                    <div className="w-1/2 h-full relative"><img src={battle.streamer1.avatarUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" /></div>
                    <div className="w-1/2 h-full relative"><img src={battle.streamer2.avatarUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent" /></div>
                </div>
                <div className="relative z-10 flex flex-col h-full p-2 sm:p-4">
                    <PkBattleHeader battle={battle} score1={score1} score2={score2} />

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%]">
                        <div className="relative w-full h-8 bg-black/30 rounded-full overflow-hidden flex items-center border border-white/10">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out" style={{ width: `${streamer1Percent}%` }}></div>
                            <div className="h-full bg-gradient-to-l from-pink-500 to-red-400 transition-all duration-500 ease-out" style={{ width: `${100 - streamer1Percent}%` }}></div>
                            <div className="absolute inset-0 flex justify-between items-center px-3">
                                <span className="font-bold text-base text-white drop-shadow-lg">{formatScore(score1)}</span>
                                <span className="font-bold text-base text-white drop-shadow-lg">{formatScore(score2)}</span>
                            </div>
                        </div>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2"><SwordsIcon className="w-16 h-16 text-red-500" /></div>
                    </div>

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
                            {renderCommonFooterButtons()}
                        </div>
                    </footer>
                </div>
            </>
        )
    };

    return (
        <div className="h-screen w-full bg-black text-white font-sans flex flex-col">
            {isPkBattle ? renderPkBattleView() : renderSingleStreamView()}
            
            {/* --- Modals --- */}
            {isEndStreamModalOpen && <EndStreamConfirmationModal onConfirm={confirmStopStream} onCancel={() => setIsEndStreamModalOpen(false)} />}
            {isSelectOpponentModalOpen && <SelectOpponentModal currentUserId={user.id} onClose={() => setIsSelectOpponentModalOpen(false)} onInvite={handleInviteToPk} />}
            {pendingPkInvitation && <AcceptPkInviteModal invitation={pendingPkInvitation} onAccept={handleAcceptPkInvite} onDecline={handleDeclinePkInvite} />}
            {isInviteToPartyModalOpen && <InviteToPartyModal streamerId={user.id} liveId={liveId} onClose={() => setIsInviteToPartyModalOpen(false)} />}
            {isQuickChatOpen && <QuickChatModal onClose={() => setIsQuickChatOpen(false)} onSendMessage={(msg) => { handleSendMessage(msg); setIsQuickChatOpen(false); }} />}
            
            {/* Re-using existing modals */}
            {isOnlineUsersModalOpen && <OnlineUsersModal liveId={liveId} onClose={() => setIsOnlineUsersModalOpen(false)} onUserClick={handleOpenUserProfile} />}
            {isHourlyRankingModalOpen && <HourlyRankingModal onClose={() => setIsHourlyRankingModalOpen(false)} onUserClick={(userId) => { setIsHourlyRankingModalOpen(false); handleOpenUserProfile(userId); }}/>}
            {isGiftPanelOpen && <GiftPanel user={user} liveId={liveId} onClose={() => setIsGiftPanelOpen(false)} onSendGift={handleSendGift} onRechargeClick={() => { setIsGiftPanelOpen(false); onRequirePurchase(); }} />}
            {viewingUserId && <UserProfileModal userId={viewingUserId} currentUser={user} onUpdateUser={onUpdateUser} onClose={() => setViewingUserId(null)} onNavigateToChat={onNavigateToChat} onViewProtectors={onViewProtectors} onViewStream={onViewStream} />}
            {isMuteUserModalOpen && <MuteUserModal liveId={liveId} mutedUsers={mutedUsers} onMuteUser={handleMuteUser} onKickUser={handleKickUser} onClose={() => setIsMuteUserModalOpen(false)}/>}
            {isSoundEffectModalOpen && <SoundEffectModal onClose={() => setIsSoundEffectModalOpen(false)} onPlaySoundEffect={handlePlaySoundEffect} />}
            {muteNotification && <MutedNotificationModal type={muteNotification.type} onClose={() => setMuteNotification(null)} />}
            {kickedState === 'just_kicked' && <KickedFromStreamModal onExit={onExit} />}
            {isArcoraToolModalOpen && <ArcoraToolModal 
                onClose={() => setIsArcoraToolModalOpen(false)} 
                onOpenMuteModal={() => { setIsArcoraToolModalOpen(false); setIsMuteUserModalOpen(true); }}
                onOpenSoundEffectModal={() => { setIsArcoraToolModalOpen(false); setIsSoundEffectModalOpen(true); }}
                onSwitchCamera={() => {}} 
                onToggleVoice={() => {}} 
                isVoiceEnabled={false} 
                onOpenPrivateChat={() => { setIsArcoraToolModalOpen(false); onNavigateToMessages(); }} 
            />}
        </div>
    );
};

export default LiveStreamViewerScreen;
