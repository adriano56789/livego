import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { User, Stream, PkBattle, ChatMessage, LiveDetails, PkInvitation, SoundEffectName, MuteStatusListener, UserKickedListener, SoundEffectListener, PublicProfile, PkBattleState, ConvitePK, IncomingPrivateLiveInvite, UserBlockedListener, UserUnblockedListener, Viewer, PkBattleStreamer, AppView, FacingMode, CameraStatus, Conversation, TabelaRankingApoiadores, DiamondPackage, RouletteSettings, RaffleState, RaffleParticipant } from '../types';
import * as liveStreamService from '../services/liveStreamService';
import * as authService from '../services/authService';
import * as soundService from '../services/soundService';
// Importar serviços do LiveKit
import { useLiveKit } from '../hooks/useLiveKit';
import { liveKitService } from '../services/liveKitService';

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
import RankingListScreen from './RankingListScreen';
import PkStartDisputeModal from './PkStartDisputeModal';
import PkClashAnimation from './PkClashAnimation';
import LiveStreamHeader from './LiveStreamHeader';
import PkResultModal from './PkResultModal';
import PkInviteModal from './PkInviteModal';
import PkInvitationModal from './PkInvitationModal';
import PkTopSupporter from './PkTopSupporter';
import EditProfileScreen from './EditProfileScreen';
import SetPrivacyModal from './SetPrivacyModal';
// FIX: Removed unused import for EmbeddedChatView as the file is not a module.
import GiftDisplayAnimation from './GiftDisplayAnimation';
import PkBattleOverlay from './PkBattleOverlay';
import DiamondPurchaseScreen from './DiamondPurchaseScreen';
import PurchaseConfirmationScreen from './PurchaseConfirmationScreen';
import FloatingHearts, { FloatingHeartsRef } from './FloatingHearts';
// Add missing import for PkRankingModal.
import PkRankingModal from './PkRankingModal';
import RouletteWidget from './RouletteWidget';
import RouletteSetupModal from './RouletteSetupModal';
import QuickChatModal from './QuickChatModal';
import PrivateChatListModal from './PrivateChatListModal';
import PrizeWheelWidget from './PrizeWheelWidget';
import PrizeWheelModal from './PrizeWheelModal';
import RaffleSetupModal from './RaffleSetupModal';
import RaffleWidget from './RaffleWidget';
import RaffleWinnerModal from './RaffleWinnerModal';


// Icon Imports
import SwordsIcon from './icons/SwordsIcon';
import HeartSolidIcon from './icons/HeartSolidIcon';
import {
  GiftBoxIcon,
  MoreToolsIcon,
  UserPlusIcon,
  CameraOffIcon,
  PlusIcon,
  CheckIcon,
  StarIcon,
  LightningIcon,
  CrossIcon,
  CoinGIcon,
  HeartPinkIcon,
  LinkedCirclesIcon,
  BoxingGlovesIcon,
  MessageIcon,
  DiamondIcon,
  RouletteIcon
} from './icons';
import AudioVisualizer from './AudioVisualizer';


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
  onNavigate: (view: AppView, meta?: any) => void;
  onFollowToggle: (userId: number, optimisticCallback?: (action: 'follow' | 'unfollow') => void) => Promise<void>;
  giftNotificationSettings: Record<number, boolean> | null;
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

const CameraStatusOverlay: React.FC<{ status: CameraStatus; liveKitConnected?: boolean; liveKitError?: string }> = ({ status, liveKitConnected, liveKitError }) => {
    if (status === 'success' || status === 'idle') {
        // Mostrar status do LiveKit se a câmera estiver funcionando
        if (status === 'success' && (liveKitError || !liveKitConnected)) {
            return (
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${liveKitConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-semibold">
                            {liveKitConnected ? 'LiveKit Conectado' : 'LiveKit Desconectado'}
                        </span>
                    </div>
                    {liveKitError && (
                        <p className="text-red-400 text-xs">{liveKitError}</p>
                    )}
                </div>
            );
        }
        return null;
    }

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
            {liveKitError && (
                <p className="text-red-400 text-sm mt-2">LiveKit: {liveKitError}</p>
            )}
        </div>
    );
};

const GiftRouletteAnimation: React.FC<{ winMessage: ChatMessage; onAnimationComplete: () => void; }> = ({ winMessage, onAnimationComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 4000); // Animation lasts 4 seconds

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 pointer-events-none overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Spinning element */}
        <div 
          className="w-48 h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-400 rounded-full flex items-center justify-center"
          style={{ animation: 'gift-roulette-spin 4s cubic-bezier(0.5, 0, 0.5, 1) forwards' }}
        >
            <span className="text-4xl font-bold text-white">?</span>
        </div>

        {/* Prize display */}
        <div 
          className="absolute flex flex-col items-center gap-2 text-center"
          style={{ animation: 'gift-roulette-prize-glow 2s ease-in-out 2s forwards' }}
        >
            <p className="text-lg font-semibold text-white">Você ganhou!</p>
            <div className="flex items-center gap-2 text-3xl font-bold text-yellow-300 drop-shadow-lg">
                <DiamondIcon className="w-8 h-8"/>
                <span>{winMessage.prizeAmount?.toLocaleString()}</span>
            </div>
            {winMessage.multiplier && winMessage.multiplier > 1 && (
                 <p className="text-xl font-bold text-pink-400">x{winMessage.multiplier} Multiplicador!</p>
            )}
        </div>
      </div>
    </div>
  );
};

