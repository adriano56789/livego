import React, { useState, useEffect, useRef, useMemo } from 'react';
import OnlineUsersModal from './live/OnlineUsersModal';
import ChatMessage from './live/ChatMessage';
import CoHostModal from './CoHostModal';
import EntryChatMessage from './live/EntryChatMessage';
import ToolsModal from './ToolsModal';
import ResolutionPanel from './live/ResolutionPanel';
import BeautyEffectsPanel from './live/BeautyEffectsPanel';
import { GiftIcon, MessageIcon, SendIcon, MoreIcon, CloseIcon, PlusIcon, ViewerIcon, StarIcon, HeartIcon, GoldCoinWithGIcon, BellIcon } from './icons';
import { Streamer, User, Gift, RankedUser, LiveSessionState, ToastType } from '../types';
import ContributionRankingModal from './ContributionRankingModal';
import GiftModal from './live/GiftModal';
import GiftAnimationOverlay, { GiftPayload } from './live/GiftAnimationOverlay';
import { useTranslation } from '../i18n';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';
import UserActionModal from './UserActionModal';
import { webSocketManager } from '../services/websocket';
import FriendRequestNotification from './live/FriendRequestNotification';
import { RankedAvatar } from './live/RankedAvatar';
import FullScreenGiftAnimation from './live/FullScreenGiftAnimation';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '../services/database';

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

interface PKBattleScreenProps {
    streamer: Streamer;
    opponent: User;
    onEndPKBattle: () => void;
    onRequestEndStream: () => void;
    onLeaveStreamView: () => void;
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
    liveSession: LiveSessionState | null;
    updateLiveSession: (updates: Partial<LiveSessionState>) => void;
    logLiveEvent: (type: string, data: any) => void;
    updateUser: (user: User) => void;
    onStreamUpdate: (updates: Partial<Streamer>) => void;
    refreshStreamRoomData: (streamerId: string) => void;
    addToast: (type: ToastType, message: string) => void;
    rankingData: Record<string, RankedUser[]>;
    followingUsers: User[];
    pkBattleDuration: number;
    streamers: Streamer[];
    onSelectStream: (streamer: Streamer) => void;
    onOpenVIPCenter: () => void;
}

