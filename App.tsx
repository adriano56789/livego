

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
import { loginWithGoogle, deleteAccount, getUserProfile } from './services/authService';
import * as liveStreamService from './services/liveStreamService';
import * as versionService from './services/versionService';
import * as soundService from './services/soundService';
import type { User, AppView, Category, Stream, PkBattle, Conversation, WithdrawalTransaction, AppEvent, VersionInfo, LiveEndSummary, PurchaseOrder, DiamondPackage, FacingMode, IncomingPrivateLiveInvite, Gift, ChatMessage } from './types';
import { ApiViewerProvider } from './components/ApiContext';
import ProfileScreen from './components/ProfileScreen';
import GiftDisplayAnimation from './components/GiftDisplayAnimation';

type LocationPermission = 'prompt' | 'granted' | 'denied';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('login');
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
  const [locationPermission, setLocationPermission] = useState<LocationPermission>('prompt');
  const [walletSuccessMessage, setWalletSuccessMessage] = useState<string | null>(null);
  const [triggeredGift, setTriggeredGift] = useState<ChatMessage | null>(null);
  const [giftNotificationSettings, setGiftNotificationSettings] = useState<Record<number, boolean> | null>(null);

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
        const settings = await liveStreamService.getNotificationSettings(user.id);
        if (!settings.streamerLive) return;

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

  useEffect(() => {
    if (!user) return;

    const pollPrivateInvites = async () => {
      if (document.visibilityState !== 'visible' || incomingPrivateLiveInvite) return;
      try {
        const { invite } = await liveStreamService.getPendingPrivateLiveInvites(user.id);
        if (invite) {
          setIncomingPrivateLiveInvite(invite);
        }
      } catch (e) {
        console.error("Failed to poll for private live invites:", e);
      }
    };
    
    const intervalId = setInterval(pollPrivateInvites, 6000); // Poll every 6 seconds
    return () => clearInterval(intervalId);
  }, [user, incomingPrivateLiveInvite]);


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
      setCurrentView('profile');
      return;
    }
    setViewingStream(null);
    setViewingOtherProfileId(userId);
  }, [user]);

  const handleExitProfileView = useCallback(() => {
    setViewingOtherProfileId(null);
    setCurrentView('feed');
  }, []);

  const handleFollowToggle = async (userIdToToggle: number, optimisticCallback?: (action: 'follow' | 'unfollow') => void) => {
    if (!user) return;

    const originalUser = { ...user, following: [...(user.following || [])] };
    const isCurrentlyFollowing = originalUser.following.includes(userIdToToggle);
    const action = isCurrentlyFollowing ? 'unfollow' : 'follow';

    // 1. Optimistic UI update for the current user's following list
    const optimisticallyUpdatedUser = {
        ...user,
        following: isCurrentlyFollowing
            ? (user.following || []).filter(id => id !== userIdToToggle)
            : [...(user.following || []), userIdToToggle],
    };
    setUser(optimisticallyUpdatedUser);
    
    // 2. Trigger optimistic callback for other components (e.g., EditProfileScreen's follower count)
    optimisticCallback?.(action);

    try {
        // 3. Make the API call
        const updatedUserFromServer = isCurrentlyFollowing
          ? await liveStreamService.unfollowUser(user.id, userIdToToggle)
          : await liveStreamService.followUser(user.id, userIdToToggle);
        
        // 4. Final state sync with the server's response
        setUser(updatedUserFromServer);
    } catch (error) {
        console.error("Failed to toggle follow state", error);
        alert(`Ocorreu um erro: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
        
        // 5. Revert UI on error
        setUser(originalUser);
        optimisticCallback?.(isCurrentlyFollowing ? 'follow' : 'unfollow'); // Revert the callback action
    }
  };
  
 const handleGoLiveClick = useCallback(async () => {
    if (!user) return;
    try {
        const streamToEnter = await liveStreamService.getActiveStreamForUser(user.id);
        
        if (streamToEnter) {
            // User is already live, navigate to their stream.
            setIsUserLive(true);
            
            const pkBattleDb = await liveStreamService.findActivePkBattleForStream(streamToEnter.id);
            if (pkBattleDb) {
                const pkBattle = await liveStreamService.getPkBattleDetails(Number(pkBattleDb.id));
                handleViewStream(pkBattle);
            } else {
                handleViewStream(streamToEnter);
            }
        } else {
            // User is not live, navigate to the setup screen.
            setIsUserLive(false);
            setCurrentView('go-live-setup');
        }
    } catch (error) {
        console.error("Failed to handle Go Live click:", error);
        alert("Ocorreu um erro ao tentar entrar na sua transmissão.");
    }
}, [user, handleViewStream]);
  
  const handleStartStream = useCallback(async (details: { title: string; meta: string; category: Category, isPrivate: boolean, isPkEnabled: boolean, thumbnailBase64?: string, entryFee?: number, cameraUsed: FacingMode }) => {
    if (!user) return;
    try {
        let thumbnailUrl: string | undefined = undefined;
        if (details.thumbnailBase64) {
            const response = await liveStreamService.uploadLiveThumbnail(details.thumbnailBase64);
            thumbnailUrl = response.thumbnailUrl;
        }
        
        const streamDetails = { ...details, thumbnailUrl };
        delete (streamDetails as any).thumbnailBase64;

        const response = await liveStreamService.startLiveStream(user, streamDetails);
        
        setIsUserLive(true);
        setActiveCategory(details.category); // Set the category of the new stream
        handleViewStream(response.live);
        setCurrentView('feed');
    } catch (error) {
        console.error("Failed to start stream:", error);
        setError(error instanceof Error ? error.message : "Could not start stream");
    }
  }, [user, handleViewStream]);

  const handleStopStream = useCallback(async (streamerId: number, streamId: number) => {
    try {
        const summary = await liveStreamService.getLiveEndSummary(streamId);
        await liveStreamService.stopLiveStream(streamerId);
        setIsUserLive(false);
        setViewingStream(null);
        setViewingEndedStreamSummary(summary);
    } catch (error) {
        console.error("Failed to stop stream:", error);
        setIsUserLive(false);
        setViewingStream(null);
        setCurrentView('feed');
    }
  }, []);

  const handleStreamEnded = useCallback((streamId: number) => {
    if (viewingStream && viewingStream.id === streamId) {
        setViewingStream(null);
        alert("A transmissão que você estava assistindo terminou.");
    }
  }, [viewingStream]);

  const handleUpdateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const handleNavigate = useCallback((view: AppView) => {
    if (currentView === 'diamond-purchase' && view !== 'diamond-purchase') {
      setWalletSuccessMessage(null);
    }
    setViewingOtherProfileId(null); // Reset profile view on main navigation
    setCurrentView(view);
  }, [currentView]);
  
  const handleNavigateFromStream = useCallback((view: AppView, userId: number) => {
    setViewingStream(null);
    setViewingOtherProfileId(null);
    if (['following', 'fans', 'visitors'].includes(view)) {
        setViewingOtherProfileId(userId); // Keep this to pass to the list screens
    }
    setCurrentView(view);
  }, []);
  
  const handleNavigateToChat = useCallback((userId: number) => {
    if (!user) return;
    setViewingStream(null);
    setViewingOtherProfileId(null);
    const findConvo = async () => {
        const { id } = await liveStreamService.getOrCreateConversationWithUser(user.id, userId);
        setViewingConversationId(id);
        setCurrentView('chat');
    };
    findConvo();
  }, [user]);

  const handleViewProtectors = useCallback((userId: number) => {
    setViewingProtectorsFor(userId);
    setCurrentView('protectors');
  }, []);
  
  const handleConfirmPurchase = useCallback((pkg: DiamondPackage) => {
    setPurchaseOverlay({ step: 'confirm', pkg });
  }, []);
  
  const handlePurchaseComplete = useCallback((updatedUser: User, order: PurchaseOrder) => {
      setUser(updatedUser);
      setPurchaseOverlay(null);
      setWalletSuccessMessage(`+${order.package.diamonds.toLocaleString()} diamantes adicionados à sua carteira!`);
  }, []);
  
  const handleWithdrawalComplete = useCallback((transaction: WithdrawalTransaction) => {
    setLastWithdrawal(transaction);
    setCurrentView('withdrawal-confirmation');
    setWalletSuccessMessage(`Saque de ${transaction.earnings_withdrawn.toLocaleString()} ganhos solicitado com sucesso.`);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setCurrentView('login');
  }, []);
  
  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    await deleteAccount(user.id);
    handleLogout();
  }, [user, handleLogout]);

  const handleTriggerGiftNotification = useCallback((gift: Gift) => {
    if (!user || (giftNotificationSettings && giftNotificationSettings[gift.id] === false)) {
        alert(`As notificações para "${gift.name}" estão desativadas. Ative-as na tela de Configurações de Notificação de Presentes para testar.`);
        return;
    }
    soundService.initAudioContext();
    if (gift.soundUrl) {
      new Audio(gift.soundUrl).play();
    } else {
      soundService.playSound('gift');
    }
    const giftMessage: ChatMessage = {
        id: Date.now(),
        type: 'gift',
        userId: user.id,
        username: user.nickname || user.name,
        message: `enviou ${gift.name}!`,
        giftId: gift.id,
        giftName: gift.name,
        giftValue: gift.price,
        giftAnimationUrl: gift.animationUrl,
        giftImageUrl: gift.imageUrl,
        recipientName: 'Você', // Test recipient
        timestamp: new Date().toISOString(),
        globalLevel: user.level,
        avatarUrl: user.avatar_url,
    };
    setTriggeredGift(giftMessage);
}, [user, giftNotificationSettings]);

  const handleUpdateGiftSettings = (newSettings: Record<number, boolean>) => {
      setGiftNotificationSettings(newSettings);
  };

  // Main Render Logic
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
    return <ProfileEditorScreen user={user} onExit={() => setUser({ ...user, has_completed_profile: true })} onSave={handleProfileComplete} />;
  }

  const renderMainView = () => {
    if (viewingStream) {
      return (
        <LiveStreamViewerScreen 
          user={user} 
          stream={viewingStream} 
          onExit={handleExitStream}
          onNavigateToChat={handleNavigateToChat}
          onRequirePurchase={() => setPurchaseOverlay({ step: 'purchase' })}
          onUpdateUser={handleUpdateUser}
          onViewProtectors={handleViewProtectors}
          onViewStream={handleViewStream}
          onStreamEnded={handleStreamEnded}
          onStopStream={handleStopStream}
          onShowPrivateLiveInvite={(invite) => setIncomingPrivateLiveInvite(invite)}
          onViewProfile={handleViewProfile}
          onFollowToggle={handleFollowToggle}
          onNavigateFromStream={handleNavigateFromStream}
          giftNotificationSettings={giftNotificationSettings}
          onTriggerGiftAnimation={setTriggeredGift}
        />
      );
    }
    
    if (viewingOtherProfileId && !['following', 'visitors', 'fans'].includes(currentView)) {
        return <EditProfileScreen user={user} isViewingOtherProfile viewedUserId={viewingOtherProfileId} onExit={handleExitProfileView} onFollowToggle={handleFollowToggle} onNavigateToChat={handleNavigateToChat} onViewStream={handleViewStream} onNavigate={handleNavigate} />;
    }

    if (viewingEndedStreamSummary) {
        return <LiveEndedScreen summary={viewingEndedStreamSummary} onExit={() => setViewingEndedStreamSummary(null)} />;
    }

    let mainContent;
    switch (currentView) {
      case 'feed':
        mainContent = <LiveFeedScreen user={user} onViewStream={handleViewStream} onGoLiveClick={handleGoLiveClick} activeCategory={activeCategory} onSelectCategory={setActiveCategory} onUpdateUser={handleUpdateUser} onNavigateToChat={handleNavigateToChat} onViewProtectors={handleViewProtectors} onNavigate={handleNavigate} locationPermission={locationPermission} setLocationPermission={setLocationPermission} />;
        break;
      case 'profile':
        mainContent = <ProfileScreen user={user} onNavigate={handleNavigate} onGoLiveClick={handleGoLiveClick} />;
        break;
      case 'video':
        mainContent = <VideoScreen />;
        break;
      case 'messages':
        mainContent = <MessagesScreen user={user} onNavigate={handleNavigate} onNavigateToChat={handleNavigateToChat} onViewProfile={handleViewProfile} onUpdateUser={handleUpdateUser} />;
        break;
      case 'chat':
        if (viewingConversationId) {
          mainContent = <ChatScreen conversationId={viewingConversationId} currentUserId={user.id} user={user} onUpdateUser={handleUpdateUser} onExit={() => setCurrentView('messages')} onViewProtectors={handleViewProtectors} onViewStream={handleViewStream} />;
        } else {
          setCurrentView('messages');
        }
        break;
      case 'go-live-setup':
        mainContent = <GoLiveSetupScreen user={user} onStartStream={handleStartStream} onExit={() => setCurrentView('feed')} />;
        break;
      case 'diamond-purchase':
        mainContent = <DiamondPurchaseScreen user={user} onExit={() => { setCurrentView('profile'); setWalletSuccessMessage(null); }} onPurchase={handlePurchaseComplete} onNavigate={handleNavigate} onConfirmPurchase={handleConfirmPurchase} onUpdateUser={handleUpdateUser} onNavigateToSetup={() => setCurrentView('withdrawal-method-setup')} onWithdrawalComplete={handleWithdrawalComplete} successMessage={walletSuccessMessage} clearSuccessMessage={() => setWalletSuccessMessage(null)} />;
        break;
      case 'protectors':
        if(viewingProtectorsFor) {
            mainContent = <ProtectorsScreen streamerId={viewingProtectorsFor} onExit={() => setCurrentView('profile')} />;
        }
        break;
      case 'blocked-list':
        mainContent = <BlockedListScreen currentUserId={user.id} onExit={() => setCurrentView('profile')} />;
        break;
      case 'withdrawal':
        mainContent = <WithdrawalScreen user={user} onUpdateUser={handleUpdateUser} onExit={() => setCurrentView('diamond-purchase')} onNavigateToSetup={() => setCurrentView('withdrawal-method-setup')} onWithdrawalComplete={handleWithdrawalComplete} />;
        break;
      case 'withdrawal-method-setup':
        mainContent = <WithdrawalMethodSetupScreen user={user} onExit={() => setCurrentView('diamond-purchase')} onSetupComplete={(u) => { setUser(u); setCurrentView('diamond-purchase'); }} />;
        break;
      case 'withdrawal-confirmation':
        mainContent = <WithdrawalConfirmationScreen transaction={lastWithdrawal} onExit={() => { setLastWithdrawal(null); setCurrentView('diamond-purchase'); }} />;
        break;
      case 'customer-service':
        mainContent = <CustomerServiceScreen onExit={() => setCurrentView('profile')} onViewArticle={(id) => { setViewingHelpArticleId(id); setCurrentView('help-article'); }} onViewSupportChat={() => setCurrentView('live-support-chat')} />;
        break;
      case 'help-article':
        if (viewingHelpArticleId) {
            mainContent = <HelpArticleScreen articleId={viewingHelpArticleId} onExit={() => { setViewingHelpArticleId(null); setCurrentView('customer-service'); }} />;
        }
        break;
      case 'live-support-chat':
        mainContent = <LiveSupportChatScreen user={user} onExit={() => setCurrentView('customer-service')} />;
        break;
      case 'report-and-suggestion':
        mainContent = <ReportAndSuggestionScreen user={user} onExit={() => setCurrentView('profile')} />;
        break;
      case 'event-center':
        mainContent = <EventCenterScreen onExit={() => setCurrentView('feed')} onViewEvent={(id) => { setViewingEventId(id); setCurrentView('event-detail'); }} />;
        break;
      case 'event-detail':
        if(viewingEventId) {
            mainContent = <EventDetailScreen eventId={viewingEventId} onExit={() => setCurrentView('event-center')} onParticipate={() => { setCurrentView('feed'); }} />;
        }
        break;
      case 'settings':
        mainContent = <SettingsScreen user={user} onExit={() => setCurrentView('profile')} onLogout={handleLogout} onNavigate={handleNavigate} onDeleteAccount={handleDeleteAccount} onTriggerGiftNotification={handleTriggerGiftNotification} />;
        break;
      case 'copyright':
        mainContent = <CopyrightScreen onExit={() => setCurrentView('settings')} />;
        break;
      case 'earnings-info':
        mainContent = <EarningsInfoScreen onExit={() => setCurrentView('settings')} />;
        break;
      case 'connected-accounts':
        mainContent = <ConnectedAccountsScreen user={user} onExit={() => setCurrentView('settings')} onLogout={handleLogout} />;
        break;
      case 'search':
        mainContent = <SearchScreen currentUser={user} onExit={() => setCurrentView('feed')} onViewProfile={handleViewProfile} />;
        break;
      case 'app-version':
        if (versionInfo) {
            mainContent = <AppVersionScreen currentVersion={versionService.CURRENT_APP_VERSION} latestVersion={versionInfo.latestVersion} onExit={() => setCurrentView('settings')} />;
        }
        break;
      case 'my-level':
        mainContent = <MyLevelScreen user={user} onExit={() => setCurrentView('profile')} />;
        break;
      case 'developer-tools':
        mainContent = <DeveloperToolsScreen onExit={() => setCurrentView('settings')} onNavigate={handleNavigate} />;
        break;
      case 'component-viewer':
        mainContent = <ComponentViewerScreen onExit={() => setCurrentView('developer-tools')} />;
        break;
      case 'ranking':
        mainContent = <RankingScreen currentUser={user} onExit={() => setCurrentView('feed')} onViewProfile={handleViewProfile} />;
        break;
      case 'documentation':
        mainContent = <DocumentationScreen onExit={() => setCurrentView('developer-tools')} />;
        break;
      case 'purchase-history':
        mainContent = <PurchaseHistoryScreen user={user} onExit={() => setCurrentView('diamond-purchase')} onUpdateUser={handleUpdateUser} />;
        break;
      case 'notification-settings':
        mainContent = <NotificationSettingsScreen user={user} onExit={() => setCurrentView('settings')} onNavigate={handleNavigate} />;
        break;
       case 'gift-notification-settings':
        mainContent = <GiftNotificationSettingsScreen user={user} onExit={() => setCurrentView('settings')} onUpdateSettings={handleUpdateGiftSettings} />;
        break;
      case 'push-settings':
        mainContent = <PushSettingsScreen user={user} onExit={() => setCurrentView('notification-settings')} />;
        break;
      case 'private-live-invite-settings':
        mainContent = <PrivateLiveInviteSettingsScreen user={user} onExit={() => setCurrentView('settings')} />;
        break;
      case 'privacy-settings':
        mainContent = <PrivacySettingsScreen user={user} onExit={() => setCurrentView('settings')} />;
        break;
      case 'following':
        mainContent = <FollowingScreen currentUser={user} viewedUserId={viewingOtherProfileId || user.id} onExit={() => setCurrentView('profile')} onUpdateUser={handleUpdateUser} onViewProfile={handleViewProfile} onFollowToggle={handleFollowToggle} />;
        break;
      case 'visitors':
        mainContent = <VisitorsScreen currentUser={user} viewedUserId={viewingOtherProfileId || user.id} onExit={() => setCurrentView('profile')} onUpdateUser={handleUpdateUser} onViewProfile={handleViewProfile} onFollowToggle={handleFollowToggle} />;
        break;
      case 'fans':
        mainContent = <FansScreen currentUser={user} viewedUserId={viewingOtherProfileId || user.id} onExit={() => setCurrentView('profile')} onUpdateUser={handleUpdateUser} onViewProfile={handleViewProfile} onFollowToggle={handleFollowToggle} />;
        break;
      case 'profile-editor':
        mainContent = <ProfileEditorScreen user={user} onExit={() => setCurrentView('profile')} onSave={(u) => { setUser(u); setCurrentView('profile'); }} />;
        break;
      case 'avatar-protection':
        mainContent = <AvatarProtectionScreen user={user} onExit={() => setCurrentView('profile')} onSave={(u) => { setUser(u); setCurrentView('profile'); }} />;
        break;
      case 'friend-requests':
        mainContent = <FriendRequestScreen currentUser={user} onExit={() => setCurrentView('messages')} onUpdateUser={handleUpdateUser} onViewProfile={handleViewProfile} />;
        break;
      default:
        mainContent = <LiveFeedScreen user={user} onViewStream={handleViewStream} onGoLiveClick={handleGoLiveClick} activeCategory={activeCategory} onSelectCategory={setActiveCategory} onUpdateUser={handleUpdateUser} onNavigateToChat={handleNavigateToChat} onViewProtectors={handleViewProtectors} onNavigate={handleNavigate} locationPermission={locationPermission} setLocationPermission={setLocationPermission} />;
    }
    
    const showNav = !viewingOtherProfileId && !['go-live-setup', 'chat', 'settings', 'following', 'fans', 'visitors', 'report-and-suggestion', 'customer-service', 'diamond-purchase', 'avatar-protection', 'profile-editor', 'help-article', 'live-support-chat', 'connected-accounts'].includes(currentView);

    return (
      <div className="h-full w-full flex flex-col bg-black">
        <main className="flex-grow overflow-hidden">
          {mainContent}
        </main>
        {showNav && <BottomNav user={user} activeView={currentView} onNavigate={handleNavigate} onGoLiveClick={handleGoLiveClick} />}
      </div>
    );
  }

  return (
    <div className="h-screen w-full max-w-md mx-auto flex flex-col bg-black overflow-hidden shadow-2xl">
      <GiftDisplayAnimation triggeredGift={triggeredGift} />
      {liveNotification && (
        <LiveNotificationModal 
          streamerName={liveNotification.streamerName} 
          streamerAvatarUrl={liveNotification.streamerAvatarUrl} 
          onClose={() => setLiveNotification(null)}
          onWatch={() => {
            handleViewStream(liveNotification.stream);
            setLiveNotification(null);
          }}
        />
      )}
      {purchaseOverlay?.step === 'purchase' && (
          <DiamondPurchaseScreen 
              user={user}
              onExit={() => setPurchaseOverlay(null)}
              onPurchase={handlePurchaseComplete}
              onConfirmPurchase={handleConfirmPurchase}
              isOverlay
              onUpdateUser={handleUpdateUser}
              onNavigateToSetup={() => {
                  setPurchaseOverlay(null);
                  setCurrentView('withdrawal-method-setup');
              }}
              onWithdrawalComplete={(t) => {
                  setPurchaseOverlay(null);
                  handleWithdrawalComplete(t);
              }}
              successMessage={walletSuccessMessage}
              clearSuccessMessage={() => setWalletSuccessMessage(null)}
              onNavigate={handleNavigate}
          />
      )}
      {purchaseOverlay?.step === 'confirm' && purchaseOverlay.pkg && (
          <PurchaseConfirmationScreen 
              user={user}
              selectedPackage={purchaseOverlay.pkg}
              onExit={() => setPurchaseOverlay(null)}
              onConfirm={handlePurchaseComplete}
          />
      )}
      {incomingPrivateLiveInvite && (
        <IncomingPrivateLiveInviteModal
          invite={incomingPrivateLiveInvite}
          onDecline={() => setIncomingPrivateLiveInvite(null)}
          onAccept={() => {
            handleViewStream(incomingPrivateLiveInvite.stream);
            setIncomingPrivateLiveInvite(null);
          }}
        />
      )}

      {renderMainView()}
    </div>
  );
};

const App: React.FC = () => (
  <ApiViewerProvider>
    <AppContent />
  </ApiViewerProvider>
);

export default App;