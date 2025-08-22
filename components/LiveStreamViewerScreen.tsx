
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Stream, PkBattle, ChatMessage, LiveDetails, PkInvitation, SoundEffectName, MuteStatusListener, UserKickedListener, SoundEffectListener, PublicProfile, PkBattleState, ConvitePK, IncomingPrivateLiveInvite, UserBlockedListener, UserUnblockedListener, Viewer, PkBattleStreamer, AppView } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import * as soundService from '../services/soundService';
import { useApiViewer } from './ApiContext';

// Modal Imports
import OnlineUsersModal from './OnlineUsersModal';
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
import PkCompetitionInviteModal from './PkCompetitionInviteModal';
import InviteToPrivateLiveModal from './InviteToPrivateLiveModal';
import QuickChatModal from './QuickChatModal';
import RankingListScreen from './RankingListScreen';
import PrivateChatModal from './PrivateChatModal';
import PkStartDisputeModal from './PkStartDisputeModal';
import PkClashAnimation from './PkClashAnimation';
import LiveStreamHeader from './LiveStreamHeader';
import PkResultModal from './PkResultModal';
import PkInviteModal from './PkInviteModal';
import PkInvitationModal from './PkInvitationModal';
import PkTopSupporter from './PkTopSupporter';
import PkGiftNotification from './PkGiftNotification';
import EditProfileScreen from './EditProfileScreen';
import EmbeddedChatView from './EmbeddedChatView';

// Icon Imports
import SwordsIcon from './icons/SwordsIcon';
import ShoppingBasketIcon from './icons/ShoppingBasketIcon';
import HeartSolidIcon from './icons/HeartSolidIcon';
import AnchorToolsIcon from './icons/AnchorToolsIcon';


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
  onViewProfile: (userId: number) => void;
  onNavigateFromStream: (view: AppView, userId: number) => void;
}

const formatStatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};

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
  onViewProfile,
  onNavigateFromStream,
}) => {
    const { showApiResponse } = useApiViewer();
    const isPkBattle = 'streamer1' in initialStream;
    const pkBattleId = isPkBattle ? (initialStream as PkBattle).id : null;

    const [isPkViewActive, setIsPkViewActive] = useState('streamer1' in initialStream);
    const [activePkBattle, setActivePkBattle] = useState<PkBattleState | null>(null);
    const [finalPkBattleState, setFinalPkBattleState] = useState<PkBattleState | null>(null);
    const [pkEndAnimationState, setPkEndAnimationState] = useState<{ winnerId: number | null, loserId: number | null, isDraw: boolean } | null>(null);

    // Common State
    const [liveDetails, setLiveDetails] = useState<LiveDetails | null>(null);
    const [liveDetails2, setLiveDetails2] = useState<LiveDetails | null>(null); // For PK opponent
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isBlockedByHost, setIsBlockedByHost] = useState(false);
    const lastGiftIdRef = useRef<number | null>(null);
    const [lastPkGift, setLastPkGift] = useState<ChatMessage | null>(null);
    const [chatUserProfiles, setChatUserProfiles] = useState<Record<number, { avatarUrl: string }>>({});
    const [headerViewers, setHeaderViewers] = useState<Record<number, Viewer[]>>({});
    const [viewingProfileId, setViewingProfileId] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Modal states
    const [isGiftPanelOpen, setIsGiftPanelOpen] = useState(false);
    const [isArcoraToolModalOpen, setIsArcoraToolModalOpen] = useState(false);
    const [isMuteUserModalOpen, setIsMuteUserModalOpen] = useState(false);
    const [isSoundEffectModalOpen, setIsSoundEffectModalOpen] = useState(false);
    const [mutedUsers, setMutedUsers] = useState<Record<number, { mutedUntil: string }>>({});
    const [kickedState, setKickedState] = useState<'none' | 'just_kicked' | 'banned_on_join'>('none');
    const [muteNotification, setMuteNotification] = useState<{ type: 'muted' | 'unmuted' } | null>(null);
    const [isEndStreamModalOpen, setIsEndStreamModalOpen] = useState(false);
    const [isEndPkModalOpen, setIsEndPkModalOpen] = useState(false);
    
    const [onlineUsersModalLiveId, setOnlineUsersModalLiveId] = useState<number | null>(null);
    const [hourlyRankingModalInfo, setHourlyRankingModalInfo] = useState<{ liveId: number; streamer: { id: number; name: string; avatarUrl: string; } } | null>(null);
    
    const [incomingCompetitionInvite, setIncomingCompetitionInvite] = useState<PkInvitation | null>(null);
    const [outgoingPkInvitationInfo, setOutgoingPkInvitationInfo] = useState<{ invitation: ConvitePK, opponent: User } | null>(null);
    const [isInviteToPrivateLiveModalOpen, setIsInviteToPrivateLiveModalOpen] = useState(false);
    const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
    const [isRankingListOpen, setIsRankingListOpen] = useState(false);
    const [isPrivateChatModalOpen, setIsPrivateChatModalOpen] = useState(false);
    const [isPkInviteModalOpen, setIsPkInviteModalOpen] = useState(false);
    const [embeddedChatOtherUser, setEmbeddedChatOtherUser] = useState<PublicProfile | null>(null);
    
    const [isPkStartDisputeModalOpen, setIsPkStartDisputeModalOpen] = useState(false);
    
    const [showPkClashAnimation, setShowPkClashAnimation] = useState(false);
    const prevStreamRef = useRef<Stream | PkBattle | null>(null);
    
    const liveId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : (initialStream as Stream).id;
    const streamerId = isPkBattle ? (initialStream as PkBattle).streamer1.userId : (initialStream as Stream).userId;
    const isHost = user.id === streamerId;
    const isPrivateStream = !isPkBattle && (initialStream as Stream).isPrivate;

    useEffect(() => {
        const prevStream = prevStreamRef.current;
        const isNowPk = 'streamer1' in initialStream;
        const wasPk = prevStream && 'streamer1' in prevStream;

        if (isNowPk && (!wasPk || (prevStream as PkBattle).id !== (initialStream as PkBattle).id)) {
            setShowPkClashAnimation(true);
        }
        
        prevStreamRef.current = initialStream;
    }, [initialStream]);
    
    const handleFollowToggle = async (userIdToToggle: number) => {
        const isCurrentlyFollowing = (user.following || []).includes(userIdToToggle);
        const updatedUser = isCurrentlyFollowing
          ? await liveStreamService.unfollowUser(user.id, userIdToToggle)
          : await liveStreamService.followUser(user.id, userIdToToggle);
        onUpdateUser(updatedUser);
      };

    const fetchLiveDetails = useCallback(async () => {
      try {
          if (isPkBattle && isPkViewActive) {
              const pkId = (initialStream as PkBattle).id;
              const battleState = await liveStreamService.getActivePkBattle(pkId);
              setActivePkBattle(battleState);

              const [details1, details2, messages, viewers1, viewers2] = await Promise.all([
                  liveStreamService.getLiveStreamDetails(battleState.streamer_A.streamId),
                  liveStreamService.getLiveStreamDetails(battleState.streamer_B.streamId),
                  liveStreamService.getChatMessages(battleState.streamer_A.streamId),
                  liveStreamService.getViewers(battleState.streamer_A.streamId),
                  liveStreamService.getViewers(battleState.streamer_B.streamId),
              ]);
              setLiveDetails(details1);
              setLiveDetails2(details2);
              setChatMessages(prevMessages => {
                  if (messages.length === prevMessages.length && messages.every((msg, i) => msg.id === prevMessages[i].id)) {
                      return prevMessages;
                  }
                  return messages;
              });
              setHeaderViewers({
                  [battleState.streamer_A.streamId]: viewers1.slice(0, 3),
                  [battleState.streamer_B.streamId]: viewers2.slice(0, 3),
              });

              const newGift = messages.slice().reverse().find(m => m.type === 'gift');
              if (newGift && newGift.id !== lastGiftIdRef.current) {
                  lastGiftIdRef.current = newGift.id;
                  setLastPkGift(newGift); 
                  setChatUserProfiles(profiles => {
                      if (!profiles[newGift.userId]) {
                           authService.getUserProfile(newGift.userId).then(profile => {
                              setChatUserProfiles(prev => ({ ...prev, [newGift.userId]: { avatarUrl: profile.avatar_url || '' } }));
                          }).catch(e => console.error("Failed to fetch gift sender profile", e));
                      }
                      return profiles;
                  });
              }
              
              if (new Date() > new Date(battleState.data_fim)) {
                  setFinalPkBattleState(battleState);
                  const winnerId = battleState.pontuacao_A > battleState.pontuacao_B ? battleState.streamer_A_id : battleState.pontuacao_B > battleState.pontuacao_A ? battleState.streamer_B_id : null;
                  setPkEndAnimationState({ winnerId, loserId: winnerId ? (winnerId === battleState.streamer_A_id ? battleState.streamer_B_id : battleState.streamer_A_id) : null, isDraw: !winnerId });
                  
                  setTimeout(() => {
                    setIsPkViewActive(false);
                  }, 4000);
              }

          } else {
              const streamIdForDetails = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : (initialStream as Stream).id;
              const [details, viewers, messages] = await Promise.all([
                  liveStreamService.getLiveStreamDetails(streamIdForDetails),
                  liveStreamService.getViewers(streamIdForDetails),
                  liveStreamService.getChatMessages(streamIdForDetails)
              ]);
              setLiveDetails(details);
              setHeaderViewers({ [streamIdForDetails]: viewers.slice(0, 3) });
              setChatMessages(prevMessages => {
                  if (messages.length === prevMessages.length && messages.every((msg, i) => msg.id === prevMessages[i].id)) {
                      return prevMessages;
                  }
                  return messages;
              });
          }
      } catch (error) {
          console.error("Stream might have ended:", error);
          onStreamEnded(liveId);
      }
    }, [initialStream, isPkBattle, onStreamEnded, liveId, isPkViewActive]);
    
    useEffect(() => {
        const getSimulatedToken = async () => {
            try {
                const roomName = `live-${liveId}`;
                const { token } = await liveStreamService.getLiveKitToken(roomName, String(user.id));
                console.log(`[SIMULAÇÃO] Token LiveKit recebido para a sala ${roomName}:`, token);
                showApiResponse('POST /api/livekit/token', { token });
            } catch(e) {
                console.error("Falha ao obter token simulado do LiveKit", e);
            }
        };

        getSimulatedToken();
        liveStreamService.joinLiveStream(user.id, liveId);
        
        // Polling for real-time updates
        const intervalId = setInterval(fetchLiveDetails, 4000);
        fetchLiveDetails(); // Initial fetch

        return () => {
            clearInterval(intervalId);
            liveStreamService.leaveLiveStream(user.id, liveId);
        };
    }, [liveId, user.id, fetchLiveDetails, showApiResponse]);

    useEffect(() => {
        // Polling for incoming PK invitations for the current user
        const invitationPoller = setInterval(async () => {
          // Don't poll if a modal is already open or user is in a PK battle
          if (incomingCompetitionInvite || isPkBattle) {
            return;
          }
    
          try {
            const invite = await liveStreamService.getPendingPkInvitation(user.id);
            if (invite) {
              const inviter = await authService.getUserProfile(invite.remetente_id);
              setIncomingCompetitionInvite({
                ...invite,
                inviterName: inviter.nickname || inviter.name,
                inviterAvatarUrl: inviter.avatar_url || '',
              });
            }
          } catch (error) {
            // Silently fail is fine for polling
          }
        }, 5000); // Poll every 5 seconds
    
        return () => clearInterval(invitationPoller);
      }, [user.id, incomingCompetitionInvite, isPkBattle]);


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

    const handleSendMessage = useCallback(async (message: string) => {
        try {
            const currentLiveId = isPkViewActive && activePkBattle ? activePkBattle.streamer_A.streamId : liveId;
            await liveStreamService.sendChatMessage(currentLiveId, user.id, message);
            fetchLiveDetails();
        } catch (error) {
            alert((error as Error).message);
        }
    }, [liveId, user.id, fetchLiveDetails, isPkViewActive, activePkBattle]);

    const handleImageSelected = useCallback(async (file: File) => {
        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async (event) => {
                try {
                    const imageDataUrl = event.target?.result as string;
                    if (!imageDataUrl) throw new Error("Could not read image file.");

                    const { url } = await liveStreamService.uploadChatImage(imageDataUrl);
                    showApiResponse('POST /api/chat/upload', { url });

                    const currentLiveId = isPkViewActive && activePkBattle ? activePkBattle.streamer_A.streamId : liveId;
                    await liveStreamService.sendChatMessage(currentLiveId, user.id, '', url);
                    fetchLiveDetails();
                } catch (err) {
                    alert(err instanceof Error ? err.message : "Failed to send image.");
                } finally {
                    setIsUploading(false);
                }
            };
            reader.onerror = () => {
                alert("Failed to read file.");
                setIsUploading(false);
            }
        } catch (error) {
            alert("An error occurred while preparing the image.");
            setIsUploading(false);
        }
    }, [user.id, liveId, showApiResponse, fetchLiveDetails, isPkViewActive, activePkBattle]);

    const handleSendGift = async (giftId: number, receiverId?: number) => {
        try {
            const currentLiveId = isPkViewActive && activePkBattle ? activePkBattle.streamer_A.streamId : liveId;
            const response = await liveStreamService.sendGift(currentLiveId, user.id, giftId, receiverId);
            showApiResponse(`POST /api/lives/${currentLiveId}/gift`, response);
            if (response.success && response.updatedUser) {
                onUpdateUser(response.updatedUser);
            } else if (!response.success) {
                alert(response.message);
                if (response.message.includes('insuficientes')) {
                    onRequirePurchase();
                }
            }
        } catch (error) {
            console.error("Failed to send gift:", error);
            alert("Ocorreu um erro ao enviar o presente.");
        }
    };

    const handleSendLike = async () => {
        await liveStreamService.sendLike(liveId, user.id);
        fetchLiveDetails();
    };

    const handleSendCoHostInvite = async (opponent: User) => {
        // Close the invite modal immediately in all cases
        setIsPkInviteModalOpen(false);
        setIsPkStartDisputeModalOpen(false);
    
        console.log(`Simulating PK invite from opponent ${opponent.nickname} to self for testing.`);
        
        // Create a mock invitation object for the current user to see, as if the opponent invited them.
        const mockInvite: PkInvitation = {
            id: `mock-invite-${opponent.id}`, // Use opponent ID to make it unique and identifiable
            remetente_id: opponent.id,
            destinatario_id: user.id,
            status: 'pendente',
            data_envio: new Date().toISOString(),
            data_expiracao: new Date(Date.now() + 60000).toISOString(),
            batalha_id: undefined,
            inviterName: opponent.nickname || opponent.name,
            inviterAvatarUrl: opponent.avatar_url || '',
        };
        
        // This will trigger the PkCompetitionInviteModal for the current user.
        setIncomingCompetitionInvite(mockInvite);
    };
    
    const handleAcceptCompetitionInvite = async () => {
        if (!incomingCompetitionInvite) return;
        try {
            const inviteId = incomingCompetitionInvite.id;
            let battle: PkBattle;
    
            // Handle simulated invites for testing
            if (inviteId.startsWith('mock-invite-') || inviteId.startsWith('self-invite-')) {
                const inviterId = incomingCompetitionInvite.remetente_id;
                const inviteeId = incomingCompetitionInvite.destinatario_id;
                console.log(`Accepting simulated invite. Creating PK battle between ${inviterId} and ${inviteeId}.`);
                battle = await liveStreamService.inviteToCoHostPk(inviterId, inviteeId);
            } else {
                // Regular acceptance flow for real invites
                const response = await liveStreamService.acceptPkInvitation(inviteId);
                if (!response.battle) throw new Error("A batalha não pôde ser criada a partir do convite.");
                battle = response.battle;
            }
            
            if (battle) {
                // THIS IS THE KEY CHANGE: Update state locally instead of calling onViewStream
                setShowPkClashAnimation(true); // Trigger the cool clash animation
                
                const battleState = await liveStreamService.getActivePkBattle(battle.id);
                setActivePkBattle(battleState);
                setIsPkViewActive(true);
                setIncomingCompetitionInvite(null); // Close the invite modal
            } else {
                throw new Error("Não foi possível iniciar a batalha.");
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erro ao aceitar convite.");
            setIncomingCompetitionInvite(null); // Ensure modal closes on error
        }
    };

    const handleDeclineCompetitionInvite = async () => {
        if (!incomingCompetitionInvite) return;
        try {
            const inviteId = incomingCompetitionInvite.id;
             // For simulated invites, we just close the modal. For real invites, we call the API.
            if (inviteId.startsWith('self-invite-') || inviteId.startsWith('mock-invite-')) {
                console.log(`Declining simulated invite: ${inviteId}`);
            } else {
                await liveStreamService.declinePkInvitation(inviteId);
            }
        } catch (error) {
            console.error("Error declining invite:", error);
        } finally {
            setIncomingCompetitionInvite(null);
        }
    };

    const handleEnterFriendLive = async (friend: User) => {
        if (!friend) return;
        try {
            const activeStream = await liveStreamService.getActiveStreamForUser(friend.id);
            if (activeStream) {
                const pkBattleDb = await liveStreamService.findActivePkBattleForStream(activeStream.id);
                if (pkBattleDb) {
                    const pkBattle = await liveStreamService.getPkBattleDetails(Number(pkBattleDb.id));
                    onViewStream(pkBattle);
                } else {
                    onViewStream(activeStream);
                }
                setIsPkInviteModalOpen(false);
            } else {
                alert("Não foi possível encontrar a live ativa para este usuário.");
            }
        } catch (error) {
            console.error("Failed to enter friend's live stream:", error);
            alert("Ocorreu um erro ao entrar na live.");
        }
    };


    const pkBattleStreamersProp = isPkBattle && activePkBattle ? {
        streamer1: {
            userId: activePkBattle.streamer_A.id,
            streamId: activePkBattle.streamer_A.streamId,
            name: activePkBattle.streamer_A.nickname || activePkBattle.streamer_A.name,
            score: activePkBattle.pontuacao_A,
            avatarUrl: activePkBattle.streamer_A.avatar_url || '',
            isVerified: true, 
        } as PkBattleStreamer,
        streamer2: {
            userId: activePkBattle.streamer_B.id,
            streamId: activePkBattle.streamer_B.streamId,
            name: activePkBattle.streamer_B.nickname || activePkBattle.streamer_B.name,
            score: activePkBattle.pontuacao_B,
            avatarUrl: activePkBattle.streamer_B.avatar_url || '',
            isVerified: false, 
        } as PkBattleStreamer
    } : undefined;

    const renderPkBattleView = () => {
        if (!activePkBattle) return <div className="flex-1 bg-black flex items-center justify-center">Carregando batalha...</div>;
        
        const streamer1 = activePkBattle.streamer_A;
        const streamer2 = activePkBattle.streamer_B;
        const score1 = activePkBattle.pontuacao_A;
        const score2 = activePkBattle.pontuacao_B;
        const totalScore = score1 + score2;
        const streamer1Percent = totalScore > 0 ? (score1 / totalScore) * 100 : 50;
    
        return (
            <>
                <div className="absolute inset-0 z-0 flex">
                    <div className="w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: `url(${streamer1.avatar_url})` }} />
                    <div className="w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: `url(${streamer2.avatar_url})` }} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
    
                <div className="relative z-10 flex flex-col h-full">
                    <header className="p-3 flex items-start justify-between">
                        <LiveStreamHeader 
                            variant="pk-left" 
                            avatarUrl={streamer1.avatar_url || ''} 
                            name={streamer1.nickname || ''} 
                            followers={formatStatNumber(streamer1.followers)} 
                            viewerCount={formatStatNumber(liveDetails?.viewerCount || 0)} 
                            coins={formatStatNumber(liveDetails?.receivedGiftsValue || 0)} 
                            likes={formatStatNumber(liveDetails?.likeCount || 0)} 
                            onUserClick={() => setViewingProfileId(streamer1.id)}
                            onViewersClick={() => setOnlineUsersModalLiveId(activePkBattle.streamer_A.streamId)}
                            onCoinsClick={() => setHourlyRankingModalInfo({ liveId: activePkBattle.streamer_A.streamId, streamer: { id: streamer1.id, name: streamer1.nickname || streamer1.name, avatarUrl: streamer1.avatar_url || '' } })}
                            isCurrentUserHost={user.id === streamer1.id}
                            isFollowing={(user.following || []).includes(streamer1.id)}
                            onFollowToggle={() => handleFollowToggle(streamer1.id)}
                        />
                        <LiveStreamHeader 
                            variant="pk-right" 
                            avatarUrl={streamer2.avatar_url || ''} 
                            name={streamer2.nickname || ''} 
                            followers={formatStatNumber(streamer2.followers)} 
                            viewerCount={formatStatNumber(liveDetails2?.viewerCount || 0)} 
                            coins={formatStatNumber(liveDetails2?.receivedGiftsValue || 0)} 
                            likes={formatStatNumber(liveDetails2?.likeCount || 0)} 
                            onUserClick={() => setViewingProfileId(streamer2.id)} 
                            onExitClick={handleExitClick}
                            onViewersClick={() => setOnlineUsersModalLiveId(activePkBattle.streamer_B.streamId)}
                            onCoinsClick={() => setHourlyRankingModalInfo({ liveId: activePkBattle.streamer_B.streamId, streamer: { id: streamer2.id, name: streamer2.nickname || streamer2.name, avatarUrl: streamer2.avatar_url || '' } })}
                            isCurrentUserHost={user.id === streamer2.id}
                            isFollowing={(user.following || []).includes(streamer2.id)}
                            onFollowToggle={() => handleFollowToggle(streamer2.id)}
                        />
                    </header>

                    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
                        <div className="bg-black/40 px-3 py-1 rounded-full text-sm font-bold pointer-events-auto">
                            <PkTimer startTime={activePkBattle.data_inicio} durationSeconds={activePkBattle.duracao_segundos} />
                        </div>
                        <div className="relative w-full h-8 bg-black/30 overflow-hidden flex items-center border-y-2 border-white/20 pointer-events-auto">
                            <div
                                className="h-full bg-gradient-to-r from-pink-500 to-red-400 transition-all duration-500 ease-out"
                                style={{ width: `${streamer1Percent}%` }}
                            ></div>
                            <div
                                className="h-full bg-gradient-to-l from-blue-500 to-cyan-400 transition-all duration-500 ease-out"
                                style={{ width: `${100 - streamer1Percent}%` }}
                            ></div>
                            <div className="absolute inset-0 flex justify-between items-center px-3">
                                <span className="font-bold text-base text-white drop-shadow-lg">{score1.toLocaleString()}</span>
                                <span className="font-bold text-base text-white drop-shadow-lg">{score2.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow" /> {/* Spacer */}

                    <div className="px-3 pb-2 flex flex-col gap-2 pointer-events-none">
                        <div className="flex justify-between items-center px-2">
                            <div className="flex -space-x-2 pointer-events-auto">
                                {activePkBattle.top_supporters_A.slice(0, 3).map(supporter => (
                                    <PkTopSupporter key={supporter.apoiador_id} supporter={supporter} onUserClick={() => setViewingProfileId(supporter.apoiador_id)} />
                                ))}
                            </div>
                            <div className="flex flex-row-reverse -space-x-2 space-x-reverse pointer-events-auto">
                                {activePkBattle.top_supporters_B.slice(0, 3).map(supporter => (
                                    <PkTopSupporter key={supporter.apoiador_id} supporter={supporter} onUserClick={() => setViewingProfileId(supporter.apoiador_id)} />
                                ))}
                            </div>
                        </div>
                    </div>
    
                    <PkGiftNotification 
                        gift={lastPkGift}
                        senderAvatarUrl={lastPkGift ? chatUserProfiles[lastPkGift.userId]?.avatarUrl : undefined}
                        onAnimationEnd={() => {}}
                    />

                    <footer className="p-3 flex flex-col items-start gap-4">
                        <div className="w-full max-w-md"><ChatArea messages={chatMessages} onUserClick={setViewingProfileId} /></div>
                        <div className="w-full flex items-center gap-2 pointer-events-auto">
                            <ChatInput onSendMessage={handleSendMessage} isUploading={isUploading} disabled={isBlockedByHost} allowImageUpload={false} />
                            <div className="flex items-center gap-2 shrink-0">
                                {isHost && (
                                    <>
                                        <button onClick={() => setIsPkStartDisputeModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-label="Batalha PK">
                                            <SwordsIcon className="w-6 h-6"/>
                                        </button>
                                        <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-label="Ferramentas do anfitrião">
                                            <AnchorToolsIcon className="w-6 h-6 text-gray-300"/>
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-label="Enviar presente">
                                    <ShoppingBasketIcon className="w-6 h-6 text-yellow-200" />
                                </button>
                            </div>
                        </div>
                    </footer>
                </div>
            </>
        );
    };

    const renderSingleStreamView = () => (
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
                      onUserClick={() => setViewingProfileId(streamerId)}
                      onViewersClick={() => setOnlineUsersModalLiveId(liveId)}
                      onExitClick={handleExitClick}
                      onCoinsClick={() => setHourlyRankingModalInfo({ liveId, streamer: { id: streamerId, name: liveDetails?.streamerName || '', avatarUrl: liveDetails?.streamerAvatarUrl || '' } })}
                      isCurrentUserHost={isHost}
                      isFollowing={(user.following || []).includes(streamerId)}
                      onFollowToggle={() => handleFollowToggle(streamerId)}
                  />
              </header>
              
              <div className="flex-grow pointer-events-none">
                {/* Floating gift animation removed as per user request */}
              </div>

              <footer className="p-3 flex flex-col items-start gap-4">
                  <div className="w-full max-w-md"><ChatArea messages={chatMessages} onUserClick={setViewingProfileId} /></div>
                  <div className="w-full flex items-center gap-2 pointer-events-auto">
                      <ChatInput onSendMessage={handleSendMessage} isUploading={isUploading} disabled={isBlockedByHost} allowImageUpload={false} />
                      <div className="flex items-center gap-2 shrink-0">
                          {isHost ? (
                              <>
                                  <button onClick={() => isPkViewActive ? setIsEndPkModalOpen(true) : setIsPkInviteModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-label="Batalha PK">
                                      <SwordsIcon className="w-6 h-6"/>
                                  </button>
                                  <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-label="Ferramentas do anfitrião">
                                      <AnchorToolsIcon className="w-6 h-6 text-gray-300"/>
                                  </button>
                              </>
                          ) : (
                              <button onClick={handleSendLike} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-pulse" aria-label="Enviar curtida">
                                  <HeartSolidIcon className="w-6 h-6 text-pink-400" />
                              </button>
                          )}
                          <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-label="Enviar presente">
                              <ShoppingBasketIcon className="w-6 h-6 text-yellow-200" />
                          </button>
                      </div>
                  </div>
              </footer>
          </div>
      </>
    );

    return (
        <div className="h-screen w-full bg-black text-white font-sans relative overflow-hidden">
            {kickedState === 'banned_on_join' && <KickedFromStreamModal onExit={onExit} isJoinAttempt />}
            {kickedState === 'just_kicked' && <KickedFromStreamModal onExit={onExit} />}
    
            {isPkViewActive ? renderPkBattleView() : renderSingleStreamView()}
    
            {showPkClashAnimation && <PkClashAnimation onAnimationEnd={() => setShowPkClashAnimation(false)} />}
            
            {finalPkBattleState && pkEndAnimationState && <PkResultModal currentUser={user} battleData={finalPkBattleState} onClose={() => setPkEndAnimationState(null)} />}
    
            {viewingProfileId && (
                <div className="fixed inset-0 z-50 animate-fade-in-fast" onClick={() => setViewingProfileId(null)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                    <div className="absolute inset-0" onClick={e => e.stopPropagation()}>
                        <EditProfileScreen
                            user={user}
                            isViewingOtherProfile
                            viewedUserId={viewingProfileId}
                            onExit={() => setViewingProfileId(null)}
                            onFollowToggle={handleFollowToggle}
                            onNavigateToChat={(otherUserId) => {
                                setViewingProfileId(null);
                                onNavigateToChat(otherUserId);
                            }}
                            onNavigate={(view) => {
                                if (viewingProfileId) {
                                    onNavigateFromStream(view, viewingProfileId);
                                }
                            }}
                        />
                    </div>
                </div>
            )}
            
            {onlineUsersModalLiveId && (
                <OnlineUsersModal liveId={onlineUsersModalLiveId} onClose={() => setOnlineUsersModalLiveId(null)} onUserClick={(userId) => { setOnlineUsersModalLiveId(null); setViewingProfileId(userId); }} />
            )}
            
            {hourlyRankingModalInfo && (
                 <HourlyRankingModal
                    liveId={hourlyRankingModalInfo.liveId}
                    streamer={hourlyRankingModalInfo.streamer}
                    currentUser={user}
                    onUpdateUser={onUpdateUser}
                    onClose={() => setHourlyRankingModalInfo(null)}
                    onUserClick={(userId) => { setHourlyRankingModalInfo(null); setViewingProfileId(userId); }}
                    onNavigateToList={() => { setHourlyRankingModalInfo(null); setIsRankingListOpen(true); }}
                    onRequirePurchase={onRequirePurchase}
                 />
            )}
            
            {isRankingListOpen && (
                <RankingListScreen 
                    liveId={liveId}
                    currentUser={user}
                    onExit={() => setIsRankingListOpen(false)}
                    onUserClick={(userId) => { setIsRankingListOpen(false); setViewingProfileId(userId); }}
                />
            )}
    
            {isGiftPanelOpen && (
                <GiftPanel user={user} liveId={liveId} onClose={() => setIsGiftPanelOpen(false)} onSendGift={handleSendGift} onRechargeClick={onRequirePurchase} pkBattleStreamers={pkBattleStreamersProp} />
            )}
    
            {isArcoraToolModalOpen && (
                <ArcoraToolModal
                    onClose={() => setIsArcoraToolModalOpen(false)}
                    onOpenMuteModal={() => { setIsArcoraToolModalOpen(false); setIsMuteUserModalOpen(true); }}
                    onOpenSoundEffectModal={() => { setIsArcoraToolModalOpen(false); setIsSoundEffectModalOpen(true); }}
                    onSwitchCamera={() => alert('Câmera alternada!')}
                    onToggleVoice={() => alert('Voz alternada!')}
                    isVoiceEnabled={true}
                    onOpenPrivateChat={() => {
                        setIsArcoraToolModalOpen(false);
                        setIsPrivateChatModalOpen(true);
                    }}
                    isPrivateStream={isPrivateStream}
                    onOpenPrivateInviteModal={() => { setIsArcoraToolModalOpen(false); setIsInviteToPrivateLiveModalOpen(true); }}
                    onOpenPkStartModal={() => { setIsArcoraToolModalOpen(false); setIsPkStartDisputeModalOpen(true); }}
                    isPkBattleActive={isPkViewActive}
                    onOpenPkInviteModal={() => { setIsArcoraToolModalOpen(false); setIsPkInviteModalOpen(true); }}
                />
            )}

            {embeddedChatOtherUser && (
                <EmbeddedChatView
                    currentUser={user}
                    otherUser={embeddedChatOtherUser}
                    onClose={() => setEmbeddedChatOtherUser(null)}
                />
            )}
            
            {isPkInviteModalOpen && (
                <PkInviteModal
                    user={user}
                    onClose={() => setIsPkInviteModalOpen(false)}
                    onEnterFriendLive={handleEnterFriendLive}
                    onSendInvite={handleSendCoHostInvite}
                />
            )}
    
            {isPkStartDisputeModalOpen && (
                <PkStartDisputeModal
                    currentUser={user}
                    onClose={() => setIsPkStartDisputeModalOpen(false)}
                    onProposeDispute={handleSendCoHostInvite}
                />
            )}
            
            {outgoingPkInvitationInfo && (
                <PkInvitationModal
                    currentUser={user}
                    opponent={outgoingPkInvitationInfo.opponent}
                    invitation={outgoingPkInvitationInfo.invitation}
                    onClose={() => setOutgoingPkInvitationInfo(null)}
                    onInviteAccepted={(battle) => {
                        setOutgoingPkInvitationInfo(null);
                        onViewStream(battle);
                    }}
                />
            )}
    
            {isMuteUserModalOpen && (
                <MuteUserModal liveId={liveId} mutedUsers={mutedUsers} onMuteUser={(userId, mute) => alert(`User ${userId} mute status: ${mute}`)} onKickUser={(userId) => alert(`User ${userId} kicked`)} onClose={() => setIsMuteUserModalOpen(false)} />
            )}
    
            {isSoundEffectModalOpen && (
                <SoundEffectModal onClose={() => setIsSoundEffectModalOpen(false)} onPlaySoundEffect={(effect) => {
                    soundService.playSound(effect);
                    liveStreamService.playSoundEffect(liveId, user.id, effect);
                }} />
            )}
            
            {muteNotification && <MutedNotificationModal type={muteNotification.type} onClose={() => setMuteNotification(null)} />}
            
            {isEndStreamModalOpen && (
                <EndStreamConfirmationModal onConfirm={confirmStopStream} onCancel={() => setIsEndStreamModalOpen(false)} />
            )}
            
            {isEndPkModalOpen && (
                <EndStreamConfirmationModal
                    onConfirm={() => {
                        if (pkBattleId) onStopStream(streamerId, pkBattleId);
                        setIsEndPkModalOpen(false);
                    }}
                    onCancel={() => setIsEndPkModalOpen(false)}
                    title="Sair da Batalha PK?"
                    message="Tem certeza que deseja encerrar a batalha PK? Isso finalizará a competição."
                    confirmText="Sair da Batalha"
                />
            )}
    
            {incomingCompetitionInvite && (
                <PkCompetitionInviteModal 
                    currentUser={user}
                    invitation={incomingCompetitionInvite}
                    onAccept={handleAcceptCompetitionInvite}
                    onDecline={handleDeclineCompetitionInvite}
                />
            )}
    
            {isInviteToPrivateLiveModalOpen && (
                <InviteToPrivateLiveModal
                    streamerId={streamerId}
                    liveId={liveId}
                    onClose={() => setIsInviteToPrivateLiveModalOpen(false)}
                    onInviteSent={(invitee) => {
                        console.log(`Invite sent to ${invitee.nickname}`);
                        // Potentially show a confirmation toast here
                    }}
                />
            )}
    
            {isQuickChatOpen && (
                <QuickChatModal onClose={() => setIsQuickChatOpen(false)} onSendMessage={handleSendMessage} />
            )}
    
            {isPrivateChatModalOpen && (
                <PrivateChatModal user={user} onClose={() => setIsPrivateChatModalOpen(false)} />
            )}
        </div>
      );
};

export default LiveStreamViewerScreen;
