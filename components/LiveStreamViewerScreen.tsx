

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { User, Stream, PkBattle, ChatMessage, LiveDetails, PkInvitation, SoundEffectName, MuteStatusListener, UserKickedListener, SoundEffectListener, PublicProfile, PkBattleState, ConvitePK, IncomingPrivateLiveInvite, UserBlockedListener, UserUnblockedListener, Viewer, PkBattleStreamer, AppView, FacingMode, CameraStatus, Conversation, TabelaRankingApoiadores } from '../types';
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
import RankingListScreen from './RankingListScreen';
import PkStartDisputeModal from './PkStartDisputeModal';
import PkClashAnimation from './PkClashAnimation';
import LiveStreamHeader from './LiveStreamHeader';
import PkResultModal from './PkResultModal';
import PkInviteModal from './PkInviteModal';
import PkInvitationModal from './PkInvitationModal';
import PkTopSupporter from './PkTopSupporter';
import EditProfileScreen from './EditProfileScreen';
// FIX: Removed unused import for EmbeddedChatView as the file is not a module.
import GiftDisplayAnimation from './GiftDisplayAnimation';
import PkBattleOverlay from './PkBattleOverlay';
// FIX: Added missing import for UserProfileModal.
import UserProfileModal from './UserProfileModal';
import { getConversations } from '../services/authService';
import ConversationListItem from './ConversationListItem';
import PkRankingModal from './PkRankingModal';
import FloatingGiftAvatars from './FloatingGiftAvatars';


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
import MessageIcon from './icons/MessageIcon';


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

interface PrivateChatListModalProps {
  user: User;
  onClose: () => void;
  onNavigate: (view: AppView, meta?: any) => void;
}