interface Heart {
  id: number;
  x: number;
  y: number;
  side: 'mine' | 'opponent';
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

export default function PKBattleScreen({ 
    streamer, opponent, onEndPKBattle, onRequestEndStream, onLeaveStreamView, onViewProfile, currentUser,
    onOpenWallet, onFollowUser, onOpenPrivateChat, onOpenPrivateInviteModal, onStartChatWithStreamer,
    onOpenPKTimerSettings, onOpenFans, onOpenFriendRequests, gifts, receivedGifts, liveSession,
    updateLiveSession, logLiveEvent, updateUser, onStreamUpdate, refreshStreamRoomData, addToast,
    followingUsers, pkBattleDuration, onOpenVIPCenter
}: PKBattleScreenProps) {
    const { t } = useTranslation();
    
    const [isUiVisible, setIsUiVisible] = useState(true);
    const [timeLeft, setTimeLeft] = useState(pkBattleDuration * 60);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    const [myScore, setMyScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [myHearts, setMyHearts] = useState(0);
    const [opponentHearts, setOpponentHearts] = useState(0);
    const [hearts, setHearts] = useState<Heart[]>([]);

    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isBeautyPanelOpen, setBeautyPanelOpen] = useState(false);
    const [isCoHostModalOpen, setIsCoHostModalOpen] = useState(false);
    const [isOnlineUsersOpen, setIsOnlineUsersOpen] = useState(false);
    const [isRankingOpen, setIsRankingOpen] = useState(false);
    const [isResolutionPanelOpen, setResolutionPanelOpen] = useState(false);
    const [isGiftModalOpen, setGiftModalOpen] = useState(false);
    const [userActionModalState, setUserActionModalState] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
    const [isModerationMode, setIsModerationMode] = useState(false);
    const [isAutoPrivateInviteEnabled, setIsAutoPrivateInviteEnabled] = useState(liveSession?.isAutoPrivateInviteEnabled ?? false);
    const [onlineUsers, setOnlineUsers] = useState<(User & { value: number })[]>([]);
    const previousOnlineUsersRef = useRef<(User & { value: number })[]>([]);

    const [effectsQueue, setEffectsQueue] = useState<GiftPayload[]>([]);
    const [currentEffect, setCurrentEffect] = useState<GiftPayload | null>(null);
    const [bannerGifts, setBannerGifts] = useState<(GiftPayload & { id: number })[]>([]);
    const nextGiftId = useRef(0);

    const [isSendingGift, setIsSendingGift] = useState(false);
        
    const isBroadcaster = streamer.hostId === currentUser.id;

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

    const totalScore = myScore + opponentScore;
    const myProgress = totalScore > 0 ? (myScore / totalScore) * 100 : 50;
    
    const isStreamerFollowed = useMemo(() => followingUsers.some(u => u.id === streamer.hostId), [followingUsers, streamer.hostId]);

    const streamerUser = useMemo(() => ({
        id: streamer.hostId, identification: streamer.hostId, name: streamer.name, avatarUrl: streamer.avatar,
        coverUrl: `https://picsum.photos/seed/${streamer.hostId}/400/800`, country: streamer.country || 'br',
        age: 23, gender: 'female' as 'female', level: 1, location: streamer.location, distance: 'desconhecida',
        fans: 0, following: 0, receptores: 0, enviados: 0, topFansAvatars: [], isLive: true,
        diamonds: 0, earnings: 0, 
        earnings_withdrawn: 0, bio: 'Amante de streams!', obras: [], curtidas: [], 
        xp: 0, ownedFrames: [], activeFrameId: null, frameExpiration: null
    } as User), [streamer]);

    const streamerDisplayUser = isBroadcaster ? currentUser : streamerUser;

    const remainingDays = getRemainingDays(streamerDisplayUser.frameExpiration);
    const activeFrame = (streamerDisplayUser.activeFrameId && remainingDays && remainingDays > 0)
        ? avatarFrames.find(f => f.id === streamerDisplayUser.activeFrameId)
        : null;
    const ActiveFrameComponent = activeFrame ? activeFrame.component : null;
    const frameGlowClass = getFrameGlowClass(streamerDisplayUser.activeFrameId);

    const handleRecharge = () => {
        setGiftModalOpen(false);
        onOpenWallet('Diamante');
    };

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

    const handleSendGift = async (gift: Gift, quantity: number) => {
        if (isSendingGift) return;
        setIsSendingGift(true);
        try {
            // Optimistic UI Update Payload
            const giftPayload: GiftPayload = {
                fromUser: currentUser,
                toUser: { id: streamer.hostId, name: streamer.name },
                gift,
                quantity,
                roomId: streamer.id,
                id: Date.now() + Math.random() // Unique ID
            };

            // 1. Add to Chat immediately
            postGiftChatMessage(giftPayload);

            // 2. Queue Fullscreen Effect immediately
            setEffectsQueue(prev => [...prev, giftPayload]);

            // 3. Show Banner Notification immediately
            const newBanner = { ...giftPayload, id: nextGiftId.current++ };
            setBannerGifts(prev => [...prev, newBanner].slice(-5));

            const { success, error, updatedSender, updatedReceiver } = await api.sendGift(currentUser.id, streamer.id, gift.name, quantity);
            
            if (success && updatedSender && updatedReceiver) {
                updateUser(updatedSender);
                updateUser(updatedReceiver);

                if (gift.triggersAutoFollow && !isStreamerFollowed) {
                    onFollowUser(streamerUser, streamer.id);
                }
        
                const coinsAdded = (gift.price || 0) * quantity;
                if (liveSession) {
                    updateLiveSession({ coins: (liveSession.coins || 0) + coinsAdded });
                    logLiveEvent('gift', { from: currentUser.id, to: streamer.hostId, gift: gift.name, coins: coinsAdded });
                }
                
                refreshStreamRoomData(streamer.hostId);
                const giftPayloadSocket: GiftPayload = {
                    fromUser: currentUser,
                    toUser: { id: streamer.hostId, name: streamer.name },
                    gift,
                    quantity,
                    roomId: streamer.id
                };
                webSocketManager.sendStreamGift(streamer.id, gift, quantity);
                
            } else if (error === 'Not enough diamonds') {
                handleRecharge();
            }
        } finally {
            setIsSendingGift(false);
        }
    };

    const handleBannerAnimationEnd = (id: number) => {
        setBannerGifts(prev => prev.filter(g => g.id !== id));
    };

    const constructUserFromMessage = (user: ChatMessageType): User => ({ 
        id: `user-${user.id}`, identification: `user-${user.id}`, name: user.user!, avatarUrl: user.avatar!, 
        coverUrl: `https://picsum.photos/seed/${user.id}/400/600`, country: 'br', 
        gender: user.gender || 'not_specified', level: user.level || 1, xp: 0, age: user.age || 18, 
        location: 'Brasil', distance: 'desconhecida', fans: 0, following: 0, receptores: 0, enviados: 0,
        topFansAvatars: [], isLive: false, diamonds: 0, earnings: 0, 
        earnings_withdrawn: 0, bio: 'Usuário da plataforma', obras: [], curtidas: [], 
        ownedFrames: [], activeFrameId: user.activeFrameId || null, frameExpiration: user.frameExpiration || null,
    });
    
    const handleViewChatUserProfile = (user: ChatMessageType) => {
        if (!user.user || !user.avatar) return;
        const userProfile = constructUserFromMessage(user);
        onViewProfile(userProfile);
    };

    useEffect(() => {
        setMyScore(liveSession?.coins || 0);
        const opponentInitialScore = Math.floor((liveSession?.coins || 0) * (Math.random() * 0.4 + 0.8));
        setOpponentScore(opponentInitialScore);
    }, [liveSession?.coins]);
    
    const handleHeartClick = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const side = clickX < rect.width / 2 ? 'mine' : 'opponent';
      
      const newHeart: Heart = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY, side };
      setHearts(prev => [...prev, newHeart]);

