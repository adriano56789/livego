import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Stream, PkBattle, ChatMessage, LiveDetails, PkInvitation, SoundEffectName, MuteStatusListener, UserKickedListener, SoundEffectListener, PublicProfile, PkBattleState, ConvitePK, IncomingPrivateLiveInvite, UserBlockedListener, UserUnblockedListener, Viewer } from '../types';
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
import LinkedCirclesIcon from './icons/LinkedCirclesIcon';
import GroupIcon from './icons/GroupIcon';
import LevelBarIcon from './icons/LevelBarIcon';


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
import AcceptPkInviteModal from './AcceptPkInviteModal';
import InviteToPrivateLiveModal from './InviteToPrivateLiveModal';
import QuickChatModal from './QuickChatModal';
import RankingListScreen from './RankingListScreen';
import PrivateChatModal from './PrivateChatModal';
import PkInviteModal from './PkInviteModal';
import PkSettingsModal from './PkSettingsModal';
import FloatingGiftAnimation from './FloatingGiftAnimation';
import AudioVisualizer from './AudioVisualizer';
import PkStartDisputeModal from './PkStartDisputeModal';
import PkClashAnimation from './PkClashAnimation';
import PkInvitationModal from './PkInvitationModal';
import PkLevelBadgeIcon from './icons/PkLevelBadgeIcon';
import LiveStreamHeader from './LiveStreamHeader';


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

