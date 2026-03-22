
import React, { useState, useEffect, useRef, useMemo } from 'react';
import OnlineUsersModal from './live/OnlineUsersModal';
import ChatMessage from './live/ChatMessage';
import CoHostModal from './CoHostModal';
import EntryChatMessage from './live/EntryChatMessage';
import ChatScreen from './ChatScreen';
import ToolsModal from './ToolsModal';
import { GiftIcon, MessageIcon, SendIcon, MoreIcon, CloseIcon, PlusIcon, SoundWaveIcon, ViewerIcon, GoldCoinWithGIcon, HeartIcon, TrophyIcon, BellIcon, RankIcon } from './icons';
import { Streamer, User, Gift, ToastType, RankedUser, LiveSessionState } from '../types';
import ContributionRankingModal from './ContributionRankingModal';
import BeautyEffectsPanel from './live/BeautyEffectsPanel';
import ResolutionPanel from './live/ResolutionPanel';
import GiftModal from './live/GiftModal';
import GiftAnimationOverlay, { GiftPayload } from './live/GiftAnimationOverlay';
import { useTranslation } from '../i18n';
import { api } from '../services/api';
import UserActionModal from './UserActionModal';
import FriendRequestNotification from './live/FriendRequestNotification';
import { RankedAvatar } from './live/RankedAvatar';
import FullScreenGiftAnimation from './live/FullScreenGiftAnimation';
import { webRTCService } from '../services/webrtcService.js';
import { socketService } from '../services/socket';
import AvatarWithFrame from './ui/AvatarWithFrame';
import { beautyWebRTCIntegration } from '../services/BeautyWebRTCIntegration';

interface ChatMessageType {
    id: number;
    type: 'chat' | 'entry' | 'friend_request' | 'follow';
    user?: string;
    fullUser?: User;
    follower?: User;
    age?: number;
    gender?: 'male' | 'female' | 'not_specified';
    level?: number;
    message?: string | React.ReactNode;
    avatar?: string;
    followedUser?: string;
    isModerator?: boolean;
    activeFrameId?: string | null;
    frameExpiration?: string | null;
}

interface StreamRoomProps {
    streamer: Streamer;
    onRequestEndStream: () => void;
    onLeaveStreamView: () => void;
    onStartPKBattle: (opponent: User) => void;
    onViewProfile: (user: User) => void;
    currentUser: User;
    onOpenWallet: (initialTab?: 'Diamante' | 'Ganhos') => void;
    onFollowUser: (user: User, streamId?: string) => void;
    onOpenPrivateChat: () => void;
    onOpenPrivateInviteModal: () => void;
    setActiveScreen: (screen: 'main' | 'profile' | 'messages' | 'video') => void;
    onStartChatWithStreamer: (user: User) => void;
    onOpenPKTimerSettings: () => void;
    onOpenFans: (user: User) => void;
    onOpenFriendRequests: () => void;
    gifts: Gift[];
    receivedGifts: (Gift & { count: number })[];
    updateUser: (user: User) => void;
    liveSession: LiveSessionState | null;
    updateLiveSession: (updates: Partial<LiveSessionState>) => void;
    logLiveEvent: (type: string, data: any) => void;
    onStreamUpdate: (updates: Partial<Streamer>) => void;
    refreshStreamRoomData: (streamerId: string) => void;
    addToast: (type: ToastType, message: string) => void;
    followingUsers: User[];
    streamers: Streamer[];
    onSelectStream: (streamer: Streamer) => void;
    onOpenVIPCenter: () => void;
    rankingData: Record<string, RankedUser[]>;
}

const FollowChatMessage: React.FC<{ follower: string; followed: string; level?: number }> = ({ follower, followed, level }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-purple-500/30 rounded-full p-1.5 px-3 flex items-center self-start text-xs">
            <span className="text-purple-300 font-bold">{follower}</span>
            {level && (
                <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1 ml-2">
                    <RankIcon className="h-3 w-3" />
                    <span>{level}</span>
                </span>
            )}
            <span className="text-gray-200 ml-1.5">{t('streamRoom.followed')}</span>
            <span className="text-purple-300 font-bold ml-1.5">{followed}! 🎉</span>
        </div>
    );
};

// Controle global para evitar múltiplas chamadas simultâneas
const globalFetchControl = new Map<string, boolean>();

