
import { db, CURRENT_USER_ID, createChatKey, saveDb, levelProgression, avatarFrames } from './database';
import { User, Streamer, Message, RankedUser, Gift, Conversation, PurchaseRecord, EligibleUser, FeedPhoto, Obra, GoogleAccount, LiveSessionState, StreamHistoryEntry, Visitor, NotificationSettings, BeautySettings, LevelInfo } from '../types';
import { webSocketServerInstance } from './websocket';

interface ApiResponse {
  status: number;
  data?: any;
  error?: string;
}

const diamondPurchasePackages = [
  // Sorted from smallest to largest for easier iteration
  { diamonds: 800, price: 7 },
  { diamonds: 3000, price: 25 },
  { diamonds: 6000, price: 60 },
  { diamonds: 20000, price: 200 },
  { diamonds: 36000, price: 400 },
  { diamonds: 60000, price: 650 },
];

/**
 * Helper to truncate to 2 decimal places (floor rounding).
 * @param value The number to truncate.
 * @returns The truncated number.
 */
const truncateBRL = (value: number): number => {
    return Math.floor(value * 100) / 100;
};


/**
 * Calculates the gross BRL value of diamonds based on withdrawal tiers.
 * It finds the highest applicable tier and uses that tier's rate for the entire amount.
 * @param diamonds The number of diamonds to convert.
 * @returns The value in BRL with full precision.
 */
function calculateGrossBRL(diamonds: number): number {
  if (diamonds <= 0) {
    return 0;
  }

  // Find the highest tier the user's diamond amount qualifies for
  let applicableTier: { diamonds: number; price: number } | null = null;
  // The packages are sorted from smallest to largest
  for (const pkg of diamondPurchasePackages) {
    if (diamonds >= pkg.diamonds) {
      applicableTier = pkg;
    } else {
      // We've gone past the applicable tiers
      break;
    }
  }

  // If no tier is met (amount is less than smallest package), use the smallest package's rate
  if (!applicableTier) {
    const smallestPackage = diamondPurchasePackages[0];
    if (!smallestPackage) return 0; // Should not happen
    const rate = smallestPackage.price / smallestPackage.diamonds;
    return diamonds * rate;
  }

  // Use the rate from the determined tier
  const rate = applicableTier.price / applicableTier.diamonds;
  return diamonds * rate;
}

// --- NEW HELPER FUNCTION TO HANDLE LEVEL-UPS ---
const updateUserLevel = (user: User): User => {
    if (user.xp === undefined) user.xp = 0;
    if (user.level === undefined) user.level = 1;

    // Find the next level in the progression table
    let nextLevelInfo = levelProgression.find(l => l.level === user.level + 1);

    // Keep leveling up as long as the user has enough XP for the next level
    while (nextLevelInfo && user.xp >= nextLevelInfo.xpRequired) {
        user.level++;
        // Find the info for the new "next" level
        nextLevelInfo = levelProgression.find(l => l.level === user.level + 1);
    }
    
    return user;
};


