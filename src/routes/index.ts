import { AuthController } from '../controllers/AuthController';
import { UserController } from '../controllers/UserController';
import { StreamController } from '../controllers/StreamController';
import { WalletController } from '../controllers/WalletController';
import { ChatController } from '../controllers/ChatController';
import { GiftController } from '../controllers/GiftController';
import { SettingsController } from '../controllers/SettingsController';
import { AdminController } from '../controllers/AdminController';
import { ProfileController } from '../controllers/ProfileController';
import { PKController } from '../controllers/PKController';
import { NotificationController } from '../controllers/NotificationController';
import { LeaderboardController } from '../controllers/LeaderboardController';
import { FeedController } from '../controllers/FeedController';
import { MarketController } from '../controllers/MarketController';
import { InviteController } from '../controllers/InviteController';
import { PermissionController } from '../controllers/PermissionController';
import { SystemController } from '../controllers/SystemController';
import { SearchController } from '../controllers/SearchController';
import { AccountController } from '../controllers/AccountController'; 
import { srsService } from '../services/srsService';

// Import Extended Controllers
import {
    StreamReminderController, ChatSettingsController, RefundController, ReportController,
    UserFrameController, FrameLogController, StreamResolutionController, AppVersionController,
    FriendRequestController, AccountDeletionController, PushNotificationController, WatermarkController,
    ProfileTagController, ProfessionController, EmotionalStatusController, ZoomController,
    PipController, LanguageController, PrivateStreamConfigController, PKBattleController,
    UserMediaController, LevelPrivilegeController, StreamViewerController, ProfileShareController,
    StreamModerationLogController, PaymentTransactionController, LoadingConfigController, InviteRestrictionController,
    MainScreenStreamerController, FAQController, StreamManualController, BeautyEffectController,
    GiftAnimationController, FrameMetadataController, SearchHistoryController, CameraPermissionController,
    LocationPermissionController, LoginStateController, MarketUserController, MarketFrameController,
    MarketGiftController, MessageUserController, MessageConversationController, MessageFriendRequestController,
    LevelUserController, StreamContributorController, StreamSummaryController, SpecificFrameInventoryController,
    EarningsPolicyController, WalletDataController, FollowController, BlockController,
    VisitController, UserProfileController, GiftNotificationConfigController, AvatarFrameController,
    PKConfigController, GoogleRegistrationController, GooglePasswordController, RegionController,
    CountryController, LiveStreamController
} from '../controllers/ExtendedControllers';

// Import New Frame & Final Controllers
import {
    FrameBlazingSunController, FrameBlueCrystalController, FrameGoldenFloralController, FrameBlueFireController,
    FrameDiamondController, FrameFloralWreathController, FrameIcyWingsController, FrameMagentaWingsController,
    FrameNeonDiamondController, FrameNeonPinkController, FrameOrnateBronzeController, FramePinkGemController,
    FramePinkLaceController, FramePurpleFloralController, FrameRegalPurpleController, FrameSilverThornController,
    FrameRoseHeartController, FrameSilverBeadedController
} from '../controllers/FrameControllers';
import {
    FanController, StreamHistoryController, DiamondPackageController, LegalDocumentController, TransactionController
} from '../controllers/FinalControllers';
import { ConfigurationController } from '../controllers/ConfigurationController';
import { DeviceStateController } from '../controllers/DeviceStateController';
import { FriendController } from '../controllers/FriendController';
import { StreamStatsController } from '../controllers/StreamStatsController';
import { EconomyController } from '../controllers/EconomyController';
import { VIPController } from '../controllers/VIPController';
import { VisualAssetsController } from '../controllers/VisualAssetsController';
import { MarketDataController } from '../controllers/MarketDataController';
import { FrameInventoryController } from '../controllers/FrameInventoryController';
import { ContentManagementController } from '../controllers/ContentManagementController';
import { LegalController } from '../controllers/LegalController';
import { AuditController } from '../controllers/AuditController';
import { UserContentController } from '../controllers/UserContentController';
import { SystemConfigController } from '../controllers/SystemConfigController';
import { LevelController } from '../controllers/LevelController';
import { GamificationDataController } from '../controllers/GamificationDataController';
import { MessageDataController } from '../controllers/MessageDataController';
import { InteractionController } from '../controllers/InteractionController';