const PrivateChatListModal: React.FC<PrivateChatListModalProps> = ({ user, onClose, onNavigate }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const convos = await getConversations(user.id);
        setConversations(convos);
      } catch (err) {
        console.error("Failed to load conversations for modal:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [user.id]);

  const handleConversationClick = (convo: Conversation) => {
    // This local onClose call was likely causing a race condition with the parent navigation.
    // Removing it allows the parent's navigation logic to unmount this component cleanly.
    // onClose(); 
    if (convo.type === 'friend_requests_summary') {
      onNavigate('friend-requests');
    } else {
      onNavigate('chat', { conversationId: convo.id });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div 
        className="bg-[#121212] w-full h-[70vh] max-h-[600px] rounded-t-2xl flex flex-col animate-slide-up-fast"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-gray-800 shrink-0">
          <div className="w-6 h-6"></div>
          <h2 className="text-lg font-bold">Mensagens Privadas</h2>
          <button onClick={onClose}><CrossIcon className="w-6 h-6 text-gray-400" /></button>
        </header>
        <main className="flex-grow overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="text-center text-gray-400 pt-10">Carregando...</div>
          ) : conversations.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {conversations.map(convo => (
                <ConversationListItem 
                  key={convo.id} 
                  conversation={convo} 
                  onClick={() => handleConversationClick(convo)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 pt-20">Nenhuma mensagem.</div>
          )}
        </main>
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
    const [areFloatingAvatarsVisible, setAreFloatingAvatarsVisible] = useState(false);
    
    // Modal states
    const [isGiftPanelOpen, setIsGiftPanelOpen] = useState(false);
    const [isArcoraToolModalOpen, setIsArcoraToolModalOpen] = useState(false);
    const [isMuteUserModalOpen, setIsMuteUserModalOpen] = useState(false);
    const [kickedState, setKickedState] = useState<'kicked' | 'denied' | null>(null);
    const [isEndStreamModalOpen, setIsEndStreamModalOpen] = useState(false);
    const [isPkInviteModalOpen, setIsPkInviteModalOpen] = useState(false);
    const [isInviteToPrivateLiveModalOpen, setIsInviteToPrivateLiveModalOpen] = useState(false);
    const [isPrivateChatModalOpen, setIsPrivateChatModalOpen] = useState(false);
    const [isPkStartDisputeModalOpen, setIsPkStartDisputeModalOpen] = useState(false);
    const [showPkClashAnimation, setShowPkClashAnimation] = useState(false);
    const [viewingProfileId, setViewingProfileId] = useState<number | null>(null);
    const [isMutedNotification, setIsMutedNotification] = useState<'muted' | 'unmuted' | null>(null);
    const [pkRankingToShow, setPkRankingToShow] = useState<{ streamer: PkBattleStreamer, supporters: TabelaRankingApoiadores[] } | null>(null);
    const [viewingOnlineUsersForStreamId, setViewingOnlineUsersForStreamId] = useState<number | null>(null);
    const [isHourlyRankingModalOpen, setIsHourlyRankingModalOpen] = useState(false);
    const [isRankingListScreenOpen, setIsRankingListScreenOpen] = useState(false);
    
    // State for PK invitations sent by the current user
    const [invitation, setInvitation] = useState<ConvitePK | null>(null);
    const [invitedOpponent, setInvitedOpponent] = useState<User | null>(null);

    const streamer1Id = isPkBattle ? (initialStreamOrBattle as PkBattle).streamer1.userId : (initialStreamOrBattle as Stream).userId;
    const streamer2Id = isPkBattle ? (initialStreamOrBattle as PkBattle).streamer2.userId : null;
    const isCurrentUserHost = user.id === streamer1Id || user.id === streamer2Id;
    const streamId = isPkBattle ? (initialStreamOrBattle as PkBattle).streamer1.streamId : (initialStreamOrBattle as Stream).id;
    const streamId2 = isPkBattle ? (initialStreamOrBattle as PkBattle).streamer2.streamId : null;

    // Host camera/mic state
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
    const [facingMode, setFacingMode] = useState<FacingMode>('user');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const details1 = await liveStreamService.getLiveStreamDetails(streamId);
                setLiveDetails(details1);
                const messages = await liveStreamService.getChatMessages(streamId);
                setChatMessages(messages);
                const viewers = await liveStreamService.getViewers(streamId);
                setHeaderViewers({ [streamId]: viewers.slice(0, 3) });

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
            if (liveId === streamId) {
                messages.forEach(msg => {
                    if(msg.type === 'gift') {
                        setTriggeredGift(null);
                        setTimeout(() => setTriggeredGift(msg), 10);
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
        return () => liveStreamService.removeChatMessageListener(chatListener);
    }, [streamId, streamId2, streamer2Id, isPkBattle, onExit]);

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
    
    // FIX: Added handleSendGift to manage gift sending logic.
    const handleSendGift = useCallback(async (giftId: number, quantity: number, receiverId?: number) => {
        try {
            const response = await liveStreamService.sendGift(streamId, user.id, giftId, quantity, receiverId);
            if (response.success && response.updatedUser) {
                onUpdateUser(response.updatedUser);
            } else {
                if (response.message.includes('insuficientes')) {
                    setIsGiftPanelOpen(false);
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

    const handleSendMessage = useCallback(async (message: string, imageUrl?: string) => {
        setIsUploading(true);
        try {
            await liveStreamService.sendChatMessage(streamId, user.id, message, imageUrl);
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsUploading(false);
        }
    }, [streamId, user.id]);

    const handleSendPkInvite = async (opponent: User) => {
        setIsPkInviteModalOpen(false);
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

    const handleCoinsClick = (streamerId: number) => {
        if (!activePkBattle) return;
    
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

    if (isPkBattle && activePkBattle) {
        const s1 = (initialStreamOrBattle as PkBattle).streamer1;
        const s2 = (initialStreamOrBattle as PkBattle).streamer2;

        return (
            <div className="h-full w-full bg-black text-white flex flex-col font-sans">
                {/* Top part: Video streams */}
                <div className="h-[65%] relative flex">
                    {/* Streamer 1 Video Placeholder */}
                    <div className="relative w-1/2 h-full bg-gray-900 flex items-center justify-center">
                        <p className="text-gray-500">Stream de {s1.name}</p>
                    </div>
                    {/* Streamer 2 Video Placeholder */}
                    <div className="relative w-1/2 h-full bg-gray-800 flex items-center justify-center">
                        <p className="text-gray-500">Stream de {s2.name}</p>
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
                                    onUserClick={() => onViewProfile(s1.userId)}
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
                                    onUserClick={() => onViewProfile(s2.userId)}
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
                                <PkTopSupporter key={supporter.apoiador_id} supporter={supporter} onUserClick={onViewProfile} />
                            ))}
                        </div>
                        <div className="flex items-center gap-2 pointer-events-auto">
                            {activePkBattle.top_supporters_B.slice(0, 3).map(supporter => (
                                <PkTopSupporter key={supporter.apoiador_id} supporter={supporter} onUserClick={onViewProfile} />
                            ))}
                        </div>
                    </div>
                    <GiftDisplayAnimation triggeredGift={triggeredGift} />
                    <main className={`flex-grow flex flex-col justify-end overflow-hidden pt-2 pr-2 pb-2 transition-all duration-300 chat-fade-out-top ${areFloatingAvatarsVisible ? 'pl-48' : 'pl-2'}`}>
                        <ChatArea messages={chatMessages} onUserClick={onNavigateToChat} maxHeightClass="max-h-full" isPkMode />
                    </main>
                    <FloatingGiftAvatars triggeredGift={triggeredGift} onVisibilityChange={setAreFloatingAvatarsVisible} />
                    <footer className="shrink-0 flex items-center gap-2 p-2 pt-0">
                        <ChatInput onSendMessage={handleSendMessage} isUploading={isUploading} />
                        <button onClick={() => setIsGiftPanelOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                            <GiftBoxIcon className="w-7 h-7"/>
                        </button>
                        {isCurrentUserHost && (
                            <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                                <MoreToolsIcon className="w-7 h-7"/>
                            </button>
                        )}
                    </footer>
                </div>
                
                {isGiftPanelOpen && (
                    <GiftPanel
                        user={user}
                        liveId={streamId}
                        streamerId={streamer1Id}
                        isHost={isCurrentUserHost}
                        onClose={() => setIsGiftPanelOpen(false)}
                        onSendGift={handleSendGift}
                        onRechargeClick={() => {
                            setIsGiftPanelOpen(false);
                            onRequirePurchase();
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
                            onViewProfile(userId);
                        }}
                    />
                )}
                {viewingOnlineUsersForStreamId && (
                    <OnlineUsersModal
                        liveId={viewingOnlineUsersForStreamId}
                        onClose={() => setViewingOnlineUsersForStreamId(null)}
                        onUserClick={(userId) => {
                            setViewingOnlineUsersForStreamId(null);
                            setViewingProfileId(userId);
                        }}
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
                        onOpenPrivateChat={() => setIsPrivateChatModalOpen(true)}
                        isPrivateStream={false}
                        onOpenPrivateInviteModal={() => setIsInviteToPrivateLiveModalOpen(true)}
                        onOpenPkStartModal={() => setIsPkStartDisputeModalOpen(true)}
                        isPkBattleActive={isPkBattle}
                        onOpenPkInviteModal={() => setIsPkInviteModalOpen(true)}
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
            {/* Video Player Placeholder */}
            <div className="absolute inset-0 bg-black">
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <p className="text-gray-500">Live Stream Video</p>
                </div>
            </div>
            
             {/* OVERLAYS CONTAINER */}
            <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none">
                {/* Header */}
                <header className="shrink-0 p-4 pointer-events-auto">
                   {liveDetails && (
                     <LiveStreamHeader
                        variant="single"
                        avatarUrl={liveDetails?.streamerAvatarUrl || ''}
                        name={liveDetails?.streamerName || '...'}
                        followers={(liveDetails?.streamerFollowers || 0).toLocaleString()}
                        viewerCount={(liveDetails?.viewerCount || 0).toLocaleString()}
                        headerViewers={headerViewers[streamId]}
                        coins={(liveDetails?.receivedGiftsValue || 0).toLocaleString()}
                        likes={(liveDetails?.likeCount || 0).toLocaleString()}
                        onUserClick={() => { onExit(); onViewProfile(streamer1Id); }}
                        onExitClick={isCurrentUserHost ? () => setIsEndStreamModalOpen(true) : onExit}
                        onViewersClick={() => setViewingOnlineUsersForStreamId(streamId)}
                        onCoinsClick={() => setIsHourlyRankingModalOpen(true)}
                        isCurrentUserHost={isCurrentUserHost}
                        isFollowing={user.following.includes(streamer1Id)}
                        onFollowToggle={() => onFollowToggle(streamer1Id)}
                        streamerIsAvatarProtected={liveDetails?.streamerIsAvatarProtected}
                        countryCode={liveDetails?.countryCode}
                    />
                   )}
                </header>

                {/* Bottom Chat Area */}
                <div className="relative shrink-0 pointer-events-auto bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                    <GiftDisplayAnimation triggeredGift={triggeredGift} />
                    <main className={`flex flex-col justify-end overflow-hidden pointer-events-none pr-4 max-h-[45vh] transition-all duration-300 chat-fade-out-top ${areFloatingAvatarsVisible ? 'pl-48' : 'pl-4'}`}>
                        <ChatArea messages={chatMessages} onUserClick={onNavigateToChat} />
                    </main>
                    <FloatingGiftAvatars triggeredGift={triggeredGift} onVisibilityChange={setAreFloatingAvatarsVisible} />
                    <footer className="shrink-0 flex items-center gap-2 p-4 pt-2">
                        <ChatInput
                            onSendMessage={handleSendMessage}
                            disabled={isBlockedByHost}
                            isUploading={isUploading}
                        />
                        <button onClick={() => setIsGiftPanelOpen(true)} className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                            <GiftBoxIcon className="w-8 h-8"/>
                        </button>
                        
                        {isCurrentUserHost ? (
                            <button onClick={() => setIsArcoraToolModalOpen(true)} className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                                <MoreToolsIcon className="w-8 h-8"/>
                            </button>
                        ) : (
                            <button onClick={() => onNavigateToChat(streamer1Id)} className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center shrink-0">
                                <MessageIcon className="w-7 h-7 text-white"/>
                            </button>
                        )}
                    </footer>
                </div>
            </div>
        </div>
            
        {/* Modals */}
          {isArcoraToolModalOpen && (
            <ArcoraToolModal
                onClose={() => setIsArcoraToolModalOpen(false)}
                onOpenMuteModal={() => setIsMuteUserModalOpen(true)}
                onOpenSoundEffectModal={() => {}}
                onSwitchCamera={() => {}}
                cameraFacingMode={facingMode}
                onToggleVoice={() => {}}
                isVoiceEnabled={isVoiceEnabled}
                onOpenPrivateChat={() => setIsPrivateChatModalOpen(true)}
                isPrivateStream={(initialStreamOrBattle as Stream).isPrivate}
                onOpenPrivateInviteModal={() => setIsInviteToPrivateLiveModalOpen(true)}
                onOpenPkStartModal={() => setIsPkStartDisputeModalOpen(true)}
                isPkBattleActive={isPkBattle}
                onOpenPkInviteModal={() => setIsPkInviteModalOpen(true)}
            />
        )}
        {isGiftPanelOpen && (
            <GiftPanel
                user={user}
                liveId={streamId}
                streamerId={streamer1Id}
                isHost={isCurrentUserHost}
                onClose={() => setIsGiftPanelOpen(false)}
                // FIX: Changed onSendGift to the newly defined handleSendGift function.
                onSendGift={handleSendGift}
                onRechargeClick={() => {
                    setIsGiftPanelOpen(false);
                    onRequirePurchase();
                }}
            />
        )}
          {isEndStreamModalOpen && (
            <EndStreamConfirmationModal
                onConfirm={() => onStopStream(streamer1Id, streamId)}
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
        {isPrivateChatModalOpen && <PrivateChatListModal user={user} onClose={() => setIsPrivateChatModalOpen(false)} onNavigate={onNavigate} />}
        {viewingOnlineUsersForStreamId && (
            <OnlineUsersModal
                liveId={viewingOnlineUsersForStreamId}
                onClose={() => setViewingOnlineUsersForStreamId(null)}
                onUserClick={(userId) => {
                    setViewingOnlineUsersForStreamId(null);
                    setViewingProfileId(userId);
                }}
            />
        )}
        {isHourlyRankingModalOpen && liveDetails && (
            <HourlyRankingModal
                liveId={streamId}
                onClose={() => setIsHourlyRankingModalOpen(false)}
                onUserClick={(userId) => {
                    setIsHourlyRankingModalOpen(false);
                    setViewingProfileId(userId);
                }}
                currentUser={user}
                onUpdateUser={onUpdateUser}
                streamer={{ id: streamer1Id, name: liveDetails.streamerName, avatarUrl: liveDetails.streamerAvatarUrl }}
                onNavigateToList={() => {
                    setIsHourlyRankingModalOpen(false);
                    setIsRankingListScreenOpen(true);
                }}
                onRequirePurchase={onRequirePurchase}
            />
        )}
        {isRankingListScreenOpen && (
            <RankingListScreen
                liveId={streamId}
                currentUser={user}
                onExit={() => setIsRankingListScreenOpen(false)}
                onUserClick={(userId) => {
                    setIsRankingListScreenOpen(false);
                    setViewingProfileId(userId);
                }}
            />
        )}
      </>
    );
};

export default LiveStreamViewerScreen;