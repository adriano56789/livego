
import { db, CURRENT_USER_ID, createChatKey, saveDb, levelProgression, avatarFrames } from './database';
import { User, Streamer, Message, RankedUser, Gift, Conversation, PurchaseRecord, EligibleUser, FeedPhoto, Obra, GoogleAccount, LiveSessionState, StreamHistoryEntry, Visitor, NotificationSettings, BeautySettings, LevelInfo, Order, DiamondPackage, LiveNotification, Invitation } from '../types';
import { webSocketServerInstance } from './websocket';
import { srsService } from './srsService';
import { ProtectionAgent } from './protectionAgent';

interface ApiResponse {
  status: number;
  data?: any;
  error?: string;
}

const diamondPurchasePackages = [
  { id: 'pkg_1', diamonds: 800, price: 7 },
  { id: 'pkg_2', diamonds: 3000, price: 25 },
  { id: 'pkg_3', diamonds: 6000, price: 60 },
  { id: 'pkg_4', diamonds: 20000, price: 200 },
  { id: 'pkg_5', diamonds: 36000, price: 400 },
  { id: 'pkg_6', diamonds: 60000, price: 650 },
];

// Helper to ensure 2 decimal places strictly (Financial truncation)
const truncateBRL = (value: number): number => {
    return Math.floor(value * 100) / 100;
};

function calculateGrossBRL(diamonds: number): number {
  if (diamonds <= 0) return 0;
  let applicableTier: { diamonds: number; price: number } | null = null;
  for (const pkg of diamondPurchasePackages) {
    if (diamonds >= pkg.diamonds) {
      applicableTier = pkg;
    } else {
      break;
    }
  }
  if (!applicableTier) {
    const smallestPackage = diamondPurchasePackages[0];
    if (!smallestPackage) return 0;
    const rate = smallestPackage.price / smallestPackage.diamonds;
    return diamonds * rate;
  }
  const rate = applicableTier.price / applicableTier.diamonds;
  return diamonds * rate;
}

const updateUserLevel = (user: User): User => {
    if (user.xp === undefined) user.xp = 0;
    if (user.level === undefined) user.level = 1;
    let nextLevelInfo = levelProgression.find(l => l.level === user.level + 1);
    while (nextLevelInfo && user.xp >= nextLevelInfo.xpRequired) {
        user.level++;
        nextLevelInfo = levelProgression.find(l => l.level === user.level + 1);
    }
    return user;
};

// Helper to calculate age from DD/MM/YYYY
const calculateAgeFromDate = (dateString: string): number | null => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-11
    const year = parseInt(parts[2], 10);
    
    const birthDate = new Date(year, month, day);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// --- Helper for Pix Code Generation (Backend Side) ---
const calculateCRC16 = (str: string) => {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        crc ^= c << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
        crc = crc & 0xFFFF; 
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
};

const generatePixCode = (amount: number, transactionId: string, merchantKey: string) => {
    const amountStr = amount.toFixed(2);
    
    // Construct Merchant Account Info (ID 26)
    const gui = "0014BR.GOV.BCB.PIX";
    const key = `01${merchantKey.length.toString().padStart(2, '0')}${merchantKey}`;
    const merchantAccountInfoContent = gui + key;
    const merchantAccountInfo = `26${merchantAccountInfoContent.length.toString().padStart(2, '0')}${merchantAccountInfoContent}`;

    // Construct Additional Data Field (ID 62) containing TxID
    const txId = transactionId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || "***";
    const additionalDataContent = `05${txId.length.toString().padStart(2, '0')}${txId}`;
    const additionalData = `62${additionalDataContent.length.toString().padStart(2, '0')}${additionalDataContent}`;

    // Helper to format generic fields
    const f = (id: string, value: string) => `${id}${value.length.toString().padStart(2, '0')}${value}`;

    const payloadWithoutCRC = [
        f('00', '01'),
        merchantAccountInfo,
        f('52', '0000'),
        f('53', '986'),
        f('54', amountStr),
        f('58', 'BR'),
        f('59', 'LiveGo Diamonds'),
        f('60', 'SAO PAULO'),
        additionalData,
        '6304' // ID 63 + Length 04
    ].join('');

    const crc = calculateCRC16(payloadWithoutCRC);
    return payloadWithoutCRC + crc;
};


