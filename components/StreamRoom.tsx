

import React, { useState, useEffect, useRef, useMemo } from 'react';
import OnlineUsersModal from '@/components/live/OnlineUsersModal';
import ChatMessage from '@/components/live/ChatMessage';
import CoHostModal from '@/components/CoHostModal';
import EntryChatMessage from '@/components/live/EntryChatMessage';
import ToolsModal from '@/components/ToolsModal';
import { GiftIcon, MessageIcon, SendIcon, MoreIcon, CloseIcon, PlusIcon, ViewerIcon, GoldCoinWithGIcon, HeartIcon, BellIcon, FanClubHeaderIcon } from '@/components/icons';
import { Streamer, User, Gift, ToastType, LiveSessionState, GiftSendPayload } from '@/types';
import ContributionRankingModal from '@/components/ContributionRankingModal';
import BeautyEffectsPanel from '@/components/live/BeautyEffectsPanel';
import ResolutionPanel from '@/components/live/ResolutionPanel';
import GiftModal from '@/components/live/GiftModal';
import GiftAnimationOverlay from '@/components/live/GiftAnimationOverlay';
import { useTranslation } from '@/i18n';
import { api } from '@/services/api';
import UserActionModal from '@/components/UserActionModal';
import { webSocketManager } from '@/services/websocket';
import FriendRequestNotification from '@/components/live/FriendRequestNotification';
import { RankedAvatar } from '@/components/live/RankedAvatar';
import FullScreenGiftAnimation from '@/components/live/FullScreenGiftAnimation';
import { avatarFrames, getRemainingDays, getFrameGlowClass } from '@/services/db_shared';
import FanClubModal from '@/components/live/FanClubModal';
import JoinFanClubModal from '@/components/live/JoinFanClubModal';
import FanClubEntryMessage from '@/components/live/FanClubEntryMessage';
import UserMentionSuggestions from '@/components/live/UserMentionSuggestions';
import { GIFTS } from '@/constants';

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
    roomId?: string; // Adicionado para consistência de payload
}

interface StreamRoomProps {
    streamer: Streamer;
    onRequestEndStream: () => void;
    onLeaveStreamView: () => void;
    onStartPKBattle: (opponent: User) => void;
    onViewProfile: (user: User, isEditing?: boolean) => void;
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

const QuickGiftIcon: React.FC<{ gift: Gift }> = ({ gift }) => {
    if (gift.name === 'Coração') {
        return <HeartIcon className="w-5 h-5 text-pink-500 fill-pink-500 drop-shadow-[0_0_4px_rgba(236,72,153,0.7)]" />;
    }
    if (gift.name === 'Café') {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 8H17C18.1046 8 19 8.89543 19 10V15C19 16.1046 18.1046 17 17 17H7C5.89543 17 5 16.1046 5 15V8Z" fill="white" fillOpacity="0.9"/>
                <path d="M8 5V7" stroke="white" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M11 4V6" stroke="white" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M14 5V7" stroke="white" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        );
    }
    if (gift.name === 'Milho') {
        return (
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L8 20H16L18 9H6Z" fill="#F472B6"/>
                <path d="M8 9H7V20H8V9Z" fill="white"/>
                <path d="M10 9H9V20H10V9Z" fill="white"/>
                <path d="M12 9H11V20H12V9Z" fill="white"/>
                <path d="M14 9H13V20H14V9Z" fill="white"/>
                <path d="M16 9H15V20H16V9Z" fill="white"/>
                <circle cx="9" cy="8" r="3" fill="#FBBF24"/>
                <circle cx="15" cy="8" r="3" fill="#FBBF24"/>
                <circle cx="12" cy="6" r="4" fill="#FBBF24"/>
            </svg>
        );
    }
    return <span>{gift.icon}</span>
};

