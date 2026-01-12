

import React, { useState, useEffect, useRef, useMemo } from 'react';
import OnlineUsersModal from './live/OnlineUsersModal';
import ChatMessage from './live/ChatMessage';
import CoHostModal from './CoHostModal';
import EntryChatMessage from './live/EntryChatMessage';
import ToolsModal from './ToolsModal';
import { GiftIcon, SendIcon, MoreIcon, CloseIcon, ViewerIcon, BellIcon, LockIcon } from './icons';
import { Streamer, User, Gift, RankedUser, LiveSessionState, ToastType, GiftSendPayload } from '../types';
import ContributionRankingModal from './ContributionRankingModal';
import BeautyEffectsPanel from './live/BeautyEffectsPanel';
import ResolutionPanel from './live/ResolutionPanel';
import GiftModal from './live/GiftModal';
import GiftAnimationOverlay from './live/GiftAnimationOverlay';
import { useTranslation } from '../i18n';
import { api } from '../services/api';
import { webSocketManager } from '../services/websocket';
import FullScreenGiftAnimation from './live/FullScreenGiftAnimation';
import PrivateInviteModal from './live/PrivateInviteModal';
import SupportersBar from './live/SupportersBar';
import { GIFTS } from '../constants';

interface ChatMessageType {
    id: number;
    type: 'chat' | 'entry' | 'follow' | 'private_invite';
    user?: string;
    level?: number;
    message?: string | React.ReactNode;
    avatar?: string;
    fullUser?: User;
    inviteData?: {
        fromName: string;
        toName: string;
        streamId: string;
    };
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
    liveSession: LiveSessionState | null;
    updateLiveSession: (updates: Partial<LiveSessionState>) => void;
    logLiveEvent: (type: string, data: any) => void;
    updateUser: (user: User) => void;
    onStreamUpdate: (updates: Partial<Streamer>) => void;
    refreshStreamRoomData: (streamerId: string) => void;
    addToast: (type: ToastType, message: string) => void;
    rankingData?: Record<string, RankedUser[]>;
    followingUsers?: User[];
    pkBattleDuration: number;
    streamers: Streamer[];
    onSelectStream: (streamer: Streamer) => void;
    onOpenVIPCenter: () => void;
    onOpenFanClubMembers: (streamer: User) => void;
    allUsers?: User[];
}

