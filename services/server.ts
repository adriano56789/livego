
import { db, CURRENT_USER_ID, createChatKey, saveDb, levelProgression, avatarFrames } from './database';
import { User, Streamer, Message, ChatMessage, RankedUser, Gift, Conversation, PurchaseRecord, EligibleUser, FeedPhoto, Obra, GoogleAccount, LiveSessionState, StreamHistoryEntry, Visitor, NotificationSettings, BeautySettings, LevelInfo, Comment, MusicTrack, Wallet } from '../types';
import { webSocketServerInstance } from './websocket';

// Conjunto para rastrear os IDs de presentes já processados
const processedGiftIds = new Set<string>();



/**
 * Formata a resposta da API para garantir que sempre retorne JSON
 * @param status Código HTTP da resposta
 * @param data Dados a serem retornados (opcional)
 * @param error Mensagem de erro (opcional)
 * @returns Objeto de resposta formatado
 */
function formatResponse(status: number, data?: any, error?: string): ApiResponse {
    return {
        status,
        ...(data && { data }),
        ...(error && { error })
    };
}



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

/**
 * Verifica se um usuário tem permissão de administrador
 * @param userId ID do usuário a ser verificado
 * @returns true se o usuário for administrador, false caso contrário
 */
function isAdmin(userId: string): boolean {
    const ADMIN_IDS = [
        '10755083', // ID do dono
        // Adicionar ID de ambiente apenas se disponível
        ...(typeof window !== 'undefined' && (window as any).VITE_ADMIN_USER_ID ? [(window as any).VITE_ADMIN_USER_ID] : [])
    ].filter(Boolean);
    
    return ADMIN_IDS.includes(userId);
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


// PK Battle State interface
interface PKBattleState {
    opponentId: string;
    heartsA: number;
    heartsB: number;
    scoreA: number;
    scoreB: number;
}

// Main router function
export const mockApiRouter = async (method: string, path: string, body?: any): Promise<ApiResponse> => {
  console.log(`[API MOCK] ${method} ${path}`, body ? 'with body' : '');
  const url = new URL(path, 'http://localhost:5173'); // Base URL doesn't matter, just for parsing
  const pathParts = url.pathname.split('/').filter(p => p);
  const entity = pathParts[1];
  const id = pathParts[2];
  const subEntity = pathParts[3];

  // Rota de tradução
  if (path === '/api/translate' && method === 'POST') {
    try {
      const { text, targetLang, sourceLang } = body;
      
      if (!text || !targetLang) {
        return formatResponse(400, null, 'Text and target language are required');
      }

      // Importa o serviço de tradução dinamicamente para evitar carregamento desnecessário
      const { translateText } = await import('./translationService');
      
      // Se for um array, processa em lote
      if (Array.isArray(text)) {
        const results = await Promise.all(
          text.map(async (item: string) => {
            try {
              const result = await translateText(item, targetLang, sourceLang);
              return {
                text: item,
                translatedText: result.translatedText,
                originalText: result.originalText,
                from: result.from,
                to: result.to,
                fromCache: result.fromCache || false,
                success: true
              };
            } catch (error) {
              console.error(`Error translating text: ${item}`, error);
              return {
                text: item,
                error: 'Failed to translate',
                success: false
              };
            }
          })
        );
        return formatResponse(200, { translations: results });
      }
      
      // Se for uma única string
      try {
        const result = await translateText(text, targetLang, sourceLang);
        return formatResponse(200, {
          translatedText: result.translatedText,
          originalText: result.originalText,
          from: result.from,
          to: result.to,
          fromCache: result.fromCache || false
        });
      } catch (error) {
        console.error('Translation error:', error);
        return formatResponse(500, null, 'Failed to translate text');
      }
    } catch (error) {
      console.error('Translation error:', error);
      return formatResponse(500, null, 'Failed to translate text');
    }
  }

  try {
    
    if (entity === 'avatar') {
        if (id === 'protection' && pathParts[3] === 'status' && pathParts[4] && method === 'GET') {
            const userId = pathParts[4];
            const user = db.users.get(userId);
            if (user) {
                return formatResponse(200, { isEnabled: user.isAvatarProtected || false });
            }
            return formatResponse(404, null, "User not found");
        }
        if (id === 'protection' && pathParts[3] === 'toggle' && pathParts[4] && method === 'POST') {
            const userId = pathParts[4];
            const user = db.users.get(userId);
            if (user) {
                user.isAvatarProtected = body.protected;
                db.users.set(userId, user);
                saveDb();
                webSocketServerInstance.broadcastUserUpdate(user);
                return { status: 200, data: { success: true, user } };
            }
            return formatResponse(404, null, "User not found");
        }
    }

    if (entity === 'notifications') {
        if (id === 'settings' && subEntity) {
            const userId = subEntity;
            if (method === 'GET') {
                const settings = db.notificationSettings.get(userId);
                if (settings) {
                    return formatResponse(200, settings);
                }
                const defaultSettings: NotificationSettings = { newMessages: true, streamerLive: true, followedPosts: false, pedido: true, interactive: true };
                return formatResponse(200, defaultSettings);
            }
            if (method === 'POST') {
                const currentSettings = db.notificationSettings.get(userId) || { newMessages: true, streamerLive: true, followedPosts: false, pedido: true, interactive: true };
                const newSettings = { ...currentSettings, ...body };
                db.notificationSettings.set(userId, newSettings);
                saveDb();
                return formatResponse(200, { settings: newSettings });
            }
        }
    }
    
    if (entity === 'settings') {
        if (id === 'private-stream' && subEntity) {
            const userId = subEntity;
            const user = db.users.get(userId);
            if (user) {
                if (method === 'GET') {
                    return formatResponse(200, { settings: user.privateStreamSettings });
                }
                if (method === 'POST') {
                    user.privateStreamSettings = { ...(user.privateStreamSettings || {}), ...body.settings };
                    db.users.set(userId, user);
                    saveDb();
                    webSocketServerInstance.broadcastUserUpdate(user);
                    return { status: 200, data: { success: true, user } };
                }
            }
            return formatResponse(404, null, "User not found");
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
                return formatResponse(200, { success: true });
            }
        }
        if (id === 'beauty' && subEntity) { // subEntity is userId
            const userId = subEntity;
            if (method === 'GET') {
                const settings = db.beautySettings.get(userId);
                if (settings) return formatResponse(200, settings);
                return { status: 200, data: {} };
            }
            if (method === 'POST') {
                db.beautySettings.set(userId, body.settings);
                saveDb();
                return formatResponse(200, { success: true });
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
            
            return formatResponse(200, filteredStreamers);
        }
    }
    
    if (entity === 'users') {
        if (id === 'me' && subEntity === 'blocklist' && method === 'GET') {
            const user = db.users.get(CURRENT_USER_ID);
            if (!user) return formatResponse(401, null, "Unauthorized");
            const blockedIds = db.blocklist.get(CURRENT_USER_ID) || new Set<string>();
            const blockedUsers = Array.from(blockedIds).map(id => db.users.get(id)).filter((u): u is User => !!u);
            return formatResponse(200, blockedUsers);
        }

        if (id === 'me' && !subEntity) {
            const user = db.users.get(CURRENT_USER_ID);
            if (user) {
                user.platformEarnings = db.platform_earnings;
            }
            return formatResponse(200, user);
        }
        if (method === 'GET' && !id) {
            return formatResponse(200, Array.from(db.users.values()));
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
                db.fans.get(blockerId)?.delete(blockedId);
                
                saveDb();
                return formatResponse(200, { success: true });
            }
    
            if (subEntity === 'unblock' && method === 'DELETE') {
                const blockerId = CURRENT_USER_ID;
                const unblockedId = id;
                db.blocklist.get(blockerId)?.delete(unblockedId);
                saveDb();
                return formatResponse(200, { success: true });
            }

            if (subEntity === 'report' && method === 'POST') {
                const reporterId = CURRENT_USER_ID;
                const reportedId = id;
                const { reason } = body;

                // In a real app, you would save this report to a database for review.
                // For now, we'll just log it and store it in our mock DB.
                console.log(`[DB] User ${reporterId} reported user ${reportedId} for reason: "${reason}"`);
                db.reports.push({ reporterId, reportedId, reason, timestamp: new Date().toISOString() });
                saveDb();
                
                return formatResponse(200, { success: true });
            }

            if (method === 'DELETE') {
                db.users.delete(id);
                saveDb();
                return formatResponse(200, { success: true });
            }
            if (method === 'PATCH') {
                const user = db.users.get(id);
                if (user) {
                    const updatedUser = { ...user, ...body };

                    // Recalculate age if birthday is updated
                    if (body.birthday) {
                        const calculateAge = (birthdayString?: string): number | undefined => {
                            if (!birthdayString || !/^\d{2}\/\d{2}\/\d{4}$/.test(birthdayString)) {
                                return undefined;
                            }
                            const parts = birthdayString.split('/');
                            const day = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1;
                            const year = parseInt(parts[2], 10);

                            const today = new Date();
                            const birthDate = new Date(year, month, day);

                            let age = today.getFullYear() - birthDate.getFullYear();
                            const monthDifference = today.getMonth() - birthDate.getMonth();
                            if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
                                age--;
                            }
                            return age >= 0 ? age : undefined;
                        };
                        const newAge = calculateAge(body.birthday);
                        if (newAge !== undefined) {
                            updatedUser.age = newAge;
                        }
                    }

                    // Sync the user's 'obras' with the global photo feed.
                    if (body.obras) {
                        // First, remove all of this user's existing photos from the global feed.
                        db.photoFeed = db.photoFeed.filter(p => p.user.id !== id);

                        // Then, create new FeedPhoto objects from the updated 'obras' array.
                        const newFeedPhotos: FeedPhoto[] = body.obras.map((obra: Obra, index: number) => ({
                            id: `pf_${id}_${obra.id}_${Date.now()}_${index}`,
                            photoUrl: obra.url,
                            type: obra.type,
                            thumbnailUrl: obra.thumbnailUrl,
                            user: { ...updatedUser }, 
                            likes: 0,
                            isLiked: false,
                            commentCount: 0,
                            musicId: obra.musicId,
                            musicTitle: obra.musicTitle,
                            musicArtist: obra.musicArtist,
                            audioUrl: obra.audioUrl,
                        }));

                        // Add the new photos to the beginning of the global feed.
                        db.photoFeed.unshift(...newFeedPhotos);
                    }

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

                const followerFollowing = db.following.get(followerId)!;
                const followedFans = db.fans.get(followedId)!;
                const followedFollowing = db.following.get(followedId)!;
                const followerFans = db.fans.get(followerId)!;
                
                const isUnfollow = followerFollowing.has(followedId);

                if (isUnfollow) {
                    // Unfollow both ways
                    followerFollowing.delete(followedId);
                    followedFans.delete(followerId);
                    followedFollowing.delete(followerId);
                    followerFans.delete(followerId);
                } else {
                    // Follow both ways (create friendship)
                    followerFollowing.add(followedId);
                    followedFans.add(followerId);
                    followedFollowing.add(followerId);
                    followerFans.add(followerId);
                }

                const updatedFollower = db.users.get(followerId)!;
                updatedFollower.following = followerFollowing.size;
                updatedFollower.fans = followerFans.size;
                
                const updatedFollowed = db.users.get(followedId)!;
                updatedFollowed.following = followedFollowing.size;
                updatedFollowed.fans = followedFans.size;
                
                updatedFollowed.isFollowed = !isUnfollow;

                saveDb();
                
                webSocketServerInstance.broadcastGlobalFollowUpdate(updatedFollower, updatedFollowed, isUnfollow);
                if (!isUnfollow) webSocketServerInstance.notifyNewFollower(followedId, updatedFollower);

                return { status: 200, data: { success: true, updatedFollower, updatedFollowed } };
            }
             if (subEntity === 'messages') {
                const userId = id;
                // Generate conversations from the message history
                const allMessages = Array.from(db.messages.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                const userConversations = new Map<string, Conversation>();

                allMessages.forEach(msg => {
                    if (msg.from !== userId && msg.to !== userId) {
                        return; // Not part of this user's conversations
                    }
                    
                    const otherUserId = msg.from === userId ? msg.to : msg.from;
                    if (otherUserId === 'system') return; // Skip system messages

                    const otherUser = db.users.get(otherUserId);
                    if (otherUser) {
                        userConversations.set(otherUserId, {
                            id: createChatKey(userId, otherUserId),
                            friend: otherUser,
                            lastMessage: msg.text || (msg.imageUrl ? '[imagem]' : ''),
                            timestamp: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        });
                    }
                });
                
                const conversationsArray = Array.from(userConversations.values());
                // Sort by the timestamp of the last message (implicitly handled by iterating through sorted messages)
                const lastMessages = new Map<string, string>();
                allMessages.forEach(msg => {
                    const chatKey = createChatKey(msg.from, msg.to);
                    lastMessages.set(chatKey, msg.timestamp);
                });
                conversationsArray.sort((a, b) => {
                    const timeA = lastMessages.get(a.id) || '0';
                    const timeB = lastMessages.get(b.id) || '0';
                    return new Date(timeB).getTime() - new Date(timeA).getTime();
                });
                
                return { status: 200, data: conversationsArray };
            }
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
             if (subEntity === 'status') return { status: 200, data: { isOnline: user?.isOnline, lastSeen: user?.lastSeen } };
             if (subEntity === 'photos') return { status: 200, data: db.photoFeed.filter(p => p.user.id === id) };
             if (subEntity === 'liked-photos') {
                const likedPhotoIds = db.photoLikes.get(id) || new Set();
                const likedPhotos = db.photoFeed.filter(p => likedPhotoIds.has(p.id));
                const feedWithLikes = likedPhotos.map((photo: FeedPhoto) => ({
                    ...photo, 
                    isLiked: db.photoLikes.get(CURRENT_USER_ID)?.has(photo.id) || false,
                    likes: db.photoLikes.get(photo.id)?.size || 0,
                }));
                return { status: 200, data: feedWithLikes };
             }
             if (subEntity === 'level-info') {
                if (!user) return formatResponse(404, null, 'User not found');
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
                if (pathParts[4] === 'activity' && method === 'POST') {
                     if (user) {
                        user.showActivityStatus = body.show;
                        user.isOnline = body.show;
                        saveDb();
                        webSocketServerInstance.broadcastUserUpdate(user);
                        return { status: 200, data: { success: true, user } };
                    }
                }
                if (pathParts[4] === 'location' && method === 'POST') {
                   if (user) {
                        user.showLocation = body.show;
                        if (body.show) {
                            // Simulate fetching location from IP and setting state and country
                            user.location = "São Paulo";
                            if (!user.country) { // Only set country if it's missing
                                user.country = "br";
                            }
                        }
                        db.users.set(id, user);
                        saveDb();
                        webSocketServerInstance.broadcastUserUpdate(user);
                        return { status: 200, data: { success: true, user } };
                }
                
                return formatResponse(400, null, "Você não possui esta moldura ou ela expirou.");
            }

             if(method === 'GET' && !subEntity) return formatResponse(200, user);
        }
    }
    }

    // --- Contas Google ---
    if (entity === 'accounts') {
        if (id === 'google' && method === 'GET') {
            if (subEntity === 'connected') {
                // Retorna contas Google conectadas do usuário atual
                const connectedAccounts = (db.googleAccounts as any).get(CURRENT_USER_ID) || [];
                return formatResponse(200, connectedAccounts);
            }
            // Retorna todas as contas Google disponíveis (mock)
            const allAccounts: GoogleAccount[] = [
                { id: 'google_1', name: 'John Doe', email: 'john.doe@gmail.com', avatarUrl: 'https://via.placeholder.com/40' },
                { id: 'google_2', name: 'Jane Smith', email: 'jane.smith@gmail.com', avatarUrl: 'https://via.placeholder.com/40' }
            ];
            return formatResponse(200, allAccounts);
        }
        
        if (id === 'google' && subEntity === 'disconnect' && method === 'POST') {
            const { email } = body;
            const userAccounts = (db.googleAccounts as any).get(CURRENT_USER_ID) || [];
            const updatedAccounts = userAccounts.filter(account => account.email !== email);
            (db.googleAccounts as any).set(CURRENT_USER_ID, updatedAccounts);
            saveDb();
            return formatResponse(200, { success: true });
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
        
        // Verificação de permissão: usuário só pode ver seus próprios ganhos, exceto admin
        if (userId !== CURRENT_USER_ID && !isAdmin(CURRENT_USER_ID)) {
            return formatResponse(403, null, "Acesso negado. Você só pode visualizar seus próprios ganhos.");
        }
        
        const user = db.users.get(userId);
        if (!user) {
            return formatResponse(404, null, "Usuário não encontrado.");
        }
        
        const available_diamonds = user.earnings || 0;
        const gross_brl_full = calculateGrossBRL(available_diamonds);
        const platform_fee_brl_full = gross_brl_full * 0.20;
        const net_brl_full = gross_brl_full - platform_fee_brl_full;
        
        return formatResponse(200, { 
            available_diamonds, 
            gross_brl: truncateBRL(gross_brl_full), 
            platform_fee_brl: truncateBRL(platform_fee_brl_full), 
            net_brl: truncateBRL(net_brl_full),
            // Informações adicionais para admin
            ...(isAdmin(CURRENT_USER_ID) && {
                total_withdrawn: user.earnings_withdrawn || 0,
                platform_earnings: db.platform_earnings || 0,
                admin_earnings: user.adminEarnings || 0
            })
        });
      }
      if (id === 'calculate' && method === 'POST') { // POST /api/earnings/calculate
        const amount = body.amount;
        
        // Validação do valor
        if (typeof amount !== 'number' || amount < 0 || !Number.isFinite(amount)) {
          return formatResponse(400, null, 'Valor inválido. Forneça um número válido maior ou igual a zero.');
        }
        
        // Validação de valor máximo (proteção contra valores absurdos)
        if (amount > 1000000) {
          return formatResponse(400, null, 'Valor muito alto. O máximo permitido é 1.000.000 diamantes.');
        }
        
        const gross_value_full = calculateGrossBRL(amount);
        const platform_fee_full = gross_value_full * 0.20;
        const net_value_full = gross_value_full - platform_fee_full;

        return formatResponse(200, { 
            gross_value: truncateBRL(gross_value_full), 
            platform_fee: truncateBRL(platform_fee_full), 
            net_value: truncateBRL(net_value_full),
            // Informações adicionais
            amount_diamonds: amount,
            fee_percentage: 20
        });
      }
      if (id === 'withdraw' && subEntity && method === 'POST') { // POST /api/earnings/withdraw/:userId
        const userId = subEntity;
        const amount = body.amount; // amount in diamonds
        const user = db.users.get(userId);

        // Verificação de permissão: usuário só pode sacar seus próprios ganhos, exceto admin
        if (userId !== CURRENT_USER_ID && !isAdmin(CURRENT_USER_ID)) {
            return formatResponse(403, null, "Acesso negado. Você só pode realizar saques de sua própria conta.");
        }

        if (!user) return formatResponse(404, null, "Usuário não encontrado.");
        
        // Validação do valor
        if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
            return formatResponse(400, null, "Valor de saque inválido. Forneça um número válido maior que zero.");
        }
        
        // Validação de valor mínimo e máximo
        if (amount < 100) {
            return formatResponse(400, null, "Valor mínimo de saque é 100 diamantes.");
        }
        
        if (amount > 1000000) {
            return formatResponse(400, null, "Valor máximo de saque é 1.000.000 diamantes.");
        }
        
        if (!user.withdrawal_method) return formatResponse(400, null, "Método de saque não configurado. Configure um método de saque antes de solicitar.");
        if ((user.earnings || 0) < amount) return formatResponse(400, null, "Saldo de ganhos insuficiente para este saque.");
        
        const grossBRLFull = calculateGrossBRL(amount);
        const feeFull = grossBRLFull * 0.20; // platform fee
        const netBRLFull = grossBRLFull - feeFull; // streamer gets this
        
        // Process withdrawal
        user.earnings -= amount;
        user.earnings_withdrawn = (user.earnings_withdrawn || 0) + amount;
        
        // Add fee to platform earnings
        db.platform_earnings += feeFull;

        // Create withdrawal transaction for the streamer
        const withdrawalTransaction: PurchaseRecord = {
          id: `withdraw_${Date.now()}`,
          userId: user.id,
          type: 'withdraw_earnings',
          description: `Saque para ${user.withdrawal_method.method}`,
          amountBRL: truncateBRL(netBRLFull),
          amountCoins: amount,
          status: 'Concluído',
          timestamp: new Date().toISOString(),
          isAdminTransaction: false
        };

        // Create admin fee transaction (hidden from regular users)
        const adminTransaction: PurchaseRecord = {
          id: `admin_fee_${Date.now()}`,
          userId: CURRENT_USER_ID,
          type: 'admin_fee',
          description: `Taxa de saque de ${user.name}`,
          amountBRL: truncateBRL(feeFull),
          amountCoins: 0,
          status: 'Concluído',
          timestamp: new Date().toISOString(),
          isAdminTransaction: true,
          relatedTransactionId: withdrawalTransaction.id
        };

        // Add transactions to the database
        db.purchases.unshift(withdrawalTransaction);
        db.purchases.unshift(adminTransaction);
        
        // Update admin's wallet (hidden from regular users)
        const adminUser = db.users.get(CURRENT_USER_ID);
        if (adminUser) {
            adminUser.adminEarnings = (adminUser.adminEarnings || 0) + feeFull;
            db.users.set(CURRENT_USER_ID, adminUser);
        }
        
        db.users.set(userId, user);
        saveDb();

        // Broadcast updates
        webSocketServerInstance.broadcastUserUpdate(user);
        webSocketServerInstance.broadcastTransactionUpdate(withdrawalTransaction);
        
        // Only broadcast admin transaction to admin user
        if (adminUser) {
            webSocketServerInstance.broadcastTransactionUpdate(adminTransaction);
            webSocketServerInstance.broadcastUserUpdate({
                ...adminUser,
                platformEarnings: db.platform_earnings,
                adminEarnings: adminUser.adminEarnings
            });
        }

        // Return success with detailed information
        return formatResponse(200, { 
            success: true, 
            user: user,
            transaction: withdrawalTransaction,
            message: `Saque de R$ ${truncateBRL(netBRLFull)} realizado com sucesso para ${user.withdrawal_method.method}.`,
            withdrawal_details: {
                amount_diamonds: amount,
                gross_value_brl: truncateBRL(grossBRLFull),
                platform_fee_brl: truncateBRL(feeFull),
                net_value_brl: truncateBRL(netBRLFull),
                fee_percentage: 20
            }
        });
      }
       if (id === 'method' && subEntity === 'set' && pathParts[4] && method === 'POST') {
          const userId = pathParts[4];
          
          // Verificação de permissão: usuário só pode configurar seu próprio método, exceto admin
          if (userId !== CURRENT_USER_ID && !isAdmin(CURRENT_USER_ID)) {
              return formatResponse(403, null, "Acesso negado. Você só pode configurar seu próprio método de saque.");
          }
          
          const user = db.users.get(userId);
          if (!user) {
              return formatResponse(404, null, "Usuário não encontrado.");
          }
          
          // Validação dos dados
          if (!body.method || typeof body.method !== 'string' || body.method.trim().length === 0) {
              return formatResponse(400, null, "Método de saque inválido. Forneça um método válido.");
          }
          
          if (!body.details || typeof body.details !== 'object') {
              return formatResponse(400, null, "Detalhes do método inválidos. Forneça os detalhes corretos.");
          }
          
          user.withdrawal_method = { 
              method: body.method.trim(), 
              details: body.details 
          };
          
          saveDb();
          webSocketServerInstance.broadcastUserUpdate(user);
          
          return formatResponse(200, { 
              success: true, 
              user: user,
              message: `Método de saque configurado com sucesso: ${body.method.trim()}`
          });
      }
    }
    
    // Rota genérica de saque (compatibilidade com api.ts)
    if (entity === 'withdraw' && method === 'POST') {
        const { userId, amount } = body;
        
        // Verificação de permissão: usuário só pode sacar seus próprios ganhos, exceto admin
        if (userId !== CURRENT_USER_ID && !isAdmin(CURRENT_USER_ID)) {
            return formatResponse(403, null, "Acesso negado. Você só pode realizar saques de sua própria conta.");
        }

        const user = db.users.get(userId);
        if (!user) return formatResponse(404, null, "Usuário não encontrado.");
        
        // Validação do valor
        if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
            return formatResponse(400, null, "Valor de saque inválido. Forneça um número válido maior que zero.");
        }
        
        // Validação de valor mínimo e máximo
        if (amount < 100) {
            return formatResponse(400, null, "Valor mínimo de saque é 100 diamantes.");
        }
        
        if (amount > 1000000) {
            return formatResponse(400, null, "Valor máximo de saque é 1.000.000 diamantes.");
        }
        
        if (!user.withdrawal_method) return formatResponse(400, null, "Método de saque não configurado. Configure um método de saque antes de solicitar.");
        if ((user.earnings || 0) < amount) return formatResponse(400, null, "Saldo de ganhos insuficiente para este saque.");
        
        const grossBRLFull = calculateGrossBRL(amount);
        const feeFull = grossBRLFull * 0.20; // platform fee
        const netBRLFull = grossBRLFull - feeFull; // streamer gets this
        
        // Process withdrawal
        user.earnings -= amount;
        user.earnings_withdrawn = (user.earnings_withdrawn || 0) + amount;
        
        // Add fee to platform earnings
        db.platform_earnings += feeFull;

        // Create withdrawal transaction for the streamer
        const withdrawalTransaction: PurchaseRecord = {
          id: `withdraw_${Date.now()}`,
          userId: user.id,
          type: 'withdraw_earnings',
          description: `Saque para ${user.withdrawal_method.method}`,
          amountBRL: truncateBRL(netBRLFull),
          amountCoins: amount,
          status: 'Concluído',
          timestamp: new Date().toISOString(),
          isAdminTransaction: false
        };

        // Add transactions to the database
        db.purchases.unshift(withdrawalTransaction);
        
        db.users.set(userId, user);
        saveDb();

        // Broadcast updates
        webSocketServerInstance.broadcastUserUpdate(user);
        webSocketServerInstance.broadcastTransactionUpdate(withdrawalTransaction);

        // Return success with detailed information
        return formatResponse(200, { 
            success: true, 
            amount: amount,
            fee: feeFull,
            newBalance: user.earnings,
            user: user,
            transaction: withdrawalTransaction,
            message: `Saque de R$ ${truncateBRL(netBRLFull)} realizado com sucesso para ${user.withdrawal_method.method}.`
        });
    }
    
    if (entity === 'streams') {
        // POST /api/streams - Create a new stream draft
        if (method === 'POST' && !id) {
            const host = db.users.get(CURRENT_USER_ID);
            if (!host) return formatResponse(401, null, "Current user not found to create a stream.");

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

            if (method === 'PUT') {
              if (streamIndex > -1) {
                  const updatedStream = { ...db.streamers[streamIndex], ...body };
                  db.streamers[streamIndex] = updatedStream;
                  saveDb();
                  return { status: 200, data: updatedStream };
              }
              return formatResponse(404, null, "Stream not found");
            }

            if (subEntity === 'quality' && method === 'PUT') {
                const streamId = id;
                const { quality } = body;
                
                if (!quality || !['240p', '360p', '480p', '720p', '1080p'].includes(quality)) {
                    return { status: 400, error: 'Qualidade inválida. Use: 240p, 360p, 480p, 720p, 1080p' };
                }
                
                if (streamIndex > -1) {
                    db.streamers[streamIndex].quality = quality;
                    saveDb();
                    webSocketServerInstance.broadcast('qualityChanged', { streamId, quality });
                    return { status: 200, data: { success: true, stream: db.streamers[streamIndex] } };
                }
                return formatResponse(404, null, "Stream not found");
            }

            if (subEntity === 'end-session' && method === 'POST') {
                if (!stream) return formatResponse(404, null, "Stream not found");
    
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

            if (!stream) return formatResponse(404, null, "Stream not found");

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
            if (subEntity === 'messages' && method === 'POST') {
                const streamId = id;
                const { fromUserId, text } = body || {};
                if (!fromUserId || typeof text !== 'string' || !text.trim()) {
                    return { status: 400, error: 'Parâmetros inválidos para mensagem de live.' };
                }

                const fromUser = db.users.get(fromUserId);
                if (!fromUser) return { status: 404, error: 'Usuário remetente não encontrado.' };

                const room = db.streamRooms.get(streamId);
                if (!room) return { status: 404, error: 'Sala de transmissão não encontrada.' };

                const isHost = stream.hostId === fromUserId;
                const isModerator = db.moderators.get(streamId)?.has(fromUserId) || false;
                const messagePayload = {
                    id: Date.now(),
                    type: 'chat',
                    user: fromUser.name,
                    level: fromUser.level,
                    message: text,
                    avatar: fromUser.avatarUrl,
                    gender: fromUser.gender,
                    age: fromUser.age,
                    isModerator: isHost || isModerator,
                };

                room.forEach(userIdInRoom => {
                    const userSocket = webSocketServerInstance['connections'].get(userIdInRoom);
                    userSocket?.onMessage({
                        type: 'newStreamMessage',
                        payload: { ...messagePayload, roomId: streamId }
                    });
                });

                return { status: 201, data: { success: true } };
            }
            if (subEntity === 'refresh-online-users' && method === 'POST') {
                const streamId = id;
                const roomUserIds = db.streamRooms.get(streamId);
                
                if (!roomUserIds) {
                    return { status: 404, error: "Sala de transmissão não encontrada" };
                }

                const session = db.liveSessions.get(streamId);
                const giftSenders = session?.giftSenders || new Map();

                const usersWithValue = Array.from(roomUserIds)
                    .map(userId => {
                        const user = db.users.get(userId);
                        if (!user) return null;
                        
                        const contribution = giftSenders.get(userId)?.sessionContribution || 0;
                        return { ...user, value: contribution };
                    })
                    .filter((u): u is User & { value: number } => u !== null);

                usersWithValue.sort((a, b) => b.value - a.value);

                // Enviar atualização de usuários online via WebSocket
                webSocketServerInstance.broadcast('onlineUsersUpdate', { 
                    roomId: streamId, 
                    users: usersWithValue 
                });

                return formatResponse(200, { success: true });
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
            if (subEntity === 'toggle-auto-invite' && method === 'POST') {
                const streamId = id;
                const { isEnabled } = body;
                const session = db.liveSessions.get(streamId);
                if (session) {
                    session.isAutoPrivateInviteEnabled = isEnabled;
                    db.liveSessions.set(streamId, session);
                    saveDb();
                    webSocketServerInstance.broadcastAutoInviteStateUpdate(streamId, isEnabled);
                    return formatResponse(200, { success: true });
                }
                return { status: 404, error: 'Live session not found.' };
            }
            if (subEntity === 'private-invite' && method === 'POST') {
                const streamId = id;
                const { userId } = body;
                if (!userId) {
                    return { status: 400, error: 'User ID to invite is required.' };
                }
                const stream = db.streamers.find(s => s.id === streamId);
                if (stream) {
                    webSocketServerInstance.sendPrivateInvite(userId, { stream });
                }
                return formatResponse(200, { success: true });
            }
            
            if (subEntity === 'access-check' && method === 'GET') {
                const streamId = id;
                const userId = url.searchParams.get('userId');
                
                if (!userId) {
                    return { status: 400, error: 'User ID is required.' };
                }
                
                const stream = db.streamers.find(s => s.id === streamId);
                if (!stream) {
                    return { status: 404, error: 'Stream not found.' };
                }
                
                const user = db.users.get(userId);
                if (!user) {
                    return { status: 404, error: 'User not found.' };
                }
                
                // Se não for privado, pode entrar
                if (!stream.isPrivate) {
                    return { status: 200, data: { canJoin: true } };
                }
                
                // Verificar se o usuário tem permissão para entrar em stream privado
                const isOwner = stream.hostId === userId;
                const isVIP = user.isVIP;
                const isFriend = db.following.get(stream.hostId)?.has(userId) || false;
                const isFan = db.fans.get(stream.hostId)?.has(userId) || false;
                
                const canJoin = isOwner || isVIP || isFriend || isFan;
                
                return { status: 200, data: { canJoin } };
            }
            
            if (subEntity === 'toggle-mic' && method === 'POST') {
                const streamId = id;
                const session = db.liveSessions.get(streamId);
                if (session) {
                    session.isMicrophoneMuted = !session.isMicrophoneMuted;
                    db.liveSessions.set(streamId, session);
                    saveDb();
                    webSocketServerInstance.broadcast('micToggled', { streamId, isMuted: session.isMicrophoneMuted });
                }
                return formatResponse(200, {});
            }
            
            if (subEntity === 'toggle-sound' && method === 'POST') {
                const streamId = id;
                const session = db.liveSessions.get(streamId);
                if (session) {
                    session.isStreamMuted = !session.isStreamMuted;
                    db.liveSessions.set(streamId, session);
                    saveDb();
                    webSocketServerInstance.broadcast('soundToggled', { streamId, isMuted: session.isStreamMuted });
                }
                return formatResponse(200, {});
            }
            
            if (subEntity === 'toggle-auto-follow' && method === 'POST') {
                const streamId = id;
                const { isEnabled } = body;
                const session = db.liveSessions.get(streamId);
                if (session) {
                    session.isAutoFollowEnabled = isEnabled;
                    db.liveSessions.set(streamId, session);
                    saveDb();
                    webSocketServerInstance.broadcast('autoFollowToggled', { streamId, isEnabled });
                }
                return formatResponse(200, {});
            }
            if (subEntity === 'gifts' && method === 'GET') {
                const streamId = id;
                const session = db.liveSessions.get(streamId);
                if (!session) return { status: 200, data: [] }; // Retorna vazio se não houver sessão

                const allGifts: Array<{
                    fromUser: User;
                    gift: Gift;
                    quantity: number;
                    timestamp: number;
                }> = [];

                // Verificar se existem remetentes de presentes
                if (session.giftSenders) {
                    for (const [userId, senderData] of session.giftSenders.entries()) {
                        const user = db.users.get(userId);
                        if (!user || !senderData.giftsSent) continue;

                        // Adicionar cada presente enviado pelo usuário
                        for (const giftSent of senderData.giftsSent) {
                            const gift = db.gifts.find(g => g.name === giftSent.name);
                            if (gift) {
                                allGifts.push({
                                    fromUser: {
                                        id: user.id,
                                        name: user.name,
                                        avatarUrl: user.avatarUrl,
                                        level: user.level
                                    } as User,
                                    gift,
                                    quantity: giftSent.quantity,
                                    timestamp: Date.now() - Math.floor(Math.random() * 3600000) // Simula timestamps variados
                                });
                            }
                        }
                    }
                }

                // Ordenar por timestamp (mais recentes primeiro)
                allGifts.sort((a, b) => b.timestamp - a.timestamp);

                return { status: 200, data: allGifts };
            }
            
            if (subEntity === 'kick' && method === 'POST') {
                const streamId = id;
                const { userId, byUserId } = body;
                
                if (!userId || !byUserId) {
                    return { status: 400, error: 'User ID and admin User ID are required' };
                }
                
                const room = db.streamRooms.get(streamId);
                if (room) {
                    room.delete(userId);
                    db.streamRooms.set(streamId, room);
                    
                    if (!db.kickedUsers.has(streamId)) {
                        db.kickedUsers.set(streamId, new Set());
                    }
                    db.kickedUsers.get(streamId)!.add(userId);
                    
                    saveDb();
                    webSocketServerInstance.broadcast('userKicked', { streamId, userId, byUserId });
                }
                
                return { status: 200, data: { success: true } };
            }
            
            if (subEntity === 'moderator' && method === 'POST') {
                const streamId = id;
                const { userId, byUserId } = body;
                
                if (!userId || !byUserId) {
                    return { status: 400, error: 'User ID and admin User ID are required' };
                }
                
                if (!db.moderators.has(streamId)) {
                    db.moderators.set(streamId, new Set());
                }
                
                const moderators = db.moderators.get(streamId)!;
                if (moderators.has(userId)) {
                    moderators.delete(userId);
                } else {
                    moderators.add(userId);
                }
                
                db.moderators.set(streamId, moderators);
                saveDb();
                webSocketServerInstance.broadcast('moderatorToggled', { streamId, userId, isModerator: moderators.has(userId) });
                
                return { status: 200, data: { success: true } };
            }
            
            if (subEntity === 'gift' && method === 'POST') {
                console.log('[DEBUG] Iniciando processamento de presente', { streamId: id, body });
                const streamId = id;
                const { fromUserId, giftName, amount } = body;
                
                console.log('[DEBUG] Buscando dados do remetente, stream e presente', { fromUserId, giftName });
                
                // Criar um ID único para este presente baseado no remetente, stream e timestamp
                const giftId = `${fromUserId}-${streamId}-${giftName}-${Date.now()}`;
                
                // Verificar se já processamos este presente
                if (processedGiftIds.has(giftId)) {
                    console.log('[DEBUG] Presente já processado, ignorando duplicata', { giftId });
                    return { status: 200, data: { success: true, alreadyProcessed: true } };
                }
                
                // Adicionar à lista de processados
                processedGiftIds.add(giftId);
                console.log('[DEBUG] Processando novo presente', { giftId });
                
                const sender = db.users.get(fromUserId);
                const stream = db.streamers.find(s => s.id === streamId);
                const gift = db.gifts.find(g => g.name === giftName);
                
                console.log('[DEBUG] Dados encontrados', { 
                    senderExists: !!sender, 
                    streamExists: !!stream, 
                    giftExists: !!gift,
                    senderName: sender?.name,
                    streamName: stream?.name,
                    giftName: gift?.name
                });
                
                if (!sender || !stream || !gift) {
                    console.error('[ERROR] Dados não encontrados', { 
                        senderExists: !!sender, 
                        streamExists: !!stream, 
                        giftExists: !!gift 
                    });
                    return { status: 404, error: 'Sender, stream, or gift not found.' };
                }
                
                console.log('[DEBUG] Buscando dados do destinatário', { hostId: stream.hostId });
                const receiver = db.users.get(stream.hostId);
                if (!receiver) {
                    console.error('[ERROR] Destinatário não encontrado', { hostId: stream.hostId });
                    return { status: 404, error: 'Receiver not found.' };
                }
                
                // Garantir que o preço e a quantidade sejam números inteiros
                const giftPrice = Math.floor(gift.price || 0);
                const giftAmount = Math.floor(amount || 1);
                const totalCost = giftPrice * giftAmount;
                
                if (sender.diamonds < totalCost) return { status: 400, data: { success: false, error: 'Not enough diamonds' } };
    
                // --- Start of transaction-like updates ---
    
                // 1. Update sender's and receiver's core stats
                sender.diamonds -= totalCost;
                sender.enviados = (sender.enviados || 0) + totalCost;
                sender.xp = (sender.xp || 0) + totalCost;
    
                receiver.earnings += totalCost;
                receiver.receptores = (receiver.receptores || 0) + totalCost;
                receiver.xp = (receiver.xp || 0) + totalCost;
    
                // 2. Handle Fan Club Logic & Auto-Follow
                let shouldTriggerFollow = gift.triggersAutoFollow;
                if (gift.name === 'Sinal de Luz do Ventilador') {
                    const isAlreadyFan = sender.fanClub && sender.fanClub.streamerId === stream.hostId;
                    if (!isAlreadyFan) {
                        sender.fanClub = {
                            streamerId: stream.hostId,
                            streamerName: receiver.name,
                            level: 1,
                        };
                        // Joining a fan club for the first time should also trigger a follow
                        shouldTriggerFollow = true;
                    }
                }
    
                const isFollowed = db.following.get(fromUserId)?.has(stream.hostId);
                if (shouldTriggerFollow && !isFollowed) {
                    const followerFollowing = db.following.get(fromUserId) || new Set<string>();
                    const followedFans = db.fans.get(stream.hostId) || new Set<string>();
    
                    followerFollowing.add(stream.hostId);
                    followedFans.add(fromUserId);
                    
                    db.following.set(fromUserId, followerFollowing);
                    db.fans.set(stream.hostId, followedFans);
                    
                    // Update counts on the user objects themselves
                    sender.following = followerFollowing.size;
                    receiver.fans = followedFans.size;
                }
    
                // 3. Apply level-ups
                const updatedSender = updateUserLevel(sender);
                const updatedReceiver = updateUserLevel(receiver);
    
                // 4. Update gift stats
                const received = db.receivedGifts.get(stream.hostId) || [];
                const existingGiftIndex = received.findIndex(g => g.name === giftName);
                if (existingGiftIndex > -1) {
                    received[existingGiftIndex].count += amount;
                } else {
                    received.push({ ...gift, count: amount });
                }
                db.receivedGifts.set(stream.hostId, received);
                
                // 5. Update session contribution stats
                const session = db.liveSessions.get(streamId);
                if (session) {
                    // Limpar IDs antigos para evitar vazamento de memória
                    // Mantemos apenas os IDs dos últimos 5 minutos
                    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                    for (const [id] of processedGiftIds.entries()) {
                        const timestamp = parseInt(id.split('-').pop() || '0', 10);
                        if (timestamp < fiveMinutesAgo) {
                            processedGiftIds.delete(id);
                        }
                    }
                    if (!session.giftSenders) session.giftSenders = new Map();
                    
                    // Obter ou criar dados do remetente
                    const senderData = session.giftSenders.get(fromUserId) || { 
                        ...updatedSender, 
                        giftsSent: [], 
                        sessionContribution: 0 
                    };
                    
                    // Atualizar a lista de presentes enviados
                    const existingGiftIndexInSession = senderData.giftsSent.findIndex(g => g.name === gift.name);
                    if (existingGiftIndexInSession > -1) {
                        senderData.giftsSent[existingGiftIndexInSession].quantity += giftAmount;
                    } else {
                        senderData.giftsSent.push({ 
                            name: gift.name, 
                            icon: gift.icon, 
                            quantity: giftAmount,
                            component: gift.component
                        });
                    }
                    
                    // Atualizar a contribuição total (garantindo que seja um número inteiro)
                    senderData.sessionContribution = Math.floor(senderData.sessionContribution + totalCost);
                    
                    // Atualizar o mapa de remetentes
                    session.giftSenders.set(fromUserId, senderData);
                    
                    // Atualizar a sessão no banco de dados
                    db.liveSessions.set(streamId, session);
                    
                    // Salvar as alterações no banco de dados
                    saveDb();
                    
                    // Log para depuração
                    console.log(`[GIFT] ${sender.name} enviou ${giftAmount}x ${gift.name} (${totalCost} pontos). Total: ${senderData.sessionContribution}`);
                }
                
                // 6. Persist all changes
                db.users.set(fromUserId, updatedSender);
                db.users.set(stream.hostId, updatedReceiver);
                
                // 7. Broadcast updates (API responsibility)
                webSocketServerInstance.broadcastUserUpdate(updatedSender);
                webSocketServerInstance.broadcastUserUpdate(updatedReceiver);
                webSocketServerInstance.broadcastRoomUpdate(streamId);
                
                // 8. Return success (frontend will handle chat message creation)
                const giftEventPayload = {
                    roomId: streamId,
                    fromUser: updatedSender,
                    toUser: { id: updatedReceiver.id, name: updatedReceiver.name },
                    gift,
                    quantity: giftAmount,
                    status: 'success'
                };

                // Notificar todos os clientes na sala sobre o novo presente
                webSocketServerInstance.broadcast('newStreamGift', giftEventPayload);
                
                // Log para depuração
                console.log(`[GIFT] Notificação de presente enviada para a sala ${streamId}`, giftEventPayload);

                return { status: 200, data: { success: true, updatedSender, updatedReceiver } };
            } // Fecha o bloco if (subEntity === 'gift' && method === 'POST')
        } // Fecha o bloco if (id)
    } // Fecha o bloco if (entity === 'streams')
    
    if (entity === 'presents' && id === 'live' && subEntity && method === 'GET') { // GET /api/presents/live/:streamId
        const streamId = subEntity;
        const session = db.liveSessions.get(streamId);
        if (session && session.giftSenders) {
            const eligibleUsers = Array.from(session.giftSenders.values());
            // Sort by contribution, highest first
            eligibleUsers.sort((a, b) => b.sessionContribution - a.sessionContribution);
            return { status: 200, data: eligibleUsers };
        }
        return { status: 200, data: [] }; // Return empty list if no data
    }
    
    if (entity === 'feed') {
        if (id === 'photos' && method === 'GET') {
            const feedWithLikes = db.photoFeed.map((photo: FeedPhoto) => {
                const photoLikesSet = db.photoLikes.get(photo.id) || new Set();
                return {
                    ...photo,
                    isLiked: photoLikesSet.has(CURRENT_USER_ID),
                    likes: photoLikesSet.size,
                };
            });
            return { status: 200, data: feedWithLikes };
        }
        if (id === 'posts' && method === 'POST') {
            interface PostData {
                mediaData: string;
                thumbnailData?: string;
                type: 'image' | 'video';
                description?: string;
                caption?: string;
                musicId?: string;
                musicTitle?: string;
                musicArtist?: string;
                audioUrl?: string;
            }
            
            const postData: PostData = body as PostData;
            const currentUser = db.users.get(CURRENT_USER_ID);
            if (!currentUser) {
                return { status: 401, error: "User not authenticated" };
            }

            const newObra: Obra = {
                id: `obra_${Date.now()}`,
                url: postData.mediaData,
                type: postData.type,
                thumbnailUrl: postData.thumbnailData,
                musicId: postData.musicId,
                musicTitle: postData.musicTitle,
                musicArtist: postData.musicArtist,
                audioUrl: postData.audioUrl,
            };

            if (!currentUser.obras) {
                currentUser.obras = [];
            }
            currentUser.obras.unshift(newObra);

            const newFeedPhoto = {
                id: `pf_${Date.now()}`,
                photoUrl: postData.mediaData,
                type: postData.type,
                thumbnailUrl: postData.thumbnailData,
                user: currentUser,
                likes: 0,
                isLiked: false,
                commentCount: 0,
                musicId: postData.musicId,
                musicTitle: postData.musicTitle,
                musicArtist: postData.musicArtist,
                audioUrl: postData.audioUrl,
                description: postData.description || postData.caption || '', // Incluindo a descrição
                caption: postData.caption || postData.description || '' // Mantendo compatibilidade com caption também
            } as FeedPhoto;
            db.photoFeed.unshift(newFeedPhoto);
            
            db.users.set(CURRENT_USER_ID, currentUser);
            saveDb();
            
            return { status: 201, data: { success: true, user: currentUser } };
        }
    }

    if (entity === 'photos') {
        if (id && subEntity === 'upload' && method === 'POST') {
            // POST /api/photos/upload/:userId
            const userId = id;
            const { image } = body;
            
            if (!image) {
                return { status: 400, error: 'Image data is required' };
            }
            
            // Simula upload e retorna URL
            const uploadedUrl = `https://picsum.photos/seed/upload_${Date.now()}/800/600`;
            
            return { status: 200, data: { url: uploadedUrl } };
        }
        
        if (id && subEntity === 'like' && method === 'POST') {
            const photoId = id;
            const userId = body.userId;
            if (!userId) {
                return { status: 401, error: "User ID is required to like a photo." };
            }

            if (!db.photoLikes.has(photoId)) {
                db.photoLikes.set(photoId, new Set());
            }

            const likesSet = db.photoLikes.get(photoId)!;
            let isLiked;

            if (likesSet.has(userId)) {
                likesSet.delete(userId);
                isLiked = false;
            } else {
                likesSet.add(userId);
                isLiked = true;
            }
            
            // Also update the like count in the main photoFeed array for consistency
            const photoInFeed = db.photoFeed.find(p => p.id === photoId);
            if(photoInFeed) {
                photoInFeed.likes = likesSet.size;
            }

            saveDb();

            return {
                status: 200,
                data: {
                    success: true,
                    likes: likesSet.size,
                    isLiked: isLiked
                }
            };
        }
        if (id === 'upload' && subEntity && method === 'POST') {
            return { status: 200, data: { url: body.image }};
        }
        if (id && subEntity === 'comments') {
            if (method === 'GET') {
                const comments = db.comments.get(id) || [];
                return { status: 200, data: comments };
            }
            if (method === 'POST') {
                const user = db.users.get(body.userId);
                if (!user) return formatResponse(404, null, 'User not found');

                const newComment = {
                    id: `comment_${Date.now()}`,
                    user: user,
                    text: body.text,
                    timestamp: new Date().toISOString()
                };
                const comments = db.comments.get(id) || [];
                comments.push(newComment);
                db.comments.set(id, comments);

                // Update comment count on the photo feed item
                const photo = db.photoFeed.find(p => p.id === id);
                if (photo) {
                    photo.commentCount = (photo.commentCount || 0) + 1;
                }

                saveDb();
                return { status: 201, data: { success: true, comment: newComment } };
            }
        }
    }
    
    if (entity === 'chats' && id && subEntity === 'messages') {
        if (method === 'GET') {
            const otherUserId = id;
            const chatKey = createChatKey(CURRENT_USER_ID, otherUserId);
            const allMessages = Array.from(db.messages.values());
            const chatMessages = allMessages.filter(m => m.chatId === chatKey);

            return { status: 200, data: chatMessages };
        }
        if (method === 'POST') {
            const toUserId = id;
            const { fromUserId, text, imageUrl, tempId } = body;

            if (!fromUserId || !toUserId) return { status: 400, error: "Missing sender or receiver ID." };
            const fromUser = db.users.get(fromUserId);
            const toUser = db.users.get(toUserId);
            if (!fromUser || !toUser) return { status: 404, error: "Sender or receiver not found." };
            
            const chatKey = createChatKey(fromUserId, toUserId);
            
            const newMessage: Message = {
                id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                chatId: chatKey,
                from: fromUserId,
                to: toUserId,
                text,
                imageUrl,
                timestamp: new Date().toISOString(),
                status: webSocketServerInstance['connections'].has(toUserId) ? 'delivered' : 'sent',
                avatarUrl: fromUser.avatarUrl || '',
                username: fromUser.name || 'Usuário',
                badgeLevel: fromUser.level || 1
            };
            
            // Ensure ID is a string when used as a Map key
            const messageId = String(newMessage.id);
            db.messages.set(messageId, { ...newMessage, id: messageId });
            
// Primeiro notifica sobre a nova mensagem
            webSocketServerInstance.broadcastNewMessageToChat(chatKey, newMessage);
            
            // Se houver um tempId, envia um ACK para o remetente
            if (tempId) {
                const senderSocket = webSocketServerInstance['connections'].get(fromUserId);
                senderSocket?.onMessage({
                    type: 'messageAck',
                    payload: { tempId, message: newMessage }
                });
            }
            saveDb();
            
            return { status: 201, data: newMessage };
        }
    }
    
    if (entity === 'chats' && id && subEntity === 'mark-read' && method === 'POST') {
        const { messageIds } = body;
        const otherUserId = id;
        
        if (!messageIds || !Array.isArray(messageIds)) {
            return { status: 400, error: 'Message IDs array is required' };
        }
        
        messageIds.forEach(msgId => {
            const message = db.messages.get(msgId);
            if (message && message.to === CURRENT_USER_ID) {
                message.status = 'read';
                db.messages.set(msgId, message);
            }
        });
        
        saveDb();
        webSocketServerInstance.broadcast('messagesRead', { userId: CURRENT_USER_ID, messageIds });
        
        return { status: 200, data: { success: true } };
    }


    if (entity === 'regions' && method === 'GET') {
      return { status: 200, data: db.countries };
    }

    if (entity === 'purchases' && id === 'history' && subEntity && method === 'GET') {
      const userId = subEntity;
      const requestingUserId = body.requestingUserId; // ID do usuário que está fazendo a requisição
      
      // Se for o admin, retorna todas as transações (incluindo as administrativas)
      if (requestingUserId === CURRENT_USER_ID) {
        const allTransactions = db.purchases.filter(p => 
          p.userId === userId || 
          (p.isAdminTransaction && p.userId === CURRENT_USER_ID)
        );
        return { status: 200, data: allTransactions };
      }
      
      // Para usuários comuns, retorna apenas as transações não administrativas
      const userPurchases = db.purchases.filter(p => 
        p.userId === userId && !p.isAdminTransaction
      );
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

    // Music APIs
    if (entity === 'music') {
        if (method === 'GET' && !id) {
            // GET /api/music - Biblioteca de músicas
            const musicLibrary: MusicTrack[] = [
                { id: 'music1', title: 'Summer Vibes', artist: 'DJ Sunshine', url: 'https://example.com/music1.mp3' },
                { id: 'music2', title: 'Night Drive', artist: 'Neon Dreams', url: 'https://example.com/music2.mp3' },
                { id: 'music3', title: 'Dance Floor', artist: 'Beat Master', url: 'https://example.com/music3.mp3' },
                { id: 'music4', title: 'Chill Out', artist: 'Relax Zone', url: 'https://example.com/music4.mp3' },
                { id: 'music5', title: 'Energy Boost', artist: 'Power Mix', url: 'https://example.com/music5.mp3' }
            ];
            return { status: 200, data: musicLibrary };
        }
        
        if (id && subEntity === 'videos' && method === 'GET') {
            // GET /api/music/:musicId/videos - Vídeos por música
            const musicId = id;
            const videosWithMusic = db.photoFeed.filter(photo => photo.musicId === musicId);
            return { status: 200, data: videosWithMusic };
        }
    }

    // PK Battle APIs
    if (entity === 'pk') {
        if (id === 'config' && method === 'GET') {
            // GET /api/pk/config
            return { status: 200, data: db.pkDefaultConfig };
        }
        
        if (id === 'config' && method === 'POST') {
            // POST /api/pk/config
            const { duration } = body;
            if (typeof duration !== 'number' || duration < 1 || duration > 30) {
                return { status: 400, error: 'Duration must be between 1 and 30 minutes' };
            }
            db.pkDefaultConfig.duration = duration;
            saveDb();
            return { status: 200, data: { success: true, config: db.pkDefaultConfig } };
        }
        
        if (id === 'start' && method === 'POST') {
            // POST /api/pk/start
            const { streamId, opponentId } = body;
            const stream = db.streamers.find(s => s.id === streamId);
            const opponent = db.streamers.find(s => s.hostId === opponentId);
            
            if (!stream || !opponent) {
                return { status: 404, error: 'Stream or opponent not found' };
            }
            
            const battleState: PKBattleState = {
                opponentId: opponentId,
                heartsA: 0,
                heartsB: 0,
                scoreA: 0,
                scoreB: 0
            };
            
            db.pkBattles.set(streamId, battleState);
            saveDb();
            
            // Broadcast PK battle start
            webSocketServerInstance.broadcast('pkBattleStarted', { streamId, opponentId });
            
            return { status: 200, data: { success: true } };
        }
        
        if (id === 'end' && method === 'POST') {
            // POST /api/pk/end
            const { streamId } = body;
            const battle = db.pkBattles.get(streamId);
            
            if (!battle) {
                return { status: 404, error: 'PK Battle not found' };
            }
            
            db.pkBattles.delete(streamId);
            saveDb();
            
            // Broadcast PK battle end
            webSocketServerInstance.broadcast('pkBattleEnded', { streamId, winner: battle.scoreA > battle.scoreB ? 'A' : 'B' });
            
            return { status: 200, data: { success: true } };
        }
        
        if (id === 'heart' && method === 'POST') {
            // POST /api/pk/heart
            const { roomId, team } = body;
            const battle = db.pkBattles.get(roomId);
            
            if (!battle) {
                return { status: 404, error: 'PK Battle not found' };
            }
            
            if (team === 'A') {
                battle.heartsA++;
            } else if (team === 'B') {
                battle.heartsB++;
            } else {
                return { status: 400, error: 'Invalid team. Must be A or B' };
            }
            
            db.pkBattles.set(roomId, battle);
            saveDb();
            
            // Broadcast heart update
            webSocketServerInstance.broadcast('pkHeartUpdate', { roomId, team, heartsA: battle.heartsA, heartsB: battle.heartsB });
            
            return { status: 200, data: { success: true } };
        }
    }

    // Chat Permission APIs  
    if (entity === 'chat-permission') {
        if (id === 'status' && subEntity && method === 'GET') {
            // GET /api/chat-permission/status/:userId
            const userId = subEntity;
            const user = db.users.get(userId);
            if (!user) {
                return { status: 404, error: 'User not found' };
            }
            return { status: 200, data: { permission: user.chatPermission || 'all' } };
        }
        
        if (id === 'update' && subEntity && method === 'POST') {
            // POST /api/chat-permission/update/:userId
            const userId = subEntity;
            const { permission } = body;
            const user = db.users.get(userId);
            
            if (!user) {
                return { status: 404, error: 'User not found' };
            }
            
            if (!['all', 'followers', 'none'].includes(permission)) {
                return { status: 400, error: 'Invalid permission. Must be all, followers, or none' };
            }
            
            user.chatPermission = permission;
            db.users.set(userId, user);
            saveDb();
            webSocketServerInstance.broadcastUserUpdate(user);
            
            return { status: 200, data: { success: true, user } };
        }
    }

    // SIM Status API
    if (entity === 'sim' && id === 'status' && method === 'POST') {
        const { isOnline } = body;
        const user = db.users.get(CURRENT_USER_ID);
        
        if (!user) {
            return { status: 404, error: 'User not found' };
        }
        
        // Update user's online status
        user.isOnline = isOnline;
        user.lastSeen = new Date().toISOString();
        
        // Save changes to the database
        db.users.set(CURRENT_USER_ID, user);
        saveDb();
        
        // Notify connected clients about the status change
        webSocketServerInstance.broadcast('userStatusChanged', {
            userId: CURRENT_USER_ID,
            isOnline,
            lastSeen: user.lastSeen
        });
        
        return { status: 200, data: { success: true, user } };
    }

    if (entity === 'user') {
        if (id === 'statusChanged' && method === 'POST') {
            const { userId, isOnline } = body || {};
            const targetId = userId || CURRENT_USER_ID;
            const user = db.users.get(targetId);
            if (!user) {
                return formatResponse(404, null, 'User not found');
            }
            user.isOnline = !!isOnline;
            user.lastSeen = new Date().toISOString();
            db.users.set(targetId, user);
            saveDb();
            return formatResponse(200, { success: true, user });
        }

        if (id === 'connected' && method === 'POST') {
            const { userId, clientId } = body || {};
            const targetId = userId || CURRENT_USER_ID;
            const user = db.users.get(targetId);
            if (!user) {
                return formatResponse(404, null, 'User not found');
            }
            const now = new Date().toISOString();
            user.lastConnected = now;
            const clients = Array.isArray(user.connectedClients) ? user.connectedClients : [];
            const nextClients = clientId ? [clientId, ...clients.filter((id: string) => id !== clientId)] : clients;
            user.connectedClients = nextClients.slice(0, 20);
            db.users.set(targetId, user);
            db.history.actions.push({ type: 'user_connected', userId: targetId, clientId, timestamp: now });
            saveDb();
            return formatResponse(200, { success: true });
        }

        if (id === 'clientConnected' && method === 'POST') {
            const { userId, clientId } = body || {};
            const targetId = userId || CURRENT_USER_ID;
            const user = db.users.get(targetId);
            if (!user) {
                return formatResponse(404, null, 'User not found');
            }
            const now = new Date().toISOString();
            user.lastConnected = now;
            const clients = Array.isArray(user.connectedClients) ? user.connectedClients : [];
            const nextClients = clientId ? [clientId, ...clients.filter((id: string) => id !== clientId)] : clients;
            user.connectedClients = nextClients.slice(0, 20);
            db.users.set(targetId, user);
            db.history.actions.push({ type: 'client_connected', userId: targetId, clientId, timestamp: now });
            saveDb();
            return formatResponse(200, { success: true, connectedClients: user.connectedClients });
        }
    }
    
    // Settings APIs
    if (entity === 'settings') {
        if (id === 'pip' && subEntity === 'toggle' && method === 'POST') {
            // POST /api/settings/pip/toggle/:userId
            const userId = subEntity;
            const { enabled } = body;
            const user = db.users.get(userId);
            
            if (!user) {
                return { status: 404, error: 'User not found' };
            }
            
            user.pipEnabled = enabled;
            db.users.set(userId, user);
            saveDb();
            webSocketServerInstance.broadcastUserUpdate(user);
            
            return { status: 200, data: { success: true, user } };
        }
        
        if (id === 'private-stream' && subEntity && method === 'GET') {
            // GET /api/settings/private-stream/:userId
            const userId = subEntity;
            const user = db.users.get(userId);
            
            if (!user) {
                return { status: 404, error: 'User not found' };
            }
            
            return { status: 200, data: { settings: user.privateStreamSettings } };
        }
        
        if (id === 'private-stream' && subEntity && method === 'POST') {
            // POST /api/settings/private-stream/:userId
            const userId = subEntity;
            const { settings } = body;
            const user = db.users.get(userId);
            
            if (!user) {
                return { status: 404, error: 'User not found' };
            }
            
            user.privateStreamSettings = { ...user.privateStreamSettings, ...settings };
            db.users.set(userId, user);
            saveDb();
            webSocketServerInstance.broadcastUserUpdate(user);
            
            return { status: 200, data: { success: true, user } };
        }
        
        if (id === 'beauty' && subEntity && method === 'GET') {
            // GET /api/settings/beauty/:userId
            const userId = subEntity;
            const beautySettings = db.beautySettings.get(userId);
            
            if (!beautySettings) {
                return { status: 404, error: 'Beauty settings not found' };
            }
            
            return { status: 200, data: beautySettings };
        }
        
        if (id === 'beauty' && subEntity && method === 'POST') {
            // POST /api/settings/beauty/:userId
            const userId = subEntity;
            const settings = body;
            
            db.beautySettings.set(userId, settings);
            saveDb();
            
            return { status: 200, data: { success: true } };
        }
        
        if (id === 'gift-notifications' && subEntity && method === 'GET') {
            // GET /api/settings/gift-notifications/:userId
            const userId = subEntity;
            const settings = db.giftNotificationSettings.get(userId) || {};
            
            return { status: 200, data: { settings } };
        }
        
        if (id === 'gift-notifications' && subEntity && method === 'POST') {
            // POST /api/settings/gift-notifications/:userId
            const userId = subEntity;
            const { settings } = body;
            
            db.giftNotificationSettings.set(userId, settings);
            saveDb();
            
            return { status: 200, data: { success: true } };
        }
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
        return formatResponse(200, { success: true });
    }

    if (entity === 'effects') {
        if (id === 'purchase' && subEntity && method === 'POST') { // POST /api/effects/purchase/:userId
            const userId = subEntity;
            const { giftId } = body;
            const user = db.users.get(userId);
            const gift = db.gifts.find(g => g.name === giftId);

            if (!user || !gift) return { status: 404, error: "Usuário ou presente não encontrado." };
            if (user.diamonds < (gift.price || 0)) return { status: 400, error: "Diamantes insuficientes." };

            const giftPrice = gift.price || 0;
            user.diamonds -= giftPrice;
            
            // Adiciona aos presentes recebidos
            const received = db.receivedGifts.get(userId) || [];
            const existingGiftIndex = received.findIndex(g => g.name === gift.name);
            if (existingGiftIndex > -1) {
                received[existingGiftIndex].count += 1;
            } else {
                received.push({ ...gift, count: 1 });
            }
            db.receivedGifts.set(userId, received);

            db.users.set(userId, user);
            saveDb();
            webSocketServerInstance.broadcastUserUpdate(user);

            return { status: 200, data: { success: true, user } };
        }
        
        if (id === 'purchase-frame' && subEntity && method === 'POST') { // POST /api/effects/purchase-frame/:userId
            const userId = subEntity;
            const { frameId } = body;
            const user = db.users.get(userId);
            const frame = avatarFrames.find(f => f.id === frameId);

            if (!user || !frame) return { status: 404, error: "Usuário ou moldura não encontrado." };
            if (user.diamonds < frame.price) return { status: 400, error: "Diamantes insuficientes." };

            const brlValue = calculateGrossBRL(frame.price);
            db.platform_earnings = (db.platform_earnings || 0) + brlValue;

            user.diamonds -= frame.price;
            
            const existingFrameIndex = user.ownedFrames.findIndex(f => f.frameId === frameId);
            const expirationDate = new Date();
            
            let finalExpirationDate;

            if (existingFrameIndex > -1) {
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
            
            user.activeFrameId = frameId;
            user.frameExpiration = finalExpirationDate;
            
            const purchase: PurchaseRecord = {
                id: `frame_${Date.now()}`,
                userId: user.id,
                type: 'purchase_frame',
                description: `Compra da moldura '${frame.name}'`,
                amountBRL: truncateBRL(brlValue),
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
    
    // VIP Subscription
    if (entity === 'vip' && method === 'POST' && id === 'subscribe' && pathParts[3]) {
        const userId = pathParts[3];
        console.log(`[API] Processing VIP subscription for user ${userId}`);
        const user = db.users.get(userId);
        
        if (!user) {
            return formatResponse(404, null, 'User not found');
        }

        // Check if user already has VIP
        if (user.isVIP) {
            return { status: 400, error: 'User is already a VIP' };
        }

        // Update user to VIP
        user.isVIP = true;
        user.vipSince = new Date().toISOString();
        
        // Add some VIP benefits
        user.diamonds = (user.diamonds || 0) + 1000; // Give some diamonds as a welcome gift
        
        // Add VIP badge or other perks
        if (!user.badges) user.badges = [];
        if (!user.badges.includes('vip')) {
            user.badges.push('vip');
        }
        
        // Create a purchase record
        const purchase: PurchaseRecord = {
            id: `vip_sub_${Date.now()}`,
            userId: user.id,
            type: 'vip_subscription',
            description: 'Assinatura VIP',
            amountBRL: 0, // This would be set based on VIP package in a real implementation
            amountCoins: 0,
            status: 'Concluído',
            timestamp: new Date().toISOString(),
        };
        
        db.purchases.unshift(purchase);
        db.users.set(userId, user);
        saveDb();
        
        // Notify via WebSocket if needed
        webSocketServerInstance?.notifyUserUpdate(userId);
        
        return {
            status: 200,
            data: {
                success: true,
                user: user
            }
        };
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
        if (pathParts[2] === 'coapresentador' && pathParts[3] === 'novos-amigos' && method === 'GET') {
            const data = db.quickCompleteFriends.get(CURRENT_USER_ID) || [];
            return { status: 200, data: data.slice(0, 7) };
        }
        if (pathParts[2] === 'coapresentador' && pathParts[3] === 'complete' && pathParts[4] && method === 'POST') {
            const friendId = pathParts[4];
            const friendsList = db.quickCompleteFriends.get(CURRENT_USER_ID);
            if (friendsList) {
                const friend = friendsList.find(f => f.id === friendId);
                if (friend) {
                    friend.status = 'concluido';
                    saveDb();
                    return { status: 200, data: { success: true, friend } };
                }
            }
            return { status: 404, error: 'Friend task not found' };
        }
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
            return formatResponse(200, { success: true });
        }

        if (id === 'end' && method === 'POST') {
            const { streamId } = body;
            db.pkBattles.delete(streamId);
            saveDb();
            return formatResponse(200, { success: true });
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
                return formatResponse(200, { success: true });
            }
            return { status: 404, error: "Battle not found" };
        }

    }

    // --- Ranking ---
    if (entity === 'ranking' && id && method === 'GET') {
        const period = id as 'daily' | 'weekly' | 'monthly';
        
        // Obtém todos os usuários
        const allUsers = Array.from(db.users.values());
        
        // Filtra e mapeia os usuários com base no período
        let rankedUsers: RankedUser[] = [];
        
        if (period === 'monthly') {
            // Para o ranking mensal, podemos usar os diamantes totais ou outro critério
            rankedUsers = allUsers
                .filter(user => user.diamonds > 0)
                .map(user => ({
                    ...user,
                    contribution: user.diamonds, // Ou outro critério para ranking mensal
                    gender: (user.gender as 'male' | 'female' | 'not_specified') || 'not_specified',
                    age: user.age || 25,
                    // Adiciona informações específicas para o ranking mensal
                    period: 'monthly' as const,
                    position: 0 // Será preenchido após a ordenação
                }))
                .sort((a, b) => b.contribution - a.contribution)
                .map((user, index) => ({
                    ...user,
                    position: index + 1
                }))
                .slice(0, 100); // Top 100 do ranking mensal
        } else {
            // Lógica para outros períodos (daily, weekly)
            rankedUsers = allUsers
                .filter(user => user.diamonds > 0)
                .map(user => ({
                    ...user,
                    contribution: user.diamonds,
                    gender: (user.gender as 'male' | 'female' | 'not_specified') || 'not_specified',
                    age: user.age || 25,
                    period: period as 'daily' | 'weekly' | 'monthly',
                    position: 0
                }))
                .sort((a, b) => b.contribution - a.contribution)
                .map((user, index) => ({
                    ...user,
                    position: index + 1
                }))
                .slice(0, 50);
        }
        
        return formatResponse(200, rankedUsers);
    }

    // --- Presentes ---
    if (entity === 'gifts' && method === 'GET') {
        return formatResponse(200, db.gifts);
    }

    // --- Música ---
    if (entity === 'music') {
        if (method === 'GET') {
            if (!id) {
                // GET /api/music - Biblioteca de músicas
                return formatResponse(200, (db as any).musicLibrary || []);
            }
            if (subEntity === 'videos' && method === 'GET') {
                // GET /api/music/:musicId/videos
                const musicId = id;
                const videos = db.photoFeed.filter(photo => photo.musicId === musicId);
                return formatResponse(200, videos);
            }
        }
    }

    // --- Regiões ---
    if (entity === 'regions' && method === 'GET') {
        const countries = [
            { name: 'Brasil', code: 'br' },
            { name: 'Estados Unidos', code: 'us' },
            { name: 'Argentina', code: 'ar' },
            { name: 'México', code: 'mx' },
            { name: 'Colômbia', code: 'co' },
            { name: 'Chile', code: 'cl' },
            { name: 'Peru', code: 'pe' },
            { name: 'Uruguai', code: 'uy' }
        ];
        return formatResponse(200, countries);
    }

    // --- Lembretes ---
    if (entity === 'reminders' && method === 'GET') {
        // Retorna streamers ativos (consistentes com o tipo Streamer)
        const reminderStreamers = db.streamers
            .filter(s => {
                const host = db.users.get(s.hostId);
                return host?.isLive;
            })
            .slice(0, 10);
        return formatResponse(200, reminderStreamers);
    }

    // --- Histórico de Streams ---
    if (entity === 'history' && id === 'streams') {
        if (method === 'GET') {
            return formatResponse(200, db.streamHistory);
        }
        if (method === 'POST') {
            const entry: StreamHistoryEntry = body;
            db.streamHistory.unshift(entry);
            saveDb();
            return formatResponse(200, { success: true });
        }
    }

    // --- Compras ---
    if (entity === 'purchases' && id === 'history' && subEntity && method === 'GET') {
        const userId = subEntity;
        const { requestingUserId } = body;
        
        // Verificação de permissão
        if (userId !== CURRENT_USER_ID && !isAdmin(CURRENT_USER_ID)) {
            return formatResponse(403, null, "Acesso negado.");
        }
        
        const purchases = db.purchases.filter(p => p.userId === userId);
        return formatResponse(200, purchases.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
    }

    // --- Visitantes ---
    if (entity === 'visitors') {
        if (id === 'list' && subEntity && method === 'GET') {
            const userId = subEntity;
            const visits = db.visits.get(userId) || [];
            const visitorsData: Visitor[] = visits.map(visit => {
                const visitor = db.users.get(visit.visitorId);
                return visitor ? { ...visitor, visitTimestamp: visit.timestamp } : null;
            }).filter(Boolean);
            return formatResponse(200, visitorsData);
        }
        
        if (id === 'clear' && subEntity && method === 'DELETE') {
            const userId = subEntity;
            if (userId !== CURRENT_USER_ID && !isAdmin(CURRENT_USER_ID)) {
                return formatResponse(403, null, "Acesso negado.");
            }
            db.visits.delete(userId);
            saveDb();
            return formatResponse(200, { success: true });
        }
    }

    // --- Efeitos e VIP ---
    if (entity === 'effects') {
        if (id === 'purchase' && subEntity && method === 'POST') {
            const userId = subEntity;
            const { giftId } = body;
            
            const user = db.users.get(userId);
            const gift = db.gifts.find(g => g.name === giftId);
            
            if (!user || !gift) {
                return formatResponse(404, null, "Usuário ou presente não encontrado.");
            }
            
            if (user.diamonds < (gift.price || 0)) {
                return formatResponse(400, null, "Diamantes insuficientes.");
            }
            
            user.diamonds -= (gift.price || 0);
            db.users.set(userId, user);
            saveDb();
            
            return formatResponse(200, { success: true, user });
        }
        
        if (id === 'purchase-frame' && subEntity && method === 'POST') {
            const userId = subEntity;
            const { frameId } = body;
            
            const user = db.users.get(userId);
            const frame = avatarFrames.find(f => f.id === frameId);
            
            if (!user || !frame) {
                return formatResponse(404, null, "Usuário ou moldura não encontrada.");
            }
            
            if (user.diamonds < frame.price) {
                return formatResponse(400, null, "Diamantes insuficientes.");
            }
            
            user.diamonds -= frame.price;
            if (!user.ownedFrames) user.ownedFrames = [];
            user.ownedFrames.push({
                frameId,
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
            });
            
            db.users.set(userId, user);
            saveDb();
            
            return formatResponse(200, { success: true, user });
        }
    }

    if (entity === 'vip') {
        if (method === 'POST' && id === 'subscribe' && pathParts[3]) {
            const userId = pathParts[3];
            const user = db.users.get(userId);
            
            if (!user) {
                return formatResponse(404, null, "Usuário não encontrado.");
            }
            
            const vipPrice = 100; // 100 diamantes por mês
            
            if (user.diamonds < vipPrice) {
                return formatResponse(400, null, "Diamantes insuficientes para VIP.");
            }
            
            user.diamonds -= vipPrice;
            user.isVIP = true;
            user.vipSince = new Date().toISOString();
            user.vipExpirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            
            db.users.set(userId, user);
            saveDb();
            
            return formatResponse(200, { success: true, user });
        }
    }

    // --- Set Active Frame ---
    if (entity === 'users' && id && subEntity === 'set-active-frame' && method === 'POST') {
        const userId = id;
        const { frameId } = body;
        
        if (userId !== CURRENT_USER_ID && !isAdmin(CURRENT_USER_ID)) {
            return formatResponse(403, null, "Acesso negado.");
        }
        
        const user = db.users.get(userId);
        if (!user) {
            return formatResponse(404, null, "Usuário não encontrado.");
        }
        
        // Verificar se o usuário possui a moldura
        if (frameId && user.ownedFrames) {
            const ownedFrame = user.ownedFrames.find(f => f.frameId === frameId);
            if (!ownedFrame || new Date(ownedFrame.expirationDate) < new Date()) {
                return formatResponse(400, null, "Você não possui esta moldura ou ela expirou.");
            }
        }
        
        user.activeFrameId = frameId;
        db.users.set(userId, user);
        saveDb();
        webSocketServerInstance.broadcastUserUpdate(user);
        
        return formatResponse(200, { success: true, user });
    }

    // ==============================================
    // Rotas do Feed, Visitantes e Fotos do Usuário
    // ==============================================

    // Rota: POST /api/feed/posts (MOCK)
    if (method === 'POST' && path === '/api/feed/posts') {
        console.log(`🔹 [MOCK API] ${new Date().toISOString()} - POST ${path} recebido`);
        console.log('   Dados recebidos:', JSON.stringify(body, null, 2));
        try {
            const { userId, content, mediaType, mediaUrl, timestamp } = body;
            
            if (!userId) {
                return { status: 400, error: 'userId é obrigatório' };
            }
            
            // Gera um ID único para o post
            const postId = `post_${Date.now()}`;
            
            // Cria um objeto de resposta mock
            const mockPost = {
                id: postId,
                userId,
                content: content || '',
                mediaType: mediaType || 'image',
                mediaUrl: mediaUrl || '',
                timestamp: timestamp || new Date().toISOString(),
                likes: 0,
                comments: [],
                user: {
                    id: userId,
                    name: 'Usuário Mock',
                    avatarUrl: 'https://picsum.photos/200',
                    isVerified: false
                }
            };
            
            // Retorna a resposta de sucesso
            const response = {
                status: 201,
                data: {
                    success: true,
                    message: 'Post criado com sucesso (MOCK)',
                    post: mockPost
                }
            };
            
            console.log(`🔹 [MOCK API] ${new Date().toISOString()} - POST ${path} respondido com sucesso`);
            console.log('   Resposta:', JSON.stringify(response, null, 2));
            return response;
        } catch (error) {
            console.error('Erro no mock ao criar post:', error);
            return formatResponse(500, null, 'Erro no mock ao criar post');
        }
    }

    // Rota: GET /api/market
    if (method === 'GET' && path === '/api/market') {
        console.log(`🔹 [MOCK API] ${new Date().toISOString()} - GET ${path} recebido`);
        try {
            // Simula dados do mercado
            const marketData = {
                featuredItems: [],
                categories: [],
                newArrivals: []
            };
            console.log('   Retornando dados do mercado');
            return formatResponse(200, marketData);
        } catch (error) {
            console.error('Erro ao buscar dados do mercado:', error);
            return formatResponse(500, null, 'Erro ao buscar dados do mercado');
        }
    }

    // Rota: GET /api/pk/battle
    if (method === 'GET' && path === '/api/pk/battle') {
        console.log(`🔹 [MOCK API] ${new Date().toISOString()} - GET ${path} recebido`);
        try {
            // Simula dados de batalha PK
            const battleData = {
                currentBattle: null,
                leaderboard: []
            };
            console.log('   Retornando dados de batalha PK');
            return formatResponse(200, battleData);
        } catch (error) {
            console.error('Erro ao buscar dados de batalha PK:', error);
            return formatResponse(500, null, 'Erro ao buscar dados de batalha PK');
        }
    }

    // Rota: GET /api/blocked-users
    if (method === 'GET' && path === '/api/blocked-users') {
        console.log(`🔹 [MOCK API] ${new Date().toISOString()} - GET ${path} recebido`);
        try {
            // Simula lista de usuários bloqueados
            const blockedUsers = [];
            console.log(`   Retornando ${blockedUsers.length} usuários bloqueados`);
            return formatResponse(200, blockedUsers);
        } catch (error) {
            console.error('Erro ao buscar usuários bloqueados:', error);
            return formatResponse(500, null, 'Erro ao buscar usuários bloqueados');
        }
}

// Rota: GET /api/live/popular
if (method === 'GET' && path === '/api/live/popular') {
    console.log(` [LIVE API] ${new Date().toISOString()} - Buscando transmissões populares`);
    try {
        // Filtra apenas usuários que estão ao vivo
        const liveStreams = Array.from(db.users.values())
            .filter((user: User) => user.isLive)
            .map((user) => {
                // Cria um tipo que inclui todas as propriedades que podemos acessar
                type ExtendedUser = {
                    id: string;
                    name: string;
                    username: string;
                    avatarUrl: string;
                    isLive?: boolean;
                    liveTitle?: string;
                    thumbnailUrl?: string;
                    viewerCount?: number;
                    followers?: string[];
                    liveCategory?: string;
                    liveTags?: string[];
                    isVerified?: boolean;
                    diamonds?: number;
                    level?: number;
                };

                const safeUser = user as unknown as ExtendedUser;
                
                return {
                    id: safeUser.id,
                    username: safeUser.username || '',
                    displayName: safeUser.name || '',
                    avatarUrl: safeUser.avatarUrl || '',
                    title: safeUser.liveTitle || 'Transmissão ao vivo',
                    thumbnailUrl: safeUser.thumbnailUrl || safeUser.avatarUrl || '',
                    viewerCount: safeUser.viewerCount ?? Math.floor(Math.random() * 1000) + 50,
                    isFollowing: safeUser.followers?.includes(CURRENT_USER_ID) || false,
                    category: safeUser.liveCategory || 'Entretenimento',
                    tags: safeUser.liveTags || [],
                    isVerified: safeUser.isVerified || false,
                    diamonds: safeUser.diamonds || 0,
                    level: safeUser.level || 1
                };
            });

        console.log(`🟢 [LIVE API] ${liveStreams.length} transmissões ao vivo encontradas`);
        return formatResponse(200, liveStreams);
    } catch (error) {
        console.error(`🔴 [LIVE API] Erro ao buscar transmissões:`, error);
        return formatResponse(500, null, 'Erro ao buscar transmissões ao vivo');
    }
}

// Rota: POST /api/live/start
if (method === 'POST' && path === '/api/live/start') {
    console.log(`🔹 [MOCK API] ${new Date().toISOString()} - POST ${path} recebido`);
    console.log('   Dados recebidos:', JSON.stringify(body, null, 2));
    try {
        // Simula início de transmissão 
        const liveData = {
            streamId: `stream_${Date.now()}`,
            rtmpUrl: 'rtmp://mock-server/live',
            streamKey: `mock_key_${Math.random().toString(36).substr(2, 9)}`,
            status: 'starting'
        };
        console.log('   Iniciando transmissão:', liveData);
        return { status: 200, data: liveData };
    } catch (error) {
        console.error('Erro ao iniciar transmissão:', error);
        return { status: 500, error: 'Erro ao iniciar transmissão' };
    }
}

// Rota: GET /api/feed/photos
if (method === 'GET' && path === '/api/feed/photos') {
    console.log(`🔹 [MOCK API] ${new Date().toISOString()} - GET ${path} recebido`);
    try {
        // Retorna as fotos do feed global ou uma lista vazia se não houver
        const response = { status: 200, data: db.photoFeed || [] };
        console.log(`🔹 [MOCK API] ${new Date().toISOString()} - GET ${path} respondido com sucesso`);
        console.log(`   Total de fotos retornadas: ${response.data.length}`);
        return response;
    } catch (error) {
        console.error('Erro ao buscar fotos do feed:', error);
        return { status: 500, error: 'Erro ao buscar fotos do feed' };
    }
    }

    // Rota: GET /api/visitors/list/:userId
    if (method === 'GET' && path.startsWith('/api/visitors/list/')) {
        console.log(`🔹 [MOCK API] ${new Date().toISOString()} - GET ${path} recebido`);
        try {
            const userId = path.split('/').pop();
            console.log(`   Buscando visitantes para o usuário: ${userId}`);
            const user = db.users.get(userId || '');
            
            if (!user) {
                return { status: 404, error: 'Usuário não encontrado' };
            }

            // Retorna a lista de visitantes do perfil
            const visits = db.visits as unknown as Record<string, { visitorId: string; timestamp: string; profileId: string }[]>;
            
            const visitors = Object.entries(visits)
                .filter(([_, visitList]) => 
                    Array.isArray(visitList) && 
                    visitList.some(visit => visit.profileId === userId)
                )
                .map(([visitorId, visitList]) => {
                    const lastVisit = visitList.find(visit => visit.profileId === userId);
                    const visitor = db.users.get(visitorId);
                    return {
                        id: visitorId,
                        name: visitor?.name || 'Usuário desconhecido',
                        avatarUrl: visitor?.avatarUrl || '',
                        visitedAt: lastVisit?.timestamp || new Date().toISOString(),
                        isFollowing: Array.isArray(visitor?.following) && visitor.following.includes(userId || '')
                    };
                })
                .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());

            return { status: 200, data: visitors };
        } catch (error) {
            console.error('Erro ao buscar visitantes:', error);
            return { status: 500, error: 'Erro ao buscar visitantes' };
        }
    }

    // Rota: GET /api/users/:userId/photos
    if (method === 'GET' && path.startsWith('/api/users/') && path.endsWith('/photos')) {
        console.log(`🔹 [MOCK API] ${new Date().toISOString()} - GET ${path} recebido`);
        try {
            const userId = path.split('/')[3];
            console.log(`   Buscando fotos do usuário: ${userId}`);
            const user = db.users.get(userId);
                
            if (!user) {
                return { status: 404, error: 'Usuário não encontrado' };
            }

            const userPhotos = (user.obras || [])
                .filter((obra: any) => obra.type === 'image' || obra.type === 'video')
                .map((obra: any) => {
                    // Verifica se a obra tem a propriedade 'comments' e se é um array
                    const commentCount = Array.isArray((obra as any).comments) ? (obra as any).comments.length : 0;
                    
                    return {
                        id: obra.id,
                        photoUrl: obra.url,
                        thumbnailUrl: obra.thumbnailUrl || obra.url,
                        type: obra.type,
                        description: (obra.description || obra.caption || '').toString(),
                        likes: Array.isArray(user.curtidas) ? 
                            user.curtidas.filter((l: any) => l.obra?.id === obra.id).length : 0,
                        isLiked: Array.isArray(user.curtidas) ? 
                            user.curtidas.some((l: any) => l.obra?.id === obra.id) : false,
                        commentCount: commentCount,
                        createdAt: (obra as any).createdAt || new Date().toISOString()
                    };
                })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return formatResponse(200, userPhotos);
        } catch (error) {
            console.error('Erro ao buscar fotos do usuário:', error);
            return { status: 500, error: 'Erro ao buscar fotos do usuário' };
        }
    }

    // Se chegou até aqui, a rota não foi encontrada
    const errorMessage = `Endpoint não encontrado: ${method} ${path}`;
    console.error(`[API MOCK] ${errorMessage}`);
    return formatResponse(404, null, errorMessage);
    
  } catch (e) {
    console.error(`[API MOCK] Error processing ${method} ${path}:`, e);
    return formatResponse(500, null, 'Erro interno do servidor');
  }
};