// Definition of a Route
export interface RouteDefinition {
    method: string;
    path: RegExp; // Regex for matching paths with params
    handler: Function;
    paramKeys: string[]; // Names of parameters in the URL (e.g. ['id'])
}

const routes: RouteDefinition[] = [];

// Helper to register routes
const register = (method: string, pathPattern: string, handler: Function) => {
    const paramKeys: string[] = [];
    const regexPath = pathPattern.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
        paramKeys.push(key);
        return '([^/]+)';
    }).replace(/\//g, '\\/'); 

    routes.push({
        method,
        path: new RegExp(`^${regexPath}$`),
        handler,
        paramKeys
    });
};

// --- AUTH & ACCOUNTS ---
register('GET', '/api/accounts/google/connected', AuthController.getConnectedAccounts);
register('POST', '/api/accounts/google/disconnect', AuthController.disconnectAccount);
register('POST', '/api/auth/login', AuthController.loginWithGoogle);

// Rotas de exclusão de conta via AccountController
register('POST', '/api/account/delete-request', AccountController.requestDeletion); 
register('POST', '/api/account/delete-request/cancel', AccountController.cancelDeletion); 

// --- USER ---
register('GET', '/api/users', UserController.getAllUsers); 
register('GET', '/api/users/me', UserController.getMe);
register('GET', '/api/users/me/blocklist', UserController.getBlockedUsers);
register('GET', '/api/users/:id', UserController.getUser);
register('PATCH', '/api/users/:id', UserController.updateProfile);
register('DELETE', '/api/users/:id', UserController.blockUser); 
register('POST', '/api/users/:followedId/toggle-follow', UserController.toggleFollow);
register('POST', '/api/users/:userIdToBlock/block', UserController.blockUser);
register('DELETE', '/api/users/:userIdToUnblock/unblock', UserController.unblockUser);
register('POST', '/api/users/:userIdToReport/report', UserController.reportUser);
register('GET', '/api/users/:userId/fans', UserController.getFans);
register('GET', '/api/users/:userId/following', UserController.getFollowing);
register('GET', '/api/users/:userId/friends', UserController.getFriends);
register('GET', '/api/users/:userId/status', UserController.getUserStatus);
register('GET', '/api/users/:userId/received-gifts', GiftController.getReceivedGifts);
register('POST', '/api/users/:id/visit', UserController.recordVisit);
register('POST', '/api/users/:id/buy-diamonds', WalletController.buyDiamonds);
register('GET', '/api/users/:id/location-permission', UserController.getLocationPermission);
register('POST', '/api/users/:id/location-permission', UserController.updateLocationPermission);
register('POST', '/api/users/:id/privacy/activity', UserController.updatePrivacyActivity);
register('POST', '/api/users/:id/privacy/location', UserController.updatePrivacyLocation);
register('POST', '/api/users/:id/set-active-frame', MarketController.setActiveFrame);
register('GET', '/api/users/:id/avatar-protection', UserController.getAvatarProtectionStatus);
register('POST', '/api/users/:id/avatar-protection', UserController.toggleAvatarProtection);
register('GET', '/api/users/:userId/photos', UserController.getUserPhotos);
register('GET', '/api/users/:userId/liked-photos', UserController.getLikedPhotos);
register('GET', '/api/users/:userId/level-info', UserController.getLevelInfo);
register('GET', '/api/users/:userId/messages', UserController.getConversations);

// --- USER CONFIGS ---
register('GET', '/api/config/zoom/:userId', ConfigurationController.getZoom);
register('POST', '/api/config/zoom/:userId', ConfigurationController.updateZoom);
register('GET', '/api/config/pip/:userId', ConfigurationController.getPip);
register('POST', '/api/config/pip/:userId', ConfigurationController.updatePip);
register('GET', '/api/config/watermark/:userId', ConfigurationController.getWatermark);
register('POST', '/api/config/watermark/:userId', ConfigurationController.updateWatermark);
register('GET', '/api/config/language/:userId', ConfigurationController.getLanguage);
register('POST', '/api/config/language/:userId', ConfigurationController.updateLanguage);
register('GET', '/api/config/push/:userId', ConfigurationController.getPush);
register('POST', '/api/config/push/:userId', ConfigurationController.updatePush);
register('GET', '/api/config/private-stream/:userId', ConfigurationController.getPrivateStreamConfig);
register('POST', '/api/config/private-stream/:userId', ConfigurationController.updatePrivateStreamConfig);

