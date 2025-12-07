import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, User, Streamer, ToastType, RankedUser, LiveSessionState } from '../types';
import { api } from '../services/api';
import { animationManager } from '../utils/AnimationManager';
import OnlineUsersModal from './live/OnlineUsersModal';
import ChatMessage from './live/ChatMessage';
import CoHostModal from './CoHostModal';
import EntryChatMessage from './live/EntryChatMessage';
import ChatScreen from './ChatScreen';
import ToolsModal from './ToolsModal';
import { GiftIcon, MessageIcon, SendIcon, MoreIcon, CloseIcon, PlusIcon, SoundWaveIcon, ViewerIcon, GoldCoinWithGIcon, HeartIcon, TrophyIcon, BellIcon, TranslateIcon, CalendarIcon, FanClubHeaderIcon } from './icons';
import ContributionRankingModal from './ContributionRankingModal';
import BeautyEffectsPanel from './live/BeautyEffectsPanel';
import ResolutionPanel from './live/ResolutionPanel';
import GiftModal from './live/GiftModal';
import GiftAnimationOverlay, { GiftPayload } from './live/GiftAnimationOverlay';
import UserActionModal from './UserActionModal';
import { webSocketManager } from '../services/websocket';
import FriendRequestNotification from './live/FriendRequestNotification';
import { RankedAvatar } from './live/RankedAvatar';
import FullScreenGiftAnimation from './live/FullScreenGiftAnimation';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../services/database';
import FanClubModal from './live/FanClubModal';
import JoinFanClubModal from './live/JoinFanClubModal';
import FanClubEntryMessage from './live/FanClubEntryMessage';
import UserMentionSuggestions from './live/UserMentionSuggestions';

interface ChatMessageType {
    id: number;
    type: 'chat' | 'entry' | 'friend_request' | 'follow' | 'fan_entry';
    user?: string;
    fullUser?: User;
    follower?: User;
    age?: number;
    gender?: 'male' | 'female' | 'not_specified';
    level?: number;
    message?: string | React.ReactNode;
    translatedText?: string;
    avatar?: string;
    followedUser?: string;
    isModerator?: boolean;
    activeFrameId?: string | null;
    frameExpiration?: string | null;
    fanClub?: { streamerId: string; streamerName: string; level: number; };
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
    onOpenFans: () => void;
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
    onOpenFanClubMembers: (streamer: User) => void;
}

const FollowChatMessage: React.FC<{ follower: string; followed: string }> = ({ follower, followed }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-purple-500/30 rounded-full p-1.5 px-3 flex items-center self-start text-xs shadow-md">
            <span className="text-purple-300 font-bold">{follower}</span>
            <span className="text-gray-200 ml-1.5">{t('streamRoom.followed')}</span>
            <span className="text-purple-300 font-bold ml-1.5">{followed}! 🎉</span>
        </div>
    );
};