const PkTimer: React.FC<{ startTime: string; durationSeconds: number }> = ({ startTime, durationSeconds }) => {
    const calculateTimeLeft = useCallback(() => {
        const endTime = new Date(startTime).getTime() + durationSeconds * 1000;
        const difference = endTime - Date.now();
        if (difference <= 0) return { m: 0, s: 0 };

        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        return { m: minutes, s: seconds };
    }, [startTime, durationSeconds]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    return <span>{`${String(timeLeft.m).padStart(2, '0')}:${String(timeLeft.s).padStart(2, '0')}`}</span>;
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
  onShowPrivateLiveInvite,
}) => {
    const { showApiResponse } = useApiViewer();
    const isPkBattle = 'streamer1' in initialStream;
    const pkBattleId = isPkBattle ? (initialStream as PkBattle).id : null;

    const [activePkBattle, setActivePkBattle] = useState<PkBattleState | null>(null);
    const [finalPkBattleState, setFinalPkBattleState] = useState<PkBattleState | null>(null);
    const [pkEndAnimationState, setPkEndAnimationState] = useState<{ winnerId: number | null, loserId: number | null, isDraw: boolean } | null>(null);

    // Common State
    const [liveDetails, setLiveDetails] = useState<LiveDetails | null>(null);
    const [liveDetails2, setLiveDetails2] = useState<LiveDetails | null>(null); // For PK opponent
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isFollowing, setIsFollowing] = useState<Record<number, boolean>>({});
    const [isBlockedByHost, setIsBlockedByHost] = useState(false);
    const [lastSentGift, setLastSentGift] = useState<ChatMessage | null>(null);
    const [headerViewers, setHeaderViewers] = useState<Record<number, Viewer[]>>({});
    
    // Modal states
    const [isFollowLoading, setIsFollowLoading] = useState<Record<number, boolean>>({});
    const [viewingUserId, setViewingUserId] = useState<number | null>(null);
    const [isGiftPanelOpen, setIsGiftPanelOpen] = useState(false);
    const [isArcoraToolModalOpen, setIsArcoraToolModalOpen] = useState(false);
    const [isMuteUserModalOpen, setIsMuteUserModalOpen] = useState(false);
    const [isSoundEffectModalOpen, setIsSoundEffectModalOpen] = useState(false);
    const [mutedUsers, setMutedUsers] = useState<Record<number, { mutedUntil: string }>>({});
    const [kickedState, setKickedState] = useState<'none' | 'just_kicked' | 'banned_on_join'>('none');
    const [muteNotification, setMuteNotification] = useState<{ type: 'muted' | 'unmuted' } | null>(null);
    const [isEndStreamModalOpen, setIsEndStreamModalOpen] = useState(false);
    const [isEndPkModalOpen, setIsEndPkModalOpen] = useState(false);
    
    // New unified modal states
    const [onlineUsersModalLiveId, setOnlineUsersModalLiveId] = useState<number | null>(null);
    const [hourlyRankingModalInfo, setHourlyRankingModalInfo] = useState<{ liveId: number; streamer: { id: number; name: string; avatarUrl: string; } } | null>(null);
    
    const [pendingPkInvitation, setPendingPkInvitation] = useState<PkInvitation | null>(null);
    const [isInviteToPrivateLiveModalOpen, setIsInviteToPrivateLiveModalOpen] = useState(false);
    const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
    const [isRankingListOpen, setIsRankingListOpen] = useState(false);
    const [isPrivateChatModalOpen, setIsPrivateChatModalOpen] = useState(false);
    const [isPkInviteModalOpen, setIsPkInviteModalOpen] = useState(false);
    const [isPkSettingsModalOpen, setIsPkSettingsModalOpen] = useState(false);
    
    // --- PK Dispute Flow State ---
    const [pkDisputeModalState, setPkDisputeModalState] = useState<'hidden' | 'propose' | 'waiting'>('hidden');
    const [pendingDisputeInvite, setPendingDisputeInvite] = useState<ConvitePK | null>(null);
    const disputePollInterval = useRef<number | null>(null);
    
    // --- PK Animation State ---
    const [showPkClashAnimation, setShowPkClashAnimation] = useState(false);
    const prevStreamRef = useRef<Stream | PkBattle | null>(null);

    // --- New Invite Flow State ---
    const [pendingSentInvite, setPendingSentInvite] = useState<{ invitation: ConvitePK; opponent: User } | null>(null);
    
    const liveId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : (initialStream as Stream).id;
    const streamerId = isPkBattle ? (initialStream as PkBattle).streamer1.userId : (initialStream as Stream).userId;
    const isHost = isPkBattle 
        ? user.id === (initialStream as PkBattle).streamer1.userId || user.id === (initialStream as PkBattle).streamer2.userId
        : user.id === streamerId;
    const isPrivateStream = !isPkBattle && (initialStream as Stream).isPrivate;
    const streamHostId = isPkBattle ? (initialStream as PkBattle).streamer1.userId : streamerId;

    useEffect(() => {
        const prevStream = prevStreamRef.current;
        const isNowPk = 'streamer1' in initialStream;
        const wasPk = prevStream && 'streamer1' in prevStream;

        // Trigger animation if we enter PK mode OR if we switch from one PK battle to another.
        if (isNowPk && (!wasPk || (prevStream as PkBattle).id !== (initialStream as PkBattle).id)) {
            setShowPkClashAnimation(true);
        }
        
        prevStreamRef.current = initialStream;
    }, [initialStream]);

    // This effect is for viewers. It polls to see if the stream they are watching
    // has become part of a PK battle, and transitions their view if it has.
    useEffect(() => {
        if (isPkBattle) {
            return; // Already a PK battle, no need to poll for transition
        }

        const streamId = (initialStream as Stream).id;
        let isMounted = true;

        const checkForPkTransition = async () => {
            if (!isMounted) return;
            try {
                const battleState = await liveStreamService.findActivePkBattleForStream(streamId);
                if (isMounted && battleState) {
                    const pkBattleViewModel = await liveStreamService.getPkBattleDetails(Number(battleState.id));
                    onViewStream(pkBattleViewModel);
                }
            } catch (error) {
                 console.log("Polling for PK transition, no battle found yet.");
            }
        };

        const intervalId = setInterval(checkForPkTransition, 5000); // Poll every 5 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [isPkBattle, initialStream, onViewStream]);

    const handleSendCoHostInvite = async (opponent: User) => {
        setIsPkInviteModalOpen(false); // Close the selection modal
        try {
            const invitation = await liveStreamService.sendCoHostInvitation(user.id, opponent.id);
            showApiResponse('POST /api/pk/cohost/send-invite', invitation);
            setPendingSentInvite({ invitation, opponent });
        } catch (error) {
            alert(error instanceof Error ? error.message : "Não foi possível enviar o convite.");
            console.error("Failed to send co-host invite:", error);
        }
    };

    const fetchLiveDetails = useCallback(async () => {
        try {
            if (isPkBattle) {
                const battle = initialStream as PkBattle;
                const [details1, details2, viewers1, viewers2] = await Promise.all([
                    liveStreamService.getLiveStreamDetails(battle.streamer1.streamId),
                    liveStreamService.getLiveStreamDetails(battle.streamer2.streamId),
                    liveStreamService.getViewers(battle.streamer1.streamId),
                    liveStreamService.getViewers(battle.streamer2.streamId),
                ]);
                setLiveDetails(details1);
                setLiveDetails2(details2);
                setHeaderViewers(prev => ({
                    ...prev,
                    [battle.streamer1.streamId]: viewers1.slice(0, 3),
                    [battle.streamer2.streamId]: viewers2.slice(0, 3),
                }));
            } else {
                const streamId = (initialStream as Stream).id;
                const [details, viewers] = await Promise.all([
                    liveStreamService.getLiveStreamDetails(streamId),
                    liveStreamService.getViewers(streamId),
                ]);
                setLiveDetails(details);
                setHeaderViewers(prev => ({ ...prev, [streamId]: viewers.slice(0, 3) }));
            }
        } catch (error) { console.error(error); }
    }, [isPkBattle, initialStream]);
    
    useEffect(() => {
        if (isHost) return;
        liveStreamService.isUserBlocked(streamHostId, user.id)
            .then(({ isBlocked }) => { setIsBlockedByHost(isBlocked); })
            .catch(err => console.error("Failed to check block status:", err));
    }, [streamHostId, user.id, isHost]);
    
     // --- EVENT LISTENER HANDLERS (MEMOIZED) ---
    const handleBlocked = useCallback<UserBlockedListener>(({ blockerId, targetId }) => {
        if (blockerId === streamHostId && targetId === user.id) setIsBlockedByHost(true);
    }, [streamHostId, user.id]);

    const handleUnblocked = useCallback<UserUnblockedListener>(({ unblockerId, targetId }) => {
        if (unblockerId === streamHostId && targetId === user.id) setIsBlockedByHost(false);
    }, [streamHostId, user.id]);
    
    const handleChatMessageUpdate = useCallback((id: number, messages: ChatMessage[]) => { 
        if (id === liveId) {
            setChatMessages(messages);
            const newGift = messages.filter(m => m.type === 'gift').pop();
            if(newGift) setLastSentGift(newGift);
        }
    }, [liveId]);

    const handleMuteStatus = useCallback<MuteStatusListener>((update) => {
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
    }, [liveId, user.id]);

    const handleUserKicked = useCallback<UserKickedListener>((update) => { 
        if (update.liveId === liveId && update.kickedUserId === user.id) setKickedState('just_kicked'); 
    }, [liveId, user.id]);

    const handleSoundEffect = useCallback<SoundEffectListener>((update) => { 
        if (update.liveId === liveId && update.triggeredBy !== user.id) soundService.playSound(update.effectName); 
    }, [liveId, user.id]);

    // --- EFFECT FOR ALL LISTENERS ---
    useEffect(() => {
        liveStreamService.addUserBlockedListener(handleBlocked);
        liveStreamService.addUserUnblockedListener(handleUnblocked);
        liveStreamService.addChatMessageListener(handleChatMessageUpdate);
        liveStreamService.addMuteStatusListener(handleMuteStatus);
        liveStreamService.addUserKickedListener(handleUserKicked);
        liveStreamService.addSoundEffectListener(handleSoundEffect);
        return () => {
            liveStreamService.removeUserBlockedListener(handleBlocked);
            liveStreamService.removeUserUnblockedListener(handleUnblocked);
            liveStreamService.removeChatMessageListener(handleChatMessageUpdate);
            liveStreamService.removeMuteStatusListener(handleMuteStatus);
            liveStreamService.removeUserKickedListener(handleUserKicked);
            liveStreamService.removeSoundEffectListener(handleSoundEffect);
        };
    }, [handleBlocked, handleUnblocked, handleChatMessageUpdate, handleMuteStatus, handleUserKicked, handleSoundEffect]);

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
    
    const transitionFromPkBattle = useCallback(async () => {
        if ('streamer1' in initialStream) {
            const hostStreamerId = initialStream.streamer1.userId;
            const targetStreamerId = isHost ? user.id : hostStreamerId;
            
            try {
                const hostStream = await liveStreamService.getActiveStreamForUser(targetStreamerId);
                if (hostStream) {
                    onViewStream(hostStream);
                } else {
                    onExit();
                }
            } catch (error) {
                console.error("Error fetching stream after PK battle:", error);
                onExit();
            }
        } else {
            onExit();
        }
    }, [initialStream, isHost, user.id, onViewStream, onExit]);

    const handleExitClick = () => {
        if (isHost) {
            if (isPkBattle) {
                // User is a host in a PK battle, confirm ending just the PK
                setIsEndPkModalOpen(true);
            } else {
                // User is a host in a single stream, confirm ending the entire stream
                setIsEndStreamModalOpen(true);
            }
        } else {
            // Viewers just leave the stream/pk
            onExit();
        }
    };

    const confirmStopStream = () => {
        setIsEndStreamModalOpen(false);
        onStopStream(streamerId, liveId);
    };

    const confirmEndPkBattle = async () => {
        setIsEndPkModalOpen(false);
        if (!isPkBattle) return;
        try {
            const pkId = (initialStream as PkBattle).id;
            await liveStreamService.endPkBattle(pkId, user.id);
            // This function will transition the view back to the single stream
            await transitionFromPkBattle();
        } catch (error) {
            console.error("Failed to manually end PK battle:", error);
            alert("Não foi possível encerrar a batalha PK.");
        }
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
        const checkIncomingInvites = async () => {
            if (isHost) return; // Only viewers receive invites in-stream
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
                    setPendingPkInvitation(null);
                }
            } catch (e) { /* Fail silently */ }
        };
        const intervalId = setInterval(checkIncomingInvites, 5000);
        return () => clearInterval(intervalId);
    }, [isHost, user.id, pendingPkInvitation]);

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
    
                if (battleData.status === 'finalizada' && !finalPkBattleState) {
                    setFinalPkBattleState(battleData); // Mark that we've seen the final state
                }
            } catch (e) {
                if (isMounted) {
                    console.error("Failed to fetch PK battle data", e);
                    onExit(); // Exit if battle data fails
                }
            }
        };
    
        checkBattleStatus();
        const intervalId = setInterval(checkBattleStatus, 3000);
    
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [isPkBattle, pkBattleId, onExit, initialStream, finalPkBattleState]);
    
     useEffect(() => {
        const fetchInitialChat = async () => {
            const streamId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : liveId;
            try {
                const messages = await liveStreamService.getChatMessages(streamId);
                setChatMessages(messages);
            } catch (error) {
                console.error(error);
            }
        };

        fetchLiveDetails(); // Initial fetch
        fetchInitialChat(); // Initial chat fetch
        
        const interval = setInterval(fetchLiveDetails, 5000); // Poll details for updates
        return () => clearInterval(interval);
    }, [liveId, fetchLiveDetails, isPkBattle, initialStream]);

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
            const { invitation, battle } = await liveStreamService.acceptPkInvitation(pendingPkInvitation.id);
            showApiResponse(`POST /api/pk/invites/${invitation.id}/accept`, { success: true, invitation, battle });
            setPendingPkInvitation(null);
            if (battle) {
                onViewStream(battle);
            } else {
                alert("Convite aceito! Aguardando o anfitrião iniciar a batalha.");
            }
        } catch (error) { alert("Não foi possível aceitar o convite de PK."); setPendingPkInvitation(null); }
    };

    const handleDeclinePkInvite = async () => {
        if (!pendingPkInvitation) return;
        try { await liveStreamService.declinePkInvitation(pendingPkInvitation.id); } 
        catch (error) { console.error("Failed to decline PK invite:", error); } 
        finally { setPendingPkInvitation(null); }
    };
    
    const handleEnterFriendLive = async (friend: User) => {
        const activeStream = await liveStreamService.getActiveStreamForUser(friend.id);
        if (activeStream) {
            onViewStream(activeStream);
        } else {
            alert(`${friend.nickname} não está mais ao vivo.`);
        }
    };
    
    const handlePrivateInviteSent = (invitee: User) => {
        if (isPkBattle) return; // Cannot send private invites from PK battle

        onShowPrivateLiveInvite({
            stream: initialStream as Stream,
            inviter: user,
            invitee: invitee,
        });
    };

    const onRechargeClick = () => {
      setIsGiftPanelOpen(false);
      onRequirePurchase();
    };

    // --- PK Dispute Flow Handlers ---
    const startPollingForAcceptance = (invite: ConvitePK) => {
        if (disputePollInterval.current) clearInterval(disputePollInterval.current);
        
        disputePollInterval.current = window.setInterval(async () => {
            try {
                const { invitation, battle } = await liveStreamService.getPkInvitationStatus(invite.id);
                if (invitation.status === 'aceito') {
                    if (disputePollInterval.current) clearInterval(disputePollInterval.current);
                    setPendingDisputeInvite(null);
                    setPkDisputeModalState('hidden');
                    if (battle) {
                        onViewStream(battle);
                    } else {
                        alert('O oponente aceitou! A batalha começará em breve.');
                    }
                } else if (['recusado', 'expirado', 'cancelado'].includes(invitation.status)) {
                    if (disputePollInterval.current) clearInterval(disputePollInterval.current);
                    setPendingDisputeInvite(null);
                    setPkDisputeModalState('hidden');
                    alert(`Convite foi ${invitation.status}.`);
                }
            } catch (error) {
                console.error("Error polling dispute status:", error);
                if (disputePollInterval.current) clearInterval(disputePollInterval.current);
                setPkDisputeModalState('hidden');
            }
        }, 3000);
    };

    const handleProposeDispute = async (opponent: User) => {
        if (opponent.id === user.id) {
            // This is a self-invite simulation.
            // The user is "accepting" their own invite, so we create the battle directly.
            try {
                // This service call creates the battle and updates the live streams to be in PK mode.
                const battle = await liveStreamService.inviteToCoHostPk(user.id, user.id);
                setPkDisputeModalState('hidden');
                // onViewStream will trigger the useEffect that shows the clash animation
                // because the stream state transitions from a single Stream to a PkBattle.
                onViewStream(battle);
            } catch (error) {
                alert(error instanceof Error ? error.message : "Não foi possível simular a disputa.");
                console.error("Failed to simulate PK dispute:", error);
                setPkDisputeModalState('hidden'); // Close modal on error
            }
        } else {
            // This is the original logic for inviting another, real user.
            try {
                const invite = await liveStreamService.sendDisputeInvitation(user.id, opponent.id);
                setPendingDisputeInvite(invite);
                setPkDisputeModalState('waiting'); // Change state after successful API call
                startPollingForAcceptance(invite);
            } catch (error) {
                alert(error instanceof Error ? error.message : "Não foi possível enviar o convite.");
                setPkDisputeModalState('propose'); // Revert to propose modal on error
                setPendingDisputeInvite(null);
            }
        }
    };
    
    const handleCancelDispute = async () => {
        if (!pendingDisputeInvite) return;
        if (disputePollInterval.current) clearInterval(disputePollInterval.current);
        try {
            await liveStreamService.cancelPkInvitation(pendingDisputeInvite.id);
        } catch (error) {
            console.error("Failed to cancel dispute", error);
        } finally {
            setPendingDisputeInvite(null);
            setPkDisputeModalState('hidden');
        }
    };

    useEffect(() => {
        // Cleanup polling on unmount
        return () => {
            if (disputePollInterval.current) clearInterval(disputePollInterval.current);
        }
    }, []);

    useEffect(() => {
        if (finalPkBattleState) {
            const { status, vencedor_id, streamer_A_id, streamer_B_id, resultado, next_battle_id } = finalPkBattleState;
    
            if (status === 'finalizada') {
                const isDraw = resultado === 'empate';
                setPkEndAnimationState({
                    winnerId: isDraw ? null : vencedor_id || null,
                    loserId: isDraw ? null : (vencedor_id === streamer_A_id ? streamer_B_id : streamer_A_id),
                    isDraw,
                });
    
                const transitionTimer = setTimeout(async () => {
                    setPkEndAnimationState(null);
                    setFinalPkBattleState(null);

                    if (next_battle_id) {
                        try {
                            const nextBattle = await liveStreamService.getPkBattleDetails(Number(next_battle_id));
                            onViewStream(nextBattle);
                        } catch (error) {
                            console.error("Failed to fetch next battle details, exiting.", error);
                            transitionFromPkBattle();
                        }
                    } else {
                        transitionFromPkBattle();
                    }
                }, 4000);
    
                return () => clearTimeout(transitionTimer);
            }
        }
    }, [finalPkBattleState, transitionFromPkBattle, onViewStream]);

    const handleOpenRankingModal = (streamerInfo: { id: number; name: string; avatarUrl: string; streamId: number }) => {
      setHourlyRankingModalInfo({
          liveId: streamerInfo.streamId,
          streamer: {
              id: streamerInfo.id,
              name: streamerInfo.name,
              avatarUrl: streamerInfo.avatarUrl,
          },
      });
    };
    
    if (kickedState === 'banned_on_join') return <KickedFromStreamModal onExit={onExit} isJoinAttempt={true} />;
    
    const renderCommonFooterButtons = () => (
        <div className="flex items-center gap-2 shrink-0">
            {isHost && !isPkBattle && (
                <button onClick={() => setPkDisputeModalState('propose')} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto" aria-label="Iniciar Batalha PK">
                    <SwordsIcon className="w-6 h-6 text-red-400"/>
                </button>
            )}
            {isHost && (
                <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto" aria-label="Ferramentas do anfitrião">
                    <AnchorToolsIcon className="w-6 h-6 text-purple-300"/>
                </button>
            )}
            <button onClick={() => setIsQuickChatOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto" aria-label="Mensagens rápidas">
                <ChatBubbleIcon className="w-6 h-6 text-white"/>
            </button>
            {!isHost && (
                <button onClick={() => setIsPrivateChatModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto" aria-label="Mensagem privada">
                    <MessageIcon className="w-6 h-6 text-white"/>
                </button>
            )}
            <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto" aria-label="Enviar presente">
                <ShoppingBasketIcon className="w-6 h-6 text-yellow-200" />
            </button>
             <button onClick={handleSendLike} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto" aria-label="Enviar curtida">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                </div>

                <div className="relative z-10 flex flex-col h-full">
                     <header className="p-3 flex flex-col gap-2 pointer-events-none">
                        <LiveStreamHeader
                            variant="single"
                            avatarUrl={liveDetails?.streamerAvatarUrl || ''}
                            name={liveDetails?.streamerName || ''}
                            followers={formatStatNumber(liveDetails?.streamerFollowers || 0)}
                            viewerCount={formatStatNumber(liveDetails?.viewerCount || 0)}
                            headerViewers={headerViewers[liveId] || []}
                            coins={formatStatNumber(liveDetails?.receivedGiftsValue || 0)}
                            likes={formatStatNumber(liveDetails?.likeCount || 0)}
                            onUserClick={() => handleOpenUserProfile(streamerId)}
                            onViewersClick={() => setOnlineUsersModalLiveId(liveId)}
                            onExitClick={handleExitClick}
                            onCoinsClick={() => liveDetails && handleOpenRankingModal({
                                id: streamerId,
                                name: liveDetails.streamerName,
                                avatarUrl: liveDetails.streamerAvatarUrl,
                                streamId: liveId
                            })}
                        />
                    </header>
                    
                    <div className="flex-grow pointer-events-none"></div>

                    <footer className="p-3 flex flex-col items-start gap-4">
                       <div className="w-full flex justify-between items-end pointer-events-auto">
                            <div className="w-full">
                                <ChatArea messages={chatMessages} onUserClick={handleOpenUserProfile} />
                            </div>
                       </div>
                       <div className="w-full flex items-center gap-2 pointer-events-auto">
                            <ChatInput onSendMessage={handleSendMessage} disabled={isBlockedByHost} />
                            {renderCommonFooterButtons()}
                       </div>
                   </footer>
                </div>
            </>
        );
    };

    const PkEndAnimationOverlay: React.FC<{
        battle: PkBattleState;
        animationState: { winnerId: number | null; loserId: number | null; isDraw: boolean };
    }> = ({ battle, animationState }) => {
        const { streamer_A, streamer_B } = battle;
        const { winnerId, isDraw } = animationState;
    
        const winnerEmoji = '🏆';
        const loserEmoji = '😵';
        const drawEmoji = '🤝';
    
        let streamerA_emoji, streamerB_emoji;
        if (isDraw) {
            streamerA_emoji = drawEmoji;
            streamerB_emoji = drawEmoji;
        } else {
            streamerA_emoji = winnerId === streamer_A.id ? winnerEmoji : loserEmoji;
            streamerB_emoji = winnerId === streamer_B.id ? winnerEmoji : loserEmoji;
        }
    
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-around bg-black/60 backdrop-blur-sm animate-fade-in-out-long">
                <div className="flex flex-col items-center gap-2 animate-slide-in-left-result">
                    <span className="text-5xl drop-shadow-lg">{streamerA_emoji}</span>
                    <span className="text-2xl font-bold text-white drop-shadow-lg">{streamer_A.nickname}</span>
                </div>
                <div className="flex flex-col items-center gap-2 animate-slide-in-right-result">
                    <span className="text-5xl drop-shadow-lg">{streamerB_emoji}</span>
                    <span className="text-2xl font-bold text-white drop-shadow-lg">{streamer_B.nickname}</span>
                </div>
            </div>
        );
    };

    const renderPkBattleView = () => {
        if (!activePkBattle) {
            return (
                <div className="h-full w-full flex items-center justify-center bg-black">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            );
        }
        
        const { streamer_A, streamer_B, pontuacao_A, pontuacao_B, data_inicio, duracao_segundos, top_supporters_A, top_supporters_B } = activePkBattle;
        const totalScore = pontuacao_A + pontuacao_B;
        const scoreAPercent = totalScore > 0 ? (pontuacao_A / totalScore) * 100 : 50;

        const PkProgressBar = () => (
             <div className="w-full flex items-center relative h-10 my-2">
                <div className="absolute left-0 h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-rose-600 rounded-l-full" style={{ width: `${scoreAPercent}%` }}></div>
                <div className="absolute right-0 h-2 bg-gradient-to-l from-cyan-400 via-blue-500 to-indigo-600 rounded-r-full" style={{ width: `${100 - scoreAPercent}%` }}></div>
                
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-sm px-4 py-1.5 rounded-full text-white font-semibold border border-white/20 text-sm">
                    <PkTimer startTime={data_inicio} durationSeconds={duracao_segundos} />
                </div>

                <span className="absolute left-2 top-1/2 -translate-y-1/2 font-bold text-white drop-shadow-lg">{formatScore(pontuacao_A)}</span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-white drop-shadow-lg">{formatScore(pontuacao_B)}</span>
            </div>
        );

        const TopSupporterList: React.FC<{ supporters: typeof top_supporters_A, side: 'left' | 'right' }> = ({ supporters, side }) => (
            <div className={`absolute bottom-2 flex items-center gap-2 ${side === 'left' ? 'left-2' : 'right-2 flex-row-reverse'}`}>
                {supporters.slice(0, 3).map((supporter, index) => (
                    <img 
                        key={supporter.apoiador_id} 
                        src={supporter.avatar_url} 
                        alt={`supporter ${index+1}`}
                        className="w-8 h-8 rounded-full object-cover border-2 border-yellow-400"
                        style={{ zIndex: 3 - index }}
                    />
                ))}
            </div>
        );

        return (
            <div className="h-full w-full flex flex-col bg-black">
                {/* Top Section: Videos and Header Overlay */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Video Streams (background) */}
                    <div className="absolute inset-0 flex">
                        <div className="w-1/2 h-full bg-gray-700">
                            <img src="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Streamer A" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-1/2 h-full bg-gray-800">
                            <img src="https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Streamer B" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    {/* Header UI (overlay) */}
                    <header className="absolute top-0 left-0 right-0 p-1 flex justify-between items-start w-full pointer-events-none">
                         <LiveStreamHeader
                            variant="pk-left"
                            avatarUrl={streamer_A.avatar_url || ''}
                            name={streamer_A.nickname || ''}
                            followers={formatStatNumber(streamer_A.followers)}
                            viewerCount={formatStatNumber(liveDetails?.viewerCount || 0)}
                            headerViewers={headerViewers[streamer_A.streamId] || []}
                            coins={formatStatNumber(liveDetails?.receivedGiftsValue || 0)}
                            likes={formatStatNumber(liveDetails?.likeCount || 0)}
                            onUserClick={() => handleOpenUserProfile(streamer_A.id)}
                            onViewersClick={() => setOnlineUsersModalLiveId(streamer_A.streamId)}
                            onCoinsClick={() => handleOpenRankingModal({
                                id: streamer_A.id,
                                name: streamer_A.nickname || '',
                                avatarUrl: streamer_A.avatar_url || '',
                                streamId: streamer_A.streamId
                            })}
                        />
                         <LiveStreamHeader
                            variant="pk-right"
                            avatarUrl={streamer_B.avatar_url || ''}
                            name={streamer_B.nickname || ''}
                            followers={formatStatNumber(streamer_B.followers)}
                            viewerCount={formatStatNumber(liveDetails2?.viewerCount || 0)}
                            headerViewers={headerViewers[streamer_B.streamId] || []}
                            coins={formatStatNumber(liveDetails2?.receivedGiftsValue || 0)}
                            likes={formatStatNumber(liveDetails2?.likeCount || 0)}
                            onUserClick={() => handleOpenUserProfile(streamer_B.id)}
                            onViewersClick={() => setOnlineUsersModalLiveId(streamer_B.streamId)}
                            onExitClick={handleExitClick}
                            onCoinsClick={() => handleOpenRankingModal({
                                id: streamer_B.id,
                                name: streamer_B.nickname || '',
                                avatarUrl: streamer_B.avatar_url || '',
                                streamId: streamer_B.streamId
                            })}
                        />
                    </header>
                    <TopSupporterList supporters={top_supporters_A} side="left" />
                    <TopSupporterList supporters={top_supporters_B} side="right" />
                    {pkEndAnimationState && <PkEndAnimationOverlay battle={activePkBattle} animationState={pkEndAnimationState} />}
                </div>
                
                {/* Middle Separator (Score Bar) */}
                <div className="flex-shrink-0">
                    <PkProgressBar />
                </div>
                
                {/* Bottom Section: Chat and Controls */}
                <footer className="h-[35vh] shrink-0 flex flex-col p-3 gap-4 bg-black">
                    <div className="flex-grow overflow-y-auto flex">
                        <ChatArea messages={chatMessages} onUserClick={handleOpenUserProfile} maxHeightClass="max-h-full" />
                    </div>
                    <div className="w-full flex items-center gap-2 shrink-0">
                        <ChatInput onSendMessage={handleSendMessage} disabled={isBlockedByHost} />
                        {renderCommonFooterButtons()}
                    </div>
                </footer>
            </div>
        );
    };

    return (
        <div className="h-screen w-full bg-black text-white flex flex-col font-sans overflow-hidden">
            {isPkBattle ? renderPkBattleView() : renderSingleStreamView()}

            <FloatingGiftAnimation lastGift={lastSentGift} />
            
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
            {onlineUsersModalLiveId && (
                <OnlineUsersModal
                    liveId={onlineUsersModalLiveId}
                    onClose={() => setOnlineUsersModalLiveId(null)}
                    onUserClick={(userId) => {
                        setOnlineUsersModalLiveId(null);
                        handleOpenUserProfile(userId);
                    }}
                />
            )}
            {hourlyRankingModalInfo && (
                <HourlyRankingModal
                    liveId={hourlyRankingModalInfo.liveId}
                    onClose={() => setHourlyRankingModalInfo(null)}
                    onUserClick={(userId) => {
                        setHourlyRankingModalInfo(null);
                        handleOpenUserProfile(userId);
                    }}
                    currentUser={user}
                    onUpdateUser={onUpdateUser}
                    streamer={hourlyRankingModalInfo.streamer}
                    onNavigateToList={() => {
                        setHourlyRankingModalInfo(null);
                        setIsRankingListOpen(true);
                    }}
                    onRequirePurchase={onRequirePurchase}
                />
            )}
            {isRankingListOpen && hourlyRankingModalInfo && (
                <RankingListScreen 
                    liveId={hourlyRankingModalInfo.liveId}
                    currentUser={user}
                    onExit={() => setIsRankingListOpen(false)}
                    onUserClick={(userId) => {
                         setIsRankingListOpen(false);
                         handleOpenUserProfile(userId);
                    }}
                />
            )}
            {isGiftPanelOpen && (
                <GiftPanel
                    user={user}
                    liveId={liveId}
                    onClose={() => setIsGiftPanelOpen(false)}
                    onSendGift={handleSendGift}
                    onRechargeClick={onRechargeClick}
                    pkBattleStreamers={isPkBattle ? { streamer1: (initialStream as PkBattle).streamer1, streamer2: (initialStream as PkBattle).streamer2 } : undefined}
                />
            )}
            {isArcoraToolModalOpen && (
                <ArcoraToolModal
                    onClose={() => setIsArcoraToolModalOpen(false)}
                    onOpenMuteModal={() => setIsMuteUserModalOpen(true)}
                    onOpenSoundEffectModal={() => setIsSoundEffectModalOpen(true)}
                    onSwitchCamera={() => {}}
                    onToggleVoice={() => {}}
                    isVoiceEnabled={false}
                    onOpenPrivateChat={() => setIsPrivateChatModalOpen(true)}
                    isPrivateStream={isPrivateStream}
                    onOpenPrivateInviteModal={() => setIsInviteToPrivateLiveModalOpen(true)}
                    onOpenCohostInviteModal={() => setIsPkInviteModalOpen(true)}
                    onOpenPkInviteModal={() => setIsPkInviteModalOpen(true)}
                    isPkBattleActive={isPkBattle}
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
            {muteNotification && (
                <MutedNotificationModal type={muteNotification.type} onClose={() => setMuteNotification(null)} />
            )}
            {kickedState === 'just_kicked' && (
                <KickedFromStreamModal onExit={onExit} />
            )}
            {isEndPkModalOpen && (
                <EndStreamConfirmationModal 
                    onConfirm={confirmEndPkBattle}
                    onCancel={() => setIsEndPkModalOpen(false)}
                    title="Encerrar Batalha PK?"
                    message="Sua transmissão ao vivo continuará normalmente após encerrar a batalha."
                    confirmText="Encerrar PK"
                />
            )}
            {isEndStreamModalOpen && (
                 <EndStreamConfirmationModal onConfirm={confirmStopStream} onCancel={() => setIsEndStreamModalOpen(false)} />
            )}
            {pendingPkInvitation && (
                <AcceptPkInviteModal
                    currentUser={user}
                    invitation={pendingPkInvitation}
                    onAccept={handleAcceptPkInvite}
                    onDecline={handleDeclinePkInvite}
                />
            )}
            {isInviteToPrivateLiveModalOpen && !isPkBattle && (
                <InviteToPrivateLiveModal
                    streamerId={user.id}
                    liveId={(initialStream as Stream).id}
                    onClose={() => setIsInviteToPrivateLiveModalOpen(false)}
                    onInviteSent={handlePrivateInviteSent}
                />
            )}
            {isQuickChatOpen && (
                <QuickChatModal onClose={() => setIsQuickChatOpen(false)} onSendMessage={handleSendMessage} />
            )}
            {isPrivateChatModalOpen && (
                <PrivateChatModal user={user} onClose={() => setIsPrivateChatModalOpen(false)} />
            )}
             {isPkInviteModalOpen && (
                <PkInviteModal 
                    user={user}
                    onClose={() => setIsPkInviteModalOpen(false)}
                    onEnterFriendLive={handleEnterFriendLive}
                    onSendInvite={handleSendCoHostInvite}
                />
            )}
            {isPkSettingsModalOpen && (
                <PkSettingsModal userId={user.id} onClose={() => setIsPkSettingsModalOpen(false)} />
            )}
             {pkDisputeModalState !== 'hidden' && (
                <PkStartDisputeModal
                    mode={pkDisputeModalState}
                    currentUser={user}
                    onClose={() => setPkDisputeModalState('hidden')}
                    onProposeDispute={handleProposeDispute}
                    invitation={pendingDisputeInvite}
                    onCancelDispute={handleCancelDispute}
                />
            )}
            {showPkClashAnimation && (
                <PkClashAnimation onAnimationEnd={() => setShowPkClashAnimation(false)} />
            )}
             {pendingSentInvite && (
                <PkInvitationModal
                    currentUser={user}
                    opponent={pendingSentInvite.opponent}
                    invitation={pendingSentInvite.invitation}
                    onClose={() => setPendingSentInvite(null)}
                    onInviteAccepted={(battle) => {
                        setPendingSentInvite(null);
                        onViewStream(battle);
                    }}
                />
            )}
        </div>
    );
};

export default LiveStreamViewerScreen;