      if (side === 'mine') setMyHearts(prev => prev + 1);
      else setOpponentHearts(prev => prev + 1);
      
      api.sendPKHeart(streamer.id, side === 'mine' ? 'A' : 'B');

      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, 2000);
    };

    useEffect(() => {
        const currentUserEntryMessage: ChatMessageType = {
            id: Date.now(),
            type: 'entry',
            fullUser: currentUser,
        };
        setMessages([currentUserEntryMessage]);
    
        api.getOnlineUsers(streamer.id).then(users => {
            setOnlineUsers(users || []);
            previousOnlineUsersRef.current = users || [];
        });
    }, [streamer.id, currentUser]);

    useEffect(() => {
        const handleOnlineUsersUpdate = (data: { roomId: string, users: (User & { value: number })[] }) => {
            if (data.roomId === streamer.id) {
                const newUsers = data.users;
                const previousUsers = previousOnlineUsersRef.current;

                if (previousUsers.length > 0) {
                    const previousUserIds = new Set(previousUsers.map(u => u.id));
                    const newlyJoinedUsers = newUsers.filter(u => !previousUserIds.has(u.id) && u.id !== currentUser.id);

                    if (newlyJoinedUsers.length > 0) {
                        const entryMessages: ChatMessageType[] = newlyJoinedUsers.map(user => ({
                            id: Date.now() + Math.random(),
                            type: 'entry',
                            fullUser: user,
                        }));
                        setMessages(prev => [...prev, ...entryMessages]);
                    }
                }
                setOnlineUsers(newUsers);
                previousOnlineUsersRef.current = newUsers;
            }
        };
        const handleNewMessage = (message: any) => { if (message.roomId === streamer.id) setMessages(prev => [...prev, message]); };
        const handleHeartUpdate = (data: { roomId: string, heartsA: number, heartsB: number }) => {
             if (data.roomId === streamer.id) {
                setMyHearts(data.heartsA);
                setOpponentHearts(data.heartsB);
            }
        };

        const handleNewGift = (payload: GiftPayload) => {
            console.log('[PK BATTLE] New gift received via WS:', payload);
            if (payload.roomId !== streamer.id) return;
        
            // 1. Add to Chat
            postGiftChatMessage(payload);

            // 2. Only queue effects if NOT from current user (sender logic handled in handleSendGift)
            if (payload.fromUser.id !== currentUser.id) {
                const securePayload = { ...payload, id: payload.id || (Date.now() + Math.random()) };
                // Add to Fullscreen Effect Queue
                setEffectsQueue(prev => [...prev, securePayload]);
                
                // Add to Banner Notification
                const newBanner = { ...securePayload, id: nextGiftId.current++ };
                setBannerGifts(prev => [...prev, newBanner].slice(-5));
            }
        };

        const handleFollowUpdate = (payload: { follower: User, followed: User, isUnfollow: boolean }) => {
            if (payload.isUnfollow) return; 

            const { follower, followed } = payload;
            
            const newMessage: ChatMessageType = (followed.id === currentUser.id)
                ? { id: Date.now(), type: 'friend_request', follower: follower }
                : { id: Date.now(), type: 'follow', user: follower.name, followedUser: followed.name, avatar: follower.avatarUrl };

            setMessages(prev => [...prev, newMessage]);
        };


        webSocketManager.on('onlineUsersUpdate', handleOnlineUsersUpdate);
        webSocketManager.on('newStreamMessage', handleNewMessage);
        webSocketManager.on('pkHeartUpdate', handleHeartUpdate);
        webSocketManager.on('newStreamGift', handleNewGift);
        webSocketManager.on('followUpdate', handleFollowUpdate);
    
        return () => {
            webSocketManager.off('onlineUsersUpdate', handleOnlineUsersUpdate);
            webSocketManager.off('newStreamMessage', handleNewMessage);
            webSocketManager.off('pkHeartUpdate', handleHeartUpdate);
            webSocketManager.off('newStreamGift', handleNewGift);
            webSocketManager.off('followUpdate', handleFollowUpdate);
        };
    }, [streamer.id, t, currentUser.id, onOpenFriendRequests]);

    const handleFollowStreamer = (user: User) => onFollowUser(user, streamer.id);

    useEffect(() => {
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, [messages]);

    useEffect(() => {
        if (!currentEffect && effectsQueue.length > 0) {
            const nextInQueue = effectsQueue[0];
            setCurrentEffect(nextInQueue);
            setEffectsQueue(prev => prev.slice(1));
        }
    }, [currentEffect, effectsQueue]);

    useEffect(() => {
        if (timeLeft <= 0) {
            onEndPKBattle();
            return;
        }
        const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, onEndPKBattle]);
        
    const handleSendMessage = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (chatInput.trim() === '' || !currentUser) return;
        webSocketManager.sendStreamMessage(streamer.id, chatInput.trim());
        setChatInput('');
    };
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
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

    if (!opponent) return <div className="absolute inset-0 bg-black flex items-center justify-center"><LoadingSpinner /></div>;
    
    return (
        <div className="absolute inset-0 bg-black flex flex-col font-sans text-white z-10">
            <div className="flex-1 relative" onClick={handleHeartClick}>
                <div className="absolute inset-0 grid grid-cols-2">
                    <div className="h-full w-full bg-gray-900 border-r-2 border-yellow-400"><img src={streamerUser.coverUrl} alt={streamerUser.name} className="w-full h-full object-cover" /></div>
                    <div className="h-full w-full bg-gray-800"><img src={opponent.coverUrl} alt={opponent.name} className="w-full h-full object-cover" /></div>
                </div>

                 <FullScreenGiftAnimation 
                    payload={currentEffect}
                    onEnd={() => setCurrentEffect(null)}
                />

                <header className={`p-3 bg-transparent absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-2">
                                <div className="flex flex-col space-y-2">
                                    <button onClick={(e) => { e.stopPropagation(); onViewProfile(streamerDisplayUser); }} className="flex items-center bg-black/40 rounded-full p-1 pr-3 space-x-2 text-left">
                                        <div className="relative w-10 h-10 flex items-center justify-center">
                                            <div className="live-ring-animated">
                                            <img src={streamerDisplayUser.avatarUrl} alt={streamerDisplayUser.name} className="w-8 h-8 rounded-full object-cover" />
                                            </div>
                                            {ActiveFrameComponent && (
                                                <div className={`absolute inset-0 w-10 h-10 pointer-events-none ${frameGlowClass}`}>
                                                    <ActiveFrameComponent />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">{streamerDisplayUser.name}</p>
                                            <div className="flex items-center space-x-1 text-gray-300 text-xs">
                                                <ViewerIcon className="w-4 h-4" />
                                                <span>{liveSession?.viewers.toLocaleString() || '0'}</span>
                                            </div>
                                        </div>
                                    </button>
                                    <div className="flex items-center space-x-2 pl-1">
                                        <button onClick={(e) => { e.stopPropagation(); setIsRankingOpen(true); }} className="flex items-center bg-black/40 rounded-full px-2 py-1 space-x-1 text-xs cursor-pointer">
                                            <GoldCoinWithGIcon className="w-4 h-4" />
                                            <span className="text-white font-semibold">{myScore.toLocaleString()}</span>
                                        </button>
                                    </div>
                                </div>
                                {!isStreamerFollowed && currentUser.id !== streamer.hostId && (
                                    <button onClick={(e) => { e.stopPropagation(); handleFollowStreamer(streamerUser); }} className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white mt-1 shrink-0">
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col items-end space-y-2">
                                <div className="flex items-center space-x-2">
                                    {onlineUsers.slice(0, 3).map((user) => (
                                        <button key={user.id} onClick={(e) => { e.stopPropagation(); onViewProfile(user); }}>
                                            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                        </button>
                                    ))}
                                    {/* FIX: Corrected typo from setOnlineUsersOpen to setIsOnlineUsersOpen */}
                                    <button onClick={(e) => { e.stopPropagation(); setIsOnlineUsersOpen(true); }} className="flex items-center bg-black/40 rounded-full px-2.5 py-1.5 space-x-1 text-sm cursor-pointer">
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
                    
                    <div className={`w-full px-4 absolute top-24 left-0 right-0 z-10 transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <div className="relative w-full h-3 bg-pk-opponent rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-pk-streamer transition-all duration-500" style={{ width: `${myProgress}%` }}></div>
                        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg text-black font-bold text-xs">VS</div>
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <div className="flex items-center space-x-1.5">
                            <StarIcon className="w-5 h-5 text-pink-400" />
                            <span className="font-bold text-white score-pop">{myScore.toLocaleString()}</span>
                            <span className="font-bold text-white score-pop text-sm ml-2">({myHearts})</span>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-1.5 text-white font-bold text-lg shadow-lg">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-white score-pop text-sm mr-2">({opponentHearts})</span>
                            <StarIcon className="w-5 h-5 text-blue-400" />
                            <span className="font-bold text-white score-pop">{opponentScore.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
            </div>

            <div className={`flex-shrink-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} data-chat-container>
                <div ref={chatContainerRef} className="h-48 overflow-y-auto no-scrollbar p-3 flex flex-col justify-end">
                    <div className="space-y-2">
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
                                    onFollow={shouldShowFollow ? () => onFollowUser(chatUser, streamer.id) : undefined}
                                    isFollowed={followingUsers.some(f => f.id === chatUser.id)}
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

                <footer className="p-3 border-t border-gray-800/50">
                    <div className="flex items-center space-x-2">
                        <div className="flex-grow bg-black/40 rounded-full flex items-center pr-1.5"><input type="text" placeholder={t('streamRoom.sayHi')} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)} className="flex-grow bg-transparent px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none" /><button onClick={handleSendMessage} className="bg-gray-500/50 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-gray-400/50 transition-colors"><SendIcon className="w-5 h-5 text-white" /></button></div>
                        <button onClick={(e) => { e.stopPropagation(); setGiftModalOpen(true); }} className="bg-black/40 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"><GiftIcon className="w-6 h-6 text-yellow-400" /></button>
                        {isBroadcaster && (<button onClick={(e) => { e.stopPropagation(); setIsToolsOpen(true); }} className="bg-black/40 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors"><MoreIcon className="w-6 h-6 text-white" /></button>)}
                    </div>
                </footer>
            </div>
            
            {hearts.map(heart => (
              <div key={heart.id} className="heart-anim pointer-events-none" style={{ left: `${heart.x - 16}px`, top: `${heart.y - 16}px` }}>
                <HeartIcon className={`w-8 h-8 ${heart.side === 'mine' ? 'text-pink-500' : 'text-blue-500'}`} />
              </div>
            ))}
            
            {isOnlineUsersOpen && <OnlineUsersModal onClose={() => setIsOnlineUsersOpen(false)} streamId={streamer.id} />}
            {isRankingOpen && <ContributionRankingModal onClose={() => setIsRankingOpen(false)} liveRanking={onlineUsers} />}
            
            <ToolsModal 
                isOpen={isToolsOpen} 
                onClose={() => setIsToolsOpen(false)} 
                onOpenCoHostModal={(e) => { e.stopPropagation(); setIsToolsOpen(false); setIsCoHostModalOpen(true); }}
                isPKBattleActive={true} 
                onEndPKBattle={(e) => { e.stopPropagation(); onEndPKBattle(); }}
                onOpenBeautyPanel={(e) => { e.stopPropagation(); setIsToolsOpen(false); setBeautyPanelOpen(true); }} 
                onOpenPrivateChat={(e) => { e.stopPropagation(); onOpenPrivateChat(); }} 
                onOpenPrivateInviteModal={(e) => { e.stopPropagation(); onOpenPrivateInviteModal(); }}
                onOpenClarityPanel={(e) => { e.stopPropagation(); setIsToolsOpen(false); setResolutionPanelOpen(true); }}
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
            <GiftModal isOpen={isGiftModalOpen} onClose={() => setGiftModalOpen(false)} userDiamonds={currentUser.diamonds || 0} onSendGift={handleSendGift} onRecharge={() => onOpenWallet('Diamante')} gifts={gifts} receivedGifts={receivedGifts} isBroadcaster={isBroadcaster} onOpenVIPCenter={onOpenVIPCenter} isVIP={currentUser.isVIP || false} />
            {isBeautyPanelOpen && <BeautyEffectsPanel onClose={() => setBeautyPanelOpen(false)} currentUser={currentUser} addToast={addToast} />}
            {isCoHostModalOpen && <CoHostModal isOpen={isCoHostModalOpen} onClose={() => setIsCoHostModalOpen(false)} onInvite={()=>{}} onOpenTimerSettings={onOpenPKTimerSettings} currentUser={currentUser} addToast={addToast} streamId={streamer.id} />}
            <ResolutionPanel isOpen={isResolutionPanelOpen} onClose={() => setResolutionPanelOpen(false)} onSelectResolution={()=>{}} currentResolution={"480p"} />

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