// --- DEVICE STATES ---
register('GET', '/api/device/camera/:userId', DeviceStateController.getCameraState);
register('POST', '/api/device/camera/:userId', DeviceStateController.updateCameraState);
register('GET', '/api/device/location/:userId', DeviceStateController.getLocationState);
register('POST', '/api/device/location/:userId', DeviceStateController.updateLocationState);
register('POST', '/api/device/login-log', DeviceStateController.logLoginAttempt);
register('GET', '/api/device/login-log/:userId', DeviceStateController.getLoginHistory);

// --- FRIENDS ---
register('POST', '/api/friends/request', FriendController.sendRequest);
register('GET', '/api/friends/requests', FriendController.getRequests);
register('POST', '/api/friends/accept', FriendController.acceptRequest);
register('POST', '/api/friends/reject', FriendController.rejectRequest);

// --- PROFILE ---
register('GET', '/api/perfil/imagens', ProfileController.getImages);
register('DELETE', '/api/perfil/imagens/:imageId', ProfileController.deleteImage);
register('PUT', '/api/perfil/imagens/ordenar', ProfileController.reorderImages);
register('PUT', '/api/perfil/:field', ProfileController.updateField);

// --- STREAMS ---
register('POST', '/api/streams', StreamController.createStream);
register('GET', '/api/streams/manual', StreamController.getManual);
register('GET', '/api/streams/effects', StreamController.getEffects);
register('GET', '/api/live/:category', StreamController.getLiveStreamers);
register('POST', '/api/streams/:id/end-session', StreamController.endStreamSession);
register('GET', '/api/streams/:id/online-users', StreamController.getOnlineUsers);
register('GET', '/api/streams/:id/access-check', StreamController.checkAccess);
register('PUT', '/api/streams/:id', StreamController.updateStream); 
register('PATCH', '/api/streams/:id', StreamController.updateStream);
register('POST', '/api/streams/:id/save', StreamController.updateStream);
register('POST', '/api/streams/:id/cover', StreamController.updateStream); 
register('POST', '/api/streams/:id/toggle-mic', StreamController.updateStream); 
register('POST', '/api/streams/:id/toggle-sound', StreamController.updateStream);
register('POST', '/api/streams/:id/toggle-auto-follow', StreamController.updateStream);
register('POST', '/api/streams/:id/toggle-auto-invite', StreamController.updateStream);
register('POST', '/api/streams/:id/private-invite', StreamController.updateStream);
register('PUT', '/api/streams/:id/quality', StreamController.updateStream);
register('POST', '/api/streams/:id/kick', StreamController.updateStream);
register('POST', '/api/streams/:id/moderator', StreamController.updateStream);
register('POST', '/api/streams/:id/gift', GiftController.sendGift);
register('POST', '/api/streams/:id/interactions', StreamController.updateStream); 
register('POST', '/api/friends/invite', StreamController.inviteFriendForCoHost);
register('POST', '/api/streams/reminders', StreamController.toggleReminder);

// --- STREAM STATS ---
register('GET', '/api/streams/:streamId/contributors', StreamStatsController.getTopContributors);
register('POST', '/api/streams/:streamId/contributors', StreamStatsController.logContribution);
register('POST', '/api/streams/summary', StreamStatsController.createSummary);
register('GET', '/api/streams/:streamId/summary', StreamStatsController.getSummary);

// --- LIVE NOTIFICATIONS ---
register('POST', '/api/lives/start', StreamController.startStreamNotification);
register('POST', '/api/lives/:id/end', StreamController.endStreamSession);

// --- VISITORS ---
register('GET', '/api/visitors/list/:userId', UserController.getVisitors);
register('DELETE', '/api/visitors/clear/:userId', UserController.clearVisitors);

// --- WALLET & EARNINGS ---
register('GET', '/api/earnings/get/:userId', WalletController.getEarningsInfo);
register('POST', '/api/earnings/calculate', WalletController.calculateWithdrawal);
register('POST', '/api/earnings/withdraw/:userId', WalletController.withdrawEarnings);
register('POST', '/api/purchase/confirm', WalletController.confirmPurchase);
register('GET', '/api/purchases/history/:userId', WalletController.getHistory);
register('POST', '/api/checkout/order', WalletController.createOrder);
register('GET', '/api/checkout/pack', EconomyController.getPackages);
register('POST', '/api/payment/pix', (req: any, res: any) => res.status(200).json({ success: true, pixCode: 'mock', orderId: req.body.orderId }));
register('POST', '/api/payment/credit-card', (req: any, res: any) => res.status(200).json({ success: true, message: "Card authorized", orderId: req.body.orderId }));

