

import React, { useState, useEffect, useRef, useMemo } from 'react';
import OnlineUsersModal from './live/OnlineUsersModal';
import ChatMessage from './live/ChatMessage';
import CoHostModal from './CoHostModal';
import EntryChatMessage from './live/EntryChatMessage';
import ChatScreen from './ChatScreen';
import ToolsModal from './ToolsModal';
import { GiftIcon, MessageIcon, SendIcon, MoreIcon, CloseIcon, PlusIcon, SoundWaveIcon, ViewerIcon, GoldCoinWithGIcon, HeartIcon, TrophyIcon, BellIcon } from './icons';
import { Streamer, User, Gift, ToastType, RankedUser, LiveSessionState } from '../types';
import ContributionRankingModal from './ContributionRankingModal';
import BeautyEffectsPanel from './live/BeautyEffectsPanel';
import ResolutionPanel from './live/ResolutionPanel';
import GiftModal from './live/GiftModal';
import GiftAnimationOverlay, { GiftPayload } from './live/GiftAnimationOverlay';
import { useTranslation } from '../i18n';
import { api } from '../services/api';
import UserActionModal from './UserActionModal';
import { webSocketManager } from '../services/websocket';
import FriendRequestNotification from './live/FriendRequestNotification';

interface ChatMessageType {
    id: number;
    type: 'chat' | 'entry' | 'friend_request' | 'follow';
    user?: string;
    follower?: User;
    age?: number;
    gender?: 'male' | 'female' | 'not_specified';
    level?: number;
    message?: string | React.ReactNode;
    avatar?: string;
    followedUser?: string;
    isModerator?: boolean;
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
    onOpenVIPCenter: () => void;
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
}

const FollowChatMessage: React.FC<{ follower: string; followed: string }> = ({ follower, followed }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-purple-500/30 rounded-full p-1.5 px-3 flex items-center self-start text-xs">
            <span className="text-purple-300 font-bold">{follower}</span>
            <span className="text-gray-200 ml-1.5">{t('streamRoom.followed')}</span>
            <span className="text-purple-300 font-bold ml-1.5">{followed}! 🎉</span>
        </div>
    );
};

