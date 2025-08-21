

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
import RankingScreen from './components/PkRankingScreen';
import DocumentationScreen from './components/DocumentationScreen';
import PurchaseHistoryScreen from './components/PurchaseHistoryScreen';
import LiveNotificationModal from './components/LiveNotificationModal';
import NotificationSettingsScreen from './components/NotificationSettingsScreen';
import PushSettingsScreen from './components/PushSettingsScreen';
import PrivateLiveInviteSettingsScreen from './components/PrivateLiveInviteSettingsScreen';
import InviteToPrivateLiveModal from './components/InviteToPrivateLiveModal';
import IncomingPrivateLiveInviteModal from './components/IncomingPrivateLiveInviteModal';
import FollowersScreen from './components/FollowersScreen';
import FollowingScreen from './components/FollowingScreen';
import VisitorsScreen from './components/VisitorsScreen';
import FansScreen from './components/FansScreen';
import ProfileEditorScreen from './components/ProfileEditorScreen';
import AvatarProtectionScreen from './components/AvatarProtectionScreen';
import { loginWithGoogle, deleteAccount, getUserProfile } from './services/authService';
import * as liveStreamService from './services/liveStreamService';
import * as versionService from './services/versionService';
import * as soundService from './services/soundService';
import type { User, AppView, Category, Stream, PkBattle, StartLiveResponse, Conversation, WithdrawalTransaction, AppEvent, VersionInfo, LiveEndSummary, PurchaseOrder, DiamondPackage, FacingMode, IncomingPrivateLiveInvite } from './types';
import { ApiViewerProvider, useApiViewer } from './components/ApiContext';
import ProfileScreen from './components/ProfileScreen';

