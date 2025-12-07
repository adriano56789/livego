import React, { useState, useCallback, useEffect } from 'react';
import { LanguageProvider, useTranslation } from './i18n/i18n';

// Importando serviços
import { api } from '../services/api';
import { webSocketManager } from '../services/websocket';
import { db, avatarFrames } from '../services/database';

// Importando tipos
import { 
  ToastType, 
  ToastData, 
  Streamer, 
  User, 
  Gift, 
  StreamSummaryData, 
  LiveSessionState, 
  RankedUser, 
  Conversation, 
  Country, 
  NotificationSettings, 
  BeautySettings, 
  FeedPhoto, 
  StreamHistoryEntry, 
  Visitor, 
  PurchaseRecord 
} from '../types';

// Importando componentes que estão na pasta components
import LoginScreen from '../components/LoginScreen';
import MainScreen from '../components/MainScreen';
import ProfileScreen from '../components/ProfileScreen';
import MessagesScreen from '../components/MessagesScreen';
import ChatScreen from '../components/ChatScreen';
import FooterNav from '../components/FooterNav';
import ReminderModal from '../components/ReminderModal';
import RegionModal from '../components/RegionModal';
import GoLiveScreen from '../components/GoLiveScreen';
import StreamRoom from '../components/StreamRoom';
import PKBattleScreen from '../components/PKBattleScreen';
import Toast from '../components/Toast';
import UserProfileScreen from '../components/BroadcasterProfileScreen';
import EditProfileScreen from '../components/EditProfileScreen';
import WalletScreen from '../components/WalletScreen';
import FollowingScreen from '../components/FollowingScreen';
import FansScreen from '../components/FansScreen';
import VisitorsScreen from '../components/VisitorsScreen';
import TopFansScreen from '../components/TopFansScreen';
import MyLevelScreen from '../components/MyLevelScreen';
import BlockListScreen from '../components/BlockListScreen';
import AvatarProtectionScreen from '../components/AvatarProtectionScreen';
import MarketScreen from '../components/MarketScreen';
import FAQScreen from '../components/FAQScreen';
import SettingsScreen from '../SettingsScreen';
import ConfirmPurchaseScreen from '../components/ConfirmPurchaseScreen';
import SearchScreen from '../components/SearchScreen';
import CameraPermissionModal from '../components/CameraPermissionModal';
import LocationPermissionModal from '../components/LocationPermissionModal';
import PrivateChatModal from '../components/PrivateChatModal';
import FriendRequestsScreen from '../components/FriendRequestsScreen';
import VideoScreen from '../components/VideoScreen';
import FullScreenPhotoViewer from '../components/FullScreenPhotoViewer';
import LiveHistoryScreen from '../components/LiveHistoryScreen';
import AdminWalletScreen from '../components/AdminWalletScreen';
import VIPCenterScreen from '../components/VIPCenterScreen';
import PrivateInviteModal from '../components/PrivateInviteModal';
import WalletTest from '../components/WalletTest';

// Importando componentes de pastas específicas
import EndStreamConfirmationModal from '../components/live/EndStreamConfirmationModal';
import PKBattleTimerSettingsScreen from '../components/settings/PKBattleTimerSettingsScreen';
import PipSettingsModal from '../components/settings/PipSettingsModal';
import LanguageSelectionModal from '../components/settings/LanguageSelectionModal';
import FanClubMembersModal from '../components/live/FanClubMembersModal';
import EndStreamSummaryScreen from '../components/EndStreamSummaryScreen';
import { LoadingSpinner } from '../components/Loading';