const StreamRoom: React.FC<StreamRoomProps> = ({ streamer, onRequestEndStream, onLeaveStreamView, onStartPKBattle, onViewProfile, currentUser, onOpenWallet, onFollowUser, onOpenPrivateChat, onOpenPrivateInviteModal, setActiveScreen, onStartChatWithStreamer, onOpenPKTimerSettings, onOpenVIPCenter, onOpenFans, onOpenFriendRequests, gifts, receivedGifts, updateUser, liveSession, updateLiveSession, logLiveEvent, onStreamUpdate, refreshStreamRoomData, addToast, followingUsers, streamers, onSelectStream }) => {
    const { t } = useTranslation();
    const [isUiVisible, setIsUiVisible] = useState(true);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isBeautyPanelOpen, setBeautyPanelOpen] = useState(false);
    const [isCoHostModalOpen, setIsCoHostModalOpen] = useState(false);
    const [isOnlineUsersOpen, setOnlineUsersOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isRankingOpen, setIsRankingOpen] = useState(false);
    const [isResolutionPanelOpen, setResolutionPanelOpen] = useState(false);
    const [currentResolution, setCurrentResolution] = useState(streamer.quality || '480p');
    const [isGiftModalOpen, setGiftModalOpen] = useState(false);
    const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
    const [userActionModalState, setUserActionModalState] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
    const [isModerationMode, setIsModerationMode] = useState(false);
    const [isAutoPrivateInviteEnabled, setIsAutoPrivateInviteEnabled] = useState(liveSession?.isAutoPrivateInviteEnabled ?? false);
    const [onlineUsers, setOnlineUsers] = useState<(User & { value: number })[]>([]);

    const [effectsQueue, setEffectsQueue] = useState<GiftPayload[]>([]);
    const [currentEffect, setCurrentEffect] = useState<GiftPayload | null>(null);

    const isBroadcaster = streamer.hostId === currentUser.id;

    const isFollowed = useMemo(() => followingUsers.some(u => u.id === streamer.hostId), [followingUsers, streamer.hostId]);

    const streamerUser: User = useMemo(() => ({
        id: streamer.hostId,
        identification: streamer.hostId,
        name: streamer.name,
        avatarUrl: streamer.avatar,
        coverUrl: `https://picsum.photos/seed/${streamer.id}/400/800`,
        country: 'br',
        age: 23,
        gender: 'female',
        level: 1,
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
        // @FIX: Added missing 'earnings_withdrawn' property.
        earnings_withdrawn: 0,
        bio: 'Amante de streams!',
        obras: [],
        curtidas: [],
        xp: 0,
        ownedFrames: [],
        activeFrameId: null,
        frameExpiration: null,
    }), [streamer]);
    
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

    useEffect(() => {
        if (isBroadcaster) {
            const timer = setTimeout(() => {
                const fakeUserMessage: ChatMessageType = {
                    id: Date.now(),
                    type: 'chat',
                    user: 'Espectador_Teste',
                    level: 8,
                    message: "Olá! Que live incrível!",
                    avatar: 'https://i.pravatar.cc/150?img=51',
                    gender: 'female',
                    age: 22
                };
                setMessages(prev => [...prev, fakeUserMessage]);
            }, 4000); // User sends a message after 4 seconds
    
            return () => clearTimeout(timer);
        }
    }, [isBroadcaster]);
    
    useEffect(() => {
        const handleOnlineUsersUpdate = (data: { roomId: string, users: (User & { value: number })[] }) => {
            if (data.roomId === streamer.id) {
                setOnlineUsers(data.users);
            }
        };
        webSocketManager.on('onlineUsersUpdate', handleOnlineUsersUpdate);
    
        // Initial fetch
        api.getOnlineUsers(streamer.id).then(users => {
            if (users) {
                setOnlineUsers(users);
            }
        });
    
        return () => {
            webSocketManager.off('onlineUsersUpdate', handleOnlineUsersUpdate);
        };
    }, [streamer.id]);

    useEffect(() => {
        const handleViewerUpdate = (data: { roomId: string, count: number }) => {
            if (data.roomId === streamer.id) {
                updateLiveSession({ viewers: data.count });
            }
        };
        webSocketManager.on('onlineUsersUpdate', handleViewerUpdate);

        const handleNewMessage = (message: any) => {
            if (message.roomId === streamer.id) {
                setMessages(prev => [...prev, message]);
            }
        };
        webSocketManager.on('newStreamMessage', handleNewMessage);

        const handleNewGift = (payload: GiftPayload) => {
            console.log('[STREAM ROOM] New gift received via WS:', payload);
            if (payload.roomId !== streamer.id) return;
        
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
            };
            setMessages(prev => [...prev, giftMessage]);
            if(payload.fromUser.id !== currentUser.id) {
                setEffectsQueue(prev => [...prev, payload]);
            }
        };
        webSocketManager.on('newStreamGift', handleNewGift);

        const handleFollowUpdate = (payload: { follower: User, followed: User, isUnfollow: boolean }) => {
            if (payload.isUnfollow) return; 

            const { follower, followed } = payload;
            
            const newMessage: ChatMessageType = (followed.id === currentUser.id)
                ? { id: Date.now(), type: 'friend_request', follower: follower }
                : { id: Date.now(), type: 'follow', user: follower.name, followedUser: followed.name, avatar: follower.avatarUrl };

            setMessages(prev => [...prev, newMessage]);
        };

        webSocketManager.on('followUpdate', handleFollowUpdate);
        
        const handleAutoInviteStateUpdate = (payload: { roomId: string; isEnabled: boolean }) => {
            if (payload.roomId === streamer.id) {
                setIsAutoPrivateInviteEnabled(payload.isEnabled);
            }
        };
        webSocketManager.on('autoInviteStateUpdate', handleAutoInviteStateUpdate);


        return () => {
            webSocketManager.off('onlineUsersUpdate', handleViewerUpdate);
            webSocketManager.off('newStreamMessage', handleNewMessage);
            webSocketManager.off('newStreamGift', handleNewGift);
            webSocketManager.off('followUpdate', handleFollowUpdate);
            webSocketManager.off('autoInviteStateUpdate', handleAutoInviteStateUpdate);
        };
    }, [streamer.id, updateLiveSession, currentUser.id, t, onOpenFriendRequests]);


    useEffect(() => {
        if (!currentEffect && effectsQueue.length > 0) {
            const nextInQueue = effectsQueue[0];
            setCurrentEffect(nextInQueue);
            setEffectsQueue(prev => prev.slice(1));
        }
    }, [currentEffect, effectsQueue]);

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
            age: currentUser.age
        };
        setMessages(prev => [...prev, messagePayload]);
        setChatInput('');
    };

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
            coverUrl: `https://picsum.photos/seed/${user.id}/400/600`, 
            country: 'br', 
            gender: user.gender || 'not_specified', 
            level: user.level || 1, 
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
            // @FIX: Added missing 'earnings_withdrawn' property.
            earnings_withdrawn: 0, 
            bio: 'Usuário da plataforma', 
            obras: [], 
            curtidas: [],
            xp: 0,
            ownedFrames: [],
            activeFrameId: null,
            frameExpiration: null, 
        };
    };

    const handleViewChatUserProfile = (user: ChatMessageType) => {
        if (!user.user || !user.avatar) return;
        const userProfile = constructUserFromMessage(user);
        onViewProfile(userProfile);
    };

    const handleSendGift = async (gift: Gift, quantity: number) => {
        const { success, error, updatedSender, updatedReceiver } = await api.sendGift(currentUser.id, streamer.id, gift.name, quantity);

        if (success && updatedSender && updatedReceiver) {
            updateUser(updatedSender);
            updateUser(updatedReceiver);
            
            if (gift.triggersAutoFollow && !isFollowed) {
                onFollowUser(streamerUser, streamer.id);
            }

            const coinsAdded = (gift.price || 0) * quantity;
            if (liveSession) {
                updateLiveSession({ coins: liveSession.coins + coinsAdded });
                logLiveEvent('gift', { from: currentUser.id, to: streamer.hostId, gift: gift.name, coins: coinsAdded });
            }
            refreshStreamRoomData(streamer.hostId);

            const giftPayload: GiftPayload = {
                fromUser: currentUser,
                toUser: { id: streamer.hostId, name: streamer.name },
                gift,
                quantity,
                roomId: streamer.id
            };
            setEffectsQueue(prev => [...prev, giftPayload]);

            webSocketManager.sendStreamGift(streamer.id, gift, quantity);

        } else if (error === 'Not enough diamonds') {
            handleRecharge();
        }
    };
    
    const handleRecharge = () => {
        setGiftModalOpen(false);
        onOpenWallet('Diamante');
    };

    const handleOpenUserActions = (chatUser: ChatMessageType) => {
        if (!isBroadcaster || !chatUser.user) return; // Only broadcaster can open
        if(chatUser.user === streamer.name || chatUser.user === currentUser.name) return; // Can't moderate self
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
            // The state will be updated via WebSocket broadcast
            addToast(ToastType.Success, newAutoInviteState ? 'Convite automático ativado.' : 'Convite automático desativado.');
        } catch (error) {
            addToast(ToastType.Error, "Falha ao alterar a configuração.");
        }
    };


    return (
        <div className="absolute inset-0 bg-gray-900 text-white font-sans z-10"
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseUp={(e) => handlePointerUp(e.clientX, e.clientY)}
            onTouchStart={(e) => handlePointerDown(e.targetTouches[0].clientX, e.targetTouches[0].clientY)}
            onTouchEnd={(e) => handlePointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
        >
            <img src={streamerUser.coverUrl} key={streamerUser.coverUrl} className="absolute inset-0 w-full h-full object-cover" alt="Stream background" />
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-black/70 pointer-events-none transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0'}`}></div>

            <GiftAnimationOverlay 
                key={currentEffect ? currentEffect.fromUser.id + currentEffect.gift.name + Date.now() : 'no-effect'}
                giftPayload={currentEffect}
                onAnimationEnd={() => setCurrentEffect(null)}
            />

            <header className={`p-3 bg-transparent absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex justify-between items-start">
                    {/* Left side */}
                    <div className="flex items-start space-x-2">
                        <div className="flex flex-col space-y-2">
                            {/* Streamer Info */}
                            <button onClick={(e) => { e.stopPropagation(); onViewProfile(streamerUser); }} className="flex items-center bg-black/40 rounded-full p-1 pr-3 space-x-2 text-left">
                                <div className="live-ring-animated">
                                  <img src={streamer.avatar} alt={streamer.name} className="w-8 h-8 rounded-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">{streamer.name}</p>
                                    <div className="flex items-center space-x-1 text-gray-300 text-xs">
                                        <ViewerIcon className="w-4 h-4" />
                                        <span>{liveSession?.viewers.toLocaleString() || '0'}</span>
                                    </div>
                                </div>
                            </button>
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
                            {onlineUsers.slice(0, 2).filter(u => u.id !== currentUser.id).map((user) => (
                                <button key={user.id} onClick={(e) => { e.stopPropagation(); onViewProfile(user); }}>
                                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                </button>
                            ))}
                            {/* Current User Avatar */}
                            <button onClick={(e) => { e.stopPropagation(); onViewProfile(currentUser); }}>
                                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover" />
                            </button>
                            
                            {/* Notifications / Viewers button */}
                            <button onClick={(e) => { e.stopPropagation(); setIsOnlineUsersOpen(true); }} className="flex items-center bg-black/40 rounded-full px-2.5 py-1.5 space-x-1 text-sm cursor-pointer">
                                <BellIcon className="w-5 h-5 text-yellow-400" />
                                <span className="text-white font-semibold">{onlineUsers.length}</span>
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

            <div className={`absolute bottom-0 left-0 right-0 w-full p-3 transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div ref={chatContainerRef} className="max-h-[33vh] h-full overflow-y-auto no-scrollbar flex flex-col justify-end pointer-events-auto">
                    <div className="space-y-2">
                         {messages.map((msg) => {
                            if (msg.type === 'entry') return <EntryChatMessage key={msg.id} user={msg.user!} avatar={msg.avatar!} />;
                            if (msg.type === 'chat' && msg.user && msg.avatar) {
                                const chatUser = constructUserFromMessage(msg);
                                const shouldShowFollow = !isBroadcaster && chatUser.id !== currentUser.id && chatUser.name !== streamer.name;
                                
                                return <ChatMessage 
                                    key={msg.id} 
                                    user={msg.user!} 
                                    level={msg.level!} 
                                    message={msg.message} 
                                    avatarUrl={msg.avatar!} 
                                    onAvatarClick={() => handleViewChatUserProfile(msg)} 
                                    onFollow={shouldShowFollow ? () => handleFollowChatUser(chatUser) : undefined}
                                    isFollowed={followedUsers.has(chatUser.id)}
                                    onModerationClick={isBroadcaster && isModerationMode && msg.user !== currentUser.name && msg.user !== streamer.name ? () => handleOpenUserActions(msg) : undefined}
                                    isModerator={msg.isModerator}
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

                <footer className="pt-3 pointer-events-auto">
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
                            <button onClick={(e) => { e.stopPropagation(); onStartChatWithStreamer(streamerUser); }} className="bg-black/40 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"><MessageIcon className="w-6 h-6 text-white" /></button>
                        )}
                    </div>
                </footer>
            </div>
            
            {isOnlineUsersOpen && <OnlineUsersModal onClose={() => setIsOnlineUsersOpen(false)} streamId={streamer.id} />}
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
            {isRankingOpen && <ContributionRankingModal onClose={() => setIsRankingOpen(false)} />}
            
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
        </div>
    );
}

export default StreamRoom;
