
import { db, saveDb, StreamReminder, ChatSettings, RefundRequest, Report, UserFrame, FrameLog, StreamResolution, AppVersion, FriendRequest, AccountDeletionRequest, PushNotificationConfig, WatermarkConfig, ProfileTag, Profession, EmotionalStatus, ZoomConfig, PipConfig, LanguageConfig, PrivateStreamConfig, UserMedia, LevelPrivilege, StreamViewer, ProfileShare, StreamModerationLog, PaymentTransaction, LoadingConfig, InviteRestriction, FAQ, StreamManual, BeautyEffect, GiftAnimationConfig, FrameMetadata, SearchHistory, CameraPermissionState, LocationPermissionState, LoginState, MarketUser, MarketFrame, MarketGift, MessageUser, MessageConversation, MessageFriendRequest, LevelUser, StreamContributor, StreamSummary, SpecificFrameInventory, WalletData, UserProfileData, GiftNotificationConfig, AvatarFrameCatalogItem, PKConfig, GoogleRegistration, GooglePassword, Region, CountryModel } from '../services/database';

// 1. Stream Reminder
export const StreamReminderController = {
    async getReminders(req: any, res: any) {
        const { userId } = req.params;
        const reminders = db.streamReminders.filter(r => r.userId === userId);
        return res.status(200).json(reminders);
    },
    async createReminder(req: any, res: any) {
        const reminder: StreamReminder = { id: `rem_${Date.now()}`, ...req.body, status: 'pending' };
        db.streamReminders.push(reminder);
        saveDb();
        return res.status(201).json(reminder);
    }
};

// 2. Chat Settings
export const ChatSettingsController = {
    async get(req: any, res: any) {
        const { userId, partnerId } = req.params;
        const settings = db.chatSettings.get(`${userId}-${partnerId}`) || { userId, partnerId, isMuted: false, isPinned: false };
        return res.status(200).json(settings);
    },
    async update(req: any, res: any) {
        const { userId, partnerId } = req.params;
        const key = `${userId}-${partnerId}`;
        const current = db.chatSettings.get(key) || { userId, partnerId, isMuted: false, isPinned: false };
        const updated = { ...current, ...req.body };
        db.chatSettings.set(key, updated);
        saveDb();
        return res.status(200).json(updated);
    }
};

// 3. Refund
export const RefundController = {
    async create(req: any, res: any) {
        const refund: RefundRequest = { id: `ref_${Date.now()}`, ...req.body, status: 'pending', createdAt: new Date().toISOString() };
        db.refundRequests.push(refund);
        saveDb();
        return res.status(201).json(refund);
    }
};

// 4. Report
export const ReportController = {
    async create(req: any, res: any) {
        const report: Report = { id: `rep_${Date.now()}`, ...req.body, status: 'pending', createdAt: new Date().toISOString() };
        db.reports.push(report);
        saveDb();
        return res.status(201).json(report);
    }
};

// 5. User Frame
export const UserFrameController = {
    async list(req: any, res: any) {
        const { userId } = req.params;
        const frames = db.userFrames.filter(f => f.userId === userId && f.isActive);
        return res.status(200).json(frames);
    }
};

// 6. Frame Log
export const FrameLogController = {
    async list(req: any, res: any) {
        const { userId } = req.params;
        const logs = db.frameLogs.filter(l => l.userId === userId);
        return res.status(200).json(logs);
    }
};

// 7. Stream Resolution
export const StreamResolutionController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.streamResolutions);
    }
};

// 8. App Version
export const AppVersionController = {
    async current(req: any, res: any) {
        return res.status(200).json(db.appVersion);
    }
};

// 9. Friend Request
export const FriendRequestController = {
    async list(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.friendRequests.filter(r => r.toUserId === userId));
    }
};

// 10. Account Deletion
export const AccountDeletionController = {
    async request(req: any, res: any) {
        const reqData: AccountDeletionRequest = { id: `del_${Date.now()}`, ...req.body, status: 'pending', createdAt: new Date().toISOString() };
        db.accountDeletionRequests.push(reqData);
        saveDb();
        return res.status(201).json(reqData);
    }
};

// 11. Push Notification
export const PushNotificationController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.pushNotificationConfigs.get(userId) || {});
    },
    async update(req: any, res: any) {
        const { userId } = req.params;
        db.pushNotificationConfigs.set(userId, { userId, ...req.body });
        saveDb();
        return res.status(200).json({ success: true });
    }
};

