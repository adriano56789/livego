import React, { useState, useEffect, useRef, useMemo } from 'react';
import OnlineUsersModal from './live/OnlineUsersModal';
import ChatMessage from './live/ChatMessage';
import CoHostModal from './CoHostModal';
import EntryChatMessage from './live/EntryChatMessage';
import ToolsModal from './ToolsModal';
import { GiftIcon, MessageIcon, SendIcon, MoreIcon, CloseIcon, PlusIcon, ViewerIcon, StarIcon, HeartIcon, GoldCoinWithGIcon, BellIcon, TranslateIcon, CalendarIcon, FanClubHeaderIcon } from './icons';
import { Streamer, User, Gift, RankedUser, LiveSessionState, ToastType } from '../types';
import ContributionRankingModal from './ContributionRankingModal';
import BeautyEffectsPanel from './live/BeautyEffectsPanel';
import ResolutionPanel from './live/ResolutionPanel';
import { GiftModal } from './live/GiftModal';
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
import FanClubModal from './live/FanClubModal';
import JoinFanClubModal from './live/JoinFanClubModal';
import FanClubEntryMessage from './live/FanClubEntryMessage';
import UserMentionSuggestions from './live/UserMentionSuggestions';
import SupportersBar from './live/SupportersBar';
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
    onOpenFans: () => void;
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
    onOpenFanClubMembers: (streamer: User) => void;
    allUsers: User[];
    onOpenEditStreamInfo: (e: React.MouseEvent) => void;
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
        <div className="bg-purple-500/30 rounded-full p-1.5 px-3 flex items-center self-start text-xs shadow-md">
            <span className="text-purple-300 font-bold">{follower}</span>
            <span className="text-gray-200 ml-1.5">{t('streamRoom.followed')}</span>
            <span className="text-purple-300 font-bold ml-1.5">{followed}! 🎉</span>
        </div>
    );
};