interface StreamRoomData {
    gifts: Gift[];
    receivedGifts: (Gift & { count: number })[];
}

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Log para visualizar o ID do usuário atual
  useEffect(() => {
    if (currentUser) {
      console.log('ID do usuário atual:', currentUser.id);
    }
  }, [currentUser]);
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
  const [activeStream, setActiveStream] = useState<Streamer | null>(null);
  const [streamRoomData, setStreamRoomData] = useState<StreamRoomData | null>(null);
  const [isPKBattleActive, setIsPKBattleActive] = useState<boolean>(false);
  const [pkOpponent, setPkOpponent] = useState<User | null>(null);
  const [chattingWith, setChattingWith] = useState<User | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isWalletScreenOpen, setIsWalletScreenOpen] = useState<boolean>(false);
  const [walletInitialTab, setWalletInitialTab] = useState<'Diamante' | 'Ganhos'>('Diamante');
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
  const [isFanClubMembersModalOpen, setIsFanClubMembersModalOpen] = useState(false);
  const [fanClubMembers, setFanClubMembers] = useState<User[]>([]);
  const [viewingFanClubStreamer, setViewingFanClubStreamer] = useState<User | null>(null);
  const [isWalletTestOpen, setIsWalletTestOpen] = useState(false);
    
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [isLoadingStreamers, setIsLoadingStreamers] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [fans, setFans] = useState<User[]>([]);
  const [allGifts, setAllGifts] = useState<Gift[]>([]);
  const [reminderStreamers, setReminderStreamers] = useState<Streamer[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('ICON_GLOBE');
  const [activeCategory, setActiveCategory] = useState('popular');
  const [rankingData, setRankingData] = useState<Record<string, RankedUser[]>>({ 'Diária': [], 'Semanal': [], 'Mensal': [] });
  const [listScreenUsers, setListScreenUsers] = useState<User[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [lastPhotoLikeUpdate, setLastPhotoLikeUpdate] = useState<number>(0);
  const [streamHistory, setStreamHistory] = useState<StreamHistoryEntry[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);

  const { t, language, setLanguage } = useTranslation();
  
  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
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

  const handleLeaveStreamView = useCallback(() => {
    if (activeStream) {
        webSocketManager.leaveStreamRoom(activeStream.id);
        db.liveSessions.delete(activeStream.id);
    }
    setActiveStream(null);
    setIsPKBattleActive(false);
    setPkOpponent(null);
    setLiveSession(null);
    setStreamRoomData(null);
  }, [activeStream]);

  const handleLogout = async () => {
    if (currentUser) {
        await api.updateSimStatus(false).catch(err => console.error("Failed to set user offline:", err));
    }
    webSocketManager.disconnect();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveScreen('main');
    setIsSettingsScreenOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    try {
        const { success } = await api.deleteAccount(currentUser.id);
        if (success) {
            addToast(ToastType.Success, "Conta excluída com sucesso.");
            await handleLogout();
        } else {
            throw new Error("Falha ao excluir a conta do servidor.");
        }
    } catch (error) {
        addToast(ToastType.Error, (error as Error).message || "Falha ao excluir a conta.");
    }
  };

  useEffect(() => {
    if (isAuthenticated && !currentUser) { // Only fetch if authenticated but user is not loaded
      api.getCurrentUser().then(async user => {
        if (user) {
            const { success, user: updatedUser } = await api.updateSimStatus(true);
            if (success && updatedUser) {
              setCurrentUser(updatedUser);
            } else {
              setCurrentUser(user); // fallback
            }
            webSocketManager.connect(user.id);
        }
        setIsLoadingCurrentUser(false);
      }).catch(err => {
        console.error("Failed to fetch current user:", err);
        addToast(ToastType.Error, "Falha ao carregar dados do usuário.");
        setIsLoadingCurrentUser(false);
      });
    }
  }, [isAuthenticated, currentUser, addToast]);

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

    webSocketManager.on('kicked', handleKicked);
    webSocketManager.on('joinDenied', handleJoinDenied);

    return () => {
        webSocketManager.off('kicked', handleKicked);
        webSocketManager.off('joinDenied', handleJoinDenied);
    };
  }, [activeStream, addToast, handleLeaveStreamView]);
  
  useEffect(() => {
    if (currentUser) {
      const showError = (err: Error, entity: string) => {
          console.error(`Failed to load ${entity}:`, err);
          addToast(ToastType.Error, `Falha ao carregar ${entity}.`);
      };

      api.getCountries().then(data => setCountries(data || [])).catch(err => showError(err as Error, 'países'));
      api.getAllUsers().then(data => setAllUsers(data || [])).catch(err => showError(err as Error, 'usuários'));
      api.getGifts().then(data => setAllGifts(data || [])).catch(err => showError(err as Error, 'presentes'));
      api.getStreamHistory().then(data => setStreamHistory(data || [])).catch(err => console.error("Failed to fetch stream history:", err));
      api.getPurchaseHistory(currentUser.id, currentUser.id).then(data => setPurchaseHistory(data || [])).catch(err => console.error("Failed to fetch purchase history:", err));

      api.getFollowingUsers(currentUser.id).then(data => setFollowingUsers(data || [])).catch(err => showError(err as Error, 'seguidores'));
      api.getFansUsers(currentUser.id).then(data => setFans(data || [])).catch(err => showError(err as Error, 'fãs'));
      api.getReminders().then(data => setReminderStreamers(data || [])).catch(err => showError(err as Error, 'lembretes'));
      api.getNotificationSettings(currentUser.id).then(setNotificationSettings).catch(err => showError(err as Error, 'configurações de notificação'));
      api.getPKConfig().then(config => {
        if (config) {
            setPkBattleDuration(config.duration);
        }
      }).catch(err => showError(err as Error, 'configuração de PK'));
    }
  }, [currentUser, addToast]);
  
  useEffect(() => {
    const handleStreamerLive = (payload: { streamerId: string, streamerName: string, streamerAvatar: string }) => {
        if (notificationSettings?.streamerLive) {
            addToast(ToastType.Info, `${payload.streamerName} está ao vivo!`);
        }
        const userToUpdate = allUsers.find(u => u.id === payload.streamerId);
        if (userToUpdate && !userToUpdate.isLive) {
            updateUserEverywhere({ ...userToUpdate, isLive: true });
        }
    };

    webSocketManager.on('streamerLive', handleStreamerLive);

    return () => {
        webSocketManager.off('streamerLive', handleStreamerLive);
    };
  }, [addToast, notificationSettings, allUsers, updateUserEverywhere]);

  useEffect(() => {
    if (currentUser) {
        const fetchRanks = async () => {
            try {
                const [daily, weekly, monthly] = await Promise.all([
                    api.getRankingForPeriod('daily'),
                    api.getRankingForPeriod('weekly'),
                    api.getRankingForPeriod('monthly')
                ]);
                setRankingData({
                    'Diária': daily || [],
                    'Semanal': weekly || [],
                    'Mensal': monthly || [],
                });
            } catch (err) {
                console.error("Failed to load ranking data:", err);
            }
        };
        fetchRanks();
    }
}, [currentUser]);
  
  useEffect(() => {
    if (currentUser) {
      setIsLoadingStreamers(true);
      const countryCode = selectedCountry === 'ICON_GLOBE' ? undefined : selectedCountry;
      api.getLiveStreamers(activeCategory, countryCode).then(data => {
        setStreamers(data || []);
        setIsLoadingStreamers(false);
      }).catch(err => {
        console.error("Failed to load streamers:", err);
        addToast(ToastType.Error, (err as Error).message);
        setIsLoadingStreamers(false);
      });
    }
  }, [currentUser, selectedCountry, activeCategory, addToast]);

  useEffect(() => {
    if (activeScreen === 'messages' && currentUser) {
        api.getConversations(currentUser.id).then(data => setConversations(data || [])).catch(err => {
            console.error("Failed to load conversations:", err);
            addToast(ToastType.Error, "Falha ao carregar conversas.");
        });
        api.getFriends(currentUser.id).then(data => setFriends(data || [])).catch(err => {
            console.error("Failed to load friends:", err);
            addToast(ToastType.Error, "Falha ao carregar amigos.");
        });
    }
  }, [activeScreen, currentUser, addToast]);

  useEffect(() => {
    if (activeScreen === 'profile' && currentUser) {
        api.getVisitors(currentUser.id).then(data => setVisitors(data || [])).catch(err => {
            console.error("Failed to load visitors:", err);
            addToast(ToastType.Error, "Falha ao carregar visitantes.");
        });
    }
  }, [activeScreen, currentUser, addToast]);


  const refreshStreamRoomData = useCallback(async (streamerId: string) => {
    try {
        const newReceivedGifts = await api.getReceivedGifts(streamerId);
        setStreamRoomData(prev => prev ? { ...prev, receivedGifts: newReceivedGifts || [] } : null);
    } catch (error) {
        console.error("Failed to refresh received gifts:", error);
        addToast(ToastType.Error, "Falha ao atualizar os presentes recebidos.");
    }
  }, [addToast]);

  const handleStreamUpdate = (updates: Partial<Streamer>) => {
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
        if (activeStream) {
            db.liveSessions.set(activeStream.id, newSession);
        }
        return newSession;
    });
  }, [activeStream]);

  useEffect(() => {
    const handleFollowUpdate = (payload: { follower: User, followed: User, isUnfollow: boolean }) => {
        const { follower, followed, isUnfollow } = payload;
        
        updateUserEverywhere(follower);
        updateUserEverywhere(followed);
        
        if (currentUser && followed.id === currentUser.id) { // Someone followed/unfollowed me
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

        if (currentUser && follower.id === currentUser.id) { // I followed/unfollowed someone
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
            api.getCurrentUser().then(user => { if(user) updateUserEverywhere(user); });
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
            return [record, ...prev];
        });

        if (record.userId === currentUser?.id) {
            if (record.status === 'Concluído' && record.type === 'withdraw_earnings') {
                addToast(ToastType.Success, `Saque de R$ ${record.amountBRL.toFixed(2)} concluído!`);
            } else if (record.status === 'Cancelado') {
                 addToast(ToastType.Error, `Saque de R$ ${record.amountBRL.toFixed(2)} falhou.`);
            }
        }
    };


    webSocketManager.on('followUpdate', handleFollowUpdate);
    webSocketManager.on('newFollower', handleNewFollower);
    webSocketManager.on('micStateUpdate', handleMicStateUpdate);
    webSocketManager.on('soundStateUpdate', handleSoundStateUpdate);
    webSocketManager.on('userUpdate', handleUserUpdate);
    webSocketManager.on('transactionUpdate', handleTransactionUpdate);

    return () => {
        webSocketManager.off('followUpdate', handleFollowUpdate);
        webSocketManager.off('newFollower', handleNewFollower);
        webSocketManager.off('micStateUpdate', handleMicStateUpdate);
        webSocketManager.off('soundStateUpdate', handleSoundStateUpdate);
        webSocketManager.off('userUpdate', handleUserUpdate);
        webSocketManager.off('transactionUpdate', handleTransactionUpdate);
    };
}, [currentUser, updateUserEverywhere, activeStream, updateLiveSession, addToast]);


  const handleSelectRegion = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setIsRegionModalOpen(false);
  };
  
  const startLiveSession = (streamer: Streamer) => {
    const newSession = {
      startTime: Date.now(),
      viewers: streamer.viewers || 1, 
      peakViewers: streamer.viewers || 1,
      coins: 0,
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
    db.liveSessions.set(streamer.id, newSession);
    setActiveStream(streamer);
  };

  const logLiveEvent = (type: string, data: any) => {
    if (!liveSession || !activeStream) return;
    const event = { type, timestamp: new Date().toISOString(), ...data };
    updateLiveSession({ events: [...(liveSession.events || []), event] });
  };


  const handleLogin = () => setIsAuthenticated(true);
  
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
        if (!currentUser) return;
        const { status } = await api.getLocationPermission(currentUser.id);
        setLocationPermissionStatus(status);

        if (status === 'granted') {
            setActiveCategory(tab);
            setShowLocationBanner(false);
        } else if (status === 'denied') {
            setActiveCategory(tab);
            setShowLocationBanner(true);
        } else { // 'prompt'
            setIsLocationPermissionModalOpen(true);
        }
    } else {
        setActiveCategory(tab);
        setShowLocationBanner(false);
    }
};

