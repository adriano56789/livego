



import React, { useState, useCallback, useEffect, useRef } from 'react';
import LoginScreen from './components/LoginScreen';
import UploadPhotoScreen from './components/UploadPhotoScreen';
import EditProfileScreen from './components/EditProfileScreen';
import LiveFeedScreen from './components/LiveFeedScreen';
import GoLiveSetupScreen from './components/GoLiveSetupScreen';
import LiveStreamViewerScreen from './components/LiveStreamViewerScreen';
import MessagesScreen from './components/MessagesScreen';
import ChatScreen from './components/ChatScreen';
import DiamondPurchaseScreen from './components/DiamondPurchaseScreen';
import PurchaseConfirmationScreen from './components/PurchaseConfirmationScreen';
import ProtectorsScreen from './components/ProtectorsScreen';
import BlockedListScreen from './components/BlockedListScreen';
import BottomNav from './components/BottomNav';
import VideoScreen from './components/VideoScreen';
import WithdrawalScreen from './components/WithdrawalScreen';
import WithdrawalMethodSetupScreen from './components/WithdrawalMethodSetupScreen';
import WithdrawalConfirmationScreen from './components/WithdrawalConfirmationScreen';
import CustomerServiceScreen from './components/CustomerServiceScreen';
import BackpackScreen from './components/BackpackScreen';
import HelpArticleScreen from './components/HelpArticleScreen';
import LiveSupportChatScreen from './components/LiveSupportChatScreen';
import ReportAndSuggestionScreen from './components/ReportAndSuggestionScreen';
import EventCenterScreen from './components/EventCenterScreen';
import EventDetailScreen from './components/EventDetailScreen';
import SettingsScreen from './components/SettingsScreen';
import CopyrightScreen from './components/CopyrightScreen';
import EarningsInfoScreen from './components/EarningsInfoScreen';
import ConnectedAccountsScreen from './components/ConnectedAccountsScreen';
import SearchScreen from './components/SearchScreen';
import AppVersionScreen from './components/AppVersionScreen';
import UpdateRequiredModal from './components/UpdateRequiredModal';
import LiveEndedScreen from './components/LiveEndedScreen';
import MyLevelScreen from './components/MyLevelScreen';
import DeveloperToolsScreen from './components/DeveloperToolsScreen';
import ComponentViewerScreen from './components/ComponentViewerScreen';
import RankingScreen from './components/PkRankingScreen';
import DocumentationScreen from './components/DocumentationScreen';
import PurchaseHistoryScreen from './components/PurchaseHistoryScreen';
import LiveNotificationModal from './components/LiveNotificationModal';
import NotificationSettingsScreen from './components/NotificationSettingsScreen';
import GiftNotificationSettingsScreen from './components/GiftNotificationSettingsScreen';
import PushSettingsScreen from './components/PushSettingsScreen';
import PrivateLiveInviteSettingsScreen from './components/PrivateLiveInviteSettingsScreen';
import IncomingPrivateLiveInviteModal from './components/IncomingPrivateLiveInviteModal';
import FollowersScreen from './components/FollowersScreen';
import FollowingScreen from './components/FollowingScreen';
import VisitorsScreen from './components/VisitorsScreen';
import FansScreen from './components/FansScreen';
import ProfileEditorScreen from './components/ProfileEditorScreen';
import AvatarProtectionScreen from './components/AvatarProtectionScreen';
import FriendRequestScreen from './components/FriendRequestScreen';
import PrivacySettingsScreen from './components/PrivacySettingsScreen';
import MessagePrivacySettingsScreen from './components/MessagePrivacySettingsScreen';
import TopFansScreen from './components/TopFansScreen';
import { loginWithGoogle, deleteAccount, getUserProfile } from './services/authService';
import * as liveStreamService from './services/liveStreamService';
import * as versionService from './services/versionService';
import * as soundService from './services/soundService';
import type { User, AppView, Category, Stream, PkBattle, Conversation, WithdrawalTransaction, AppEvent, VersionInfo, LiveEndSummary, PurchaseOrder, DiamondPackage, FacingMode, IncomingPrivateLiveInvite, Gift, ChatMessage, PrivacySettings } from './types';
import { ApiViewerProvider, useApiViewer } from './components/ApiContext';
import ProfileScreen from './components/ProfileScreen';
import GiftDisplayAnimation from './components/GiftDisplayAnimation';
import GoogleIcon from './components/icons/GoogleIcon';
import ApiViewer from './components/ApiViewer';