// 12. Watermark
export const WatermarkController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.watermarkConfigs.get(userId) || {});
    },
    async update(req: any, res: any) {
        const { userId } = req.params;
        db.watermarkConfigs.set(userId, { userId, ...req.body });
        saveDb();
        return res.status(200).json({ success: true });
    }
};

// 13. Profile Tag
export const ProfileTagController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.profileTags);
    }
};

// 14. Profession
export const ProfessionController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.professions);
    }
};

// 15. Emotional Status
export const EmotionalStatusController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.emotionalStatus);
    }
};

// 16. Zoom
export const ZoomController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.zoomConfigs.get(userId) || {});
    },
    async update(req: any, res: any) {
        const { userId } = req.params;
        db.zoomConfigs.set(userId, { userId, ...req.body });
        saveDb();
        return res.status(200).json({ success: true });
    }
};

// 17. Pip
export const PipController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.pipConfigs.get(userId) || {});
    },
    async update(req: any, res: any) {
        const { userId } = req.params;
        db.pipConfigs.set(userId, { userId, ...req.body });
        saveDb();
        return res.status(200).json({ success: true });
    }
};

// 18. Language
export const LanguageController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.languageConfigs.get(userId) || {});
    },
    async update(req: any, res: any) {
        const { userId } = req.params;
        db.languageConfigs.set(userId, { userId, ...req.body });
        saveDb();
        return res.status(200).json({ success: true });
    }
};

// 19. Private Stream Config
export const PrivateStreamConfigController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.privateStreamConfigs.get(userId) || {});
    },
    async update(req: any, res: any) {
        const { userId } = req.params;
        db.privateStreamConfigs.set(userId, { userId, ...req.body });
        saveDb();
        return res.status(200).json({ success: true });
    }
};

// 20. PK Battle
export const PKBattleController = {
    async get(req: any, res: any) {
        const { streamId } = req.params;
        return res.status(200).json(db.pkBattles.get(streamId) || {});
    }
};

// 21. User Media
export const UserMediaController = {
    async list(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.userMedias.filter(m => m.userId === userId));
    }
};

// 22. Level Privilege
export const LevelPrivilegeController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.levelPrivileges);
    }
};

// 23. Stream Viewer
export const StreamViewerController = {
    async list(req: any, res: any) {
        const { streamId } = req.params;
        return res.status(200).json(db.streamViewers.filter(v => v.streamId === streamId));
    }
};

// 24. Profile Share
export const ProfileShareController = {
    async create(req: any, res: any) {
        const share: ProfileShare = { id: `ps_${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
        db.profileShares.push(share);
        saveDb();
        return res.status(201).json(share);
    }
};

// 25. Stream Moderation Log
export const StreamModerationLogController = {
    async list(req: any, res: any) {
        const { streamId } = req.params;
        return res.status(200).json(db.streamModerationLogs.filter(l => l.streamId === streamId));
    }
};

// 26. Payment Transaction
export const PaymentTransactionController = {
    async create(req: any, res: any) {
        const tx: PaymentTransaction = { id: `tx_${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
        db.paymentTransactions.push(tx);
        saveDb();
        return res.status(201).json(tx);
    }
};

// 27. Loading Config
export const LoadingConfigController = {
    async get(req: any, res: any) {
        return res.status(200).json(db.loadingConfigs[0] || {});
    }
};

// 28. Invite Restriction
export const InviteRestrictionController = {
    async get(req: any, res: any) {
        const { streamId } = req.params;
        const resData = db.inviteRestrictions.find(r => r.streamId === streamId) || {};
        return res.status(200).json(resData);
    }
};

// 29. Main Screen Streamer
export const MainScreenStreamerController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.mainScreenStreamers);
    }
};

// 30. FAQ
export const FAQController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.faqs);
    }
};

// 31. Stream Manual
export const StreamManualController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.streamManuals);
    }
};

// 32. Beauty Effect
export const BeautyEffectController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.beautyEffects);
    }
};

// 33. Gift Animation
export const GiftAnimationController = {
    async get(req: any, res: any) {
        const { giftId } = req.params;
        return res.status(200).json(db.giftAnimationConfigs.find(c => c.giftId === giftId) || {});
    }
};

// 34. Frame Metadata
export const FrameMetadataController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.frameMetadata);
    }
};

// 35. Search History
export const SearchHistoryController = {
    async list(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.searchHistory.filter(h => h.userId === userId));
    }
};