const LiveStreamViewerScreen: React.FC<LiveStreamViewerScreenProps> = ({
  user,
  stream: initialStreamOrBattle,
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
  onNavigate,
  onFollowToggle,
  giftNotificationSettings,
}) => {
    const isPkBattle = 'streamer1' in initialStreamOrBattle;
    const pkBattleId = isPkBattle ? (initialStreamOrBattle as PkBattle).id : null;

    // Hook do LiveKit para gerenciar WebRTC
    const {
        isConnected: isLiveKitConnected,
        conectar: conectarLiveKit,
        desconectar: desconectarLiveKit,
        habilitarCamera,
        desabilitarCamera,
        participants: liveKitParticipants,
        error: liveKitError,
        isCameraEnabled: isLiveKitCameraEnabled,
        isMicrophoneEnabled: isLiveKitMicEnabled
    } = useLiveKit();

    const [activePkBattle, setActivePkBattle] = useState<PkBattleState | null>(null);
    const [finalPkBattleState, setFinalPkBattleState] = useState<PkBattleState | null>(null);
    const [pkEndAnimationState, setPkEndAnimationState] = useState<{ winnerId: number | null, loserId: number | null, isDraw: boolean } | null>(null);

    // Common State
    const [liveDetails, setLiveDetails] = useState<LiveDetails | null>(null);
    const [liveDetails2, setLiveDetails2] = useState<LiveDetails | null>(null); // For PK opponent
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isBlockedByHost, setIsBlockedByHost] = useState(false);
    const lastGiftIdRef = useRef<number | null>(null);
    const [headerViewers, setHeaderViewers] = useState<Record<number, Viewer[]>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [triggeredGift, setTriggeredGift] = useState<ChatMessage | null>(null);
    const [rouletteWin, setRouletteWin] = useState<ChatMessage | null>(null);
    const [rouletteSettings, setRouletteSettings] = useState<RouletteSettings | null>(null);
    const [raffleState, setRaffleState] = useState<RaffleState | null>(null);
    const [isJoiningRaffle, setIsJoiningRaffle] = useState(false);
    
    // Modal states
    const [isGiftPanelOpen, setIsGiftPanelOpen] = useState(false);
    const [isArcoraToolModalOpen, setIsArcoraToolModalOpen] = useState(false);
    const [isSetPrivacyModalOpen, setIsSetPrivacyModalOpen] = useState(false);
    const [isMuteUserModalOpen, setIsMuteUserModalOpen] = useState(false);
    const [kickedState, setKickedState] = useState<'kicked' | 'denied' | null>(null);
    const [isEndStreamModalOpen, setIsEndStreamModalOpen] = useState(false);
    const [isPkInviteModalOpen, setIsPkInviteModalOpen] = useState(false);
    const [isInviteToPrivateLiveModalOpen, setIsInviteToPrivateLiveModalOpen] = useState(false);
    const [isPkStartDisputeModalOpen, setIsPkStartDisputeModalOpen] = useState(false);
    const [showPkClashAnimation, setShowPkClashAnimation] = useState(false);
    const [isMutedNotification, setIsMutedNotification] = useState<'muted' | 'unmuted' | null>(null);
    const [pkRankingToShow, setPkRankingToShow] = useState<{ streamer: PkBattleStreamer, supporters: TabelaRankingApoiadores[] } | null>(null);
    const [viewingOnlineUsersForStreamId, setViewingOnlineUsersForStreamId] = useState<number | null>(null);
    const [isHourlyRankingModalOpen, setIsHourlyRankingModalOpen] = useState(false);
    const [isRankingListScreenOpen, setIsRankingListScreenOpen] = useState(false);
    const [targetStreamerForPk, setTargetStreamerForPk] = useState<User | null>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [purchaseConfirmationPackage, setPurchaseConfirmationPackage] = useState<DiamondPackage | null>(null);
    const [isRouletteOpen, setIsRouletteOpen] = useState(false);
    const [isQuickChatModalOpen, setIsQuickChatModalOpen] = useState(false);
    const [isPrivateChatListOpen, setIsPrivateChatListOpen] = useState(false);
    const [isPrizeWheelOpen, setIsPrizeWheelOpen] = useState(false);
    const [isRaffleSetupOpen, setIsRaffleSetupOpen] = useState(false);
    
    // State for PK invitations sent by the current user
    const [invitation, setInvitation] = useState<ConvitePK | null>(null);
    const [invitedOpponent, setInvitedOpponent] = useState<User | null>(null);

    const streamer1Id = isPkBattle ? (initialStreamOrBattle as PkBattle).streamer1.userId : (initialStreamOrBattle as Stream).userId;
    const streamer2Id = isPkBattle ? (initialStreamOrBattle as PkBattle).streamer2.userId : null;
    const isCurrentUserHost = user.id === streamer1Id || user.id === streamer2Id;
    const streamId2 = isPkBattle ? (initialStreamOrBattle as PkBattle).streamer2.streamId : null;
    const heartsRef = useRef<FloatingHeartsRef>(null);

    // --- NEW LOGIC FOR STREAM IDs ---
    const primaryStreamId = useMemo(() => {
        if (!isPkBattle) {
            return (initialStreamOrBattle as Stream).id;
        }
        return (initialStreamOrBattle as PkBattle).streamer1.streamId;
    }, [initialStreamOrBattle, isPkBattle]);

    const hostStreamId = useMemo(() => {
        if (!isCurrentUserHost) return null;
        if (!isPkBattle) return (initialStreamOrBattle as Stream).id;
        
        const battle = initialStreamOrBattle as PkBattle;
        if (user.id === battle.streamer1.userId) return battle.streamer1.streamId;
        if (user.id === battle.streamer2.userId) return battle.streamer2.streamId;
        return null;
    }, [isCurrentUserHost, isPkBattle, initialStreamOrBattle, user.id]);
    // --- END NEW LOGIC ---

    // Host camera/mic state
    const videoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null); // Para vídeos remotos do LiveKit
    const remoteVideoRef2 = useRef<HTMLVideoElement>(null); // Para PK battles
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [cameraStatus, setCameraStatus] = useState<CameraStatus>(isCurrentUserHost ? 'loading' : 'idle');
    const [facingMode, setFacingMode] = useState<FacingMode>('user');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

    useEffect(() => {
        if (!isCurrentUserHost) {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                setMediaStream(null);
                setCameraStatus('idle');
            }
            return;
        }

        let isMounted = true;
        let stream: MediaStream | null = null;
        
        // Função para conectar à sala LiveKit se for host
        const iniciarLiveKit = async () => {
            try {
                console.log('🎥 Conectando como host ao LiveKit...');
                const roomName = `stream-${primaryStreamId}`;
                const participantName = user.name || `Host-${user.id}`;
                
                await conectarLiveKit(roomName, participantName);
                console.log('✅ Conectado ao LiveKit como host!');
                
                // Habilitar câmera após conectar
                setTimeout(async () => {
                    try {
                        await habilitarCamera();
                        console.log('📹 Câmera habilitada no LiveKit');
                    } catch (error) {
                        console.error('❌ Erro ao habilitar câmera:', error);
                    }
                }, 1000);
                
            } catch (error) {
                console.error('❌ Erro ao conectar LiveKit:', error);
            }
        };
        
        const requestCamera = async () => {
            if (!window.isSecureContext) {
                setCameraStatus('insecure');
                return;
            }
            setCameraStatus('loading');
            try {
                const constraints = {
                    audio: true,
                    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
                };
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (isMounted) {
                    setMediaStream(stream);
                    setCameraStatus('success');
                    
                    // Iniciar LiveKit após obter stream local
                    iniciarLiveKit();
                } else {
                    stream.getTracks().forEach(track => track.stop());
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Erro de acesso à câmera:", err);
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
            
            // Desconectar do LiveKit ao desmontar
            if (isLiveKitConnected) {
                desconectarLiveKit();
            }
        };
      }, [isCurrentUserHost, facingMode, primaryStreamId, user.name, user.id, conectarLiveKit, habilitarCamera, isLiveKitConnected, desconectarLiveKit, mediaStream]);

      useEffect(() => {
        const videoElement = videoRef.current;
        if (isCurrentUserHost && videoElement && mediaStream) {
            if (videoElement.srcObject !== mediaStream) {
                videoElement.srcObject = mediaStream;
            }
            videoElement.play().catch(e => console.error("Erro no play do vídeo:", e));
        }
      }, [isCurrentUserHost, mediaStream]);

      // Conectar espectadores ao LiveKit
      useEffect(() => {
        if (!isCurrentUserHost && !isLiveKitConnected) {
            const conectarComoEspectador = async () => {
                try {
                    console.log('👥 Conectando como espectador ao LiveKit...');
                    const roomName = `stream-${primaryStreamId}`;
                    const participantName = user.name || `Viewer-${user.id}`;
                    
                    await conectarLiveKit(roomName, participantName);
                    console.log('✅ Conectado ao LiveKit como espectador!');
                    
                } catch (error) {
                    console.error('❌ Erro ao conectar como espectador:', error);
                }
            };
            
            // Delay para garantir que o host já iniciou a sala
            setTimeout(conectarComoEspectador, 2000);
        }
        
        return () => {
            if (!isCurrentUserHost && isLiveKitConnected) {
                desconectarLiveKit();
            }
        };
      }, [isCurrentUserHost, isLiveKitConnected, primaryStreamId, user.name, user.id, conectarLiveKit, desconectarLiveKit]);

      // Gerenciar tracks de vídeo do LiveKit
      useEffect(() => {
        const handleLiveKitTracks = (event: CustomEvent) => {
            const { track, participant } = event.detail;
            
            if (track.kind === 'video') {
                console.log(`🎥 Nova track de vídeo recebida de: ${participant.name}`);
                
                // Para PK battles, usar referências separadas
                if (isPkBattle) {
                    if (participant.identity.includes('streamer1') || liveKitParticipants.indexOf(participant) === 0) {
                        if (remoteVideoRef.current && track.track) {
                            track.track.attach(remoteVideoRef.current);
                        }
                    } else {
                        if (remoteVideoRef2.current && track.track) {
                            track.track.attach(remoteVideoRef2.current);
                        }
                    }
                } else {
                    // Stream único: usar primeira referência
                    if (remoteVideoRef.current && track.track) {
                        track.track.attach(remoteVideoRef.current);
                    }
                }
            }
        };
        
        const handleLiveKitTrackUnsubscribed = (event: CustomEvent) => {
            const { track } = event.detail;
            if (track.kind === 'video') {
                console.log('📄 Track de vídeo removida');
                // As tracks são automaticamente removidas quando desanexadas
            }
        };
        
        // Adicionar listeners dos eventos LiveKit
        window.addEventListener('livekit-track-subscribed', handleLiveKitTracks as EventListener);
        window.addEventListener('livekit-track-unsubscribed', handleLiveKitTrackUnsubscribed as EventListener);
        
        return () => {
            window.removeEventListener('livekit-track-subscribed', handleLiveKitTracks as EventListener);
            window.removeEventListener('livekit-track-unsubscribed', handleLiveKitTrackUnsubscribed as EventListener);
        };
      }, [isPkBattle, liveKitParticipants]);

    useEffect(() => {
        // Private Stream Access Control
        if (!isPkBattle && !isCurrentUserHost) {
            const stream = initialStreamOrBattle as Stream;
            if (stream.isPrivate && !(user.paid_stream_ids || []).includes(stream.id)) {
                setKickedState('denied');
                return; // Don't fetch data if access is denied
            }
        }

        const fetchData = async () => {
            try {
                const [details1, messages, viewersData, rouletteData] = await Promise.all([
                    liveStreamService.getLiveStreamDetails(primaryStreamId),
                    liveStreamService.getChatMessages(primaryStreamId),
                    liveStreamService.getViewers(primaryStreamId),
                    liveStreamService.getRouletteSettings(primaryStreamId).catch(() => null)
                ]);

                setLiveDetails(details1);
                setChatMessages(messages);
                setHeaderViewers({ [primaryStreamId]: viewersData.slice(0, 3) });
                setRouletteSettings(rouletteData);
                setRaffleState(details1.raffle_state || null);


                if (isPkBattle && streamer2Id && streamId2) {
                    const details2 = await liveStreamService.getLiveStreamDetails(streamId2);
                    setLiveDetails2(details2);
                }
            } catch (error) {
                console.error("Failed to fetch initial stream data:", error);
                onExit();
            }
        };
        fetchData();
        
        const chatListener: liveStreamService.ChatMessageListener = (liveId, messages) => {
            if (liveId === primaryStreamId) {
                messages.forEach(msg => {
                    if(msg.type === 'gift') {
                        setTriggeredGift(null);
                        setTimeout(() => setTriggeredGift(msg), 10);
                    }
                    if(msg.type === 'gift_roulette_win') {
                        setRouletteWin(msg);
                    }
                });
                setChatMessages(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMessages = messages.filter(m => !existingIds.has(m.id));
                    if (newMessages.length === 0) return prev;
                    return [...prev, ...newMessages];
                });
            }
        };
        liveStreamService.addChatMessageListener(chatListener);
        
        const liveUpdateListener = (updatedLiveId: number) => {
            if (updatedLiveId === primaryStreamId) {
                liveStreamService.getLiveStreamDetails(primaryStreamId).then(details => {
                    setLiveDetails(details);
                    setRaffleState(details.raffle_state || null);
                });
            }
            if (streamId2 && updatedLiveId === streamId2) {
                liveStreamService.getLiveStreamDetails(streamId2).then(setLiveDetails2);
            }
        };
        liveStreamService.addLiveUpdateListener(liveUpdateListener);

        const kickedListener: UserKickedListener = (update) => {
            if ((update.liveId === primaryStreamId || (streamId2 && update.liveId === streamId2)) && update.kickedUserId === user.id) {
                setKickedState('kicked');
            }
        };
        liveStreamService.addUserKickedListener(kickedListener);

        return () => {
            liveStreamService.removeChatMessageListener(chatListener);
            liveStreamService.removeLiveUpdateListener(liveUpdateListener);
            liveStreamService.removeUserKickedListener(kickedListener);
        };
    }, [primaryStreamId, streamId2, streamer2Id, isPkBattle, onExit, user, isCurrentUserHost]);

    useEffect(() => {
      if (!isPkBattle || !pkBattleId) return;

      const fetchPkState = async () => {
        try {
          const pkState = await liveStreamService.getActivePkBattle(pkBattleId);
          setActivePkBattle(pkState);
          if (pkState.status !== 'ativa') {
             // Handle battle end here if needed, e.g., show results
          }
        } catch (e) {
          console.error("Failed to fetch PK state:", e);
        }
      };

      fetchPkState(); // Initial fetch
      const interval = setInterval(fetchPkState, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }, [isPkBattle, pkBattleId]);
    
    const handleSendGift = useCallback(async (giftId: number, quantity: number, receiverId?: number) => {
        try {
            const response = await liveStreamService.sendGift(primaryStreamId, user.id, giftId, quantity, receiverId);
            if (response.success && response.updatedUser) {
                onUpdateUser(response.updatedUser);
            } else {
                if (response.message.includes('insuficientes')) {
                    setIsGiftPanelOpen(false);
                    setIsPurchaseModalOpen(true);
                } else {
                    alert(response.message);
                }
            }
        } catch (error) {
            console.error("Failed to send gift:", error);
            alert("Ocorreu um erro ao enviar o presente.");
        }
    }, [primaryStreamId, user.id, onUpdateUser]);

    const handleSendMessage = useCallback(async (message: string, imageUrl?: string) => {
        setIsUploading(true);
        try {
            await liveStreamService.sendChatMessage(primaryStreamId, user.id, message, imageUrl);
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsUploading(false);
        }
    }, [primaryStreamId, user.id]);

    const handleSendPkInvite = async (opponent: User) => {
        setIsPkInviteModalOpen(false);
        setIsPkStartDisputeModalOpen(false);
        setIsArcoraToolModalOpen(false); // Also close the tool modal
        try {
            const newInvite = await liveStreamService.createPkInvitation(user.id, opponent.id, true); // true for Co-Host
            setInvitedOpponent(opponent);
            setInvitation(newInvite);
        } catch (error) {
            console.error("Failed to create PK invitation:", error);
            alert("Não foi possível enviar o convite de PK.");
        }
    };

    const handlePkDisputeClick = async () => {
        if (isCurrentUserHost) {
            // Host opens the modal to select from their friends
            setTargetStreamerForPk(null);
            setIsPkStartDisputeModalOpen(true);
        } else {
            // Viewer opens the modal to challenge the current streamer
            try {
                const streamerProfile = await authService.getUserProfile(streamer1Id);
                setTargetStreamerForPk(streamerProfile);
                setIsPkStartDisputeModalOpen(true);
            } catch (e) {
                console.error("Failed to get streamer profile for PK dispute", e);
                alert("Não foi possível carregar o perfil do streamer para a batalha.");
            }
        }
    };

    const handleCoinsClick = (streamerId: number) => {
        if (!activePkBattle) {
            setIsHourlyRankingModalOpen(true);
            return;
        };
    
        if (streamerId === activePkBattle.streamer_A_id) {
            setPkRankingToShow({
                streamer: (initialStreamOrBattle as PkBattle).streamer1,
                supporters: activePkBattle.top_supporters_A || [],
            });
        } else if (streamerId === activePkBattle.streamer_B_id) {
            setPkRankingToShow({
                streamer: (initialStreamOrBattle as PkBattle).streamer2,
                supporters: activePkBattle.top_supporters_B || [],
            });
        }
    };

    const handleUpdatePrivacy = async (privacyData: { isPrivate: boolean, entryFee?: number }) => {
        if (!hostStreamId) return;
        try {
            await liveStreamService.updateStreamPrivacy(hostStreamId, privacyData.isPrivate, privacyData.entryFee);
            setIsSetPrivacyModalOpen(false);
            // The liveUpdateManager will trigger a re-fetch of liveDetails automatically.
        } catch (error) {
            console.error("Failed to update privacy settings:", error);
            alert("Falha ao atualizar as configurações de privacidade.");
        }
    };

    const handleStartRaffle = async (settings: { prize: string; winnersCount: number; durationMinutes: number }) => {
        if (!hostStreamId) return;
        try {
            const newRaffleState = await liveStreamService.startRaffle(hostStreamId, settings);
            setRaffleState(newRaffleState);
            setIsRaffleSetupOpen(false);
        } catch (error) {
            alert('Falha ao iniciar o sorteio.');
            console.error(error);
        }
    };

    const handleJoinRaffle = async () => {
        setIsJoiningRaffle(true);
        try {
            await liveStreamService.joinRaffle(primaryStreamId, user.id);
            // The liveUpdate listener will refresh the raffle state with the new participant
        } catch (error) {
            alert('Falha ao participar do sorteio.');
            console.error(error);
        } finally {
            setIsJoiningRaffle(false);
        }
    };

    const isRaffleActive = raffleState?.isActive === true;
    const raffleWinners = (raffleState?.isActive === false && raffleState.winners && raffleState.winners.length > 0) ? raffleState.winners : null;
    const isRaffleParticipant = raffleState?.participants.includes(user.id) ?? false;


    if (isPkBattle && activePkBattle) {
        const s1 = (initialStreamOrBattle as PkBattle).streamer1;
        const s2 = (initialStreamOrBattle as PkBattle).streamer2;

        return (
            <div className="h-full w-full bg-black text-white flex flex-col font-sans">
                
                {/* Top part: Video streams */}
                <div className="h-[65%] relative flex">
                    {/* Streamer 1 Video - LiveKit Integration */}
                    <div className="relative w-1/2 h-full bg-gray-900 flex items-center justify-center">
                        {isLiveKitConnected && liveKitParticipants.length > 0 ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center">
                                <p className="text-gray-500">Stream de {s1.name}</p>
                                {liveKitError && (
                                    <p className="text-red-400 text-sm mt-2">Erro LiveKit: {liveKitError}</p>
                                )}
                                {!isLiveKitConnected && (
                                    <p className="text-yellow-400 text-sm mt-2">Conectando ao LiveKit...</p>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Streamer 2 Video - LiveKit Integration */}
                    <div className="relative w-1/2 h-full bg-gray-800 flex items-center justify-center">
                        {isLiveKitConnected && liveKitParticipants.length > 1 ? (
                            <video
                                ref={remoteVideoRef2}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center">
                                <p className="text-gray-500">Stream de {s2.name}</p>
                                {!isLiveKitConnected && (
                                    <p className="text-yellow-400 text-sm mt-2">Aguardando conexão...</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Overlays for the video part */}
                    <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
                        <header className="flex justify-between p-4 shrink-0 pointer-events-auto">
                            {liveDetails && (
                                <LiveStreamHeader
                                    variant="pk-left"
                                    avatarUrl={s1.avatarUrl}
                                    name={s1.name}
                                    followers={(liveDetails.streamerFollowers || 0).toLocaleString()}
                                    viewerCount={(liveDetails.viewerCount || 0).toLocaleString()}
                                    coins={(activePkBattle.pontuacao_A || 0).toLocaleString()}
                                    likes={(liveDetails.likeCount || 0).toLocaleString()}
                                    onUserClick={() => onNavigate('edit', { userId: s1.userId })}
                                    isCurrentUserHost={user.id === s1.userId}
                                    isFollowing={user.following.includes(s1.userId)}
                                    onFollowToggle={() => onFollowToggle(s1.userId)}
                                    streamerIsAvatarProtected={liveDetails.streamerIsAvatarProtected}
                                    countryCode={s1.countryCode}
                                    onCoinsClick={() => handleCoinsClick(s1.userId)}
                                    onViewersClick={() => setViewingOnlineUsersForStreamId(s1.streamId)}
                                />
                            )}
                        {liveDetails2 && (
                                <LiveStreamHeader
                                    variant="pk-right"
                                    avatarUrl={s2.avatarUrl}
                                    name={s2.name}
                                    followers={(liveDetails2.streamerFollowers || 0).toLocaleString()}
                                    viewerCount={(liveDetails2.viewerCount || 0).toLocaleString()}
                                    coins={(activePkBattle.pontuacao_B || 0).toLocaleString()}
                                    likes={(liveDetails2.likeCount || 0).toLocaleString()}
                                    onUserClick={() => onNavigate('edit', { userId: s2.userId })}
                                    onExitClick={onExit}
                                    isCurrentUserHost={user.id === s2.userId}
                                    isFollowing={user.following.includes(s2.userId)}
                                    onFollowToggle={() => onFollowToggle(s2.userId)}
                                    streamerIsAvatarProtected={liveDetails2.streamerIsAvatarProtected}
                                    countryCode={s2.countryCode}
                                    onCoinsClick={() => handleCoinsClick(s2.userId)}
                                    onViewersClick={() => streamId2 && setViewingOnlineUsersForStreamId(streamId2)}
                                />
                        )}
                        </header>
                        
                        <div className="pointer-events-auto -mt-2">
                            <PkBattleOverlay
                                battle={activePkBattle}
                                streamer1Multiplier={s1.winMultiplier}
                                streamer2Multiplier={s2.winMultiplier}
                            />
                        </div>
                        
                        <div className="flex-grow" /> {/* Spacer */}

                    </div>
                </div>

                {/* Bottom part: Chat */}
                <div className="h-[35%] flex flex-col bg-black border-t border-white/10 relative">
                    <div className="absolute -top-5 left-0 right-0 px-4 flex justify-between items-start pointer-events-none">
                        <div className="flex items-center gap-2 pointer-events-auto">
                            {activePkBattle.top_supporters_A.slice(0, 3).map(supporter => (
                                <PkTopSupporter key={supporter.apoiador_id} supporter={supporter} onUserClick={() => onNavigate('edit', { userId: supporter.apoiador_id })} />
                            ))}
                        </div>
                        <div className="flex items-center gap-2 pointer-events-auto">
                            {activePkBattle.top_supporters_B.slice(0, 3).map(supporter => (
                                <PkTopSupporter key={supporter.apoiador_id} supporter={supporter} onUserClick={() => onNavigate('edit', { userId: supporter.apoiador_id })} />
                            ))}
                        </div>
                    </div>
                    <main className="flex-grow flex flex-col justify-end overflow-hidden pt-2 pr-2 pb-2 transition-all duration-300 chat-fade-out-top pl-2">
                        <ChatArea messages={chatMessages} onUserClick={onNavigateToChat} maxHeightClass="max-h-full" isPkMode />
                    </main>
                    <footer className="shrink-0 flex items-center gap-2 p-2 pt-0">
                        <ChatInput onSendMessage={handleSendMessage} isUploading={isUploading} />
                         {isCurrentUserHost ? (
                            <>
                                <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                                    <GiftBoxIcon className="w-7 h-7"/>
                                </button>
                                <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                                    <MoreToolsIcon className="w-7 h-7"/>
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                                <GiftBoxIcon className="w-7 h-7"/>
                            </button>
                        )}
                    </footer>
                </div>
                
                {isGiftPanelOpen && (
                    <GiftPanel
                        user={user}
                        liveId={primaryStreamId}
                        streamerId={streamer1Id}
                        isHost={isCurrentUserHost}
                        onClose={() => setIsGiftPanelOpen(false)}
                        onSendGift={handleSendGift}
                        onRechargeClick={() => {
                            setIsGiftPanelOpen(false);
                            setIsPurchaseModalOpen(true);
                        }}
                        pkBattleStreamers={{ streamer1: s1, streamer2: s2 }}
                        isPkMode={true}
                    />
                )}

                {pkRankingToShow && (
                    <PkRankingModal
                        streamer={pkRankingToShow.streamer}
                        supporters={pkRankingToShow.supporters}
                        onClose={() => setPkRankingToShow(null)}
                        onUserClick={(userId) => {
                            setPkRankingToShow(null);
                            onNavigate('edit', { userId });
                        }}
                    />
                )}
                {viewingOnlineUsersForStreamId && (
                    <OnlineUsersModal
                        liveId={viewingOnlineUsersForStreamId}
                        onClose={() => setViewingOnlineUsersForStreamId(null)}
                        onUserClick={(userId) => onNavigate('edit', { userId })}
                    />
                )}
                 {isArcoraToolModalOpen && (
                    <ArcoraToolModal
                        onClose={() => setIsArcoraToolModalOpen(false)}
                        onOpenMuteModal={() => setIsMuteUserModalOpen(true)}
                        onOpenSoundEffectModal={() => {}}
                        onSwitchCamera={() => {}}
                        cameraFacingMode={facingMode}
                        onToggleVoice={() => {}}
                        isVoiceEnabled={isVoiceEnabled}
                        onOpenPrivateChat={() => setIsPrivateChatListOpen(true)}
                        isPrivateStream={liveDetails?.isPrivate ?? false}
                        onOpenPkStartModal={handlePkDisputeClick}
                        isPkBattleActive={isPkBattle}
                        onOpenPkInviteModal={() => setIsPkInviteModalOpen(true)}
                        onOpenPrivacyModal={() => setIsSetPrivacyModalOpen(true)}
                        onOpenRouletteSetup={() => {
                            setIsArcoraToolModalOpen(false);
                            setIsRouletteOpen(true);
                        }}
                        onOpenPrizeWheel={() => {
                            setIsArcoraToolModalOpen(false);
                            setIsPrizeWheelOpen(true);
                        }}
                        onOpenRaffleSetup={() => {
                            setIsArcoraToolModalOpen(false);
                            setIsRaffleSetupOpen(true);
                        }}
                    />
                )}
                 {isPkInviteModalOpen && (
                    <PkInviteModal
                        user={user}
                        onClose={() => setIsPkInviteModalOpen(false)}
                        onEnterFriendLive={(friend) => console.log('Enter friend live', friend)}
                        onSendInvite={handleSendPkInvite}
                    />
                )}

                {invitation && invitedOpponent && (
                    <PkInvitationModal
                        currentUser={user}
                        opponent={invitedOpponent}
                        invitation={invitation}
                        onClose={() => {
                            liveStreamService.cancelPkInvitation(invitation.id).catch(err => console.error("Failed to cancel invitation", err));
                            setInvitation(null);
                            setInvitedOpponent(null);
                        }}
                        onInviteAccepted={(battle) => {
                            setInvitation(null);
                            setInvitedOpponent(null);
                            onViewStream(battle);
                        }}
                    />
                )}
            </div>
        );
    }
    
    // Default Single Streamer View
    return (
      <>
        <div className="h-full w-full bg-black text-white flex flex-col font-sans relative">
            {/* Video Player com LiveKit */}
            <div className="absolute inset-0 z-0">
                {isCurrentUserHost ? (
                    <>
                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} />
                        <CameraStatusOverlay 
                            status={cameraStatus} 
                            liveKitConnected={isLiveKitConnected}
                            liveKitError={liveKitError || undefined}
                        />
                        {/* Overlay com informações do LiveKit para host */}
                        {isLiveKitConnected && (
                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-xs text-white">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>LiveKit Ativo ({liveKitParticipants.length + 1} participantes)</span>
                                </div>
                                {isLiveKitCameraEnabled && (
                                    <div className="text-green-400 text-xs mt-1">✓ Câmera transmitindo</div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    // Espectador: mostrar vídeo remoto do LiveKit
                    <>
                        {isLiveKitConnected && liveKitParticipants.length > 0 ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-gray-500 text-lg mb-2">Conectando ao stream...</p>
                                    {liveKitError && (
                                        <p className="text-red-400 text-sm">Erro: {liveKitError}</p>
                                    )}
                                    {!isLiveKitConnected && (
                                        <p className="text-yellow-400 text-sm">Aguardando LiveKit...</p>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Overlay com informações para espectadores */}
                        {isLiveKitConnected && (
                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-xs text-white">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span>Assistindo ao vivo</span>
                                </div>
                                <div className="text-blue-400 text-xs mt-1">{liveKitParticipants.length + 1} espectadores</div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* UI Overlays on top */}
            <div className="relative z-10 flex flex-col justify-between h-full pointer-events-none">
                <header className="shrink-0 p-4 pointer-events-auto">
                   {liveDetails && (
                     <LiveStreamHeader
                        variant="single"
                        avatarUrl={liveDetails?.streamerAvatarUrl || ''}
                        name={liveDetails?.streamerName || '...'}
                        followers={(liveDetails?.streamerFollowers || 0).toLocaleString()}
                        viewerCount={(liveDetails?.viewerCount || 0).toLocaleString()}
                        headerViewers={headerViewers[primaryStreamId]}
                        coins={(liveDetails?.receivedGiftsValue || 0).toLocaleString()}
                        likes={(liveDetails?.likeCount || 0).toLocaleString()}
                        onUserClick={() => onNavigate('edit', { userId: streamer1Id })}
                        onExitClick={isCurrentUserHost ? () => setIsEndStreamModalOpen(true) : onExit}
                        isCurrentUserHost={isCurrentUserHost}
                        isFollowing={user.following.includes(streamer1Id)}
                        onFollowToggle={() => onFollowToggle(streamer1Id)}
                        streamerIsAvatarProtected={liveDetails?.streamerIsAvatarProtected}
                        countryCode={liveDetails?.countryCode}
                        onCoinsClick={() => setIsHourlyRankingModalOpen(true)}
                        onViewersClick={() => setViewingOnlineUsersForStreamId(primaryStreamId)}
                    />
                   )}
                </header>

                 <main className="flex-grow flex flex-col justify-end overflow-hidden">
                    {liveDetails?.title && <LiveInfoModal title={liveDetails.title} meta={liveDetails.meta || ''} />}
                    <div className="flex-grow pointer-events-none"></div> {/* Spacer */}
                    <div className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2 p-2 pt-0 transition-all duration-300 chat-fade-out-top">
                        <ChatArea messages={chatMessages} onUserClick={(userId) => onNavigate('edit', { userId })} />
                    </div>
                </main>

                <footer className="shrink-0 flex items-center gap-2 p-2 pointer-events-auto">
                    {isCurrentUserHost ? (
                        <>
                            <ChatInput onSendMessage={handleSendMessage} isUploading={isUploading} showSendButton={true} />
                            <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                                <GiftBoxIcon className="w-7 h-7"/>
                            </button>
                            <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                                <MoreToolsIcon className="w-7 h-7"/>
                            </button>
                        </>
                    ) : (
                        <>
                            <ChatInput onSendMessage={handleSendMessage} isUploading={isUploading} disabled={isBlockedByHost} />
                            <button onClick={() => heartsRef.current?.addHeart()} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                                <HeartSolidIcon className="w-6 h-6 text-red-500" />
                            </button>
                            <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                                <GiftBoxIcon className="w-7 h-7"/>
                            </button>
                        </>
                    )}
                </footer>
            </div>
             {/* Global Animations & Modals */}
             <FloatingHearts ref={heartsRef} />
             <GiftDisplayAnimation triggeredGift={triggeredGift} />
             {rouletteSettings?.isActive && <RouletteWidget user={user} liveId={primaryStreamId} initialSettings={rouletteSettings} onUpdateUser={onUpdateUser} onRequirePurchase={() => setIsPurchaseModalOpen(true)} />}
             {!isCurrentUserHost && <PrizeWheelWidget onClick={() => setIsPrizeWheelOpen(true)} />}
             {isRaffleActive && raffleState && <RaffleWidget raffleState={raffleState} onJoin={handleJoinRaffle} isParticipant={isRaffleParticipant} isJoining={isJoiningRaffle} />}
        </div>

        {isGiftPanelOpen && (
            <GiftPanel
                user={user}
                liveId={primaryStreamId}
                streamerId={streamer1Id}
                isHost={isCurrentUserHost}
                onClose={() => setIsGiftPanelOpen(false)}
                onSendGift={handleSendGift}
                onRechargeClick={() => {
                    setIsGiftPanelOpen(false);
                    setIsPurchaseModalOpen(true);
                }}
            />
        )}
        {isQuickChatModalOpen && hostStreamId && (
            <QuickChatModal
                onClose={() => setIsQuickChatModalOpen(false)}
                onSendMessage={(message) => {
                    handleSendMessage(message);
                    setIsQuickChatModalOpen(false);
                }}
            />
        )}
        {isPrivateChatListOpen && (
            <PrivateChatListModal
                currentUser={user}
                onClose={() => setIsPrivateChatListOpen(false)}
                onOpenConversation={(conversationId) => {
                    // This will exit the stream and navigate to the chat
                    onNavigate('chat', { conversationId });
                }}
            />
        )}
        {isArcoraToolModalOpen && hostStreamId && (
            <ArcoraToolModal
                onClose={() => setIsArcoraToolModalOpen(false)}
                onOpenMuteModal={() => setIsMuteUserModalOpen(true)}
                onOpenSoundEffectModal={() => alert("Sound effects not implemented for single stream view yet.")}
                onSwitchCamera={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                cameraFacingMode={facingMode}
                onToggleVoice={() => setIsVoiceEnabled(v => !v)}
                isVoiceEnabled={isVoiceEnabled}
                onOpenPrivateChat={() => setIsPrivateChatListOpen(true)}
                isPrivateStream={liveDetails?.isPrivate ?? false}
                onOpenPkStartModal={handlePkDisputeClick}
                isPkBattleActive={isPkBattle}
                onOpenPkInviteModal={() => setIsPkInviteModalOpen(true)}
                onOpenPrivacyModal={() => setIsSetPrivacyModalOpen(true)}
                onOpenRouletteSetup={() => {
                    setIsArcoraToolModalOpen(false);
                    setIsRouletteOpen(true);
                }}
                onOpenPrizeWheel={() => {
                    setIsArcoraToolModalOpen(false);
                    setIsPrizeWheelOpen(true);
                }}
                onOpenRaffleSetup={() => {
                    setIsArcoraToolModalOpen(false);
                    setIsRaffleSetupOpen(true);
                }}
            />
        )}
        {isPrizeWheelOpen && (
            <PrizeWheelModal 
                user={user}
                onUpdateUser={onUpdateUser}
                onClose={() => setIsPrizeWheelOpen(false)}
                onRechargeClick={() => {
                    setIsPrizeWheelOpen(false);
                    setIsPurchaseModalOpen(true);
                }}
                isHost={isCurrentUserHost}
            />
        )}
        {isSetPrivacyModalOpen && hostStreamId && (
            <SetPrivacyModal
                isOpen={isSetPrivacyModalOpen}
                onClose={() => setIsSetPrivacyModalOpen(false)}
                onSave={handleUpdatePrivacy}
                initialIsPrivate={liveDetails?.isPrivate ?? false}
                initialEntryFee={liveDetails?.entryFee ?? null}
            />
        )}
        {isRouletteOpen && hostStreamId && (
            <RouletteSetupModal
                liveId={hostStreamId}
                initialSettings={rouletteSettings}
                onClose={() => setIsRouletteOpen(false)}
                onUpdateSettings={(newSettings) => {
                    setRouletteSettings(newSettings);
                    setIsRouletteOpen(false);
                }}
            />
        )}
        {isRaffleSetupOpen && isCurrentUserHost && hostStreamId && (
          <RaffleSetupModal
            isOpen={isRaffleSetupOpen}
            onClose={() => setIsRaffleSetupOpen(false)}
            onStartRaffle={handleStartRaffle}
          />
        )}
        {raffleWinners && raffleState && (
            <RaffleWinnerModal
                winners={raffleWinners}
                prize={raffleState.prize}
                onClose={() => setRaffleState(null)}
            />
        )}
        {isMuteUserModalOpen && hostStreamId && (
            <MuteUserModal
                liveId={hostStreamId}
                mutedUsers={{}} // Simplified for now
                onMuteUser={(userId, mute) => liveStreamService.muteUser(hostStreamId, userId, mute)}
                onKickUser={(userId) => liveStreamService.kickUser(hostStreamId, userId)}
                onClose={() => setIsMuteUserModalOpen(false)}
            />
        )}
        {kickedState && <KickedFromStreamModal onExit={onExit} isJoinAttempt={kickedState === 'denied'} />}
        {isEndStreamModalOpen && hostStreamId && (
            <EndStreamConfirmationModal 
                onConfirm={() => onStopStream(user.id, hostStreamId)} 
                onCancel={() => setIsEndStreamModalOpen(false)} 
            />
        )}
        {isPkInviteModalOpen && (
            <PkInviteModal
                user={user}
                onClose={() => setIsPkInviteModalOpen(false)}
                onEnterFriendLive={(friend) => console.log('Enter friend live', friend)}
                onSendInvite={handleSendPkInvite}
            />
        )}
        {invitation && invitedOpponent && (
            <PkInvitationModal
                currentUser={user}
                opponent={invitedOpponent}
                invitation={invitation}
                onClose={() => {
                    liveStreamService.cancelPkInvitation(invitation.id).catch(err => console.error("Failed to cancel invitation", err));
                    setInvitation(null);
                    setInvitedOpponent(null);
                }}
                onInviteAccepted={(battle) => {
                    setInvitation(null);
                    setInvitedOpponent(null);
                    onViewStream(battle);
                }}
            />
        )}
        {isInviteToPrivateLiveModalOpen && hostStreamId && (
            <InviteToPrivateLiveModal
                streamerId={user.id}
                liveId={hostStreamId}
                onClose={() => setIsInviteToPrivateLiveModalOpen(false)}
                onInviteSent={(invitee) => {
                    setChatMessages(prev => [...prev, {
                        id: Date.now(),
                        type: 'announcement',
                        username: 'System',
                        userId: 0,
                        message: `${user.nickname} invited ${invitee.nickname} to watch.`,
                        timestamp: new Date().toISOString()
                    }]);
                }}
            />
        )}
        {isPkStartDisputeModalOpen && (
            <PkStartDisputeModal
                currentUser={user}
                onClose={() => setIsPkStartDisputeModalOpen(false)}
                onProposeDispute={handleSendPkInvite}
                targetStreamer={targetStreamerForPk}
            />
        )}
        {showPkClashAnimation && <PkClashAnimation onAnimationEnd={() => setShowPkClashAnimation(false)} />}
        {isMutedNotification && <MutedNotificationModal type={isMutedNotification} onClose={() => setIsMutedNotification(null)} />}
        {finalPkBattleState && <PkResultModal currentUser={user} battleData={finalPkBattleState} onClose={() => setFinalPkBattleState(null)} />}
        {pkRankingToShow && (
            <PkRankingModal
                streamer={pkRankingToShow.streamer}
                supporters={pkRankingToShow.supporters}
                onClose={() => setPkRankingToShow(null)}
                onUserClick={(userId) => {
                    setPkRankingToShow(null);
                    onNavigate('edit', { userId });
                }}
            />
        )}
        {viewingOnlineUsersForStreamId && (
            <OnlineUsersModal
                liveId={viewingOnlineUsersForStreamId}
                onClose={() => setViewingOnlineUsersForStreamId(null)}
                onUserClick={(userId) => onNavigate('edit', { userId })}
            />
        )}
        {isHourlyRankingModalOpen && liveDetails && (
            <HourlyRankingModal 
                liveId={primaryStreamId}
                onClose={() => setIsHourlyRankingModalOpen(false)}
                onUserClick={(userId) => onNavigate('edit', { userId })}
                currentUser={user}
                onUpdateUser={onUpdateUser}
                streamer={{ id: streamer1Id, name: liveDetails.streamerName, avatarUrl: liveDetails.streamerAvatarUrl }}
                onNavigateToList={() => setIsRankingListScreenOpen(true)}
                onRequirePurchase={onRequirePurchase}
            />
        )}
        {isRankingListScreenOpen && (
            <RankingListScreen 
                liveId={primaryStreamId}
                currentUser={user}
                onExit={() => setIsRankingListScreenOpen(false)}
                onUserClick={(userId) => onNavigate('edit', { userId })}
            />
        )}
        {isPurchaseModalOpen && (
            <DiamondPurchaseScreen
                user={user}
                isOverlay
                onExit={() => setIsPurchaseModalOpen(false)}
                onConfirmPurchase={setPurchaseConfirmationPackage}
                onNavigate={onNavigate}
                onUpdateUser={onUpdateUser}
                onNavigateToSetup={() => {}}
                onWithdrawalComplete={() => {}}
                successMessage={null}
                clearSuccessMessage={() => {}}
                onPurchase={(updatedUser, order) => onUpdateUser(updatedUser)}
            />
        )}
        {purchaseConfirmationPackage && (
            <PurchaseConfirmationScreen
                user={user}
                selectedPackage={purchaseConfirmationPackage}
                onExit={() => setPurchaseConfirmationPackage(null)}
                onConfirm={(updatedUser, order) => {
                    onUpdateUser(updatedUser);
                    setPurchaseConfirmationPackage(null);
                }}
            />
        )}
        {rouletteWin && (
            <GiftRouletteAnimation winMessage={rouletteWin} onAnimationComplete={() => setRouletteWin(null)} />
        )}
      </>
    );
};

export default LiveStreamViewerScreen;