
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Stream, PkBattle, ChatMessage, LiveDetails, PkInvitation, SoundEffectName, MuteStatusListener, UserKickedListener, SoundEffectListener, PublicProfile, PkBattleState, ConvitePK, IncomingPrivateLiveInvite, UserBlockedListener, UserUnblockedListener, Viewer, PkBattleStreamer, AppView, FacingMode, CameraStatus } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import * as soundService from '../services/soundService';

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
import EditProfileScreen from './EditProfileScreen';
import EmbeddedChatView from './EmbeddedChatView';
import GiftDisplayAnimation from './GiftDisplayAnimation';

// Icon Imports
import SwordsIcon from './icons/SwordsIcon';
import HeartSolidIcon from './icons/HeartSolidIcon';
import GiftBoxIcon from './icons/GiftBoxIcon';
import MoreToolsIcon from './icons/MoreToolsIcon';
import UserPlusIcon from './icons/UserPlusIcon';
import CameraOffIcon from './icons/CameraOffIcon';


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
  onFollowToggle: (userId: number, optimisticCallback?: (action: 'follow' | 'unfollow') => void) => Promise<void>;
  giftNotificationSettings: Record<number, boolean> | null;
  onTriggerGiftAnimation: (gift: ChatMessage) => void;
}

const formatStatNumber = (num: number): string => {
    return String(num || 0);
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

const LiveInfoModal: React.FC<{ title: string; meta: string; }> = ({ title, meta }) => {
    return (
        <div className="absolute top-1/4 left-4 right-4 z-20 bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/20 animate-fade-in-out-short pointer-events-none">
            <h3 className="text-lg font-bold text-white truncate">{title}</h3>
            {meta && <p className="text-sm text-gray-300 mt-1 max-h-20 overflow-y-auto scrollbar-hide">{meta}</p>}
        </div>
    );
};

// FIX: Create a component to display camera status to the host.
const CameraStatusOverlay: React.FC<{ status: CameraStatus }> = ({ status }) => {
    if (status === 'success' || status === 'idle') return null;

    let message = '';
    switch (status) {
        case 'loading': message = 'Iniciando câmera...'; break;
        case 'denied': message = 'Acesso à câmera negado. Verifique as permissões do navegador.'; break;
        case 'timeout': message = 'A câmera demorou para responder. Tente novamente.'; break;
        case 'in-use': message = 'Sua câmera está em uso por outro aplicativo.'; break;
        case 'not-found': message = 'Nenhuma câmera foi encontrada.'; break;
        case 'error': message = 'Ocorreu um erro inesperado com a câmera.'; break;
        case 'insecure': message = 'O acesso à câmera requer uma conexão segura (HTTPS).'; break;
    }
    
    return (
        <div className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center p-4 text-center">
            {status !== 'loading' && <CameraOffIcon className="w-16 h-16 mb-4 text-red-500" />}
            {status === 'loading' && <div className="w-12 h-12 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mb-4"></div>}
            <p className="text-white font-semibold">{message}</p>
        </div>
    );
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
  onFollowToggle,
  giftNotificationSettings,
  onTriggerGiftAnimation,
}) => {
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
    const [chatUserProfiles, setChatUserProfiles] = useState<Record<number, { avatarUrl: string }>>({});
    const [headerViewers, setHeaderViewers] = useState<Record<number, Viewer[]>>({});
    const [viewingProfileId, setViewingProfileId] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Modal states
    const [showInfoModal, setShowInfoModal] = useState(false);
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
    const isHost = user.id === streamerId || (isPkBattle && user.id === (initialStream as PkBattle).streamer2.userId);
    const isPrivateStream = !isPkBattle && (initialStream as Stream).isPrivate;

    // Host Camera State
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [cameraStatus, setCameraStatus] = useState<CameraStatus>(isHost ? 'loading' : 'idle');
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const getInitialCameraMode = useCallback(() => {
        if ('cameraFacingMode' in initialStream && initialStream.cameraFacingMode) {
            return initialStream.cameraFacingMode;
        }
        if (isHost && user.last_camera_used) {
            return user.last_camera_used;
        }
        return 'user' as FacingMode;
    }, [initialStream, isHost, user.last_camera_used]);
    const [cameraFacingMode, setCameraFacingMode] = useState<FacingMode>(getInitialCameraMode());
    
    useEffect(() => {
        if (isHost && 'voiceEnabled' in initialStream && initialStream.voiceEnabled !== undefined) {
            setIsMicEnabled(initialStream.voiceEnabled);
        }
    }, [initialStream, isHost]);

    useEffect(() => {
        if (isHost && mediaStream) {
            mediaStream.getAudioTracks().forEach(track => {
                if (track.enabled !== isMicEnabled) {
                    track.enabled = isMicEnabled;
                }
            });
        }
    }, [isHost, mediaStream, isMicEnabled]);

    const handleToggleVoice = useCallback(() => {
        const newMicState = !isMicEnabled;
        setIsMicEnabled(newMicState);
        liveStreamService.toggleMicrophone(liveId, newMicState)
            .catch(err => {
                console.error("Failed to sync mic state with server", err);
                setIsMicEnabled(isMicEnabled); // Revert on failure
                alert("Falha ao alterar o estado do microfone. Tente novamente.");
            });
    }, [isMicEnabled, liveId]);
    
    // FIX: Add detailed error handling for camera access and a user-facing status.
    useEffect(() => {
        if (!isHost) {
            setCameraStatus('idle');
            return;
        }

        let isMounted = true;
        let stream: MediaStream | null = null;
        
        const requestCamera = async () => {
          if (!window.isSecureContext) {
              setCameraStatus('insecure');
              return;
          }
            
          setCameraStatus('loading');
          try {
            const constraints = {
                audio: true,
                video: { facingMode: cameraFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
            };
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (isMounted) {
              setMediaStream(stream);
              setCameraStatus('success');
            } else {
              stream.getTracks().forEach(track => track.stop());
            }
          } catch (err) {
            if (isMounted) {
                console.error("Camera access error:", err);
                if (err instanceof DOMException) {
                    switch (err.name) {
                    case 'NotAllowedError':
                    case 'PermissionDeniedError':
                        setCameraStatus('denied');
                        break;
                    case 'NotReadableError':
                    case 'OverconstrainedError':
                        setCameraStatus('in-use');
                        break;
                    case 'NotFoundError':
                    case 'DevicesNotFoundError':
                        setCameraStatus('not-found');
                        break;
                    case 'TimeoutError':
                        setCameraStatus('timeout');
                        break;
                    default:
                        setCameraStatus('error');
                    }
                } else {
                    setCameraStatus('error');
                }
            }
          }
        };

        requestCamera();
        
        return () => {
          isMounted = false;
          const currentStream = stream || mediaStream;
          currentStream?.getTracks().forEach(track => track.stop());
          setMediaStream(null);
        };
    }, [isHost, cameraFacingMode]);

    // Effect for attaching the stream to the video element
    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement && mediaStream) {
            if (videoElement.srcObject !== mediaStream) {
                videoElement.srcObject = mediaStream;
            }
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Ignore AbortError which is expected when the component unmounts quickly
                    if (error.name !== 'AbortError') {
                        console.error("Main video play failed", error);
                    }
                });
            }
        }
    }, [mediaStream]);

    useEffect(() => {
        const prevStream = prevStreamRef.current;
        const isNowPk = 'streamer1' in initialStream;
        const wasPk = prevStream && 'streamer1' in prevStream;

        if (isNowPk && (!wasPk || (prevStream as PkBattle).id !== (initialStream as PkBattle).id)) {
            setShowPkClashAnimation(true);
        }
        
        prevStreamRef.current = initialStream;
    }, [initialStream]);

    const fetchLiveDetails = useCallback(async () => {
      try {
          if (isPkBattle && isPkViewActive) {
              const pkId = (initialStream as PkBattle).id;
              const battleState = await liveStreamService.getActivePkBattle(pkId);
              
              const pkInitial = initialStream as PkBattle;
              (battleState as PkBattleState).streamer_A_streamId = pkInitial.streamer1.userId === battleState.streamer_A_id 
                  ? pkInitial.streamer1.streamId 
                  : pkInitial.streamer2.streamId;
              (battleState as PkBattleState).streamer_B_streamId = pkInitial.streamer1.userId === battleState.streamer_B_id
                  ? pkInitial.streamer1.streamId
                  : pkInitial.streamer2.streamId;

              setActivePkBattle(battleState);

              if (!battleState.streamer_A_streamId || !battleState.streamer_B_streamId) {
                console.error("Could not map stream IDs in PK battle");
                onStreamEnded(liveId);
                return;
              }

              const [details1, details2, messages, viewers1, viewers2] = await Promise.all([
                  liveStreamService.getLiveStreamDetails(battleState.streamer_A_streamId),
                  liveStreamService.getLiveStreamDetails(battleState.streamer_B_streamId),
                  liveStreamService.getChatMessages(battleState.streamer_A_streamId),
                  liveStreamService.getViewers(battleState.streamer_A_streamId),
                  liveStreamService.getViewers(battleState.streamer_B_streamId),
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
                  [battleState.streamer_A_streamId]: viewers1.slice(0, 3),
                  [battleState.streamer_B_streamId]: viewers2.slice(0, 3),
              });

              const lastId = lastGiftIdRef.current;
              const lastMsgIndex = lastId ? messages.findIndex(m => m.id === lastId) : -1;
              const newGifts = messages.slice(lastMsgIndex + 1).filter(m => m.type === 'gift');

              if (newGifts.length > 0) {
                  lastGiftIdRef.current = newGifts[newGifts.length - 1].id;
                  newGifts.forEach((gift, index) => {
                       if (gift.giftId && (!giftNotificationSettings || giftNotificationSettings[gift.giftId] !== false)) {
                          setTimeout(() => {
                              soundService.playSound('gift');
                              onTriggerGiftAnimation(gift);
                          }, index * 50);
                      }
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

              const lastId = lastGiftIdRef.current;
              const lastMsgIndex = lastId ? messages.findIndex(m => m.id === lastId) : -1;
              const newGifts = messages.slice(lastMsgIndex + 1).filter(m => m.type === 'gift');

              if (newGifts.length > 0) {
                  lastGiftIdRef.current = newGifts[newGifts.length - 1].id;
                  newGifts.forEach((gift, index) => {
                      if (gift.giftId && (!giftNotificationSettings || giftNotificationSettings[gift.giftId] !== false)) {
                          setTimeout(() => {
                              soundService.playSound('gift');
                              onTriggerGiftAnimation(gift);
                          }, index * 50);
                      }
                  });
              }
          }
      } catch (error) {
          console.error("Stream might have ended:", error);
          onStreamEnded(liveId);
      }
    }, [initialStream, isPkBattle, onStreamEnded, liveId, isPkViewActive, giftNotificationSettings, onTriggerGiftAnimation]);
    
    useEffect(() => {
        // Show info modal only if there's a title and it has been fetched
        if (liveDetails?.title) {
            setShowInfoModal(true);
            const timer = setTimeout(() => {
                setShowInfoModal(false);
            }, 5000); // Match CSS animation duration
            return () => clearTimeout(timer);
        }
    }, [liveDetails?.title]);

    useEffect(() => {
        const getSimulatedToken = async () => {
            try {
                const roomName = `live-${liveId}`;
                const { token } = await liveStreamService.getLiveKitToken(roomName, String(user.id));
                console.log(`[SIMULAÇÃO] Token LiveKit recebido para a sala ${roomName}:`, token);
            } catch(e) {
                console.error("Falha ao obter token simulado do LiveKit", e);
            }
        };

        getSimulatedToken();
        liveStreamService.joinLiveStream(user.id, liveId);
        
        const listener = (updatedLiveId: number) => {
            const currentStreamId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : (initialStream as Stream).id;
            const opponentStreamId = isPkBattle ? (initialStream as PkBattle).streamer2?.streamId : null;
            if (updatedLiveId === currentStreamId || (opponentStreamId && updatedLiveId === opponentStreamId)) {
                fetchLiveDetails();
            }
        };
        liveStreamService.addLiveUpdateListener(listener);
        fetchLiveDetails(); // Initial fetch
        
        return () => {
            liveStreamService.removeLiveUpdateListener(listener);
            liveStreamService.leaveLiveStream(user.id, liveId);
        };
    }, [liveId, user.id, fetchLiveDetails, isPkBattle, initialStream]);

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
            const currentLiveId = isPkViewActive && activePkBattle ? activePkBattle.streamer_A_streamId! : liveId;
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

                    const currentLiveId = isPkViewActive && activePkBattle ? activePkBattle.streamer_A_streamId! : liveId;
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
    }, [user.id, liveId, fetchLiveDetails, isPkViewActive, activePkBattle]);

    const handleSendGift = async (giftId: number, quantity: number, receiverId?: number) => {
        try {
            const currentLiveId = isPkViewActive && activePkBattle ? activePkBattle.streamer_A_streamId! : liveId;
            const response = await liveStreamService.sendGift(currentLiveId, user.id, giftId, quantity, receiverId);
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
        setIsPkInviteModalOpen(false);
        setIsPkStartDisputeModalOpen(false);
    
        console.log(`Simulating PK invite from opponent ${opponent.nickname} to self for testing.`);
        
        const mockInvite: PkInvitation = {
            id: `mock-invite-${opponent.id}`,
            remetente_id: opponent.id,
            destinatario_id: user.id,
            status: 'pendente',
            data_envio: new Date().toISOString(),
            data_expiracao: new Date(Date.now() + 60000).toISOString(),
            batalha_id: undefined,
            inviterName: opponent.nickname || opponent.name,
            inviterAvatarUrl: opponent.avatar_url || '',
        };
        
        setIncomingCompetitionInvite(mockInvite);
    };
    
    const handleAcceptCompetitionInvite = async () => {
        if (!incomingCompetitionInvite) return;
        try {
            const inviteId = incomingCompetitionInvite.id;
            let battle: PkBattle;
    
            if (inviteId.startsWith('mock-invite-') || inviteId.startsWith('self-invite-')) {
                const inviterId = incomingCompetitionInvite.remetente_id;
                const inviteeId = incomingCompetitionInvite.destinatario_id;
                console.log(`Accepting simulated invite. Creating PK battle between ${inviterId} and ${inviteeId}.`);
                battle = await liveStreamService.inviteToCoHostPk(inviterId, inviteeId);
            } else {
                const response = await liveStreamService.acceptPkInvitation(inviteId);
                if (!response.battle) throw new Error("A batalha não pôde ser criada a partir do convite.");
                battle = response.battle;
            }
            
            if (battle) {
                setShowPkClashAnimation(true);
                
                const battleState = await liveStreamService.getActivePkBattle(battle.id);
                setActivePkBattle(battleState);
                setIsPkViewActive(true);
                setIncomingCompetitionInvite(null);
            } else {
                throw new Error("Não foi possível iniciar a batalha.");
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erro ao aceitar convite.");
            setIncomingCompetitionInvite(null);
        }
    };

    const handleDeclineCompetitionInvite = async () => {
        if (!incomingCompetitionInvite) return;
        try {
            const inviteId = incomingCompetitionInvite.id;
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
                alert("Não foi possível encontrar la live ativa para este usuário.");
            }
        } catch (error) {
            console.error("Failed to enter friend's live stream:", error);
            alert("Ocorreu um erro ao entrar na live.");
        }
    };

    const pkBattleStreamersProp = isPkBattle && activePkBattle ? {
        streamer1: {
            userId: activePkBattle.streamer_A.id,
            streamId: activePkBattle.streamer_A_streamId!,
            name: activePkBattle.streamer_A.nickname || activePkBattle.streamer_A.name,
            score: activePkBattle.pontuacao_A,
            avatarUrl: activePkBattle.streamer_A.avatar_url || '',
            isVerified: true, 
        } as PkBattleStreamer,
        streamer2: {
            userId: activePkBattle.streamer_B.id,
            streamId: activePkBattle.streamer_B_streamId!,
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
                    <div className="w-1/2 h-full relative">
                        {user.id === streamer1.id ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                                />
                                <CameraStatusOverlay status={cameraStatus} />
                            </>
                        ) : (
                            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${streamer1.avatar_url})` }} />
                        )}
                    </div>
                    <div className="w-1/2 h-full relative">
                         {user.id === streamer2.id ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                                />
                                 <CameraStatusOverlay status={cameraStatus} />
                            </>
                        ) : (
                            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${streamer2.avatar_url})` }} />
                        )}
                    </div>
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
                            onViewersClick={() => setOnlineUsersModalLiveId(activePkBattle.streamer_A_streamId!)}
                            onCoinsClick={() => setHourlyRankingModalInfo({ liveId: activePkBattle.streamer_A_streamId!, streamer: { id: streamer1.id, name: streamer1.nickname || streamer1.name, avatarUrl: streamer1.avatar_url || '' } })}
                            isCurrentUserHost={user.id === streamer1.id}
                            isFollowing={(user.following || []).includes(streamer1.id)}
                            onFollowToggle={() => onFollowToggle(streamer1.id)}
                            streamerIsAvatarProtected={liveDetails?.streamerIsAvatarProtected}
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
                            onViewersClick={() => setOnlineUsersModalLiveId(activePkBattle.streamer_B_streamId!)}
                            onCoinsClick={() => setHourlyRankingModalInfo({ liveId: activePkBattle.streamer_B_streamId!, streamer: { id: streamer2.id, name: streamer2.nickname || streamer2.name, avatarUrl: streamer2.avatar_url || '' } })}
                            isCurrentUserHost={user.id === streamer2.id}
                            isFollowing={(user.following || []).includes(streamer2.id)}
                            onFollowToggle={() => onFollowToggle(streamer2.id)}
                            streamerIsAvatarProtected={liveDetails2?.streamerIsAvatarProtected}
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
                                            <MoreToolsIcon className="w-8 h-8"/>
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-label="Enviar presente">
                                    <GiftBoxIcon className="w-8 h-8" />
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
              {isHost ? (
                  <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                    />
                    <CameraStatusOverlay status={cameraStatus} />
                  </>
              ) : (
                  <img
                      src="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                      alt="Stream background"
                      className="w-full h-full object-cover"
                  />
              )}
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
                      onFollowToggle={() => onFollowToggle(streamerId)}
                      streamerIsAvatarProtected={liveDetails?.streamerIsAvatarProtected}
                  />
              </header>
              
              <div className="flex-grow pointer-events-none" />

              <footer className="p-3 flex flex-col items-start gap-4">
                  <div className="w-full max-w-md"><ChatArea messages={chatMessages} onUserClick={setViewingProfileId} /></div>
                  <div className="w-full flex items-center gap-2 pointer-events-auto">
                      <ChatInput onSendMessage={handleSendMessage} isUploading={isUploading} disabled={isBlockedByHost} allowImageUpload={false} />
                      <div className="flex items-center gap-2 shrink-0">
                          {isHost ? (
                              isPrivateStream ? (
                                  <button onClick={() => setIsInviteToPrivateLiveModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-label="Convidar para live privada">
                                      <UserPlusIcon className="w-6 h-6 text-white" />
                                  </button>
                              ) : (
                                  <button onClick={() => isPkViewActive ? setIsEndPkModalOpen(true) : setIsPkInviteModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-label="Batalha PK">
                                      <SwordsIcon className="w-6 h-6"/>
                                  </button>
                              )
                          ) : (
                              <button onClick={handleSendLike} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-pulse" aria-label="Enviar curtida">
                                  <HeartSolidIcon className="w-6 h-6 text-pink-400" />
                              </button>
                          )}
                           {isHost && (
                                <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-label="Ferramentas do anfitrião">
                                    <MoreToolsIcon className="w-8 h-8"/>
                                </button>
                           )}
                          <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" aria-label="Enviar presente">
                              <GiftBoxIcon className="w-8 h-8" />
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

            {showInfoModal && liveDetails?.title && <LiveInfoModal title={liveDetails.title} meta={liveDetails.meta || ''} />}
    
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
                            onFollowToggle={onFollowToggle}
                            onNavigateToChat={(otherUserId) => {
                                setViewingProfileId(null);
                                onNavigateToChat(otherUserId);
                            }}
                            onNavigate={(view) => {
                                if (viewingProfileId) {
                                    onNavigateFromStream(view, viewingProfileId);
                                }
                            }}
                            onUpdateUser={onUpdateUser}
                            onViewProfile={onViewProfile}
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
                <GiftPanel 
                    user={user} 
                    liveId={liveId} 
                    streamerId={streamerId} 
                    isHost={isHost}
                    onClose={() => setIsGiftPanelOpen(false)} 
                    onSendGift={handleSendGift} 
                    onRechargeClick={onRequirePurchase} 
                    pkBattleStreamers={pkBattleStreamersProp} 
                />
            )}
    
            {isArcoraToolModalOpen && (
                <ArcoraToolModal
                    onClose={() => setIsArcoraToolModalOpen(false)}
                    onOpenMuteModal={() => { setIsArcoraToolModalOpen(false); setIsMuteUserModalOpen(true); }}
                    onOpenSoundEffectModal={() => { setIsArcoraToolModalOpen(false); setIsSoundEffectModalOpen(true); }}
                    onSwitchCamera={() => alert('Câmera alternada!')}
                    onToggleVoice={handleToggleVoice}
                    isVoiceEnabled={isMicEnabled}
                    onOpenPrivateChat={() => {
                        setIsArcoraToolModalOpen(false);
                        setIsPrivateChatModalOpen(true);
                    }}
                    isPrivateStream={isPrivateStream}
                    onOpenPrivateInviteModal={() => { setIsArcoraToolModalOpen(false); setIsInviteToPrivateLiveModalOpen(true); }}
                    onOpenPkStartModal={() => { setIsArcoraToolModalOpen(false); setIsPkStartDisputeModalOpen(true); }}
                    isPkBattleActive={isPkViewActive}
                    onOpenPkInviteModal={() => { setIsArcoraToolModalOpen(false); setIsPkInviteModalOpen(true); }}
                    cameraFacingMode={cameraFacingMode}
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
                        if (isPrivateStream) {
                            const mockInvite: IncomingPrivateLiveInvite = {
                                stream: initialStream as Stream,
                                inviter: user,
                                invitee: user, // Show as if the host invited themselves for demo
                            };
                            onShowPrivateLiveInvite(mockInvite);
                        }
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
