
import { db, saveDb, CURRENT_USER_ID, levelProgression } from '../services/database';
import { webSocketServerInstance } from '../services/websocket';
import { User, Conversation, LevelInfo } from '../types';

const calculateAgeFromDate = (birthDateString?: string): number | undefined => {
    if (!birthDateString) return undefined;
    const parts = birthDateString.split('/');
    if (parts.length !== 3) return undefined;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
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

export const UserController = {
  async getAllUsers(req: any, res: any) {
    const users = Array.from(db.users.values());
    return res.status(200).json(users);
  },

  async getMe(req: any, res: any) {
    const user = db.users.get(CURRENT_USER_ID);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.platformEarnings = db.platform_earnings; 
    return res.status(200).json(user);
  },

  async getUser(req: any, res: any) {
    const { id } = req.params;
    const user = db.users.get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const isFollowed = db.following.get(CURRENT_USER_ID)?.has(id) || false;
    return res.status(200).json({ ...user, isFollowed });
  },

  async updateProfile(req: any, res: any) {
    const { id } = req.params;
    const updates = req.body;
    const user = db.users.get(id);

    if (user) {
        Object.assign(user, updates);
        
        if (updates.birthday) {
             const newAge = calculateAgeFromDate(updates.birthday);
             if (newAge !== undefined) user.age = newAge;
        }

        if (updates.obras) {
             db.photoFeed.forEach(p => {
                 if (p.user.id === id) {
                     p.user = user; 
                 }
             });
        }

        saveDb();
        webSocketServerInstance.broadcastUserUpdate(user);
        return res.status(200).json({ success: true, user });
    }
    return res.status(404).json({ error: 'User not found' });
  },

  async toggleFollow(req: any, res: any) {
    const { followedId } = req.params;
    const { streamId } = req.body;
    const followerId = CURRENT_USER_ID;

    if (!db.following.has(followerId)) db.following.set(followerId, new Set());
    if (!db.fans.has(followedId)) db.fans.set(followedId, new Set());

    const following = db.following.get(followerId)!;
    const fans = db.fans.get(followedId)!;
    
    const isUnfollow = following.has(followedId);
    
    if (isUnfollow) {
        following.delete(followedId);
        fans.delete(followerId);
    } else {
        following.add(followedId);
        fans.add(followerId);
        const followerUser = db.users.get(followerId);
        if (followerUser) {
            webSocketServerInstance.notifyNewFollower(followedId, followerUser);
        }
    }

    const updatedFollower = db.users.get(followerId)!;
    updatedFollower.following = following.size;
    
    const updatedFollowed = db.users.get(followedId)!;
    updatedFollowed.fans = fans.size;
    updatedFollowed.isFollowed = !isUnfollow;

    saveDb();

    webSocketServerInstance.broadcastUserUpdate(updatedFollower);
    webSocketServerInstance.broadcastUserUpdate(updatedFollowed);
    
    if (streamId) {
        webSocketServerInstance.broadcastFollowUpdate(streamId, updatedFollower, updatedFollowed, isUnfollow);
    } else {
        webSocketServerInstance.broadcastGlobalFollowUpdate(updatedFollower, updatedFollowed, isUnfollow);
    }

    return res.status(200).json({ success: true, updatedFollower, updatedFollowed });
  },

  async blockUser(req: any, res: any) {
    const { userIdToBlock } = req.params;
    const blockerId = CURRENT_USER_ID;

    if (!db.blocklist.has(blockerId)) db.blocklist.set(blockerId, new Set());
    db.blocklist.get(blockerId)!.add(userIdToBlock);
    
    db.following.get(blockerId)?.delete(userIdToBlock);
    db.fans.get(userIdToBlock)?.delete(blockerId);
    
    saveDb();
    return res.status(200).json({ success: true });
  },

  async unblockUser(req: any, res: any) {
      const { userIdToUnblock } = req.params;
      db.blocklist.get(CURRENT_USER_ID)?.delete(userIdToUnblock);
      saveDb();
      return res.status(200).json({ success: true });
  },

  async getBlockedUsers(req: any, res: any) {
      const blockedIds = db.blocklist.get(CURRENT_USER_ID) || new Set<string>();
      const blockedUsers = Array.from(blockedIds).map(uid => db.users.get(uid)).filter(Boolean);
      return res.status(200).json(blockedUsers);
  },

  async reportUser(req: any, res: any) {
    const { userIdToReport } = req.params;
    const { reason } = req.body;
    
    db.reports.push({
        id: `rep_${Date.now()}`,
        reporterId: CURRENT_USER_ID,
        reportedId: userIdToReport,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString()
    });
    saveDb();
    return res.status(200).json({ success: true });
  },

  async getFans(req: any, res: any) {
      const { userId } = req.params;
      const fansIds = db.fans.get(userId) || new Set();
      const fans = Array.from(fansIds).map(fid => db.users.get(fid)).filter(Boolean);
      return res.status(200).json(fans);
  },

  async getFollowing(req: any, res: any) {
      const { userId } = req.params;
      const followingIds = db.following.get(userId) || new Set();
      const following = Array.from(followingIds).map(fid => db.users.get(fid)).filter(Boolean);
      return res.status(200).json(following);
  },

  async getFriends(req: any, res: any) {
      const { userId } = req.params;
      const following = db.following.get(userId) || new Set();
      const fans = db.fans.get(userId) || new Set();
      const friendsIds = Array.from(following).filter(x => fans.has(x));
      const friends = friendsIds.map(fid => db.users.get(fid)).filter(Boolean);
      return res.status(200).json(friends);
  },

  async getUserStatus(req: any, res: any) {
      const { userId } = req.params;
      const user = db.users.get(userId);
      return res.status(200).json({ isOnline: user?.isOnline, lastSeen: user?.lastSeen });
  },
  
  async updateSimStatus(req: any, res: any) {
      const { isOnline } = req.body;
      const user = db.users.get(CURRENT_USER_ID);
      if (user) {
          user.isOnline = isOnline;
          user.lastSeen = new Date().toISOString();
          db.users.set(CURRENT_USER_ID, user);
          saveDb();
          webSocketServerInstance.broadcastUserUpdate(user);
          return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: 'User not found' });
  },

  async getUserPhotos(req: any, res: any) {
      const { userId } = req.params;
      const photos = db.photoFeed.filter((p: any) => p.user.id === userId);
      return res.status(200).json(photos);
  },
  
  async getLikedPhotos(req: any, res: any) {
      const { userId } = req.params;
      const photos = db.photoFeed.filter((p: any) => p.isLiked); 
      return res.status(200).json(photos);
  },

  async getConversations(req: any, res: any) {
      const { userId } = req.params;
      const userMessages = Array.from(db.messages.values())
         .filter((m: any) => m.from === userId || m.to === userId);
      
      const conversationsMap = new Map<string, Conversation>();
      
      userMessages.forEach((msg: any) => {
         const partnerId = msg.from === userId ? msg.to : msg.from;
         const partner = db.users.get(partnerId);
         if (partner) {
             const existingConv = conversationsMap.get(partnerId);
             const isUnread = msg.to === userId && msg.status !== 'read';
             
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
      
      const sortedConversations = Array.from(conversationsMap.values())
         .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return res.status(200).json(sortedConversations);
  },

  async getLevelInfo(req: any, res: any) {
      const { userId } = req.params;
      const user = db.users.get(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const currentLevelInfo = levelProgression.find(l => l.level === user.level) || levelProgression[0];
      const nextLevelInfo = levelProgression.find(l => l.level === user.level + 1);
      
      const info: LevelInfo = {
        level: user.level,
        xp: user.xp || 0,
        xpForCurrentLevel: currentLevelInfo.xpRequired,
        xpForNextLevel: nextLevelInfo?.xpRequired || currentLevelInfo.xpRequired,
        progress: nextLevelInfo ? (((user.xp || 0) - currentLevelInfo.xpRequired) / (nextLevelInfo.xpRequired - currentLevelInfo.xpRequired)) * 100 : 100,
        privileges: currentLevelInfo.privileges,
        nextRewards: nextLevelInfo?.nextRewards || []
      };
      
      return res.status(200).json(info);
  },

  async getVisitors(req: any, res: any) {
      const { userId } = req.params;
      const visits = db.visits.get(userId) || [];
      const visitors = visits.map(v => {
          const u = db.users.get(v.visitorId);
          return u ? { ...u, visitTimestamp: v.timestamp } : null;
      }).filter(Boolean);
      return res.status(200).json(visitors);
  },

  async clearVisitors(req: any, res: any) {
      const { userId } = req.params;
      db.visits.delete(userId);
      saveDb();
      return res.status(200).json({ success: true });
  },

  async recordVisit(req: any, res: any) {
      const { id } = req.params; // Profile being visited
      const { userId } = req.body; // Visitor
      const visits = db.visits.get(id) || [];
      const newVisits = [{ visitorId: userId, timestamp: new Date().toISOString() }, ...visits.filter(v => v.visitorId !== userId)];
      db.visits.set(id, newVisits.slice(0, 50));
      saveDb();
      return res.status(200).json({});
  },
  
  async setActiveFrame(req: any, res: any) {
      const { id } = req.params;
      const { frameId } = req.body;
      const user = db.users.get(id);
      if (!user) return res.status(404).json({ error: "User not found." });
      
      if (frameId === null) {
          user.activeFrameId = null;
          user.frameExpiration = null;
      } else {
          const ownedFrame = user.ownedFrames.find(f => f.frameId === frameId);
          if (ownedFrame && new Date(ownedFrame.expirationDate) > new Date()) {
              user.activeFrameId = frameId;
              user.frameExpiration = ownedFrame.expirationDate;
          } else {
              return res.status(404).json({ error: "Moldura não encontrada ou expirada." });
          }
      }
      db.users.set(id, user);
      saveDb();
      webSocketServerInstance.broadcastUserUpdate(user);
      return res.status(200).json({ success: true, user });
  },
  
  async getAvatarProtectionStatus(req: any, res: any) {
       const { id } = req.params;
       const user = db.users.get(id);
       if (!user) return res.status(404).json({ error: "User not found" });
       return res.status(200).json({ isEnabled: !!user.isAvatarProtected });
  },

  async toggleAvatarProtection(req: any, res: any) {
      const { id } = req.params;
      const { isEnabled } = req.body;
      const user = db.users.get(id);
      if (user) {
          user.isAvatarProtected = isEnabled;
          db.users.set(id, user);
          saveDb();
          webSocketServerInstance.broadcastUserUpdate(user);
          return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: "User not found" });
  },

  async getLocationPermission(req: any, res: any) {
      const { id } = req.params;
      const user = db.users.get(id);
      return res.status(200).json({ status: user?.locationPermission || 'prompt' });
  },

  async updateLocationPermission(req: any, res: any) {
      const { id } = req.params;
      const { status } = req.body;
      const user = db.users.get(id);
      if (user) {
          user.locationPermission = status;
          saveDb();
          return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: "User not found" });
  },
  
  async updatePrivacyActivity(req: any, res: any) {
      const { id } = req.params;
      const { show } = req.body;
      const user = db.users.get(id);
      if (user) {
          user.showActivityStatus = show;
          user.isOnline = show; // Simplify: hide status means offline
          saveDb();
          webSocketServerInstance.broadcastUserUpdate(user);
          return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: "User not found" });
  },

  async updatePrivacyLocation(req: any, res: any) {
      const { id } = req.params;
      const { show } = req.body;
      const user = db.users.get(id);
      if (user) {
          user.showLocation = show;
          saveDb();
          webSocketServerInstance.broadcastUserUpdate(user);
          return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: "User not found" });
  },

  async getChatPermissionStatus(req: any, res: any) {
      const { id } = req.params;
      const user = db.users.get(id);
      return res.status(200).json({ permission: user?.chatPermission || 'all' });
  },

  async updateChatPermission(req: any, res: any) {
      const { id } = req.params;
      const { permission } = req.body;
      const user = db.users.get(id);
      if (user) {
          user.chatPermission = permission;
          saveDb();
          return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: "User not found" });
  }
};