export const PKBattleScreen: React.FC<PKBattleScreenProps> = ({ 
    streamer, opponent, onEndPKBattle, onRequestEndStream, onLeaveStreamView, onViewProfile, currentUser,
    onOpenWallet, onFollowUser, onOpenPrivateChat, onOpenPrivateInviteModal, onStartChatWithStreamer,
    onOpenPKTimerSettings, onOpenFans, onOpenFriendRequests, liveSession,
    updateLiveSession, logLiveEvent, updateUser, onStreamUpdate, refreshStreamRoomData, addToast,
    followingUsers = [], pkBattleDuration, onOpenVIPCenter, streamers, onSelectStream, onOpenFanClubMembers, allUsers
}) => {
    const { t } = useTranslation();
    const [timeLeft, setTimeLeft] = useState(pkBattleDuration * 60);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isGiftModalOpen, setGiftModalOpen] = useState(false);
    const [isOnlineUsersOpen, setOnlineUsersOpen] = useState(false);
    const [isPrivateInviteModalOpen, setIsPrivateInviteModalOpen] = useState(false);
    const [isRankingOpen, setIsRankingOpen] = useState(false);
    const [isCoHostModalOpen, setIsCoHostModalOpen] = useState(false);
    const [isResolutionPanelOpen, setIsResolutionPanelOpen] = useState(false);
    const [isBeautyPanelOpen, setIsBeautyPanelOpen] = useState(false);
    const [currentResolution, setCurrentResolution] = useState(streamer.quality || '1080p');
    
    const [onlineUsers, setOnlineUsers] = useState<(User & { value: number })[]>([]);
    const [currentEffect, setCurrentEffect] = useState<GiftSendPayload | null>(null);
    const [bannerGifts, setBannerGifts] = useState<(GiftSendPayload & { id: number })[]>([]);
    const nextGiftId = useRef(0);
    const [receivedGifts, setReceivedGifts] = useState<(Gift & { count: number })[]>([]);
    const previousOnlineUsersRef = useRef<(User & { value: number })[]>([]);

    const isBroadcaster = streamer.hostId === currentUser.id;

    const streamerUser: User = useMemo(() => ({
        id: streamer.hostId,
        identification: streamer.hostId,
        name: streamer.name,
        avatarUrl: streamer.avatar,
        coverUrl: `https://picsum.photos/seed/${streamer.id}/800/1600`,
        country: streamer.country,
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

    useEffect(() => {
        if (!streamer.id) return;

        const updateUsersList = (newUsers: (User & { value: number })[]) => {
            setOnlineUsers(newUsers);
            const previousUsers = previousOnlineUsersRef.current;
            if (previousUsers.length > 0) {
                const previousUserIds = new Set(previousUsers.map(u => u.id));
                const newlyJoinedUsers = newUsers.filter(u => !previousUserIds.has(u.id) && u.id !== currentUser.id);

                if (newlyJoinedUsers.length > 0) {
                    const entryMessages: ChatMessageType[] = newlyJoinedUsers.map(user => ({
                        id: Date.now() + Math.random(),
                        type: 'entry',
                        fullUser: user,
                        user: user.name,
                        avatar: user.avatarUrl,
                    }));
                    setMessages(prev => [...prev, ...entryMessages]);
                }
            }
            previousOnlineUsersRef.current = newUsers;
        };

        api.users.getOnlineUsers(streamer.id).then(data => {
            const users = Array.isArray(data) ? data : [];
            const mappedUsers = users.map(u => ({ ...u, value: (u as any).value || 0 }));
            updateUsersList(mappedUsers);
        });
        
        api.gifts.getGallery().then(gifts => {
            if (Array.isArray(gifts)) {
                setReceivedGifts(gifts);
            }
        });
        
        const handleInvite = (payload: any) => {
            if (payload.toUserId === currentUser.id || isBroadcaster) {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'private_invite',
                    inviteData: payload
                } as ChatMessageType]);
            }
        };

        const handleNewGift = (payload: GiftSendPayload) => {
            if (payload.roomId !== streamer.id) return;
            if (liveSession) {
                const totalGiftValue = payload.gift.price * payload.quantity;
                updateLiveSession({ coins: (liveSession.coins || 0) + totalGiftValue });
            }
            setMessages(prev => [...prev, {
                id: Date.now(), type: 'chat', user: payload.fromUser.name, avatar: payload.fromUser.avatarUrl,
                message: `enviou ${payload.quantity}x ${payload.gift.icon} ${payload.gift.name}`
            }]);
            setCurrentEffect(payload);
        };

        const handleOnlineUsersUpdate = (data: { roomId: string; users: (User & { value: number })[] }) => {
            if (data.roomId !== streamer.id) return;
            api.users.getOnlineUsers(streamer.id).then(freshUsersData => {
                const freshUsers = Array.isArray(freshUsersData) ? freshUsersData : [];
                const usersWithValue = freshUsers.map(u => ({ ...u, value: (u as any).value || 0 }));
                updateUsersList(usersWithValue);
            });
        };

        webSocketManager.on('privateRoomInvite', handleInvite);
        webSocketManager.on('newStreamGift', handleNewGift);
        webSocketManager.on('onlineUsersUpdate', handleOnlineUsersUpdate);
        return () => { 
            webSocketManager.off('privateRoomInvite', handleInvite); 
            webSocketManager.off('newStreamGift', handleNewGift);
            webSocketManager.off('onlineUsersUpdate', handleOnlineUsersUpdate);
        };
    }, [streamer.id, currentUser.id, isBroadcaster, liveSession, updateLiveSession]);

    useEffect(() => {
        const timerId = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(timerId);
    }, []);

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'chat',
            user: currentUser.name,
            avatar: currentUser.avatarUrl,
            message: chatInput.trim()
        }]);
        setChatInput('');
    };

    const handleJoinPrivate = (invite: any) => {
        addToast(ToastType.Success, `Saindo da batalha para entrar na sala de ${invite.fromName}...`);
        onEndPKBattle();
    };

    const handleFullscreenGiftAnimationEnd = () => {
        if (currentEffect) {
            const newBanner = { ...currentEffect, id: nextGiftId.current++ };
            setBannerGifts(prev => [...prev, newBanner].slice(-5));
        }
        setCurrentEffect(null);
    };

    const handleBannerAnimationEnd = (id: number) => {
        setBannerGifts(prev => prev.filter(g => g.id !== id));
    };

    const handleSendGift = async (gift: Gift, quantity: number, targetId?: string): Promise<User | null> => {
        const totalCost = (gift.price || 0) * quantity;
        if (currentUser.diamonds < totalCost) {
            onOpenWallet('Diamante');
            return null;
        }
        
        try {
            const result = await api.sendGift(currentUser.id, streamer.id, gift.name, quantity, targetId || streamer.hostId);
            if (result.success && result.updatedSender) {
                updateUser(result.updatedSender);
                
                const giftPayload: GiftSendPayload = {
                    fromUser: currentUser,
                    toUser: { id: targetId || streamer.hostId, name: 'Streamer' },
                    gift,
                    quantity,
                    roomId: streamer.id
                };

                setCurrentEffect(giftPayload);

                if (liveSession && (targetId === streamer.hostId || !targetId)) {
                    updateLiveSession({ coins: (liveSession.coins || 0) + totalCost });
                }

                return result.updatedSender;
            }
            return null;
        } catch(error: any) {
            addToast(ToastType.Error, error.message || "Falha ao enviar o presente.");
            api.users.me().then(user => updateUser(user)); 
            return null;
        }
    };
    
    const streamerSupporters = useMemo(() => {
        return onlineUsers.filter((u, i) => i % 2 === 0).map(u => ({...u, contribution: u.value || 0}));
    }, [onlineUsers]);

    const opponentSupporters = useMemo(() => {
        return onlineUsers.filter((u, i) => i % 2 !== 0).map(u => ({...u, contribution: u.value || 0}));
    }, [onlineUsers]);
    
    const handleSelectResolution = async (resolution: string) => {
        if (!isBroadcaster) {
            addToast(ToastType.Warning, "Apenas o anfitrião pode alterar a resolução.");
            setIsResolutionPanelOpen(false);
            return;
        }

        const { success } = await api.streams.updateVideoQuality(streamer.id, resolution);
        if (success) {
            setCurrentResolution(resolution);
            onStreamUpdate({ quality: resolution });
            addToast(ToastType.Success, `Qualidade do vídeo alterada para ${resolution}`);
        } else {
            addToast(ToastType.Error, `Falha ao alterar a qualidade do vídeo.`);
        }
        setIsResolutionPanelOpen(false);
    };

    return (
        <div className="absolute inset-0 bg-black flex flex-col font-sans text-white z-10 overflow-hidden">
            <header className="absolute top-0 left-0 right-0 z-20 p-4 pt-12 flex justify-end items-center">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setOnlineUsersOpen(true)}
                        className="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"
                    >
                        <BellIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={isBroadcaster ? onEndPKBattle : onLeaveStreamView}
                        className="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>
            
            <div className="h-[60%] w-full relative grid grid-cols-2">
                <div className="h-full border-r border-yellow-400/50 relative">
                    <img src={`https://picsum.photos/seed/${streamer.hostId}/500/800`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                        <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold">ME</div>
                        <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1.5 text-xs">
                            <ViewerIcon className="w-3.5 h-3.5 text-white" />
                            <span className="font-bold text-white">{(liveSession?.viewers || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="h-full relative">
                    <img src={opponent.coverUrl} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold uppercase">Opponent</div>
                </div>
                
                <FullScreenGiftAnimation payload={currentEffect} onEnd={handleFullscreenGiftAnimationEnd} />
                
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 font-black text-xs flex items-center gap-2">
                    <LockIcon className="w-3 h-3 text-gray-300" />
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
            </div>

            <SupportersBar 
                streamerSupporters={streamerSupporters}
                opponentSupporters={opponentSupporters}
                onViewProfile={onViewProfile}
            />

            <div className="flex-1 bg-black flex flex-col p-3 gap-2 overflow-hidden">
                <div className="absolute top-[62%] left-3 z-30 pointer-events-none flex flex-col-reverse items-start">
                    {bannerGifts.map((payload) => (
                        <GiftAnimationOverlay 
                            key={payload.id}
                            giftPayload={payload}
                            onAnimationEnd={handleBannerAnimationEnd}
                        />
                    ))}
                </div>
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2">
                    {messages.map(msg => (
                        <div key={msg.id}>
                            {msg.type === 'private_invite' ? (
                                <div onClick={() => handleJoinPrivate(msg.inviteData)} className="bg-purple-600/90 p-3 rounded-xl border border-white/20 cursor-pointer active:scale-95 transition-all">
                                    <p className="text-[12px] font-bold text-white leading-tight">
                                        “{msg.inviteData?.fromName} convidou para a sala privada”
                                    </p>
                                    <span className="text-[10px] text-purple-200 mt-1 block font-bold uppercase">Toque para aceitar</span>
                                </div>
                            ) : msg.type === 'entry' && msg.fullUser ? (
                                <EntryChatMessage 
                                    user={msg.fullUser} 
                                    onClick={onViewProfile} 
                                    currentUser={currentUser}
                                    onFollow={onFollowUser}
                                    isFollowed={followingUsers.some(u => u.id === msg.fullUser!.id)}
                                    streamer={streamer}
                                />
                            ) : (
                                <ChatMessage userObject={{ name: msg.user, avatarUrl: msg.avatar, level: 1 }} message={msg.message!} onAvatarClick={() => {}} streamerId={streamer.hostId} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/10 rounded-full flex items-center pr-2 border border-transparent focus-within:border-purple-500/50 transition-colors">
                        <input 
                            type="text" 
                            className="flex-1 bg-transparent px-4 py-2 outline-none text-sm" 
                            placeholder="Diga algo..." 
                            value={chatInput} 
                            onChange={e => setChatInput(e.target.value)} 
                            onKeyPress={e => e.key === 'Enter' && handleSendMessage()} 
                        />
                        <button 
                            onClick={handleSendMessage} 
                            disabled={!chatInput.trim()}
                            className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white shrink-0 active:scale-90 transition-transform disabled:bg-gray-500"
                        >
                            <SendIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <button onClick={() => setGiftModalOpen(true)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-yellow-400 shrink-0"><GiftIcon className="w-6 h-6" /></button>
                    <button onClick={() => setIsToolsOpen(true)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0"><MoreIcon className="w-6 h-6" /></button>
                </div>
            </div>

            <GiftModal 
                isOpen={isGiftModalOpen} 
                onClose={() => setGiftModalOpen(false)} 
                currentUser={currentUser}
                onUpdateUser={updateUser}
                onSendGift={handleSendGift} 
                onRecharge={() => onOpenWallet('Diamante')} 
                gifts={GIFTS}
                onOpenVIPCenter={onOpenVIPCenter}
                receivedGifts={receivedGifts}
                hostUser={streamerUser}
                onlineUsers={onlineUsers}
                streamId={streamer.id}
                hostId={streamer.hostId}
                isBroadcaster={isBroadcaster}
            />

            <ToolsModal 
                isOpen={isToolsOpen} 
                onClose={() => setIsToolsOpen(false)} 
                onOpenCoHostModal={() => { setIsToolsOpen(false); setIsCoHostModalOpen(true); }}
                isPKBattleActive={true}
                onEndPKBattle={onEndPKBattle}
                onOpenBeautyPanel={() => { setIsToolsOpen(false); setIsBeautyPanelOpen(true); }}
                onOpenPrivateChat={onOpenPrivateChat}
                onOpenPrivateInviteModal={() => setIsPrivateInviteModalOpen(true)}
                onOpenClarityPanel={() => { setIsToolsOpen(false); setIsResolutionPanelOpen(true); }}
                onOpenRanking={() => setIsRankingOpen(true)}
                isMicrophoneMuted={false}
                onToggleMicrophone={() => {}}
                isSoundMuted={false}
                onToggleSound={() => {}}
                isAutoFollowEnabled={false}
                onToggleAutoFollow={() => {}}
                isAutoPrivateInviteEnabled={false}
                onToggleAutoPrivateInvite={() => {}}
                onToggleModeration={() => {}}
                isModerationActive={false}
            />

            {isPrivateInviteModalOpen && <PrivateInviteModal isOpen={isPrivateInviteModalOpen} onClose={() => setIsPrivateInviteModalOpen(false)} streamId={streamer.id} hostId={streamer.hostId} />}
            {isOnlineUsersOpen && <OnlineUsersModal onClose={() => setOnlineUsersOpen(false)} streamId={streamer.id} users={onlineUsers} />}
            {isRankingOpen && (
                <ContributionRankingModal 
                    onClose={() => setIsRankingOpen(false)} 
                    liveRanking={onlineUsers}
                />
            )}
            
            {isCoHostModalOpen && (
                <CoHostModal 
                    isOpen={isCoHostModalOpen} 
                    onClose={() => setIsCoHostModalOpen(false)} 
                    onInvite={() => addToast(ToastType.Warning, "Não é possível convidar co-host durante uma Batalha PK.")}
                    onOpenTimerSettings={onOpenPKTimerSettings}
                    currentUser={currentUser}
                    addToast={addToast}
                    streamId={streamer.id}
                />
            )}

            {isResolutionPanelOpen && (
                <ResolutionPanel
                    isOpen={isResolutionPanelOpen}
                    onClose={() => setIsResolutionPanelOpen(false)}
                    onSelectResolution={handleSelectResolution}
                    currentResolution={currentResolution}
                />
            )}

            {isBeautyPanelOpen && (
                <BeautyEffectsPanel 
                    onClose={() => setIsBeautyPanelOpen(false)} 
                    addToast={addToast}
                />
            )}
        </div>
    );
};