const StreamRoom: React.FC<StreamRoomProps> = ({ streamer, onRequestEndStream, onLeaveStreamView, onStartPKBattle, onViewProfile, currentUser, onOpenWallet, onFollowUser, onOpenPrivateChat, onOpenPrivateInviteModal, setActiveScreen, onStartChatWithStreamer, onOpenPKTimerSettings, onOpenFans, onOpenFriendRequests, gifts, receivedGifts, updateUser, liveSession, updateLiveSession, logLiveEvent, onStreamUpdate, refreshStreamRoomData, addToast, followingUsers, streamers, onSelectStream, onOpenVIPCenter, rankingData }) => {
    const { t } = useTranslation();

    // Early validation for required props
    if (!streamer || !currentUser) {
        return (
            <div className="absolute inset-0 bg-gray-900 text-white font-sans z-10 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-2">Erro ao carregar transmissão</div>
                    <div className="text-gray-400">Verifique sua conexão e tente novamente</div>
                </div>
            </div>
        );
    }

    const [isUiVisible, setIsUiVisible] = useState(true);
    const [showChatScreen, setShowChatScreen] = useState(false);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isBeautyPanelOpen, setBeautyPanelOpen] = useState(false);
    const [isCoHostModalOpen, setIsCoHostModalOpen] = useState(false);
    const [isOnlineUsersOpen, setOnlineUsersOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isRankingOpen, setIsRankingOpen] = useState(false);
    const [onlineUsersInterval, setOnlineUsersInterval] = useState<NodeJS.Timeout | null>(null);
    const [isResolutionPanelOpen, setResolutionPanelOpen] = useState(false);
    const [currentResolution, setCurrentResolution] = useState(streamer.quality || '480p');
    const [isGiftModalOpen, setGiftModalOpen] = useState(false);
    const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
    const [userActionModalState, setUserActionModalState] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
    const [isModerationMode, setIsModerationMode] = useState(false);
    const [isAutoPrivateInviteEnabled, setIsAutoPrivateInviteEnabled] = useState(liveSession?.isAutoPrivateInviteEnabled ?? false);
    const [onlineUsers, setOnlineUsers] = useState<(User & { value: number })[]>([]);
    const previousOnlineUsersRef = useRef<(User & { value: number })[]>([]);

    // State to track if video is actually playing to hide the cover image
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    const [bannerGifts, setBannerGifts] = useState<(GiftPayload & { id: number })[]>([]);
    const nextGiftId = useRef(0);
    const [fullscreenGiftQueue, setFullscreenGiftQueue] = useState<GiftPayload[]>([]);
    const [currentFullscreenGift, setCurrentFullscreenGift] = useState<GiftPayload | null>(null);

    // Video Ref for Stream Playback/Preview
    const videoRef = useRef<HTMLVideoElement>(null);

    const isBroadcaster = streamer.hostId === currentUser.id;

    const isFollowed = useMemo(() => followingUsers.some(u => u.id === streamer.hostId), [followingUsers, streamer.hostId]);

    const [streamerUser, setStreamerUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchStreamerData = async () => {
            try {
                const user = await api.getUser(streamer.hostId);
                setStreamerUser(user);
            } catch (error) {
            }
        };
        fetchStreamerData();
    }, [streamer.hostId]);

    const streamerDisplayUser = isBroadcaster ? currentUser : (streamerUser || {
        id: streamer.hostId,
        name: streamer.name,
        avatarUrl: streamer.avatar,
        identification: streamer.hostId,
        level: 1,
        // Fallback minimal user
    } as User);

    // Simplificado - sem frames para navegação isolada
    const frameGlowClass = '';

    const swipeStart = useRef<{ x: number, y: number } | null>(null);
    const minSwipeDistance = 50;

    const handlePointerDown = (clientX: number, clientY: number) => {
        swipeStart.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = (clientX: number, clientY: number) => {
        if (!swipeStart.current) return;

        const deltaX = clientX - swipeStart.current.x;
        const deltaY = clientY - swipeStart.current.y;

        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
            // Vertical swipe for navigation
            const currentIndex = streamers.findIndex(s => s.id === streamer.id);
            if (currentIndex === -1 || streamers.length <= 1) return;

            if (deltaY < 0) { // Swipe Up
                const nextIndex = (currentIndex + 1) % streamers.length;
                onSelectStream(streamers[nextIndex]);
            } else { // Swipe Down
                const prevIndex = (currentIndex - 1 + streamers.length) % streamers.length;
                onSelectStream(streamers[prevIndex]);
            }
        } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            // Horizontal swipe for UI toggle
            setIsUiVisible(p => !p);
        }

        swipeStart.current = null;
    };

    // --- VIDEO HANDLING EFFECT ---
    useEffect(() => {
        setIsVideoPlaying(false); // Reset on stream change

        const attachStream = async () => {
            const videoEl = videoRef.current;
            if (!videoEl) return;

            // Reset source to avoid conflicts and prevent invalid source errors
            videoEl.pause();
            videoEl.srcObject = null;
            videoEl.removeAttribute('src');
            videoEl.load();

            const onVideoReady = async () => {
                setIsVideoPlaying(true);

                // Inicializar sistema de beleza para broadcasters
                if (isBroadcaster) {
                    try {
                        const localStream = webRTCService.getLocalStream();
                        if (localStream) {
                            // Inicializar integração de beleza com WebRTC
                            await beautyWebRTCIntegration.initialize(localStream);
                            console.log('✅ [STREAM_ROOM] Sistema de beleza inicializado para broadcaster');
                        }
                    } catch (error) {
                        console.warn('⚠️ [STREAM_ROOM] Falha ao inicializar sistema de beleza:', error);
                    }
                }

                videoEl.play().catch(e => {
                    if (e.name !== 'AbortError') {
                    }
                });
            };

            if (isBroadcaster) {
                // Scenario 1: I am the Host (Broadcaster)
                // Get the local stream we initialized in GoLiveScreen via WebRTCService
                const localStream = webRTCService.getLocalStream();
                if (localStream) {
                    videoEl.srcObject = localStream;
                    // Important: Broadcasters must mute their own video element to prevent echo/feedback
                    videoEl.muted = true;
                    videoEl.volume = 0;
                    videoEl.onloadeddata = onVideoReady;
                } else {
                    try {
                        // Emergency fallback: request camera again if lost
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                        videoEl.srcObject = stream;
                        videoEl.muted = true;
                        videoEl.onloadeddata = onVideoReady;
                    } catch (e) {
                    }
                }
            } else {
                // Scenario 2: I am a Viewer

                try {
                    // Construct the WebRTC URL for SRS
                    // Assuming standard SRS format: http://<server>/rtc/v1/play/
                    // But our service expects the full stream URL like: webrtc://<server>/live/<streamId>
                    // Let's use the one from streamer object or construct it

                    // 🔧 SINCRONIZAÇÃO: Usar variável de ambiente para URL do SRS (não hardcoded)
                    // Prioridade: playbackUrl da stream > variável de ambiente > fallback
                    const srsWebrtcBase = import.meta.env?.VITE_SRS_WEBRTC_URL || 'webrtc://72.60.249.175/live';
                    const webrtcUrl = (streamer.playbackUrl && streamer.playbackUrl.startsWith('webrtc://'))
                        ? streamer.playbackUrl
                        : `${srsWebrtcBase}/${streamer.id}`;


                    const remoteStream = await webRTCService.startPlay(webrtcUrl);

                    if (remoteStream) {
                        videoEl.srcObject = remoteStream;
                        videoEl.muted = false;
                        videoEl.volume = 1.0;
                        videoEl.onloadeddata = onVideoReady;

                        // ✅ DEBUG: Verificar video element
                        videoEl.onloadedmetadata = () => {

                            if (videoEl.videoWidth === 0) {
                            }
                        };

                        videoEl.onerror = (e) => {
                        };

                        // Auto-play might be blocked, ensure we try
                        try {
                            await videoEl.play();
                        } catch (e) {
                        }
                    } else {
                        throw new Error("No remote stream returned");
                    }
                } catch (e) {
                    // Continue with fallback without throwing to prevent breaking render
                    try {
                        if (streamer.demoVideoUrl) {
                            videoEl.src = streamer.demoVideoUrl;
                            videoEl.loop = true;
                            videoEl.muted = false;
                            videoEl.onloadeddata = onVideoReady;
                        } else if (streamer.playbackUrl && streamer.playbackUrl.includes('.flv')) {
                            // Implement flv.js player here if needed, or just log
                        } else {
                            // Final fallback: show cover image
                            setIsVideoPlaying(false);
                        }
                    } catch (fallbackError) {
                        setIsVideoPlaying(false);
                    }
                }
            }
        };

        attachStream();
    }, [isBroadcaster, streamer.id, streamer.demoVideoUrl]);

    useEffect(() => {
        // Add entry message for current user
        const currentUserEntryMessage: ChatMessageType = {
            id: Date.now(),
            type: 'entry',
            fullUser: currentUser,
        };
        setMessages([currentUserEntryMessage]);

        // Variável de controle para evitar chamadas duplicadas
        let hasJoined = false;
        let hasLeft = false;
        let hasFetchedInitialUsers = false;

        // Marcar usuário como online na stream (apenas uma vez)
        const joinStreamOnce = async () => {
            if (!hasJoined) {
                hasJoined = true;
                const success = await api.joinStream(streamer.id, currentUser.id);
                if (success) {
                } else {
                }
            }
        };

        // Initial fetch para definir baseline
        const fetchInitialUsers = async () => {
            const controlKey = `${streamer.id}_${currentUser.id}`;

            if (!hasFetchedInitialUsers && !globalFetchControl.get(controlKey)) {
                hasFetchedInitialUsers = true;
                globalFetchControl.set(controlKey, true);

                try {
                    const users = await api.getOnlineUsers(currentUser.id, streamer.id);
                    if (users) {
                        setOnlineUsers(users);
                        updateLiveSession({ viewers: users.length });
                        previousOnlineUsersRef.current = users;
                    }
                } finally {
                    // Limpar controle após um tempo para permitir novas chamadas em sessões futuras
                    setTimeout(() => {
                        globalFetchControl.delete(controlKey);
                    }, 5000);
                }
            }
        };

        // Executar uma vez no início
        joinStreamOnce();
        fetchInitialUsers();

        // REMOVIDO: Polling automático de usuários online
        // A busca agora ocorre apenas em eventos reais (entrada/saída via WebSocket)
        setOnlineUsersInterval(null);

        socketService.connect();
        socketService.joinRoom(streamer.id);

        // Escutar usuários entrando na stream
        socketService.onUserJoined((data) => {
            // Adicionar usuário à lista de online users
            setOnlineUsers(prev => {
                const exists = prev.find(u => u.id === data.userId);
                if (!exists) {
                    const newUser = {
                        id: data.userId,
                        name: data.userName,
                        avatarUrl: data.userAvatar,
                        level: data.userLevel,
                        value: 0,
                        identification: data.userId
                    };
                    const updated = [...prev, newUser];
                    updateLiveSession({ viewers: updated.length });
                    return updated;
                }
                return prev;
            });
        });

        // Escutar usuários saindo da stream
        socketService.onUserLeft((data) => {
            // Remover usuário da lista de online users
            setOnlineUsers(prev => {
                const updated = prev.filter(u => u.id !== data.userId);
                updateLiveSession({ viewers: updated.length });
                return updated;
            });
        });

        // Escutar atualizações de contagem de viewers
        socketService.onViewersCountUpdated((data) => {
            updateLiveSession({ viewers: data.count });
        });

        return () => {
            // Marcar que está saindo para evitar múltiplas chamadas
            hasLeft = true;

            // Limpar listeners WebSocket
            socketService.off('user_joined_stream');
            socketService.off('user_left_stream');
            socketService.off('viewers_count_updated');

            // Marcar usuário como offline ao sair da stream (apenas uma vez)
            if (hasJoined && !hasLeft) {
                api.leaveStream(streamer.id, currentUser.id).then(success => {
                    if (success) {
                    } else {
                    }
                });
            }

            socketService.leaveRoom(streamer.id);
        };
    }, [streamer.id, currentUser.id]); // Removido onlineUsersInterval das dependências

    const postGiftChatMessage = (payload: GiftPayload) => {
        const { fromUser, gift, toUser, quantity } = payload;

        const messageKey = quantity > 1 ? 'streamRoom.sentMultipleGiftsMessage' : 'streamRoom.sentGiftMessage';
        const messageOptions = { quantity, giftName: gift.name, receiverName: toUser.name };

        const giftMessage: ChatMessageType = {
            id: Date.now() + Math.random(),
            type: 'chat',
            user: fromUser.name,
            level: fromUser.level,
            message: (
                <span className="inline-flex items-center">
                    {t(messageKey, messageOptions)}
                    {gift.component ? React.cloneElement(gift.component as React.ReactElement<any>, { className: "w-5 h-5 inline-block ml-1.5" }) : <span className="ml-1.5">{gift.icon}</span>}
                </span>
            ),
            avatar: fromUser.avatarUrl,
            activeFrameId: fromUser.activeFrameId,
            frameExpiration: fromUser.frameExpiration,
        };
        setMessages(prev => [...prev, giftMessage]);
    };

    const handleBannerAnimationEnd = (id: number) => {
        setBannerGifts(prev => prev.filter(g => g.id !== id));
    };

    const handleFullscreenGiftAnimationEnd = () => {
        if (currentFullscreenGift) {
            const newBanner = { ...currentFullscreenGift, id: nextGiftId.current++ };
            setBannerGifts(prev => [...prev, newBanner].slice(-5));
        }
        setCurrentFullscreenGift(null);
    };

    useEffect(() => {
        if (!currentFullscreenGift && fullscreenGiftQueue.length > 0) {
            const nextGift = fullscreenGiftQueue[0];
            setCurrentFullscreenGift(nextGift);
            setFullscreenGiftQueue(prev => prev.slice(1));
        }
    }, [currentFullscreenGift, fullscreenGiftQueue]);

    useEffect(() => {
        const handleNewMessage = (message: any) => {
            setMessages(prev => [...prev, message]);
        };
        socketService.on('receive_message', handleNewMessage);

        const handleNewGift = (payload: GiftPayload) => {
            if (payload.fromUser.id === currentUser.id) return; // Ignore self-sent

            if (liveSession) {
                updateLiveSession({ coins: (liveSession.coins || 0) + (payload.gift.price || 0) });
            }

            postGiftChatMessage(payload);
            setFullscreenGiftQueue(prev => [...prev, payload]);
        };
        socketService.on('gift_received', handleNewGift);

        return () => {
            socketService.off('receive_message', handleNewMessage);
            socketService.off('gift_received', handleNewGift);
        };
    }, [streamer.id, updateLiveSession, currentUser.id, t, onOpenFriendRequests, liveSession, refreshStreamRoomData]);

    const handleSendMessage = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (chatInput.trim() === '' || !currentUser) return;
        const messagePayload: ChatMessageType = {
            id: Date.now(),
            type: 'chat',
            user: currentUser.name,
            level: currentUser.level,
            message: chatInput.trim(),
            avatar: currentUser.avatarUrl,
            gender: currentUser.gender,
            age: currentUser.age,
            activeFrameId: currentUser.activeFrameId,
            frameExpiration: currentUser.frameExpiration,
        };
        setMessages(prev => [...prev, messagePayload]);
        socketService.sendMessage(streamer.id, messagePayload);
        setChatInput('');
    };

    const handleTogglePrivacy = async () => {
        if (!isBroadcaster) return;
        const newPrivacy = !streamer.isPrivate;
        try {
            await api.updateStream(currentUser.id, streamer.id, { isPrivate: newPrivacy });
            onStreamUpdate({ isPrivate: newPrivacy });
        } catch (error) {
        }
    };

    const handleFollowStreamer = () => {
        if (streamerUser) {
            onFollowUser(streamerUser, streamer.id);
        }
    };

    const handleFollowChatUser = (userToFollow: User) => {
        onFollowUser(userToFollow, streamer.id);
        setFollowedUsers(prev => new Set(prev).add(userToFollow.id));
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Cleanup do sistema de beleza ao desmontar
    useEffect(() => {
        return () => {
            // Parar processamento de beleza ao sair da sala
            if (beautyWebRTCIntegration.isBeautyActive()) {
                beautyWebRTCIntegration.stopBeautyProcessing();
                console.log('🧹 [STREAM_ROOM] Sistema de beleza limpo ao sair');
            }
        };
    }, []);

    // activeScreen é controlado pela prop setActiveScreen do componente pai


    const handleInvite = (opponent: User) => {
        setIsCoHostModalOpen(false);
        onStartPKBattle(opponent);
    };

    const handleOpenCoHostModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsToolsOpen(false);
        setIsCoHostModalOpen(true);
    };

    const handleOpenBeautyPanel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsToolsOpen(false);
        setBeautyPanelOpen(true);
    };

    const handleOpenClarityPanel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsToolsOpen(false);
        setResolutionPanelOpen(true);
    };

    const handleSelectResolution = async (resolution: string) => {
        const { success, stream } = await api.updateVideoQuality(streamer.id, resolution, currentUser.id);
        if (success && stream) {
            setCurrentResolution(resolution);
            onStreamUpdate({ quality: resolution });
            addToast(ToastType.Success, `Qualidade do vídeo alterada para ${resolution}`);
        } else {
            addToast(ToastType.Error, `Falha ao alterar a qualidade do vídeo.`);
        }
        setResolutionPanelOpen(false);
    };

    const handleOpenTimerSettings = () => {
        onOpenPKTimerSettings();
    };

    const constructUserFromMessage = (user: ChatMessageType): User => {
        return {
            id: `user-${user.id}`,
            identification: `user-${user.id}`,
            name: user.user!,
            avatarUrl: user.avatar!,
            coverUrl: `https://picsum.photos/seed/${user.id}/400/600`,
            country: 'br',
            gender: user.gender || 'not_specified',
            level: user.level || 1,
            xp: 0,
            age: user.age || 18,
            location: 'Brasil',
            distance: 'desconhecida',
            fans: 0,
            following: 0,
            receptores: streamerUser?.receptores || 0,
            enviados: streamerUser?.enviados || 0,
            topFansAvatars: [],
            isLive: false,
            diamonds: 0,
            earnings: 0,
            earnings_withdrawn: 0,
            bio: 'Usuário da plataforma',
            obras: [],
            curtidas: [],
            ownedFrames: [],
            activeFrameId: user.activeFrameId || null,
            frameExpiration: user.frameExpiration || null,
        };
    };

    const handleViewChatUserProfile = (user: ChatMessageType) => {
        if (!user.user || !user.avatar) return;
        const userProfile = constructUserFromMessage(user);
        onViewProfile(userProfile);
    };

    const handleSendGift = async (gift: Gift, quantity: number) => {
        const totalCost = gift.price || 0;
        if (currentUser.diamonds < totalCost) {
            handleRecharge();
            return;
        }

        // Optimistic UI Update for the sender
        const giftPayload: GiftPayload = {
            fromUser: currentUser,
            toUser: { id: streamer.hostId, name: streamer.name },
            gift,
            quantity,
            roomId: streamer.id,
            id: Date.now() + Math.random() // IMPORTANT: Ensure ID is unique per click
        };

        postGiftChatMessage(giftPayload);
        setFullscreenGiftQueue(prev => [...prev, giftPayload]);
        socketService.sendGift(streamer.id, giftPayload);

        // Now, call the API in the background
        try {
            const { success, error, updatedSender, updatedReceiver } = await api.sendGift(currentUser.id, streamer.id, streamer.id, gift.name, quantity);

            if (success && updatedSender) {
                // 🔧 SINCRONIZAÇÃO: Usar dados reais da API (banco de dados) para atualizar o remetente
                updateUser(updatedSender);
                console.log('✅ StreamRoom: Remetente atualizado com dados da API', {
                    userId: updatedSender.id,
                    diamonds: updatedSender.diamonds,
                    enviados: updatedSender.enviados,
                    earnings: updatedSender.earnings
                });

                // 🔧 SINCRONIZAÇÃO: Atualizar streamer/destinatário se disponível
                if (updatedReceiver) {
                    // Atualizar streamerUser se for o mesmo usuário
                    if (streamerUser && streamerUser.id === updatedReceiver.id) {
                        // Atualizar o streamerUser com dados frescos
                        setStreamerUser(updatedReceiver);
                        console.log('✅ StreamRoom: Streamer atualizado com dados da API', {
                            streamerId: updatedReceiver.id,
                            diamonds: updatedReceiver.diamonds,
                            receptores: updatedReceiver.receptores,
                            earnings: updatedReceiver.earnings
                        });
                    }

                    // Atualizar liveSession coins com diamonds contados nesta stream
                    if (liveSession) {
                        const addedValue = gift.price * quantity;
                        updateLiveSession({ coins: (liveSession.coins || 0) + addedValue });
                        console.log('✅ StreamRoom: Contador da live atualizado localmente', {
                            added: addedValue
                        });
                    }
                }

                if (gift.triggersAutoFollow && !isFollowed && streamerUser) {
                    onFollowUser(streamerUser, streamer.id);
                }

                // 🔧 SINCRONIZAÇÃO: Atualizar ranking de online users com contribuição do remetente
                // O ranking deve refletir os dados reais do banco de dados
                setOnlineUsers(prev => {
                    const existing = prev.find(u => u.id === currentUser.id);
                    const totalValue = gift.price * quantity;
                    if (existing) {
                        return prev.map(u => u.id === currentUser.id
                            ? { ...u, value: (u.value || 0) + totalValue }
                            : u
                        ).sort((a, b) => (b.value || 0) - (a.value || 0));
                    } else {
                        const newEntry = { ...currentUser, value: totalValue } as User & { value: number };
                        return [...prev, newEntry].sort((a, b) => (b.value || 0) - (a.value || 0));
                    }
                });

                // Atualizar contador de moedas via refreshStreamRoomData (busca dados reais)
                refreshStreamRoomData(streamer.id);

            } else {
                throw new Error(error || "Failed to send gift on server");
            }
        } catch (error) {
            addToast(ToastType.Error, (error as Error).message || "Falha ao enviar o presente.");
            // Fetch the latest user data to revert diamond count on failure
            api.getCurrentUser().then(user => {
                if (user) updateUser(user);
            });
            // Note: A more advanced implementation might add a "failed" state to the optimistic chat message.
        }
    };

    const handleRecharge = () => {
        setGiftModalOpen(false);
        onOpenWallet('Diamante');
    };

    const handleOpenUserActions = (chatUser: ChatMessageType) => {
        if (!isBroadcaster || !chatUser.user) return;
        if (chatUser.user === streamer.name || chatUser.user === currentUser.name) return;
        const userForModal = constructUserFromMessage(chatUser);
        setUserActionModalState({ isOpen: true, user: userForModal });
    };
    const handleCloseUserActions = () => {
        setUserActionModalState({ isOpen: false, user: null });
    };
    const handleKickUser = (user: User) => {
        api.kickUser(streamer.id, user.id, currentUser.id);
        addToast(ToastType.Info, `Usuário ${user.name} foi expulso.`);
    };
    const handleMakeModerator = (user: User) => {
        api.makeModerator(streamer.id, user.id, currentUser.id);
        addToast(ToastType.Success, `${user.name} agora é um moderador.`);
    };
    const handleMentionUser = (user: User) => {
        setChatInput(prev => `${prev}@${user.name} `);
    };

    const handleToggleMicrophone = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isBroadcaster) return;
        await api.toggleMicrophone(streamer.id);
    };

    const handleToggleSound = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isBroadcaster) return;
        addToast(ToastType.Info, !(liveSession?.isStreamMuted) ? 'Áudio da live silenciado.' : 'Áudio da live ativado.');
        await api.toggleStreamSound(streamer.id);
    };

    const handleToggleAutoFollow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isBroadcaster || !liveSession) return;
        const newAutoFollowState = !liveSession.isAutoFollowEnabled;
        try {
            await api.toggleAutoFollow(streamer.id, newAutoFollowState);
            updateLiveSession({ isAutoFollowEnabled: newAutoFollowState });
            addToast(ToastType.Success, newAutoFollowState ? 'Seguimento automático ativado.' : 'Seguimento automático desativado.');
        } catch (error) {
            addToast(ToastType.Error, "Falha ao alterar a configuração.");
        }
    };

    const handleToggleAutoPrivateInvite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isBroadcaster) return;
        const newAutoInviteState = !isAutoPrivateInviteEnabled;
        try {
            await api.toggleAutoPrivateInvite(streamer.id, newAutoInviteState);
            addToast(ToastType.Success, newAutoInviteState ? 'Convite automático ativado.' : 'Convite automático desativado.');
        } catch (error) {
            addToast(ToastType.Error, "Falha ao alterar a configuração.");
        }
    };

    const topContributors = onlineUsers.filter(u => u.value > 0).slice(0, 3);

    return (
        <div className="absolute inset-0 bg-gray-900 text-white font-sans z-10"
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseUp={(e) => handlePointerUp(e.clientX, e.clientY)}
            onTouchStart={(e) => handlePointerDown(e.targetTouches[0].clientX, e.targetTouches[0].clientY)}
            onTouchEnd={(e) => handlePointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
        >
            {/* Renderizar ChatScreen quando showChatScreen for true */}
            {showChatScreen && (
                <ChatScreen
                    currentUser={currentUser}
                    onOpenProfile={onViewProfile}
                    onBack={() => setShowChatScreen(false)}
                    isModal={false}
                    user={currentUser}
                    onNavigateToFriends={() => { }}
                    onFollowUser={onFollowUser}
                    onBlockUser={() => { }}
                    onReportUser={() => { }}
                    onOpenPhotoViewer={() => { }}
                />
            )}

            {/* 1. Video Layer (Bottom) */}
            <div className="absolute inset-0 z-0 bg-black">
                {/* Fallback Image - Visible only if video is NOT playing */}
                {!isVideoPlaying && (
                    <img
                        src={streamerUser?.coverUrl || streamerUser?.avatarUrl || streamer.avatar}
                        key={streamerUser?.coverUrl || streamerUser?.avatarUrl || streamer.avatar}
                        className="absolute inset-0 w-full h-full object-cover z-10"
                        alt="Stream background"
                        onError={(e) => {
                            // Fallback to placeholder image if main image fails
                            const target = e.target as HTMLImageElement;
                            target.src = `https://picsum.photos/seed/streamer-${streamer.id}/800/600.jpg`;
                        }}
                    />
                )}

                {/* The Video Element - Removed autoPlay, handled in useEffect */}
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    playsInline
                    key={streamer.id}
                    // Mute if broadcaster to prevent echo, unmute for viewers
                    muted={isBroadcaster}
                />

                {/* Dark Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-black/70 pointer-events-none transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0'}`} style={{ zIndex: 15 }}></div>
            </div>

            {/* 2. Gift Animation Layers */}
            <div className="absolute top-24 left-3 z-30 pointer-events-none flex flex-col-reverse items-start">
                {bannerGifts.map((payload) => (
                    <GiftAnimationOverlay
                        key={payload.id}
                        giftPayload={payload}
                        onAnimationEnd={handleBannerAnimationEnd}
                    />
                ))}
            </div>

            <FullScreenGiftAnimation
                payload={currentFullscreenGift}
                onEnd={handleFullscreenGiftAnimationEnd}
            />

            {/* 3. Header UI */}
            <header className={`p-3 bg-transparent absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex justify-between items-start">
                    {/* Left side */}
                    <div className="flex items-start space-x-2">
                        <div className="flex flex-col space-y-2">
                            {/* Streamer Info */}
                            <button onClick={(e) => { e.stopPropagation(); streamerDisplayUser && onViewProfile(streamerDisplayUser); }} className="flex items-center bg-black/40 rounded-full p-1 pr-3 space-x-2 text-left">
                                <div className="relative">
                                    <div className="live-ring-animated">
                                        <AvatarWithFrame
                                            user={streamerDisplayUser || {
                                                id: streamer.hostId,
                                                name: streamer.name,
                                                avatarUrl: streamer.avatar,
                                                identification: streamer.hostId,
                                                level: 1,
                                                diamonds: 0,
                                                fans: 0,
                                                following: 0,
                                                isOnline: true,
                                                isVIP: false,
                                                isAvatarProtected: false
                                            }}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">{streamerDisplayUser?.name || streamer.name}</p>
                                    <div className="flex items-center space-x-1 text-gray-300 text-xs">
                                        <ViewerIcon className="w-4 h-4" />
                                        <span>{Math.max(1, liveSession?.viewers || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </button>
                            {/* G and Heart icons */}
                            <div className="flex items-center space-x-2 pl-1">
                                <button onClick={(e) => { e.stopPropagation(); setIsRankingOpen(true); }} className="flex items-center bg-black/40 rounded-full px-2 py-1 space-x-1 text-xs cursor-pointer">
                                    <GoldCoinWithGIcon className="w-4 h-4" />
                                    <span className="text-white font-semibold">{(() => {
                                        const coins = liveSession?.coins || 0;
                                        return coins.toLocaleString();
                                    })()}</span>
                                </button>
                                <div className="flex items-center bg-black/40 rounded-full px-2 py-1 space-x-1 text-xs">
                                    <HeartIcon className="w-4 h-4 text-white" />
                                    <span className="text-white font-semibold">5.8K</span>
                                </div>
                                {isBroadcaster && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleTogglePrivacy(); }}
                                        className="bg-black/40 rounded-full px-3 py-1 text-xs text-white"
                                    >
                                        {streamer.isPrivate ? 'Privada' : 'Pública'}
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Add button */}
                        {!isFollowed && currentUser.id !== streamer.hostId && (
                            <button onClick={(e) => { e.stopPropagation(); handleFollowStreamer(); }} className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white mt-1 shrink-0">
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Right side */}
                    <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center space-x-2">
                            {topContributors.map((user, index) => (
                                <RankedAvatar
                                    key={user.id}
                                    user={user}
                                    rank={index + 1}
                                    onClick={onViewProfile}
                                />
                            ))}

                            {/* Notifications / Viewers button */}
                            {/* FIX: Corrected typo for state setter from 'setIsOnlineUsersOpen' to 'setOnlineUsersOpen'. */}
                            <button onClick={(e) => { e.stopPropagation(); setOnlineUsersOpen(true); }} className="flex items-center bg-black/40 rounded-full px-2.5 py-1.5 space-x-1 text-sm cursor-pointer">
                                <BellIcon className="w-5 h-5 text-yellow-400" />
                                <span className="text-white font-semibold">{Math.max(1, onlineUsers.length)}</span>
                            </button>

                            {/* Close button */}
                            <button onClick={(e) => { e.stopPropagation(); isBroadcaster ? onRequestEndStream() : onLeaveStreamView(); }} className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                                <CloseIcon className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="pr-1">
                            <div className="bg-black/40 rounded-full px-3 py-1 text-xs text-gray-300">
                                ID: {streamer.hostId}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 4. Chat & Footer UI */}
            <div className={`absolute bottom-0 left-0 right-0 w-full transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div ref={chatContainerRef} className="max-h-[33vh] h-full overflow-y-auto no-scrollbar flex flex-col pointer-events-auto px-3">
                    <div className="space-y-2 mt-auto">
                        {messages.map((msg) => {
                            if (msg.type === 'entry' && msg.fullUser) {
                                return <EntryChatMessage
                                    key={msg.id}
                                    user={msg.fullUser}
                                    currentUser={currentUser}
                                    onClick={onViewProfile}
                                    onFollow={onFollowUser}
                                    isFollowed={followingUsers.some(u => u.id === msg.fullUser!.id)} />;
                            }
                            if (msg.type === 'chat' && msg.user && msg.avatar) {
                                const chatUser = constructUserFromMessage(msg);
                                const shouldShowFollow = !isBroadcaster && chatUser.id !== currentUser.id && chatUser.name !== streamer.name;

                                return <ChatMessage
                                    key={msg.id}
                                    userObject={chatUser}
                                    message={msg.message}
                                    onAvatarClick={() => handleViewChatUserProfile(msg)}
                                    onFollow={shouldShowFollow ? () => handleFollowChatUser(chatUser) : undefined}
                                    isFollowed={followedUsers.has(chatUser.id)}
                                    onModerationClick={isBroadcaster && isModerationMode && msg.user !== currentUser.name && msg.user !== streamer.name ? () => handleOpenUserActions(msg) : undefined}
                                    isModerator={msg.isModerator}
                                />;
                            }
                            if (msg.type === 'follow' && msg.user && msg.followedUser) {
                                return <FollowChatMessage key={msg.id} follower={msg.user} followed={msg.followedUser} level={msg.level} />;
                            }
                            if (msg.type === 'friend_request' && msg.follower) {
                                return <FriendRequestNotification key={msg.id} followerName={msg.follower.name} onClick={onOpenFriendRequests} />;
                            }
                            return null;
                        })}
                    </div>
                </div>

                {chatInput.length > 0 && (
                    <div className="absolute bottom-20 left-0 px-3 pointer-events-none">
                        <div className="typing-bubble inline-block">{chatInput}</div>
                    </div>
                )}

                <footer className="p-3 pointer-events-auto">
                    <div className="flex items-center space-x-2">
                        <div className="flex-grow bg-black/40 rounded-full flex items-center pr-1.5" onClick={e => e.stopPropagation()}>
                            <input
                                type="text"
                                placeholder={t('streamRoom.sayHi')}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
                                className="flex-grow bg-transparent px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none"
                            />
                            <button onClick={handleSendMessage} className="bg-gray-500/50 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-gray-400/50 transition-colors"><SendIcon className="w-5 h-5 text-white" /></button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setGiftModalOpen(true); }} className="bg-black/40 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"><GiftIcon className="w-6 h-6 text-yellow-400" /></button>
                        {isBroadcaster ? (
                            <button onClick={(e) => { e.stopPropagation(); setIsToolsOpen(true); }} className="bg-black/40 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"><MoreIcon className="w-6 h-6 text-white" /></button>
                        ) : (
                            <button onClick={(e) => {
                                e.stopPropagation();
                                if (streamerUser) {
                                    onStartChatWithStreamer(streamerUser);
                                }
                            }} className="bg-black/40 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"><MessageIcon className="w-6 h-6 text-white" /></button>
                        )}
                    </div>
                </footer>
            </div>

            {/* 5. Modals & Overlays */}
            {/* FIX: Corrected typo for state setter from 'setIsOnlineUsersOpen' to 'setOnlineUsersOpen'. */}
            {isOnlineUsersOpen && <OnlineUsersModal onClose={() => setOnlineUsersOpen(false)} streamId={streamer.id} userId={currentUser.id} currentUser={currentUser} />}
            <ToolsModal
                isOpen={isToolsOpen}
                onClose={() => setIsToolsOpen(false)}
                onOpenCoHostModal={handleOpenCoHostModal}
                isPKBattleActive={false}
                onOpenBeautyPanel={handleOpenBeautyPanel}
                onOpenPrivateChat={(e) => { e.stopPropagation(); onOpenPrivateChat(); }}
                onOpenPrivateInviteModal={(e) => { e.stopPropagation(); onOpenPrivateInviteModal(); }}
                onOpenClarityPanel={handleOpenClarityPanel}
                isModerationActive={isModerationMode}
                onToggleModeration={(e) => { e.stopPropagation(); setIsModerationMode(prev => !prev); }}
                isPrivateStream={streamer.isPrivate}
                isMicrophoneMuted={liveSession?.isMicrophoneMuted ?? false}
                onToggleMicrophone={handleToggleMicrophone}
                isSoundMuted={liveSession?.isStreamMuted ?? false}
                onToggleSound={handleToggleSound}
                isAutoFollowEnabled={liveSession?.isAutoFollowEnabled ?? false}
                onToggleAutoFollow={handleToggleAutoFollow}
                isAutoPrivateInviteEnabled={isAutoPrivateInviteEnabled}
                onToggleAutoPrivateInvite={handleToggleAutoPrivateInvite}
            />
            {isBeautyPanelOpen && <BeautyEffectsPanel onClose={() => setBeautyPanelOpen(false)} currentUser={currentUser} addToast={addToast} videoRef={videoRef} />}
            <ResolutionPanel isOpen={isResolutionPanelOpen} onClose={() => setResolutionPanelOpen(false)} onSelectResolution={handleSelectResolution} currentResolution={currentResolution} />
            <CoHostModal isOpen={isCoHostModalOpen} onClose={() => setIsCoHostModalOpen(false)} onInvite={handleInvite} onOpenTimerSettings={handleOpenTimerSettings} currentUser={currentUser} addToast={addToast} streamId={streamer.id} />
            {isRankingOpen && <ContributionRankingModal onClose={() => setIsRankingOpen(false)} liveRanking={rankingData} currentUser={currentUser} />}

            <GiftModal
                isOpen={isGiftModalOpen}
                onClose={() => setGiftModalOpen(false)}
                userDiamonds={currentUser.diamonds ?? 0}
                onSendGift={handleSendGift}
                onRecharge={handleRecharge}
                gifts={gifts}
                receivedGifts={receivedGifts}
                isBroadcaster={isBroadcaster}
                onOpenVIPCenter={onOpenVIPCenter}
                isVIP={currentUser.isVIP || false}
                currentUser={currentUser}
            />
            <UserActionModal
                isOpen={userActionModalState.isOpen}
                onClose={handleCloseUserActions}
                user={userActionModalState.user}
                onViewProfile={(user) => { handleCloseUserActions(); onViewProfile(user); }}
                onMention={handleMentionUser}
                onMakeModerator={handleMakeModerator}
                onKick={handleKickUser}
            />
        </div>
    );
}

export default StreamRoom;