export const mockApiRouter = async (method: string, path: string, body?: any): Promise<ApiResponse> => {
  // --- PROTECTION AGENT CHECK ---
  // Blocks forbidden actions before they reach the logic layer
  const isSafe = ProtectionAgent.validateAction(method, path, body);
  if (!isSafe) {
      return { 
          status: 403, 
          error: "Ação bloqueada pelo Agente de Proteção: Operação não permitida em dados críticos." 
      };
  }
  // ------------------------------

  const url = new URL(path, 'http://localhost:3000');
  const pathParts = url.pathname.split('/').filter(p => p);
  
  if (pathParts.length < 1 || pathParts[0] !== 'api') {
      return { status: 404, error: "Not found" };
  }

  const entity = pathParts[1];
  const id = pathParts[2];
  const subEntity = pathParts[3];

  try {
    // --- PERFIL (PROFILE) ---
    // Specific routes for managing user profile fields as requested
    if (entity === 'perfil') {
        const user = db.users.get(CURRENT_USER_ID);
        if (!user) return { status: 404, error: "User not found" };

        const broadcast = () => {
            db.users.set(user.id, user);
            saveDb();
            webSocketServerInstance.broadcastUserUpdate(user);
        };

        // --- Imagens ---
        if (id === 'imagens') {
            if (method === 'GET') {
                return { status: 200, data: user.obras || [] };
            }
            if (subEntity && method === 'DELETE') {
                const imageId = subEntity;
                if (!user.obras) return { status: 400, error: "No images found" };
                user.obras = user.obras.filter(obra => obra.id !== imageId);
                // Fallback avatar check
                if (user.avatarUrl && user.obras.every(o => o.url !== user.avatarUrl) && user.obras.length > 0) {
                    user.avatarUrl = user.obras[0].url;
                }
                
                // Sync Deletion with PhotoFeed
                db.photoFeed = db.photoFeed.filter(p => p.id !== imageId);

                broadcast();
                return { status: 200, data: { success: true } };
            }
            if (subEntity === 'ordenar' && method === 'PUT') {
                const { orderedIds } = body;
                if (!Array.isArray(orderedIds) || !user.obras) {
                    return { status: 400, error: "Invalid data" };
                }
                const newOrder: Obra[] = [];
                // Sort based on ID array
                orderedIds.forEach(id => {
                    const found = user.obras?.find(o => o.id === id);
                    if (found) newOrder.push(found);
                });
                // Append any missing (safety)
                user.obras.forEach(o => {
                    if (!newOrder.find(n => n.id === o.id)) newOrder.push(o);
                });
                
                user.obras = newOrder;
                if (newOrder.length > 0) user.avatarUrl = newOrder[0].url; // First image is avatar
                
                broadcast();
                return { status: 200, data: { success: true, images: user.obras } };
            }
        }

        // --- Scalar Fields ---
        const handleScalar = (field: string, userProp: keyof User) => {
            if (id === field) {
                 if (method === 'GET') {
                     return { status: 200, data: { value: user[userProp] || '' } };
                 }
                 if (method === 'PUT') {
                     (user as any)[userProp] = body.value;
                     
                     // Automatically calculate age when birthday is updated
                     if (userProp === 'birthday') {
                         const newAge = calculateAgeFromDate(body.value);
                         if (newAge !== null) {
                             user.age = newAge;
                         }
                     }

                     broadcast();
                     return { status: 200, data: { success: true } };
                 }
            }
            return null;
        };

        let result = null;
        if ((result = handleScalar('apelido', 'name'))) return result;
        if ((result = handleScalar('genero', 'gender'))) return result;
        if ((result = handleScalar('aniversario', 'birthday'))) return result;
        if ((result = handleScalar('apresentacao', 'bio'))) return result;
        if ((result = handleScalar('residencia', 'residence'))) return result;
        if ((result = handleScalar('estado-emocional', 'emotional_status'))) return result;
        if ((result = handleScalar('tags', 'tags'))) return result;
        if ((result = handleScalar('profissao', 'profession'))) return result;
    }


    // --- SRS WebRTC Signaling ---
    if (entity === 'rtc' && id === 'v1') {
        const action = subEntity; // publish or play
        
        if (action === 'publish' && method === 'POST') {
            const { sdp, streamUrl } = body;
            const srsResult = await srsService.publish(streamUrl, sdp);
            
            // Extract Stream Metadata to return to client
            const streamId = streamUrl ? streamUrl.split('/').pop() : '';
            const stream = db.streamers.find(s => s.id === streamId);
            
            let extraData: any = {};
            
            if (stream) {
                const host = db.users.get(stream.hostId);
                const roomUsers = db.streamRooms.get(streamId || '');
                const participants = roomUsers ? Array.from(roomUsers).map(uid => {
                    const u = db.users.get(uid);
                    return u ? { id: u.id, name: u.name, avatar: u.avatarUrl } : null;
                }).filter(u => u !== null) : [];

                // Ensure we return the correct host if room list is empty
                if (participants.length === 0 && host) {
                    participants.push({ id: host.id, name: host.name, avatar: host.avatarUrl });
                }

                extraData = {
                    streamId: stream.id,
                    broadcasterName: host?.name || 'Unknown',
                    playbackUrl: stream.playbackUrl, // Return correctly configured URL
                    participants
                };
            } else {
                 // Fallback if stream record is not found (e.g. ad-hoc test)
                 extraData = {
                    streamId: streamId || 'unknown',
                    broadcasterName: 'Unknown Broadcaster',
                    playbackUrl: '',
                    participants: []
                 };
            }

            return { status: 200, data: { ...srsResult, ...extraData } };
        }
        if (action === 'play' && method === 'POST') {
             const { sdp, streamUrl } = body;
             return { status: 200, data: await srsService.play(streamUrl, sdp) };
        }
        if (action === 'stop' && method === 'DELETE') {
             const { streamUrl } = body;
             const streamId = streamUrl.split('/').pop() || 'unknown';
             return { status: 200, data: srsService.stop(streamId) };
        }
    }
    
    // --- SRS Stats ---
    if (entity === 'v1' && id === 'streams') {
        const streamId = subEntity;
        if (method === 'GET' && streamId) {
             const stats = srsService.getStreamStats(streamId);
             return { status: 200, data: stats };
        }
    }

    // --- Checkout & Payments ---
    if (entity === 'checkout') {
        if (id === 'pack' && method === 'GET') {
            return { status: 200, data: diamondPurchasePackages };
        }
        if (id === 'order' && method === 'POST') {
            const { userId, packageId, amount, diamonds } = body;
            const newOrder: Order = {
                id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                userId,
                packageId,
                amount,
                diamonds,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            db.orders.set(newOrder.id, newOrder);
            saveDb();
            return { status: 201, data: newOrder };
        }
    }

    if (entity === 'payment') {
        if (id === 'pix' && method === 'POST') {
            const { orderId } = body;
            const order = db.orders.get(orderId);
            if (!order) return { status: 404, error: "Order not found" };

            // Generate Pix Code
            const pixKey = "adrianomdk5@gmail.com"; 
            const pixCode = generatePixCode(order.amount, order.id, pixKey);
            
            // Update order
            order.paymentMethod = 'pix';
            order.pixCode = pixCode;
            order.updatedAt = new Date().toISOString();
            db.orders.set(orderId, order);
            saveDb();

            return { 
                status: 200, 
                data: { 
                    success: true, 
                    pixCode, 
                    expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                    orderId
                } 
            };
        }
        if (id === 'credit-card' && method === 'POST') {
            const { orderId, cardNumber, cardName, expiry, cvv } = body;
            const order = db.orders.get(orderId);
            if (!order) return { status: 404, error: "Order not found" };

            // Simulate card processing check
            if (!cardNumber || !cardName || !expiry || !cvv) {
                return { status: 400, error: "Invalid card details" };
            }

            // Simulate success
            order.paymentMethod = 'credit_card';
            order.updatedAt = new Date().toISOString();
            db.orders.set(orderId, order);
            saveDb();
            
            return { status: 200, data: { success: true, message: "Card authorized", orderId } };
        }
    }

    if (entity === 'purchase' && id === 'confirm' && method === 'POST') {
        const { orderId } = body;
        const order = db.orders.get(orderId);
        if (!order) return { status: 404, error: "Order not found" };
        
        if (order.status === 'paid') {
             return { status: 200, data: { success: true, message: "Order already completed", order } };
        }

        // Finalize transaction
        const user = db.users.get(order.userId);
        if (user) {
            user.diamonds += order.diamonds;
            // NOTE: We do NOT add direct diamond purchases to 'platform_earnings' anymore as requested.
            // This wallet is exclusively for fee income.
            
            // Create purchase record for history (User side)
            const purchaseRecord: PurchaseRecord = {
                id: `purchase_${Date.now()}`,
                userId: user.id,
                type: 'purchase_diamonds',
                description: `Compra de ${order.diamonds} diamantes`,
                amountBRL: order.amount,
                amountCoins: order.diamonds,
                status: 'Concluído',
                timestamp: new Date().toISOString()
            };
            db.purchases.unshift(purchaseRecord);
            
            // Update order status
            order.status = 'paid';
            order.updatedAt = new Date().toISOString();
            db.orders.set(orderId, order);
            db.users.set(user.id, user);
            saveDb();

            webSocketServerInstance.broadcastUserUpdate(user);
            webSocketServerInstance.broadcastTransactionUpdate(purchaseRecord);
            
            return { status: 200, data: { success: true, user, order } };
        }
        return { status: 404, error: "User not found" };
    }

    // --- Purchases History (Fix for GET /api/purchases/history/:userId) ---
    if (entity === 'purchases') {
        if (id === 'history' && subEntity && method === 'GET') {
            const userId = subEntity;
            const history = db.purchases.filter(p => p.userId === userId);
            // Sort by timestamp descending (newest first)
            history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return { status: 200, data: history };
        }
    }

    // --- Presents / Gifts ---
    if (entity === 'presents') {
        // Fetch list of gift senders for a specific live session
        // Route: GET /api/presents/live/:streamId
        if (id === 'live' && subEntity && method === 'GET') {
            const streamId = subEntity;
            const session = db.liveSessions.get(streamId);
            
            if (session && session.giftSenders) {
                // Convert Map values to Array
                const senders = Array.from(session.giftSenders.values());
                return { status: 200, data: senders };
            }
            
            // Return empty array if session exists but no gifts, or session doesn't exist (simulating empty state)
            return { status: 200, data: [] };
        }
    }

    // --- Visitors (Fix for GET /api/visitors/list/:userId) ---
    if (entity === 'visitors') {
        if (id === 'list' && subEntity && method === 'GET') {
            const userId = subEntity;
            const visits = db.visits.get(userId) || [];
            
            // Map the visit logs to full Visitor objects using the user database
            const visitors = visits.map(v => {
                const visitorUser = db.users.get(v.visitorId);
                if (!visitorUser) return null;
                return { ...visitorUser, visitTimestamp: v.timestamp };
            }).filter(v => v !== null); // Remove nulls if user deleted

            return { status: 200, data: visitors };
        }
        if (id === 'clear' && subEntity && method === 'DELETE') {
            const userId = subEntity;
            db.visits.set(userId, []);
            saveDb();
            return { status: 200, data: { success: true } };
        }
    }

    // --- Regions ---
    if (entity === 'regions' && method === 'GET') {
      return { status: 200, data: db.countries };
    }

    // --- Gifts ---
    if (entity === 'gifts' && method === 'GET') {
      return { status: 200, data: db.gifts };
    }

    // --- Reminders ---
    if (entity === 'reminders' && method === 'GET') {
      const followedIds = db.following.get(CURRENT_USER_ID) || new Set();
      const reminders = db.streamers.filter(s => followedIds.has(s.hostId));
      return { status: 200, data: reminders };
    }

    // --- Ranking ---
    if (entity === 'ranking' && id && method === 'GET') {
      const sortedContributions = Array.from(db.contributions.entries()).sort((a, b) => b[1] - a[1]);
      const rankedUsers: RankedUser[] = sortedContributions.map(([userId, contribution]) => {
        const user = db.users.get(userId);
        if (!user) return null;
        return {
          ...user,
          contribution,
          gender: user.gender || 'not_specified',
          age: user.age || 0,
        } as RankedUser;
      }).filter((u): u is RankedUser => !!u);
      return { status: 200, data: rankedUsers.slice(0, 50) };
    }

    // --- History ---
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

    // --- Admin ---
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
                db.platform_earnings = 0;
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
            // Filter to show withdrawals AND income fees for the admin user
            let history = db.purchases.filter(p => p.userId === CURRENT_USER_ID && (p.type === 'withdraw_platform_earnings' || p.type === 'platform_fee_income'));
            
            if (status && status !== 'all') {
                history = history.filter(p => p.status === status);
            }
            // Sort by timestamp
            history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            return { status: 200, data: history };
        }
    }

    // --- Sim Status ---
    if (entity === 'sim') {
        if (id === 'status' && method === 'POST') {
            const user = db.users.get(CURRENT_USER_ID);
            if (user) {
                user.isOnline = body.isOnline;
                user.lastSeen = new Date().toISOString();
                db.users.set(CURRENT_USER_ID, user);
                saveDb();
                webSocketServerInstance.broadcastUserUpdate(user);
                return { status: 200, data: { success: true, user } };
            }
            return { status: 404, error: 'User not found' };
        }
    }

    // --- Accounts ---
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

    // --- Notifications ---
    if (entity === 'notifications') {
        if (id === 'settings' && subEntity) {
            const userId = subEntity;
            if (method === 'GET') {
                const settings = db.notificationSettings.get(userId);
                if (settings) return { status: 200, data: settings };
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
        // New Endpoint: Get user notifications
        if (method === 'GET' && !id) {
             const notifications = db.liveNotifications.filter(n => n.userId === CURRENT_USER_ID && !n.read);
             return { status: 200, data: notifications };
        }
        // New Endpoint: Mark notification as read
        if (id && subEntity === 'read' && method === 'PATCH') {
            const notification = db.liveNotifications.find(n => n.id === id);
            if (notification && notification.userId === CURRENT_USER_ID) {
                notification.read = true;
                saveDb();
                return { status: 200, data: { success: true } };
            }
            return { status: 404, error: "Notification not found" };
        }
    }

    
    // --- Settings ---
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
        if (id === 'gift-notifications' && subEntity) {
            const userId = subEntity;
            if (method === 'GET') {
                const settings = db.giftNotificationSettings.get(userId);
                if (settings) return { status: 200, data: { settings } };
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
        if (id === 'beauty' && subEntity) {
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
         if (id === 'pip' && subEntity === 'toggle') {
             const userId = pathParts[4];
             const user = db.users.get(userId);
             if (user) {
                 user.pipEnabled = body.enabled;
                 saveDb();
                 return { status: 200, data: { success: true, user } };
             }
             return { status: 404, error: "User not found" };
         }
    }

    // --- Lives ---
    if (entity === 'lives') {
        if (id === 'start' && method === 'POST') {
            const { streamId } = body;
            const stream = db.streamers.find(s => s.id === streamId);
            if (!stream) return { status: 404, error: "Stream not found" };
            
            const host = db.users.get(stream.hostId);
            if (host) {
                host.isLive = true;
                db.users.set(host.id, host);
                
                // Notify followers logic
                const fansSet = db.fans.get(host.id) || new Set();
                fansSet.forEach(fanId => {
                    const newNotification: LiveNotification = {
                        id: `notif_${Date.now()}_${Math.random()}`,
                        userId: fanId,
                        streamerId: host.id,
                        streamerName: host.name,
                        streamerAvatar: host.avatarUrl,
                        streamId: streamId,
                        read: false,
                        createdAt: new Date().toISOString()
                    };
                    db.liveNotifications.push(newNotification);
                });
                
                saveDb();
                webSocketServerInstance.notifyStreamerGoesLive(stream, stream.isPrivate || false);
                return { status: 200, data: { success: true } };
            }
            return { status: 404, error: "Host user not found" };
        }

        // NEW: End Live Stream
        // POST /api/lives/:streamId/end
        if (id && subEntity === 'end' && method === 'POST') {
             const streamId = id;
             const streamIndex = db.streamers.findIndex(s => s.id === streamId);
             
             if (streamIndex > -1) {
                 const stream = db.streamers[streamIndex];
                 const host = db.users.get(stream.hostId);
                 if (host) {
                     host.isLive = false;
                     db.users.set(host.id, host);
                     webSocketServerInstance.broadcastUserUpdate(host);
                 }
                 db.streamers.splice(streamIndex, 1);
             }
             
             db.liveSessions.delete(streamId);
             db.streamRooms.delete(streamId);
             db.kickedUsers.delete(streamId);
             db.moderators.delete(streamId);
             db.pkBattles.delete(streamId);
             
             saveDb();
             return { status: 200, data: { success: true } };
        }

        // GET /api/lives/:liveId
        if (id && method === 'GET') {
            const stream = db.streamers.find(s => s.id === id);
            if (stream) return { status: 200, data: stream };
            return { status: 404, error: "Live not found" };
        }
    }
    
    // --- Live Streams (Legacy/List) ---
    if (entity === 'live') {
        if (method === 'GET' && id) {
            const category = id;
            const country = url.searchParams.get('country');
            const requestingUserId = url.searchParams.get('userId') || CURRENT_USER_ID; 

            let filteredStreamers = [...db.streamers];
            if (country) filteredStreamers = filteredStreamers.filter(s => s.country === country);
            switch (category) {
                case 'popular': filteredStreamers.sort((a, b) => (b.viewers || 0) - (a.viewers || 0)); break;
                case 'followed': const followedIds = db.following.get(requestingUserId) || new Set(); filteredStreamers = filteredStreamers.filter(s => followedIds.has(s.hostId)); break;
                case 'nearby': filteredStreamers = filteredStreamers.filter(s => s.tags.includes('Perto')); break;
                case 'pk': filteredStreamers = filteredStreamers.filter(s => s.tags.includes('PK')); break;
                case 'new': filteredStreamers = filteredStreamers.filter(s => s.tags.includes('Novo')); break;
                case 'music': filteredStreamers = filteredStreamers.filter(s => s.tags.includes('Musica')); break;
                case 'dance': filteredStreamers = filteredStreamers.filter(s => s.tags.includes('Dança')); break;
                case 'party': filteredStreamers = filteredStreamers.filter(s => s.tags.includes('Festa')); break;
                case 'private':
                    // Filter private streams: visible if user is host OR invited
                    const myInvites = db.invitations.filter(i => i.inviteeId === requestingUserId).map(i => i.roomId);
                    filteredStreamers = filteredStreamers.filter(s => s.isPrivate && (s.hostId === requestingUserId || myInvites.includes(s.id)));
                    break;
            }
            return { status: 200, data: filteredStreamers };
        }
    }

    // --- Photos ---
    if (entity === 'photos') {
        // Upload photo
        // Path: /api/photos/upload/:userId
        if (id === 'upload' && subEntity && method === 'POST') {
             const { image } = body;
             if (!image) return { status: 400, error: "No image data" };
             
             // In a real app we'd save to disk/cloud and return a public URL.
             // For the mock, 'saving' means accepting the data and making it usable (by returning it).
             return { status: 200, data: { url: image } };
        }

        // Like photo
        // Path: /api/photos/:photoId/like
        if (id && subEntity === 'like' && method === 'POST') {
            const photoId = id;
            const userId = body.userId;
            
            if (!db.photoLikes.has(photoId)) {
                db.photoLikes.set(photoId, new Set());
            }
            const likesSet = db.photoLikes.get(photoId)!;
            const isLiked = likesSet.has(userId);
            
            if (isLiked) likesSet.delete(userId);
            else likesSet.add(userId);
            
            return { 
                status: 200, 
                data: { 
                    success: true, 
                    likes: likesSet.size, 
                    isLiked: !isLiked 
                } 
            };
        }
    }
    
    // --- Chats ---
    if (entity === 'chats') {
        // Handle /api/chats/send
        if (id === 'send' && method === 'POST') {
            const { from, to, text, imageUrl, tempId } = body;
            
            if (!from || !to) {
                 return { status: 400, error: 'Missing from or to user' };
            }

            const chatKey = createChatKey(from, to);
            const newMessage: Message = {
                id: tempId || `msg_${Date.now()}_${Math.random()}`,
                chatId: chatKey,
                from,
                to,
                text: text || '',
                imageUrl,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };
            
            db.messages.set(newMessage.id, newMessage);
            saveDb();
            
            // Broadcast via WebSocket to update both users
            webSocketServerInstance.broadcastNewMessageToChat(chatKey, newMessage, tempId);
            
            return { status: 200, data: { success: true, messageId: newMessage.id } };
        }

        // Handle /api/chats/mark-read
        if (id === 'mark-read' && method === 'POST') {
             const { messageIds, readerId } = body;
             // In a real DB, you'd update status for these IDs
             messageIds.forEach((msgId: string) => {
                 const msg = db.messages.get(msgId);
                 if (msg) {
                     msg.status = 'read';
                 }
             });
             saveDb();
             return { status: 200, data: { success: true } };
        }
        
        // Handle /api/chats/:id/messages
        if (id && subEntity === 'messages' && method === 'GET') {
             const otherUserId = id;
             const userId = CURRENT_USER_ID; // Assuming context user is requesting
             const chatKey = createChatKey(userId, otherUserId);
             const chatMessages = Array.from(db.messages.values())
                .filter(m => m.chatId === chatKey)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
             
             // Check for friend relationship to send system message
             const friendRelationshipExists = db.following.get(userId)?.has(otherUserId) && db.fans.get(userId)?.has(otherUserId);
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
             
             // In a real app, this endpoint would serve existing conversations, but since 
             // we are simulating everything here, we map messages back to conversation objects
             // for the conversations list.
             // See 'users' -> 'messages' block below for conversation list.

             return { status: 200, data: chatMessages };
        }
    }

    // --- Users ---
    if (entity === 'users') {
        if (id === 'me' && subEntity === 'blocklist') {
            const blockedIds = db.blocklist.get(CURRENT_USER_ID) || new Set<string>();
            const blockedUsers = Array.from(blockedIds).map(uid => db.users.get(uid)).filter((u): u is User => !!u);
            return { status: 200, data: blockedUsers };
        }
        if (id === 'me' && !subEntity) {
            const user = db.users.get(CURRENT_USER_ID);
            if (user) user.platformEarnings = db.platform_earnings;
            return { status: 200, data: user };
        }
        if (method === 'GET' && !id) return { status: 200, data: Array.from(db.users.values()) };
        
        if (id) {
            // Check avatar protection status
            if (subEntity === 'avatar-protection') {
                 const user = db.users.get(id);
                 if (!user) return { status: 404, error: "User not found" };
                 
                 if (method === 'GET') {
                     return { status: 200, data: { isEnabled: !!user.isAvatarProtected } };
                 }
                 if (method === 'POST') {
                     user.isAvatarProtected = body.isEnabled;
                     db.users.set(id, user);
                     saveDb();
                     webSocketServerInstance.broadcastUserUpdate(user);
                     return { status: 200, data: { success: true, user } };
                 }
            }

            // Report user
            if (subEntity === 'report' && method === 'POST') {
                 const { reason } = body;
                 db.reports.push({
                     reporterId: CURRENT_USER_ID,
                     reportedId: id,
                     reason,
                     timestamp: new Date().toISOString()
                 });
                 saveDb();
                 return { status: 200, data: { success: true } };
            }

            if (subEntity === 'block') {
                const blockerId = CURRENT_USER_ID;
                if (!db.blocklist.has(blockerId)) db.blocklist.set(blockerId, new Set());
                db.blocklist.get(blockerId)!.add(id);
                db.following.get(blockerId)?.delete(id);
                db.fans.get(id)?.delete(blockerId);
                db.following.get(id)?.delete(blockerId);
                db.fans.get(blockerId)?.delete(id);
                saveDb();
                return { status: 200, data: { success: true } };
            }
            if (subEntity === 'unblock') {
                db.blocklist.get(CURRENT_USER_ID)?.delete(id);
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
                    
                    // --- SYNC WORKS/OBRAS WITH PHOTO FEED ---
                    if (body.obras) {
                         const newObras: Obra[] = body.obras;
                         // Keep existing photoFeed items or add new ones
                         
                         newObras.forEach(obra => {
                             // Check if this obra is already in the feed
                             const exists = db.photoFeed.some(p => p.id === obra.id);
                             if (!exists) {
                                 // Add new photo/video to the global feed
                                 // Add duration if video
                                 const isVideo = obra.url.toLowerCase().startsWith('data:video') || 
                                                obra.url.toLowerCase().includes('.mp4') || 
                                                obra.url.toLowerCase().includes('.webm') ||
                                                obra.url.toLowerCase().includes('video');
                                 
                                 // Mock Duration Logic: 5s to 30s
                                 const duration = isVideo ? Math.floor(Math.random() * 26 + 4) : undefined;
                                 
                                 db.photoFeed.unshift({
                                     id: obra.id,
                                     photoUrl: obra.url,
                                     user: updatedUser,
                                     likes: 0,
                                     isLiked: false,
                                     duration
                                 });
                             } else {
                                // If it exists, update it to ensure new properties are synced
                                const existingFeedItem = db.photoFeed.find(p => p.id === obra.id);
                                if (existingFeedItem) {
                                     // Ensure duration is present if it's a video
                                    const isVideo = obra.url.toLowerCase().startsWith('data:video') || 
                                                    obra.url.toLowerCase().includes('.mp4');
                                    if (isVideo && !existingFeedItem.duration) {
                                        existingFeedItem.duration = Math.floor(Math.random() * 26 + 4);
                                    }
                                }
                             }
                         });

                         // Remove items from feed if they are removed from 'obras'
                         db.photoFeed = db.photoFeed.filter(p => {
                            if (p.user.id === id) {
                                return newObras.some(o => o.id === p.id);
                            }
                            return true;
                         });
                    }
                    
                    // Update user info in existing feed items (e.g. avatar/name change)
                    db.photoFeed.forEach(p => {
                        if (p.user.id === id) {
                            p.user = updatedUser;
                        }
                    });
                    
                    if (updatedUser.id === CURRENT_USER_ID) updatedUser.platformEarnings = db.platform_earnings;
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
                updatedFollowed.isFollowed = !isUnfollow;
                saveDb();
                webSocketServerInstance.broadcastGlobalFollowUpdate(updatedFollower, updatedFollowed, isUnfollow);
                if (!isUnfollow) webSocketServerInstance.notifyNewFollower(followedId, updatedFollower);
                return { status: 200, data: { success: true, updatedFollower, updatedFollowed } };
            }
             const user = db.users.get(id);
             if (user) user.isFollowed = db.following.get(CURRENT_USER_ID)?.has(id);
             if (subEntity === 'fans') return { status: 200, data: Array.from(db.fans.get(id) || []).map(fanId => db.users.get(fanId)) };
             if (subEntity === 'following') return { status: 200, data: Array.from(db.following.get(id) || []).map(fId => db.users.get(fId)) };
             if (subEntity === 'received-gifts') {
                const received = db.receivedGifts.get(id) || [];
                return { status: 200, data: received };
             }
             if (subEntity === 'friends') {
                const followingIds = db.following.get(id) || new Set();
                const friends = Array.from(followingIds).filter(followedId => db.following.get(followedId)?.has(id)).map(friendId => db.users.get(friendId));
                return { status: 200, data: friends };
             }
             if (subEntity === 'messages') {
                 // Get list of conversations with unread count
                 // Filter all messages where user is sender or receiver
                 const userMessages = Array.from(db.messages.values())
                     .filter(m => m.from === id || m.to === id);
                 
                 // Group by chat partner
                 const conversationsMap = new Map<string, Conversation>();
                 
                 userMessages.forEach(msg => {
                     const partnerId = msg.from === id ? msg.to : msg.from;
                     const partner = db.users.get(partnerId);
                     
                     if (partner) {
                         const existingConv = conversationsMap.get(partnerId);
                         const isUnread = msg.to === id && msg.status !== 'read';
                         
                         if (!existingConv || new Date(msg.timestamp) > new Date(existingConv.timestamp)) {
                             conversationsMap.set(partnerId, {
                                 id: partnerId,
                                 friend: partner,
                                 lastMessage: msg.text || (msg.imageUrl ? 'Imagem' : ''),
                                 timestamp: msg.timestamp,
                                 unreadCount: isUnread ? 1 : 0
                             });
                         } else if (isUnread && existingConv) {
                             if (existingConv.unreadCount === undefined) existingConv.unreadCount = 0;
                             existingConv.unreadCount += 1;
                         }
                     }
                 });
                 
                 // Sort by latest message
                 const sortedConversations = Array.from(conversationsMap.values())
                     .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                     
                 return { status: 200, data: sortedConversations };
             }
             if (subEntity === 'status') return { status: 200, data: { isOnline: user?.isOnline, lastSeen: user?.lastSeen } };
             if (subEntity === 'photos') return { status: 200, data: db.photoFeed.filter(p => p.user.id === id) };
             if (subEntity === 'liked-photos') {
                const likedPhotoIds = db.photoLikes.get(id) || new Set();
                const likedPhotos = db.photoFeed.filter(p => likedPhotoIds.has(p.id));
                const feedWithLikes = likedPhotos.map((photo: FeedPhoto) => ({ ...photo, isLiked: db.photoLikes.get(photo.id)?.has(CURRENT_USER_ID) || false, likes: db.photoLikes.get(photo.id)?.size || 0 }));
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
                     // NOTE: Diamond purchase revenue is NO LONGER added to platform_earnings directly here.
                     // The user requested Admin Wallet to only track withdrawal fees.
                     // db.platform_earnings = (db.platform_earnings || 0) + body.price; 
                     saveDb();
                     webSocketServerInstance.broadcastUserUpdate(user);
                     webSocketServerInstance.broadcastTransactionUpdate(purchaseRecord);
                     return { status: 200, data: { success: true, user } };
                 }
             }
             if (subEntity === 'location-permission') {
                 if(method === 'GET') return { status: 200, data: { status: user?.locationPermission || 'prompt' } };
                 if(method === 'POST') {
                    if (user) { user.locationPermission = body.status; saveDb(); return { status: 200, data: { success: true, user } }; }
                 }
             }
             if (subEntity === 'privacy') {
                if (method === 'POST' && pathParts[4] === 'activity') {
                     if (user) { user.showActivityStatus = body.show; user.isOnline = body.show; saveDb(); webSocketServerInstance.broadcastUserUpdate(user); return { status: 200, data: { success: true, user } }; }
                }
                if (method === 'POST' && pathParts[4] === 'location') {
                   if (user) { user.showLocation = body.show; saveDb(); webSocketServerInstance.broadcastUserUpdate(user); return { status: 200, data: { success: true, user } }; }
                }
             }
             if (subEntity === 'set-active-frame' && method === 'POST') {
                const { frameId } = body;
                const user = db.users.get(id);
                if (!user) return { status: 404, error: "User not found." };
                if (frameId === null) {
                    user.activeFrameId = null; user.frameExpiration = null; db.users.set(id, user); saveDb(); webSocketServerInstance.broadcastUserUpdate(user); return { status: 200, data: { success: true, user } };
                }
                const ownedFrame = user.ownedFrames.find(f => f.frameId === frameId);
                if (ownedFrame && new Date(ownedFrame.expirationDate) > new Date()) {
                    user.activeFrameId = frameId; user.frameExpiration = ownedFrame.expirationDate; db.users.set(id, user); saveDb(); webSocketServerInstance.broadcastUserUpdate(user); return { status: 200, data: { success: true, user } };
                }
                return { status: 404, error: "Você não possui esta moldura ou ela expirou." };
            }
             if(method === 'GET' && !subEntity) return { status: 200, data: user };
        }
    }
    
    // --- Permissions ---
    if (entity === 'permissions') {
        if (id === 'camera' && subEntity) {
            const userId = subEntity;
            if (method === 'GET') return { status: 200, data: { status: db.permissions.get(userId)?.camera || 'prompt' } };
            if (method === 'POST') {
                const userPermissions = db.permissions.get(userId) || { camera: 'prompt', microphone: 'prompt' };
                userPermissions.camera = body.status;
                db.permissions.set(userId, userPermissions);
                saveDb();
                return { status: 200, data: {} };
            }
        }
        if (id === 'microphone' && subEntity) {
            const userId = subEntity;
            if (method === 'GET') return { status: 200, data: { status: db.permissions.get(userId)?.microphone || 'prompt' } };
            if (method === 'POST') {
                const userPermissions = db.permissions.get(userId) || { camera: 'prompt', microphone: 'prompt' };
                userPermissions.microphone = body.status;
                db.permissions.set(userId, userPermissions);
                saveDb();
                return { status: 200, data: {} };
            }
        }
    }

    // --- Earnings ---
    if (entity === 'earnings') {
      if (id === 'get' && subEntity) {
        const userId = subEntity;
        const user = db.users.get(userId);
        if (user) {
          const available_diamonds = user.earnings;
          const gross_brl_full = calculateGrossBRL(available_diamonds);
          const platform_fee_brl_full = gross_brl_full * 0.20;
          const net_brl_full = gross_brl_full - platform_fee_brl_full;
          return { status: 200, data: { available_diamonds, gross_brl: truncateBRL(gross_brl_full), platform_fee_brl: truncateBRL(platform_fee_brl_full), net_brl: truncateBRL(net_brl_full) }};
        }
        return { status: 404, error: "User not found" };
      }
      if (id === 'calculate' && method === 'POST') {
        const amount = body.amount;
        if (typeof amount !== 'number' || amount < 0) return { status: 400, error: 'Invalid amount' };
        const gross_value_full = calculateGrossBRL(amount);
        const platform_fee_full = gross_value_full * 0.20;
        const net_value_full = gross_value_full - platform_fee_full;
        return { status: 200, data: { gross_value: truncateBRL(gross_value_full), platform_fee: truncateBRL(platform_fee_full), net_value: truncateBRL(net_value_full) }};
      }
      if (id === 'withdraw' && subEntity && method === 'POST') {
        const userId = subEntity;
        const amount = body.amount;
        const user = db.users.get(userId);
        if (!user) return { status: 404, error: "User not found" };
        if (!user.withdrawal_method) return { status: 400, error: "Método de saque não configurado."};
        if (user.earnings < amount) return { status: 400, error: "Saldo de ganhos insuficiente."};
        
        const grossBRLFull = calculateGrossBRL(amount);
        
        // Strict Rounding for Financial Accuracy (2 decimal places)
        const feeFull = truncateBRL(grossBRLFull * 0.20); 
        const netBRLFull = truncateBRL(grossBRLFull - feeFull);
        
        user.earnings -= amount;
        user.earnings_withdrawn = (user.earnings_withdrawn || 0) + amount;
        
        // 1. Update Platform/Admin Earnings Balance with strictly the fee (truncated)
        db.platform_earnings = truncateBRL((db.platform_earnings || 0) + feeFull);
        
        // 2. Create Withdrawal Record for User
        const transaction: PurchaseRecord = {
          id: `withdraw_${Date.now()}`,
          userId: user.id,
          type: 'withdraw_earnings',
          description: `Saque para ${user.withdrawal_method.method}`,
          amountBRL: netBRLFull, // The actual net amount user gets
          amountCoins: amount,
          status: 'Concluído',
          timestamp: new Date().toISOString()
        };
        db.purchases.unshift(transaction);
        
        // 3. Create Income Record for Admin (The Fee Only)
        const feeRecord: PurchaseRecord = {
            id: `fee_${Date.now()}`,
            userId: CURRENT_USER_ID, // Assuming this is the Admin ID
            type: 'platform_fee_income',
            description: `Taxa de saque de ${user.name}`,
            amountBRL: feeFull, // Strictly the 20% fee
            amountCoins: 0,
            status: 'Concluído',
            timestamp: new Date().toISOString()
        };
        db.purchases.unshift(feeRecord);

        db.users.set(userId, user);
        saveDb();
        
        webSocketServerInstance.broadcastUserUpdate(user);
        webSocketServerInstance.broadcastTransactionUpdate(transaction);
        
        // Notify admin if listening
        const adminUser = db.users.get(CURRENT_USER_ID);
        if (adminUser) {
            adminUser.platformEarnings = db.platform_earnings;
            db.users.set(CURRENT_USER_ID, adminUser); // Update admin in DB
            
            webSocketServerInstance.broadcastUserUpdate(adminUser);
            webSocketServerInstance.broadcastTransactionUpdate(feeRecord);
        }
        
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
    
    // ... rest of the file
    // --- Streams ---
    if (entity === 'streams') {
        if (method === 'POST' && !id) {
            const host = db.users.get(CURRENT_USER_ID);
            if (!host) return { status: 401, error: "Current user not found." };
            
            // GENERATE MOCK INGEST KEYS & URLS
            const streamKey = `live_${host.id}_${Math.random().toString(36).substring(2, 8)}`;
            
            // USE REAL IP FROM CONFIG
            const serverIp = '72.60.249.175';

            const rtmpIngestUrl = `rtmp://${serverIp}/live`;
            const srtIngestUrl = `srt://${serverIp}:10080?streamid=#!::h=${streamKey},m=publish`;
            // Playback via HLS or WebRTC
            const playbackUrl = `http://${serverIp}:8080/live/${streamKey}.m3u8`;

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
                // New Fields
                rtmpIngestUrl,
                srtIngestUrl,
                streamKey,
                playbackUrl
            };
            db.streamers.unshift(newStream);
            saveDb();
            return { status: 201, data: newStream };
        }
        if (id === 'manual' && method === 'GET') return { status: 200, data: db.liveStreamManual };
        if (id === 'effects' && method === 'GET') return { status: 200, data: db.beautyEffects };
        if (id) {
            const streamId = id;
            const streamIndex = db.streamers.findIndex(s => s.id === streamId);
            const stream = streamIndex > -1 ? db.streamers[streamIndex] : null;

            if (subEntity === 'end-session' && method === 'POST') {
                if (!stream) return { status: 404, error: "Stream not found" };
                const host = db.users.get(stream.hostId);
                if (!host) return { status: 404, error: "Host not found" };
                host.isLive = false;
                db.users.set(stream.hostId, host);
                db.streamers = db.streamers.filter(s => s.id !== streamId);
                db.liveSessions.delete(streamId);
                db.streamRooms.delete(streamId);
                db.kickedUsers.delete(streamId);
                db.moderators.delete(streamId);
                db.pkBattles.delete(streamId);
                saveDb();
                webSocketServerInstance.broadcastUserUpdate(host);
                return { status: 200, data: { success: true, user: host } };
            }

            if (!stream) return { status: 404, error: "Stream not found" };

            // NEW: PUT Stream (Update) - e.g. for Privacy Toggle
            if (method === 'PUT' && !subEntity) {
                 Object.assign(stream, body);
                 db.streamers[streamIndex] = stream;
                 saveDb();
                 // Broadcast update so other viewers see the change (e.g. privacy lock icon)
                 webSocketServerInstance.broadcastRoomUpdate(streamId);
                 return { status: 200, data: stream };
            }

            // NEW: PATCH Stream
            if (method === 'PATCH' && !subEntity) {
                 const updates = body;
                 if (updates.name !== undefined) stream.name = updates.name;
                 if (updates.tags !== undefined) stream.tags = updates.tags;
                 if (updates.isPrivate !== undefined) stream.isPrivate = updates.isPrivate;
                 
                 db.streamers[streamIndex] = stream;
                 saveDb();
                 return { status: 200, data: { success: true, stream } };
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
                const { fromUserId, giftName, amount } = body;
                const sender = db.users.get(fromUserId);
                const gift = db.gifts.find(g => g.name === giftName);
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
                
                // Update received gifts for the streamer
                const received = db.receivedGifts.get(stream.hostId) || [];
                const existingGiftIndex = received.findIndex(g => g.name === giftName);
                
                // Need to clone to avoid reference issues if using direct array mutation
                const newReceived = [...received];
                if (existingGiftIndex > -1) {
                     newReceived[existingGiftIndex] = { 
                        ...newReceived[existingGiftIndex], 
                        count: newReceived[existingGiftIndex].count + amount 
                    };
                } else {
                    newReceived.push({ ...gift, count: amount });
                }
                db.receivedGifts.set(stream.hostId, newReceived);
                
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
             if (subEntity === 'quality' && method === 'PUT') {
                 stream.quality = body.quality;
                 saveDb();
                 return { status: 200, data: { success: true, stream } };
             }
             if (subEntity === 'toggle-mic' && method === 'POST') {
                 webSocketServerInstance.broadcastMicStateUpdate(streamId, true); 
                 return { status: 200, data: {} };
             }
             if (subEntity === 'toggle-sound' && method === 'POST') {
                  webSocketServerInstance.broadcastSoundStateUpdate(streamId, true);
                  return { status: 200, data: {} };
             }
             if (subEntity === 'toggle-auto-follow' && method === 'POST') {
                 return { status: 200, data: {} };
             }
             if (subEntity === 'toggle-auto-invite' && method === 'POST') {
                 webSocketServerInstance.broadcastAutoInviteStateUpdate(streamId, body.isEnabled);
                 return { status: 200, data: {} };
             }
             if (subEntity === 'private-invite' && method === 'POST') {
                 webSocketServerInstance.sendDirectInvite(body.userId, streamId);
                 return { status: 200, data: {} };
             }
             if (subEntity === 'access-check' && method === 'GET') {
                 // Enhanced logic: Check invitations and privacy
                 const userId = url.searchParams.get('userId');
                 
                 // Host always has access
                 if (userId === stream.hostId) {
                    return { status: 200, data: { canJoin: true } };
                 }

                 if (!stream.isPrivate) {
                    return { status: 200, data: { canJoin: true } };
                 }
                 
                 // Check if user has an invitation
                 const hasInvite = db.invitations.some(
                    inv => inv.inviteeId === userId && inv.roomId === streamId
                 );
                 
                 return { status: 200, data: { canJoin: hasInvite } };
             }
             if (subEntity === 'online-users' && method === 'GET') {
                const roomUserIds = db.streamRooms.get(streamId);
                if (!roomUserIds) {
                    const host = db.users.get(stream.hostId);
                    if (host) return { status: 200, data: [{ ...host, value: 0 }] };
                    return { status: 200, data: [] };
                }
                const session = db.liveSessions.get(streamId);
                const giftSenders = session?.giftSenders;
                const usersWithValue = Array.from(roomUserIds).map(userId => {
                        const user = db.users.get(userId);
                        if (!user) return null;
                        const contribution = giftSenders?.get(userId)?.sessionContribution || 0;
                        return { ...user, value: contribution };
                    }).filter((u): u is User & { value: number } => u !== null);
                usersWithValue.sort((a, b) => b.value - a.value);
                return { status: 200, data: usersWithValue };
            }

            // NEW: Stream Messages (Mock persistence)
            if (subEntity === 'messages') {
                if (method === 'GET') {
                    // Filter messages by chatId (using streamId)
                    const roomMessages = Array.from(db.messages.values()).filter(m => m.chatId === streamId);
                    return { status: 200, data: roomMessages };
                }
                if (method === 'POST') {
                     const { user, text } = body;
                     const msg: Message = {
                        id: `msg_${Date.now()}_${Math.random()}`,
                        chatId: streamId, 
                        from: user.id,
                        to: streamId,
                        text: text,
                        timestamp: new Date().toISOString(),
                        status: 'sent'
                     };
                     db.messages.set(msg.id, msg);
                     saveDb();
                     return { status: 201, data: msg };
                }
            }

            // NEW: Interactions
            if (subEntity === 'interactions' && method === 'POST') {
                return { status: 200, data: { success: true } };
            }
        }
    }
    
    // --- Invitations (New Routes) ---
    if (entity === 'invitations') {
        if (id === 'send' && method === 'POST') {
            const { roomId, userId } = body;
            const inviterId = CURRENT_USER_ID; 

            // Create new invitation
            const newInvitation: Invitation = {
                id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                inviterId: inviterId,
                inviteeId: userId,
                roomId: roomId,
                status: 'pending',
                timestamp: new Date().toISOString()
            };
            
            db.invitations.push(newInvitation);
            saveDb();
            
            // Notify user via WebSocket
            webSocketServerInstance.sendDirectInvite(userId, roomId);

            return { status: 200, data: { success: true } };
        }

        if (id === 'received' && method === 'GET') {
            const userId = CURRENT_USER_ID; // Assuming current user context for simplicity or parse from token
            const myInvitations = db.invitations.filter(inv => inv.inviteeId === userId);
            return { status: 200, data: myInvitations };
        }
    }

    if (entity === 'rooms') {
        // NEW: Get rooms list with filters
        if (method === 'GET' && !id) {
             const category = url.searchParams.get('category');
             if (category === 'private') {
                 const userId = url.searchParams.get('userId') || CURRENT_USER_ID;
                 const myInvites = db.invitations.filter(i => i.inviteeId === userId).map(i => i.roomId);
                 const privateRooms = db.streamers.filter(s => s.isPrivate && (s.hostId === userId || myInvites.includes(s.id)));
                 return { status: 200, data: privateRooms };
             }
             return { status: 200, data: db.streamers };
        }

        if (id && !subEntity && method === 'GET') {
             const stream = db.streamers.find(s => s.id === id);
             if (stream) return { status: 200, data: stream };
             return { status: 404, error: "Room not found" };
        }

        if (id && subEntity === 'join' && method === 'POST') {
             const streamId = id;
             const { userId } = body;
             const stream = db.streamers.find(s => s.id === streamId);
             
             if (!stream) return { status: 404, error: "Room not found" };

             if (!stream.isPrivate || stream.hostId === userId) {
                 return { status: 200, data: { success: true, canJoin: true } };
             }

             // Check invitation
             const hasInvite = db.invitations.some(
                inv => inv.inviteeId === userId && inv.roomId === streamId
             );

             if (hasInvite) {
                 return { status: 200, data: { success: true, canJoin: true } };
             }
             
             return { status: 403, error: "Access denied. Private room." };
        }
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
    }

    if (entity === 'effects') {
        if (id === 'purchase-frame' && subEntity && method === 'POST') {
            const userId = subEntity;
            const { frameId } = body;
            const user = db.users.get(userId);
            const frame = avatarFrames.find(f => f.id === frameId);
            if (!user || !frame) return { status: 404, error: "Usuário ou moldura não encontrado." };
            if (user.diamonds < frame.price) return { status: 400, error: "Diamantes insuficientes." };
            
            const brlValue = calculateGrossBRL(frame.price);
            
            user.diamonds -= frame.price;
            const existingFrameIndex = user.ownedFrames.findIndex(f => f.frameId === frameId);
            let finalExpirationDate;
            if (existingFrameIndex > -1) {
                const currentExp = new Date(user.ownedFrames[existingFrameIndex].expirationDate);
                const newExp = new Date(Math.max(currentExp.getTime(), Date.now()));
                newExp.setDate(newExp.getDate() + frame.duration);
                user.ownedFrames[existingFrameIndex].expirationDate = newExp.toISOString();
                finalExpirationDate = newExp.toISOString();
            } else {
                const expirationDate = new Date();
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
            if (method === 'GET') return { status: 200, data: db.pkDefaultConfig };
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
            if (!stream) return { status: 404, error: "Stream not found." };
            db.pkBattles.set(streamId, { opponentId, heartsA: 0, heartsB: 0, scoreA: 0, scoreB: 0 });
            saveDb();
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
                if (team === 'A') battle.heartsA++; else battle.heartsB++;
                webSocketServerInstance.broadcastPKHeartUpdate(roomId, battle.heartsA, battle.heartsB);
                return { status: 200, data: { success: true } };
            }
            return { status: 404, error: "Battle not found" };
        }
    }

  } catch (e) {
    console.error(`[API MOCK] Error processing ${method} ${path}:`, e);
    return { status: 500, error: 'Internal Server Error' };
  }
  
  console.error(`[API MOCK] Unhandled route: ${method} ${path}`);
  return { status: 404, error: `Unhandled route: ${method} ${path}` };
};