// Main router function
export const mockApiRouter = (method: string, path: string, body?: any): ApiResponse => {
  console.log(`[API MOCK] ${method} ${path}`, body);
  const url = new URL(path, 'http://localhost:3000'); // Base URL doesn't matter, just for parsing
  const pathParts = url.pathname.split('/').filter(p => p);
  const entity = pathParts[1];
  const id = pathParts[2];
  const subEntity = pathParts[3];

  try {
    if (entity === 'admin') {
        if (id === 'withdrawal-method' && method === 'POST') {
            const adminUser = db.users.get(CURRENT_USER_ID);
            if (adminUser) {
                adminUser.adminWithdrawalMethod = { email: body.email };
                db.users.set(CURRENT_USER_ID, adminUser);
                saveDb();
                return { status: 200, data: { success: true, user: adminUser } };
            }
            return { status: 404, error: "Admin user not found." };
        }
        if (id === 'withdraw' && method === 'POST') {
            const adminUser = db.users.get(CURRENT_USER_ID);
            const platformBalance = db.platform_earnings;
            if (adminUser && platformBalance > 0) {
                const transaction: PurchaseRecord = {
                    id: `admin_withdraw_${Date.now()}`,
                    userId: CURRENT_USER_ID,
                    type: 'withdraw_platform_earnings',
                    description: `Saque da Plataforma para ${adminUser.adminWithdrawalMethod?.email}`,
                    amountBRL: truncateBRL(platformBalance),
                    amountCoins: 0,
                    status: 'Concluído',
                    timestamp: new Date().toISOString()
                };
                db.purchases.unshift(transaction);
                db.platform_earnings = 0; // Reset platform earnings
                
                // Update the user object in the DB before broadcasting
                adminUser.platformEarnings = 0;
                db.users.set(CURRENT_USER_ID, adminUser);
                saveDb();

                webSocketServerInstance.broadcastUserUpdate(adminUser);
                return { status: 200, data: { success: true, message: `Saque de R$ ${transaction.amountBRL.toFixed(2)} solicitado.` } };
            }
            return { status: 400, error: "No balance to withdraw or admin user not found." };
        }
        if (id === 'history' && method === 'GET') {
            const status = url.searchParams.get('status');
            let history = db.purchases.filter(p => p.type === 'withdraw_platform_earnings');
            if (status && status !== 'all') {
                history = history.filter(p => p.status === status);
            }
            return { status: 200, data: history };
        }
    }

    if (entity === 'sim') {
        if (id === 'status' && method === 'POST') {
            const user = db.users.get(CURRENT_USER_ID);
            if (user) {
                user.isOnline = body.isOnline;
                user.lastSeen = new Date().toISOString();
                db.users.set(CURRENT_USER_ID, user);
                saveDb();
                webSocketServerInstance.broadcastUserUpdate(user); // Notify others
                return { status: 200, data: { success: true, user } };
            }
            return { status: 404, error: 'User not found' };
        }
    }

    if (entity === 'webhooks') {
      if (id === 'mercado-pago' && method === 'POST') {
        // This endpoint is no longer used for withdrawals but is kept for potential other integrations.
        const { transactionId, status } = body;
        console.log(`[Webhook] Received update for transaction ${transactionId} with status ${status}`);
        return { status: 200, data: { success: true } };
      }
    }
    
    if (entity === 'accounts') {
        if (id === 'google') {
            if (method === 'GET' && !subEntity) {
                return { status: 200, data: db.googleAccounts };
            }
            if (method === 'GET' && subEntity === 'connected') {
                return { status: 200, data: db.userConnectedAccounts.get(CURRENT_USER_ID)?.google || [] };
            }
            if (method === 'POST' && subEntity === 'disconnect') {
                const accounts = db.userConnectedAccounts.get(CURRENT_USER_ID);
                if (accounts?.google) {
                    accounts.google = accounts.google.filter(acc => acc.email !== body.email);
                    saveDb();
                }
                return { status: 200, data: { success: true } };
            }
        }
    }

    if (entity === 'notifications') {
        if (id === 'settings' && subEntity) {
            const userId = subEntity;
            if (method === 'GET') {
                const settings = db.notificationSettings.get(userId);
                if (settings) {
                    return { status: 200, data: settings };
                }
                const defaultSettings: NotificationSettings = { newMessages: true, streamerLive: true, followedPosts: false, pedido: true, interactive: true };
                return { status: 200, data: defaultSettings };
            }
            if (method === 'POST') {
                const currentSettings = db.notificationSettings.get(userId) || { newMessages: true, streamerLive: true, followedPosts: false, pedido: true, interactive: true };
                const newSettings = { ...currentSettings, ...body };
                db.notificationSettings.set(userId, newSettings);
                saveDb();
                return { status: 200, data: { settings: newSettings } };
            }
        }
    }
    
    if (entity === 'settings') {
        if (id === 'private-stream' && subEntity) {
            const userId = subEntity;
            const user = db.users.get(userId);
            if (user) {
                if (method === 'GET') {
                    return { status: 200, data: { settings: user.privateStreamSettings } };
                }
                if (method === 'POST') {
                    user.privateStreamSettings = { ...(user.privateStreamSettings || {}), ...body.settings };
                    db.users.set(userId, user);
                    saveDb();
                    webSocketServerInstance.broadcastUserUpdate(user);
                    return { status: 200, data: { success: true, user } };
                }
            }
            return { status: 404, error: "User not found" };
        }
        if (id === 'gift-notifications' && subEntity) { // subEntity is userId
            const userId = subEntity;
            if (method === 'GET') {
                const settings = db.giftNotificationSettings.get(userId);
                if (settings) {
                    return { status: 200, data: { settings } };
                }
                // If no settings exist, create default (all true)
                const defaultSettings = db.gifts.reduce((acc, gift) => ({ ...acc, [gift.name]: true }), {});
                db.giftNotificationSettings.set(userId, defaultSettings);
                saveDb();
                return { status: 200, data: { settings: defaultSettings } };
            }
            if (method === 'POST') {
                db.giftNotificationSettings.set(userId, body.settings);
                saveDb();
                return { status: 200, data: { success: true } };
            }
        }
        if (id === 'beauty' && subEntity) { // subEntity is userId
            const userId = subEntity;
            if (method === 'GET') {
                const settings = db.beautySettings.get(userId);
                if (settings) return { status: 200, data: settings };
                return { status: 200, data: {} };
            }
            if (method === 'POST') {
                db.beautySettings.set(userId, body.settings);
                saveDb();
                return { status: 200, data: { success: true } };
            }
        }
    }
    
    if (entity === 'live') {
        if (method === 'GET' && id) { // This is /api/live/:category
            const category = id;
            const country = url.searchParams.get('country');
            
            let filteredStreamers = [...db.streamers];

            if (country) {
                filteredStreamers = filteredStreamers.filter(s => s.country === country);
            }

            switch (category) {
                case 'popular':
                    filteredStreamers.sort((a, b) => (b.viewers || 0) - (a.viewers || 0));
                    break;
                case 'followed':
                    const followedIds = db.following.get(CURRENT_USER_ID) || new Set();
                    filteredStreamers = filteredStreamers.filter(s => followedIds.has(s.hostId));
                    break;
                case 'nearby':
                    filteredStreamers = filteredStreamers.filter(s => s.tags.includes('Perto'));
                    break;
                case 'pk':
                    filteredStreamers = filteredStreamers.filter(s => s.tags.includes('PK'));
                    break;
                case 'new':
                    filteredStreamers = filteredStreamers.filter(s => s.tags.includes('Novo'));
                    break;
                case 'music':
                    filteredStreamers = filteredStreamers.filter(s => s.tags.includes('Musica'));
                    break;
                case 'dance':
                    filteredStreamers = filteredStreamers.filter(s => s.tags.includes('Dança'));
                    break;
                case 'party':
                    filteredStreamers = filteredStreamers.filter(s => s.tags.includes('Festa'));
                    break;
                case 'private':
                    filteredStreamers = filteredStreamers.filter(s => s.isPrivate);
                    break;
                default:
                    break;
            }
            
            return { status: 200, data: filteredStreamers };
        }
    }
    
    if (entity === 'users') {
        if (id === 'me' && subEntity === 'blocklist' && method === 'GET') {
            const user = db.users.get(CURRENT_USER_ID);
            if (!user) return { status: 401, error: "Unauthorized" };
            const blockedIds = db.blocklist.get(CURRENT_USER_ID) || new Set<string>();
            const blockedUsers = Array.from(blockedIds).map(id => db.users.get(id)).filter((u): u is User => !!u);
            return { status: 200, data: blockedUsers };
        }

        if (id === 'me' && !subEntity) {
            const user = db.users.get(CURRENT_USER_ID);
            if (user) {
                user.platformEarnings = db.platform_earnings;
            }
            return { status: 200, data: user };
        }
        if (method === 'GET' && !id) {
            return { status: 200, data: Array.from(db.users.values()) };
        }
        if (id) {
            if (subEntity === 'block' && method === 'POST') {
                const blockerId = CURRENT_USER_ID;
                const blockedId = id;
                if (!db.blocklist.has(blockerId)) {
                    db.blocklist.set(blockerId, new Set());
                }
                db.blocklist.get(blockerId)!.add(blockedId);
    
                // Remove relationships
                db.following.get(blockerId)?.delete(blockedId);
                db.fans.get(blockedId)?.delete(blockerId);
                db.following.get(blockedId)?.delete(blockerId);
                db.fans.get(blockerId)?.delete(blockerId);
                
                saveDb();
                return { status: 200, data: { success: true } };
            }
    
            if (subEntity === 'unblock' && method === 'DELETE') {
                const blockerId = CURRENT_USER_ID;
                const unblockedId = id;
                db.blocklist.get(blockerId)?.delete(unblockedId);
                saveDb();
                return { status: 200, data: { success: true } };
            }

            if (method === 'DELETE') {
                db.users.delete(id);
                saveDb();
                return { status: 200, data: { success: true } };
            }
            if (method === 'PATCH') {
                const user = db.users.get(id);
                if (user) {
                    const updatedUser = { ...user, ...body };
                    if (updatedUser.id === CURRENT_USER_ID) {
                        updatedUser.platformEarnings = db.platform_earnings;
                    }
                    db.users.set(id, updatedUser);
                    saveDb();
                    webSocketServerInstance.broadcastUserUpdate(updatedUser);
                    return { status: 200, data: { success: true, user: updatedUser } };
                }
            }
            if(subEntity === 'toggle-follow') {
                const followerId = CURRENT_USER_ID;
                const followedId = id;

                const followerFollowing = db.following.get(followerId) || new Set<string>();
                const followedFans = db.fans.get(followedId) || new Set<string>();
                
                const isUnfollow = followerFollowing.has(followedId);

                if (isUnfollow) {
                    followerFollowing.delete(followedId);
                    followedFans.delete(followerId);
                } else {
                    followerFollowing.add(followedId);
                    followedFans.add(followerId);
                }

                db.following.set(followerId, followerFollowing);
                db.fans.set(followedId, followedFans);

                const updatedFollower = db.users.get(followerId)!;
                updatedFollower.following = followerFollowing.size;
                const updatedFollowed = db.users.get(followedId)!;
                updatedFollowed.fans = followedFans.size;
                
                // isFollowed is relative to the CURRENT_USER
                updatedFollowed.isFollowed = !isUnfollow;

                saveDb();
                
                webSocketServerInstance.broadcastGlobalFollowUpdate(updatedFollower, updatedFollowed, isUnfollow);
                if (!isUnfollow) webSocketServerInstance.notifyNewFollower(followedId, updatedFollower);

                return { status: 200, data: { success: true, updatedFollower, updatedFollowed } };
            }
            // Other user-specific routes
             const user = db.users.get(id);
             if (user) {
                user.isFollowed = db.following.get(CURRENT_USER_ID)?.has(id);
             }
             if (subEntity === 'fans') return { status: 200, data: Array.from(db.fans.get(id) || []).map(fanId => db.users.get(fanId)) };
             if (subEntity === 'following') return { status: 200, data: Array.from(db.following.get(id) || []).map(fId => db.users.get(fId)) };
             if (subEntity === 'received-gifts' && method === 'GET') {
                const received = db.receivedGifts.get(id) || [];
                return { status: 200, data: received };
             }
             if (subEntity === 'friends') {
                const followingIds = db.following.get(id) || new Set();
                const friends = Array.from(followingIds).filter(followedId => db.following.get(followedId)?.has(id)).map(friendId => db.users.get(friendId));
                return { status: 200, data: friends };
             }
             if (subEntity === 'messages') return { status: 200, data: db.conversations.filter(c => c.id.includes(id))};
             if (subEntity === 'status') return { status: 200, data: { isOnline: user?.isOnline, lastSeen: user?.lastSeen } };
             if (subEntity === 'photos') return { status: 200, data: db.photoFeed.filter(p => p.user.id === id) };
             if (subEntity === 'liked-photos') {
                const likedPhotoIds = db.photoLikes.get(id) || new Set();
                const likedPhotos = db.photoFeed.filter(p => likedPhotoIds.has(p.id));
                const feedWithLikes = likedPhotos.map((photo: FeedPhoto) => ({
                    ...photo, 
                    isLiked: db.photoLikes.get(photo.id)?.has(CURRENT_USER_ID) || false,
                    likes: db.photoLikes.get(photo.id)?.size || 0,
                }));
                return { status: 200, data: feedWithLikes };
             }
             if (subEntity === 'level-info') {
                if (!user) return { status: 404, error: 'User not found' };
                const currentLevelInfo = levelProgression[user.level - 1] || levelProgression[0];
                const nextLevelInfo = levelProgression[user.level];
                const info: LevelInfo = {
                    level: user.level, xp: user.xp || 0,
                    xpForCurrentLevel: currentLevelInfo.xpRequired,
                    xpForNextLevel: nextLevelInfo?.xpRequired || currentLevelInfo.xpRequired,
                    progress: nextLevelInfo ? (((user.xp || 0) - currentLevelInfo.xpRequired) / (nextLevelInfo.xpRequired - currentLevelInfo.xpRequired)) * 100 : 100,
                    privileges: currentLevelInfo.privileges,
                    nextRewards: nextLevelInfo?.privileges || [],
                };
                return { status: 200, data: info };
             }
             if (subEntity === 'visit') {
                const visits = db.visits.get(id) || [];
                const newVisits = [{ visitorId: body.userId, timestamp: new Date().toISOString() }, ...visits.filter(v => v.visitorId !== body.userId)];
                db.visits.set(id, newVisits.slice(0, 50));
                saveDb();
                return { status: 200, data: {} };
             }
             if (subEntity === 'buy-diamonds') {
                 if (user) {
                     user.diamonds += body.amount;
                     const purchaseRecord: PurchaseRecord = {
                        id: `purchase_${Date.now()}`,
                        userId: user.id,
                        type: 'purchase_diamonds',
                        description: `Compra de ${body.amount} diamantes`,
                        amountBRL: body.price,
                        amountCoins: body.amount,
                        status: 'Concluído',
                        timestamp: new Date().toISOString()
                     };
                     db.purchases.unshift(purchaseRecord);
                     db.platform_earnings = (db.platform_earnings || 0) + body.price; // Add to platform earnings
                     saveDb();
                     webSocketServerInstance.broadcastUserUpdate(user);
                     webSocketServerInstance.broadcastTransactionUpdate(purchaseRecord);
                     return { status: 200, data: { success: true, user } };
                 }
             }
             if (subEntity === 'location-permission') {
                 if(method === 'GET') return { status: 200, data: { status: user?.locationPermission || 'prompt' } };
                 if(method === 'POST') {
                    if (user) {
                        user.locationPermission = body.status;
                        saveDb();
                        return { status: 200, data: { success: true, user } };
                    }
                 }
             }
             if (subEntity === 'privacy') {
                if (method === 'POST' && pathParts[4] === 'activity') {
                     if (user) {
                        user.showActivityStatus = body.show;
                        user.isOnline = body.show;
                        saveDb();
                        webSocketServerInstance.broadcastUserUpdate(user);
                        return { status: 200, data: { success: true, user } };
                    }
                }
                if (method === 'POST' && pathParts[4] === 'location') {
                   if (user) {
                        user.showLocation = body.show;
                        saveDb();
                        webSocketServerInstance.broadcastUserUpdate(user);
                        return { status: 200, data: { success: true, user } };
                    }
                }
             }
             if (subEntity === 'set-active-frame' && method === 'POST') {
                const { frameId } = body;
                const user = db.users.get(id);
                if (!user) return { status: 404, error: "User not found." };
                
                // If frameId is null, we are unequipping
                if (frameId === null) {
                    user.activeFrameId = null;
                    user.frameExpiration = null;
                    db.users.set(id, user);
                    saveDb();
                    webSocketServerInstance.broadcastUserUpdate(user);
                    return { status: 200, data: { success: true, user } };
                }
            
                // Check if user owns the frame and it's not expired
                const ownedFrame = user.ownedFrames.find(f => f.frameId === frameId);
                if (ownedFrame && new Date(ownedFrame.expirationDate) > new Date()) {
                    user.activeFrameId = frameId;
                    user.frameExpiration = ownedFrame.expirationDate;
                    db.users.set(id, user);
                    saveDb();
                    webSocketServerInstance.broadcastUserUpdate(user);
                    return { status: 200, data: { success: true, user } };
                }
                
                return { status: 400, error: "Você não possui esta moldura ou ela expirou." };
            }

             if(method === 'GET' && !subEntity) return { status: 200, data: user };
        }
    }
    
    if (entity === 'permissions') {
        if (id === 'camera' && subEntity) { // subEntity is userId
            const userId = subEntity;
            if (method === 'GET') {
                const userPermissions = db.permissions.get(userId);
                return { status: 200, data: { status: userPermissions?.camera || 'prompt' } };
            }
            if (method === 'POST') {
                const userPermissions = db.permissions.get(userId) || { camera: 'prompt', microphone: 'prompt' };
                userPermissions.camera = body.status;
                db.permissions.set(userId, userPermissions);
                saveDb();
                return { status: 200, data: {} };
            }
        }
        if (id === 'microphone' && subEntity) { // subEntity is userId
            const userId = subEntity;
            if (method === 'GET') {
                const userPermissions = db.permissions.get(userId);
                return { status: 200, data: { status: userPermissions?.microphone || 'prompt' } };
            }
            if (method === 'POST') {
                const userPermissions = db.permissions.get(userId) || { camera: 'prompt', microphone: 'prompt' };
                userPermissions.microphone = body.status;
                db.permissions.set(userId, userPermissions);
                saveDb();
                return { status: 200, data: {} };
            }
        }
    }

    if (entity === 'earnings') {
      if (id === 'get' && subEntity) { // GET /api/earnings/get/:userId
        const userId = subEntity;
        const user = db.users.get(userId);
        if (user) {
          const available_diamonds = user.earnings;
          const gross_brl_full = calculateGrossBRL(available_diamonds);
          const platform_fee_brl_full = gross_brl_full * 0.20;
          const net_brl_full = gross_brl_full - platform_fee_brl_full;
          
          return { status: 200, data: { 
              available_diamonds, 
              gross_brl: truncateBRL(gross_brl_full), 
              platform_fee_brl: truncateBRL(platform_fee_brl_full), 
              net_brl: truncateBRL(net_brl_full) 
          }};
        }
        return { status: 404, error: "User not found" };
      }
      if (id === 'calculate' && method === 'POST') { // POST /api/earnings/calculate
        const amount = body.amount;
        if (typeof amount !== 'number' || amount < 0) {
          return { status: 400, error: 'Invalid amount' };
        }
        const gross_value_full = calculateGrossBRL(amount);
        const platform_fee_full = gross_value_full * 0.20;
        const net_value_full = gross_value_full - platform_fee_full;

        return { status: 200, data: { 
            gross_value: truncateBRL(gross_value_full), 
            platform_fee: truncateBRL(platform_fee_full), 
            net_value: truncateBRL(net_value_full) 
        }};
      }
      if (id === 'withdraw' && subEntity && method === 'POST') { // POST /api/earnings/withdraw/:userId
        const userId = subEntity;
        const amount = body.amount; // amount in diamonds
        const user = db.users.get(userId);

        if (!user) return { status: 404, error: "User not found" };
        if (!user.withdrawal_method) return { status: 400, error: "Método de saque não configurado."};
        if (user.earnings < amount) return { status: 400, error: "Saldo de ganhos insuficiente."};
        
        const grossBRLFull = calculateGrossBRL(amount);
        const feeFull = grossBRLFull * 0.20; // platform fee
        const netBRLFull = grossBRLFull - feeFull; // streamer gets this
        
        // Process withdrawal
        user.earnings -= amount;
        user.earnings_withdrawn = (user.earnings_withdrawn || 0) + amount;
        
        // Add fee to platform earnings
        db.platform_earnings += feeFull;

        const transaction: PurchaseRecord = {
          id: `withdraw_${Date.now()}`,
          userId: user.id,
          type: 'withdraw_earnings',
          description: `Saque para ${user.withdrawal_method.method}`,
          amountBRL: truncateBRL(netBRLFull),
          amountCoins: amount,
          status: 'Concluído', // Mark as completed immediately
          timestamp: new Date().toISOString()
        };
        db.purchases.unshift(transaction);
        db.users.set(userId, user);
        saveDb();

        // Broadcast updates immediately
        webSocketServerInstance.broadcastUserUpdate(user);
        webSocketServerInstance.broadcastTransactionUpdate(transaction);
        
        // If the platform owner is online, send them an update with the new earnings total
        const adminUser = db.users.get(CURRENT_USER_ID);
        if (adminUser) {
            const updatedAdmin = { ...adminUser, platformEarnings: db.platform_earnings };
            // This will push an update specifically to the admin user client
            webSocketServerInstance.broadcastUserUpdate(updatedAdmin);
        }

        // Return success with the updated user
        return { status: 200, data: { success: true, user } };
      }
       if (id === 'method' && subEntity === 'set' && pathParts[4] && method === 'POST') {
          const userId = pathParts[4];
          const user = db.users.get(userId);
          if (user) {
              user.withdrawal_method = { method: body.method, details: body.details };
              saveDb();
              return { status: 200, data: { success: true, user } };
          }
          return { status: 404, error: "User not found" };
      }
    }
    
    if (entity === 'streams') {
        // POST /api/streams - Create a new stream draft
        if (method === 'POST' && !id) {
            const host = db.users.get(CURRENT_USER_ID);
            if (!host) return { status: 401, error: "Current user not found to create a stream." };

            const newStream: Streamer = {
                id: `stream_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                hostId: host.id,
                name: `Live de ${host.name}`,
                avatar: host.avatarUrl,
                location: host.location || 'Brasil',
                time: new Date().toISOString(),
                message: 'Venha me ver!',
                tags: ['new'],
                isPrivate: false,
                viewers: 0,
                quality: '480p',
                country: host.country || 'br',
            };
            db.streamers.unshift(newStream);
            saveDb();
            return { status: 201, data: newStream };
        }
        if (id === 'manual' && method === 'GET') {
            return { status: 200, data: db.liveStreamManual };
        }
        if (id === 'effects' && method === 'GET') {
            return { status: 200, data: db.beautyEffects };
        }
        if (id) {
            const streamIndex = db.streamers.findIndex(s => s.id === id);
            const stream = streamIndex > -1 ? db.streamers[streamIndex] : null;

            if (subEntity === 'end-session' && method === 'POST') {
                if (!stream) return { status: 404, error: "Stream not found" };
    
                const host = db.users.get(stream.hostId);
                if (!host) return { status: 404, error: "Host not found" };
    
                host.isLive = false;
                db.users.set(stream.hostId, host);
    
                db.streamers = db.streamers.filter(s => s.id !== id);
                
                db.liveSessions.delete(id);
                db.streamRooms.delete(id);
                db.kickedUsers.delete(id);
                db.moderators.delete(id);
                db.pkBattles.delete(id);
    
                saveDb();
    
                webSocketServerInstance.broadcastUserUpdate(host);
    
                return { status: 200, data: { success: true, user: host } };
            }

            if (!stream) return { status: 404, error: "Stream not found" };

            if (subEntity === 'online-users' && method === 'GET') {
                const streamId = id;
                const roomUserIds = db.streamRooms.get(streamId);
                if (!roomUserIds) {
                    const host = db.users.get(stream.hostId);
                    if (host) {
                        return { status: 200, data: [{ ...host, value: 0 }] };
                    }
                    return { status: 200, data: [] };
                }

                const session = db.liveSessions.get(streamId);
                const giftSenders = session?.giftSenders;

                const usersWithValue = Array.from(roomUserIds)
                    .map(userId => {
                        const user = db.users.get(userId);
                        if (!user) return null;
                        
                        const contribution = giftSenders?.get(userId)?.sessionContribution || 0;
                        
                        return { ...user, value: contribution };
                    })
                    .filter((u): u is User & { value: number } => u !== null);

                usersWithValue.sort((a, b) => b.value - a.value);

                return { status: 200, data: usersWithValue };
            }
            if (subEntity === 'save' && method === 'POST') {
                Object.assign(stream, body);
                db.streamers[streamIndex] = stream;
                saveDb();
                return { status: 200, data: { success: true, stream } };
            }
            if (subEntity === 'cover' && method === 'POST') {
                stream.avatar = `https://picsum.photos/seed/${Math.random()}/100/100`;
                db.streamers[streamIndex] = stream;
                saveDb();
                return { status: 200, data: { success: true, stream } };
            }
            if (subEntity === 'gift' && method === 'POST') {
                const streamId = id;
                const { fromUserId, giftName, amount } = body;
                const sender = db.users.get(fromUserId);
                const gift = db.gifts.find(g => g.name === giftName);
                const room = db.streamRooms.get(streamId);
                if (!room) return { status: 404, error: `O usuário ${fromUserId} não conseguiu enviar o presente. Sala ${streamId} não encontrada.` };
                if (!sender || !stream || !gift) return { status: 404, error: 'Sender, stream, or gift not found.' };
                const receiver = db.users.get(stream.hostId);
                if (!receiver) return { status: 404, error: 'Receiver not found.' };
                const totalCost = (gift.price || 0) * amount;
                if (sender.diamonds < totalCost) return { status: 400, data: { success: false, error: 'Not enough diamonds' } };
                sender.diamonds -= totalCost;
                receiver.earnings += totalCost;
                receiver.receptores = (receiver.receptores || 0) + totalCost;
                sender.enviados = (sender.enviados || 0) + totalCost;
                sender.xp = (sender.xp || 0) + totalCost;
                receiver.xp = (receiver.xp || 0) + totalCost;
                const updatedSender = updateUserLevel(sender);
                const updatedReceiver = updateUserLevel(receiver);
                db.users.set(fromUserId, updatedSender);
                db.users.set(stream.hostId, updatedReceiver);

                const received = db.receivedGifts.get(stream.hostId) || [];
                const existingGiftIndex = received.findIndex(g => g.name === giftName);
                if (existingGiftIndex > -1) {
                    received[existingGiftIndex].count += amount;
                } else {
                    received.push({ ...gift, count: amount });
                }
                db.receivedGifts.set(stream.hostId, received);

                const session = db.liveSessions.get(streamId);
                if (session) {
                    if (!session.giftSenders) session.giftSenders = new Map();
                    const senderData = session.giftSenders.get(fromUserId) || { ...sender, giftsSent: [], sessionContribution: 0 };
                    const existingGiftIndexInSession = senderData.giftsSent.findIndex(g => g.name === gift.name);
                    if (existingGiftIndexInSession > -1) {
                        senderData.giftsSent[existingGiftIndexInSession].quantity += amount;
                    } else {
                        senderData.giftsSent.push({ name: gift.name, icon: gift.icon, quantity: amount, component: gift.component });
                    }
                    senderData.sessionContribution += totalCost;
                    session.giftSenders.set(fromUserId, senderData);
                }
                saveDb();
                webSocketServerInstance.broadcastUserUpdate(updatedSender);
                webSocketServerInstance.broadcastUserUpdate(updatedReceiver);
                webSocketServerInstance.broadcastRoomUpdate(streamId);
                return { status: 200, data: { success: true, updatedSender, updatedReceiver } };
            }
        }
    }
    
    if (entity === 'regions' && method === 'GET') {
      return { status: 200, data: db.countries };
    }

    if (entity === 'purchases' && id === 'history' && subEntity && method === 'GET') {
      const userId = subEntity;
      const userPurchases = db.purchases.filter(p => p.userId === userId);
      return { status: 200, data: userPurchases };
    }

    if (entity === 'ranking' && id && method === 'GET') {
      const sortedContributions = Array.from(db.contributions.entries()).sort((a, b) => b[1] - a[1]);
      const rankedUsers: RankedUser[] = sortedContributions.map(([userId, contribution]) => {
        const user = db.users.get(userId);
        return {
          ...user,
          id: userId,
          contribution,
          gender: user?.gender || 'not_specified',
          age: user?.age || 0,
        } as RankedUser;
      }).filter((u): u is RankedUser => !!u?.name);
      return { status: 200, data: rankedUsers.slice(0, 50) };
    }

    if (entity === 'reminders' && method === 'GET') {
      const followedIds = db.following.get(CURRENT_USER_ID) || new Set();
      const reminders = db.streamers.filter(s => followedIds.has(s.hostId));
      return { status: 200, data: reminders };
    }

    if (entity === 'history' && id === 'streams') {
        if (method === 'GET') {
            return { status: 200, data: db.streamHistory };
        }
        if (method === 'POST') {
            const newEntry: StreamHistoryEntry = body;
            db.streamHistory.unshift(newEntry);
            saveDb();
            return { status: 201, data: { success: true } };
        }
    }

    if (entity === 'gifts' && method === 'GET') {
      return { status: 200, data: db.gifts };
    }

    if (entity === 'visitors' && id === 'list' && subEntity && method === 'GET') {
      const userId = subEntity;
      const visits = db.visits.get(userId) || [];
      const visitors = visits.map(v => {
        const user = db.users.get(v.visitorId);
        if (!user) return null;
        return {
          ...user,
          visitTimestamp: v.timestamp
        } as Visitor;
      }).filter((v): v is Visitor => !!v);
      return { status: 200, data: visitors };
    }
    
    if (entity === 'visitors' && id === 'clear' && subEntity && method === 'DELETE') {
        const userId = subEntity;
        db.visits.set(userId, []);
        saveDb();
        return { status: 200, data: { success: true } };
    }

    if (entity === 'effects') {
        if (id === 'purchase-frame' && subEntity && method === 'POST') { // POST /api/effects/purchase-frame/:userId
            const userId = subEntity;
            const { frameId } = body;
            const user = db.users.get(userId);
            const frame = avatarFrames.find(f => f.id === frameId);

            if (!user || !frame) return { status: 404, error: "Usuário ou moldura não encontrado." };
            if (user.diamonds < frame.price) return { status: 400, error: "Diamantes insuficientes." };

            user.diamonds -= frame.price;
            
            const existingFrameIndex = user.ownedFrames.findIndex(f => f.frameId === frameId);
            const expirationDate = new Date();
            
            let finalExpirationDate;

            if (existingFrameIndex > -1) {
                // Extend duration
                const currentExp = new Date(user.ownedFrames[existingFrameIndex].expirationDate);
                const newExp = new Date(Math.max(currentExp.getTime(), Date.now()));
                newExp.setDate(newExp.getDate() + frame.duration);
                user.ownedFrames[existingFrameIndex].expirationDate = newExp.toISOString();
                finalExpirationDate = newExp.toISOString();
            } else {
                expirationDate.setDate(expirationDate.getDate() + frame.duration);
                finalExpirationDate = expirationDate.toISOString();
                user.ownedFrames.push({ frameId, expirationDate: finalExpirationDate });
            }
            
            // Auto-equip the frame upon purchase
            user.activeFrameId = frameId;
            user.frameExpiration = finalExpirationDate;
            
            const purchase: PurchaseRecord = {
                id: `frame_${Date.now()}`,
                userId: user.id,
                type: 'purchase_frame',
                description: `Compra da moldura '${frame.name}'`,
                amountBRL: 0,
                amountCoins: frame.price,
                status: 'Concluído',
                timestamp: new Date().toISOString(),
            };
            db.purchases.unshift(purchase);

            db.users.set(userId, user);
            saveDb();
            webSocketServerInstance.broadcastUserUpdate(user);
            return { status: 200, data: { success: true, user } };
        }
    }
    
    if (entity === 'friends' && id === 'invite' && method === 'POST') {
        const { streamId, inviteeId } = body;
        const inviter = db.users.get(CURRENT_USER_ID);
        const invitee = db.users.get(inviteeId);
        const stream = db.streamers.find(s => s.id === streamId);

        if (inviter && invitee && stream) {
            webSocketServerInstance.sendCoHostInvite(inviteeId, { inviter, stream });
            return { status: 200, data: { success: true, message: `Convite enviado para ${invitee.name}.` } };
        }
        return { status: 404, error: "Usuário ou stream não encontrado." };
    }
    
    if (entity === 'pk') {
        if (id === 'config') {
            if (method === 'GET') {
                return { status: 200, data: db.pkDefaultConfig };
            }
            if (method === 'POST') {
                const { duration } = body;
                if (typeof duration === 'number' && duration > 0) {
                    db.pkDefaultConfig.duration = duration;
                    saveDb();
                    return { status: 200, data: { success: true, config: db.pkDefaultConfig } };
                }
                return { status: 400, error: 'Invalid duration provided.' };
            }
        }
        
        if (id === 'start' && method === 'POST') {
            const { streamId, opponentId } = body;
            const stream = db.streamers.find(s => s.id === streamId);
            if (!stream) {
                return { status: 404, error: "Stream not found." };
            }
            db.pkBattles.set(streamId, {
                opponentId,
                heartsA: 0,
                heartsB: 0,
                scoreA: 0,
                scoreB: 0,
            });
            saveDb();
            // In a real app, you would also notify the opponent.
            // The client handles UI change optimistically.
            return { status: 200, data: { success: true } };
        }

        if (id === 'end' && method === 'POST') {
            const { streamId } = body;
            db.pkBattles.delete(streamId);
            saveDb();
            return { status: 200, data: { success: true } };
        }
        
        if (id === 'heart' && method === 'POST') {
            const { roomId, team } = body;
            const battle = db.pkBattles.get(roomId);
            if (battle) {
                if (team === 'A') {
                    battle.heartsA++;
                } else {
                    battle.heartsB++;
                }
                webSocketServerInstance.broadcastPKHeartUpdate(roomId, battle.heartsA, battle.heartsB);
                return { status: 200, data: { success: true } };
            }
            return { status: 404, error: "Battle not found" };
        }
    }

    if (entity === 'chats' && id && subEntity === 'messages') {
    if (method === 'POST') {
      const otherUserId = id;
      const chatKey = createChatKey(CURRENT_USER_ID, otherUserId);
      const messageId = `msg_${Date.now()}`;
      const newMessage: Message = {
        id: messageId,
        chatId: chatKey,
        from: CURRENT_USER_ID,
        to: otherUserId,
        text: body.text || '',
        ...(body.imageUrl && { imageUrl: body.imageUrl }),
        timestamp: new Date().toISOString(),
        status: 'sent',
        type: body.imageUrl ? 'image' : 'text'
      };
      
      // Save the message
      db.messages.set(messageId, newMessage);
      saveDb();
      
      // Notify via WebSocket
      const currentUser = db.users.get(CURRENT_USER_ID);
      if (currentUser) {
        // Garantir que a imagem seja incluída na mensagem
        const messageToSend = {
          ...newMessage,
          // Incluir a URL da imagem se existir
          ...(body.imageUrl && { imageUrl: body.imageUrl }),
          // Informações do remetente
          user: currentUser.name,
          avatar: currentUser.avatarUrl,
          level: currentUser.level || 1,
          gender: currentUser.gender,
          age: currentUser.age,
          activeFrameId: currentUser.activeFrameId,
          frameExpiration: currentUser.frameExpiration,
          // Para compatibilidade
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatarUrl,
          senderLevel: currentUser.level || 1,
          isVIP: currentUser.isVIP || false
        };
        
        console.log('Enviando mensagem via WebSocket:', messageToSend); // Log para depuração
        webSocketServerInstance.broadcastNewMessageToChat(chatKey, messageToSend, body.tempId);
      }
      
      return { status: 201, data: { ...newMessage, id: messageId } };
    }
    
    // Handle GET /api/chats/:id/messages
        const otherUserId = id;
        const chatKey = createChatKey(CURRENT_USER_ID, otherUserId);
        const allMessages = Array.from(db.messages.values());
        const chatMessages = allMessages.filter(m => m.chatId === chatKey);

        const friendRelationshipExists = db.following.get(CURRENT_USER_ID)?.has(otherUserId) && db.fans.get(CURRENT_USER_ID)?.has(otherUserId);
        const systemNotificationKey = `system_notification_${chatKey}`;
        let chatMetadata = db.chatMetadata.get(chatKey);

        if (friendRelationshipExists && !chatMetadata?.systemNotificationSent) {
            const systemMessage: Message = {
                id: systemNotificationKey,
                chatId: chatKey,
                from: 'system',
                to: 'system',
                text: 'Vocês agora são amigos!',
                timestamp: new Date().toISOString(),
                status: 'read',
                type: 'system-friend-notification'
            };
            if (!chatMessages.some(m => m.id === systemMessage.id)) {
                chatMessages.unshift(systemMessage);
            }
            db.chatMetadata.set(chatKey, { systemNotificationSent: true });
            saveDb();
        }
        
        return { status: 200, data: chatMessages };
    }

  } catch (e) {
    console.error(`[API MOCK] Error processing ${method} ${path}:`, e);
    return { status: 500, error: 'Internal Server Error' };
  }
  
  // Handle user status
  if (method === 'GET' && path.match(/^\/api\/users\/\w+\/status$/)) {
    try {
      const userId = path.split('/')[3];
      const user = db.users.get(userId);
      
      if (!user) {
        return { status: 404, error: 'User not found' };
      }
      
      // Check if user is connected via WebSocket
      const isOnline = webSocketServerInstance.isUserConnected(userId);
      
      return {
        status: 200,
        data: {
          isOnline,
          lastSeen: user.lastSeen || new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching user status:', error);
      return { status: 500, error: 'Failed to fetch user status' };
    }
  }

  // Handle photo uploads
  if (method === 'POST' && path.match(/^\/api\/photos\/upload\/\d+$/)) {
    try {
      const userId = path.split('/').pop();
      if (!userId) {
        return { status: 400, error: 'User ID is required' };
      }
      
      const imageData = body?.image;
      if (!imageData) {
        return { status: 400, error: 'No image data provided' };
      }
      
      // In a real app, you would save the image to a storage service
      // For this mock, we'll use the data URL directly
      const photoUrl = imageData;
      
      // Return the URL in the expected format
      return {
        status: 200,
        data: { 
          url: photoUrl,  // The frontend expects a 'url' field in the response
          success: true,
          message: 'Image uploaded successfully'
        }
      };
    } catch (error) {
      console.error('Error uploading photo:', error);
      return { 
        status: 500, 
        error: 'Failed to upload image',
        data: null
      };
    }
  }
  
  // Return a 404 for any unhandled routes
  console.error(`[API MOCK] Unhandled route: ${method} ${path}`);
  return { status: 404, error: `Unhandled route: ${method} ${path}` };
};