import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Stream, PkBattle, ChatMessage, LiveDetails, PkInvitation, SoundEffectName, MuteStatusListener, UserKickedListener, SoundEffectListener, BatalhaPK, ConvitePK, IncomingPrivateLiveInvite, Viewer } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import * as soundService from '../services/soundService';
import { useApiViewer } from './ApiContext';

import CrossIcon from './icons/CrossIcon';
import ViewersIcon from './icons/ViewersIcon';
import AnchorToolsIcon from './icons/AnchorToolsIcon';
import CoracaoIcon from './icons/CoracaoIcon';
import ShoppingBasketIcon from './icons/ShoppingBasketIcon';
import PlusIcon from './icons/PlusIcon';
import CheckIcon from './icons/CheckIcon';
import SwordsIcon from './icons/SwordsIcon';
import PinkHeartIcon from './icons/PinkHeartIcon';
import PkIcon from './icons/PkIcon';
import MessageIcon from './icons/MessageIcon';
import ChatBubbleIcon from './icons/ChatBubbleIcon';

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
import InviteToPrivateLiveModal from './InviteToPrivateLiveModal';
import QuickChatModal from './QuickChatModal';
import RankingListScreen from './RankingListScreen';
import PrivateChatModal from './PrivateChatModal';
import PkLiveRoomModal from './PkLiveRoomModal';
import PkSettingsModal from './PkSettingsModal';
import PkMatchingModal from './PkMatchingModal';
import PkRandomMatchModal from './PkRandomMatchModal';
import PkInvitationModal from './PkInvitationModal';
import FloatingGiftAnimation from './FloatingGiftAnimation';
import PkStreamerHeader from './PkStreamerHeader';

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
  onStopStream: (streamerId: number, streamId: number) => void;
  onShowPrivateLiveInvite: (invite: IncomingPrivateLiveInvite) => void;
}

const formatStatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

const formatScore = (num: number): string => num.toLocaleString('en-US');

