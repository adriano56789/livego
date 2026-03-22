
import React, { useState, useCallback, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import MainScreen from './components/MainScreen';
import ProfileScreen from './components/ProfileScreen';
import MessagesScreen from './components/MessagesScreen';
import ChatScreenWithWebSocket from './components/ChatScreenWithWebSocket';
import FooterNav from './components/FooterNav';
import ReminderModal from './components/ReminderModal';
import RegionModal from './components/RegionModal';
import GoLiveScreen, { InviteData } from './components/GoLiveScreen';
import StreamRoom from './components/StreamRoom';
import PKBattleScreen from './components/PKBattleScreen';
import { ToastType, ToastData, Streamer, User, Gift, StreamSummaryData, LiveSessionState, RankedUser, Conversation, Country, NotificationSettings, BeautySettings, FeedPhoto, StreamHistoryEntry, Visitor, PurchaseRecord, Message, EndStreamSummary } from './types';
import Toast from './components/Toast';
import MessageNotification from './components/MessageNotification';
import { socketService } from './services/socket';
import UserProfileScreen from './components/BroadcasterProfileScreen';
import EditProfileScreen from './components/EditProfileScreen';
import FollowingScreen from './components/FollowingScreen';
import FansScreen from './components/FansScreen';
import VisitorsScreen from './components/VisitorsScreen';
import TopFansScreen from './components/TopFansScreen';
import MyLevelScreen from './components/MyLevelScreen';
import BlockListScreen from './components/BlockListScreen';
import AvatarProtectionScreen from './components/AvatarProtectionScreen';
import MarketScreen from './components/MarketScreen';
import FAQScreen from './components/FAQScreen';
import SettingsScreen from './components/settings/SettingsScreen';
import ConfirmPurchaseScreen from './components/ConfirmPurchaseScreen';
import SearchScreen from './components/SearchScreen';
import CameraPermissionModal from './components/CameraPermissionModal';
import LocationPermissionModal from './components/LocationPermissionModal';
import EndStreamConfirmationModal from './components/live/EndStreamConfirmationModal';
import EndStreamSummaryScreen from './components/EndStreamSummaryScreen';
import PrivateChatModal from './components/PrivateChatModal';
import PKBattleTimerSettingsScreen from './components/settings/PKBattleTimerSettingsScreen';
import FriendRequestsScreen from './components/FriendRequestsScreen';
import { LanguageProvider, useTranslation } from './i18n';
import { LoadingSpinner } from './components/Loading';
import PipSettingsModal from './components/settings/PipSettingsModal';
import PrivateInviteModal from './components/PrivateInviteModal';
import VideoScreen from './components/VideoScreen';
import FullScreenPhotoViewer from './components/FullScreenPhotoViewer';
import LiveHistoryScreen from './components/LiveHistoryScreen';
import LanguageSelectionModal from './components/settings/LanguageSelectionModal';
import AdminWalletScreen from './components/AdminWalletScreen';
import VIPCenterScreen from './components/VIPCenterScreen';
import PaymentSuccessScreen from './components/PaymentSuccessScreen';
import LiveNotificationModal from './components/live/LiveNotificationModal';
import { api } from './services/api';

// Dados iniciais vazios - tudo será carregado da API
const INITIAL_DATA = {
  streamers: [],
  countries: [],
  allUsers: [],
  conversations: [],
  friends: [],
  followingUsers: [],
  fans: [],
  allGifts: [],
  reminderStreamers: [],
  rankingData: { 'Diária': [], 'Semanal': [], 'Mensal': [] },
  notificationSettings: null,
  streamHistory: [],
  visitors: [],
  purchaseHistory: [],
  avatarFrames: []
};

// Event emitter simples para navegação
class SimpleEventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  off(event: string, listener: Function) {
    if (this.events.has(event)) {
      const listeners = this.events.get(event)!.filter(l => l !== listener);
      this.events.set(event, listeners);
    }
  }

  emit(event: string, payload: any) {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach(listener => listener(payload));
    }
  }

  connect() { /* No-op */ }
  disconnect() { /* No-op */ }
}

const simpleEventManager = new SimpleEventEmitter();

interface StreamRoomData {
  gifts: Gift[];
  receivedGifts: (Gift & { count: number })[];
}

interface PaymentSuccessData {
  price: number;
  diamonds: number;
  method?: 'pix' | 'credit_card';
  transactionId?: string;
  timestamp?: Date;
}