const handleAllowLocation = async () => {
    if (!currentUser) return;
    try {
        const { success, user } = await api.updateLocationPermission(currentUser.id, 'granted');
        if (success && user) {
            updateUserEverywhere(user);
            setLocationPermissionStatus('granted');
            setActiveCategory('nearby');
            setShowLocationBanner(false);
            addToast(ToastType.Success, "Permissão de localização concedida.");
        } else {
            throw new Error("Failed to update permission on server.");
        }
    } catch (e) {
        addToast(ToastType.Error, "Não foi possível conceder a permissão.");
    } finally {
        setIsLocationPermissionModalOpen(false);
    }
};

const handleDenyLocation = async () => {
     if (!currentUser) return;
    try {
        await api.updateLocationPermission(currentUser.id, 'denied');
        setLocationPermissionStatus('denied');
        setActiveCategory('nearby'); // still go to the tab
        setShowLocationBanner(true);
        addToast(ToastType.Info, "Permissão de localização negada.");
    } catch (e) {
        addToast(ToastType.Error, "Não foi possível negar a permissão.");
    } finally {
        setIsLocationPermissionModalOpen(false);
    }
};


  const checkMicrophonePermission = async () => {
    if (!currentUser) return;
    try {
        const { status } = await api.getMicrophonePermission(currentUser.id);
        if (status === 'denied') {
            addToast(ToastType.Error, "Permissão de microfone negada. Habilite nas configurações do navegador.");
        } else if (status === 'granted') {
            setIsGoLiveOpen(true);
        } else {
            setPermissionStep('microphone');
        }
    } catch (error) {
        addToast(ToastType.Error, "Falha ao verificar permissão do microfone.");
    }
  };

  const checkCameraPermission = async () => {
      if (!currentUser) return;
      try {
          const { status } = await api.getCameraPermission(currentUser.id);
          if (status === 'denied') {
              addToast(ToastType.Error, "Permissão de câmera negada. Habilite nas configurações do navegador.");
          } else if (status === 'granted') {
              await checkMicrophonePermission();
          } else {
              setPermissionStep('camera');
          }
      } catch (error) {
          addToast(ToastType.Error, "Falha ao verificar permissões.");
      }
  };

  const handleOpenGoLive = async () => {
      await checkCameraPermission();
  };

  const handlePermissionAllow = async () => {
    if (!currentUser) return;
    if (permissionStep === 'camera') {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            await api.updateCameraPermission(currentUser.id, 'granted');
            await checkMicrophonePermission(); 
        } catch (err) {
            await api.updateCameraPermission(currentUser.id, 'denied');
            addToast(ToastType.Error, t('toasts.permissionsNeeded'));
            setPermissionStep('idle');
        }
    } else if (permissionStep === 'microphone') {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            await api.updateMicrophonePermission(currentUser.id, 'granted');
            setIsGoLiveOpen(true);
            setPermissionStep('idle');
        } catch (err) {
            await api.updateMicrophonePermission(currentUser.id, 'denied');
            addToast(ToastType.Error, t('toasts.permissionsNeeded'));
            setPermissionStep('idle');
        }
    }
  };

  const handlePermissionDeny = async () => {
    if (!currentUser) return;
    if (permissionStep === 'camera') {
      await api.updateCameraPermission(currentUser.id, 'denied');
    } else if (permissionStep === 'microphone') {
      await api.updateMicrophonePermission(currentUser.id, 'denied');
    }
    addToast(ToastType.Error, t('toasts.permissionsNeeded'));
    setPermissionStep('idle');
  };

  const handleSelectStream = async (streamer: Streamer) => {
    if (!currentUser) return;
    setIsEnteringStream(true);
    try {
        if (activeStream) {
            webSocketManager.leaveStreamRoom(activeStream.id);
        }

        if (streamer.isPrivate && streamer.hostId !== currentUser.id) {
            const { canJoin } = await api.checkPrivateStreamAccess(streamer.id, currentUser.id);
            if (!canJoin) {
                addToast(ToastType.Error, "Você não tem permissão para entrar nesta sala privada.");
                setIsEnteringStream(false);
                return;
            }
        }

        const gifts = await api.getGifts();
        setStreamRoomData({ gifts: gifts || [], receivedGifts: [] });
        startLiveSession(streamer);
        webSocketManager.joinStreamRoom(streamer.id);
        // Atualiza os dados completos da sala, incluindo receivedGifts
        await refreshStreamRoomData(streamer.hostId);
    } catch (error) {
        addToast(ToastType.Error, "Falha ao carregar dados da live.");
    } finally {
        setIsEnteringStream(false);
    }
  };
  
  const handleStartStream = async (streamer: Streamer) => {
    setIsGoLiveOpen(false);
    handleSelectStream(streamer);

    setReminderStreamers(prev => {
      const existingIndex = prev.findIndex(s => s.hostId === streamer.hostId);
      if (existingIndex > -1) {
        const newList = [...prev];
        newList[existingIndex] = streamer;
        return newList;
      }
      return [streamer, ...prev];
    });

    if (currentUser && streamer.hostId === currentUser.id) {
        const { success, user } = await api.updateProfile(currentUser.id, { isLive: true, isOnline: true });
        if (success && user) {
            updateUserEverywhere(user);
        } else {
            addToast(ToastType.Error, "Falha ao atualizar o status da transmissão.");
            // Fallback to optimistic update
            updateUserEverywhere({ ...currentUser, isLive: true, isOnline: true });
        }
    }
  };

  const handleRequestEndStream = () => setIsEndStreamConfirmOpen(true);

  const handleConfirmEndStream = async () => {
    setIsEndStreamConfirmOpen(false);
    
    if (activeStream && liveSession) {
        const endTime = Date.now();
        const historyEntry: StreamHistoryEntry = {
            id: `hist_stream-${activeStream.id}_${endTime}_${Math.random().toString(36).slice(2)}`,
            streamerId: activeStream.hostId,
            name: activeStream.name,
            avatar: activeStream.avatar,
            startTime: liveSession.startTime,
            endTime: endTime,
        };

        try {
            await api.addStreamToHistory(historyEntry);
            setStreamHistory(prev => [historyEntry, ...prev]);
        } catch (error) {
            addToast(ToastType.Error, 'Falha ao salvar no histórico.');
            console.error("Failed to save stream to history:", error);
        }

        webSocketManager.leaveStreamRoom(activeStream.id);

        try {
            const { success, user } = await api.endLiveSession(activeStream.id, liveSession);
            if (success && user) {
                updateUserEverywhere(user);
            } else {
                addToast(ToastType.Error, 'Falha ao finalizar a sessão no servidor.');
            }
        } catch (error) {
            addToast(ToastType.Error, 'Erro ao finalizar a sessão.');
        }

        const durationMs = endTime - liveSession.startTime;
        const totalSeconds = Math.floor(durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const durationStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        const summary: StreamSummaryData = {
            viewers: liveSession.peakViewers,
            duration: durationStr,
            coins: liveSession.coins,
            followers: liveSession.followers,
            members: liveSession.members,
            fans: liveSession.fans,
            user: { name: activeStream.name, avatarUrl: activeStream.avatar }
        };
        setStreamSummaryData(summary);
        setIsEndStreamSummaryOpen(true);
    }

    setActiveStream(null);
    setIsPKBattleActive(false);
    setPkOpponent(null);
    setLiveSession(null);
    setStreamRoomData(null);
};

  const handleStartPKBattle = async (opponent: User) => {
    if (!activeStream) return;
    try {
        await api.startPKBattle(activeStream.id, opponent.id);
        setPkOpponent(opponent);
        setIsPKBattleActive(true);
    } catch (error) {
        addToast(ToastType.Error, "Falha ao iniciar a batalha PK.");
    }
  };

  const handleEndPKBattle = () => {
    if (!activeStream) return;
    api.endPKBattle(activeStream.id).then(({ success }) => {
        if (success) {
            addToast(ToastType.Info, "Batalha PK encerrada.");
        }
    });
    setIsPKBattleActive(false);
    setPkOpponent(null);
  };
  
  const handleViewProfile = async (user: User) => {
    setChattingWith(null);
    const fullUserFromState = allUsers.find(u => u.id === user.id);
    const userToView = fullUserFromState || user;
    setViewingProfile(userToView);

    if (currentUser && userToView.id !== currentUser.id) {
        try {
            await api.recordVisit(userToView.id, currentUser.id);
        } catch(error) {
            console.error("Failed to record visit:", error);
        }
    }
  };
  
  const handleEditProfile = () => { setIsEditingProfile(true); setViewingProfile(null); }
  
  const handleSaveProfile = async (updatedData: Partial<User>) => {
      if (!currentUser) return;
      const { success, user } = await api.updateProfile(currentUser.id, updatedData);
      if (success && user) {
        updateUserEverywhere(user);
        setIsEditingProfile(false);
        setViewingProfile(user);
        addToast(ToastType.Success, t('toasts.profileSaved'));
      } else {
        addToast(ToastType.Error, "Falha ao salvar perfil.");
      }
  };

  const handleFollowUser = async (userToFollow: User, streamId?: string) => {
    if (!currentUser) return;

    const { success, updatedFollower, updatedFollowed } = await api.followUser(currentUser.id, userToFollow.id, streamId);

    if (success && updatedFollower && updatedFollowed) {
        updateUserEverywhere(updatedFollower);
        updateUserEverywhere(updatedFollowed);

        setFollowingUsers(prev => {
            if (updatedFollowed.isFollowed) { 
                if (prev.some(u => u.id === updatedFollowed.id)) {
                    return prev.map(u => u.id === updatedFollowed.id ? updatedFollowed : u);
                }
                return [...prev, updatedFollowed];
            } else { 
                return prev.filter(u => u.id !== updatedFollowed.id);
            }
        });

        api.getFriends(currentUser.id).then(data => setFriends(data || [])).catch(err => {
            console.error("Failed to reload friends after follow action:", err);
            addToast(ToastType.Error, "Falha ao atualizar lista de amigos.");
        });

        if (liveSession && activeStream && userToFollow.id === activeStream.hostId) {
            const increment = updatedFollowed.isFollowed ? 1 : -1;
            updateLiveSession({ followers: Math.max(0, (liveSession.followers || 0) + increment) });
        }

        if (!streamId) {
            const toastMessage = updatedFollowed.isFollowed
                ? `Você seguiu ${userToFollow.name}.`
                : `Você deixou de seguir ${userToFollow.name}.`;
            addToast(ToastType.Success, toastMessage);
        }

    } else {
        addToast(ToastType.Error, "Ação de seguir/deixar de seguir falhou.");
    }
  };

    const handleBlockUser = async (userToBlock: User) => {
        if (!currentUser) return;
        try {
            await api.blockUser(userToBlock.id);
            addToast(ToastType.Success, `${userToBlock.name} foi bloqueado.`);
            if (viewingProfile?.id === userToBlock.id) {
                setViewingProfile(null);
            }
            if (chattingWith?.id === userToBlock.id) {
                setChattingWith(null);
            }
            api.getFriends(currentUser.id).then(data => setFriends(data || []));
            api.getFollowingUsers(currentUser.id).then(data => setFollowingUsers(data || []));
        } catch (error) {
            addToast(ToastType.Error, `Falha ao bloquear ${userToBlock.name}.`);
        }
    };

    const handleReportUser = async (userToReport: User) => {
        if (!currentUser) return;
        try {
            await api.reportUser(userToReport.id, "Reported from profile modal");
            addToast(ToastType.Success, `Denúncia sobre ${userToReport.name} enviada.`);
        } catch (error) {
            addToast(ToastType.Error, `Falha ao denunciar ${userToReport.name}.`);
        }
    };
    
    const handleUnblockUser = async (userToUnblock: User) => {
        if (!currentUser) return;
        try {
            await api.unblockUser(userToUnblock.id);
            addToast(ToastType.Success, `${userToUnblock.name} foi desbloqueado.`);
        } catch (error) {
            addToast(ToastType.Error, `Falha ao desbloquear ${userToUnblock.name}.`);
        }
    };

    const handleOpenWallet = (initialTab: 'Diamante' | 'Ganhos' = 'Diamante') => {
        setWalletInitialTab(initialTab);
        setIsWalletScreenOpen(true);
    };
    
    const handlePurchase = (pkg: { diamonds: number; price: number }) => {
        setSelectedPackage(pkg);
        setIsWalletScreenOpen(false);
        setIsConfirmingPurchase(true);
    };

    const handleConfirmPurchase = async (pkg: { diamonds: number; price: number }) => {
        if (!currentUser) return;
        try {
            const { success, user } = await api.buyDiamonds(currentUser.id, pkg.diamonds, pkg.price);
            if (success && user) {
                updateUserEverywhere(user);
                addToast(ToastType.Success, `+${pkg.diamonds} diamantes adicionados!`);
            } else {
                throw new Error("Falha na compra.");
            }
        } catch (error) {
            addToast(ToastType.Error, (error as Error).message);
        } finally {
            setIsConfirmingPurchase(false);
            setSelectedPackage(null);
        }
    };

    const handlePurchaseFrame = async (frameId: string) => {
        if (!currentUser) return;
        const frame = avatarFrames.find(f => f.id === frameId);
        if (!frame) return;
    
        if (currentUser.diamonds < frame.price) {
            addToast(ToastType.Error, "Diamantes insuficientes.");
            handleOpenWallet('Diamante');
            return;
        }
        
        try {
            const { success, user } = await api.purchaseFrame(currentUser.id, frameId);
            if (success && user) {
                updateUserEverywhere(user);
                addToast(ToastType.Success, "Moldura comprada com sucesso!");
            } else {
                throw new Error("Falha na compra da moldura.");
            }
        } catch (error) {
            addToast(ToastType.Error, (error as Error).message);
        }
    };
    
    const handleOpenPKTimerSettings = () => setIsPKTimerSettingsOpen(true);

    const handleSavePKTimer = async (duration: number) => {
        try {
            const { success, config } = await api.updatePKConfig(duration);
            if (success && config) {
                setPkBattleDuration(config.duration);
                addToast(ToastType.Success, `Duração da batalha PK definida para ${duration} minutos.`);
            } else {
                throw new Error("Falha ao salvar configuração.");
            }
        } catch(error) {
            addToast(ToastType.Error, (error as Error).message);
        } finally {
            setIsPKTimerSettingsOpen(false);
        }
    }

    const handlePurchaseEffect = async (gift: Gift) => {
        if (currentUser && currentUser.diamonds && gift.price && currentUser.diamonds >= gift.price) {
            const { success, user } = await api.purchaseEffect(currentUser.id, gift);
            if (success && user) {
                updateUserEverywhere(user);
                addToast(ToastType.Success, `Compra de ${gift.name} realizada com sucesso!`);
            }
        } else {
            addToast(ToastType.Error, 'Diamantes insuficientes para esta compra.');
        }
    }

  const handleOpenListScreen = (listType: 'following' | 'fans' | 'visitors' | 'top_fans' | 'blocklist') => {
    if (!currentUser) return;
    switch(listType) {
        case 'following':
            api.getFollowingUsers(currentUser.id).then(data => { setListScreenUsers(data || []); setIsFollowingScreenOpen(true); });
            break;
        case 'fans':
            api.getFansUsers(currentUser.id).then(data => { setListScreenUsers(data || []); setIsFansScreenOpen(true); });
            break;
        case 'visitors':
            api.getVisitors(currentUser.id).then(data => { setVisitors(data || []); setIsVisitorsScreenOpen(true); });
            break;
        case 'top_fans':
            setIsTopFansScreenOpen(true);
            break;
        case 'blocklist':
            api.getBlockedUsers().then(data => { setListScreenUsers(data || []); setIsBlockListScreenOpen(true); });
            break;
    }
  };
  
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

  const handleOpenVIPCenter = () => setIsVIPCenterOpen(true);

  const handleSubscribeVIP = async () => {
    if (!currentUser) return;
    try {
        const { success, user } = await api.subscribeToVIP(currentUser.id);
        if (success && user) {
            updateUserEverywhere(user);
            addToast(ToastType.Success, t('toasts.vipSuccess'));
            setIsVIPCenterOpen(false);
        } else {
            throw new Error("Falha ao se inscrever no VIP.");
        }
    } catch (error) {
        addToast(ToastType.Error, (error as Error).message);
    }
  };
  
  const handleOpenFanClubMembers = async (streamer: User) => {
    if (!streamer) return;
    try {
        setIsFanClubMembersModalOpen(false); // Close other fan club modals if open
        setViewingFanClubStreamer(streamer);
        const members = await api.getFanClubMembers(streamer.id);
        setFanClubMembers(members || []);
        setIsFanClubMembersModalOpen(true);
    } catch (error) {
        addToast(ToastType.Error, "Falha ao carregar membros do fã-clube.");
    }
  };

  const handleCloseFanClubMembers = () => {
      setIsFanClubMembersModalOpen(false);
      setTimeout(() => {
          setViewingFanClubStreamer(null);
          setFanClubMembers([]);
      }, 300);
  };


  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;
  if (isLoadingCurrentUser || !currentUser) return <div className="h-full w-full bg-black flex items-center justify-center"><LoadingSpinner /></div>;
  
  return (
    <div className="h-full w-full bg-black text-white overflow-hidden relative font-sans">
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
            onStartChatWithStreamer={(user) => setChattingWith(user)}
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
            onOpenFanClubMembers={handleOpenFanClubMembers}
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
            onStartChatWithStreamer={(user) => setChattingWith(user)}
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
            onOpenFanClubMembers={handleOpenFanClubMembers}
          />
        )
      ) : (
        <>
          <div className="h-full w-full">
            {activeScreen === 'main' && <MainScreen onOpenReminderModal={() => setIsReminderModalOpen(true)} onOpenRegionModal={() => setIsRegionModalOpen(true)} onSelectStream={handleSelectStream} onOpenSearch={() => setIsSearchScreenOpen(true)} streamers={streamers} isLoading={isLoadingStreamers} activeTab={activeCategory} onTabChange={handleTabChange} showLocationBanner={showLocationBanner}/>}
            {activeScreen === 'video' && currentUser && (
              <VideoScreen 
                currentUser={currentUser}
                onViewProfile={handleViewProfile}
                onPhotoLiked={() => setLastPhotoLikeUpdate(Date.now())}
                onViewMusic={(music) => {
                  // Implementar lógica para visualizar música
                  console.log('Viewing music:', music);
                }}
                onFollowUser={(user) => {
                  // Implementar lógica para seguir usuário
                  console.log('Following user:', user);
                }}
                lastPhotoLikeUpdate={lastPhotoLikeUpdate}
                onOpenPhotoViewer={(photos, index) => setPhotoViewerData({ photos, initialIndex: index })}
                onUseSound={(music) => {
                  // Implementar lógica para usar o som
                  console.log('Using sound:', music);
                }}
              />
            )}
            {activeScreen === 'profile' && currentUser && 
                <ProfileScreen 
                    currentUser={currentUser}
                    onOpenProfile={() => handleViewProfile(currentUser)} 
                    onEnterMyStream={handleOpenMyStream}
                    onOpenWallet={handleOpenWallet}
                    onOpenFollowing={() => handleOpenListScreen('following')}
                    onOpenFans={() => handleOpenListScreen('fans')}
                    onOpenVisitors={() => handleOpenListScreen('visitors')}
                    onOpenTopFans={() => handleOpenListScreen('top_fans')}
                    onNavigateToMessages={() => handleNavigation('messages')}
                    onOpenMarket={() => setIsMarketScreenOpen(true)}
                    onOpenMyLevel={() => setIsMyLevelScreenOpen(true)}
                    onOpenBlockList={() => handleOpenListScreen('blocklist')}
                    onOpenFAQ={() => setIsFAQScreenOpen(true)}
                    onOpenSettings={() => setIsSettingsScreenOpen(true)}
                    onOpenSupportChat={() => api.getAllUsers().then(users => setChattingWith(users.find(u => u.id === 'support-livercore')))}
                    onOpenAdminWallet={() => {
                      if (currentUser?.id === '10755083' || currentUser?.id === import.meta.env.VITE_ADMIN_USER_ID) {
                        setIsAdminWalletOpen(true);
                      } else {
                        addToast(ToastType.Error, 'Acesso não autorizado.');
                      }
                    }}
                    onOpenWalletTest={() => setIsWalletTestOpen(true)}
                    visitors={visitors}
                    onOpenAvatarProtection={() => setIsAvatarProtectionScreenOpen(true)}
                />
            }
            {activeScreen === 'messages' && <MessagesScreen onStartChat={setChattingWith} onViewProfile={handleViewProfile} conversations={conversations} friends={friends} initialTab={messagesInitialTab} onOpenFriendRequests={() => setIsFriendRequestsScreenOpen(true)} fans={fans} followingUsers={followingUsers} />}
          </div>
          <FooterNav currentUser={currentUser} onOpenGoLive={handleOpenGoLive} activeTab={activeScreen} onNavigate={handleNavigation} />
        </>
      )}

      <ReminderModal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} onSelectStream={handleSelectStream} streamers={reminderStreamers} onOpenLiveHistory={() => setIsLiveHistoryOpen(true)} />
      <RegionModal isOpen={isRegionModalOpen} onClose={() => setIsRegionModalOpen(false)} countries={countries} onSelectRegion={handleSelectRegion} selectedCountryCode={selectedCountry} />
      {isGoLiveOpen && <GoLiveScreen isOpen={isGoLiveOpen} onClose={() => setIsGoLiveOpen(false)} onStartStream={handleStartStream} addToast={addToast} currentUser={currentUser} />}
      <CameraPermissionModal isOpen={permissionStep !== 'idle'} permissionType={permissionStep} onAllowAlways={handlePermissionAllow} onAllowOnce={handlePermissionAllow} onDeny={handlePermissionDeny} onClose={() => setPermissionStep('idle')} />
      <LocationPermissionModal isOpen={isLocationPermissionModalOpen} onAllow={handleAllowLocation} onAllowOnce={handleAllowLocation} onDeny={handleDenyLocation} />
      {isEndStreamConfirmOpen && <EndStreamConfirmationModal onCancel={() => setIsEndStreamConfirmOpen(false)} onConfirm={handleConfirmEndStream} isPK={isPKBattleActive} />}
      {isEndStreamSummaryOpen && streamSummaryData && <EndStreamSummaryScreen data={streamSummaryData} onClose={() => { setIsEndStreamSummaryOpen(false); setStreamSummaryData(null); }} />}
      {chattingWith && <ChatScreen user={chattingWith} onBack={() => setChattingWith(null)} isModal={!!activeStream} currentUser={currentUser} onNavigateToFriends={handleNavigateToFriends} onFollowUser={handleFollowUser} onBlockUser={handleBlockUser} onReportUser={handleReportUser} onOpenPhotoViewer={(photos, index) => setPhotoViewerData({ photos, initialIndex: index })} />}
      {viewingProfile && <UserProfileScreen user={viewingProfile} isCurrentUser={viewingProfile.id === currentUser.id} onBack={() => setViewingProfile(null)} onEdit={handleEditProfile} onOpenTopFans={() => { setViewingProfile(null); handleOpenListScreen('top_fans'); }} onOpenFollowing={() => { setViewingProfile(null); handleOpenListScreen('following'); }} onOpenFans={() => { setViewingProfile(null); handleOpenListScreen('fans'); }} onFollow={handleFollowUser} onStartChat={setChattingWith} onBlockUser={handleBlockUser} onReportUser={handleReportUser} onOpenPhotoViewer={(photos, index) => setPhotoViewerData({ photos, initialIndex: index })} lastPhotoLikeUpdate={lastPhotoLikeUpdate} onPhotoLiked={() => setLastPhotoLikeUpdate(Date.now())} />}
      {isEditingProfile && <EditProfileScreen user={currentUser} onBack={() => setIsEditingProfile(false)} onSave={handleSaveProfile} />}
      {isWalletScreenOpen && <WalletScreen onClose={() => setIsWalletScreenOpen(false)} onPurchase={handlePurchase} initialTab={walletInitialTab} isBroadcaster={true} currentUser={currentUser} updateUser={updateUserEverywhere} addToast={addToast} purchaseHistory={purchaseHistory} />}
      {isConfirmingPurchase && selectedPackage && <ConfirmPurchaseScreen onClose={() => setIsConfirmingPurchase(false)} packageDetails={selectedPackage} onConfirmPurchase={handleConfirmPurchase} addToast={addToast} />}
      {isFollowingScreenOpen && <FollowingScreen onBack={() => setIsFollowingScreenOpen(false)} onViewProfile={handleViewProfile} users={listScreenUsers} onFollowUser={handleFollowUser} />}
      {isFansScreenOpen && <FansScreen onBack={() => setIsFansScreenOpen(false)} onViewProfile={handleViewProfile} users={listScreenUsers} onFollowUser={handleFollowUser} />}
      {isFriendRequestsScreenOpen && <FriendRequestsScreen onBack={() => setIsFriendRequestsScreenOpen(false)} onViewProfile={handleViewProfile} users={followingUsers.filter(followed => !fans.some(fan => fan.id === followed.id))} onFollowUser={handleFollowUser} />}
      {isVisitorsScreenOpen && <VisitorsScreen onBack={() => setIsVisitorsScreenOpen(false)} onViewProfile={handleViewProfile} currentUser={currentUser} addToast={addToast} />}
      {isTopFansScreenOpen && <TopFansScreen onBack={() => setIsTopFansScreenOpen(false)} onViewProfile={handleViewProfile} />}
      {isMyLevelScreenOpen && <MyLevelScreen onClose={() => setIsMyLevelScreenOpen(false)} currentUser={currentUser} />}
      {isBlockListScreenOpen && <BlockListScreen onClose={() => setIsBlockListScreenOpen(false)} onUnblockUser={handleUnblockUser} onViewProfile={handleViewProfile} />}
      {isAvatarProtectionScreenOpen && <AvatarProtectionScreen onClose={() => setIsAvatarProtectionScreenOpen(false)} currentUser={currentUser} updateUser={updateUserEverywhere} addToast={addToast} />}
      {isMarketScreenOpen && <MarketScreen onClose={() => setIsMarketScreenOpen(false)} user={currentUser} onPurchaseFrame={handlePurchaseFrame} updateUser={updateUserEverywhere} onOpenWallet={handleOpenWallet} addToast={addToast} onOpenVIPCenter={handleOpenVIPCenter} onPurchaseEffect={handlePurchaseEffect} gifts={allGifts} />}
      {isFAQScreenOpen && <FAQScreen onClose={() => setIsFAQScreenOpen(false)} />}
      {isSettingsScreenOpen && (
        <SettingsScreen 
          onClose={() => setIsSettingsScreenOpen(false)} 
          currentUser={currentUser} 
          gifts={allGifts} 
          onOpenVIPCenter={handleOpenVIPCenter}
        />
      )}
      <PipSettingsModal isOpen={isPipSettingsModalOpen} onClose={() => setIsPipSettingsModalOpen(false)} currentUser={currentUser} updateUser={updateUserEverywhere} addToast={addToast} />
      <LanguageSelectionModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} currentLanguage={language} onSave={(lang) => { setLanguage(lang); setIsLanguageModalOpen(false); }} />
      {isSearchScreenOpen && <SearchScreen onClose={() => setIsSearchScreenOpen(false)} onViewProfile={handleViewProfile} allUsers={allUsers} onFollowUser={handleFollowUser} />}
      {activeStream && isPrivateInviteModalOpen && <PrivateInviteModal isOpen={isPrivateInviteModalOpen} onClose={() => setIsPrivateInviteModalOpen(false)} streamId={activeStream.id} currentUser={currentUser} addToast={addToast} followingUsers={followingUsers} onFollowUser={handleFollowUser} allGifts={allGifts} />}
      {photoViewerData && <FullScreenPhotoViewer photos={photoViewerData.photos} initialIndex={photoViewerData.initialIndex} onClose={() => setPhotoViewerData(null)} onViewProfile={handleViewProfile} onPhotoLiked={() => setLastPhotoLikeUpdate(Date.now())} />}
      <LiveHistoryScreen isOpen={isLiveHistoryOpen} onClose={() => setIsLiveHistoryOpen(false)} history={streamHistory} />
      {isAdminWalletOpen && currentUser?.id === import.meta.env.VITE_ADMIN_USER_ID && (
        <AdminWalletScreen 
          isOpen={isAdminWalletOpen} 
          onClose={() => setIsAdminWalletOpen(false)} 
          currentUser={currentUser} 
          updateUser={updateUserEverywhere} 
          addToast={addToast} 
        />
      )}

      <div className="absolute top-4 right-4 left-4 sm:left-auto space-y-2 z-[9999] pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast data={toast} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
          </div>
        ))}
      </div>

      {/* Modal de teste de wallet */}
      {isWalletTestOpen && (
        <WalletTest onClose={() => setIsWalletTestOpen(false)} />
      )}
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