// FIX: Added 'onOpenFanClubMembers' to props destructuring.
const StreamRoom: React.FC<StreamRoomProps> = ({ streamer, onRequestEndStream, onLeaveStreamView, onStartPKBattle, onViewProfile, currentUser, onOpenWallet, onFollowUser, onOpenPrivateChat, onOpenPrivateInviteModal, setActiveScreen, onStartChatWithStreamer, onOpenPKTimerSettings, onOpenFans, onOpenFriendRequests, gifts, receivedGifts, updateUser, liveSession, updateLiveSession, logLiveEvent, onStreamUpdate, refreshStreamRoomData, addToast, followingUsers, streamers, onSelectStream, onOpenVIPCenter, onOpenFanClubMembers }) => {
    const { t, i18n } = useTranslation();
    const language = i18n.language;
    const [isUiVisible, setIsUiVisible] = useState(true);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isBeautyPanelOpen, setBeautyPanelOpen] = useState(false);
    const [isCoHostModalOpen, setIsCoHostModalOpen] = useState(false);
    const [isOnlineUsersOpen, setOnlineUsersOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);
    const [isRankingOpen, setIsRankingOpen] = useState(false);
    const rankingModalRef = useRef<HTMLDivElement>(null);
    const [isResolutionPanelOpen, setResolutionPanelOpen] = useState(false);
    const [currentResolution, setCurrentResolution] = useState(streamer.quality || '480p');
    const [isGiftModalOpen, setGiftModalOpen] = useState(false);
    const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
    const [userActionModalState, setUserActionModalState] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
    const [isModerationMode, setIsModerationMode] = useState(false);
    const [isAutoPrivateInviteEnabled, setIsAutoPrivateInviteEnabled] = useState(liveSession?.isAutoPrivateInviteEnabled ?? false);
    const [onlineUsers, setOnlineUsers] = useState<(User & { value: number })[]>([]);
    const previousOnlineUsersRef = useRef<(User & { value: number })[]>([]);
    
    const [bannerGifts, setBannerGifts] = useState<(GiftPayload & { id: number })[]>([]);
    const nextGiftId = useRef(0);
    const [activeGiftAnimations, setActiveGiftAnimations] = useState<Array<GiftPayload & { id: number }>>([]);
    const animationRefs = useRef<{[key: number]: {canStart: boolean; checkInterval?: NodeJS.Timeout}}>({});
    const [currentFullscreenGift, setCurrentFullscreenGift] = useState<GiftPayload | null>(null);
    const [isFanClubModalOpen, setIsFanClubModalOpen] = useState(false);
    const [isJoinFanClubModalOpen, setIsJoinFanClubModalOpen] = useState(false);
    const [isChatInputFocused, setIsChatInputFocused] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);

    const handleNewGift = useCallback((giftData: GiftPayload) => {
        if (giftData.roomId !== streamer.id || giftData.fromUser.id === currentUser.id) {
            return; // Ignore gifts for other rooms or self-sent gifts (already handled optimistically)
        }

        // WebSocket já recebeu a notificação do backend, apenas atualiza UI
        // Não precisa chamar refreshStreamRoomData - o backend já persistiu e notificou via WebSocket
        postGiftChatMessage(giftData);

        const giftId = Date.now();
        const giftWithId = { ...giftData, id: giftId } as GiftPayload & { id: number };
        const id = `gift-${giftId}`;
        const ref = { canStart: true };
        animationRefs.current[id] = ref;
        setActiveGiftAnimations(prev => [giftWithId]);
        return () => { delete animationRefs.current[id]; };
    }, [streamer.id]);

    const isBroadcaster = streamer.hostId === currentUser.id;

    const isFollowed = useMemo(() => followingUsers.some(u => u.id === streamer.hostId), [followingUsers, streamer.hostId]);
    const isFanClubMember = useMemo(() => !!currentUser.fanClub && currentUser.fanClub.streamerId === streamer.hostId, [currentUser.fanClub, streamer.hostId]);
    const isJuFeFanClub = streamer.hostId === '40583726';

    const streamerUser: User = useMemo(() => ({
        id: streamer.hostId,
        identification: streamer.hostId,
        name: streamer.name,
        avatarUrl: streamer.avatar,
        coverUrl: `https://picsum.photos/seed/${streamer.id}/800/1600`,
        country: 'br',
        age: 23,
        gender: 'female',
        level: 1,
        xp: 0,
        location: streamer.location,
        distance: 'desconhecida',
        fans: 3,
        following: 0,
        receptores: 0,
        enviados: 0,
        topFansAvatars: [],
        isLive: true,
        diamonds: 50000,
        earnings: 125000,
        earnings_withdrawn: 0,
        bio: 'Amante de streams!',
        obras: [],
        curtidas: [],
        ownedFrames: [],
        activeFrameId: null,
        frameExpiration: null,
    }), [streamer]);

    const streamerDisplayUser = isBroadcaster ? currentUser : streamerUser;

    const remainingDays = getRemainingDays(streamerDisplayUser.frameExpiration);
    const activeFrame = (streamerDisplayUser.activeFrameId && remainingDays && remainingDays > 0)
        ? avatarFrames.find(f => f.id === streamerDisplayUser.activeFrameId)
        : null;
    const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
    const frameGlowClass = getFrameGlowClass(streamerDisplayUser.activeFrameId);
    
    const swipeStart = useRef<{ x: number, y: number } | null>(null);
    const minSwipeDistance = 50;

    const handlePointerDown = (clientX: number, clientY: number) => {
        if (isChatInputFocused) return;
        swipeStart.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = (e: React.PointerEvent | React.TouchEvent | { clientX: number, clientY: number }) => {
        // Se o modal de usuários online estiver aberto, não processa navegação
        if (isOnlineUsersOpen) {
            swipeStart.current = null;
            return;
        }

        if (!swipeStart.current) return;

        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
        const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

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
    
    const handleGiftAnimationEnd = useCallback((giftId: number) => {
        // Não faz nada, pois não queremos remover a notificação
        // Ela será substituída quando uma nova notificação for recebida
    }, []);

    useEffect(() => {
        const isFan = currentUser.fanClub && currentUser.fanClub.streamerId === streamer.hostId;
        const entryType = isFan ? 'fan_entry' : 'entry';
        const currentUserEntryMessage: ChatMessageType = {
            id: Date.now(),
            type: entryType,
            fullUser: currentUser,
        };
        setMessages([currentUserEntryMessage]);

        // Initial fetch to set baseline for other joiners
        api.getOnlineUsers(streamer.id).then(users => {
            if (users) {
                setOnlineUsers(users);
                updateLiveSession({ viewers: users.length });
            }
        });
    }, [currentUser, streamer.hostId, streamer.id, updateLiveSession]);

    const handleFullscreenGiftAnimationEnd = () => {
        if (currentFullscreenGift) {
            const newBanner = { ...currentFullscreenGift, id: nextGiftId.current++ };
            setBannerGifts(prev => [...prev, newBanner].slice(-5));
        }
        setCurrentFullscreenGift(null);
    };

    const handleNewMessage = useCallback(async (message: any) => {
        if (message.roomId === streamer.id) {
            if (message.user !== currentUser.name && message.type === 'chat' && typeof message.message === 'string') {
                try {
                    const translationResponse = await api.translate(message.message, language);
                    const messageWithTranslation = { ...message, translatedText: translationResponse.translatedText };
                    setMessages(prev => [...prev, messageWithTranslation]);
                } catch (error) {
                    console.error("Failed to translate message:", error);
                    setMessages(prev => [...prev, message]); // Add original on failure
                }
            } else {
                setMessages(prev => [...prev, message]);
            }
        }
    }, [streamer.id, currentUser.name, language]);

    useEffect(() => {
        const handleNewMessageEffect = () => {
            webSocketManager.on('newStreamMessage', handleNewMessage);
        };
        handleNewMessageEffect();

        return () => {
            webSocketManager.off('newStreamMessage', handleNewMessage);
        };
    }, [handleNewMessage]);

    useEffect(() => {
        const handleNewGiftEffect = () => {
            webSocketManager.on('newStreamGift', handleNewGift);
        };
        handleNewGiftEffect();

        return () => {
            webSocketManager.off('newStreamGift', handleNewGift);
        };
    }, [handleNewGift]);

    useEffect(() => {
        const handleFollowUpdate = (payload: { follower: User, followed: User, isUnfollow: boolean }) => {
            if (payload.isUnfollow) return; 

            const { follower, followed } = payload;
            
            const newMessage: ChatMessageType = (followed.id === currentUser.id)
                ? { id: Date.now(), type: 'friend_request', follower: follower }
                : { id: Date.now(), type: 'follow', user: follower.name, followedUser: followed.name, avatar: follower.avatarUrl };

            setMessages(prev => [...prev, newMessage]);
        };

        webSocketManager.on('followUpdate', handleFollowUpdate);

        return () => {
            webSocketManager.off('followUpdate', handleFollowUpdate);
        };
    }, [currentUser.id]);

    useEffect(() => {
        const handleAutoInviteStateUpdate = (payload: { roomId: string; isEnabled: boolean }) => {
            if (payload.roomId === streamer.id) {
                setIsAutoPrivateInviteEnabled(payload.isEnabled);
            }
        };
        webSocketManager.on('autoInviteStateUpdate', handleAutoInviteStateUpdate);

        return () => {
            webSocketManager.off('autoInviteStateUpdate', handleAutoInviteStateUpdate);
        };
    }, [streamer.id]);

    useEffect(() => {
        const handleOnlineUsersUpdate = (data: { roomId: string; users: (User & { value: number })[] }) => {
            if (data.roomId === streamer.id) {
                const newUsers = data.users;
                setOnlineUsers(newUsers);
                updateLiveSession({ viewers: newUsers.length });
    
                const previousUsers = previousOnlineUsersRef.current;
                if (previousUsers.length > 0) {
                    const previousUserIds = new Set(previousUsers.map(u => u.id));
                    const newlyJoinedUsers = newUsers.filter(u => !previousUserIds.has(u.id) && u.id !== currentUser.id);
    
                    if (newlyJoinedUsers.length > 0) {
                        const entryMessages: ChatMessageType[] = newlyJoinedUsers.map(user => {
                            const isFan = user.fanClub && user.fanClub.streamerId === streamer.hostId;
                            return {
                                id: Date.now() + Math.random(),
                                type: isFan ? 'fan_entry' : 'entry',
                                fullUser: user,
                            };
                        });
                        setMessages(prev => [...prev, ...entryMessages]);
                    }
                }
                previousOnlineUsersRef.current = newUsers;
            }
        };
        webSocketManager.on('onlineUsersUpdate', handleOnlineUsersUpdate);

        return () => {
            webSocketManager.off('onlineUsersUpdate', handleOnlineUsersUpdate);
        };
    }, [currentUser.id, streamer.id, streamer.hostId, updateLiveSession]);

    const handleTogglePrivacy = async () => {
        if (!isBroadcaster) return;
        const newPrivacy = !streamer.isPrivate;
        try {
            await api.updateStream(streamer.id, { isPrivate: newPrivacy });
            onStreamUpdate({ isPrivate: newPrivacy });
        } catch (error) {
            console.error("Failed to update privacy:", error);
        }
    };

    const handleFollowStreamer = () => {
        onFollowUser(streamerUser, streamer.id);
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
        const { success, stream } = await api.updateVideoQuality(streamer.id, resolution);
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
            coverUrl: `https://picsum.photos/seed/${user.id}/800/1200`, 
            country: 'br', 
            gender: user.gender || 'not_specified', 
            level: user.level || 1, 
            xp: 0,
            age: user.age || 18, 
            location: 'Brasil', 
            distance: 'desconhecida', 
            fans: Math.floor(Math.random() * 10000),
            following: Math.floor(Math.random() * 500),
            receptores: Math.floor(Math.random() * 100000),
            enviados: Math.floor(Math.random() * 5000),
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
            fanClub: user.fanClub,
        };
    };

    const handleViewChatUserProfile = (user: ChatMessageType) => {
        if (!user.user || !user.avatar) return;
        const userProfile = constructUserFromMessage(user);
        onViewProfile(userProfile);
    };

    const postGiftChatMessage = (payload: GiftPayload) => {
        const { fromUser, gift, toUser, quantity } = payload;
        
        const totalValue = (gift.price || 0) * quantity;
        const giftIcon = gift.component ? 
            React.cloneElement(gift.component as React.ReactElement<any>, { className: "w-5 h-5 inline-block ml-1" }) : 
            <span className="ml-1">{gift.icon}</span>;

        // Mensagem de notificação para os outros usuários
        const giftNotification: ChatMessageType = {
            id: Date.now() + Math.random(),
            type: 'chat',
            user: fromUser.name,
            level: fromUser.level,
            message: (
                <span className="inline-flex items-center">
                    🎁 <span className="font-semibold">{fromUser.name}</span> enviou {giftIcon} para <span className="font-semibold">{toUser.name}</span> — {totalValue} moedas.
                </span>
            ),
            avatar: fromUser.avatarUrl,
            activeFrameId: fromUser.activeFrameId,
            frameExpiration: fromUser.frameExpiration,
            fanClub: fromUser.fanClub,
        };

        // Mensagem de confirmação apenas para o remetente
        const confirmationMessage: ChatMessageType = {
            id: Date.now() + Math.random() + 1, // ID único diferente
            type: 'chat',
            user: 'Sistema',
            level: 0,
            message: (
                <span className="inline-flex items-center text-green-400">
                    ✓ Você enviou {quantity > 1 ? `${quantity}x` : 'um'} {giftIcon} para <span className="font-semibold">{toUser.name}</span> — {totalValue} moedas.
                </span>
            ),
            avatar: '',
            isModerator: true
        };

        // Adiciona as mensagens ao chat
        setMessages(prev => [...prev, giftNotification, confirmationMessage]);
    };

    const handleSendGift = async (gift: Gift, quantity: number): Promise<User | null> => {
        const totalCost = (gift.price || 0) * quantity;
        if (currentUser.diamonds < totalCost) {
            handleRecharge();
            return null;
        }
    
        // Optimistic UI Update for the sender
        const giftPayload: GiftPayload = {
            fromUser: currentUser,
            toUser: { id: streamer.hostId, name: streamer.name },
            gift,
            quantity,
            roomId: streamer.id
        };
        
        postGiftChatMessage(giftPayload);
        // Garante que o giftWithId tenha um id obrigatório
        const giftWithId = { ...giftPayload, id: Date.now() } as GiftPayload & { id: number };
        setActiveGiftAnimations(prev => [...prev, giftWithId]);
    
        // Now, call the API in the background
        try {
            const { success, error, updatedSender } = await api.sendGift(currentUser.id, streamer.id, gift.name, quantity);
    
            if (success && updatedSender) {
                updateUser(updatedSender);
    
                if (gift.triggersAutoFollow && !isFollowed) {
                    onFollowUser(streamerUser, streamer.id);
                }
                
                if (liveSession) {
                    const coinsAdded = (gift.price || 0) * quantity;
                    updateLiveSession({ coins: (liveSession.coins || 0) + coinsAdded });
                }

                // Não precisa chamar refreshStreamRoomData - o backend já persistiu e vai disparar WebSocket
                // O WebSocket vai atualizar os dados quando necessário

                const wasNotFan = !currentUser.fanClub || currentUser.fanClub.streamerId !== streamer.hostId;
                const isNowFan = updatedSender.fanClub && updatedSender.fanClub.streamerId === streamer.hostId;

                if (wasNotFan && isNowFan) {
                    addToast(ToastType.Success, "Bem-vindo ao fã-clube!");
                    setIsFanClubModalOpen(true);
                }

                return updatedSender;
            } else {
                throw new Error(error || "Failed to send gift on server");
            }
        } catch (error) {
            console.error("Failed to send gift to server:", error);
            addToast(ToastType.Error, (error as Error).message || "Falha ao enviar o presente.");
            // Fetch the latest user data to revert diamond count on failure
            api.getCurrentUser().then(user => {
                if (user) updateUser(user);
            });
            return null;
        }
    };
    
    const handleRecharge = () => {
        setGiftModalOpen(false);
        onOpenWallet('Diamante');
    };

    const handleOpenUserActions = (chatUser: ChatMessageType) => {
        if (!isBroadcaster || !chatUser.user) return;
        if(chatUser.user === streamer.name || chatUser.user === currentUser.name) return;
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
    
    const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setChatInput(value);
        
        // Verifica se o usuário está digitando @ para mencionar alguém
        const atIndex = value.lastIndexOf('@');
        if (atIndex !== -1) {
            const query = value.substring(atIndex + 1).toLowerCase();
            setMentionQuery(query);
            setShowMentionSuggestions(query.length > 0);
        } else {
            setShowMentionSuggestions(false);
        }
    };

    const handleSendMessage = async (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        
        const message: ChatMessageType = {
            id: Date.now(),
            type: 'chat',
            user: currentUser.name,
            level: currentUser.level,
            message: chatInput,
            avatar: currentUser.avatarUrl,
            gender: currentUser.gender,
            age: currentUser.age,
            activeFrameId: currentUser.activeFrameId || undefined,
            frameExpiration: currentUser.frameExpiration || undefined,
            fanClub: currentUser.fanClub,
            fullUser: currentUser
        };

        try {
            await api.sendStreamMessage(streamer.id, currentUser.id, chatInput);
        } catch (error) {
            console.error('Falha ao enviar mensagem da live via API:', error);
        }

        // Adiciona a mensagem ao chat localmente
        setMessages(prev => [...prev, message]);
        setChatInput('');
    };

    const handleMentionSelect = (username: string) => {
        const words = chatInput.split(' ');
        words.pop();
        words.push(`@${username} `);
        const newChatInput = words.join(' ');
        
        setChatInput(newChatInput);
        setShowMentionSuggestions(false);
        setMentionQuery('');
        
        chatInputRef.current?.focus();
    };

    const mentionSuggestions = useMemo(() => {
        if (!showMentionSuggestions || !mentionQuery) return [];
        return onlineUsers.filter(u => 
            u.name.toLowerCase().includes(mentionQuery) && u.id !== currentUser.id
        ).slice(0, 5);
    }, [mentionQuery, onlineUsers, currentUser.id, showMentionSuggestions]);

    const MemoizedGiftAnimation = useMemo(
        () => React.memo(GiftAnimationOverlay, (prevProps, nextProps) => {
            return prevProps.giftPayload.id === nextProps.giftPayload.id;
        }),
        []
    );

    return (
        <div className="absolute inset-0 bg-gray-900 text-white font-sans z-10"
            onMouseDown={(e) => {
                e.stopPropagation();
                handlePointerDown(e.clientX, e.clientY);
            }}
            onMouseUp={(e) => {
                e.stopPropagation();
                handlePointerUp(e);
            }}
            onTouchStart={(e) => {
                e.stopPropagation();
                handlePointerDown(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
            }}
            onTouchEnd={(e) => {
                e.stopPropagation();
                handlePointerUp(e);
            }}
        >
            <img src={streamerUser.coverUrl} key={streamerUser.coverUrl} className="absolute inset-0 w-full h-full object-cover" alt="Stream background" />
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-black/70 pointer-events-none transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0'}`}></div>

            <div className="absolute top-24 left-3 z-30 pointer-events-none flex flex-col-reverse items-start">
                {activeGiftAnimations.map((gift, index) => (
                    <div key={`gift-${gift.id}-${index}`} className="mb-2">
                        <MemoizedGiftAnimation
                            giftPayload={gift}
                            onAnimationEnd={handleGiftAnimationEnd}
                        />
                    </div>
                ))}
            </div>
            
            {currentFullscreenGift && (
                <FullScreenGiftAnimation
                    payload={currentFullscreenGift}
                    onEnd={handleFullscreenGiftAnimationEnd}
                />
            )}

            <header className={`p-3 bg-transparent absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex justify-between items-start">
                    {/* Left side */}
                    <div className="flex items-start space-x-2">
                        <div className="flex flex-col space-y-2">
                            {/* Streamer Info */}
                             <div className={`w-fit relative overflow-hidden flex items-center ${isJuFeFanClub ? 'bg-pink-600/90 rounded-2xl' : 'bg-black/40 rounded-full'} p-1 pr-2 space-x-2`}>
                                <button onClick={(e) => { e.stopPropagation(); onViewProfile(streamerDisplayUser); }} className="flex items-center space-x-2 text-left">
                                    <div className="relative w-10 h-10 flex items-center justify-center">
                                        <div className="live-ring-animated">
                                        <img src={streamerDisplayUser.avatarUrl} alt={streamerDisplayUser.name} className="w-8 h-8 rounded-full object-contain bg-black" />
                                        </div>
                                        {ActiveFrameComponent && (
                                            <div className={`absolute inset-0 w-10 h-10 pointer-events-none ${frameGlowClass}`}>
                                                <ActiveFrameComponent />
                                            </div>
                                        )}
                                    </div>
                                    <div className="pr-1">
                                        <p className="text-white font-bold text-sm">{streamerDisplayUser.name}</p>
                                        <div className="flex items-center space-x-1 text-gray-300 text-xs">
                                            <ViewerIcon className="w-4 h-4" />
                                            <span>{liveSession?.viewers.toLocaleString() || '0'}</span>
                                            {isJuFeFanClub && (
                                                <HeartIcon className="w-3 h-3 text-white ml-1.5" fill="currentColor" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                                {isBroadcaster || isFollowed ? (
                                    <button onClick={(e) => { e.stopPropagation(); setIsFanClubModalOpen(true); }} className="shrink-0">
                                        <FanClubHeaderIcon className="w-9 h-9" />
                                    </button>
                                ) : (
                                    <button onClick={(e) => { e.stopPropagation(); handleFollowStreamer(); }} className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white shrink-0">
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {/* G and Heart icons */}
                            <div className="flex items-center space-x-2 pl-1">
                                <button onClick={(e) => { e.stopPropagation(); setIsRankingOpen(true); }} className="flex items-center bg-black/40 rounded-full px-2 py-1 space-x-1 text-xs cursor-pointer">
                                    <GoldCoinWithGIcon className="w-4 h-4" />
                                    <span className="text-white font-semibold">{liveSession?.coins.toLocaleString() || '0'}</span>
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
                            <button onClick={(e) => { e.stopPropagation(); setOnlineUsersOpen(true); }} className="flex items-center bg-black/40 rounded-full px-2.5 py-1.5 space-x-1 text-sm cursor-pointer">
                                <BellIcon className="w-5 h-5 text-yellow-400" />
                                <span className="text-white font-semibold">{onlineUsers.length}</span>
                            </button>
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

            <div 
                className={`absolute bottom-0 left-0 right-0 w-full transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
            >
                <div ref={chatContainerRef} className="max-h-[33vh] h-full overflow-y-auto no-scrollbar flex flex-col pointer-events-auto px-3">
                    <div className="space-y-2 mt-auto">
                         {messages.map((msg) => {
                            if (msg.type === 'fan_entry' && msg.fullUser) {
                                return <FanClubEntryMessage key={msg.id} user={msg.fullUser} streamer={streamerUser} />;
                            }
                            if (msg.type === 'entry' && msg.fullUser) {
                                return <EntryChatMessage 
                                    key={msg.id} 
                                    user={msg.fullUser} 
                                    currentUser={currentUser}
                                    onClick={onViewProfile}
                                    onFollow={onFollowUser}
                                    isFollowed={followingUsers.some(u => u.id === msg.fullUser!.id)}
                                    streamer={streamer} />;
                            }
                            if (msg.type === 'chat' && msg.user && msg.avatar) {
                                const chatUser = constructUserFromMessage(msg);
                                
                                return <ChatMessage 
                                    key={msg.id} 
                                    userObject={chatUser}
                                    message={msg.message}
                                    translatedText={msg.translatedText}
                                    onAvatarClick={() => handleViewChatUserProfile(msg)}
                                    streamerId={streamer.hostId}
                                />;
                            }
                            if (msg.type === 'follow' && msg.user && msg.followedUser) {
                                return <FollowChatMessage key={msg.id} follower={msg.user} followed={msg.followedUser} />;
                            }
                            if (msg.type === 'friend_request' && msg.follower) {
                                return <FriendRequestNotification key={msg.id} followerName={msg.follower.name} onClick={onOpenFriendRequests} />;
                            }
                            return null;
                        })}
                    </div>
                </div>

                <footer className="relative p-3 pointer-events-auto">
                    {showMentionSuggestions && mentionSuggestions.length > 0 && (
                        <UserMentionSuggestions users={mentionSuggestions} onSelect={handleMentionSelect} />
                    )}
                    {chatInput.length > 0 && isChatInputFocused && !showMentionSuggestions && (
                        <div className="absolute bottom-full left-0 px-3 pb-1 w-full pointer-events-none">
                            <div className="typing-bubble inline-block">{chatInput}</div>
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <div className="flex-grow bg-black/40 rounded-full flex items-center pr-1.5">
                            <input 
                                ref={chatInputRef}
                                type="text" 
                                placeholder={t('diga oi')} 
                                value={chatInput}
                                onChange={handleChatInputChange}
                                onKeyPress={(e) => e.key === 'Enter' && handleNewMessage(e)}
                                onFocus={() => setIsChatInputFocused(true)}
                                onBlur={() => setTimeout(() => setIsChatInputFocused(false), 200)}
                                className="flex-grow bg-transparent px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none" 
                            />
                            <button onClick={handleSendMessage} className="bg-gray-500/50 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-gray-400/50 transition-colors"><SendIcon className="w-5 h-5 text-white" /></button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setGiftModalOpen(true); }} className="bg-black/40 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"><GiftIcon className="w-6 h-6 text-yellow-400" /></button>
                         {isBroadcaster ? (
                            <button onClick={(e) => { e.stopPropagation(); setIsToolsOpen(true); }} className="bg-black/40 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"><MoreIcon className="w-6 h-6 text-white" /></button>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); onStartChatWithStreamer(streamerUser); }} className="bg-black/40 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"><MessageIcon className="w-6 h-6 text-white" /></button>
                        )}
                    </div>
                </footer>
            </div>
            
            {isOnlineUsersOpen && <OnlineUsersModal onClose={() => setOnlineUsersOpen(false)} streamId={streamer.id} />}
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
            {isBeautyPanelOpen && <BeautyEffectsPanel onClose={() => setBeautyPanelOpen(false)} currentUser={currentUser} addToast={addToast} />}
            <ResolutionPanel isOpen={isResolutionPanelOpen} onClose={() => setResolutionPanelOpen(false)} onSelectResolution={handleSelectResolution} currentResolution={currentResolution} />
            <CoHostModal isOpen={isCoHostModalOpen} onClose={() => setIsCoHostModalOpen(false)} onInvite={handleInvite} onOpenTimerSettings={handleOpenTimerSettings} currentUser={currentUser} addToast={addToast} streamId={streamer.id} />
            {isRankingOpen && (
                <div 
                    onTouchMove={(e) => {
                        // Impede a propagação do gesto de rolagem para o componente pai
                        e.stopPropagation();
                        e.preventDefault();
                    }}
                    onTouchStart={(e) => {
                        // Impede a propagação do toque para o componente pai
                        e.stopPropagation();
                    }}
                >
                    <ContributionRankingModal 
                        onClose={() => setIsRankingOpen(false)} 
                        liveRanking={onlineUsers} 
                    />
                </div>
            )}
            
            <GiftModal
                isOpen={isGiftModalOpen}
                onClose={() => setGiftModalOpen(false)}
                userDiamonds={currentUser.diamonds || 0}
                onSendGift={handleSendGift}
                onRecharge={handleRecharge}
                isVIP={currentUser.isVIP || false}
                onOpenVIPCenter={onOpenVIPCenter}
                gifts={gifts}
                receivedGifts={receivedGifts}
                isBroadcaster={isBroadcaster}
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
             <FanClubModal 
                isOpen={isFanClubModalOpen}
                onClose={() => setIsFanClubModalOpen(false)}
                streamer={streamerDisplayUser}
                isMember={isFanClubMember}
                currentUser={currentUser}
                onConfirmJoin={() => {
                    setIsFanClubModalOpen(false);
                    setIsJoinFanClubModalOpen(true);
                }}
                onOpenMembers={onOpenFanClubMembers}
            />
            <JoinFanClubModal
                isOpen={isJoinFanClubModalOpen}
                onClose={() => setIsJoinFanClubModalOpen(false)}
                onConfirm={async () => {
                    setIsJoinFanClubModalOpen(false);
                    const fanClubGift = gifts.find(g => g.name === 'Sinal de Luz do Ventilador');
                    if (fanClubGift) {
                        const updatedUser = await handleSendGift(fanClubGift, 1);
                        if (updatedUser) {
                            addToast(ToastType.Success, "Bem-vindo ao fã-clube!");
                            setIsFanClubModalOpen(true);
                        }
                    } else {
                        addToast(ToastType.Error, "Presente de fã-clube não encontrado.");
                    }
                }}
            />
        </div>
    );
}

// FIX: Add 'export default' to make StreamRoom the default export of this module.
export default StreamRoom;