// 36. Camera Permission
export const CameraPermissionController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.cameraPermissionStates.get(userId) || {});
    }
};

// 37. Location Permission
export const LocationPermissionController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.locationPermissionStates.get(userId) || {});
    }
};

// 38. Login State
export const LoginStateController = {
    async list(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.loginStates.filter(s => s.userId === userId));
    }
};

// 39. Market User
export const MarketUserController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.marketUsers.get(userId) || {});
    }
};

// 40. Market Frame
export const MarketFrameController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.marketFrames);
    }
};

// 41. Market Gift
export const MarketGiftController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.marketGifts);
    }
};

// 42. Message User
export const MessageUserController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.messageUsers.get(userId) || {});
    }
};

// 43. Message Conversation
export const MessageConversationController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.messageConversations);
    }
};

// 44. Message Friend Request
export const MessageFriendRequestController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.messageFriendRequests);
    }
};

// 45. Level User
export const LevelUserController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.levelUsers.get(userId) || {});
    }
};

// 46. Stream Contributor
export const StreamContributorController = {
    async list(req: any, res: any) {
        const { streamId } = req.params;
        return res.status(200).json(db.streamContributors.filter(c => c.streamId === streamId));
    }
};

// 47. Stream Summary
export const StreamSummaryController = {
    async get(req: any, res: any) {
        const { streamId } = req.params;
        return res.status(200).json(db.streamSummaries.filter(s => s.streamId === streamId));
    }
};

// 48. Specific Frame Inventory
export const SpecificFrameInventoryController = {
    async list(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.specificFrameInventories.filter(i => i.userId === userId));
    }
};

// 49. Earnings Policy
export const EarningsPolicyController = {
    async get(req: any, res: any) {
        return res.status(200).json(db.earningsPolicy);
    }
};

// 50. Wallet Data
export const WalletDataController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        const w = db.walletData.find(w => w.userId === userId) || { userId, diamonds: 0, earnings: 0, updatedAt: new Date().toISOString() };
        return res.status(200).json(w);
    }
};

// 51. Follow
export const FollowController = {
    async list(req: any, res: any) {
        // Return structured follow objects instead of just user list
        const { userId } = req.params;
        const follows = Array.from(db.following.get(userId) || []).map(fid => ({ followerId: userId, followedId: fid }));
        return res.status(200).json(follows);
    }
};

// 52. Block
export const BlockController = {
    async list(req: any, res: any) {
        const { userId } = req.params;
        const blocks = Array.from(db.blocklist.get(userId) || []).map(bid => ({ blockerId: userId, blockedId: bid }));
        return res.status(200).json(blocks);
    }
};

// 53. Visit
export const VisitController = {
    async list(req: any, res: any) {
        const { userId } = req.params;
        return res.status(200).json(db.visits.get(userId) || []);
    }
};

// 54. User Profile
export const UserProfileController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        const p = db.userProfiles.find(u => u.userId === userId) || {};
        return res.status(200).json(p);
    }
};

// 55. Gift Notification Config
export const GiftNotificationConfigController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        const c = db.giftNotificationConfigs.find(c => c.userId === userId) || {};
        return res.status(200).json(c);
    }
};

// 56. Avatar Frame
export const AvatarFrameController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.avatarFramesCatalog);
    }
};

// 57. PK Config
export const PKConfigController = {
    async get(req: any, res: any) {
        const { userId } = req.params;
        const c = db.pkConfigs.find(c => c.userId === userId) || { userId, duration: 5 };
        return res.status(200).json(c);
    }
};

// 58. Google Registration
export const GoogleRegistrationController = {
    async create(req: any, res: any) {
        const reg: GoogleRegistration = { id: `greg_${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
        db.googleRegistrations.push(reg);
        saveDb();
        return res.status(201).json(reg);
    }
};

// 59. Google Password
export const GooglePasswordController = {
    async create(req: any, res: any) {
        const pass: GooglePassword = { id: `gpass_${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
        db.googlePasswords.push(pass);
        saveDb();
        return res.status(201).json({ success: true });
    }
};

// 60. Region
export const RegionController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.regions);
    }
};

// 61. Country
export const CountryController = {
    async list(req: any, res: any) {
        return res.status(200).json(db.countries); // Using existing collection but exposed via specific controller
    }
};

// 62. LiveStreamController (State)
export const LiveStreamController = {
    async get(req: any, res: any) {
         const { id } = req.params;
         const session = db.liveSessions.get(id);
         return res.status(200).json(session || {});
    }
};
