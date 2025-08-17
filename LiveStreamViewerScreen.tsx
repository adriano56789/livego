
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Stream, PkBattle, ChatMessage, LiveDetails, PkInvitation, SoundEffectName, MuteStatusListener, UserKickedListener, SoundEffectListener, PublicProfile, BatalhaPK, ConvitePK, IncomingPrivateLiveInvite } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import * as soundService from '../services/soundService';
import { useApiViewer } from './ApiContext';

import CrossIcon from './icons/CrossIcon';
import ViewersIcon from './icons/ViewersIcon';
import AnchorToolsIcon from './icons/AnchorToolsIcon';
import CoracaoIcon from './icons/CoracaoIcon';
import ShoppingBasketIcon from './icons/ShoppingBasketIcon';
import ChatBubbleIcon from './icons/ChatBubbleIcon';
import MessageIcon from './icons/MessageIcon';
import PlusIcon from './icons/PlusIcon';
import CheckIcon from './icons/CheckIcon';
import DiamondIcon from './icons/DiamondIcon';
import SwordsIcon from './icons/SwordsIcon';


// New Icons
import CoinBIcon from './icons/CoinBIcon';
import PinkHeartIcon from './icons/PinkHeartIcon';

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
  onShowPrivateLiveInvite,
}) => {
    const { showApiResponse } = useApiViewer();
    const isPkBattle = 'streamer1' in initialStream;
    const pkBattleId = isPkBattle ? (initialStream as PkBattle).id : null;

    const [activePkBattle, setActivePkBattle] = useState<BatalhaPK | null>(null);

    // Common State
    const [liveDetails, setLiveDetails] = useState<LiveDetails | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isFollowing, setIsFollowing] = useState<Record<number, boolean>>({});
    const [isBlockedByHost, setIsBlockedByHost] = useState(false);
    const [lastSentGift, setLastSentGift] = useState<ChatMessage | null>(null);
    
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
    
    const [pendingPkInvitation, setPendingPkInvitation] = useState<PkInvitation | null>(null);
    const [isInviteToPrivateLiveModalOpen, setIsInviteToPrivateLiveModalOpen] = useState(false);
    const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
    const [isRankingListOpen, setIsRankingListOpen] = useState(false);
    const [isPrivateChatModalOpen, setIsPrivateChatModalOpen] = useState(false);
    const [isPkLiveRoomModalOpen, setIsPkLiveRoomModalOpen] = useState(false);
    const [isPkSettingsModalOpen, setIsPkSettingsModalOpen] = useState(false);

    // PK Invitation Flow State
    const [pkOpponent, setPkOpponent] = useState<User | null>(null);
    const [pkFlowStep, setPkFlowStep] = useState<'idle' | 'select' | 'invite' | 'random-match-waiting'>('idle');
    const [sentPkInvitation, setSentPkInvitation] = useState<ConvitePK | null>(null);
    const [simulatedIncomingInvite, setSimulatedIncomingInvite] = useState<PkInvitation | null>(null);
    const pkPollingInterval = useRef<number | null>(null);

    const liveId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : (initialStream as Stream).id;
    const streamerId = isPkBattle ? (initialStream as PkBattle).streamer1.userId : (initialStream as Stream).userId;
    const isHost = isPkBattle 
        ? user.id === (initialStream as PkBattle).streamer1.userId || user.id === (initialStream as PkBattle).streamer2.userId
        : user.id === streamerId;
    const isPrivateStream = !isPkBattle && (initialStream as Stream).isPrivate;

    const fetchLiveDetails = useCallback(async () => {
        try {
            const streamToFetch = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : (initialStream as Stream).id;
            const details = await liveStreamService.getLiveStreamDetails(streamToFetch);
            setLiveDetails(details);
        } catch (error) { console.error(error); }
    }, [isPkBattle, initialStream]);
    
    const streamHostId = isPkBattle ? (initialStream as PkBattle).streamer1.userId : streamerId;
    
    // Effect for initial block check
    useEffect(() => {
        if (isHost) return;
        liveStreamService.isUserBlocked(streamHostId, user.id)
            .then(({ isBlocked }) => {
                setIsBlockedByHost(isBlocked);
            })
            .catch(err => console.error("Failed to check block status:", err));
    }, [streamHostId, user.id, isHost]);
    
    // Effect for real-time block updates
    useEffect(() => {
        const handleBlocked: liveStreamService.UserBlockedListener = ({ blockerId, targetId }) => {
            if (blockerId === streamHostId && targetId === user.id) {
                setIsBlockedByHost(true);
            }
        };

        const handleUnblocked: liveStreamService.UserUnblockedListener = ({ unblockerId, targetId }) => {
            if (unblockerId === streamHostId && targetId === user.id) {
                setIsBlockedByHost(false);
            }
        };

        liveStreamService.addUserBlockedListener(handleBlocked);
        liveStreamService.addUserUnblockedListener(handleUnblocked);
        return () => {
            liveStreamService.removeUserBlockedListener(handleBlocked);
            liveStreamService.removeUserUnblockedListener(handleUnblocked);
        };
    }, [streamHostId, user.id]);

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
    
    const handleClosePkFlow = () => {
        if (pkPollingInterval.current) clearInterval(pkPollingInterval.current);
        setPkFlowStep('idle');
        setPkOpponent(null);
        setSentPkInvitation(null);
        setSimulatedIncomingInvite(null);
    };

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

    useEffect(() => {
        const checkIncomingInvites = async () => {
            if (!isHost || simulatedIncomingInvite) return;
            try {
                const invite = await liveStreamService.getPendingPkInvitation(user.id);
                if (invite && (!pendingPkInvitation || pendingPkInvitation.id !== invite.id)) {
                     const inviter = await authService.getUserProfile(invite.remetente_id);
                     setPendingPkInvitation({
                         ...invite,
                         inviterName: inviter.nickname || inviter.name,
                         inviterAvatarUrl: inviter.avatar_url || '',
                     });
                } else if (!invite && pendingPkInvitation) {
                    // Invitation was likely cancelled or expired
                    setPendingPkInvitation(null);
                }
            } catch (e) { /* Fail silently */ }
        };
        const intervalId = setInterval(checkIncomingInvites, 5000);
        return () => clearInterval(intervalId);
    }, [isHost, user.id, pendingPkInvitation, simulatedIncomingInvite]);

    useEffect(() => {
        if (!isPkBattle || !pkBattleId) return;
    
        let isMounted = true;
    
        const checkBattleStatus = async () => {
            if (!isMounted) return;
            try {
                const battleData = await liveStreamService.getActivePkBattle(pkBattleId);
                if (!isMounted) return;
    
                setActivePkBattle(prevBattle => {
                    if (JSON.stringify(prevBattle) !== JSON.stringify(battleData)) {
                        return battleData;
                    }
                    return prevBattle;
                });
    
                if (battleData.status === 'finalizada' && battleData.data_comemoracao_fim) {
                    const celebrationEnd = new Date(battleData.data_comemoracao_fim);
                    if (new Date() > celebrationEnd) {
                        onStreamEnded((initialStream as PkBattle).streamer1.streamId);
                    }
                }
            } catch (e) {
                if (isMounted) {
                    console.error("Failed to fetch PK battle data", e);
                    onStreamEnded((initialStream as PkBattle).streamer1.streamId);
                }
            }
        };
    
        checkBattleStatus();
        const intervalId = setInterval(checkBattleStatus, 3000);
    
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [isPkBattle, pkBattleId, onStreamEnded, initialStream]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const streamToFetchId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : liveId;
                const [details, messages] = await Promise.all([
                    liveStreamService.getLiveStreamDetails(streamToFetchId),
                    liveStreamService.getChatMessages(streamToFetchId),
                ]);
                setLiveDetails(details);
                setChatMessages(messages);
            } catch (error) { console.error(error); onExit(); }
        };
        fetchInitialData();
        const interval = setInterval(fetchLiveDetails, 5000); // Poll details for updates
        return () => clearInterval(interval);
    }, [liveId, onExit, fetchLiveDetails, isPkBattle, initialStream]);

    useEffect(() => {
        const handleChatMessageUpdate = (id: number, messages: ChatMessage[]) => { 
            if (id === liveId) {
                setChatMessages(messages);
                const newGift = messages.filter(m => m.type === 'gift').pop();
                if(newGift) {
                    setLastSentGift(newGift);
                }
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
        const joinId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : liveId;
        liveStreamService.joinLiveStream(user.id, joinId).catch(error => {
            if (error.message.includes('removido')) {
                setKickedState('banned_on_join');
            } else { onExit(); }
        });
        if (user.equipped_entry_effect_id) liveStreamService.postSpecialEntryMessage(joinId, user.id);
        return () => { liveStreamService.leaveLiveStream(user.id, joinId); };
    }, [user.id, liveId, onExit, user.equipped_entry_effect_id, isPkBattle, initialStream]);
    
    const handleSendMessage = useCallback(async (message: string) => {
        try { await liveStreamService.sendChatMessage(liveId, user.id, message); } catch (error) { alert((error as Error).message); }
    }, [liveId, user.id]);
    
    const handleSendLike = async () => {
        await liveStreamService.sendLike(liveId, user.id);
        fetchLiveDetails();
    };

    const handleSendGift = async (giftId: number, receiverId?: number) => {
        const targetReceiverId = isPkBattle ? receiverId : streamerId;
        if (isPkBattle && !targetReceiverId) {
            alert("Por favor, selecione para qual streamer enviar o presente.");
            return;
        }
        try {
            const response = await liveStreamService.sendGift(liveId, user.id, giftId, targetReceiverId);
            if (response.success && response.updatedUser) {
                onUpdateUser(response.updatedUser);
            } else {
                 if (response.message.includes('insuficientes')) {
                    setIsGiftPanelOpen(false); // Close panel before opening purchase overlay
                    onRequirePurchase();
                 } else {
                    alert(response.message);
                 }
            }
            if(response.success) {
                setIsGiftPanelOpen(false);
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
    
    // --- PK Invitation Flow Handlers ---
    const handleInviteSent = useCallback((invitation: ConvitePK) => {
        setSentPkInvitation(invitation);

        if (pkOpponent) {
            const simulatedInvite: PkInvitation = {
                ...invitation,
                id: `sim-${invitation.id}`,
                inviterName: user.nickname || user.name,
                inviterAvatarUrl: user.avatar_url || '',
            };
            setSimulatedIncomingInvite(simulatedInvite);
        }

        const poll = async () => {
            try {
                const { invitation: updatedInvite, battle } = await liveStreamService.getPkInvitationStatus(invitation.id);
                setSentPkInvitation(updatedInvite);

                if (updatedInvite.status === 'aceito' && battle) {
                    if (pkPollingInterval.current) clearInterval(pkPollingInterval.current);
                    handleClosePkFlow();
                    onViewStream(battle);
                } else if (updatedInvite.status === 'recusado' || updatedInvite.status === 'expirado') {
                    if (pkPollingInterval.current) clearInterval(pkPollingInterval.current);
                    alert("Seu convite foi recusado ou expirou.");
                    handleClosePkFlow();
                }
            } catch (error) {
                console.error("Polling error:", error);
                if (pkPollingInterval.current) clearInterval(pkPollingInterval.current);
                handleClosePkFlow();
            }
        };

        pkPollingInterval.current = window.setInterval(poll, 5000);
    }, [onViewStream, pkOpponent, user]);
    
    const handlePrivateInviteSent = (invitee: User) => {
        if (isPkBattle) return; // Cannot send private invites from PK battle

        onShowPrivateLiveInvite({
            stream: initialStream as Stream,
            inviter: user,
            invitee: invitee,
        });
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
                <button onClick={() => setIsPrivateChatModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <MessageIcon className="w-6 h-6 text-white"/>
                </button>
            )}
            <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <ShoppingBasketIcon className="w-6 h-6 text-yellow-200" />
            </button>
             <button onClick={handleSendLike} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <CoracaoIcon className="w-7 h-7 text-red-500" />
            </button>
        </div>
    );

    const renderSingleStreamView = () => {
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
                                <button onClick={() => handleOpenUserProfile(streamerId)} className="flex items-center gap-2">
                                    <img src={liveDetails?.streamerAvatarUrl} alt={liveDetails?.streamerName} className="w-10 h-10 rounded-full object-cover"/>
                                    <div>
                                        <p className="font-bold text-sm truncate max-w-[120px]">{liveDetails?.streamerName}</p>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                            ||
                                            <span>{formatStatNumber(liveDetails?.streamerFollowers || 0)}</span>
                                        </div>
                                    </div>
                                </button>
                                 {!isHost && (
                                    <button
                                        onClick={() => handleFollowToggle(streamerId)}
                                        disabled={isFollowLoading[streamerId]}
                                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                                            isFollowing[streamerId]
                                                ? 'bg-white/20'
                                                : 'bg-green-500'
                                        }`}
                                    >
                                        {isFollowLoading[streamerId] ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : isFollowing[streamerId] ? (
                                            <CheckIcon className="w-5 h-5 text-white" />
                                        ) : (
                                            <PlusIcon className="w-5 h-5 text-black" />
                                        )}
                                    </button>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsHourlyRankingModalOpen(true)} 
                                className="bg-black/40 backdrop-blur-sm px-2 py-1.5 rounded-full flex items-center gap-2 self-start"
                            >
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-yellow-400">G</span>
                                    <span className="font-semibold text-sm text-white">{formatStatNumber(liveDetails?.receivedGiftsValue || 0)}</span>
                                </div>
                                <div className="w-px h-4 bg-gray-600"></div>
                                <div className="flex items-center gap-1">
                                    <PinkHeartIcon className="w-5 h-5" />
                                    <span className="font-semibold text-sm text-white">{formatStatNumber(liveDetails?.likeCount || 0)}</span>
                                </div>
                            </button>
                        </div>
    
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsOnlineUsersModalOpen(true)} 
                                className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full"
                            >
                               <ViewersIcon className="w-5 h-5"/>
                               <span className="font-bold text-sm">{formatStatNumber(liveDetails?.viewerCount || 0)}</span>
                            </button>
                            <button onClick={handleExitClick} className="p-2 bg-black/40 rounded-full">
                                <CrossIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </header>
    
                    <main className="flex-grow flex flex-col justify-end overflow-hidden pointer-events-none">
                        <div className="w-full md:w-3/4 lg:w-1/2 pointer-events-auto">
                            <FloatingGiftAnimation lastGift={lastSentGift} />
                            <ChatArea messages={chatMessages} onUserClick={handleOpenUserProfile} />
                        </div>
                    </main>
                    
                    <footer className="shrink-0 pt-2 pointer-events-auto">
                        <div className="flex items-center gap-2">
                            <div className="flex-grow">
                                <ChatInput onSendMessage={handleSendMessage} disabled={isBlockedByHost} />
                            </div>
                            {renderCommonFooterButtons()}
                        </div>
                    </footer>
                </div>
            </>
        );
    };
    
    // --- PK Battle View Components ---
    const PkBattleHeader = ({ battle, score1, score2 }: { battle: PkBattle, score1: number, score2: number }) => (
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm p-1 pr-2 rounded-full">
          <button onClick={() => handleOpenUserProfile(battle.streamer1.userId)}>
            <img src={battle.streamer1.avatarUrl} alt={battle.streamer1.name} className="w-10 h-10 rounded-full object-cover"/>
          </button>
          <div>
            <p className="font-bold text-sm truncate max-w-[80px]">{battle.streamer1.name}</p>
            <p className="text-xs text-gray-300">Score: <span className="font-semibold text-white">{formatScore(score1)}</span></p>
          </div>
        </div>
    
        <div className="flex items-center gap-2">
            <button onClick={() => setIsOnlineUsersModalOpen(true)} className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full">
               <ViewersIcon className="w-5 h-5"/>
               <span className="font-bold text-sm">{formatStatNumber(liveDetails?.viewerCount || 0)}</span>
            </button>
            <button onClick={handleExitClick} className="p-2 bg-black/40 rounded-full"><CrossIcon className="w-6 h-6"/></button>
        </div>
    
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm p-1 pl-2 rounded-full">
          <div className="text-right">
            <p className="font-bold text-sm truncate max-w-[80px]">{battle.streamer2.name}</p>
            <p className="text-xs text-gray-300">Score: <span className="font-semibold text-white">{formatScore(score2)}</span></p>
          </div>
          <button onClick={() => handleOpenUserProfile(battle.streamer2.userId)}>
            <img src={battle.streamer2.avatarUrl} alt={battle.streamer2.name} className="w-10 h-10 rounded-full object-cover"/>
          </button>
        </div>
      </header>
    );

    const renderPkBattleView = () => {
        const battle = initialStream as PkBattle;
        const score1 = activePkBattle?.pontos_streamer_1 ?? battle.streamer1.score;
        const score2 = activePkBattle?.pontos_streamer_2 ?? battle.streamer2.score;
        const totalScore = score1 + score2;
        const streamer1Percent = totalScore > 0 ? (score1 / totalScore) * 100 : 50;
        
        return (
             <div className="relative h-full w-full bg-black">
                {/* Video Panels */}
                <div className="absolute top-0 left-0 w-1/2 h-full bg-cover bg-center" style={{backgroundImage: `url(${battle.streamer1.avatarUrl})`}} />
                <div className="absolute top-0 right-0 w-1/2 h-full bg-cover bg-center" style={{backgroundImage: `url(${battle.streamer2.avatarUrl})`}} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

                <div className="relative z-10 flex flex-col h-full p-2 sm:p-4">
                    <PkBattleHeader battle={battle} score1={score1} score2={score2} />

                    {/* VS Bar and Timer */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] flex flex-col items-center gap-2">
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
                            <FloatingGiftAnimation lastGift={lastSentGift} />
                            <ChatArea messages={chatMessages} onUserClick={handleOpenUserProfile} />
                        </div>
                    </main>

                    <footer className="shrink-0 pt-2 pointer-events-auto">
                        <div className="flex items-center gap-2">
                            <div className="flex-grow">
                                <ChatInput onSendMessage={handleSendMessage} disabled={isBlockedByHost} />
                            </div>
                            {renderCommonFooterButtons()}
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
            {isEndStreamModalOpen && <EndStreamConfirmationModal onConfirm={confirmStopStream} onCancel={() => setIsEndStreamModalOpen(false)} />}
            {pkFlowStep === 'select' && <SelectOpponentModal currentUserId={user.id} onClose={handleClosePkFlow} onInvite={(opponent) => { setPkOpponent(opponent); setPkFlowStep('invite'); }} />}
            {pkFlowStep === 'invite' && pkOpponent && <PkInvitationModal currentUser={user} opponent={pkOpponent} onInviteSent={handleInviteSent} onClose={handleClosePkFlow} invitation={sentPkInvitation} />}
            {pkFlowStep === 'random-match-waiting' && (
                <PkRandomMatchModal
                    currentUser={user}
                    onClose={() => setPkFlowStep('idle')}
                    onMatchFound={(battle) => {
                        setPkFlowStep('idle');
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
            {isInviteToPrivateLiveModalOpen && <InviteToPrivateLiveModal streamerId={user.id} liveId={liveId} onClose={() => setIsInviteToPrivateLiveModalOpen(false)} onInviteSent={handlePrivateInviteSent} />}
            {isQuickChatOpen && <QuickChatModal onClose={() => setIsQuickChatOpen(false)} onSendMessage={(msg) => { handleSendMessage(msg); setIsQuickChatOpen(false); }} />}
            {isPkLiveRoomModalOpen && <PkLiveRoomModal friendsAvailable={user.following.length} onClose={() => setIsPkLiveRoomModalOpen(false)} onRandomMatch={() => { setIsPkLiveRoomModalOpen(false); setPkFlowStep('random-match-waiting'); }} onPairWithFriends={() => { setIsPkLiveRoomModalOpen(false); setPkFlowStep('select'); }} onOpenSettings={() => { setIsPkLiveRoomModalOpen(false); setIsPkSettingsModalOpen(true); }} />}
            {isPkSettingsModalOpen && <PkSettingsModal userId={user.id} onClose={() => setIsPkLiveRoomModalOpen(false)} />}
            
            {/* Re-using existing modals */}
            {isOnlineUsersModalOpen && <OnlineUsersModal liveId={liveId} onClose={() => setIsOnlineUsersModalOpen(false)} onUserClick={handleOpenUserProfile} />}
            {isHourlyRankingModalOpen && liveDetails && <HourlyRankingModal liveId={liveId} currentUser={user} onUpdateUser={onUpdateUser} streamer={{id: streamerId, name: liveDetails.streamerName, avatarUrl: liveDetails.streamerAvatarUrl}} onClose={() => setIsHourlyRankingModalOpen(false)} onUserClick={(userId) => { setIsHourlyRankingModalOpen(false); handleOpenUserProfile(userId); }} onNavigateToList={() => { setIsHourlyRankingModalOpen(false); setIsRankingListOpen(true); }} onRequirePurchase={onRequirePurchase} />}
            {isGiftPanelOpen && <GiftPanel user={user} liveId={liveId} onClose={() => setIsGiftPanelOpen(false)} onSendGift={handleSendGift} onRechargeClick={() => { setIsGiftPanelOpen(false); onRequirePurchase(); }} pkBattleStreamers={isPkBattle ? { streamer1: (initialStream as PkBattle).streamer1, streamer2: (initialStream as PkBattle).streamer2 } : undefined}/>}
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
                onOpenPrivateChat={() => { setIsArcoraToolModalOpen(false); setIsPrivateChatModalOpen(true); }}
                onOpenSelectOpponentModal={() => { setIsArcoraToolModalOpen(false); setIsPkLiveRoomModalOpen(true); }}
                isPrivateStream={isPrivateStream}
                onOpenPrivateInviteModal={() => { setIsArcoraToolModalOpen(false); setIsInviteToPrivateLiveModalOpen(true); }}
            />}
            {isRankingListOpen && <RankingListScreen liveId={liveId} currentUser={user} onExit={() => setIsRankingListOpen(false)} onUserClick={(userId) => { setIsRankingListOpen(false); handleOpenUserProfile(userId); }} />}
            {isPrivateChatModalOpen && <PrivateChatModal user={user} onClose={() => setIsPrivateChatModalOpen(false)} />}
        </div>
    );
};

export default LiveStreamViewerScreen;