// AppContent component to access the context from the provider
const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { apiResponse, showApiResponse, hideApiResponse } = useApiViewer();
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [isUserLive, setIsUserLive] = useState(false);
  const [viewingStream, setViewingStream] = useState<Stream | PkBattle | null>(null);
  const [viewingConversationId, setViewingConversationId] = useState<string | null>(null);
  const [isPurchaseOverlayVisible, setIsPurchaseOverlayVisible] = useState(false);
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
  const [confirmingPackage, setConfirmingPackage] = useState<DiamondPackage | null>(null);
  const [purchaseOverlay, setPurchaseOverlay] = useState<{
    step: 'purchase' | 'confirm';
    pkg?: DiamondPackage;
  } | null>(null);
  const [incomingPrivateLiveInvite, setIncomingPrivateLiveInvite] = useState<IncomingPrivateLiveInvite | null>(null);
  const [viewingOtherProfileId, setViewingOtherProfileId] = useState<number | null>(null);

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
    if (!user) return;
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
      if (document.visibilityState !== 'visible') {
        return;
      }
      try {
        const settings = await liveStreamService.getNotificationSettings(user.id);
        if (!settings.streamerLive) {
            return; // User has disabled this notification
        }

        const statuses = await liveStreamService.getFollowingLiveStatus(user.id);
        const currentlyLive = new Set(statuses.filter(s => s.isLive).map(s => s.userId));

        const justWentLive = statuses.find(
          status => status.isLive && !previouslyLiveFollowed.current.has(status.userId)
        );
        
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
    
    // Set initial state without notifying
    liveStreamService.getFollowingLiveStatus(user.id).then(statuses => {
      previouslyLiveFollowed.current = new Set(statuses.filter(s => s.isLive).map(s => s.userId));
    });

    const intervalId = setInterval(checkFollowedStatus, 8000);

    return () => clearInterval(intervalId);
  }, [user, liveNotification]);

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
    setViewingStream(null); // Close any open stream
    setViewingOtherProfileId(userId);
  }, [user]);

  const handleExitProfileView = useCallback(() => {
    setViewingOtherProfileId(null);
    setCurrentView('feed');
  }, []);
  
  const handleGoLiveClick = useCallback(async () => {
    if (!user) return;
    if (isUserLive) {
        await liveStreamService.stopLiveStream(user.id);
        setIsUserLive(false);
        setViewingStream(null); // Ensure we exit any viewed stream
    } else {
        setCurrentView('go-live-setup');
    }
  }, [isUserLive, user]);
  
  const handleStartStream = useCallback(async (details: { title: string; meta: string; category: Category, isPrivate: boolean, isPkEnabled: boolean, thumbnailBase64?: string, entryFee?: number, cameraUsed: FacingMode }) => {
    if (!user) return;
    
    let thumbnailUrl;
    if (details.thumbnailBase64) {
      const response = await liveStreamService.uploadLiveThumbnail(details.thumbnailBase64);
      thumbnailUrl = response.thumbnailUrl;
    }

    const startLiveResponse = await liveStreamService.startLiveStream(user, { 
        title: details.title,
        meta: details.meta,
        category: details.category,
        isPrivate: details.isPrivate,
        isPkEnabled: details.isPkEnabled,
        thumbnailUrl, 
        entryFee: details.entryFee,
        cameraUsed: details.cameraUsed,
    });
    showApiResponse('POST /api/lives/create', startLiveResponse);
    setIsUserLive(true);
    
    // Refresh user data to get latest last_camera_used
    const updatedUser = await getUserProfile(user.id);
    setUser(updatedUser);
    
    // Redirect user to their own stream
    handleViewStream(startLiveResponse.live);

    // Set the feed category for when they return from the stream
    if (details.isPrivate) {
        setActiveCategory('Privada');
    } else {
        setActiveCategory('Novo');
    }
    // Set the underlying view to 'feed'
    setCurrentView('feed');

    // Show a preview of the live notification to the streamer themselves.
    setLiveNotification({
        streamerName: user.nickname || user.name,
        streamerAvatarUrl: user.avatar_url || '',
        stream: startLiveResponse.live,
    });
  }, [user, showApiResponse, setActiveCategory, handleViewStream]);


  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await loginWithGoogle();
      setUser(loggedInUser);
      showApiResponse('POST /api/auth/google', loggedInUser);
      // Onboarding logic restored
      if (!loggedInUser.has_uploaded_real_photo) {
        setCurrentView('upload');
      } else if (!loggedInUser.has_completed_profile) {
        setCurrentView('edit');
      } else {
        setCurrentView('feed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha no login. Tente novamente.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [showApiResponse]);

  const handlePhotoUploaded = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    setCurrentView('edit'); // Go to edit profile after photo upload
  }, []);

  const handleProfileComplete = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    setCurrentView('profile');
  }, []);

  const handleAvatarProtectionSave = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    setCurrentView('edit'); // Go back to the detailed profile view
  }, []);
  
  const handleNavigate = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);
  
  const handleNavigateFromStream = useCallback((view: AppView, userId: number) => {
    setViewingStream(null);
    setViewingOtherProfileId(userId);
    setCurrentView(view);
  }, []);
  
  const handleNavigateToPurchaseConfirmation = useCallback((pkg: DiamondPackage) => {
      setConfirmingPackage(pkg);
      setCurrentView('purchase-confirmation');
  }, []);

  const handlePurchaseComplete = useCallback((updatedUser: User, order: PurchaseOrder) => {
    setUser(updatedUser);
    setIsPurchaseOverlayVisible(false);
    
    // If the order was by card (instant), or if it's a transfer, go to history
    setCurrentView('purchase-history');

  }, []);
  
  const handleNavigateToChat = useCallback(async (otherUserId: number) => {
      if(!user) return;
      const conversation = await liveStreamService.getOrCreateConversationWithUser(user.id, otherUserId);
      setViewingConversationId(conversation.id);
  }, [user]);

  const handleViewProtectors = useCallback((userId: number) => {
    setViewingProtectorsFor(userId);
  }, []);

  const handleWithdrawalMethodSetupComplete = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    setCurrentView('diamond-purchase'); // Go back to wallet screen
  }, []);
  
  const handleWithdrawalComplete = useCallback((transaction: WithdrawalTransaction) => {
    setLastWithdrawal(transaction);
    setCurrentView('withdrawal-confirmation');
  }, []);

  const handleViewHelpArticle = useCallback((articleId: string) => {
    setViewingHelpArticleId(articleId);
    setCurrentView('help-article');
  }, []);

  const handleViewEvent = useCallback((eventId: string) => {
    setViewingEventId(eventId);
    setCurrentView('event-detail');
  }, []);

  const handleParticipateInEvent = useCallback((event: AppEvent) => {
    showApiResponse(`POST /api/events/${event.id}/participate`, { success: true });
    if (event.linkedCategory) {
        setActiveCategory(event.linkedCategory);
        setCurrentView('feed');
        setViewingEventId(null);
    } else {
        setViewingEventId(null);
        setCurrentView('event-center');
    }
  }, [showApiResponse]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setCurrentView('login');
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    await deleteAccount(user.id);
    showApiResponse(`DELETE /api/users/${user.id}`, { success: true });
    handleLogout();
  }, [user, showApiResponse, handleLogout]);

  const handleStreamEnded = useCallback(async (streamId: number) => {
    if (currentView === 'live-ended') return;
    try {
        const summary = await liveStreamService.getLiveEndSummary(streamId);
        setViewingEndedStreamSummary(summary);
        setViewingStream(null);
        setCurrentView('live-ended');
    } catch (error) {
        console.error("Could not get live end summary:", error);
        setViewingStream(null);
        setCurrentView('feed');
    }
  }, [currentView]);

  const handleFollowToggle = useCallback(async (userIdToToggle: number) => {
      if (!user) return;
      try {
        const isCurrentlyFollowing = user.following.includes(userIdToToggle);
        const updatedUser = isCurrentlyFollowing
          ? await liveStreamService.unfollowUser(user.id, userIdToToggle)
          : await liveStreamService.followUser(user.id, userIdToToggle);
        setUser(updatedUser);
      } catch (error) {
          console.error("Follow/unfollow action failed:", error);
          alert("Ocorreu um erro ao seguir/deixar de seguir. Tente novamente.");
      }
  }, [user]);

  const handleStopStream = useCallback(async (streamerId: number, streamId: number) => {
    await liveStreamService.stopLiveStream(streamerId);
    if (user && user.id === streamerId) {
        setIsUserLive(false);
    }
    // `handleStreamEnded` already sets viewingStream to null and currentView to live-ended
    handleStreamEnded(streamId);
  }, [user, handleStreamEnded]);
  
  const handleShowPrivateLiveInvite = useCallback((invite: IncomingPrivateLiveInvite) => {
      setIncomingPrivateLiveInvite(invite);
  }, []);
  
  const renderContent = () => {
    if (needsUpdate && versionInfo) {
      return <UpdateRequiredModal updateUrl={versionInfo.updateUrl} />;
    }

    if (!user) {
      return <LoginScreen onGoogleLogin={handleLogin} isLoading={isLoading} error={error} />;
    }
    
    if (viewingStream) {
        return <LiveStreamViewerScreen
            user={user}
            stream={viewingStream}
            onExit={handleExitStream}
            onRequirePurchase={() => {
                setPurchaseOverlay({ step: 'purchase' });
            }}
            onUpdateUser={setUser}
            onViewProtectors={handleViewProtectors}
            onViewStream={handleViewStream}
            onStreamEnded={handleStreamEnded}
            onStopStream={handleStopStream}
            onNavigateToChat={handleNavigateToChat}
            onShowPrivateLiveInvite={handleShowPrivateLiveInvite}
            onViewProfile={handleViewProfile}
            onNavigateFromStream={handleNavigateFromStream}
        />
    }

    // Standalone Screens that take over the whole view
    if (viewingProtectorsFor) {
        return <ProtectorsScreen streamerId={viewingProtectorsFor} onExit={() => setViewingProtectorsFor(null)} />;
    }
    
    const targetUserIdForListView = viewingOtherProfileId || user.id;

    const handleExitListView = () => {
        if (viewingOtherProfileId) {
            // This is the key fix: We were viewing another user's list,
            // so we set the view back to a state that will render their profile.
            // The profile renders when `viewingOtherProfileId` is set and `currentView` is NOT a list view.
            // We set it back to `feed` as that's the default view when a profile is opened.
            setCurrentView('feed');
        } else {
            // We were viewing our own list, go back to our own profile screen.
            setCurrentView('profile');
        }
    };
    
    // Logic for list views (Followers, Following, etc.)
    // This block is moved BEFORE the viewingOtherProfileId check to ensure it's reachable.
    if (currentView === 'followers') {
        return <FollowersScreen
            currentUser={user}
            viewedUserId={targetUserIdForListView}
            onExit={handleExitListView}
            onUpdateUser={setUser}
            onViewProfile={handleViewProfile}
        />;
    }
    if (currentView === 'following') {
        return <FollowingScreen
            currentUser={user}
            viewedUserId={targetUserIdForListView}
            onExit={handleExitListView}
            onUpdateUser={setUser}
            onViewProfile={handleViewProfile}
        />;
    }
    if (currentView === 'fans') {
        return <FansScreen
            currentUser={user}
            viewedUserId={targetUserIdForListView}
            onExit={handleExitListView}
            onUpdateUser={setUser}
            onViewProfile={handleViewProfile}
        />;
    }
    if (currentView === 'visitors') {
        return <VisitorsScreen
            currentUser={user}
            viewedUserId={targetUserIdForListView}
            onExit={handleExitListView}
            onUpdateUser={setUser}
            onViewProfile={handleViewProfile}
        />;
    }
    
    // **PRIORITY CHANGE**: Check for an active chat session *before* checking if we are viewing another profile.
    // This ensures that when a chat is opened from a profile, the chat screen is shown.
    // When the chat is closed (`viewingConversationId` becomes null), the logic will fall through
    // to the `viewingOtherProfileId` check below, correctly returning the user to the profile.
    if (viewingConversationId) {
        return <ChatScreen
            conversationId={viewingConversationId}
            currentUserId={user.id}
            user={user}
            onUpdateUser={setUser}
            onExit={() => setViewingConversationId(null)}
            onViewProtectors={handleViewProtectors}
            onViewStream={(stream) => {
                setViewingConversationId(null); // Close chat
                handleViewStream(stream); // Open stream
            }}
        />;
    }
    
    if (viewingOtherProfileId) {
        return <EditProfileScreen
            isViewingOtherProfile={true}
            viewedUserId={viewingOtherProfileId}
            user={user}
            onExit={handleExitProfileView}
            onFollowToggle={handleFollowToggle}
            onNavigateToChat={handleNavigateToChat}
            onNavigate={handleNavigate}
        />
    }

    // Onboarding and other full-screen views
    if (currentView === 'upload') {
        return <UploadPhotoScreen user={user} onPhotoUploaded={handlePhotoUploaded} />;
    }
    if (currentView === 'edit') {
      return <EditProfileScreen user={user} onNavigate={handleNavigate} onExit={() => setCurrentView('profile')} />;
    }
    if (currentView === 'profile-editor') {
        return <ProfileEditorScreen 
            user={user} 
            onExit={() => setCurrentView('edit')} 
            onSave={handleProfileComplete} 
        />;
    }
     if (currentView === 'go-live-setup') {
      return <GoLiveSetupScreen user={user} onStartStream={handleStartStream} onExit={() => setCurrentView('feed')} />;
    }
    if (currentView === 'diamond-purchase') {
        return <DiamondPurchaseScreen 
            user={user} 
            onExit={() => setCurrentView('profile')} 
            onPurchase={handlePurchaseComplete} 
            onNavigate={handleNavigate} 
            onConfirmPurchase={handleNavigateToPurchaseConfirmation}
            onUpdateUser={setUser}
            onNavigateToSetup={() => setCurrentView('withdrawal-method-setup')}
            onWithdrawalComplete={handleWithdrawalComplete}
         />
    }
    if (currentView === 'purchase-confirmation' && confirmingPackage) {
        return <PurchaseConfirmationScreen 
            user={user}
            selectedPackage={confirmingPackage}
            onExit={() => {
                setConfirmingPackage(null);
                setCurrentView('diamond-purchase');
            }}
            onConfirm={(updatedUser, order) => {
                setConfirmingPackage(null);
                handlePurchaseComplete(updatedUser, order);
            }}
        />
    }
    if (currentView === 'purchase-history') {
        return <PurchaseHistoryScreen user={user} onExit={() => setCurrentView('diamond-purchase')} onUpdateUser={setUser} />;
    }
     if (currentView === 'withdrawal-confirmation') {
        return <WithdrawalConfirmationScreen
            transaction={lastWithdrawal}
            onExit={() => setCurrentView('diamond-purchase')}
        />
    }
    if (currentView === 'withdrawal-method-setup') {
        return <WithdrawalMethodSetupScreen
            user={user}
            onExit={() => setCurrentView('diamond-purchase')}
            onSetupComplete={handleWithdrawalMethodSetupComplete}
        />
    }
    if (currentView === 'blocked-list') {
        return <BlockedListScreen currentUserId={user.id} onExit={() => setCurrentView('profile')} />;
    }
    if (currentView === 'help-article' && viewingHelpArticleId) {
        return <HelpArticleScreen 
            articleId={viewingHelpArticleId} 
            onExit={() => {
                setViewingHelpArticleId(null);
                setCurrentView('customer-service');
            }} 
        />;
    }
    if (currentView === 'live-support-chat') {
        return <LiveSupportChatScreen 
            user={user} 
            onExit={() => setCurrentView('customer-service')} 
        />;
    }
    if (currentView === 'customer-service') {
        return <CustomerServiceScreen 
            onExit={() => setCurrentView('profile')}
            onViewArticle={handleViewHelpArticle}
            onViewSupportChat={() => setCurrentView('live-support-chat')}
        />;
    }
    if (currentView === 'backpack') {
        return <BackpackScreen 
            user={user} 
            onExit={() => setCurrentView('profile')} 
            onUpdateUser={setUser}
            onNavigate={handleNavigate}
        />;
    }
    if (currentView === 'report-and-suggestion') {
        return <ReportAndSuggestionScreen user={user} onExit={() => setCurrentView('profile')} />;
    }
    if (currentView === 'event-center') {
        return <EventCenterScreen onExit={() => setCurrentView('profile')} onViewEvent={handleViewEvent} />;
    }
    if (currentView === 'event-detail' && viewingEventId) {
        return <EventDetailScreen 
            eventId={viewingEventId} 
            onExit={() => {
                setViewingEventId(null);
                setCurrentView('event-center');
            }} 
            onParticipate={handleParticipateInEvent}
        />;
    }
    if (currentView === 'ranking') {
        return <RankingScreen
            currentUser={user}
            onExit={() => setCurrentView('feed')}
            onViewProfile={handleViewProfile}
        />;
    }
    if (currentView === 'settings') {
        return <SettingsScreen 
            user={user}
            onExit={() => setCurrentView('profile')} 
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onDeleteAccount={handleDeleteAccount}
        />;
    }
    if (currentView === 'notification-settings') {
        return <NotificationSettingsScreen
            user={user}
            onExit={() => setCurrentView('settings')}
            onNavigate={handleNavigate}
        />;
    }
    if (currentView === 'push-settings') {
        return <PushSettingsScreen
            user={user}
            onExit={() => setCurrentView('notification-settings')}
        />;
    }
    if (currentView === 'private-live-invite-settings') {
        return <PrivateLiveInviteSettingsScreen
            user={user}
            onExit={() => setCurrentView('settings')}
        />;
    }
    if (currentView === 'copyright') {
        return <CopyrightScreen onExit={() => setCurrentView('settings')} />;
    }
    if (currentView === 'earnings-info') {
        return <EarningsInfoScreen onExit={() => setCurrentView('settings')} />;
    }
    if (currentView === 'connected-accounts') {
        return <ConnectedAccountsScreen 
            user={user}
            onExit={() => setCurrentView('settings')} 
            onLogout={handleLogout}
        />;
    }
    if (currentView === 'search') {
        return <SearchScreen
            currentUser={user}
            onExit={() => setCurrentView('feed')}
            onViewProfile={handleViewProfile}
        />;
    }
    if (currentView === 'app-version') {
        return <AppVersionScreen
            currentVersion={versionService.CURRENT_APP_VERSION}
            latestVersion={versionInfo?.latestVersion || '...'}
            onExit={() => setCurrentView('settings')}
        />;
    }
    if (currentView === 'live-ended' && viewingEndedStreamSummary) {
      return <LiveEndedScreen
        summary={viewingEndedStreamSummary}
        onExit={() => {
            setViewingEndedStreamSummary(null);
            setCurrentView('feed');
        }}
      />;
    }
    if (currentView === 'my-level') {
        return <MyLevelScreen user={user} onExit={() => setCurrentView('profile')} />;
    }
     if (currentView === 'developer-tools') {
        return <DeveloperToolsScreen onExit={() => setCurrentView('settings')} onNavigate={handleNavigate} />;
    }
    if (currentView === 'documentation') {
        return <DocumentationScreen onExit={() => setCurrentView('settings')} />;
    }

    if (currentView === 'avatar-protection') {
        return <AvatarProtectionScreen
            user={user}
            onExit={() => setCurrentView('edit')}
            onSave={handleAvatarProtectionSave}
        />;
    }


    // Main app content with bottom nav
    const mainContent: { [key in AppView]?: React.ReactNode } = {
        'feed': <LiveFeedScreen 
                    user={user} 
                    onViewStream={handleViewStream} 
                    onGoLiveClick={handleGoLiveClick}
                    activeCategory={activeCategory}
                    onSelectCategory={setActiveCategory}
                    onUpdateUser={setUser}
                    onNavigateToChat={handleNavigateToChat}
                    onViewProtectors={handleViewProtectors}
                    onNavigate={handleNavigate}
                />,
        'profile': <ProfileScreen user={user} onNavigate={handleNavigate} onGoLiveClick={handleGoLiveClick} />,
        'messages': <MessagesScreen user={user} onNavigate={handleNavigate} onNavigateToChat={handleNavigateToChat} />,
        'video': <VideoScreen />,
    };

    const mainViewKey = currentView as AppView;

    if (mainContent[mainViewKey]) {
        return (
            <div className="h-screen w-full bg-black font-sans flex flex-col">
                <main className="flex-grow overflow-hidden relative">
                    {mainContent[mainViewKey]}
                </main>
                <BottomNav 
                    user={user} 
                    activeView={currentView} 
                    onNavigate={handleNavigate} 
                    onGoLiveClick={handleGoLiveClick} 
                />
            </div>
        );
    }

    // Fallback for any unhandled view
    return <LoginScreen onGoogleLogin={handleLogin} isLoading={isLoading} error={"Visualização inválida. Por favor, reinicie."} />;
  };

  return (
    <>
      {renderContent()}

      {purchaseOverlay && user && (
        <>
            {purchaseOverlay.step === 'purchase' && (
                <DiamondPurchaseScreen
                    user={user}
                    onExit={() => setPurchaseOverlay(null)}
                    onConfirmPurchase={(pkg) => setPurchaseOverlay({ step: 'confirm', pkg })}
                    onPurchase={() => {}} 
                    onNavigate={handleNavigate}
                    isOverlay={true}
                    onUpdateUser={setUser}
                    onNavigateToSetup={() => {
                        setPurchaseOverlay(null);
                        setCurrentView('withdrawal-method-setup');
                    }}
                    onWithdrawalComplete={(transaction) => {
                        setPurchaseOverlay(null);
                        handleWithdrawalComplete(transaction);
                    }}
                />
            )}
            {purchaseOverlay.step === 'confirm' && purchaseOverlay.pkg && (
                <PurchaseConfirmationScreen
                    user={user}
                    selectedPackage={purchaseOverlay.pkg}
                    onExit={() => setPurchaseOverlay({ step: 'purchase' })}
                    onConfirm={(updatedUser, order) => {
                        setUser(updatedUser);
                        setPurchaseOverlay(null); 
                    }}
                />
            )}
        </>
      )}

      {liveNotification && (
          <LiveNotificationModal 
              streamerName={liveNotification.streamerName}
              streamerAvatarUrl={liveNotification.streamerAvatarUrl}
              onWatch={() => {
                  setLiveNotification(null);
                  setCurrentView('feed');
                  handleViewStream(liveNotification.stream);
              }}
              onClose={() => setLiveNotification(null)}
          />
      )}
      
      {incomingPrivateLiveInvite && (
          <IncomingPrivateLiveInviteModal
              invite={incomingPrivateLiveInvite}
              onAccept={() => {
                  handleViewStream(incomingPrivateLiveInvite.stream);
                  setIncomingPrivateLiveInvite(null);
              }}
              onDecline={() => setIncomingPrivateLiveInvite(null)}
          />
      )}
    </>
  );
}

const App: React.FC = () => (
  <ApiViewerProvider>
    <AppContent />
  </ApiViewerProvider>
);

export default App;