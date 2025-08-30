
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
import PkBattleOverlay from './PkBattleOverlay';


// Icon Imports
import SwordsIcon from './icons/SwordsIcon';
import HeartSolidIcon from './icons/HeartSolidIcon';
import GiftBoxIcon from './icons/GiftBoxIcon';
import MoreToolsIcon from './icons/MoreToolsIcon';
import UserPlusIcon from './icons/UserPlusIcon';
import CameraOffIcon from './icons/CameraOffIcon';
import PlusIcon from './icons/PlusIcon';
import CheckIcon from './icons/CheckIcon';
import StarIcon from './icons/StarIcon';
import LightningIcon from './icons/LightningIcon';


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

const LiveInfoModal: React.FC<{ title: string; meta: string; }> = ({ title, meta }) => {
    return (
        <div className="absolute top-1/4 left-4 right-4 z-20 bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/20 animate-fade-in-out-short pointer-events-none">
            <h3 className="text-lg font-bold text-white truncate">{title}</h3>
            {meta && <p className="text-sm text-gray-300 mt-1 max-h-20 overflow-y-auto scrollbar-hide">{meta}</p>}
        </div>
    );
};

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

    const [isPkViewActive, setIsPkViewActive] = useState(isPkBattle);
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

    const PkTimer: React.FC<{ startTime: string; durationSeconds: number; }> = ({ startTime, durationSeconds }) => {
        const calculateTimeLeft = React.useCallback(() => {
            const endTime = new Date(startTime).getTime() + durationSeconds * 1000;
            const difference = endTime - Date.now();
            if (difference <= 0) return { m: 0, s: 0 };
    
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);
            return { m: minutes, s: seconds };
        }, [startTime, durationSeconds]);
    
        const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());
    
        React.useEffect(() => {
            const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
            return () => clearInterval(timer);
        }, [calculateTimeLeft]);
    
        return <span>{`PK ${String(timeLeft.m).padStart(2, '0')}:${String(timeLeft.s).padStart(2, '0')}`}</span>;
    };

    useEffect(() => {
        // Sync PK view state with the stream prop. This is crucial for navigating
        // out of a PK battle back into a single stream view.
        setIsPkViewActive('streamer1' in initialStream);
    }, [initialStream]);
    
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

    const handlePkResultModalClose = async () => {
        setPkEndAnimationState(null);
        setFinalPkBattleState(null);
        
        // Spectators can just exit back to feed
        if (!isHost) {
            onExit();
            return;
        }
        
        // Participants should go back to their own stream
        const myOwnStreamRecord = await liveStreamService.getActiveStreamForUser(user.id);
        if (myOwnStreamRecord) {
            // Replace the PK Battle stream object with the user's own single stream object
            onViewStream(myOwnStreamRecord);
        } else {
            // If the stream ended for some reason, exit to feed.
            onExit();
        }
    };

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
                  if (!pkEndAnimationState) { // Only set this once
                    setFinalPkBattleState(battleState);
                    const winnerId = battleState.pontuacao_A > battleState.pontuacao_B ? battleState.streamer_A_id : battleState.pontuacao_B > battleState.pontuacao_A ? battleState.streamer_B_id : null;
                    setPkEndAnimationState({ winnerId, loserId: winnerId ? (winnerId === battleState.streamer_A_id ? battleState.streamer_B_id : battleState.streamer_A_id) : null, isDraw: !winnerId });
                  }
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
    }, [initialStream, isPkBattle, onStreamEnded, liveId, isPkViewActive, giftNotificationSettings, onTriggerGiftAnimation, pkEndAnimationState]);
    
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
        
        const liveUpdateListener = (updatedLiveId: number) => {
            const currentStreamId = isPkBattle ? (initialStream as PkBattle).streamer1.streamId : (initialStream as Stream).id;
            const opponentStreamId = isPkBattle ? (initialStream as PkBattle).streamer2?.streamId : null;
            if (updatedLiveId === currentStreamId || (opponentStreamId && updatedLiveId === opponentStreamId)) {
                fetchLiveDetails();
            }
        };
        liveStreamService.addLiveUpdateListener(liveUpdateListener);
        const muteListener: MuteStatusListener = ({ liveId: updatedLiveId, userId: targetUserId, isMuted }) => {
            if (updatedLiveId === liveId && targetUserId === user.id) {
                setMuteNotification({ type: isMuted ? 'muted' : 'unmuted' });
            }
        };
        liveStreamService.addMuteStatusListener(muteListener);

        const kickListener: UserKickedListener = ({ liveId: updatedLiveId, kickedUserId }) => {
            if (updatedLiveId === liveId && kickedUserId === user.id) {
                setKickedState('just_kicked');
            }
        };
        liveStreamService.addUserKickedListener(kickListener);

        const soundListener: SoundEffectListener = ({ liveId: updatedLiveId, effectName }) => {
            if (updatedLiveId === liveId) {
                soundService.playSound(effectName);
            }
        };
        liveStreamService.addSoundEffectListener(soundListener);
        
        const blockListener: UserBlockedListener = ({ blockerId, targetId }) => {
            if (targetId === user.id && (blockerId === streamerId || (isPkBattle && blockerId === (initialStream as PkBattle).streamer2.userId))) {
                setIsBlockedByHost(true);
            }
        };
        liveStreamService.addUserBlockedListener(blockListener);

        const unblockListener: UserUnblockedListener = ({ unblockerId, targetId }) => {
            if (targetId === user.id && (unblockerId === streamerId || (isPkBattle && unblockerId === (initialStream as PkBattle).streamer2.userId))) {
                setIsBlockedByHost(false);
            }
        };
        liveStreamService.addUserUnblockedListener(unblockListener);
        
        const intervalId = setInterval(fetchLiveDetails, 3000);
        
        // Initial fetch
        fetchLiveDetails();

        return () => {
            clearInterval(intervalId);
            liveStreamService.leaveLiveStream(user.id, liveId);
            liveStreamService.removeLiveUpdateListener(liveUpdateListener);
            liveStreamService.removeMuteStatusListener(muteListener);
            liveStreamService.removeUserKickedListener(kickListener);
            liveStreamService.removeSoundEffectListener(soundListener);
            liveStreamService.removeUserBlockedListener(blockListener);
            liveStreamService.removeUserUnblockedListener(unblockListener);
        };
    }, [fetchLiveDetails, user.id, liveId, streamerId, initialStream, isPkBattle]);
    
    const handleSendMessage = async (message: string) => {
        try {
            await liveStreamService.sendChatMessage(liveId, user.id, message);
            fetchLiveDetails();
        } catch(error) {
            console.error("Failed to send message", error);
        }
    };
    
    const handleImageSelected = async (file: File) => {
        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async (event) => {
                const imageDataUrl = event.target?.result as string;
                const { url } = await liveStreamService.uploadChatImage(imageDataUrl);
                await liveStreamService.sendChatMessage(liveId, user.id, '', url);
                fetchLiveDetails();
            };
        } catch (error) {
            console.error("Failed to upload image", error);
            alert("Erro ao enviar imagem.");
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleMuteUser = async (targetUserId: number, mute: boolean) => {
        try {
            await liveStreamService.muteUser(liveId, targetUserId, mute);
        } catch (error) {
            console.error("Mute/unmute failed", error);
        }
    };

    const handleKickUser = async (targetUserId: number) => {
        try {
            await liveStreamService.kickUser(liveId, targetUserId);
            // Optionally close the modal after kicking
            // setIsMuteUserModalOpen(false);
        } catch (error) {
            console.error("Kick failed", error);
        }
    };
    
    const handlePlaySoundEffect = async (effectName: SoundEffectName) => {
        try {
            await liveStreamService.playSoundEffect(liveId, user.id, effectName);
            setIsSoundEffectModalOpen(false); // Close modal on success
        } catch (error) {
            console.error("Play sound effect failed", error);
        }
    };

    const handleStopStreamConfirm = () => {
        onStopStream(streamerId, liveId);
        setIsEndStreamModalOpen(false);
    };

    const handleEndPkConfirm = async () => {
        if (!activePkBattle) return;
        try {
            await liveStreamService.endPkBattle(activePkBattle.id, user.id);
            // The polling will detect the end state and show the results modal.
        } catch (err) {
            console.error("Failed to end PK battle", err);
        }
        setIsEndPkModalOpen(false);
    };
    
    const handleFlipCamera = async () => {
        setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        try {
            await liveStreamService.flipCamera(liveId);
        } catch(e) {
            console.error("Failed to sync camera flip with server:", e);
        }
    };

    const openUserProfile = useCallback((userId: number) => {
        if (userId === user.id) {
            onViewProfile(user.id);
        } else {
            onViewProfile(userId);
        }
    }, [user.id, onViewProfile]);

    const handleSendGift = useCallback(async (giftId: number, quantity: number, receiverId?: number) => {
        try {
            const res = await liveStreamService.sendGift(liveId, user.id, giftId, quantity, receiverId);
            if (res.success && res.updatedUser) {
                onUpdateUser(res.updatedUser);
            } else {
                onRequirePurchase();
            }
        } catch(error) {
            console.error("Failed to send gift", error);
            onRequirePurchase();
        }
    }, [liveId, user.id, onUpdateUser, onRequirePurchase]);

    const handleInviteToPrivateLive = (invitee: User) => {
        const invite: IncomingPrivateLiveInvite = {
            stream: initialStream as Stream,
            inviter: user,
            invitee,
        };
        onShowPrivateLiveInvite(invite);
    };
    
    const handleProposePkDispute = async (opponent: User) => {
        setIsPkStartDisputeModalOpen(false);
        try {
            const invitation = await liveStreamService.createPkInvitation(user.id, opponent.id, false);
            setOutgoingPkInvitationInfo({ invitation, opponent });
        } catch (e) {
            console.error("Failed to create PK invitation:", e);
            alert("Não foi possível criar o convite de PK.");
        }
    };

    const handleInviteToPk = async (opponent: User) => {
         setIsPkInviteModalOpen(false);
        try {
            const invitation = await liveStreamService.createPkInvitation(user.id, opponent.id, true);
            setOutgoingPkInvitationInfo({ invitation, opponent });
        } catch (e) {
            console.error("Failed to create Co-host PK invitation:", e);
            alert("Não foi possível criar o convite de Co-host.");
        }
    };

    const handleEnterFriendLive = async (friend: User) => {
        setIsPkInviteModalOpen(false); // Close the invite modal
        try {
            const streamToEnter = await liveStreamService.getActiveStreamForUser(friend.id);
            if (streamToEnter) {
                const pkBattleDb = await liveStreamService.findActivePkBattleForStream(streamToEnter.id);
                if (pkBattleDb) {
                    const pkBattle = await liveStreamService.getPkBattleDetails(Number(pkBattleDb.id));
                    onViewStream(pkBattle);
                } else {
                    onViewStream(streamToEnter);
                }
            } else {
                alert(`${friend.nickname} não está mais ao vivo.`);
            }
        } catch (error) {
            console.error("Failed to enter friend's stream:", error);
            alert("Ocorreu um erro ao tentar entrar na transmissão do amigo.");
        }
    };
    
    const handleInviteAccepted = (battle: PkBattle) => {
        setOutgoingPkInvitationInfo(null);
        onViewStream(battle);
    };

    const handleOpenHourlyRanking = () => {
        const streamerInfo = {
            id: isPkBattle ? (initialStream as PkBattle).streamer1.userId : (initialStream as Stream).userId,
            name: isPkBattle ? (initialStream as PkBattle).streamer1.name : (initialStream as Stream).nomeStreamer,
            avatarUrl: isPkBattle ? (initialStream as PkBattle).streamer1.avatarUrl : (liveDetails?.streamerAvatarUrl || '')
        };
        setHourlyRankingModalInfo({ liveId, streamer: streamerInfo });
    };

    if (kickedState !== 'none') {
        return <KickedFromStreamModal onExit={onExit} isJoinAttempt={kickedState === 'banned_on_join'} />;
    }

    const streamer1 = isPkViewActive ? activePkBattle?.streamer_A : (isPkBattle ? (initialStream as PkBattle).streamer1 : null);
    const streamer2 = isPkViewActive ? activePkBattle?.streamer_B : (isPkBattle ? (initialStream as PkBattle).streamer2 : null);

    return (
        <div className="h-full w-full bg-black text-white flex flex-col relative font-sans">
            {/* Background Video/Image */}
            <div className="absolute inset-0 z-0">
                { isHost ? (
                    <>
                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} />
                        <CameraStatusOverlay status={cameraStatus} />
                    </>
                ) : (
                    // FIX: The type of `streamer1` is a union, and TypeScript cannot guarantee `avatar_url` exists. Cast to `User` within this block since `isPkViewActive` is true, ensuring `streamer1` is a `User` object.
                    <img src={isPkViewActive ? (streamer1 as User)?.avatar_url : (initialStream as Stream).thumbnailUrl} alt="Stream preview" className="w-full h-full object-cover blur-md scale-110" />
                )}
            </div>
             {isPkViewActive && (
                <div className="absolute z-0 w-1/2 h-full top-0 right-0">
                     {/* FIX: The type of `streamer2` is a union. Cast to `User` within this block where `isPkViewActive` is true, ensuring `streamer2` is a `User` object and has the `avatar_url` property. */}
                     <img src={(streamer2 as User)?.avatar_url} alt="Stream preview" className="w-full h-full object-cover blur-md scale-110" />
                </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 z-10"></div>
            
             {showInfoModal && liveDetails?.title && <LiveInfoModal title={liveDetails.title} meta={liveDetails.meta || ''} />}

            {/* Main Content Overlay */}
            <div className="relative z-20 flex flex-col h-full p-2">
                 <header className="flex-shrink-0">
                    {isPkViewActive && activePkBattle ? (
                        <>
                             <div className="flex justify-between items-start">
                                 <LiveStreamHeader 
                                    variant="pk-left"
                                    avatarUrl={activePkBattle.streamer_A.avatar_url || ''}
                                    name={activePkBattle.streamer_A.nickname || ''}
                                    followers="" // not shown in PK
                                    viewerCount="" // not shown in PK
                                    coins="" // not shown in PK
                                    likes="" // not shown in PK
                                    onUserClick={() => openUserProfile(activePkBattle.streamer_A.id)}
                                    isCurrentUserHost={user.id === activePkBattle.streamer_A.id}
                                    isFollowing={(user.following || []).includes(activePkBattle.streamer_A.id)}
                                    onFollowToggle={() => onFollowToggle(activePkBattle.streamer_A.id)}
                                />
                                 <LiveStreamHeader 
                                    variant="pk-right"
                                    avatarUrl={activePkBattle.streamer_B.avatar_url || ''}
                                    name={activePkBattle.streamer_B.nickname || ''}
                                    followers=""
                                    viewerCount=""
                                    coins=""
                                    likes=""
                                    onUserClick={() => openUserProfile(activePkBattle.streamer_B.id)}
                                    onExitClick={isHost ? () => setIsEndPkModalOpen(true) : onExit}
                                    isCurrentUserHost={user.id === activePkBattle.streamer_B.id}
                                    isFollowing={(user.following || []).includes(activePkBattle.streamer_B.id)}
                                    onFollowToggle={() => onFollowToggle(activePkBattle.streamer_B.id)}
                                />
                             </div>
                             <div className="mt-2 flex justify-between items-start">
                                <div className="flex -space-x-4">
                                     {activePkBattle.top_supporters_A.slice(0, 3).map(s => <PkTopSupporter key={s.apoiador_id} supporter={s} onUserClick={openUserProfile} />)}
                                </div>
                                 <div className="flex flex-row-reverse -space-x-4 space-x-reverse">
                                      {activePkBattle.top_supporters_B.slice(0, 3).map(s => <PkTopSupporter key={s.apoiador_id} supporter={s} onUserClick={openUserProfile} />)}
                                </div>
                             </div>
                             <div className="px-4 mt-2">
                                <PkBattleOverlay battle={activePkBattle} streamer1WinMultiplier={1} streamer2WinMultiplier={1} isCoHost={activePkBattle.is_co_host} />
                             </div>
                        </>
                    ) : (
                        <LiveStreamHeader 
                            variant="single"
                            avatarUrl={liveDetails?.streamerAvatarUrl || ''}
                            name={liveDetails?.streamerName || ''}
                            followers={formatStatNumber(liveDetails?.streamerFollowers || 0)}
                            viewerCount={formatStatNumber(liveDetails?.viewerCount || 0)}
                            headerViewers={headerViewers[liveId]}
                            coins={formatStatNumber(liveDetails?.receivedGiftsValue || 0)}
                            likes={formatStatNumber(liveDetails?.likeCount || 0)}
                            onUserClick={() => openUserProfile(streamerId)}
                            onViewersClick={() => setOnlineUsersModalLiveId(liveId)}
                            onExitClick={isHost ? () => setIsEndStreamModalOpen(true) : onExit}
                            onCoinsClick={handleOpenHourlyRanking}
                            isCurrentUserHost={isHost}
                            isFollowing={(user.following || []).includes(streamerId)}
                            onFollowToggle={() => onFollowToggle(streamerId)}
                            streamerIsAvatarProtected={liveDetails?.streamerIsAvatarProtected}
                        />
                    )}
                </header>
                
                <div className="flex-grow"></div> {/* Spacer */}

                <div className="flex flex-col items-start justify-end flex-grow min-h-0">
                    <ChatArea messages={chatMessages} onUserClick={openUserProfile} />
                </div>
                
                 <footer className="absolute bottom-0 left-0 right-0 z-20 p-2">
                    <div className="flex items-center gap-2">
                        <div className="flex-grow">
                            <ChatInput 
                                onSendMessage={handleSendMessage} 
                                onImageSelected={handleImageSelected}
                                disabled={isBlockedByHost || (!!muteNotification && muteNotification.type === 'muted')}
                                isUploading={isUploading}
                                allowImageUpload={false}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {isHost && (
                                <button onClick={() => setIsPkInviteModalOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center">
                                    <SwordsIcon className="w-6 h-6" />
                                </button>
                            )}
                             <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center">
                                <GiftBoxIcon className="w-6 h-6" />
                            </button>
                             {isHost && (
                                <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center">
                                    <MoreToolsIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </div>
                </footer>
            </div>

            {/* Modals */}
             {onlineUsersModalLiveId !== null && (
                <OnlineUsersModal liveId={onlineUsersModalLiveId} onClose={() => setOnlineUsersModalLiveId(null)} onUserClick={openUserProfile}/>
            )}
             {hourlyRankingModalInfo !== null && (
                <HourlyRankingModal 
                    liveId={hourlyRankingModalInfo.liveId}
                    onClose={() => setHourlyRankingModalInfo(null)}
                    onUserClick={openUserProfile}
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
            {isRankingListOpen && (
                <RankingListScreen
                    liveId={liveId}
                    currentUser={user}
                    onExit={() => setIsRankingListOpen(false)}
                    onUserClick={openUserProfile}
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
                    pkBattleStreamers={isPkViewActive && activePkBattle ? {
                        streamer1: { 
                            userId: activePkBattle.streamer_A.id, 
                            streamId: activePkBattle.streamer_A_streamId!, 
                            name: activePkBattle.streamer_A.nickname || '', 
                            avatarUrl: activePkBattle.streamer_A.avatar_url || '', 
                            isVerified: false, 
                            score: activePkBattle.pontuacao_A 
                        },
                        streamer2: { 
                             userId: activePkBattle.streamer_B.id, 
                            streamId: activePkBattle.streamer_B_streamId!, 
                            name: activePkBattle.streamer_B.nickname || '', 
                            avatarUrl: activePkBattle.streamer_B.avatar_url || '', 
                            isVerified: false, 
                            score: activePkBattle.pontuacao_B 
                        }
                    } : undefined}
                />
            )}
            {isArcoraToolModalOpen && (
                 <ArcoraToolModal
                    onClose={() => setIsArcoraToolModalOpen(false)}
                    onOpenMuteModal={() => { setIsArcoraToolModalOpen(false); setIsMuteUserModalOpen(true); }}
                    onOpenSoundEffectModal={() => { setIsArcoraToolModalOpen(false); setIsSoundEffectModalOpen(true); }}
                    onSwitchCamera={handleFlipCamera}
                    cameraFacingMode={cameraFacingMode}
                    onToggleVoice={handleToggleVoice}
                    isVoiceEnabled={isMicEnabled}
                    onOpenPrivateChat={() => { setIsArcoraToolModalOpen(false); setIsPrivateChatModalOpen(true); }}
                    isPrivateStream={isPrivateStream}
                    onOpenPrivateInviteModal={() => { setIsArcoraToolModalOpen(false); setIsInviteToPrivateLiveModalOpen(true); }}
                    onOpenPkStartModal={() => { setIsArcoraToolModalOpen(false); setIsPkStartDisputeModalOpen(true); }}
                    isPkBattleActive={isPkViewActive}
                    onOpenPkInviteModal={() => { setIsArcoraToolModalOpen(false); setIsPkInviteModalOpen(true); }}
                />
            )}
            {isMuteUserModalOpen && (
                <MuteUserModal liveId={liveId} mutedUsers={mutedUsers} onMuteUser={handleMuteUser} onKickUser={handleKickUser} onClose={() => setIsMuteUserModalOpen(false)} />
            )}
            {isSoundEffectModalOpen && (
                <SoundEffectModal onClose={() => setIsSoundEffectModalOpen(false)} onPlaySoundEffect={handlePlaySoundEffect} />
            )}
             {muteNotification && (
                <MutedNotificationModal type={muteNotification.type} onClose={() => setMuteNotification(null)} />
            )}
             {isEndStreamModalOpen && (
                <EndStreamConfirmationModal onConfirm={handleStopStreamConfirm} onCancel={() => setIsEndStreamModalOpen(false)} />
            )}
             {isEndPkModalOpen && (
                <EndStreamConfirmationModal 
                    onConfirm={handleEndPkConfirm} 
                    onCancel={() => setIsEndPkModalOpen(false)}
                    title="Encerrar batalha PK?"
                    message="Tem certeza que deseja encerrar a batalha PK? O lado com a pontuação mais alta vencerá."
                    confirmText="Encerrar Batalha"
                />
            )}
             {incomingCompetitionInvite && (
                <PkCompetitionInviteModal 
                    currentUser={user}
                    invitation={incomingCompetitionInvite}
                    onAccept={() => {
                        alert(`Aceitou o convite de ${incomingCompetitionInvite.inviterName}! (A funcionalidade não está implementada)`);
                        setIncomingCompetitionInvite(null);
                    }}
                    onDecline={() => setIncomingCompetitionInvite(null)}
                />
            )}
            {isInviteToPrivateLiveModalOpen && (
                <InviteToPrivateLiveModal 
                    streamerId={user.id} 
                    liveId={liveId} 
                    onClose={() => setIsInviteToPrivateLiveModalOpen(false)} 
                    onInviteSent={handleInviteToPrivateLive}
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
                    onSendInvite={handleInviteToPk}
                />
            )}
            {outgoingPkInvitationInfo && (
                <PkInvitationModal
                    currentUser={user}
                    opponent={outgoingPkInvitationInfo.opponent}
                    invitation={outgoingPkInvitationInfo.invitation}
                    onClose={() => setOutgoingPkInvitationInfo(null)}
                    onInviteAccepted={handleInviteAccepted}
                />
            )}
             {embeddedChatOtherUser && (
                <EmbeddedChatView
                    currentUser={user}
                    otherUser={embeddedChatOtherUser}
                    onClose={() => setEmbeddedChatOtherUser(null)}
                />
            )}
            {isPkStartDisputeModalOpen && (
                <PkStartDisputeModal
                    currentUser={user}
                    onClose={() => setIsPkStartDisputeModalOpen(false)}
                    onProposeDispute={handleProposePkDispute}
                />
            )}
            {showPkClashAnimation && <PkClashAnimation onAnimationEnd={() => setShowPkClashAnimation(false)} />}
             {pkEndAnimationState && finalPkBattleState && (
                <PkResultModal 
                    currentUser={user}
                    battleData={finalPkBattleState}
                    onClose={handlePkResultModalClose}
                />
            )}
        </div>
    );
};

export default LiveStreamViewerScreen;