const StreamRoom: React.FC<StreamRoomProps> = ({ streamer, onRequestEndStream, onLeaveStreamView, onStartPKBattle, onViewProfile, currentUser, onOpenWallet, onFollowUser, onOpenPrivateChat, onOpenPrivateInviteModal, setActiveScreen, onStartChatWithStreamer, onOpenPKTimerSettings, onOpenFans, onOpenFriendRequests, updateUser, liveSession, updateLiveSession, logLiveEvent, onStreamUpdate, refreshStreamRoomData, addToast, followingUsers, streamers, onSelectStream, onOpenVIPCenter, onOpenFanClubMembers }) => {
    const { t, language } = useTranslation();
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
    const [isResolutionPanelOpen, setResolutionPanelOpen] = useState(false);
    const [currentResolution, setCurrentResolution] = useState(streamer.quality || '1080p');
    const [isGiftModalOpen, setGiftModalOpen] = useState(false);
    const [userActionModalState, setUserActionModalState] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
    const [isModerationMode, setIsModerationMode] = useState(false);
    const [isAutoPrivateInviteEnabled, setIsAutoPrivateInviteEnabled] = useState(liveSession?.isAutoPrivateInviteEnabled ?? false);
    const [onlineUsers, setOnlineUsers] = useState<(User & { value: number })[]>([]);
    const previousOnlineUsersRef = useRef<(User & { value: number })[]>([]);
    const [lastUsersUpdate, setLastUsersUpdate] = useState<number>(Date.now());
    const usersUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [bannerGifts, setBannerGifts] = useState<(GiftSendPayload & { id: number })[]>([]);
    const nextGiftId = useRef(0);
    const [fullscreenGiftQueue, setFullscreenGiftQueue] = useState<GiftSendPayload[]>([]);
    const [currentFullscreenGift, setCurrentFullscreenGift] = useState<GiftSendPayload | null>(null);
    const [isFanClubModalOpen, setIsFanClubModalOpen] = useState(false);
    const [isJoinFanClubModalOpen, setIsJoinFanClubModalOpen] = useState(false);
    const [isChatInputFocused, setIsChatInputFocused] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [receivedGifts, setReceivedGifts] = useState<(Gift & { count: number })[]>([]);

    const isBroadcaster = streamer.hostId === currentUser.id;
    const isFollowed = useMemo(() => followingUsers.some(u => u.id === streamer.hostId), [followingUsers, streamer.hostId]);
    const isFanClubMember = useMemo(() => !!currentUser.fanClub && currentUser.fanClub.streamerId === streamer.hostId, [currentUser.fanClub, streamer.hostId]);

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
    const ActiveFrameComponent = activeFrame ? (activeFrame as any).component : null;
    const frameGlowClass = getFrameGlowClass(streamerDisplayUser.activeFrameId);
    
    const swipeStart = useRef<{ x: number, y: number } | null>(null);
    const minSwipeDistance = 50;
    
    const quickGifts = useMemo(() => {
        const heart = GIFTS.find(g => g.name === 'Coração');
        const coffee = GIFTS.find(g => g.name === 'Café');
        const popcorn = GIFTS.find(g => g.name === 'Milho');
        return [heart, coffee, popcorn].filter((g): g is Gift => !!g);
    }, []);

    const handleSendQuickGift = (gift: Gift) => {
        if (isBroadcaster) {
            addToast(ToastType.Warning, "Você não pode enviar presentes para si mesmo.");
            return;
        }
        handleSendGift(gift, 1, streamer.hostId);
    };

    const topContributors = useMemo(() => {
        return [...onlineUsers].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 3);
    }, [onlineUsers]);

    const handlePointerDown = (clientX: number, clientY: number) => {
        if (isChatInputFocused) return;
        swipeStart.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = (clientX: number, clientY: number) => {
        if (isChatInputFocused || !swipeStart.current) {
            swipeStart.current = null;
            return;
        }

        const deltaX = clientX - swipeStart.current.x;
        const deltaY = clientY - swipeStart.current.y;

        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
            const currentIndex = streamers.findIndex(s => s.id === streamer.id);
            if (currentIndex === -1 || streamers.length <= 1) return;

            if (deltaY < 0) {
                const nextIndex = (currentIndex + 1) % streamers.length;
                onSelectStream(streamers[nextIndex]);
            } else {
                const prevIndex = (currentIndex - 1 + streamers.length) % streamers.length;
                onSelectStream(streamers[prevIndex]);
            }
        } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            setIsUiVisible(p => !p);
        }

        swipeStart.current = null;
    };
    
    useEffect(() => {
        const isFan = currentUser.fanClub && currentUser.fanClub.streamerId === streamer.hostId;
        const entryType = isFan ? 'fan_entry' : 'entry';
        const currentUserEntryMessage: ChatMessageType = {
            id: Date.now(),
            type: entryType,
            fullUser: currentUser,
        };
        setMessages([currentUserEntryMessage]);

        api.users.getOnlineUsers(streamer.id).then(usersData => {
            const users = Array.isArray(usersData) ? usersData : [];
            const usersWithValue = users.map(u => ({ ...u, value: (u as any).value || 0 }));
            setOnlineUsers(usersWithValue);
            updateLiveSession({ viewers: users.length });
            previousOnlineUsersRef.current = usersWithValue;
        });

        api.gifts.getGallery().then(gifts => {
            if (Array.isArray(gifts)) {
                setReceivedGifts(gifts);
            }
        });
    }, [streamer.id, streamer.hostId, updateLiveSession]);

    const postGiftChatMessage = (payload: GiftSendPayload) => {
        const { fromUser, gift, toUser, quantity } = payload;
        
        const messageKey = quantity > 1 ? 'streamRoom.sentMultipleGiftsMessage' : 'streamRoom.sentGiftMessage';
        const messageOptions = { quantity, giftName: gift.name, receiverName: toUser.name };

        const giftMessage: ChatMessageType = {
            id: Date.now() + Math.random(),
            type: 'chat',
            fullUser: fromUser,
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
            fanClub: fromUser.fanClub,
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
            if (message.roomId === streamer.id) {
                setMessages(prev => [...prev, message]);
            }
        };
        webSocketManager.on('newStreamMessage', handleNewMessage);

        const handleNewGift = (payload: GiftSendPayload) => {
            if (payload.roomId !== streamer.id || payload.fromUser.id === currentUser.id) {
                return;
            }

            if (liveSession && payload.toUser.id === streamer.hostId) {
                updateLiveSession({ coins: (liveSession.coins || 0) + (payload.gift.price || 0) * payload.quantity });
            }
            
            refreshStreamRoomData(streamer.hostId);
            postGiftChatMessage(payload);
            setFullscreenGiftQueue(prev => [...prev, payload]);
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

        const updateUsersList = (newUsers: (User & { value: number })[]) => {
            setOnlineUsers(prevUsers => {
                if (JSON.stringify(prevUsers) === JSON.stringify(newUsers)) {
                    return prevUsers;
                }
                return newUsers;
            });
            updateLiveSession({ viewers: newUsers.length });
            previousOnlineUsersRef.current = newUsers;

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
        };

        const handleOnlineUsersUpdate = (data: { roomId: string; users: (User & { value: number })[] }) => {
            if (data.roomId !== streamer.id) return;
            
            api.users.getOnlineUsers(streamer.id).then(freshUsersData => {
                const freshUsers = Array.isArray(freshUsersData) ? freshUsersData : [];
                const usersWithValue = freshUsers.map(u => ({ ...u, value: (u as any).value || 0 }));
                updateUsersList(usersWithValue);
            });
        };
        webSocketManager.on('onlineUsersUpdate', handleOnlineUsersUpdate);


        return () => {
            webSocketManager.off('newStreamMessage', handleNewMessage);
            webSocketManager.off('newStreamGift', handleNewGift);
            webSocketManager.off('followUpdate', handleFollowUpdate);
            webSocketManager.off('autoInviteStateUpdate', handleAutoInviteStateUpdate);
            webSocketManager.off('onlineUsersUpdate', handleOnlineUsersUpdate);
            if (usersUpdateTimeout.current) {
                clearTimeout(usersUpdateTimeout.current);
                usersUpdateTimeout.current = null;
            }
        };
    }, [streamer.id, streamer.hostId, updateLiveSession, currentUser.id, language, t, onOpenFriendRequests, liveSession, refreshStreamRoomData]);

    const handleSendMessage = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (chatInput.trim() === '' || !currentUser) return;
        
        const tempId = Date.now();
        const messagePayload: ChatMessageType = {
            id: tempId,
            roomId: streamer.id,
            type: 'chat' as const,
            user: currentUser.name,
            message: chatInput.trim(),
            fullUser: currentUser,
        };
        
        setMessages(prev => [...prev, messagePayload]);
        
        api.chats.sendMessage(streamer.id, messagePayload).catch(err => {
            addToast(ToastType.Error, "Falha ao enviar mensagem.");
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
        });
        
        setChatInput('');
    };

    const handleTogglePrivacy = async () => {
        if (!isBroadcaster) return;
        const newPrivacy = !streamer.isPrivate;
        try {
            await api.streams.update(streamer.id, { isPrivate: newPrivacy });
            onStreamUpdate({ isPrivate: newPrivacy });
        } catch (error) {
            console.error("Failed to update privacy:", error);
        }
    };

    const handleFollowStreamer = () => {
        onFollowUser(streamerUser, streamer.id);
    };

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
        const { success } = await api.streams.updateVideoQuality(streamer.id, resolution);
        if (success) {
            setCurrentResolution(resolution);
            onStreamUpdate({ quality: resolution });
            addToast(ToastType.Success, `Qualidade do vídeo alterada para ${resolution}`);
        } else {
            addToast(ToastType.Error, `Falha ao alterar la qualidade do vídeo.`);
        }
        setResolutionPanelOpen(false);
    };
    
    const constructUserFromMessage = (user: ChatMessageType): User => {
        if (user.fullUser) {
            return user.fullUser;
        }
        return { 
            id: `user-${user.id}`, 
            identification: `user-${user.id}`, 
            name: user.user || 'Anonimo', 
            avatarUrl: user.avatar || 'https://picsum.photos/seed/anon/200', 
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

    const handleSendGift = async (gift: Gift, quantity: number, targetId?: string): Promise<User | null> => {
        const totalCost = (gift.price || 0) * quantity;
        
        // Backpack gifts have no diamond cost check
        if (!gift.isFromBackpack && currentUser.diamonds < totalCost) {
            handleRecharge();
            return null;
        }
    
        const finalTargetId = targetId || streamer.hostId;
        const allUsers = [streamerUser, ...onlineUsers];
        const toUser = allUsers.find(u => u.id === finalTargetId) || { id: finalTargetId, name: 'Usuário' };
    
        const giftPayload: GiftSendPayload = {
            fromUser: currentUser,
            toUser: { id: toUser.id, name: toUser.name },
            gift,
            quantity,
            roomId: streamer.id
        };
        
        try {
            let apiResult: { success: boolean, updatedSender: User | undefined };
    
            if (gift.isFromBackpack) {
                // New API call for backpack gifts
                apiResult = await api.sendBackpackGift(currentUser.id, streamer.id, gift.id, quantity, finalTargetId);
            } else {
                // Existing API call for diamond gifts
                apiResult = await api.sendGift(currentUser.id, streamer.id, gift.name, quantity, finalTargetId);
            }
            
            const { success, updatedSender } = apiResult;
    
            if (success && updatedSender) {
                updateUser(updatedSender);
                postGiftChatMessage(giftPayload);
                setFullscreenGiftQueue(prev => [...prev, giftPayload]);
    
                if (gift.triggersAutoFollow && !isFollowed && finalTargetId === streamer.hostId) {
                    onFollowUser(streamerUser, streamer.id);
                }
                
                // Don't add coins for backpack gifts
                if (!gift.isFromBackpack && liveSession && finalTargetId === streamer.hostId) {
                    const coinsAdded = (gift.price || 0) * quantity;
                    const currentCoins = Number(liveSession.coins) || 0;
                    updateLiveSession({ coins: currentCoins + coinsAdded });
                }
                
                refreshStreamRoomData(streamer.id);
    
                const wasNotFan = !currentUser.fanClub || currentUser.fanClub.streamerId !== streamer.hostId;
                const isNowFan = updatedSender.fanClub && updatedSender.fanClub.streamerId === streamer.hostId;
    
                if (wasNotFan && isNowFan) {
                    addToast(ToastType.Success, "Bem-vindo ao fã-clube!");
                    setIsFanClubModalOpen(true);
                }
    
                return updatedSender;
            } else {
                throw new Error("API retornou falha.");
            }
        } catch (error) {
            console.error("Falha ao enviar presente:", error);
            addToast(ToastType.Error, (error as Error).message || "Falha ao enviar o presente.");
            // Refresh user data to sync client with server state after a failed transaction
            api.users.me().then(user => {
                if (user) updateUser(user);
            });
            return null;
        }
    };
    
    const handleRecharge = () => {
        setGiftModalOpen(false);
        onOpenWallet('Diamante');
    };

    return (
        <div 
            className="absolute inset-0 bg-black flex flex-col font-sans text-white z-10 overflow-hidden"
            onTouchStart={e => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={e => handlePointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
            onMouseDown={e => handlePointerDown(e.clientX, e.clientY)}
            onMouseUp={e => handlePointerUp(e.clientX, e.clientY)}
        >
            <div className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${isUiVisible ? 'blur-[2px] scale-105 opacity-60' : 'blur-none scale-100 opacity-100'}`} style={{ backgroundImage: `url(${streamer.thumbnail})` }} />
            
            <div className={`absolute inset-0 transition-opacity duration-500 ${isUiVisible ? 'bg-black/40' : 'bg-transparent'}`} />

            <div className={`relative z-10 flex flex-col h-full transition-opacity duration-500 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <header className="absolute top-0 left-0 right-0 p-4 pt-12 flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="flex items-start gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full" onClick={() => onViewProfile(streamerDisplayUser)}>
                            <div className="relative">
                                <img src={streamerDisplayUser.avatarUrl} alt={streamerDisplayUser.name} className={`w-10 h-10 rounded-full object-cover ${frameGlowClass}`} />
                                {ActiveFrameComponent && <ActiveFrameComponent className="absolute -inset-2 w-14 h-14 pointer-events-none" />}
                            </div>
                            <div className="mr-2">
                                <h1 className="text-sm font-bold truncate max-w-[120px]">{streamerDisplayUser.name}</h1>
                                <div className="flex items-center space-x-2 text-xs">
                                    <div className="flex items-center space-x-1">
                                        <ViewerIcon className="w-3 h-3 text-white" />
                                        <span>{(liveSession?.viewers || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <GoldCoinWithGIcon />
                                        <span className="text-yellow-400 font-bold">{(liveSession?.coins || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {!isBroadcaster && !isFollowed && (
                            <button onClick={handleFollowStreamer} className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold active:scale-90 transition-transform">
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {onlineUsers.slice(0, 3).map(u => <img key={u.id} src={u.avatarUrl} className="w-8 h-8 rounded-full border-2 border-black/50" />)}
                        </div>
                        <button onClick={() => setOnlineUsersOpen(true)} className="w-8 h-8 bg-black/40 rounded-full text-white text-xs font-bold flex items-center justify-center">
                            <PlusIcon className="w-4 h-4" />
                        </button>
                        <button onClick={isBroadcaster ? onRequestEndStream : onLeaveStreamView} className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="absolute top-28 left-4 z-30 pointer-events-none flex flex-col-reverse items-start">
                    {bannerGifts.map((payload) => (
                        <GiftAnimationOverlay 
                            key={payload.id}
                            giftPayload={payload}
                            onAnimationEnd={handleBannerAnimationEnd}
                        />
                    ))}
                </div>

                <div className="flex-1 overflow-hidden"></div>
                
                <div className="px-4 pb-4">
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex -space-x-3">
                            <RankedAvatar user={topContributors[0] || streamerUser} rank={1} onClick={onViewProfile} />
                            <RankedAvatar user={topContributors[1] || streamerUser} rank={2} onClick={onViewProfile} />
                            <RankedAvatar user={topContributors[2] || streamerUser} rank={3} onClick={onViewProfile} />
                        </div>
                        <div className="flex items-center gap-2">
                            {quickGifts.map(gift => (
                                <button
                                    key={gift.id}
                                    onClick={() => handleSendQuickGift(gift)}
                                    className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
                                >
                                    <QuickGiftIcon gift={gift} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div ref={chatContainerRef} className="h-48 overflow-y-auto no-scrollbar flex flex-col-reverse">
                        <div className="pt-4 flex flex-col gap-2">
                            {messages.slice().reverse().map((msg, index) => {
                                if (msg.type === 'entry') return <EntryChatMessage key={msg.id} user={msg.fullUser!} onClick={onViewProfile} currentUser={currentUser} onFollow={onFollowUser} isFollowed={followingUsers.some(u => u.id === msg.fullUser!.id)} streamer={streamer} />;
                                if (msg.type === 'fan_entry') return <FanClubEntryMessage key={msg.id} user={msg.fullUser} />;
                                if (msg.type === 'friend_request') return <FriendRequestNotification key={msg.id} followerName={msg.follower?.name} onClick={onOpenFriendRequests} />;
                                if (msg.type === 'follow') return <FollowChatMessage key={msg.id} follower={msg.user!} followed={msg.followedUser!} />;
                                return <ChatMessage key={msg.id} userObject={constructUserFromMessage(msg)} message={msg.message!} onAvatarClick={() => onViewProfile(constructUserFromMessage(msg))} streamerId={streamer.id} timestamp={msg.id} />;
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <div className="relative flex-1 bg-black/40 rounded-full flex items-center pr-2 border border-white/20 focus-within:border-purple-500/50 transition-colors">
                            <input 
                                ref={chatInputRef}
                                type="text" 
                                className="flex-1 bg-transparent px-4 py-2.5 outline-none text-sm placeholder:text-gray-400" 
                                placeholder={t('streamRoom.sayHi')}
                                value={chatInput} 
                                onChange={e => setChatInput(e.target.value)} 
                                onKeyPress={e => e.key === 'Enter' && handleSendMessage(e)}
                                onFocus={() => setIsChatInputFocused(true)}
                                onBlur={() => setIsChatInputFocused(false)}
                            />
                            {showMentionSuggestions && (
                                <UserMentionSuggestions users={onlineUsers} onSelect={(name: string) => setChatInput(prev => prev.slice(0, prev.lastIndexOf('@') + 1) + name + ' ')} />
                            )}
                            <button onClick={e => handleSendMessage(e)} disabled={!chatInput.trim()} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white shrink-0 active:scale-90 transition-transform disabled:bg-gray-800 disabled:text-gray-500">
                                <SendIcon className="w-4 h-4 ml-0.5" />
                            </button>
                        </div>
                        <button onClick={() => setGiftModalOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-yellow-400 shrink-0 border border-white/20"><GiftIcon className="w-6 h-6" /></button>
                        <button onClick={() => setIsToolsOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center shrink-0 border border-white/20"><MoreIcon className="w-6 h-6" /></button>
                    </div>
                </div>
            </div>

            {isGiftModalOpen && (
                 <GiftModal 
                    isOpen={isGiftModalOpen} 
                    onClose={() => setGiftModalOpen(false)} 
                    currentUser={currentUser}
                    onUpdateUser={updateUser}
                    onSendGift={handleSendGift} 
                    onRecharge={handleRecharge} 
                    receivedGifts={receivedGifts}
                    isBroadcaster={isBroadcaster}
                    onOpenVIPCenter={onOpenVIPCenter}
                    streamId={streamer.id}
                    hostId={streamer.hostId}
                    onlineUsers={onlineUsers}
                    hostUser={streamerUser}
                />
            )}
            <ToolsModal 
                isOpen={isToolsOpen} 
                onClose={() => setIsToolsOpen(false)} 
                onOpenCoHostModal={handleOpenCoHostModal}
                isPKBattleActive={false}
                onStartPK={(e: any) => { e.stopPropagation(); setIsToolsOpen(false); setIsCoHostModalOpen(true); }}
                onOpenBeautyPanel={handleOpenBeautyPanel}
                onOpenPrivateChat={onOpenPrivateChat}
                onOpenPrivateInviteModal={() => { setIsToolsOpen(false); onOpenPrivateInviteModal(); }}
                onOpenClarityPanel={handleOpenClarityPanel}
                onOpenRanking={() => setIsRankingOpen(true)}
                isModerationActive={isModerationMode}
                onToggleModeration={() => setIsModerationMode(!isModerationMode)}
                isMicrophoneMuted={liveSession?.isMicrophoneMuted || false}
                onToggleMicrophone={() => updateLiveSession({ isMicrophoneMuted: !liveSession?.isMicrophoneMuted })}
                isSoundMuted={liveSession?.isStreamMuted || false}
                onToggleSound={() => updateLiveSession({ isStreamMuted: !liveSession?.isStreamMuted })}
                isAutoFollowEnabled={liveSession?.isAutoFollowEnabled || false}
                onToggleAutoFollow={() => updateLiveSession({ isAutoFollowEnabled: !liveSession?.isAutoFollowEnabled })}
                isAutoPrivateInviteEnabled={isAutoPrivateInviteEnabled}
                onToggleAutoPrivateInvite={() => {
                    const newState = !isAutoPrivateInviteEnabled;
                    setIsAutoPrivateInviteEnabled(newState);
                    webSocketManager.emit('toggleAutoInvite', { roomId: streamer.id, isEnabled: newState });
                }}
            />
            {isCoHostModalOpen && <CoHostModal isOpen={isCoHostModalOpen} onClose={() => setIsCoHostModalOpen(false)} onInvite={handleInvite} onOpenTimerSettings={onOpenPKTimerSettings} currentUser={currentUser} addToast={addToast} streamId={streamer.id} />}
            {isOnlineUsersOpen && <OnlineUsersModal onClose={() => setOnlineUsersOpen(false)} streamId={streamer.id} users={onlineUsers} onFollow={onFollowUser} currentUser={currentUser} />}
            {isRankingOpen && <ContributionRankingModal onClose={() => setIsRankingOpen(false)} liveRanking={onlineUsers} />}
            {isBeautyPanelOpen && <BeautyEffectsPanel onClose={() => setBeautyPanelOpen(false)} addToast={addToast} />}
            {isResolutionPanelOpen && <ResolutionPanel isOpen={isResolutionPanelOpen} onClose={() => setResolutionPanelOpen(false)} onSelectResolution={handleSelectResolution} currentResolution={currentResolution} />}
            <UserActionModal {...userActionModalState} onClose={() => setUserActionModalState({ isOpen: false, user: null })} onViewProfile={onViewProfile} onMention={() => {}} onMakeModerator={() => {}} onKick={() => {}} />
            <FullScreenGiftAnimation payload={currentFullscreenGift} onEnd={handleFullscreenGiftAnimationEnd} />
            {isFanClubModalOpen && <FanClubModal isOpen={isFanClubModalOpen} onClose={() => setIsFanClubModalOpen(false)} streamer={streamerDisplayUser} isMember={isFanClubMember} currentUser={currentUser} onConfirmJoin={() => { setIsFanClubModalOpen(false); setIsJoinFanClubModalOpen(true); }} onOpenMembers={onOpenFanClubMembers} />}
            {isJoinFanClubModalOpen && <JoinFanClubModal isOpen={isJoinFanClubModalOpen} onClose={() => setIsJoinFanClubModalOpen(false)} onConfirm={() => {
                const joinGift = GIFTS.find(g => g.name === 'Rosa');
                if (joinGift) handleSendGift(joinGift, 1, streamer.hostId);
                setIsJoinFanClubModalOpen(false);
            }} />}
        </div>
    );
};

export default StreamRoom;