type LocationPermission = 'prompt' | 'granted' | 'denied';


const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('feed');
  const [isUserLive, setIsUserLive] = useState(false);
  const [viewingStream, setViewingStream] = useState<Stream | PkBattle | null>(null);
  const [viewingConversationId, setViewingConversationId] = useState<string | null>(null);
  const [purchaseOverlay, setPurchaseOverlay] = useState<{
    step: 'purchase' | 'confirm';
    pkg?: DiamondPackage;
  } | null>(null);
  const [viewingProtectorsFor, setViewingProtectorsFor] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('Popular');
  const [lastWithdrawal, setLastWithdrawal] = useState<WithdrawalTransaction | null>(null);
  const [viewingHelpArticleId, setViewingHelpArticleId] = useState<string | null>(null);
  const [viewingEventId, setViewingEventId] = useState<string | null>(null);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [viewingEndedStreamSummary, setViewingEndedStreamSummary] = useState<LiveEndSummary | null>(null);
  const [liveNotification, setLiveNotification] = useState<{ streamerName: string; streamerAvatarUrl: string; stream: Stream } | null>(null);
  const previouslyLiveFollowed = useRef<Set<number>>(new Set());
  const [incomingPrivateLiveInvite, setIncomingPrivateLiveInvite] = useState<IncomingPrivateLiveInvite | null>(null);
  const [viewingOtherProfileId, setViewingOtherProfileId] = useState<number | null>(null);
  const [viewingTopFansFor, setViewingTopFansFor] = useState<number | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermission>('prompt');
  const [walletSuccessMessage, setWalletSuccessMessage] = useState<string | null>(null);
  const [triggeredGift, setTriggeredGift] = useState<ChatMessage | null>(null);
  const [giftNotificationSettings, setGiftNotificationSettings] = useState<Record<number, boolean> | null>(null);
  const { apiResponse, hideApiResponse } = useApiViewer();

  useEffect(() => {
    const compareVersions = (v1: string, v2: string): number => {
      const parts1 = v1.split('.').map(Number);
      const parts2 = v2.split('.').map(Number);
      const len = Math.max(parts1.length, parts2.length);
      for (let i = 0; i < len; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
      }
      return 0;
    };
    
    const checkForUpdates = async () => {
      try {
        const info = await versionService.checkVersion();
        setVersionInfo(info);
        if (compareVersions(versionService.CURRENT_APP_VERSION, info.minVersion) < 0) {
          setNeedsUpdate(true);
        }
      } catch (e) {
        console.error("Version check failed:", e);
      }
    };
    checkForUpdates();
  }, []);
  
  useEffect(() => {
    if (!user) {
        setGiftNotificationSettings(null);
        return;
    }

    liveStreamService.getGiftNotificationSettings(user.id)
        .then(settings => setGiftNotificationSettings(settings.enabledGifts))
        .catch(err => {
            console.error("Failed to fetch gift notification settings", err);
            setGiftNotificationSettings({}); // Default to empty (all enabled) on error
        });
        
    const checkStatus = () => {
        if (document.visibilityState === 'visible') {
            liveStreamService.getUserLiveStatus(user.id).then(setIsUserLive);
        }
    };
    checkStatus();
    const intervalId = setInterval(checkStatus, 5000);
    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const checkFollowedStatus = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const statuses = await liveStreamService.getFollowingLiveStatus(user.id);
        const currentlyLive = new Set(statuses.filter(s => s.isLive).map(s => s.userId));
        const justWentLive = statuses.find(s => s.isLive && !previouslyLiveFollowed.current.has(s.userId));
        
        if (justWentLive && justWentLive.stream && !liveNotification) {
          const streamer = await getUserProfile(justWentLive.userId);
          setLiveNotification({
              streamerName: streamer.nickname || streamer.name,
              streamerAvatarUrl: streamer.avatar_url || '',
              stream: justWentLive.stream,
          });
        }
        previouslyLiveFollowed.current = currentlyLive;
      } catch (e) {
        console.error("Failed to poll followed users' status:", e);
      }
    };
    
    liveStreamService.getFollowingLiveStatus(user.id).then(statuses => {
      previouslyLiveFollowed.current = new Set(statuses.filter(s => s.isLive).map(s => s.userId));
    });

    const intervalId = setInterval(checkFollowedStatus, 8000);
    return () => clearInterval(intervalId);
  }, [user, liveNotification]);

  const handleLogin = useCallback(async (accountId?: number) => {
    setIsLoading(true);
    setError(null);
    try {
        const loggedInUser = await loginWithGoogle(accountId);
        setUser(loggedInUser);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido";
        setError(errorMessage);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handlePhotoUploaded = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const handleProfileComplete = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    setCurrentView('feed');
  }, []);
  
  const handleViewStream = useCallback((stream: Stream | PkBattle) => {
    soundService.initAudioContext();
    setViewingStream(stream);
  }, []);

  const handleExitStream = useCallback(() => {
    setViewingStream(null);
  }, []);
  
  const handleViewProfile = useCallback((userId: number) => {
    if (user && userId === user.id) {
        setCurrentView('view-self-profile');
        setViewingOtherProfileId(null);
        return;
    }
    setViewingOtherProfileId(userId);
    setCurrentView('edit');
  }, [user]);

  const handleGoLive = useCallback(() => {
      setCurrentView('go-live-setup');
  }, []);

  const handleStartStream = useCallback((details: any) => {
    if (!user) return;
    liveStreamService.startLiveStream(user, details)
        .then(response => {
            setIsUserLive(true);
            setCurrentView('feed');
            handleViewStream(response.live);
        })
        .catch(err => {
            console.error("Failed to start stream", err);
            setError("Failed to start stream");
            setCurrentView('feed');
        });
  }, [user, handleViewStream]);
  
  const handleStopStream = useCallback((streamerId: number, streamId: number) => {
      liveStreamService.stopLiveStream(streamerId).then(async () => {
          setIsUserLive(false);
          setViewingStream(null);
          const summary = await liveStreamService.getLiveEndSummary(streamId);
          setViewingEndedStreamSummary(summary);
      });
  }, []);
  
  const handleFollowToggle = useCallback(async (userIdToToggle: number, optimisticCallback?: (action: 'follow' | 'unfollow') => void) => {
    if (!user) return;
    const isCurrentlyFollowing = user.following.includes(userIdToToggle);
    if(optimisticCallback) optimisticCallback(isCurrentlyFollowing ? 'unfollow' : 'follow');
    const updatedUser = isCurrentlyFollowing
        ? await liveStreamService.unfollowUser(user.id, userIdToToggle)
        : await liveStreamService.followUser(user.id, userIdToToggle);
    setUser(updatedUser);
  }, [user]);

  const handleTriggerGiftAnimation = useCallback((gift: ChatMessage) => {
    setTriggeredGift(null);
    setTimeout(() => setTriggeredGift(gift), 50);
  }, []);

  const handleNavigate = useCallback((view: AppView, meta?: any) => {
    if (meta?.userId) setViewingOtherProfileId(meta.userId);
    if (meta?.conversationId) setViewingConversationId(meta.conversationId);
    setCurrentView(view);
  }, []);

  const handleNavigateAwayFromStream = useCallback((view: AppView, meta?: any) => {
    handleExitStream();
    handleNavigate(view, meta);
  }, [handleExitStream, handleNavigate]);

  const handleExitChat = useCallback(() => {
    setCurrentView('messages');
  }, []);

  const handleViewProtectors = useCallback((userId: number) => {
    setViewingProtectorsFor(userId);
    setCurrentView('protectors');
  }, []);

  const handleNavigateToChat = useCallback(async (otherUserId: number) => {
    if (!user) return;
    try {
        setViewingOtherProfileId(null); // Clear viewing profile to avoid confusion
        const conversation = await liveStreamService.getOrCreateConversationWithUser(user.id, otherUserId);
        setViewingConversationId(conversation.id);
        setCurrentView('chat');
    } catch (err) {
        setError('Não foi possível carregar a conversa.');
        console.error(err);
    }
  }, [user]);

  // For settings
  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    if (window.confirm('Tem certeza de que deseja excluir permanentemente sua conta? Esta ação não pode ser desfeita.')) {
        try {
            await deleteAccount(user.id);
            alert('Conta excluída com sucesso.');
            handleLogout();
        } catch (err) {
            alert('Falha ao excluir a conta. Por favor, tente novamente.');
            console.error(err);
        }
    }
  }, [user, handleLogout]);

  // For diamond purchase flow
  const handlePurchase = useCallback((updatedUser: User, order: PurchaseOrder) => {
    setUser(updatedUser);
    setWalletSuccessMessage(`+${order.package.diamonds.toLocaleString()} diamantes adicionados à sua carteira!`);
  }, []);

  const handleConfirmPurchase = useCallback((pkg: DiamondPackage) => {
    setPurchaseOverlay({ step: 'confirm', pkg });
  }, []);

  // For withdrawal flow
  const handleWithdrawalSetupComplete = useCallback((updatedUser: User) => {
      setUser(updatedUser);
      setCurrentView('withdrawal');
  }, []);
  
  const handleWithdrawalComplete = useCallback((transaction: WithdrawalTransaction) => {
      setLastWithdrawal(transaction);
      setCurrentView('withdrawal-confirmation');
  }, []);

  // For help/events flow
  const handleViewArticle = useCallback((articleId: string) => {
      setViewingHelpArticleId(articleId);
      setCurrentView('help-article');
  }, []);

  const handleViewEvent = useCallback((eventId: string) => {
      setViewingEventId(eventId);
      setCurrentView('event-detail');
  }, []);
  
  const handleUpdateGiftNotificationSettings = useCallback((newSettings: Record<number, boolean>) => {
    setGiftNotificationSettings(newSettings);
  }, []);
  
  const handleSavePrivacySettings = useCallback(async (newSettings: Partial<Omit<PrivacySettings, 'userId'>>) => {
    if (!user) return;
    try {
        const updatedSettings = await liveStreamService.updatePrivacySettings(user.id, newSettings);
        if(user.settings){
            const updatedUser = { ...user, settings: { ...user.settings, privacy: updatedSettings }};
            setUser(updatedUser);
        }
        setCurrentView('privacy-settings');
    } catch (e) {
        console.error(e);
        alert("Failed to save settings.");
    }
  }, [user]);


  // Login/Onboarding Flow
  if (needsUpdate && versionInfo) {
    return <UpdateRequiredModal updateUrl={versionInfo.updateUrl} />;
  }
  if (!user) {
    return <LoginScreen onGoogleLogin={handleLogin} isLoading={isLoading} error={error} />;
  }
  if (!user.has_uploaded_real_photo) {
    return <UploadPhotoScreen user={user} onPhotoUploaded={handlePhotoUploaded} />;
  }
  if (!user.has_completed_profile) {
    return <ProfileEditorScreen user={user} onSave={handleProfileComplete} onExit={() => {}} />;
  }

  // Overlays and Full-Screen Modals
  if (viewingStream) {
    return <LiveStreamViewerScreen user={user} stream={viewingStream} onExit={handleExitStream} onNavigateToChat={handleNavigateToChat} onRequirePurchase={() => setCurrentView('diamond-purchase')} onUpdateUser={setUser} onViewProtectors={(userId) => { setViewingProtectorsFor(userId); setCurrentView('protectors'); }} onViewStream={handleViewStream} onStreamEnded={(streamId) => { setViewingStream(null); }} onStopStream={handleStopStream} onShowPrivateLiveInvite={setIncomingPrivateLiveInvite} onViewProfile={handleViewProfile} onNavigate={handleNavigateAwayFromStream} onFollowToggle={handleFollowToggle} giftNotificationSettings={giftNotificationSettings} onTriggerGiftAnimation={handleTriggerGiftAnimation} />;
  }
  if (viewingEndedStreamSummary) {
    return <LiveEndedScreen summary={viewingEndedStreamSummary} onExit={() => setViewingEndedStreamSummary(null)} />
  }
  if (purchaseOverlay?.step === 'confirm' && purchaseOverlay.pkg) {
    return <PurchaseConfirmationScreen 
        user={user}
        selectedPackage={purchaseOverlay.pkg}
        onExit={() => setPurchaseOverlay(null)}
        onConfirm={(updatedUser, order) => {
            setUser(updatedUser);
            setPurchaseOverlay(null);
            setWalletSuccessMessage(`+${order.package.diamonds.toLocaleString()} diamantes adicionados à sua carteira!`);
        }}
    />
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'feed': return <LiveFeedScreen user={user} onViewStream={handleViewStream} onGoLiveClick={handleGoLive} activeCategory={activeCategory} onSelectCategory={setActiveCategory} onUpdateUser={setUser} onNavigateToChat={handleNavigateToChat} onViewProtectors={(userId) => {setViewingProtectorsFor(userId); setCurrentView('protectors');}} onNavigate={(v) => setCurrentView(v)} locationPermission={locationPermission} setLocationPermission={setLocationPermission} />;
      case 'profile': return <ProfileScreen user={user} onNavigate={(v) => setCurrentView(v)} onGoLiveClick={handleGoLive} />;
      case 'messages': return <MessagesScreen user={user} onNavigate={handleNavigate} onNavigateToChat={handleNavigateToChat} onViewProfile={handleViewProfile} onUpdateUser={setUser} />;
      case 'chat': return <ChatScreen conversationId={viewingConversationId!} currentUserId={user.id} user={user} onUpdateUser={setUser} onExit={handleExitChat} onViewProtectors={handleViewProtectors} onViewStream={handleViewStream} />;
      case 'go-live-setup': return <GoLiveSetupScreen user={user} onStartStream={handleStartStream} onExit={() => setCurrentView('feed')} />;
      case 'video': return <VideoScreen currentUser={user} onUpdateUser={setUser} onViewProfile={handleViewProfile} onFollowToggle={handleFollowToggle} onNavigateToChat={handleNavigateToChat} />;
      case 'edit':
        if (!viewingOtherProfileId) {
            setCurrentView('feed');
            return null;
        }
        return <EditProfileScreen user={user} viewedUserId={viewingOtherProfileId} isViewingOtherProfile={true} onExit={() => { setViewingOtherProfileId(null); setCurrentView('feed'); }} onFollowToggle={handleFollowToggle} onNavigateToChat={handleNavigateToChat} onViewStream={(stream) => { setViewingOtherProfileId(null); handleViewStream(stream); }} onUpdateUser={setUser} onViewProfile={handleViewProfile} onNavigate={setCurrentView} />;
      case 'view-self-profile':
        return <EditProfileScreen user={user} viewedUserId={user.id} isViewingOtherProfile={true} onExit={() => setCurrentView('profile')} onFollowToggle={handleFollowToggle} onNavigateToChat={handleNavigateToChat} onViewStream={handleViewStream} onUpdateUser={setUser} onViewProfile={handleViewProfile} onNavigate={setCurrentView} />;
      // FIX: Added missing onPurchase prop to fix TypeScript error.
      case 'diamond-purchase': return <DiamondPurchaseScreen user={user} onExit={() => setCurrentView('profile')} onConfirmPurchase={handleConfirmPurchase} onNavigate={setCurrentView} onUpdateUser={setUser} onNavigateToSetup={() => setCurrentView('withdrawal-method-setup')} onWithdrawalComplete={handleWithdrawalComplete} successMessage={walletSuccessMessage} clearSuccessMessage={() => setWalletSuccessMessage(null)} onPurchase={handlePurchase} />;
      case 'protectors': return <ProtectorsScreen streamerId={viewingProtectorsFor!} onExit={() => { setViewingProtectorsFor(null); setCurrentView('feed'); }} />;
      case 'blocked-list': return <BlockedListScreen currentUserId={user.id} onExit={() => setCurrentView('profile')} />;
      case 'withdrawal': return <WithdrawalScreen user={user} onUpdateUser={setUser} onExit={() => setCurrentView('profile')} onNavigateToSetup={() => setCurrentView('withdrawal-method-setup')} onWithdrawalComplete={handleWithdrawalComplete} />;
      case 'withdrawal-method-setup': return <WithdrawalMethodSetupScreen user={user} onExit={() => setCurrentView('withdrawal')} onSetupComplete={handleWithdrawalSetupComplete} />;
      case 'withdrawal-confirmation': return <WithdrawalConfirmationScreen transaction={lastWithdrawal} onExit={() => { setLastWithdrawal(null); setCurrentView('withdrawal'); }} />;
      case 'customer-service': return <CustomerServiceScreen onExit={() => setCurrentView('profile')} onViewArticle={handleViewArticle} onViewSupportChat={() => setCurrentView('live-support-chat')} onNavigate={setCurrentView} />;
      case 'backpack': return <BackpackScreen user={user} onExit={() => setCurrentView('profile')} onUpdateUser={setUser} onNavigate={setCurrentView} />;
      case 'help-article': return <HelpArticleScreen articleId={viewingHelpArticleId!} onExit={() => { setViewingHelpArticleId(null); setCurrentView('customer-service'); }} />;
      case 'live-support-chat': return <LiveSupportChatScreen user={user} onExit={() => setCurrentView('customer-service')} />;
      case 'report-and-suggestion': return <ReportAndSuggestionScreen user={user} onExit={() => setCurrentView('profile')} />;
      case 'event-center': return <EventCenterScreen onExit={() => setCurrentView('feed')} onViewEvent={handleViewEvent} />;
      case 'event-detail': return <EventDetailScreen eventId={viewingEventId!} onExit={() => setCurrentView('event-center')} onParticipate={(event) => { console.log('Participating in event:', event); alert(`Participando em ${event.title}`);}} />;
      case 'settings': return <SettingsScreen user={user} onExit={() => setCurrentView('profile')} onLogout={handleLogout} onNavigate={setCurrentView} onDeleteAccount={handleDeleteAccount} onTriggerGiftNotification={(gift) => {
          const mockGiftMessage: ChatMessage = { id: Date.now(), type: 'gift', userId: user.id, username: user.nickname || user.name, message: `enviou ${gift.name}!`, giftId: gift.id, giftName: gift.name, giftValue: gift.price, giftAnimationUrl: gift.animationUrl, giftImageUrl: gift.imageUrl, recipientName: 'Você', quantity: 1, timestamp: new Date().toISOString() };
          handleTriggerGiftAnimation(mockGiftMessage);
      }} />;
      case 'copyright': return <CopyrightScreen onExit={() => setCurrentView('settings')} />;
      case 'earnings-info': return <EarningsInfoScreen onExit={() => setCurrentView('settings')} />;
      case 'connected-accounts': return <ConnectedAccountsScreen user={user} onExit={() => setCurrentView('settings')} onLogout={handleLogout} />;
      case 'search': return <SearchScreen currentUser={user} onExit={() => setCurrentView('feed')} onViewProfile={handleViewProfile} />;
      case 'app-version': return <AppVersionScreen currentVersion={versionService.CURRENT_APP_VERSION} latestVersion={versionInfo?.latestVersion || '...'} onExit={() => setCurrentView('settings')} />;
      case 'my-level': return <MyLevelScreen user={user} onExit={() => setCurrentView('profile')} />;
      case 'developer-tools': return <DeveloperToolsScreen onExit={() => setCurrentView('settings')} onNavigate={setCurrentView} />;
      case 'ranking': return <RankingScreen currentUser={user} onExit={() => setCurrentView('feed')} onViewProfile={handleViewProfile} />;
      case 'documentation': return <DocumentationScreen onExit={() => setCurrentView('developer-tools')} />;
      case 'purchase-history': return <PurchaseHistoryScreen user={user} onExit={() => setCurrentView('diamond-purchase')} onUpdateUser={setUser} />;
      case 'notification-settings': return <NotificationSettingsScreen user={user} onExit={() => setCurrentView('settings')} onNavigate={setCurrentView} />;
      case 'push-settings': return <PushSettingsScreen user={user} onExit={() => setCurrentView('notification-settings')} />;
      case 'private-live-invite-settings': return <PrivateLiveInviteSettingsScreen user={user} onExit={() => setCurrentView('settings')} />;
      case 'following': return <FollowingScreen currentUser={user} viewedUserId={viewingOtherProfileId || user.id} onExit={() => { setViewingOtherProfileId(null); setCurrentView('profile'); }} onUpdateUser={setUser} onViewProfile={handleViewProfile} onFollowToggle={handleFollowToggle} />;
      case 'visitors': return <VisitorsScreen currentUser={user} viewedUserId={viewingOtherProfileId || user.id} onExit={() => { setViewingOtherProfileId(null); setCurrentView('profile'); }} onUpdateUser={setUser} onViewProfile={handleViewProfile} onFollowToggle={handleFollowToggle} onNavigateToChat={handleNavigateToChat} />;
      case 'fans': return <FansScreen currentUser={user} viewedUserId={viewingOtherProfileId || user.id} onExit={() => { setViewingOtherProfileId(null); setCurrentView('profile'); }} onUpdateUser={setUser} onViewProfile={handleViewProfile} onFollowToggle={handleFollowToggle} />;
      case 'avatar-protection': return <AvatarProtectionScreen user={user} onExit={() => setCurrentView('profile')} onSave={setUser} />;
      case 'friend-requests': return <FriendRequestScreen currentUser={user} onExit={() => setCurrentView('messages')} onUpdateUser={setUser} onViewProfile={handleViewProfile} />;
      case 'privacy-settings': return <PrivacySettingsScreen user={user} onExit={() => setCurrentView('settings')} onNavigate={setCurrentView} />;
      case 'component-viewer': return <ComponentViewerScreen onExit={() => setCurrentView('developer-tools')} />;
      case 'gift-notification-settings': return <GiftNotificationSettingsScreen user={user} onExit={() => setCurrentView('settings')} onUpdateSettings={handleUpdateGiftNotificationSettings} />;
      case 'help-center': return <CustomerServiceScreen mode="help_only" onExit={() => setCurrentView('profile')} onViewArticle={handleViewArticle} onNavigate={setCurrentView} />;
      case 'useful-articles-list': return <CustomerServiceScreen mode="articles_only" onExit={() => setCurrentView('help-center')} onViewArticle={handleViewArticle} onNavigate={setCurrentView} />;
      case 'top-fans': return <TopFansScreen viewedUserId={viewingOtherProfileId || user.id} onExit={() => { setViewingOtherProfileId(null); setCurrentView('profile'); }} />;
      case 'profile-editor': return <ProfileEditorScreen user={user} onSave={(updatedUser) => { setUser(updatedUser); setCurrentView('profile'); }} onExit={() => setCurrentView('profile')} />;
      case 'message-privacy-settings': return <MessagePrivacySettingsScreen user={user} onExit={() => setCurrentView('privacy-settings')} onSave={handleSavePrivacySettings} />;
      default: return <div>Not implemented: {currentView}</div>;
    }
  }

  return (
    <div className="h-full w-full bg-black flex flex-col font-sans">
      <main className="flex-grow overflow-hidden relative">
        {renderCurrentView()}
      </main>
      
      {['feed', 'video', 'messages', 'profile'].includes(currentView) && (
        <BottomNav user={user} activeView={currentView} onNavigate={setCurrentView} onGoLiveClick={handleGoLive} />
      )}

      {/* Global Modals & Animations */}
      {triggeredGift && <GiftDisplayAnimation triggeredGift={triggeredGift} />}
      {liveNotification && <LiveNotificationModal {...liveNotification} onWatch={() => { setLiveNotification(null); handleViewStream(liveNotification.stream); }} onClose={() => setLiveNotification(null)} />}
      {incomingPrivateLiveInvite && <IncomingPrivateLiveInviteModal invite={incomingPrivateLiveInvite} onAccept={() => { setIncomingPrivateLiveInvite(null); handleViewStream(incomingPrivateLiveInvite.stream); }} onDecline={() => setIncomingPrivateLiveInvite(null)} />}
      {apiResponse && <ApiViewer title={apiResponse.title} data={apiResponse.data} onClose={hideApiResponse} />}
    </div>
  );
};

const App: React.FC = () => (
  <ApiViewerProvider>
    <AppContent />
  </ApiViewerProvider>
);

export default App;