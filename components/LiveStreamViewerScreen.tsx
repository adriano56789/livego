import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
// FIX: Added missing import for UserProfileModal.
import UserProfileModal from './UserProfileModal';


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
import CrossIcon from './icons/CrossIcon';
import AudioVisualizer from './AudioVisualizer';
import CoinGIcon from './icons/CoinGIcon';
import HeartPinkIcon from './icons/HeartPinkIcon';


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
    const [kickedState, setKickedState] = useState<'kicked' | 'denied' | null>(null);
    const [isEndStreamModalOpen, setIsEndStreamModalOpen] = useState(false);
    const [isPkInviteModalOpen, setIsPkInviteModalOpen] = useState(false);
    const [isInviteToPrivateLiveModalOpen, setIsInviteToPrivateLiveModalOpen] = useState(false);
    const [isQuickChatModalOpen, setIsQuickChatModalOpen] = useState(false);
    const [isRankingListOpen, setIsRankingListOpen] = useState(false);
    const [isPrivateChatModalOpen, setIsPrivateChatModalOpen] = useState(false);
    const [isPkStartDisputeModalOpen, setIsPkStartDisputeModalOpen] = useState(false);
    const [showPkClashAnimation, setShowPkClashAnimation] = useState(false);
    const [pkInvitationToAccept, setPkInvitationToAccept] = useState<PkInvitation | null>(null);
    const [viewingProfileId, setViewingProfileId] = useState<number | null>(null);
    const [isMutedNotification, setIsMutedNotification] = useState<'muted' | 'unmuted' | null>(null);
    const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);
    const [isHourlyRankingModalOpen, setIsHourlyRankingModalOpen] = useState(false);
    
    // State for PK invitations sent by the current user
    const [invitation, setInvitation] = useState<ConvitePK | null>(null);
    const [invitedOpponent, setInvitedOpponent] = useState<User | null>(null);

    const streamerId = isPkBattle ? (initialStream as PkBattle).streamer1.userId : (initialStream as Stream).userId;
    const isCurrentUserHost = user.id === streamerId;
    const streamId = initialStream.id;

    // Host camera/mic state
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
    const [facingMode, setFacingMode] = useState<FacingMode>('user');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

    const isPrivateStream = useMemo(() => {
        if ('streamer1' in initialStream) {
            return false; // PK battles aren't considered private in this context for the tool modal
        }
        return (initialStream as Stream).isPrivate;
    }, [initialStream]);

    // Handlers
    const handleViewProfile = useCallback((userId: number) => {
        setViewingProfileId(userId);
    }, []);

    const handleOpenOnlineUsers = () => setIsOnlineUsersModalOpen(true);
    const handleOpenHourlyRanking = () => setIsHourlyRankingModalOpen(true);
    
    const handleSendMessage = useCallback(async (message: string, imageUrl?: string) => {
        if (!isCurrentUserHost && isBlockedByHost) {
            alert("Você está silenciado e não pode enviar mensagens.");
            return;
        }
        setIsUploading(true);
        try {
            await liveStreamService.sendChatMessage(streamId, user.id, message, imageUrl);
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsUploading(false);
        }
    }, [streamId, user.id, isCurrentUserHost, isBlockedByHost]);
    
    const handleSendGift = useCallback(async (giftId: number, quantity: number, receiverId?: number) => {
        setIsGiftPanelOpen(false);
        try {
            const response = await liveStreamService.sendGift(streamId, user.id, giftId, quantity, receiverId);
            if (response.success && response.updatedUser) {
                onUpdateUser(response.updatedUser);
            } else if (!response.success) {
                if (response.message.includes('insuficientes')) {
                    onRequirePurchase();
                } else {
                    alert(response.message);
                }
            }
        } catch (error) {
            console.error("Failed to send gift:", error);
            alert("Ocorreu um erro ao enviar o presente.");
        }
    }, [streamId, user.id, onUpdateUser, onRequirePurchase]);

    const handleFlipCamera = useCallback(() => {
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    }, []);

    const handleToggleVoice = useCallback(() => {
        mediaStream?.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
            setIsVoiceEnabled(track.enabled);
        });
    }, [mediaStream]);

     const handleEnterFriendLive = useCallback(async (friend: User) => {
        setIsPkInviteModalOpen(false); // Close the current modal
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
                alert(`${friend.nickname || friend.name} não está ao vivo no momento.`);
            }
        } catch (error) {
            console.error("Failed to enter friend's live stream:", error);
            alert("Ocorreu um erro ao tentar entrar na transmissão.");
        }
    }, [onViewStream]);

    const handleSendPkInvite = useCallback(async (friend: User) => {
        setIsPkInviteModalOpen(false);
        setIsPkStartDisputeModalOpen(false); // Make sure to close this modal too
        try {
            const createdInvite = await liveStreamService.createPkInvitation(user.id, friend.id, false);
            setInvitedOpponent(friend);
            setInvitation(createdInvite);
        } catch (error) {
            console.error("Failed to create PK invitation:", error);
            alert("Falha ao enviar convite de PK.");
        }
    }, [user.id]);

    // useEffect for managing media stream for the host
    useEffect(() => {
        if (!isCurrentUserHost) return;

        let isMounted = true;
        let stream: MediaStream | null = null;
        
        const requestCamera = async () => {
            setCameraStatus('loading');
            try {
                const constraints = { audio: true, video: { facingMode } };
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (isMounted) {
                    setMediaStream(stream);
                    setCameraStatus('success');
                } else {
                    stream.getTracks().forEach(track => track.stop());
                }
            } catch (err) {
                if (isMounted) setCameraStatus('denied');
                console.error("Camera access error:", err);
            }
        };

        requestCamera();
        
        return () => {
            isMounted = false;
            // Clean up both the stream being acquired and the one in state
            stream?.getTracks().forEach(track => track.stop());
            mediaStream?.getTracks().forEach(track => track.stop());
        };
    }, [isCurrentUserHost, facingMode]);

    // useEffect for attaching stream to video element
    useEffect(() => {
        const videoElement = videoRef.current;
        if (isCurrentUserHost && videoElement && mediaStream) {
            if (videoElement.srcObject !== mediaStream) {
                videoElement.srcObject = mediaStream;
                videoElement.play().catch(e => console.error("Video play error:", e));
            }
        }
    }, [isCurrentUserHost, mediaStream]);


    useEffect(() => {
        // Fetch initial data
        const fetchData = async () => {
            try {
                const details = await liveStreamService.getLiveStreamDetails(streamId);
                setLiveDetails(details);
                const messages = await liveStreamService.getChatMessages(streamId);
                setChatMessages(messages);

                const viewers = await liveStreamService.getViewers(streamId);
                setHeaderViewers({ [streamId]: viewers.slice(0, 3) });
            } catch (error) {
                console.error("Failed to fetch stream data:", error);
                onExit();
            }
        };

        fetchData();

        // Listeners for real-time updates
        const chatListener: liveStreamService.ChatMessageListener = (liveId, messages) => {
            if (liveId === streamId) {
                messages.forEach(msg => {
                    if(msg.type === 'gift') {
                        onTriggerGiftAnimation(msg);
                    }
                });
                setChatMessages(prev => [...prev, ...messages]);
            }
        };

        const liveUpdateListener = (liveId: number) => {
            if (liveId === streamId) {
                liveStreamService.getLiveStreamDetails(streamId).then(setLiveDetails);
                liveStreamService.getViewers(streamId).then(viewers => {
                    setHeaderViewers({ [streamId]: viewers.slice(0, 3) });
                });
            }
        };

        liveStreamService.addChatMessageListener(chatListener);
        liveStreamService.addLiveUpdateListener(liveUpdateListener);

        return () => {
            liveStreamService.removeChatMessageListener(chatListener);
            liveStreamService.removeLiveUpdateListener(liveUpdateListener);
        };
    }, [streamId, onExit, onTriggerGiftAnimation]);

    const handleStopStreamClick = () => {
        onStopStream(streamerId, streamId);
    };
    
    const isHostInPk = activePkBattle && (user.id === activePkBattle.streamer_A_id || user.id === activePkBattle.streamer_B_id);


    return (
        <div className="h-full w-full bg-black text-white flex flex-col font-sans relative">
            {/* Video Player Placeholder */}
            <div className="absolute inset-0 bg-black">
                {isCurrentUserHost ? (
                    <>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} 
                        />
                        <CameraStatusOverlay status={cameraStatus} />
                    </>
                ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                         {/* This could be a remote video player in a real app */}
                         <p className="text-gray-500">Live Stream Video</p>
                    </div>
                )}
            </div>
            
            {/* Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col p-4">
                {/* Header */}
                <header className="shrink-0">
                    <LiveStreamHeader
                        variant="single"
                        avatarUrl={liveDetails?.streamerAvatarUrl || ''}
                        name={liveDetails?.streamerName || '...'}
                        followers={(liveDetails?.streamerFollowers || 0).toLocaleString()}
                        viewerCount={(liveDetails?.viewerCount || 0).toLocaleString()}
                        headerViewers={headerViewers[streamId]}
                        coins={(liveDetails?.receivedGiftsValue || 0).toLocaleString()}
                        likes={(liveDetails?.likeCount || 0).toLocaleString()}
                        onUserClick={() => onViewProfile(streamerId)}
                        onExitClick={isCurrentUserHost ? () => setIsEndStreamModalOpen(true) : onExit}
                        onCoinsClick={handleOpenHourlyRanking}
                        onViewersClick={handleOpenOnlineUsers}
                        isCurrentUserHost={isCurrentUserHost}
                        isFollowing={user.following.includes(streamerId)}
                        onFollowToggle={() => onFollowToggle(streamerId)}
                        streamerIsAvatarProtected={liveDetails?.streamerIsAvatarProtected}
                    />
                </header>

                {/* Main Content (Chat) */}
                <main className="flex-grow flex flex-col justify-end overflow-hidden pointer-events-none">
                     <ChatArea messages={chatMessages} onUserClick={onViewProfile} />
                </main>
                
                {/* Footer */}
                <footer className="shrink-0 flex items-center gap-2 pt-2 pointer-events-auto">
                    <ChatInput
                        onSendMessage={handleSendMessage}
                        disabled={isBlockedByHost}
                        isUploading={isUploading}
                    />
                     <button onClick={() => setIsGiftPanelOpen(true)} className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                        <GiftBoxIcon className="w-8 h-8"/>
                    </button>
                    {isCurrentUserHost && (
                        <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                            <MoreToolsIcon className="w-8 h-8"/>
                        </button>
                    )}
                </footer>
            </div>
            
            {/* Modals */}
             {isArcoraToolModalOpen && (
                <ArcoraToolModal
                    onClose={() => setIsArcoraToolModalOpen(false)}
                    onOpenMuteModal={() => setIsMuteUserModalOpen(true)}
                    onOpenSoundEffectModal={() => setIsSoundEffectModalOpen(true)}
                    onSwitchCamera={handleFlipCamera}
                    cameraFacingMode={facingMode}
                    onToggleVoice={handleToggleVoice}
                    isVoiceEnabled={isVoiceEnabled}
                    onOpenPrivateChat={() => setIsPrivateChatModalOpen(true)}
                    isPrivateStream={isPrivateStream}
                    onOpenPrivateInviteModal={() => setIsInviteToPrivateLiveModalOpen(true)}
                    onOpenPkStartModal={() => setIsPkStartDisputeModalOpen(true)}
                    isPkBattleActive={isPkViewActive}
                    onOpenPkInviteModal={() => setIsPkInviteModalOpen(true)}
                />
            )}
            {isGiftPanelOpen && (
                <GiftPanel
                    user={user}
                    liveId={streamId}
                    streamerId={streamerId}
                    isHost={isCurrentUserHost}
                    onClose={() => setIsGiftPanelOpen(false)}
                    onSendGift={handleSendGift}
                    onRechargeClick={() => {
                        setIsGiftPanelOpen(false);
                        onRequirePurchase();
                    }}
                    pkBattleStreamers={isPkBattle ? (initialStream as PkBattle) : undefined}
                />
            )}
             {isEndStreamModalOpen && (
                <EndStreamConfirmationModal
                    onConfirm={handleStopStreamClick}
                    onCancel={() => setIsEndStreamModalOpen(false)}
                />
            )}
             {kickedState === 'kicked' && <KickedFromStreamModal onExit={onExit} />}
             {kickedState === 'denied' && <KickedFromStreamModal onExit={onExit} isJoinAttempt />}
             {isMutedNotification && <MutedNotificationModal type={isMutedNotification} onClose={() => setIsMutedNotification(null)} />}
             {viewingProfileId && (
                <UserProfileModal
                    userId={viewingProfileId}
                    currentUser={user}
                    onUpdateUser={onUpdateUser}
                    onClose={() => setViewingProfileId(null)}
                    onNavigateToChat={onNavigateToChat}
                    onViewProtectors={onViewProtectors}
                    onViewStream={onViewStream}
                />
            )}
            {showPkClashAnimation && <PkClashAnimation onAnimationEnd={() => setShowPkClashAnimation(false)} />}
            {finalPkBattleState && <PkResultModal currentUser={user} battleData={finalPkBattleState} onClose={() => setFinalPkBattleState(null)} />}
            {isOnlineUsersModalOpen && (
                <OnlineUsersModal
                    liveId={streamId}
                    onClose={() => setIsOnlineUsersModalOpen(false)}
                    onUserClick={handleViewProfile}
                />
            )}
            {isHourlyRankingModalOpen && (
                <HourlyRankingModal
                    liveId={streamId}
                    onClose={() => setIsHourlyRankingModalOpen(false)}
                    onUserClick={handleViewProfile}
                    currentUser={user}
                    onUpdateUser={onUpdateUser}
                    streamer={{ 
                        id: streamerId, 
                        name: liveDetails?.streamerName || '', 
                        avatarUrl: liveDetails?.streamerAvatarUrl || '' 
                    }}
                    onNavigateToList={() => {
                        setIsHourlyRankingModalOpen(false);
                        setIsRankingListOpen(true);
                    }}
                    onRequirePurchase={onRequirePurchase}
                />
            )}
            {isPkStartDisputeModalOpen && (
                <PkStartDisputeModal
                    currentUser={user}
                    onClose={() => setIsPkStartDisputeModalOpen(false)}
                    onProposeDispute={handleSendPkInvite}
                />
            )}
            {isPkInviteModalOpen && (
                <PkInviteModal
                    user={user}
                    onClose={() => setIsPkInviteModalOpen(false)}
                    onEnterFriendLive={handleEnterFriendLive}
                    onSendInvite={handleSendPkInvite}
                />
            )}
            {invitation && invitedOpponent && (
                <PkInvitationModal
                    currentUser={user}
                    opponent={invitedOpponent}
                    invitation={invitation}
                    onClose={() => {
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
};

export default LiveStreamViewerScreen;