// --- GIFTS ---
register('GET', '/api/gifts', GiftController.getGifts);

// --- CHAT ---
register('POST', '/api/chats/send', ChatController.sendMessage);
register('GET', '/api/chats/:otherUserId/messages', ChatController.getMessages);
register('POST', '/api/chats/mark-read', ChatController.markRead);
register('GET', '/api/chats/:userId/:partnerId/settings', ChatController.getSettings);
register('PUT', '/api/chats/:userId/:partnerId/settings', ChatController.updateSettings);

// --- SETTINGS ---
register('GET', '/api/notifications/settings/:userId', SettingsController.getNotificationSettings);
register('POST', '/api/notifications/settings/:userId', SettingsController.updateNotificationSettings);
register('GET', '/api/settings/private-stream/:userId', SettingsController.getPrivateStreamSettings);
register('POST', '/api/settings/private-stream/:userId', SettingsController.updatePrivateStreamSettings);
register('GET', '/api/settings/push/:userId', SettingsController.getPushConfig); 
register('POST', '/api/settings/push/:userId', SettingsController.updatePushConfig); 
register('POST', '/api/settings/language/:userId', SettingsController.updateLanguage); 
register('POST', '/api/settings/watermark/:userId', SettingsController.updateWatermark); 
register('GET', '/api/settings/gift-notifications/:userId', (req: any, res: any) => res.status(200).json({ settings: {} }));
register('POST', '/api/settings/gift-notifications/:userId', SettingsController.updateGiftNotificationSettings);
register('GET', '/api/settings/beauty/:userId', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/settings/beauty/:userId', SettingsController.updateBeautySettings);
register('POST', '/api/settings/pip/toggle/:userId', SettingsController.updatePipSettings);
register('GET', '/api/chat-permission/status/:id', UserController.getChatPermissionStatus);
register('POST', '/api/chat-permission/update/:id', UserController.updateChatPermission);

// --- ADMIN & ECONOMY ---
register('POST', '/api/admin/withdraw', AdminController.withdrawPlatformEarnings);
register('GET', '/api/admin/history', AdminController.getAdminHistory);
register('POST', '/api/admin/withdrawal-method', AdminController.saveWithdrawalMethod);
register('POST', '/api/admin/refunds', AdminController.requestRefund);
register('PUT', '/api/admin/refunds/:refundId', AdminController.handleRefund);
register('GET', '/api/admin/reports', AdminController.getReports);
register('PUT', '/api/admin/reports/:reportId/resolve', AdminController.resolveReport);
register('GET', '/api/economy/policy', EconomyController.getEarningsPolicy);
register('PUT', '/api/economy/policy', EconomyController.updateEarningsPolicy);
register('POST', '/api/economy/packages', EconomyController.createPackage);

// --- EFFECTS & MARKET & FRAMES ---
register('POST', '/api/effects/purchase-frame/:userId', MarketController.purchaseFrame);
register('POST', '/api/effects/purchase/:userId', MarketController.purchaseEffect);
register('POST', '/api/vip/subscribe/:userId', VIPController.subscribe);
register('GET', '/api/vip/plans', VIPController.getPlans);
register('GET', '/api/visual/frames', VisualAssetsController.getFrameMetadata);
register('GET', '/api/visual/beauty', VisualAssetsController.getBeautyEffects);
register('POST', '/api/visual/beauty', VisualAssetsController.addBeautyEffect);
register('GET', '/api/market/user/:userId', MarketDataController.getMarketUser);
register('GET', '/api/market/frames', MarketDataController.getMarketFrames);
register('POST', '/api/market/frames', MarketDataController.addMarketFrame);
register('GET', '/api/market/gifts', MarketDataController.getMarketGifts);
register('GET', '/api/inventory/frames/:userId/:frameType', FrameInventoryController.getFrameStatus);
register('POST', '/api/inventory/frames/:userId/:frameType/acquire', FrameInventoryController.acquireFrame);
register('GET', '/api/inventory/frames/:userId', FrameInventoryController.listAllFrames);

// --- CONTENT MANAGEMENT ---
register('GET', '/api/content/faq', ContentManagementController.listFAQs);
register('POST', '/api/content/faq', ContentManagementController.createFAQ);
register('GET', '/api/content/manual', ContentManagementController.getStreamManual);
register('GET', '/api/content/version', ContentManagementController.getLatestVersion);

// --- FEED & PHOTOS ---
register('GET', '/api/feed/photos', FeedController.getFeed);
register('POST', '/api/photos/upload/:userId', FeedController.uploadPhoto);
register('POST', '/api/photos/:photoId/like', FeedController.likePhoto);

// --- PERMISSIONS ---
register('GET', '/api/permissions/camera/:userId', PermissionController.getCameraPermission);
register('POST', '/api/permissions/camera/:userId', PermissionController.updateCameraPermission);
register('GET', '/api/permissions/microphone/:userId', PermissionController.getMicrophonePermission);
register('POST', '/api/permissions/microphone/:userId', PermissionController.updateMicrophonePermission);

// --- INVITES & ROOMS ---
register('POST', '/api/invitations/send', InviteController.sendInvitation);
register('GET', '/api/invitations/received', InviteController.getReceivedInvitations);
register('GET', '/api/rooms', InviteController.getPrivateRooms);
register('GET', '/api/rooms/:roomId', InviteController.getRoomDetails);
register('POST', '/api/rooms/:roomId/join', InviteController.joinRoom);

// --- PK ---
register('GET', '/api/pk/config', PKController.getConfig);
register('POST', '/api/pk/config', PKController.updateConfig);
register('POST', '/api/pk/start', PKController.startBattle);
register('POST', '/api/pk/end', PKController.endBattle);
register('POST', '/api/pk/heart', PKController.sendHeart);

// --- NOTIFICATIONS ---
register('GET', '/api/notifications', NotificationController.getNotifications);
register('PATCH', '/api/notifications/:id/read', NotificationController.markRead);

// --- RANKING ---
register('GET', '/api/ranking/:period', LeaderboardController.getRanking);

// --- SYSTEM & EXTRAS ---
register('GET', '/api/regions', SystemController.getCountries);
register('GET', '/api/faq', SystemController.getFAQ);
register('GET', '/api/app-version', SystemController.getAppVersion);
register('GET', '/api/reminders', (req: any, res: any) => res.status(200).json([])); 
register('POST', '/api/history/streams', StreamController.addHistory);
register('GET', '/api/history/streams', (req: any, res: any) => res.status(200).json([]));
register('POST', '/api/sim/status', UserController.updateSimStatus);
register('GET', '/api/legal/:slug', LegalController.getDocument);
register('GET', '/api/system/tags', SystemController.getTags);

// --- AUDIT & LOGS ---
register('POST', '/api/audit/stream-view', AuditController.recordStreamView);
register('PUT', '/api/audit/stream-view', AuditController.updateStreamView);
register('POST', '/api/audit/profile-share', AuditController.recordProfileShare);
register('POST', '/api/audit/moderation', AuditController.logModerationAction);
register('POST', '/api/audit/payment', AuditController.logPaymentTransaction);
register('POST', '/api/search/history', SearchController.addSearchHistory); 
register('GET', '/api/search/history', SearchController.getSearchHistory); 

// --- USER CONTENT ---
register('GET', '/api/users/:userId/media', UserContentController.getUserMedia);
register('POST', '/api/users/:userId/media', UserContentController.addUserMedia);
register('PUT', '/api/users/:userId/media/reorder', UserContentController.reorderMedia);
register('GET', '/api/curated/streamers', UserContentController.getCuratedStreamers);

// --- SYSTEM CONFIG ---
register('GET', '/api/config/loading', SystemConfigController.getLoadingConfig);
register('POST', '/api/config/loading', SystemConfigController.updateLoadingConfig);
register('GET', '/api/config/invite-restrictions/:streamId', SystemConfigController.getInviteRestriction);
register('POST', '/api/config/invite-restrictions/:streamId', SystemConfigController.updateInviteRestriction);
register('GET', '/api/config/frames/metadata', SystemConfigController.getFrameMetadata);

// --- LEVELS & GAMIFICATION ---
register('GET', '/api/levels/privileges', LevelController.getPrivileges);
register('GET', '/api/levels/user/:userId', GamificationDataController.getLevelData); 
register('GET', '/api/levels/definitions', GamificationDataController.getLevelDefinitions); 

// --- MESSAGING ISOLATED ---
register('GET', '/api/messaging/user/:userId', MessageDataController.getMessageUser);
register('GET', '/api/messaging/conversation/:id', MessageDataController.getConversationMeta);
register('POST', '/api/messaging/conversation', MessageDataController.createConversationMeta);
register('GET', '/api/messaging/requests/:userId', MessageDataController.getFriendRequests);

// --- INTERACTIONS ---
register('POST', '/api/interact/block', InteractionController.blockUser);
register('POST', '/api/interact/unblock', InteractionController.unblockUser);
register('POST', '/api/interact/visit', InteractionController.logVisit);
register('POST', '/api/interact/report', InteractionController.createReport);

// --- EXTENDED CONTROLLER ROUTES ---
// 1. StreamReminder
register('GET', '/api/extended/stream-reminder/:userId', StreamReminderController.getReminders);
register('POST', '/api/extended/stream-reminder', StreamReminderController.createReminder);
// 2. ChatSettings
register('GET', '/api/extended/chat-settings/:userId/:partnerId', ChatSettingsController.get);
register('PUT', '/api/extended/chat-settings/:userId/:partnerId', ChatSettingsController.update);
// 3. Refund
register('POST', '/api/extended/refund', RefundController.create);
// 4. Report
register('POST', '/api/extended/report', ReportController.create);
// 5. UserFrame
register('GET', '/api/extended/user-frame/:userId', UserFrameController.list);
// 6. FrameLog
register('GET', '/api/extended/frame-log/:userId', FrameLogController.list);
// 7. StreamResolution
register('GET', '/api/extended/stream-resolution', StreamResolutionController.list);
// 8. AppVersion
register('GET', '/api/extended/app-version', AppVersionController.current);
// 9. FriendRequest
register('GET', '/api/extended/friend-request/:userId', FriendRequestController.list);
// 10. AccountDeletion
register('POST', '/api/extended/account-deletion', AccountDeletionController.request);
// 11. PushNotification
register('GET', '/api/extended/push-notification/:userId', PushNotificationController.get);
register('PUT', '/api/extended/push-notification/:userId', PushNotificationController.update);
// 12. Watermark
register('GET', '/api/extended/watermark/:userId', WatermarkController.get);
register('PUT', '/api/extended/watermark/:userId', WatermarkController.update);
// 13. ProfileTag
register('GET', '/api/extended/profile-tag', ProfileTagController.list);
// 14. Profession
register('GET', '/api/extended/profession', ProfessionController.list);
// 15. EmotionalStatus
register('GET', '/api/extended/emotional-status', EmotionalStatusController.list);
// 16. Zoom
register('GET', '/api/extended/zoom/:userId', ZoomController.get);
register('PUT', '/api/extended/zoom/:userId', ZoomController.update);
// 17. Pip
register('GET', '/api/extended/pip/:userId', PipController.get);
register('PUT', '/api/extended/pip/:userId', PipController.update);
// 18. Language
register('GET', '/api/extended/language/:userId', LanguageController.get);
register('PUT', '/api/extended/language/:userId', LanguageController.update);
// 19. PrivateStreamConfig
register('GET', '/api/extended/private-stream-config/:userId', PrivateStreamConfigController.get);
register('PUT', '/api/extended/private-stream-config/:userId', PrivateStreamConfigController.update);
// 20. PKBattle
register('GET', '/api/extended/pk-battle/:streamId', PKBattleController.get);
// 21. UserMedia
register('GET', '/api/extended/user-media/:userId', UserMediaController.list);
// 22. LevelPrivilege
register('GET', '/api/extended/level-privilege', LevelPrivilegeController.list);
// 23. StreamViewer
register('GET', '/api/extended/stream-viewer/:streamId', StreamViewerController.list);
// 24. ProfileShare
register('POST', '/api/extended/profile-share', ProfileShareController.create);
// 25. StreamModerationLog
register('GET', '/api/extended/stream-moderation-log/:streamId', StreamModerationLogController.list);
// 26. PaymentTransaction
register('POST', '/api/extended/payment-transaction', PaymentTransactionController.create);
// 27. LoadingConfig
register('GET', '/api/extended/loading-config', LoadingConfigController.get);
// 28. InviteRestriction
register('GET', '/api/extended/invite-restriction/:streamId', InviteRestrictionController.get);
// 29. MainScreenStreamer
register('GET', '/api/extended/main-screen-streamer', MainScreenStreamerController.list);
// 30. FAQ
register('GET', '/api/extended/faq', FAQController.list);
// 31. StreamManual
register('GET', '/api/extended/stream-manual', StreamManualController.list);
// 32. BeautyEffect
register('GET', '/api/extended/beauty-effect', BeautyEffectController.list);
// 33. GiftAnimation
register('GET', '/api/extended/gift-animation/:giftId', GiftAnimationController.get);
// 34. FrameMetadata
register('GET', '/api/extended/frame-metadata', FrameMetadataController.list);
// 35. SearchHistory
register('GET', '/api/extended/search-history/:userId', SearchHistoryController.list);
// 36. CameraPermission
register('GET', '/api/extended/camera-permission/:userId', CameraPermissionController.get);
// 37. LocationPermission
register('GET', '/api/extended/location-permission/:userId', LocationPermissionController.get);
// 38. LoginState
register('GET', '/api/extended/login-state/:userId', LoginStateController.list);
// 39. MarketUser
register('GET', '/api/extended/market-user/:userId', MarketUserController.get);
// 40. MarketFrame
register('GET', '/api/extended/market-frame', MarketFrameController.list);
// 41. MarketGift
register('GET', '/api/extended/market-gift', MarketGiftController.list);
// 42. MessageUser
register('GET', '/api/extended/message-user/:userId', MessageUserController.get);
// 43. MessageConversation
register('GET', '/api/extended/message-conversation', MessageConversationController.list);
// 44. MessageFriendRequest
register('GET', '/api/extended/message-friend-request', MessageFriendRequestController.list);
// 45. LevelUser
register('GET', '/api/extended/level-user/:userId', LevelUserController.get);
// 46. StreamContributor
register('GET', '/api/extended/stream-contributor/:streamId', StreamContributorController.list);
// 47. StreamSummary
register('GET', '/api/extended/stream-summary/:streamId', StreamSummaryController.get);
// 48. SpecificFrameInventory
register('GET', '/api/extended/specific-frame-inventory/:userId', SpecificFrameInventoryController.list);
// 49. EarningsPolicy
register('GET', '/api/extended/earnings-policy', EarningsPolicyController.get);
// 50. WalletData
register('GET', '/api/extended/wallet-data/:userId', WalletDataController.get);
// 51. Follow
register('GET', '/api/extended/follow/:userId', FollowController.list);
// 52. Block
register('GET', '/api/extended/block/:userId', BlockController.list);
// 53. Visit
register('GET', '/api/extended/visit/:userId', VisitController.list);
// 54. UserProfile
register('GET', '/api/extended/user-profile/:userId', UserProfileController.get);
// 55. GiftNotificationConfig
register('GET', '/api/extended/gift-notification-config/:userId', GiftNotificationConfigController.get);
// 56. AvatarFrame
register('GET', '/api/extended/avatar-frame', AvatarFrameController.list);
// 57. PKConfig
register('GET', '/api/extended/pk-config/:userId', PKConfigController.get);
// 58. GoogleRegistration
register('POST', '/api/extended/google-registration', GoogleRegistrationController.create);
// 59. GooglePassword
register('POST', '/api/extended/google-password', GooglePasswordController.create);
// 60. Region
register('GET', '/api/extended/region', RegionController.list);
// 61. Country
register('GET', '/api/extended/country', CountryController.list);
// 62. LiveStream
register('GET', '/api/extended/live-stream/:id', LiveStreamController.get);

// --- NEW FRAME ROUTES ---
register('GET', '/api/frames/blazing-sun/:userId', FrameBlazingSunController.get);
register('POST', '/api/frames/blazing-sun', FrameBlazingSunController.create);
register('GET', '/api/frames/blue-crystal/:userId', FrameBlueCrystalController.get);
register('POST', '/api/frames/blue-crystal', FrameBlueCrystalController.create);
register('GET', '/api/frames/golden-floral/:userId', FrameGoldenFloralController.get);
register('POST', '/api/frames/golden-floral', FrameGoldenFloralController.create);
register('GET', '/api/frames/blue-fire/:userId', FrameBlueFireController.get);
register('POST', '/api/frames/blue-fire', FrameBlueFireController.create);
register('GET', '/api/frames/diamond/:userId', FrameDiamondController.get);
register('POST', '/api/frames/diamond', FrameDiamondController.create);
register('GET', '/api/frames/floral-wreath/:userId', FrameFloralWreathController.get);
register('POST', '/api/frames/floral-wreath', FrameFloralWreathController.create);
register('GET', '/api/frames/icy-wings/:userId', FrameIcyWingsController.get);
register('POST', '/api/frames/icy-wings', FrameIcyWingsController.create);
register('GET', '/api/frames/magenta-wings/:userId', FrameMagentaWingsController.get);
register('POST', '/api/frames/magenta-wings', FrameMagentaWingsController.create);
register('GET', '/api/frames/neon-diamond/:userId', FrameNeonDiamondController.get);
register('POST', '/api/frames/neon-diamond', FrameNeonDiamondController.create);
register('GET', '/api/frames/neon-pink/:userId', FrameNeonPinkController.get);
register('POST', '/api/frames/neon-pink', FrameNeonPinkController.create);
register('GET', '/api/frames/ornate-bronze/:userId', FrameOrnateBronzeController.get);
register('POST', '/api/frames/ornate-bronze', FrameOrnateBronzeController.create);
register('GET', '/api/frames/pink-gem/:userId', FramePinkGemController.get);
register('POST', '/api/frames/pink-gem', FramePinkGemController.create);
register('GET', '/api/frames/pink-lace/:userId', FramePinkLaceController.get);
register('POST', '/api/frames/pink-lace', FramePinkLaceController.create);
register('GET', '/api/frames/purple-floral/:userId', FramePurpleFloralController.get);
register('POST', '/api/frames/purple-floral', FramePurpleFloralController.create);
register('GET', '/api/frames/regal-purple/:userId', FrameRegalPurpleController.get);
register('POST', '/api/frames/regal-purple', FrameRegalPurpleController.create);
register('GET', '/api/frames/silver-thorn/:userId', FrameSilverThornController.get);
register('POST', '/api/frames/silver-thorn', FrameSilverThornController.create);
register('GET', '/api/frames/rose-heart/:userId', FrameRoseHeartController.get);
register('POST', '/api/frames/rose-heart', FrameRoseHeartController.create);
register('GET', '/api/frames/silver-beaded/:userId', FrameSilverBeadedController.get);
register('POST', '/api/frames/silver-beaded', FrameSilverBeadedController.create);

// --- NEW ENTITY ROUTES ---
register('GET', '/api/fans/:userId', FanController.getFans);
register('POST', '/api/fans', FanController.addFan);
register('GET', '/api/history/stream/:userId', StreamHistoryController.getHistory);
register('GET', '/api/packages/diamond', DiamondPackageController.getPackages);
register('POST', '/api/packages/diamond', DiamondPackageController.createPackage);
register('GET', '/api/legal-documents/:slug', LegalDocumentController.getDocument);
register('GET', '/api/transactions/:userId', TransactionController.getTransactions);
register('POST', '/api/transactions', TransactionController.createTransaction);


// --- ROUTER ENGINE ---
export const handleRequest = async (method: string, path: string, body?: any) => {
    // Basic URL parsing to ignore query params for matching
    const urlObj = new URL(path, 'http://mock');
    const pathName = urlObj.pathname;
    
    // Find matching route
    const matchedRoute = routes.find(r => r.method === method && r.path.test(pathName));

    if (!matchedRoute) {
        console.warn(`[Router] No route found for ${method} ${pathName}`);
        return { status: 404, error: "Route not found" };
    }

    // Extract Params
    const match = pathName.match(matchedRoute.path);
    const params: any = {};
    if (match && matchedRoute.paramKeys.length > 0) {
        matchedRoute.paramKeys.forEach((key, index) => {
            params[key] = match[index + 1];
        });
    }

    // Construct Mock Req/Res
    const req = {
        method,
        path: pathName,
        body: body || {},
        params,
        query: Object.fromEntries(urlObj.searchParams)
    };

    let responseData: any = null;
    let statusCode = 200;

    const res = {
        status: (code: number) => {
            statusCode = code;
            return res;
        },
        json: (data: any) => {
            responseData = data;
            return res;
        }
    };

    try {
        await matchedRoute.handler(req, res);
        return { status: statusCode, data: responseData };
    } catch (e) {
        console.error(`[Router] Error in ${method} ${pathName}:`, e);
        return { status: 500, error: (e as Error).message };
    }
};