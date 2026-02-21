
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
// Add missing controller imports
import { AccountController } from '../controllers/AccountController';
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
register('GET', '/api/settings/push/:userId', (req: any, res: any) => res.status(200).json({ settings: {} })); 
register('POST', '/api/settings/push/:userId', (req: any, res: any) => res.status(200).json({ success: true })); 
register('POST', '/api/settings/language/:userId', (req: any, res: any) => res.status(200).json({ success: true })); 
register('POST', '/api/settings/watermark/:userId', (req: any, res: any) => res.status(200).json({ success: true })); 
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
register('PUT', '/api/economy/policy', (req: any, res: any) => res.status(200).json({ success: true }));
register('POST', '/api/economy/packages', (req: any, res: any) => res.status(201).json({}));

// --- EFFECTS & MARKET & FRAMES ---
register('POST', '/api/effects/purchase-frame/:userId', MarketController.purchaseFrame);
register('POST', '/api/effects/purchase/:userId', MarketController.purchaseEffect);
register('POST', '/api/vip/subscribe/:userId', VIPController.subscribe);
register('GET', '/api/vip/plans', (req: any, res: any) => res.status(200).json([]));
register('GET', '/api/visual/frames', (req: any, res: any) => res.status(200).json([]));
register('GET', '/api/visual/beauty', (req: any, res: any) => res.status(200).json([]));
register('POST', '/api/visual/beauty', (req: any, res: any) => res.status(201).json({}));
register('GET', '/api/market/user/:userId', (req: any, res: any) => res.status(200).json({}));
register('GET', '/api/market/frames', (req: any, res: any) => res.status(200).json([]));
register('POST', '/api/market/frames', (req: any, res: any) => res.status(201).json({}));
register('GET', '/api/market/gifts', (req: any, res: any) => res.status(200).json([]));
register('GET', '/api/inventory/frames/:userId/:frameType', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/inventory/frames/:userId/:frameType/acquire', (req: any, res: any) => res.status(200).json({}));
register('GET', '/api/inventory/frames/:userId', (req: any, res: any) => res.status(200).json([]));

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
register('GET', '/api/legal/:slug', (req: any, res: any) => res.status(200).json({}));
register('GET', '/api/system/tags', SystemController.getTags);

// --- AUDIT & LOGS ---
register('POST', '/api/audit/stream-view', (req: any, res: any) => res.status(200).json({}));
register('PUT', '/api/audit/stream-view', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/audit/profile-share', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/audit/moderation', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/audit/payment', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/search/history', SearchController.addSearchHistory); 
register('GET', '/api/search/history', SearchController.getSearchHistory); 

// --- USER CONTENT ---
register('GET', '/api/users/:userId/media', (req: any, res: any) => res.status(200).json([]));
register('POST', '/api/users/:userId/media', (req: any, res: any) => res.status(201).json({}));
register('PUT', '/api/users/:userId/media/reorder', (req: any, res: any) => res.status(200).json({}));
register('GET', '/api/curated/streamers', (req: any, res: any) => res.status(200).json([]));

// --- SYSTEM CONFIG ---
register('GET', '/api/config/loading', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/config/loading', (req: any, res: any) => res.status(200).json({}));
register('GET', '/api/config/invite-restrictions/:streamId', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/config/invite-restrictions/:streamId', (req: any, res: any) => res.status(200).json({}));
register('GET', '/api/config/frames/metadata', (req: any, res: any) => res.status(200).json({}));

// --- LEVELS & GAMIFICATION ---
register('GET', '/api/levels/privileges', (req: any, res: any) => res.status(200).json([]));
register('GET', '/api/levels/user/:userId', (req: any, res: any) => res.status(200).json({})); 
register('GET', '/api/levels/definitions', (req: any, res: any) => res.status(200).json([])); 

// --- MESSAGING ISOLATED ---
register('GET', '/api/messaging/user/:userId', (req: any, res: any) => res.status(200).json({}));
register('GET', '/api/messaging/conversation/:id', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/messaging/conversation', (req: any, res: any) => res.status(201).json({}));
register('GET', '/api/messaging/requests/:userId', (req: any, res: any) => res.status(200).json([]));

// --- INTERACTIONS ---
register('POST', '/api/interact/block', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/interact/unblock', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/interact/visit', (req: any, res: any) => res.status(200).json({}));
register('POST', '/api/interact/report', (req: any, res: any) => res.status(201).json({}));


// --- ROUTER ENGINE ---
export const handleRequest = async (method: string, path: string, body?: any) => {
    // Find matching route
    const matchedRoute = routes.find(r => r.method === method && r.path.test(path));

    if (!matchedRoute) {
        console.warn(`[Router] No route found for ${method} ${path}`);
        return { status: 404, error: "Route not found" };
    }

    // Extract Params
    const match = path.match(matchedRoute.path);
    const params: any = {};
    if (match && matchedRoute.paramKeys.length > 0) {
        matchedRoute.paramKeys.forEach((key, index) => {
            params[key] = match[index + 1];
        });
    }

    // Construct Mock Req/Res
    const req = {
        method,
        path,
        body: body || {},
        params,
        query: {} // Query params not handled in simple regex match, usually parsed from URL
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
        console.error(`[Router] Error in ${method} ${path}:`, e);
        return { status: 500, error: (e as Error).message };
    }
};