const CountdownTimer: React.FC<{ endTime: string }> = ({ endTime }) => {
    const calculateTimeLeft = useCallback(() => {
        if (!endTime) return { m: 0, s: 0 };
        const difference = +new Date(endTime) - +new Date();
        let timeLeft = { m: 0, s: 0 };

        if (difference > 0) {
            const totalSeconds = Math.floor(difference / 1000);
            timeLeft = {
                m: Math.floor(totalSeconds / 60),
                s: totalSeconds % 60,
            };
        }
        return timeLeft;
    }, [endTime]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const format = (t: number) => t.toString().padStart(2, '0');

    return (
        <span>{`${format(timeLeft.m)}:${format(timeLeft.s)}`}</span>
    );
};

const LiveStreamViewerScreen: React.FC<LiveStreamViewerScreenProps> = ({
  user,
  stream: initialStream,
  onExit,
  onRequirePurchase,
  onUpdateUser,
  onViewStream,
  onStreamEnded,
  onStopStream,
  onShowPrivateLiveInvite,
  onNavigateToChat,
  onViewProtectors
}) => {
    const { showApiResponse } = useApiViewer();
    const isPkBattle = 'streamer1' in initialStream;
    const liveId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : (initialStream as Stream).id;
    const mainStreamerId = isPkBattle ? (initialStream as PkBattle).streamer1.userId : (initialStream as Stream).userId;
    const isHost = user.id === mainStreamerId || (isPkBattle && user.id === (initialStream as PkBattle).streamer2.userId);
    const pkBattleId = isPkBattle ? (initialStream as PkBattle).id : null;
    const isPrivateStream = !isPkBattle && (initialStream as Stream).isPrivate;

    const [liveDetails, setLiveDetails] = useState<LiveDetails | null>(null);
    const [pkOpponentDetails, setPkOpponentDetails] = useState<LiveDetails | null>(null);
    const [onlineViewers, setOnlineViewers] = useState<Viewer[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [activePkBattle, setActivePkBattle] = useState<BatalhaPK | null>(null);
    const [isFollowing, setIsFollowing] = useState<Record<number, boolean>>({});
    const [isFollowLoading, setIsFollowLoading] = useState<Record<number, boolean>>({});

    const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);
    const [isGiftPanelOpen, setIsGiftPanelOpen] = useState(false);
    const [isArcoraToolModalOpen, setIsArcoraToolModalOpen] = useState(false);
    const [viewingUserId, setViewingUserId] = useState<number | null>(null);
    const [isEndStreamModalOpen, setIsEndStreamModalOpen] = useState(false);
    const [lastSentGift, setLastSentGift] = useState<ChatMessage | null>(null);
    const [viewingRankingFor, setViewingRankingFor] = useState<{ liveId: number; streamer: { id: number; name: string; avatarUrl: string; }; } | null>(null);
    const [isPkLiveRoomModalOpen, setIsPkLiveRoomModalOpen] = useState(false);
    const [isMuteUserModalOpen, setIsMuteUserModalOpen] = useState(false);
    const [isSoundEffectModalOpen, setIsSoundEffectModalOpen] = useState(false);
    const [kickedState, setKickedState] = useState<'none' | 'just_kicked' | 'banned_on_join'>('none');
    const [muteNotification, setMuteNotification] = useState<{ type: 'muted' | 'unmuted' } | null>(null);
    const [mutedUsers, setMutedUsers] = useState<Record<number, { mutedUntil: string }>>({});
    const [isBlockedByHost, setIsBlockedByHost] = useState(false);
    
    const [pendingPkInvitation, setPendingPkInvitation] = useState<PkInvitation | null>(null);
    const [pkFlowStep, setPkFlowStep] = useState<'idle' | 'select' | 'invite' | 'random-match-waiting'>('idle');
    const [pkOpponent, setPkOpponent] = useState<User | null>(null);
    const [sentPkInvitation, setSentPkInvitation] = useState<ConvitePK | null>(null);
    const [isPkSettingsModalOpen, setIsPkSettingsModalOpen] = useState(false);
    const pkPollingInterval = useRef<number | null>(null);
    const [isPrivateChatModalOpen, setIsPrivateChatModalOpen] = useState(false);
    const [isInviteToPrivateLiveModalOpen, setIsInviteToPrivateLiveModalOpen] = useState(false);
    const [simulatedIncomingInvite, setSimulatedIncomingInvite] = useState<PkInvitation | null>(null);

    const mainStreamerInfo = isPkBattle ? (initialStream as PkBattle).streamer1 : { userId: (initialStream as Stream).userId, name: (initialStream as Stream).nomeStreamer, avatarUrl: liveDetails?.streamerAvatarUrl || '', streamId: liveId, score: 0, isVerified: false };
    const opponentStreamerInfo = isPkBattle ? (initialStream as PkBattle).streamer2 : null;
    
    const fetchLiveDetails = useCallback(async () => {
        try {
            if (isPkBattle) {
                const battle = initialStream as PkBattle;
                const [details1, details2] = await Promise.all([
                    liveStreamService.getLiveStreamDetails(battle.streamer1.streamId),
                    liveStreamService.getLiveStreamDetails(battle.streamer2.streamId)
                ]);
                setLiveDetails(details1);
                setPkOpponentDetails(details2);
            } else {
                const stream = initialStream as Stream;
                const details = await liveStreamService.getLiveStreamDetails(stream.id);
                setLiveDetails(details);
                setPkOpponentDetails(null);
            }
        } catch (error) {
            console.error("Failed to fetch live details", error);
        }
    }, [isPkBattle, initialStream]);

    useEffect(() => {
        fetchLiveDetails();
        const interval = setInterval(fetchLiveDetails, 5000);
        return () => clearInterval(interval);
    }, [fetchLiveDetails]);
    
    useEffect(() => {
        const handleChatMessageUpdate = (id: number, messages: ChatMessage[]) => { 
            if (id === liveId) {
                setChatMessages(messages);
                const newGift = messages.filter(m => m.type === 'gift').pop();
                if(newGift) setLastSentGift(newGift);
            }
        };
        liveStreamService.addChatMessageListener(handleChatMessageUpdate);
        liveStreamService.getChatMessages(liveId).then(setChatMessages);
        return () => liveStreamService.removeChatMessageListener(handleChatMessageUpdate);
    }, [liveId]);
    
    const handleExitClick = () => {
        if (isHost) {
            setIsEndStreamModalOpen(true);
        } else {
            onExit();
        }
    };
    
    const confirmStopStream = () => {
        const streamToStopId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : liveId;
        const streamerToStopId = isPkBattle ? (initialStream as PkBattle).streamer1.userId : mainStreamerId;
        setIsEndStreamModalOpen(false);
        onStopStream(streamerToStopId, streamToStopId);
    };

    const confirmEndPkBattle = () => {
        if (!pkBattleId) return;
        liveStreamService.endPkBattle(pkBattleId, user.id)
            .then(() => {
                liveStreamService.getActiveStreamForUser(user.id).then(stream => {
                    if (stream) onViewStream(stream);
                    else onExit();
                });
            })
            .catch(err => alert("Failed to end PK battle."))
            .finally(() => setIsEndStreamModalOpen(false));
    }
    
    const handleOpenUserProfile = (userId: number) => { setViewingUserId(userId); };

    const handleFollowToggle = async (targetUserId: number) => {
        setIsFollowLoading(prev => ({ ...prev, [targetUserId]: true }));
        const currentlyFollowing = user.following.includes(targetUserId);
        const func = currentlyFollowing ? liveStreamService.unfollowUser : liveStreamService.followUser;
        try {
            const updatedUser = await func(user.id, targetUserId);
            onUpdateUser(updatedUser);
            setIsFollowing(prev => ({...prev, [targetUserId]: !currentlyFollowing }));
        } catch (error) {
            console.error("Follow/unfollow failed", error);
        } finally {
            setIsFollowLoading(prev => ({ ...prev, [targetUserId]: false }));
        }
    };

    const handleSendMessage = useCallback(async (message: string) => {
        try { await liveStreamService.sendChatMessage(liveId, user.id, message); } catch (error) { alert((error as Error).message); }
    }, [liveId, user.id]);

    const handleSendGift = async (giftId: number, receiverId?: number) => {
        const targetReceiverId = receiverId || mainStreamerId;
        if (isPkBattle && !receiverId) {
            alert("Por favor, selecione para qual streamer enviar o presente.");
            return;
        }
        try {
            const response = await liveStreamService.sendGift(liveId, user.id, giftId, targetReceiverId);
            if (response.success && response.updatedUser) {
                onUpdateUser(response.updatedUser);
                setIsGiftPanelOpen(false);
            } else {
                 if (response.message.includes('insuficientes')) {
                    setIsGiftPanelOpen(false);
                    onRequirePurchase();
                 } else {
                    alert(response.message);
                 }
            }
        } catch (error) {
             alert((error as Error).message);
        }
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

    const handleClosePkFlow = useCallback(() => {
        if (pkPollingInterval.current) {
            clearInterval(pkPollingInterval.current);
            pkPollingInterval.current = null;
        }
        if (pkFlowStep === 'random-match-waiting') {
            liveStreamService.leavePkMatchmakingQueue(user.id);
        }
        setPkFlowStep('idle');
        setPkOpponent(null);
        setSentPkInvitation(null);
        setSimulatedIncomingInvite(null);
    }, [pkFlowStep, user.id]);

    const handleAcceptSimulatedInvite = async () => {
        if (!sentPkInvitation) {
            alert("Erro: convite simulado não encontrado.");
            handleClosePkFlow();
            return;
        }
        try {
            const battle = await liveStreamService.acceptPkInvitation(sentPkInvitation.id);
            showApiResponse(`POST /api/pk/invites/${sentPkInvitation.id}/accept`, battle);
            handleClosePkFlow();
            onViewStream(battle);
        } catch (error) {
            alert(`Não foi possível aceitar o convite de PK (simulado): ${error instanceof Error ? error.message : String(error)}`);
            handleClosePkFlow();
        }
    };

    const handleInviteSent = useCallback((invitation: ConvitePK) => {
        setSentPkInvitation(invitation);
        
        // --- SIMULATION LOGIC ---
        // If an opponent was selected (not random match), immediately create a simulated incoming invite for them.
        if (pkOpponent) {
             const simulatedInvite: PkInvitation = {
                ...invitation,
                id: `sim-${invitation.id}`, // Make ID unique for simulation to avoid key conflicts
                inviterName: user.nickname || user.name,
                inviterAvatarUrl: user.avatar_url || '',
            };
            setSimulatedIncomingInvite(simulatedInvite);
        }
        // --- END SIMULATION LOGIC ---

        const poll = async () => {
            try {
                const { invitation: updatedInvite, battle } = await liveStreamService.getPkInvitationStatus(invitation.id);
                if (!updatedInvite) {
                     if (pkPollingInterval.current) clearInterval(pkPollingInterval.current);
                     handleClosePkFlow();
                     return;
                }
                setSentPkInvitation(updatedInvite);
                if (updatedInvite.status === 'aceito' && battle) {
                    if (pkPollingInterval.current) clearInterval(pkPollingInterval.current);
                    handleClosePkFlow();
                    onViewStream(battle);
                } else if (['recusado', 'expirado', 'cancelado'].includes(updatedInvite.status)) {
                    if (pkPollingInterval.current) clearInterval(pkPollingInterval.current);
                    alert("Seu convite foi recusado ou expirou.");
                    handleClosePkFlow();
                }
            } catch (error) {
                console.error("Polling PK invitation status failed:", error);
                if (pkPollingInterval.current) clearInterval(pkPollingInterval.current);
                handleClosePkFlow();
            }
        };
        pkPollingInterval.current = window.setInterval(poll, 3000);
    }, [handleClosePkFlow, onViewStream, user, pkOpponent]);
    
    useEffect(() => {
        if (!isHost || isPkBattle) return;
        const checkIncomingInvites = async () => {
            if (pendingPkInvitation) return;
            try {
                const invite = await liveStreamService.getPendingPkInvitation(user.id);
                if (invite) {
                     const inviter = await authService.getUserProfile(invite.remetente_id);
                     setPendingPkInvitation({
                         ...invite,
                         inviterName: inviter.nickname || inviter.name,
                         inviterAvatarUrl: inviter.avatar_url || '',
                     });
                }
            } catch (e) { /* Fail silently */ }
        };
        const intervalId = setInterval(checkIncomingInvites, 5000);
        return () => clearInterval(intervalId);
    }, [isHost, isPkBattle, user.id, pendingPkInvitation]);

    useEffect(() => {
        if (!isPkBattle || !pkBattleId) return;
    
        let isMounted = true;
    
        const checkBattleStatus = async () => {
            if (!isMounted) return;
            try {
                const battleData = await liveStreamService.getActivePkBattle(pkBattleId);
                if (!isMounted) return;
    
                setActivePkBattle(battleData);
    
                if (battleData.status === 'finalizada' && battleData.data_comemoracao_fim) {
                    const celebrationEnd = new Date(battleData.data_comemoracao_fim);
                    if (new Date() > celebrationEnd) {
                        const myLive = await liveStreamService.getActiveStreamForUser(user.id);
                        if(myLive) onViewStream(myLive); else onExit();
                    }
                }
            } catch (e) {
                if (isMounted) {
                    console.error("Failed to fetch PK battle data", e);
                    onExit();
                }
            }
        };
    
        checkBattleStatus();
        const intervalId = setInterval(checkBattleStatus, 2000); // Poll faster for score updates
    
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [isPkBattle, pkBattleId, initialStream, onExit, user.id, onViewStream]);

    useEffect(() => {
        if (!isPkBattle || !pkBattleId || !activePkBattle || activePkBattle.status !== 'ativa') {
            return;
        }

        const battle = initialStream as PkBattle;
        const streamers = [battle.streamer1.userId, battle.streamer2.userId];

        const giftInterval = setInterval(async () => {
            const receiverId = streamers[Math.floor(Math.random() * streamers.length)];
            const giftValue = [10, 50, 100, 500][Math.floor(Math.random() * 4)];
            
            try {
                await liveStreamService.simulateReceivePkGift(pkBattleId, receiverId, giftValue);
            } catch (error) {
                console.error("Failed to simulate gift:", error);
            }
        }, 2500); // Send a gift every 2.5 seconds

        return () => clearInterval(giftInterval);
    }, [isPkBattle, pkBattleId, activePkBattle, initialStream]);


    const handleAcceptPkInvite = async () => {
        if (!pendingPkInvitation) return;
        try {
            const pkBattle = await liveStreamService.acceptPkInvitation(pendingPkInvitation.id);
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

    const handlePrivateInviteSent = (invitee: User) => {
        if (isPkBattle || !isPrivateStream) return;
        
        onShowPrivateLiveInvite({
            stream: initialStream as Stream,
            inviter: user,
            invitee: invitee,
        });
    };
    
    const renderSingleStreamView = () => {
        const streamerDisplayName = liveDetails?.streamerName;

        return (
            <>
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                        alt="Stream background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                </div>
    
                <div className="relative z-10 flex flex-col h-full p-2 sm:p-4">
                    <header className="flex items-start justify-between shrink-0">
                         <div className="flex flex-col items-start gap-2">
                            <div className="bg-black/40 backdrop-blur-sm p-1.5 rounded-full flex items-center gap-2">
                                <button onClick={() => handleOpenUserProfile(mainStreamerId)} className="flex items-center gap-2">
                                    <img src={liveDetails?.streamerAvatarUrl} alt={liveDetails?.streamerName} className="w-10 h-10 rounded-full object-cover"/>
                                    <div>
                                        <p className="font-bold text-sm truncate max-w-[120px]">{streamerDisplayName}</p>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                            ||
                                            <span>{formatStatNumber(liveDetails?.streamerFollowers || 0)}</span>
                                        </div>
                                    </div>
                                </button>
                                 {!isHost && (
                                    <button
                                        onClick={() => handleFollowToggle(mainStreamerId)}
                                        disabled={isFollowLoading[mainStreamerId]}
                                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                                            isFollowing[mainStreamerId] ? 'bg-white/20' : 'bg-green-500'
                                        }`}
                                    >
                                        {isFollowLoading[mainStreamerId] ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : isFollowing[mainStreamerId] ? (
                                            <CheckIcon className="w-5 h-5 text-white" />
                                        ) : (
                                            <PlusIcon className="w-5 h-5 text-black" />
                                        )}
                                    </button>
                                )}
                            </div>
                            <button onClick={() => liveDetails && mainStreamerInfo && setViewingRankingFor({ liveId, streamer: { id: mainStreamerInfo.userId, name: liveDetails.streamerName, avatarUrl: liveDetails.streamerAvatarUrl || '' }})} className="bg-black/40 backdrop-blur-sm px-2 py-1.5 rounded-full flex items-center gap-2 self-start">
                                <div className="flex items-center gap-1"><span className="font-bold text-yellow-400">G</span><span className="font-semibold text-sm text-white">{formatStatNumber(liveDetails?.receivedGiftsValue || 0)}</span></div>
                                <div className="flex items-center gap-1"><PinkHeartIcon className="w-5 h-5" /><span className="font-semibold text-sm text-white">{formatStatNumber(liveDetails?.likeCount || 0)}</span></div>
                            </button>
                        </div>
    
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsOnlineUsersModalOpen(true)} className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full">
                               <span className="font-bold text-sm">{formatStatNumber(liveDetails?.viewerCount || 0)}</span>
                            </button>
                            <button onClick={handleExitClick} className="p-2 bg-black/40 rounded-full">
                                <CrossIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </header>
    
                    <main className="flex-grow flex flex-col justify-end overflow-hidden pointer-events-none">
                        <FloatingGiftAnimation lastGift={lastSentGift} />
                        <div className="w-full max-w-md pointer-events-auto">
                            <ChatArea messages={chatMessages} onUserClick={handleOpenUserProfile} />
                        </div>
                    </main>
    
                    <footer className="shrink-0 pt-2 pointer-events-auto flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                             <button onClick={() => setIsPkLiveRoomModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                <PkIcon className="w-7 h-7"/>
                            </button>
                            <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                <ShoppingBasketIcon className="w-6 h-6 text-yellow-200" />
                            </button>
                        </div>
                       
                        <div className="flex-grow">
                            <ChatInput onSendMessage={handleSendMessage} disabled={isBlockedByHost} />
                        </div>

                        <div className="flex items-center gap-2">
                            {isHost && (
                                <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                    <AnchorToolsIcon className="w-6 h-6 text-purple-300"/>
                                </button>
                            )}
                            <button onClick={() => {}} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                <CoracaoIcon className="w-7 h-7 text-red-500" />
                            </button>
                        </div>
                    </footer>
                </div>
            </>
        );
    }

    const renderPkBattleView = () => {
        const battle = initialStream as PkBattle;
        const score1 = activePkBattle?.pontos_streamer_1 ?? battle.streamer1.score;
        const score2 = activePkBattle?.pontos_streamer_2 ?? battle.streamer2.score;
        const totalScore = score1 + score2;
        const streamer1Percent = totalScore > 0 ? (score1 / totalScore) * 100 : 50;
        const isBattleFinished = activePkBattle?.status === 'finalizada';
        
        return (
             <div className="h-screen w-full bg-black text-white font-sans flex flex-col relative overflow-hidden">
                <FloatingGiftAnimation lastGift={lastSentGift} />

                {/* PK Battle Area */}
                <div className="w-full aspect-[4/3] sm:aspect-video shrink-0 relative">
                    {/* Video Panels */}
                    <div className="absolute top-0 left-0 w-1/2 h-full bg-cover bg-center" style={{backgroundImage: `url(${battle.streamer1.avatarUrl})`}} />
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-cover bg-center" style={{backgroundImage: `url(${battle.streamer2.avatarUrl})`}} />
                    
                    {/* Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none"></div>

                    {/* UI Overlay on PK Area */}
                    <div className="relative z-10 flex flex-col h-full p-2 sm:p-4">
                        {/* Header: Streamer info and exit */}
                        <div className="flex justify-between items-start">
                            <PkStreamerHeader 
                                streamer={battle.streamer1} 
                                details={liveDetails} 
                                onUserClick={handleOpenUserProfile}
                                onOpenRanking={() => setViewingRankingFor({ liveId: battle.streamer1.streamId, streamer: { id: battle.streamer1.userId, name: battle.streamer1.name, avatarUrl: battle.streamer1.avatarUrl }})}
                            />
                            <div className="flex flex-col items-center gap-2 shrink-0 mx-2">
                                <button onClick={handleExitClick} className="p-2 bg-black/40 rounded-full">
                                    <CrossIcon className="w-6 h-6"/>
                                </button>
                            </div>
                            <div className="flex justify-end">
                                <PkStreamerHeader 
                                    streamer={battle.streamer2} 
                                    details={pkOpponentDetails} 
                                    onUserClick={handleOpenUserProfile}
                                    onOpenRanking={() => setViewingRankingFor({ liveId: battle.streamer2.streamId, streamer: { id: battle.streamer2.userId, name: battle.streamer2.name, avatarUrl: battle.streamer2.avatarUrl }})}
                                />
                            </div>
                        </div>

                        {/* Spacer to push score bar to the bottom of this container */}
                        <div className="flex-grow"></div>

                        {/* PK Score Bar */}
                        <div className="relative w-full flex flex-col items-center gap-2">
                            <div className="w-full flex justify-between items-center text-white font-bold px-2">
                                <span className="truncate max-w-[calc(50%-4rem)] text-sm">{battle.streamer1.name}</span>
                                <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg text-lg font-mono shadow-md">
                                    <CountdownTimer endTime={activePkBattle?.data_fim || ''} />
                                </div>
                                <span className="truncate max-w-[calc(50%-4rem)] text-sm text-right">{battle.streamer2.name}</span>
                            </div>
                            <div className="relative w-full h-6 bg-black/40 rounded-full overflow-hidden flex items-center border border-white/20">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out" style={{ width: `${streamer1Percent}%` }} />
                                <div className="h-full bg-gradient-to-l from-pink-500 to-red-400" style={{ width: `${100 - streamer1Percent}%` }} />
                                <div className="absolute inset-0 flex justify-between items-center px-4">
                                    <span className="font-bold text-sm text-white drop-shadow-lg">{formatScore(score1)}</span>
                                    <span className="font-bold text-sm text-white drop-shadow-lg">{formatScore(score2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Winner Overlay */}
                    {isBattleFinished && (
                        <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-around pointer-events-none">
                            <div className="text-center">
                                {activePkBattle?.vencedor_id === battle.streamer1.userId ? (
                                    <><span className="text-6xl">👑</span><p className="text-4xl font-black text-yellow-400 drop-shadow-lg">VENCEDOR</p></>
                                ) : (
                                    <><span className="text-6xl">😢</span><p className="text-4xl font-black text-gray-400 drop-shadow-lg">PERDEDOR</p></>
                                )}
                            </div>
                            <div className="text-center">
                                {activePkBattle?.vencedor_id === battle.streamer2.userId ? (
                                    <><span className="text-6xl">👑</span><p className="text-4xl font-black text-yellow-400 drop-shadow-lg">VENCEDOR</p></>
                                ) : (
                                    <><span className="text-6xl">😢</span><p className="text-4xl font-black text-gray-400 drop-shadow-lg">PERDEDOR</p></>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Chat & Footer Area */}
                <div className="flex-grow flex flex-col justify-end overflow-hidden p-2 sm:p-4">
                    <main className="flex-grow flex flex-col justify-end overflow-hidden pointer-events-none">
                        <div className="w-full md:w-3/4 lg:w-1/2 pointer-events-auto">
                            <ChatArea messages={chatMessages} onUserClick={handleOpenUserProfile} />
                        </div>
                    </main>
                    <footer className="shrink-0 pt-2 pointer-events-auto z-10">
                         <div className="flex items-center gap-2">
                            <div className="flex-grow">
                                <ChatInput onSendMessage={handleSendMessage} disabled={isBlockedByHost} />
                            </div>
                             <div className="flex items-center gap-2 shrink-0">
                                {isHost && (
                                    <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                        <AnchorToolsIcon className="w-6 h-6 text-purple-300"/>
                                    </button>
                                )}
                                <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                    <ShoppingBasketIcon className="w-6 h-6 text-yellow-200" />
                                </button>
                                <button onClick={() => {}} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                    <CoracaoIcon className="w-7 h-7 text-red-500" />
                                </button>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        )
    };
    
    return (
        <div className="h-screen w-full bg-black text-white font-sans flex flex-col">
            {isPkBattle ? renderPkBattleView() : renderSingleStreamView()}

            {/* --- Modals --- */}
            {isEndStreamModalOpen && <EndStreamConfirmationModal 
                onConfirm={isPkBattle ? confirmEndPkBattle : confirmStopStream} 
                onCancel={() => setIsEndStreamModalOpen(false)} 
                title={isPkBattle ? 'Encerrar Batalha PK?' : 'Encerrar Transmissão?'}
                message={isPkBattle ? 'Tem certeza que deseja encerrar a batalha? Sua transmissão continuará.' : 'Tem certeza que deseja encerrar a transmissão?'}
                confirmText={isPkBattle ? 'Encerrar PK' : 'Encerrar'}
            />}
            {isOnlineUsersModalOpen && <OnlineUsersModal liveId={liveId} onClose={() => setIsOnlineUsersModalOpen(false)} onUserClick={(userId) => {setIsOnlineUsersModalOpen(false); handleOpenUserProfile(userId);}} />}
            {viewingUserId && <UserProfileModal userId={viewingUserId} currentUser={user} onUpdateUser={onUpdateUser} onClose={() => setViewingUserId(null)} onNavigateToChat={onNavigateToChat} onViewProtectors={onViewProtectors} onViewStream={onViewStream} />}
            {isGiftPanelOpen && <GiftPanel user={user} liveId={liveId} onClose={() => setIsGiftPanelOpen(false)} onSendGift={handleSendGift} onRechargeClick={onRequirePurchase} pkBattleStreamers={isPkBattle ? { streamer1: mainStreamerInfo, streamer2: opponentStreamerInfo! } : undefined} />}
            {isArcoraToolModalOpen && <ArcoraToolModal 
                onClose={() => setIsArcoraToolModalOpen(false)} 
                onOpenMuteModal={() => { setIsArcoraToolModalOpen(false); setIsMuteUserModalOpen(true); }}
                onOpenSoundEffectModal={() => { setIsArcoraToolModalOpen(false); setIsSoundEffectModalOpen(true); }}
                onSwitchCamera={() => {}} 
                onToggleVoice={() => {}} 
                isVoiceEnabled={false} 
                onOpenPrivateChat={() => { setIsArcoraToolModalOpen(false); setIsPrivateChatModalOpen(true); }}
                isPrivateStream={isPrivateStream}
                onOpenPrivateInviteModal={() => { setIsArcoraToolModalOpen(false); setIsInviteToPrivateLiveModalOpen(true); }}
                onOpenSelectOpponentModal={() => { setIsArcoraToolModalOpen(false); setIsPkLiveRoomModalOpen(true); }}
            />}
            {isPkLiveRoomModalOpen && <PkLiveRoomModal friendsAvailable={user.following.length} onClose={() => setIsPkLiveRoomModalOpen(false)} onRandomMatch={() => {setIsPkLiveRoomModalOpen(false); setPkFlowStep('random-match-waiting')}} onPairWithFriends={() => {setIsPkLiveRoomModalOpen(false); setPkFlowStep('select')}} onOpenSettings={() => {setIsPkLiveRoomModalOpen(false); setIsPkSettingsModalOpen(true);}} />}
            {pkFlowStep === 'select' && <SelectOpponentModal currentUserId={user.id} onClose={handleClosePkFlow} onInvite={(opponent) => { setPkOpponent(opponent); setPkFlowStep('invite'); }} />}
            {pkFlowStep === 'invite' && pkOpponent && <PkInvitationModal currentUser={user} opponent={pkOpponent} onInviteSent={handleInviteSent} onClose={handleClosePkFlow} invitation={sentPkInvitation} />}
            {pkFlowStep === 'random-match-waiting' && (
                <PkRandomMatchModal
                    currentUser={user}
                    onClose={handleClosePkFlow}
                    onMatchFound={(battle) => {
                        handleClosePkFlow();
                        onViewStream(battle);
                    }}
                />
            )}
             {simulatedIncomingInvite && pkOpponent && (
                <AcceptPkInviteModal
                    currentUser={pkOpponent}
                    invitation={simulatedIncomingInvite}
                    onAccept={handleAcceptSimulatedInvite}
                    onDecline={() => {
                        handleClosePkFlow();
                        if (sentPkInvitation) {
                            liveStreamService.cancelPkInvitation(sentPkInvitation.id);
                        }
                    }}
                />
            )}
            {pendingPkInvitation && <AcceptPkInviteModal currentUser={user} invitation={pendingPkInvitation} onAccept={handleAcceptPkInvite} onDecline={handleDeclinePkInvite} />}
            {isMuteUserModalOpen && <MuteUserModal liveId={liveId} mutedUsers={mutedUsers} onMuteUser={handleMuteUser} onKickUser={handleKickUser} onClose={() => setIsMuteUserModalOpen(false)}/>}
            {isSoundEffectModalOpen && <SoundEffectModal onClose={() => setIsSoundEffectModalOpen(false)} onPlaySoundEffect={handlePlaySoundEffect}/>}
            {isPkSettingsModalOpen && <PkSettingsModal userId={user.id} onClose={() => setIsPkSettingsModalOpen(false)}/>}
            {isPrivateChatModalOpen && <PrivateChatModal user={user} onClose={() => setIsPrivateChatModalOpen(false)} />}
            {isInviteToPrivateLiveModalOpen && <InviteToPrivateLiveModal streamerId={user.id} liveId={liveId} onClose={() => setIsInviteToPrivateLiveModalOpen(false)} onInviteSent={handlePrivateInviteSent} />}


             {viewingRankingFor && (
                <HourlyRankingModal
                    liveId={viewingRankingFor.liveId}
                    currentUser={user}
                    onUpdateUser={onUpdateUser}
                    streamer={viewingRankingFor.streamer}
                    onClose={() => setViewingRankingFor(null)}
                    onUserClick={(userId) => { setViewingRankingFor(null); handleOpenUserProfile(userId); }}
                    onNavigateToList={() => {}}
                    onRequirePurchase={onRequirePurchase}
                />
            )}
        </div>
    );
};

export default LiveStreamViewerScreen;