export const PKBattleScreen: React.FC<PKBattleScreenProps> = ({ 
    streamer, opponent, onEndPKBattle, onRequestEndStream, onLeaveStreamView, onViewProfile, currentUser,
    onOpenWallet, onFollowUser, onOpenPrivateChat, onOpenPrivateInviteModal, onStartChatWithStreamer,
    onOpenPKTimerSettings, onOpenFans, onOpenFriendRequests, gifts, receivedGifts, liveSession,
    updateLiveSession, logLiveEvent, updateUser, onStreamUpdate, refreshStreamRoomData, addToast,
    followingUsers, pkBattleDuration, onOpenVIPCenter, streamers, onSelectStream, onOpenFanClubMembers, allUsers,
    onOpenEditStreamInfo
}) => {
    const { t, language } = useTranslation();
    
    const [isUiVisible, setIsUiVisible] = useState(true);
    const [timeLeft, setTimeLeft] = useState(pkBattleDuration * 60);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);
    
    const [myScore, setMyScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [myHearts, setMyHearts] = useState(0);
    const [opponentHearts, setOpponentHearts] = useState(0);
    const [hearts, setHearts] = useState<Heart[]>([]);

    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isBeautyPanelOpen, setIsBeautyPanelOpen] = useState(false);
    const [isCoHostModalOpen, setIsCoHostModalOpen] = useState(false);
    const [isOnlineUsersOpen, setOnlineUsersOpen] = useState(false);
    const [isRankingOpen, setIsRankingOpen] = useState(false);
    const [isResolutionPanelOpen, setIsResolutionPanelOpen] = useState(false);
    const [isGiftModalOpen, setGiftModalOpen] = useState(false);
    const [userActionModalState, setUserActionModalState] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
    const [isModerationMode, setIsModerationMode] = useState(false);
    const [isAutoPrivateInviteEnabled, setIsAutoPrivateInviteEnabled] = useState(liveSession?.isAutoPrivateInviteEnabled ?? false);
    const [onlineUsers, setOnlineUsers] = useState<(User & { value: number })[]>([]);
    const previousOnlineUsersRef = useRef<(User & { value: number })[]>([]);
    const [isFanClubModalOpen, setIsFanClubModalOpen] = useState(false);
    const [isJoinFanClubModalOpen, setIsJoinFanClubModalOpen] = useState(false);
    const [isChatInputFocused, setIsChatInputFocused] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);

    const [effectsQueue, setEffectsQueue] = useState<GiftPayload[]>([]);
    const [currentEffect, setCurrentEffect] = useState<GiftPayload | null>(null);

    const [isSendingGift, setIsSendingGift] = useState(false);
    const [streamerSupporters, setStreamerSupporters] = useState<(User & { contribution: number })[]>([]);
    const [opponentSupporters, setOpponentSupporters] = useState<(User & { contribution: number })[]>([]);
        
    const isBroadcaster = streamer.hostId === currentUser.id;
    const isFanClubMember = useMemo(() => !!currentUser.fanClub && currentUser.fanClub.streamerId === streamer.hostId, [currentUser.fanClub, streamer.hostId]);

    const [opponentIsFollowed, setOpponentIsFollowed] = useState(() => 
        followingUsers.some(u => u.id === opponent.id)
    );

    useEffect(() => {
        setOpponentIsFollowed(followingUsers.some(u => u.id === opponent.id));
    }, [followingUsers, opponent.id]);

    const handleFollowOpponent = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening profile
        onFollowUser(opponent, streamer.id);
        setOpponentIsFollowed(true); // Optimistic update
    };

    const swipeStart = useRef<{ x: number, y: number } | null>(null);
    const minSwipeDistance = 50;

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
            // Vertical swipe for navigation
            const currentIndex = streamers.findIndex(s => s.id === streamer.id);
            if (currentIndex === -1 || streamers.length <= 1) {
                 swipeStart.current = null;
                return;
            }

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


    const constructUserFromMessage = (user: ChatMessageType): User => ({ 
        id: `user-${user.id}`, identification: `user-${user.id}`, name: user.user!, avatarUrl: user.avatar!, 
        coverUrl: `https://picsum.photos/seed/${user.id}/1080/1920`, country: 'br', 
        gender: user.gender || 'not_specified', level: user.level || 1, xp: 0, age: user.age || 18, 
        location: 'Brasil', distance: 'desconhecida', fans: 0, following: 0, receptores: 0, enviados: 0,
        topFansAvatars: [], isLive: false, diamonds: 0, earnings: 0, 
        earnings_withdrawn: 0, bio: 'Usuário da plataforma', obras: [], curtidas: [], 
        ownedFrames: [], activeFrameId: user.activeFrameId || null, frameExpiration: user.frameExpiration || null,
        fanClub: user.fanClub,
    });
    
    const handleViewChatUserProfile = (user: ChatMessageType) => {
        if (!user.user || !user.avatar) return;
        const userProfile = constructUserFromMessage(user);
        onViewProfile(userProfile);
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

    const totalScore = myScore + opponentScore;
    const myProgress = totalScore > 0 ? (myScore / totalScore) * 100 : 50;
    
    const isStreamerFollowed = useMemo(() => followingUsers.some(u => u.id === streamer.hostId), [followingUsers, streamer.hostId]);

    const streamerUser = useMemo(() => ({
        id: streamer.hostId, identification: streamer.hostId, name: streamer.name, avatarUrl: streamer.avatar,
        coverUrl: `https://picsum.photos/seed/${streamer.hostId}/1080/1920`, country: streamer.country || 'br',
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

    const updateUserContribution = (supportersList: (User & { contribution: number })[], user: User, value: number) => {
        const userIndex = supportersList.findIndex(u => u.id === user.id);
        if (userIndex > -1) {
            const newList = [...supportersList];
            const updatedUser = {
                ...user, // Use fresh user object
                ...newList[userIndex], // Keep old properties if not in new user object
                contribution: (newList[userIndex].contribution || 0) + value,
            };
            newList[userIndex] = updatedUser;
            return newList;
        }
        return [...supportersList, { ...user, contribution: value }];
    };

    const handleSendGift = async (gift: Gift, quantity: number): Promise<User | null> => {
        if (isSendingGift) return null;
        const totalCost = (gift.price || 0) * quantity;
        if (currentUser.diamonds < totalCost) {
            handleRecharge();
            return null;
        }

        setIsSendingGift(true);
        
        const giftPayload: GiftPayload = {
            fromUser: currentUser,
            toUser: { id: streamer.hostId, name: streamer.name },
            gift,
            quantity,
            roomId: streamer.id
        };

        // --- OPTIMISTIC UPDATES ---
        setStreamerSupporters(prev => updateUserContribution(prev, currentUser, totalCost));
        setMyScore(prev => prev + totalCost);
        postGiftChatMessage(giftPayload);
        setEffectsQueue(prev => [...prev, giftPayload]);

        try {
            const { success, error, updatedSender } = await api.sendGift(currentUser.id, streamer.id, gift.name, quantity);
            
            if (success && updatedSender) {
                updateUser(updatedSender);
                if (gift.triggersAutoFollow && !isStreamerFollowed) {
                    onFollowUser(streamerUser, streamer.id);
                }
                return updatedSender;
            } else {
                throw new Error(error || "Falha ao enviar o presente.");
            }
        } catch (error) {
            addToast(ToastType.Error, (error as Error).message);
            // Revert optimistic updates
            setStreamerSupporters(prev => {
                const userIndex = prev.findIndex(u => u.id === currentUser.id);
                if (userIndex > -1) {
                    const newList = [...prev];
                    const updatedUser = { ...newList[userIndex], contribution: (newList[userIndex].contribution || 0) - totalCost };
                    if (updatedUser.contribution <= 0) return newList.filter(u => u.id !== currentUser.id);
                    newList[userIndex] = updatedUser;
                    return newList;
                }
                return prev;
            });
            setMyScore(prev => prev - totalCost);
            api.getCurrentUser().then(user => { if (user) updateUser(user); });
            return null;
        } finally {
            setIsSendingGift(false);
        }
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
            message: t(messageKey, messageOptions), // Simplified to string
            avatar: fromUser.avatarUrl,
            activeFrameId: fromUser.activeFrameId,
            frameExpiration: fromUser.frameExpiration,
            fanClub: fromUser.fanClub,
        };
        setMessages(prev => [...prev, giftMessage]);
    };

    useEffect(() => {
        setMyScore(liveSession?.coins || 0);
        const opponentInitialScore = Math.floor((liveSession?.coins || 0) * (Math.random() * 0.4 + 0.8));
        setOpponentScore(opponentInitialScore);
    }, [liveSession?.coins]);
    
    const handleHeartClick = (e: React.MouseEvent) => {
      if (isChatInputFocused) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      
      // Heart clicks on the opponent's side will now open their profile.
      // So, only generate hearts on our side.
      if (clickX > rect.width / 2) return;

      const side = 'mine';
      
      const newHeart: Heart = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY, side };
      setHearts(prev => [...prev, newHeart]);

      if (side === 'mine') setMyHearts(prev => prev + 1);
      
      api.sendPKHeart(streamer.id, 'A');

      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, 2000);
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
    
        api.getOnlineUsers(streamer.id).then(users => {
            setOnlineUsers(users || []);
            previousOnlineUsersRef.current = users || [];
        });
    }, [streamer.id, streamer.hostId, currentUser]);

    useEffect(() => {
        const handleOnlineUsersUpdate = (data: { roomId: string, users: (User & { value: number })[] }) => {
            if (data.roomId === streamer.id) {
                const newUsers = data.users;
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
                setOnlineUsers(newUsers);
                previousOnlineUsersRef.current = newUsers;
            }
        };
        const handleNewMessage = async (message: any) => {
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
                } else if (message.user !== currentUser.name) {
                     setMessages(prev => [...prev, message]);
                }
            }
        };
        const handleHeartUpdate = (data: { roomId: string, heartsA: number, heartsB: number }) => {
             if (data.roomId === streamer.id) {
                setMyHearts(data.heartsA);
                setOpponentHearts(data.heartsB);
            }
        };

        const handleNewGift = (payload: GiftPayload) => {
            if (payload.roomId !== streamer.id) return;

            postGiftChatMessage(payload); // Everyone sees the chat message

            // Only process score updates & animations for gifts from OTHER users,
            // as our own are handled optimistically.
            if (payload.fromUser.id !== currentUser.id) {
                const { fromUser, gift, toUser, quantity } = payload;
                const totalValue = (gift.price || 0) * quantity;
                
                if (toUser.id === streamer.hostId) {
                    setMyScore(prev => prev + totalValue);
                    setStreamerSupporters(prev => updateUserContribution(prev, fromUser, totalValue));
                } else if (toUser.id === opponent.id) {
                    setOpponentScore(prev => prev + totalValue);
                    setOpponentSupporters(prev => updateUserContribution(prev, fromUser, totalValue));
                }

                setEffectsQueue(prev => [...prev, payload]);
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
    }, [streamer.id, streamer.hostId, opponent.id, t, currentUser, onOpenFriendRequests, language]);

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
        
    const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setChatInput(value);

        const lastWord = value.split(' ').pop() || '';
        if (lastWord.startsWith('@')) {
            const query = lastWord.substring(1).toLowerCase();
            setMentionQuery(query);
            setShowMentionSuggestions(true);
        } else {
            setShowMentionSuggestions(false);
            setMentionQuery('');
        }
    };

    const handleMentionSelect = (username: string) => {
        const words = chatInput.split(' ');
        words.pop(); // remove the partial mention
        words.push(`@${username} `);
        const newChatInput = words.join(' ');
        
        setChatInput(newChatInput);
        setShowMentionSuggestions(false);
        setMentionQuery('');
        
        chatInputRef.current?.focus();
    };
    
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
            fanClub: currentUser.fanClub,
        };
        setMessages(prev => [...prev, messagePayload]);
        setChatInput('');
        setShowMentionSuggestions(false);
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
            // The state will be updated via WebSocket broadcast
            addToast(ToastType.Success, newAutoInviteState ? 'Convite automático ativado.' : 'Convite automático desativado.');
        } catch (error) {
            addToast(ToastType.Error, "Falha ao alterar a configuração.");
        }
    };

    if (!opponent) return <div className="absolute inset-0 bg-black flex items-center justify-center"><LoadingSpinner /></div>;
    
    const mentionSuggestions = useMemo(() => {
        if (!showMentionSuggestions || !mentionQuery) return [];
        return onlineUsers.filter(u => 
            u.name.toLowerCase().includes(mentionQuery) && u.id !== currentUser.id
        ).slice(0, 5);
    }, [mentionQuery, onlineUsers, currentUser.id, showMentionSuggestions]);

    const isJuFeFanClub = streamer.hostId === '40583726';

    return (
        <div className="absolute inset-0 bg-black flex flex-col font-sans text-white z-10"
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseUp={(e) => handlePointerUp(e.clientX, e.clientY)}
            onTouchStart={(e) => handlePointerDown(e.targetTouches[0].clientX, e.targetTouches[0].clientY)}
            onTouchEnd={(e) => handlePointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
        >
            {/* Video Container */}
            <div className="h-[65%] w-full relative" onClick={handleHeartClick}>
                <div className="absolute inset-0 grid grid-cols-2">
                    <div className="h-full w-full bg-gray-900 border-r-2 border-yellow-400">
                        <img src={streamerUser.coverUrl} alt={streamerUser.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="h-full w-full bg-gray-800 relative cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile(opponent); }}>
                        <img src={opponent.coverUrl} alt={opponent.name} className="w-full h-full object-cover" />
                        {!opponentIsFollowed && (
                            <div className={`absolute top-0 right-0 p-4 transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                <button 
                                    onClick={handleFollowOpponent} 
                                    className="w-10 h-10 bg-pink-500/80 rounded-full flex items-center justify-center text-white z-10 backdrop-blur-sm shadow-lg"
                                    aria-label={`Seguir ${opponent.name}`}
                                >
                                    <PlusIcon className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                 <FullScreenGiftAnimation 
                    payload={currentEffect}
                    onEnd={() => setCurrentEffect(null)}
                />

                <header className={`p-3 bg-transparent absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-2">
                                <div className="flex flex-col space-y-2">
                                     <div className={`flex items-center ${isJuFeFanClub ? 'bg-pink-600/90 rounded-2xl' : 'bg-black/40 rounded-full'} p-1 pr-3 space-x-2`}>
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
                                        {isBroadcaster || isStreamerFollowed ? (
                                            <button onClick={(e) => { e.stopPropagation(); setIsFanClubModalOpen(true); }} className="shrink-0">
                                                <FanClubHeaderIcon className="w-9 h-9" />
                                            </button>
                                        ) : (
                                            <button onClick={(e) => { e.stopPropagation(); handleFollowStreamer(streamerUser); }} className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white shrink-0">
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2 pl-1">
                                        <button onClick={(e) => { e.stopPropagation(); setIsRankingOpen(true); }} className="flex items-center bg-black/40 rounded-full px-2 py-1 space-x-1 text-xs cursor-pointer">
                                            <GoldCoinWithGIcon className="w-4 h-4" />
                                            <span className="text-white font-semibold">{myScore.toLocaleString()}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end space-y-2">
                                <div className="flex items-center space-x-2">
                                    {onlineUsers.slice(0, 3).map((user) => (
                                        <button key={user.id} onClick={(e) => { e.stopPropagation(); onViewProfile(user); }}>
                                            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                        </button>
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
                <div className="absolute bottom-0 left-0 right-0">
                    <SupportersBar streamerSupporters={streamerSupporters} opponentSupporters={opponentSupporters} onViewProfile={onViewProfile} />
                </div>
            </div>

            {/* Chat Container */}
            <div 
                className={`h-[35%] w-full flex flex-col bg-black transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={e => e.stopPropagation()}
                onTouchStart={e => {
                    if (isChatInputFocused) return;
                    e.stopPropagation();
                }}
            >
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto no-scrollbar p-3 flex flex-col justify-end">
                    <div className="space-y-2">
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
                                    message={msg.message || ''}
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

                <footer className="relative p-3 border-t border-gray-800/50 flex-shrink-0">
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
                                placeholder={t('streamRoom.sayHi')} 
                                value={chatInput} 
                                onChange={handleChatInputChange} 
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)} 
                                onFocus={() => setIsChatInputFocused(true)} 
                                onBlur={() => setTimeout(() => setIsChatInputFocused(false), 200)}
                                className="flex-grow bg-transparent px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none" 
                            />
                            <button onClick={handleSendMessage} className="bg-gray-500/50 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-gray-400/50 transition-colors">
                                <SendIcon className="w-5 h-5 text-white" />
                            </button>
                        </div>
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
            
            {isOnlineUsersOpen && <OnlineUsersModal onClose={() => setOnlineUsersOpen(false)} streamId={streamer.id} />}
            {isRankingOpen && <ContributionRankingModal onClose={() => setIsRankingOpen(false)} liveRanking={onlineUsers} />}
            
            <ToolsModal 
                isOpen={isToolsOpen} 
                onClose={() => setIsToolsOpen(false)} 
                onOpenCoHostModal={(e) => { e.stopPropagation(); setIsToolsOpen(false); setIsCoHostModalOpen(true); }}
                isPKBattleActive={true} 
                onEndPKBattle={(e) => { e.stopPropagation(); onEndPKBattle(); }}
                onOpenBeautyPanel={(e) => { e.stopPropagation(); setIsToolsOpen(false); setIsBeautyPanelOpen(true); }} 
                onOpenPrivateChat={onOpenPrivateChat} 
                onOpenPrivateInviteModal={(e) => { e.stopPropagation(); onOpenPrivateInviteModal(); }}
                onOpenClarityPanel={(e) => { e.stopPropagation(); setIsToolsOpen(false); setIsResolutionPanelOpen(true); }}
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
                onOpenEditStreamInfo={onOpenEditStreamInfo}
            />
            <GiftModal 
                isOpen={isGiftModalOpen} 
                onClose={() => setGiftModalOpen(false)} 
                userDiamonds={currentUser.diamonds || 0} 
                onSendGift={handleSendGift} 
                onRecharge={() => onOpenWallet('Diamante')} 
                gifts={gifts} 
                receivedGifts={receivedGifts} 
                isBroadcaster={isBroadcaster} 
                onOpenVIPCenter={onOpenVIPCenter} 
                isVIP={currentUser.isVIP || false} 
            />
            {isBeautyPanelOpen && <BeautyEffectsPanel onClose={() => setIsBeautyPanelOpen(false)} currentUser={currentUser} addToast={addToast} />}
            {isCoHostModalOpen && <CoHostModal isOpen={isCoHostModalOpen} onClose={() => setIsCoHostModalOpen(false)} onInvite={()=>{}} onOpenTimerSettings={onOpenPKTimerSettings} currentUser={currentUser} addToast={addToast} streamId={streamer.id} allUsers={allUsers} />}
            <ResolutionPanel isOpen={isResolutionPanelOpen} onClose={() => setIsResolutionPanelOpen(false)} onSelectResolution={()=>{}} currentResolution={"480p"} />

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
};

export default PKBattleScreen;