// Enhanced notification type to support direct stream entry
interface ExtendedLiveNotification {
  streamerId: string;
  streamerName: string;
  streamerAvatar: string;
  message?: string;
  streamId?: string;
  isPrivate?: boolean;
}

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState<boolean>(true);
  const [isEnteringStream, setIsEnteringStream] = useState<boolean>(false);

  const [activeScreen, setActiveScreen] = useState<'main' | 'profile' | 'messages' | 'video'>('main');
  const [messagesInitialTab, setMessagesInitialTab] = useState<'messages' | 'friends'>('messages');
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState<boolean>(false);
  const [isGoLiveOpen, setIsGoLiveOpen] = useState<boolean>(false);
  const [permissionStep, setPermissionStep] = useState<'idle' | 'camera' | 'microphone'>('idle');
  const [isLocationPermissionModalOpen, setIsLocationPermissionModalOpen] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [showLocationBanner, setShowLocationBanner] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [messageNotifications, setMessageNotifications] = useState<Array<{
    id: string;
    senderName: string;
    senderAvatar: string;
    text: string;
    timestamp: string;
  }>>([]);
  const [activeStream, setActiveStream] = useState<Streamer | null>(null);
  const [streamRoomData, setStreamRoomData] = useState<StreamRoomData | null>(null);
  const [isPKBattleActive, setIsPKBattleActive] = useState<boolean>(false);
  const [pkOpponent, setPkOpponent] = useState<User | null>(null);
  const [chattingWith, setChattingWith] = useState<User | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isConfirmingPurchase, setIsConfirmingPurchase] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<{ diamonds: number; price: number; } | null>(null);
  const [isFollowingScreenOpen, setIsFollowingScreenOpen] = useState<boolean>(false);
  const [isFansScreenOpen, setIsFansScreenOpen] = useState<boolean>(false);
  const [isFriendRequestsScreenOpen, setIsFriendRequestsScreenOpen] = useState<boolean>(false);
  const [isVisitorsScreenOpen, setIsVisitorsScreenOpen] = useState<boolean>(false);
  const [isTopFansScreenOpen, setIsTopFansScreenOpen] = useState<boolean>(false);
  const [isMyLevelScreenOpen, setIsMyLevelScreenOpen] = useState<boolean>(false);
  const [isBlockListScreenOpen, setIsBlockListScreenOpen] = useState<boolean>(false);
  const [isAvatarProtectionScreenOpen, setIsAvatarProtectionScreenOpen] = useState<boolean>(false);
  const [isMarketScreenOpen, setIsMarketScreenOpen] = useState<boolean>(false);
  const [isFAQScreenOpen, setIsFAQScreenOpen] = useState<boolean>(false);
  const [isSettingsScreenOpen, setIsSettingsScreenOpen] = useState<boolean>(false);
  const [isSearchScreenOpen, setIsSearchScreenOpen] = useState<boolean>(false);
  const [isEndStreamSummaryOpen, setIsEndStreamSummaryOpen] = useState<boolean>(false);
  const [streamSummaryData, setStreamSummaryData] = useState<StreamSummaryData | null>(null);
  const [isEndStreamConfirmOpen, setIsEndStreamConfirmOpen] = useState<boolean>(false);
  const [isPrivateChatModalOpen, setIsPrivateChatModalOpen] = useState<boolean>(false);
  const [isPKTimerSettingsOpen, setIsPKTimerSettingsOpen] = useState(false);
  const [pkBattleDuration, setPkBattleDuration] = useState(7);
  const [isPipSettingsModalOpen, setIsPipSettingsModalOpen] = useState(false);
  const [liveSession, setLiveSession] = useState<LiveSessionState | null>(null);
  const [isPrivateInviteModalOpen, setIsPrivateInviteModalOpen] = useState<boolean>(false);
  const [photoViewerData, setPhotoViewerData] = useState<{ photos: FeedPhoto[], initialIndex: number } | null>(null);
  const [isLiveHistoryOpen, setIsLiveHistoryOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isAdminWalletOpen, setIsAdminWalletOpen] = useState(false);
  const [isVIPCenterOpen, setIsVIPCenterOpen] = useState(false);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentSuccessData | null>(null);
  const [liveNotification, setLiveNotification] = useState<ExtendedLiveNotification | null>(null);
  const [privateInviteData, setPrivateInviteData] = useState<InviteData | null>(null);

  const [streamers, setStreamers] = useState<Streamer[]>(INITIAL_DATA.streamers);
  const [isLoadingStreamers, setIsLoadingStreamers] = useState(false);
  const [countries, setCountries] = useState<Country[]>(INITIAL_DATA.countries);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_DATA.allUsers);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_DATA.conversations);
  const [friends, setFriends] = useState<User[]>(INITIAL_DATA.friends);
  const [followingUsers, setFollowingUsers] = useState<User[]>(INITIAL_DATA.followingUsers);
  const [fans, setFans] = useState<User[]>(INITIAL_DATA.fans);
  const [allGifts, setAllGifts] = useState<Gift[]>([]);
  const [reminderStreamers, setReminderStreamers] = useState<Streamer[]>(INITIAL_DATA.reminderStreamers);
  const [selectedCountry, setSelectedCountry] = useState<string>('ICON_GLOBE');
  const [activeCategory, setActiveCategory] = useState('popular');

  // Restaurar sessão automaticamente ao recarregar a página
  // **SESSÃO PERSISTENTE**: Usuário continua logado ao atualizar a página
  // Só desloga se não houver token ou se token for inválido
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingCurrentUser(false);
        return;
      }
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch {
        // Token inválido ou expirado — limpar sessão
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setIsLoadingCurrentUser(false);
      }
    };
    restoreSession();
  }, []);

  // Carregar dados da API na inicialização
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingStreamers(true);
      try {
        // Carregar streams da categoria padrão (popular)
        const streams = await api.getLiveStreamers('popular');
        setStreamers(streams);

        // Carregar países
        const countries = await api.getRegions();
        setCountries(countries);
      } catch (error) {
        setStreamers([]);
      } finally {
        setIsLoadingStreamers(false);
      }
    };

    loadInitialData();
  }, []);

  // Carregar gifts da API
  useEffect(() => {
    const loadGifts = async () => {
      try {
        const gifts = await api.getGifts();
        setAllGifts(gifts);
      } catch (error) {
      }
    };

    loadGifts();
  }, []);

  // Carregar dados do usuário logado (conversas, amigos, fãs, seguindo)
  useEffect(() => {
    if (!currentUser?.id) return;

    const loadUserData = async () => {
      try {
        const [convs, friendList, fanList, followingList] = await Promise.allSettled([
          api.getConversations(currentUser.id),
          api.getFriends(currentUser.id),
          api.getFansUsers(currentUser.id),
          api.getFollowingUsers(currentUser.id),
        ]);

        if (convs.status === 'fulfilled' && Array.isArray(convs.value)) {
          setConversations(convs.value);
        }
        if (friendList.status === 'fulfilled' && Array.isArray(friendList.value)) {
          setFriends(friendList.value);
        }
        if (fanList.status === 'fulfilled' && Array.isArray(fanList.value)) {
          setFans(fanList.value);
        }
        if (followingList.status === 'fulfilled' && Array.isArray(followingList.value)) {
          setFollowingUsers(followingList.value);
        }
      } catch (error) {
      }
    };

    loadUserData();
  }, [currentUser?.id]);

  // Listener para notificações de novas mensagens
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const message = event.detail;
      
      // Não mostrar notificação se estiver no chat com o remetente
      if (chattingWith && chattingWith.id === message.from) {
        return;
      }
      
      // Adicionar notificação
      const notification = {
        id: `msg_${Date.now()}_${Math.random()}`,
        senderName: message.senderName || 'Usuário',
        senderAvatar: message.senderAvatar || '',
        text: message.text || 'Enviou uma mensagem',
        timestamp: message.timestamp || new Date().toISOString()
      };
      
      setMessageNotifications(prev => [...prev, notification]);
    };

    window.addEventListener('newChatMessage', handleNewMessage as EventListener);
    
    return () => {
      window.removeEventListener('newChatMessage', handleNewMessage as EventListener);
    };
  }, [chattingWith?.id]);
  const [rankingData, setRankingData] = useState<Record<string, RankedUser[]>>(INITIAL_DATA.rankingData);
  const [listScreenUsers, setListScreenUsers] = useState<User[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(INITIAL_DATA.notificationSettings);
  const [lastPhotoLikeUpdate, setLastPhotoLikeUpdate] = useState<number>(0);
  const [streamHistory, setStreamHistory] = useState<StreamHistoryEntry[]>(INITIAL_DATA.streamHistory);
  const [visitors, setVisitors] = useState<Visitor[]>(INITIAL_DATA.visitors);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>(INITIAL_DATA.purchaseHistory);

  const { t, language, setLanguage } = useTranslation();

  // Calculate total unread messages for footer badge
  const totalUnreadMessages = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const updateUserEverywhere = useCallback((updatedUser: User) => {
    const updater = (users: User[]) => users.map(u => u.id === updatedUser.id ? updatedUser : u);

    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    if (viewingProfile?.id === updatedUser.id) {
      setViewingProfile(updatedUser);
    }
    if (pkOpponent?.id === updatedUser.id) {
      setPkOpponent(updatedUser);
    }

    setAllUsers(updater);
    setFollowingUsers(updater);
    setFans(updater);
    setFriends(updater);
    setListScreenUsers(updater);

    setConversations(prev => prev.map(c => c.friend.id === updatedUser.id ? { ...c, friend: updatedUser } : c));

    const streamUpdater = (s: Streamer) => s.hostId === updatedUser.id ? { ...s, name: updatedUser.name, avatar: updatedUser.avatarUrl } : s;
    setStreamers(prev => prev.map(streamUpdater));
    setReminderStreamers(prev => prev.map(streamUpdater));

    if (activeStream?.hostId === updatedUser.id) {
      setActiveStream(prev => prev ? streamUpdater(prev) : null);
    }
  }, [currentUser, viewingProfile, pkOpponent, activeStream]);

  // ... (keeping existing handlers like handleLeaveStreamView, handleLogout, etc.) ...

  const handleLeaveStreamView = useCallback(() => {
    setActiveStream(null);
    setIsPKBattleActive(false);
    setPkOpponent(null);
    setLiveSession(null);
    setStreamRoomData(null);
  }, [activeStream]);

  const handleLogout = async () => {
    simpleEventManager.disconnect();
    // Limpar todos os dados da sessão
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveScreen('main');
    setIsSettingsScreenOpen(false);
  };

  const handleDeleteAccount = async () => {
    addToast(ToastType.Success, "Conta excluída com sucesso.");
    await handleLogout();
  };

  // Removido - dados estáticos já inicializados

  // WebSocket events simplificados
  useEffect(() => {
    const handleKicked = (payload: { roomId: string }) => {
      if (activeStream?.id === payload.roomId) {
        handleLeaveStreamView();
        addToast(ToastType.Error, "Você foi expulso desta sala e não pode mais entrar.");
      }
    };
    const handleJoinDenied = (payload: { roomId: string }) => {
      addToast(ToastType.Error, "Você foi expulso desta sala e não pode mais entrar.");
    };
    simpleEventManager.on('kicked', handleKicked);
    simpleEventManager.on('joinDenied', handleJoinDenied);
    return () => {
      simpleEventManager.off('kicked', handleKicked);
      simpleEventManager.off('joinDenied', handleJoinDenied);
    };
  }, [activeStream, addToast, handleLeaveStreamView]);

  // Removido - dados estáticos já inicializados

  // Removido - WebSocket simplificado

  useEffect(() => {
    const handleStreamerLive = (payload: { streamerId: string, streamerName: string, streamerAvatar: string }) => {
      if (notificationSettings?.streamerLive) {
        setLiveNotification(payload);
      }
      // Removido - não atualizar isLive automaticamente
      // Cards só devem ser criados quando o usuário realmente iniciar uma transmissão
    };

    const handlePrivateInvite = (payload: { streamId: string, hostId: string, streamName: string, inviterName: string, inviterAvatar: string }) => {
      setPrivateInviteData({
        streamId: payload.streamId,
        hostId: payload.hostId,
        streamName: payload.streamName,
        hostName: payload.inviterName,
        hostAvatar: payload.inviterAvatar
      });
      setIsGoLiveOpen(true);
    };

    simpleEventManager.on('streamerLive', handleStreamerLive);
    simpleEventManager.on('privateStreamInvite', handlePrivateInvite);

    return () => {
      simpleEventManager.off('streamerLive', handleStreamerLive);
      simpleEventManager.off('privateStreamInvite', handlePrivateInvite);
    };
  }, [addToast, notificationSettings, allUsers, updateUserEverywhere]);

  // Removido - dados estáticos já inicializados

  // Removido - dados estáticos já inicializados

  // Removido - dados estáticos já inicializados

  // Conectar ao WebSocket para atualizações de presença
  useEffect(() => {
    if (currentUser) {
      socketService.connect();
      
      // Entrar na sala específica do usuário para receber eventos personalizados
      if (currentUser?.id) {
        socketService.joinRoom(currentUser.id);
      }

      // Escutar atualizações de presença
      socketService.on('user_status_updated', (data: { userId: string; isOnline: boolean }) => {
        if (data.userId === currentUser.id) {
          const updatedUser = { ...currentUser, isOnline: data.isOnline };
          updateUserEverywhere(updatedUser);
        }
      });

      // Avatar atualizado - sincronizar em tempo real em todo o app
      socketService.on('avatar_updated', (data: { userId: string; avatarUrl: string }) => {
        if (data.userId === currentUser.id) {
          const updatedUser = { ...currentUser, avatarUrl: data.avatarUrl };
          updateUserEverywhere(updatedUser);
        }
      });

      // Escutar atualizações de diamantes em tempo real (remetente de presente)
      socketService.on('diamonds_updated', (data: { userId: string; diamonds: number; enviados?: number; change: number; timestamp: string; source?: string }) => {
        
        if (data.userId === currentUser.id) {
          // 🔧 SINCRONIZAÇÃO: Atualiza diamonds E enviados do remetente com dados reais da API
          const updatedUser: any = { ...currentUser, diamonds: data.diamonds };
          if (data.enviados !== undefined) {
            updatedUser.enviados = data.enviados;
          }
          updateUserEverywhere(updatedUser);
          
          // Atualizar contador da live se estiver em transmissão como host
          if (liveSession && activeStream && activeStream.hostId === data.userId) {
            updateLiveSession({ coins: data.diamonds });
          }
        }
      });

      // Escutar atualizações de earnings em tempo real (receptor de presente)
      socketService.on('earnings_updated', (data: { userId: string; diamonds: number; totalEarnings: number; totalReceptores?: number; timestamp: string; source: string }) => {
        
        if (data.userId === currentUser.id) {
          // 🔧 SINCRONIZAÇÃO: Atualiza earnings e receptores com dados reais do banco de dados
          const updatedUser: any = { 
            ...currentUser, 
            earnings: data.totalEarnings
          };
          // totalReceptores vem do banco de dados real (campo receptores do usuário)
          if (data.totalReceptores !== undefined) {
            updatedUser.receptores = data.totalReceptores;
          }
          
          updateUserEverywhere(updatedUser);
        }
      });

      // 🔧 SINCRONIZAÇÃO: Escutar atualizações de saque em tempo real
      // Quando um saque é realizado, diamonds, receptores e streamDiamonds devem ser zerados
      socketService.on('earnings_withdrawn', (data: { userId: string; amount: number; newEarnings: number; diamonds?: number; receptores?: number; streamDiamonds?: number; timestamp: string }) => {
        
        if (data.userId === currentUser.id) {
          // Atualizar usuário com dados completos do saque
          const updatedUser = { 
            ...currentUser, 
            earnings: data.newEarnings,
            diamonds: data.diamonds || 0, // Zerar carteira
            receptores: data.receptores || 0 // Zerar receptores
          };
          updateUserEverywhere(updatedUser);
          
          // Atualizar contador da live se estiver em transmissão como host
          if (liveSession && activeStream && activeStream.hostId === data.userId) {
            updateLiveSession({ coins: data.streamDiamonds || 0 });
          }
        }
      });

      // 🔧 SINCRONIZAÇÃO: Escutar atualizações da carteira ADM em tempo real
      // Quando um saque é feito, a taxa de 20% vai para a carteira ADM
      socketService.on('platform_earnings_updated', (data: { userId: string; added_fee: number; total_platform_earnings: number; from_user?: string; timestamp: string }) => {
        if (data.userId === currentUser.id) {
          // Atualizar platformEarnings do usuário ADM com dados reais do banco
          const updatedUser = { ...currentUser, platformEarnings: data.total_platform_earnings };
          updateUserEverywhere(updatedUser);
        }
      });

      // 🔧 SINCRONIZAÇÃO: Escutar atualizações de moedas da live em tempo real
      // O contador de moedas deve refletir o banco de dados real (Streamer.diamonds)
      socketService.on('live_coins_updated', (data: { streamId: string; coins: number; totalCoins: number; timestamp: string; fromUser?: string; giftName?: string }) => {
        if (activeStream && activeStream.id === data.streamId && liveSession) {
          // Usar totalCoins (valor real do banco) para garantir sincronização
          updateLiveSession({ coins: data.totalCoins });
        }
      });

      // 🚀 Escutar quando lives são encerradas para remover cards em tempo real
      socketService.onStreamEnded((data: { streamId: string; hostId: string; timestamp: string }) => {

        // Remover o card da lista de streamers
        setStreamers(prev => prev.filter(streamer => streamer.id !== data.streamId));

        // Se o usuário está assistindo esta live, redirecionar para tela principal
        if (activeStream && activeStream.id === data.streamId) {
          setActiveStream(null);
          setLiveSession(null);
          setStreamRoomData(null);
          setIsPKBattleActive(false);
          setPkOpponent(null);

          addToast(ToastType.Info, 'Esta transmissão foi encerrada');
        }
      });

      // Escutar se o usuário atual precisa sair de uma live encerrada
      socketService.onLiveStreamEnded((data: { streamId: string; message: string; timestamp: string }) => {

        // Se o usuário está assistindo esta live, redirecionar
        if (activeStream && activeStream.id === data.streamId) {
          setActiveStream(null);
          setLiveSession(null);
          setStreamRoomData(null);
          setIsPKBattleActive(false);
          setPkOpponent(null);

          addToast(ToastType.Info, data.message);
        }
      });

      // Escutar quando cards são removidos
      socketService.onCardRemoved((data: { streamId: string; hostId: string; timestamp: string }) => {

        // Remover o card da lista de streamers
        setStreamers(prev => prev.filter(streamer => streamer.id !== data.streamId));

        // Se o usuário está assistindo esta live, redirecionar para tela principal
        if (activeStream && activeStream.id === data.streamId) {
          setActiveStream(null);
          setLiveSession(null);
          setStreamRoomData(null);
          setIsPKBattleActive(false);
          setPkOpponent(null);

          addToast(ToastType.Info, 'Esta transmissão foi encerrada');
        }
      });
    }

    return () => {
      socketService.off('user_status_updated');
      socketService.off('avatar_updated');
      socketService.off('diamonds_updated');
      socketService.off('earnings_updated');
      socketService.off('platform_earnings_updated');
      socketService.off('live_coins_updated');
      socketService.off('stream_ended');
      socketService.off('live_stream_ended');
      socketService.off('stream_ended');
      socketService.off('card_removed');
    };
  }, [currentUser, activeStream]);

  const refreshStreamRoomData = useCallback(async (streamerId: string) => {
    try {
      // 🔧 SINCRONIZAÇÃO: Buscar dados reais da live (diamonds acumulados no banco)
      const liveDetails = await api.getLiveDetails(streamerId);
      if (liveDetails) {
        const realDiamonds = (liveDetails as any).diamonds || 0;
        // Atualizar via setLiveSession para evitar dependência circular
        setLiveSession(prev => prev ? { ...prev, coins: realDiamonds } : prev);
      }

      // Atualizar ranking ao vivo com dados reais da API
      const liveRanking = await api.getRankingForPeriod('live', currentUser?.id);
      setRankingData(liveRanking);

    } catch (error) {
      // Falha silenciosa - não interrompe a experiência do usuário
    }
  }, []);

  const handleStreamUpdate = (updates: Partial<Streamer>) => {
    // Validate that updates.id is not [object Object]
    if (updates.id && (typeof updates.id !== 'string' || updates.id === '[object Object]')) {
      console.error('❌ [STREAM UPDATE] Invalid stream ID in updates:', updates.id, updates);
      return; // Don't apply invalid updates
    }
    
    setActiveStream(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  };

  const updateLiveSession = useCallback((updates: Partial<LiveSessionState>) => {
    setLiveSession(prev => {
      if (!prev) return null;
      const newSession = { ...prev, ...updates };
      if (updates.viewers !== undefined) {
        newSession.peakViewers = Math.max(prev.peakViewers, updates.viewers);
      }
      return newSession;
    });
  }, []);

  // WebSocket handlers simplificados
  useEffect(() => {
    const handleFollowUpdate = (payload: { follower: User, followed: User, isUnfollow: boolean }) => {
      const { follower, followed, isUnfollow } = payload;

      updateUserEverywhere(follower);
      updateUserEverywhere(followed);

      if (currentUser && followed.id === currentUser.id) {
        setFans(prevFans => {
          if (isUnfollow) {
            return prevFans.filter(fan => fan.id !== follower.id);
          } else {
            if (prevFans.some(fan => fan.id === follower.id)) {
              return prevFans.map(fan => fan.id === follower.id ? follower : fan);
            }
            return [...prevFans, follower];
          }
        });
      }

      if (currentUser && follower.id === currentUser.id) {
        setFollowingUsers(prevFollowing => {
          if (isUnfollow) {
            return prevFollowing.filter(user => user.id !== followed.id);
          } else {
            if (prevFollowing.some(user => user.id === followed.id)) {
              return prevFollowing.map(user => user.id === followed.id ? followed : user);
            }
            return [...prevFollowing, followed];
          }
        });
      }
    };

    const handleNewFollower = (payload: { follower: User }) => {
      if (currentUser) {
        const { follower } = payload;
        setFans(prevFans => {
          if (prevFans.some(fan => fan.id === follower.id)) {
            return prevFans.map(fan => fan.id === follower.id ? follower : fan);
          }
          return [...prevFans, follower];
        });
        updateUserEverywhere(follower);
      }
    };

    const handleMicStateUpdate = (payload: { roomId: string; isMuted: boolean }) => {
      if (activeStream?.id === payload.roomId) {
        updateLiveSession({ isMicrophoneMuted: payload.isMuted });
      }
    };

    const handleSoundStateUpdate = (payload: { roomId: string; isMuted: boolean }) => {
      if (activeStream?.id === payload.roomId) {
        updateLiveSession({ isStreamMuted: payload.isMuted });
      }
    };

    const handleUserUpdate = (payload: { user: User }) => {
      updateUserEverywhere(payload.user);
    };

    const handleTransactionUpdate = (payload: { record: PurchaseRecord }) => {
      const { record } = payload;
      setPurchaseHistory(prev => {
        const index = prev.findIndex(r => r.id === record.id);
        if (index > -1) {
          const newHistory = [...prev];
          newHistory[index] = record;
          return newHistory;
        }
        return [record, ...prev]; // Latest first
      });

      if (record.userId === currentUser?.id) {
        if (record.status === 'Concluído' && record.type === 'withdraw_earnings') {
          addToast(ToastType.Success, `Saque de R$ ${record.amountBRL.toFixed(2)} concluído!`);
        } else if (record.status === 'Cancelado') {
          addToast(ToastType.Error, `Saque de R$ ${record.amountBRL.toFixed(2)} falhou.`);
        }
      }
    };

    // Global New Message Handler for Badges
    const handleNewMessage = (message: Message) => {
      if (!currentUser) return;

      // If we are currently chatting with this user, we assume it's read immediately by ChatScreen component
      if (chattingWith && chattingWith.id === message.from) {
        return;
      }

      // Otherwise, update the conversation list to increment badge
      setConversations(prevConversations => {
        const index = prevConversations.findIndex(c => c.friend.id === message.from);

        if (index > -1) {
          const updated = [...prevConversations];
          const oldConv = updated[index];
          updated[index] = {
            ...oldConv,
            lastMessage: message.text || (message.imageUrl ? 'Imagem' : ''),
            timestamp: message.timestamp,
            unreadCount: (oldConv.unreadCount || 0) + 1
          };
          // Move to top
          updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return updated;
        } else {
          // Para dados estáticos, apenas retorna o estado anterior
          return prevConversations;
        }
      });
    };

    simpleEventManager.on('followUpdate', handleFollowUpdate);
    simpleEventManager.on('newFollower', handleNewFollower);
    simpleEventManager.on('micStateUpdate', handleMicStateUpdate);
    simpleEventManager.on('soundStateUpdate', handleSoundStateUpdate);
    simpleEventManager.on('userUpdate', handleUserUpdate);
    simpleEventManager.on('transactionUpdate', handleTransactionUpdate);
    simpleEventManager.on('newMessage', handleNewMessage);

    return () => {
      simpleEventManager.off('followUpdate', handleFollowUpdate);
      simpleEventManager.off('newFollower', handleNewFollower);
      simpleEventManager.off('micStateUpdate', handleMicStateUpdate);
      simpleEventManager.off('soundStateUpdate', handleSoundStateUpdate);
      simpleEventManager.off('userUpdate', handleUserUpdate);
      simpleEventManager.off('transactionUpdate', handleTransactionUpdate);
      simpleEventManager.off('newMessage', handleNewMessage);
    };
  }, [currentUser, updateUserEverywhere, activeStream, updateLiveSession, addToast, chattingWith]);

  const startLiveSession = async (streamer: Streamer) => {
    try {
      // 🔧 SINCRONIZAÇÃO: Buscar dados reais da stream da API (diamonds acumulados)
      // O contador de moedas deve refletir o banco de dados, nunca estado temporário
      let streamDiamonds = streamer.diamonds || 0;
      let streamViewers = streamer.viewers || 1;
      try {
        const streamDetails = await api.getLiveDetails(streamer.id);
        if (streamDetails) {
          streamDiamonds = (streamDetails as any).diamonds || 0;
          streamViewers = (streamDetails as any).viewers || 1;
        }
      } catch {
        // Fallback: usar dados do objeto streamer passado
      }
      
      const newSession = {
        startTime: Date.now(),
        viewers: streamViewers,
        peakViewers: streamViewers,
        coins: streamDiamonds, // 🔧 FONTE UNIFICADA: dados reais da API
        followers: 0,
        members: 0,
        fans: 0,
        events: [],
        isMicrophoneMuted: false,
        isStreamMuted: false,
        isAutoFollowEnabled: false,
        isAutoPrivateInviteEnabled: false,
      };
      setLiveSession(newSession);
    } catch (error) {
      // Fallback: usar dados originais do streamer
      const newSession = {
        startTime: Date.now(),
        viewers: streamer.viewers || 1,
        peakViewers: streamer.viewers || 1,
        coins: streamer.diamonds || 0, // Fallback para dados originais
        followers: 0,
        members: 0,
        fans: 0,
        events: [],
        isMicrophoneMuted: false,
        isStreamMuted: false,
        isAutoFollowEnabled: false,
        isAutoPrivateInviteEnabled: false,
      };
      setLiveSession(newSession);
    }
  };

  // ... (Keeping rest of the logic: handleSelectRegion, logLiveEvent, handleLogin, etc.) ...

  const handleSelectRegion = async (countryCode: string) => {
    setSelectedCountry(countryCode);
    setIsRegionModalOpen(false);

    // Se não for Global, buscar streams da região
    if (countryCode !== 'ICON_GLOBE') {
      setIsLoadingStreamers(true);
      try {
        const streams = await api.getLiveStreamers('popular', countryCode);
        setStreamers(streams);
      } catch (error) {
        setStreamers([]);
      } finally {
        setIsLoadingStreamers(false);
      }
    } else {
      // Se for Global, carregar todos os streams
      setIsLoadingStreamers(true);
      try {
        const streams = await api.getLiveStreamers('popular');
        setStreamers(streams);
      } catch (error) {
        setStreamers([]);
      } finally {
        setIsLoadingStreamers(false);
      }
    }
  };

  const loadStreams = async () => {
    setIsLoadingStreamers(true);
    try {
      const streams = await api.getLiveStreamers('popular');
      setStreamers(streams);
    } catch (error) {
      setStreamers([]);
    } finally {
      setIsLoadingStreamers(false);
    }
  };

const logLiveEvent = (type: string, data: any) => {
  if (!liveSession || !activeStream) return;
  const event = { type, timestamp: new Date().toISOString(), ...data };
  updateLiveSession({ events: [...(liveSession.events || []), event] });
};

  const handleLogin = async () => {
    setIsLoadingCurrentUser(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Sempre buscar dados atualizados do banco de dados
        const user = await api.getCurrentUser();
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(true);
    } finally {
      setIsLoadingCurrentUser(false);
    }
  };

  const handleNavigation = (screen: 'main' | 'profile' | 'messages' | 'video') => {
    if (screen === 'messages') {
      setMessagesInitialTab('messages'); // Reset to default when using footer nav
    }
    setActiveScreen(screen);
  };

  const handleNavigateToFriends = () => {
    setChattingWith(null);
    setActiveStream(null);
    setMessagesInitialTab('friends');
    setActiveScreen('messages');
  };

  const handleTabChange = async (tab: string) => {
    if (tab === 'nearby') {
      // Verificar status atual da permissão
      if (locationPermissionStatus === 'granted') {
        // Se já foi concedido, ir diretamente para nearby
        setActiveCategory('nearby');
        setShowLocationBanner(false);
      } else if (locationPermissionStatus === 'denied') {
        // Se foi negado, ir para nearby mas mostrar banner
        setActiveCategory('nearby');
        setShowLocationBanner(true);
      } else {
        // Se está prompt, mostrar modal de permissão
        setLocationPermissionStatus('prompt');
        setIsLocationPermissionModalOpen(true);
      }
    } else {
      setActiveCategory(tab);
      setShowLocationBanner(false);

      // Carregar streams da API para a categoria selecionada
      setIsLoadingStreamers(true);
      try {
        const streams = await api.getLiveStreamers(tab);
        setStreamers(streams);
      } catch (error) {
        setStreamers([]);
      } finally {
        setIsLoadingStreamers(false);
      }
    }
  };

  const handleAllowLocation = async () => {
    setLocationPermissionStatus('granted');
    setActiveCategory('nearby');
    setShowLocationBanner(false);
    addToast(ToastType.Success, "Permissão de localização concedida.");
    setIsLocationPermissionModalOpen(false);
  };

  const handleDenyLocation = async () => {
    setLocationPermissionStatus('denied');
    setActiveCategory('nearby');
    setShowLocationBanner(true);
    addToast(ToastType.Info, "Permissão de localização negada.");
    setIsLocationPermissionModalOpen(false);
  };

  const checkMicrophonePermission = async () => {
    setPermissionStep('microphone');
    setIsGoLiveOpen(true);
  };

  const checkCameraPermission = async () => {
    setPermissionStep('camera');
    await checkMicrophonePermission();
  };

  const handleOpenGoLive = async () => {
    await checkCameraPermission();
  };

  const handlePermissionAllow = async () => {
    if (permissionStep === 'camera') {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        await checkMicrophonePermission();
      } catch (err) {
        addToast(ToastType.Error, t('toasts.permissionsNeeded'));
        setPermissionStep('idle');
      }
    } else if (permissionStep === 'microphone') {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsGoLiveOpen(true);
        setPermissionStep('idle');
      } catch (err) {
        addToast(ToastType.Error, t('toasts.permissionsNeeded'));
        setPermissionStep('idle');
      }
    }
  };

  const handlePermissionDeny = async () => {
    addToast(ToastType.Error, t('toasts.permissionsNeeded'));
    setPermissionStep('idle');
  };

  const handleSelectStream = async (streamer: Streamer) => {
    if (!currentUser) return;
    
    // Validate that streamer.id is a string
    if (typeof streamer.id !== 'string' || streamer.id === '[object Object]') {
      console.error('❌ [SELECT STREAM] Invalid stream ID:', streamer.id, streamer);
      addToast(ToastType.Error, "ID da stream inválido. Não foi possível entrar na live.");
      return;
    }
    
    setIsEnteringStream(true);
    try {
      if (streamer.isPrivate && streamer.hostId !== currentUser.id) {
        addToast(ToastType.Error, "Você não tem permissão para entrar nesta sala privada.");
        setIsEnteringStream(false);
        return;
      }

      setStreamRoomData({
        gifts: allGifts,
        receivedGifts: []
      });
      setActiveStream(streamer);
      startLiveSession(streamer);
      simpleEventManager.connect();
    } catch (error) {
      addToast(ToastType.Error, "Falha ao carregar dados da live.");
    } finally {
      setIsEnteringStream(false);
    }
  };

  const handleStartStream = async (streamer: Streamer) => {
    setIsGoLiveOpen(false);
    setPrivateInviteData(null);
    handleSelectStream(streamer);

    const updateStreamList = (prev: Streamer[]) => {
      const existingIndex = prev.findIndex(s => s.hostId === streamer.hostId);
      if (existingIndex > -1) {
        const newList = [...prev];
        newList[existingIndex] = streamer;
        return newList;
      }
      return [streamer, ...prev];
    };

    setReminderStreamers(updateStreamList);
    setStreamers(updateStreamList);

    if (currentUser && streamer.hostId === currentUser.id) {
      const updatedUser = { ...currentUser, isLive: true, isOnline: true };
      updateUserEverywhere(updatedUser);
      addToast(ToastType.Success, "Live iniciada com sucesso!");

      setLiveNotification({
        streamerId: currentUser.id,
        streamerName: currentUser.name,
        streamerAvatar: currentUser.avatarUrl
      });
    }
  };

  const handleRequestEndStream = () => setIsEndStreamConfirmOpen(true);

  const handleConfirmEndStream = async () => {
    setIsEndStreamConfirmOpen(false);

    if (activeStream && liveSession) {
      // Validate that activeStream.id is a string
      if (typeof activeStream.id !== 'string' || activeStream.id === '[object Object]') {
        console.error('❌ [END STREAM] Invalid stream ID:', activeStream.id, activeStream);
        addToast(ToastType.Error, "ID da stream inválido. Não foi possível encerrar a transmissão.");
        setActiveStream(null);
        setIsPKBattleActive(false);
        setPkOpponent(null);
        setLiveSession(null);
        return;
      }
      
      const endTime = Date.now();
      const historyEntry: StreamHistoryEntry = {
        id: `hist_stream-${activeStream.id}_${endTime}_${Math.random().toString(36).slice(2)}`,
        streamerId: activeStream.hostId,
        name: activeStream.name,
        avatar: activeStream.avatar,
        startTime: liveSession.startTime,
        endTime: endTime,
      };
      setStreamHistory(prev => [historyEntry, ...prev]);

      // Prepare summary data
      const summary: EndStreamSummary = {
        streamId: activeStream.id,
        title: activeStream.name,
        startTime: liveSession.startTime,
        endTime: endTime,
        duration: Math.floor((endTime - liveSession.startTime) / 1000), // Converter para segundos
        viewers: liveSession.viewers || 0,
        followers: liveSession.followers,
        members: liveSession.members,
        fans: liveSession.fans,
        user: { name: activeStream.name, avatarUrl: activeStream.avatar }
      };
      setStreamSummaryData(summary);
      setIsEndStreamSummaryOpen(true);

      try {
        if (!liveSession) {
          throw new Error('Sessão da live não encontrada');
        }
        const response = await api.endLiveSession(activeStream.id, liveSession);

        // 2. Remover o card especificamente
        const removeResponse = await api.removeLiveCard(activeStream.id, currentUser?.id || '');
        
        // Verificar se o card foi removido com sucesso
        if (!removeResponse.success) {
          console.warn('Card da live não foi removido:', removeResponse);
        }

        // 3. Recarregar a lista de streams para atualizar os cards
        await loadStreams();
      } catch (error) {
        addToast(ToastType.Error, 'Erro ao encerrar transmissão');
      }
    }

    setActiveStream(null);
    setIsPKBattleActive(false);
    setPkOpponent(null);
    setLiveSession(null);
    setStreamRoomData(null);
  };

  const handleStartPKBattle = async (opponent: User) => {
    if (!activeStream) return;
    setPkOpponent(opponent);
    setIsPKBattleActive(true);
    addToast(ToastType.Success, "Batalha PK iniciada!");
  };

  const handleEndPKBattle = () => {
    if (!activeStream) return;
    addToast(ToastType.Info, "Batalha PK encerrada.");
    setIsPKBattleActive(false);
    setPkOpponent(null);
  };

  const handleStartChatWithStreamer = (user: User) => {
    setChattingWith(user);
    // Não navega para a tela de mensagens, apenas abre o chat diretamente
  };

  const handleViewProfile = async (user: User) => {
    setChattingWith(null);
    const fullUserFromState = allUsers.find(u => u.id === user.id);
    const userToView = user.id === currentUser?.id ? currentUser : (fullUserFromState || user);
    setViewingProfile(userToView);
  };

  const handleEditProfile = () => { setIsEditingProfile(true); setViewingProfile(null); }

  const handleSaveProfile = async (updatedData: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updatedData };
    updateUserEverywhere(updatedUser);
    setIsEditingProfile(false);
    setViewingProfile(updatedUser);
    addToast(ToastType.Success, t('toasts.profileSaved'));
    // Refetch do servidor para garantir sincronização e dados persistentes
    try {
      const freshUser = await api.getFreshUserData(currentUser.id);
      if (freshUser) updateUserEverywhere(freshUser);
    } catch (_) { /* ignora erro de refetch */ }
  };

  const handleFollowUser = async (userToFollow: User, streamId?: string) => {
    if (!currentUser) return;

    try {
      const response = await api.followUser(currentUser.id, userToFollow.id, streamId);

      if (response.success) {
        const isNowFollowing = !userToFollow.isFollowed;
        const updatedFollowed = { ...userToFollow, isFollowed: isNowFollowing };
        const updatedFollower = { ...currentUser, following: (currentUser.following || 0) + (isNowFollowing ? 1 : -1) };

        updateUserEverywhere(updatedFollower);
        updateUserEverywhere(updatedFollowed);

        setFollowingUsers(prev => {
          if (isNowFollowing) {
            if (prev.some(u => u.id === updatedFollowed.id)) {
              return prev.map(u => u.id === updatedFollowed.id ? updatedFollowed : u);
            }
            return [...prev, updatedFollowed];
          } else {
            return prev.filter(u => u.id !== updatedFollowed.id);
          }
        });

        if (liveSession && activeStream && userToFollow.id === activeStream.hostId) {
          const increment = isNowFollowing ? 1 : -1;
          updateLiveSession({ followers: Math.max(0, (liveSession.followers || 0) + increment) });
        }

        // Se virou amizade, mostrar notificação especial
        if (response.isFriendship && isNowFollowing) {
          addToast(ToastType.Success, `🎉 Você e ${userToFollow.name} agora são amigos!`);
        } else if (!streamId) {
          const toastMessage = isNowFollowing
            ? t('toasts.followedUser', { name: userToFollow.name })
            : `Você deixou de seguir ${userToFollow.name}.`;
          addToast(ToastType.Success, toastMessage);
        }
      }
    } catch (error) {
      addToast(ToastType.Error, 'Não foi possível realizar esta ação');
    }
  };

  const handleBlockUser = async (userToBlock: User) => {
    if (!currentUser) return;
    addToast(ToastType.Success, `${userToBlock.name} foi bloqueado.`);
    if (viewingProfile?.id === userToBlock.id) {
      setViewingProfile(null);
    }
    if (chattingWith?.id === userToBlock.id) {
      setChattingWith(null);
    }
  };

  const handleReportUser = async (userToReport: User) => {
    if (!currentUser) return;
    addToast(ToastType.Success, `Denúncia sobre ${userToReport.name} enviada.`);
  };

  const handleUnblockUser = async (userToUnblock: User) => {
    if (!currentUser) return;
    addToast(ToastType.Success, `${userToUnblock.name} foi desbloqueado.`);
  };

  const handlePurchase = (pkg: { diamonds: number; price: number }) => {
    setSelectedPackage(pkg);
    setIsConfirmingPurchase(true);
  };

  const handleConfirmPurchase = async (pkg: { diamonds: number; price: number }) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, diamonds: currentUser.diamonds + pkg.diamonds };
    updateUserEverywhere(updatedUser);

    setPaymentSuccessData({
      price: pkg.price,
      diamonds: pkg.diamonds,
      method: 'pix',
      timestamp: new Date()
    });
    setIsConfirmingPurchase(false);
    setIsPaymentSuccessOpen(true);
    setSelectedPackage(null);
  };

  const handlePurchaseFrame = async (frameId: string) => {
    if (!currentUser) return;

    if (currentUser.diamonds < 100) {
      addToast(ToastType.Error, "Diamantes insuficientes.");
      return;
    }

    const updatedUser = { ...currentUser, diamonds: currentUser.diamonds - 100 };
    updateUserEverywhere(updatedUser);
    addToast(ToastType.Success, "Moldura comprada com sucesso!");
  };

  const handleOpenPKTimerSettings = () => setIsPKTimerSettingsOpen(true);

  const handleSavePKTimer = async (duration: number) => {
    setPkBattleDuration(duration);
    addToast(ToastType.Success, t('toasts.pkTimerSaved'));
    setIsPKTimerSettingsOpen(false);
  };

  const handleOpenListScreen = (listType: 'following' | 'fans' | 'visitors' | 'topFans' | 'blockList') => {
    if (!currentUser) return;

    let users: User[] = [];
    switch (listType) {
      case 'following':
        users = followingUsers;
        break;
      case 'fans':
        users = fans;
        break;
      case 'visitors':
        users = visitors.map(v => v.user);
        break;
      case 'topFans':
        users = fans.slice(0, 10);
        break;
      case 'blockList':
        users = [];
        break;
    }

    setListScreenUsers(users);

    switch (listType) {
      case 'following':
        setIsFollowingScreenOpen(true);
        break;
      case 'fans':
        setIsFansScreenOpen(true);
        break;
      case 'visitors':
        setIsVisitorsScreenOpen(true);
        break;
      case 'topFans':
        setIsTopFansScreenOpen(true);
        break;
      case 'blockList':
        setIsBlockListScreenOpen(true);
        break;
    }
  };

  const handlePurchaseEffect = async (gift: Gift) => {
    if (currentUser && currentUser.diamonds && gift.price && currentUser.diamonds >= gift.price) {
      const updatedUser = { ...currentUser, diamonds: currentUser.diamonds - gift.price };
      updateUserEverywhere(updatedUser);
      addToast(ToastType.Success, t('vip.store.purchaseSuccess', { name: gift.name }));
    } else {
      addToast(ToastType.Error, t('vip.store.notEnoughDiamonds'));
    }
  }

  const handleOpenMyStream = () => {
    if (!currentUser) return;
    if (!currentUser.isLive) {
      handleOpenGoLive();
    } else {
      const myStream = streamers.find(s => s.hostId === currentUser.id);
      if (myStream) {
        handleSelectStream(myStream);
      } else {
        addToast(ToastType.Error, "Não foi possível encontrar sua transmissão. Tente reiniciar.");
      }
    }
  };

  const handleOpenVIPCenter = () => {
    setIsVIPCenterOpen(true);
  };

  const handleSubscribeVIP = async () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, isVIP: true };
    updateUserEverywhere(updatedUser);
    addToast(ToastType.Success, t('toasts.vipSuccess'));
    setIsVIPCenterOpen(false);
  };

  const handleWatchLiveNotification = async () => {
    if (!liveNotification) return;

    const targetId = liveNotification.streamId || `stream_${liveNotification.streamerId}`;

    let targetStream = streamers.find(s => s.id === targetId || s.hostId === liveNotification.streamerId);

    if (!targetStream) {
      targetStream = {
        id: targetId,
        hostId: liveNotification.streamerId,
        name: liveNotification.streamerName,
        avatar: liveNotification.streamerAvatar,
        location: 'Unknown',
        time: 'Just now',
        message: liveNotification.message || 'Live Started!',
        tags: [],
        isPrivate: !!liveNotification.isPrivate,
        country: 'br',
        viewers: 0
      };
    }

    setLiveNotification(null);
    handleSelectStream(targetStream);
  };


  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;
  if (isLoadingCurrentUser || !currentUser) return <div className="h-full w-full bg-black flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="h-full w-full bg-black text-white overflow-hidden relative font-sans">
      {/* ChatScreen com prioridade absoluta - sobre todas as outras telas */}
      {chattingWith && currentUser && (
        <div className="fixed inset-0 z-[999999] bg-black">
          <ChatScreenWithWebSocket
            user={chattingWith}
            onBack={() => setChattingWith(null)}
            isModal={true}
            currentUser={currentUser}
            onNavigateToFriends={handleNavigateToFriends}
            onFollowUser={handleFollowUser}
            onBlockUser={handleBlockUser}
            onReportUser={handleReportUser}
            onOpenPhotoViewer={(photos, index) => {
                setPhotoViewerData({ photos, initialIndex: index });
            }}
          />
        </div>
      )}

      {(isEnteringStream) && (
        <div className="absolute inset-0 bg-black/80 z-[9999] flex items-center justify-center">
          <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-purple-500"></div>
        </div>
      )}

      {activeStream && streamRoomData && currentUser ? (
        isPKBattleActive && pkOpponent ? (
          <PKBattleScreen
            streamer={activeStream}
            opponent={pkOpponent}
            onEndPKBattle={handleEndPKBattle}
            onRequestEndStream={handleRequestEndStream}
            onViewProfile={handleViewProfile}
            currentUser={currentUser}
            onOpenWallet={handleOpenWallet}
            onFollowUser={handleFollowUser}
            onOpenPrivateChat={() => setIsPrivateChatModalOpen(true)}
            onStartChatWithStreamer={handleStartChatWithStreamer}
            onOpenPKTimerSettings={handleOpenPKTimerSettings}
            gifts={streamRoomData.gifts}
            receivedGifts={streamRoomData.receivedGifts}
            liveSession={liveSession}
            updateLiveSession={updateLiveSession}
            logLiveEvent={logLiveEvent}
            updateUser={updateUserEverywhere}
            setActiveScreen={handleNavigation}
            onStreamUpdate={handleStreamUpdate}
            rankingData={rankingData}
            addToast={addToast}
            refreshStreamRoomData={refreshStreamRoomData}
            onLeaveStreamView={handleLeaveStreamView}
            onOpenPrivateInviteModal={() => setIsPrivateInviteModalOpen(true)}
            onOpenFans={() => handleOpenListScreen('fans')}
            onOpenFriendRequests={() => setIsFriendRequestsScreenOpen(true)}
            followingUsers={followingUsers}
            pkBattleDuration={pkBattleDuration}
            streamers={streamers}
            onSelectStream={handleSelectStream}
            onOpenVIPCenter={handleOpenVIPCenter}
          />
        ) : (
          <StreamRoom
            streamer={activeStream}
            onRequestEndStream={handleRequestEndStream}
            onStartPKBattle={handleStartPKBattle}
            onViewProfile={handleViewProfile}
            currentUser={currentUser}
            onOpenWallet={handleOpenWallet}
            onFollowUser={handleFollowUser}
            onOpenPrivateChat={() => setIsPrivateChatModalOpen(true)}
            onStartChatWithStreamer={handleStartChatWithStreamer}
            onOpenPKTimerSettings={handleOpenPKTimerSettings}
            gifts={streamRoomData.gifts}
            receivedGifts={streamRoomData.receivedGifts}
            updateUser={updateUserEverywhere}
            liveSession={liveSession}
            updateLiveSession={updateLiveSession}
            logLiveEvent={logLiveEvent}
            setActiveScreen={handleNavigation}
            onStreamUpdate={handleStreamUpdate}
            refreshStreamRoomData={refreshStreamRoomData}
            addToast={addToast}
            onLeaveStreamView={handleLeaveStreamView}
            onOpenPrivateInviteModal={() => setIsPrivateInviteModalOpen(true)}
            onOpenFans={() => handleOpenListScreen('fans')}
            onOpenFriendRequests={() => setIsFriendRequestsScreenOpen(true)}
            followingUsers={followingUsers}
            streamers={streamers}
            onSelectStream={handleSelectStream}
            onOpenVIPCenter={handleOpenVIPCenter}
            rankingData={rankingData}
          />
        )
      ) : (
        <>
          {/* Demais telas só aparecem se não houver chat ativo */}
          {!chattingWith && (
            <div className="h-full w-full">
              {activeScreen === 'main' && <MainScreen onOpenReminderModal={() => setIsReminderModalOpen(true)} onOpenRegionModal={() => setIsRegionModalOpen(true)} onSelectStream={handleSelectStream} onOpenSearch={() => setIsSearchScreenOpen(true)} streamers={streamers} isLoading={isLoadingStreamers} activeTab={activeCategory} onTabChange={handleTabChange} showLocationBanner={showLocationBanner} />}
              {activeScreen === 'video' && <VideoScreen onViewProfile={handleViewProfile} onOpenPhotoViewer={(photos, index) => setPhotoViewerData({ photos, initialIndex: index })} />}
              {activeScreen === 'profile' &&
                <ProfileScreen
                  currentUser={currentUser}
                  onEdit={handleEditProfile}
                  onOpenMyLevel={() => setIsMyLevelScreenOpen(true)}
                  onOpenBlockList={() => handleOpenListScreen('blockList')}
                  onOpenAvatarProtection={() => setIsAvatarProtectionScreenOpen(true)}
                  onOpenFAQ={() => setIsFAQScreenOpen(true)}
                  onOpenSettings={() => setIsSettingsScreenOpen(true)}
                  onOpenAdminWallet={() => setIsAdminWalletOpen(true)}
                  onOpenVIPCenter={handleOpenVIPCenter}
                  onNavigateToMessages={() => currentUser && setChattingWith(currentUser)}
                  onOpenFans={() => handleOpenListScreen('fans')}
                  onOpenFollowing={() => handleOpenListScreen('following')}
                  onOpenVisitors={() => setIsVisitorsScreenOpen(true)}
                  onOpenTopFans={() => handleOpenListScreen('topFans')}
                  onOpenMarket={() => setIsMarketScreenOpen(true)}
                  onEnterMyStream={() => {
                    if (currentUser?.isLive) {
                      const userStream = streamers.find(s => s.hostId === currentUser.id);
                      if (userStream) handleSelectStream(userStream);
                    }
                  }}
                  onOpenProfile={() => setViewingProfile(currentUser)}
                  visitors={visitors}
                />
              }
              {/* MessagesScreen removida para não substituir chat individual */}
              {activeScreen === 'messages' && (
                <MessagesScreen
                  onStartChat={setChattingWith}
                  onViewProfile={handleViewProfile}
                  conversations={conversations}
                  friends={friends}
                  initialTab={messagesInitialTab}
                  onOpenFriendRequests={() => setIsFriendRequestsScreenOpen(true)}
                  fans={fans}
                  followingUsers={followingUsers}
                />
              )}
              <FooterNav currentUser={currentUser} onOpenGoLive={handleOpenGoLive} activeTab={activeScreen} onNavigate={handleNavigation} onOpenChat={() => handleNavigation('messages')} unreadCount={totalUnreadMessages} />
            </div>
          )}
        </>
      )}

      <ReminderModal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} onSelectStream={handleSelectStream} streamers={reminderStreamers} onOpenLiveHistory={() => setIsLiveHistoryOpen(true)} />
      <RegionModal isOpen={isRegionModalOpen} onClose={() => setIsRegionModalOpen(false)} countries={countries} onSelectRegion={handleSelectRegion} selectedCountryCode={selectedCountry} />
      {/* Updated GoLiveScreen usage to accept inviteData */}
      {isGoLiveOpen && <GoLiveScreen
        isOpen={isGoLiveOpen}
        onClose={() => { setIsGoLiveOpen(false); setPrivateInviteData(null); }}
        onStartStream={handleStartStream}
        onJoinStream={handleStartStream}
        addToast={addToast}
        currentUser={currentUser}
        inviteData={privateInviteData}
      />}
      <CameraPermissionModal isOpen={permissionStep !== 'idle'} permissionType={permissionStep} onAllowAlways={handlePermissionAllow} onAllowOnce={handlePermissionAllow} onDeny={handlePermissionDeny} onClose={() => setPermissionStep('idle')} />
      <LocationPermissionModal isOpen={isLocationPermissionModalOpen} onAllow={handleAllowLocation} onAllowOnce={handleAllowLocation} onDeny={handleDenyLocation} permissionStatus={locationPermissionStatus} />
      {isEndStreamConfirmOpen && <EndStreamConfirmationModal onCancel={() => setIsEndStreamConfirmOpen(false)} onConfirm={handleConfirmEndStream} isPK={isPKBattleActive} />}
      {isEndStreamSummaryOpen && streamSummaryData && <EndStreamSummaryScreen data={streamSummaryData} onClose={() => { setIsEndStreamSummaryOpen(false); setStreamSummaryData(null); }} />}
      {viewingProfile && <UserProfileScreen user={viewingProfile} isCurrentUser={viewingProfile.id === currentUser?.id} onBack={() => setViewingProfile(null)} onEdit={handleEditProfile} onOpenTopFans={() => { setViewingProfile(null); handleOpenListScreen('topFans'); }} onOpenFollowing={() => { setViewingProfile(null); handleOpenListScreen('following'); }} onOpenFans={() => { setViewingProfile(null); handleOpenListScreen('fans'); }} onFollow={handleFollowUser} onStartChat={setChattingWith} onBlockUser={handleBlockUser} onReportUser={handleReportUser} onOpenPhotoViewer={(photos, index) => setPhotoViewerData({ photos, initialIndex: index })} lastPhotoLikeUpdate={lastPhotoLikeUpdate} onPhotoLiked={() => setLastPhotoLikeUpdate(Date.now())} onPhotoRemoved={(u) => { updateUserEverywhere(u); setViewingProfile(u); }} />}
      {isEditingProfile && <EditProfileScreen user={currentUser} onBack={() => setIsEditingProfile(false)} onSave={handleSaveProfile} />}
      {isConfirmingPurchase && selectedPackage && <ConfirmPurchaseScreen onClose={() => setIsConfirmingPurchase(false)} packageDetails={selectedPackage} onConfirmPurchase={handleConfirmPurchase} addToast={addToast} currentUser={currentUser} />}
      {isFollowingScreenOpen && <FollowingScreen onBack={() => setIsFollowingScreenOpen(false)} onViewProfile={handleViewProfile} users={listScreenUsers} onFollowUser={handleFollowUser} />}
      {isFansScreenOpen && <FansScreen onBack={() => setIsFansScreenOpen(false)} onViewProfile={handleViewProfile} users={listScreenUsers} onFollowUser={handleFollowUser} />}
      {isFriendRequestsScreenOpen && <FriendRequestsScreen onBack={() => setIsFriendRequestsScreenOpen(false)} onViewProfile={handleViewProfile} users={(followingUsers || []).filter(followed => followed && (fans || []).some(fan => fan && fan.id === followed.id))} onFollowUser={handleFollowUser} />}
      {isVisitorsScreenOpen && <VisitorsScreen onBack={() => setIsVisitorsScreenOpen(false)} onViewProfile={handleViewProfile} currentUser={currentUser} addToast={addToast} />}
      {isTopFansScreenOpen && <TopFansScreen onBack={() => setIsTopFansScreenOpen(false)} onViewProfile={handleViewProfile} currentUser={currentUser} />}
      {isMyLevelScreenOpen && <MyLevelScreen onClose={() => setIsMyLevelScreenOpen(false)} currentUser={currentUser} />}
      {isBlockListScreenOpen && <BlockListScreen onClose={() => setIsBlockListScreenOpen(false)} onUnblockUser={handleUnblockUser} onViewProfile={handleViewProfile} />}
      {isAvatarProtectionScreenOpen && <AvatarProtectionScreen onClose={() => setIsAvatarProtectionScreenOpen(false)} currentUser={currentUser} updateUser={updateUserEverywhere} addToast={addToast} />}
      {isMarketScreenOpen && currentUser && <MarketScreen onClose={() => setIsMarketScreenOpen(false)} user={currentUser} updateUser={updateUserEverywhere} onPurchaseFrame={handlePurchaseFrame} addToast={addToast} />}
      {isFAQScreenOpen && <FAQScreen onClose={() => setIsFAQScreenOpen(false)} />}
      {isSettingsScreenOpen && <SettingsScreen onClose={() => setIsSettingsScreenOpen(false)} currentUser={currentUser} gifts={allGifts} updateUser={updateUserEverywhere} addToast={addToast} onOpenPipModal={() => setIsPipSettingsModalOpen(true)} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} onOpenLanguageModal={() => setIsLanguageModalOpen(true)} />}
      <PipSettingsModal isOpen={isPipSettingsModalOpen} onClose={() => setIsPipSettingsModalOpen(false)} currentUser={currentUser} updateUser={updateUserEverywhere} addToast={addToast} />
      <LanguageSelectionModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} currentLanguage={language} onSave={(lang) => { setLanguage(lang); setIsLanguageModalOpen(false); }} />
      {isSearchScreenOpen && <SearchScreen onClose={() => setIsSearchScreenOpen(false)} onViewProfile={handleViewProfile} allUsers={allUsers} onFollowUser={handleFollowUser} />}
      {activeStream && isPrivateInviteModalOpen && <PrivateInviteModal isOpen={isPrivateInviteModalOpen} onClose={() => setIsPrivateInviteModalOpen(false)} streamId={activeStream.id} currentUser={currentUser} addToast={addToast} followingUsers={followingUsers} onFollowUser={handleFollowUser} allGifts={allGifts} />}
      {photoViewerData && (
        <>
          
          <FullScreenPhotoViewer 
            photos={photoViewerData.photos} 
            initialIndex={photoViewerData.initialIndex} 
            onClose={() => {
              setPhotoViewerData(null);
            }} 
            onViewProfile={handleViewProfile} 
            onPhotoLiked={() => setLastPhotoLikeUpdate(Date.now())} 
          />
        </>
      )}
      <LiveHistoryScreen isOpen={isLiveHistoryOpen} onClose={() => setIsLiveHistoryOpen(false)} history={streamHistory} />
      <AdminWalletScreen isOpen={isAdminWalletOpen} onClose={() => setIsAdminWalletOpen(false)} currentUser={currentUser} updateUser={updateUserEverywhere} addToast={addToast} />
      <PrivateChatModal isOpen={isPrivateChatModalOpen} onClose={() => setIsPrivateChatModalOpen(false)} onStartChat={(user) => { setIsPrivateChatModalOpen(false); setChattingWith(user); }} conversations={conversations} />
      
      {/* Notificações de mensagens */}
      {messageNotifications.map((notification) => (
        <MessageNotification
          key={notification.id}
          message={notification}
          onClose={() => {
            setMessageNotifications(prev => prev.filter(n => n.id !== notification.id));
          }}
        />
      ))}
      
      <PKBattleTimerSettingsScreen isOpen={isPKTimerSettingsOpen} onBack={() => setIsPKTimerSettingsOpen(false)} onSave={handleSavePKTimer} />
      {isVIPCenterOpen && currentUser && <VIPCenterScreen isOpen={isVIPCenterOpen} onClose={() => setIsVIPCenterOpen(false)} user={currentUser} onSubscribe={handleSubscribeVIP} />}
      {isPaymentSuccessOpen && paymentSuccessData && <PaymentSuccessScreen onClose={() => setIsPaymentSuccessOpen(false)} data={paymentSuccessData} addToast={(type, msg) => addToast(type === 'info' ? ToastType.Info : ToastType.Success, msg)} />}

      {/* LiveNotificationModal rendered for standard notifications, but private invite uses GoLiveScreen directly */}
      <LiveNotificationModal
        isOpen={!!liveNotification}
        onClose={() => setLiveNotification(null)}
        onWatch={handleWatchLiveNotification}
        data={liveNotification}
      />

      <div className="absolute top-4 right-4 left-4 sm:left-auto space-y-2 z-[9999] pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast data={toast} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
          </div>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;

