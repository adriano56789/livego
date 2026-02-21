
import { db, saveDb, CURRENT_USER_ID } from '../services/database';
import { Streamer, StreamHistoryEntry, LiveNotification } from '../types';
import { webSocketServerInstance } from '../services/websocket';
import { StreamReminder } from '../services/database';

export const StreamController = {
  // ... (keeping existing methods: createStream, startStreamNotification, getLiveStreamers, updateStream, endStreamSession, addHistory, getOnlineUsers, checkAccess, getManual, getEffects, inviteFriendForCoHost)

  async createStream(req: any, res: any) {
    const host = db.users.get(CURRENT_USER_ID);
    if (!host) return res.status(401).json({ error: "Unauthorized" });

    // Mock Ingest logic
    const serverIp = '72.60.249.175';
    const streamKey = `live_${host.id}_${Math.random().toString(36).substring(2, 8)}`;
    
    const newStream: Streamer = {
        id: `stream_${Date.now()}`,
        hostId: host.id,
        name: req.body.name || `Live de ${host.name}`,
        avatar: host.avatarUrl,
        location: host.location || 'Brasil',
        time: new Date().toISOString(),
        message: req.body.message || 'Venha me ver!',
        tags: req.body.tags || ['new'],
        isPrivate: req.body.isPrivate || false,
        viewers: 0,
        quality: '480p',
        country: host.country || 'br',
        rtmpIngestUrl: `rtmp://${serverIp}/live`,
        srtIngestUrl: `srt://${serverIp}:10080?streamid=#!::h=${streamKey},m=publish`,
        streamKey: streamKey,
        playbackUrl: `http://${serverIp}:8080/live/${streamKey}.m3u8`
    };

    db.streamers.unshift(newStream);
    saveDb();
    
    return res.status(201).json(newStream);
  },

  async startStreamNotification(req: any, res: any) {
     const { streamId } = req.body;
     const stream = db.streamers.find((s: any) => s.id === streamId);
     if (!stream) return res.status(404).json({ error: "Stream not found" });

     const host = db.users.get(stream.hostId);
     if (host) {
         host.isLive = true;
         db.users.set(host.id, host);

         const fansSet = db.fans.get(host.id) || new Set();
         fansSet.forEach((fanId: string) => {
             const notif: LiveNotification = {
                 id: `notif_${Date.now()}_${Math.random()}`,
                 userId: fanId,
                 streamerId: host.id,
                 streamerName: host.name,
                 streamerAvatar: host.avatarUrl,
                 streamId: streamId,
                 read: false,
                 createdAt: new Date().toISOString()
             };
             db.liveNotifications.push(notif);
         });

         saveDb();
         webSocketServerInstance.notifyStreamerGoesLive(stream, stream.isPrivate || false);
         return res.status(200).json({ success: true });
     }
     return res.status(404).json({ error: "Host not found" });
  },

  async getLiveStreamers(req: any, res: any) {
    const { category, country, userId } = req.query;
    const requestingUserId = (userId as string) || CURRENT_USER_ID;

    let filtered = [...db.streamers];
    if (country && country !== 'ICON_GLOBE') {
        filtered = filtered.filter((s: any) => s.country === country);
    }

    switch (category) {
        case 'popular': filtered.sort((a: any, b: any) => (b.viewers || 0) - (a.viewers || 0)); break;
        case 'followed': 
            const followedIds = db.following.get(requestingUserId) || new Set(); 
            filtered = filtered.filter((s: any) => followedIds.has(s.hostId)); 
            break;
        case 'nearby': filtered = filtered.filter((s: any) => s.tags.includes('Perto')); break;
        case 'pk': filtered = filtered.filter((s: any) => s.tags.includes('PK')); break;
        case 'new': filtered = filtered.filter((s: any) => s.tags.includes('Novo')); break;
        case 'private':
            const myInvites = db.invitations.filter((i: any) => i.inviteeId === requestingUserId).map((i: any) => i.roomId);
            filtered = filtered.filter((s: any) => s.isPrivate && (s.hostId === requestingUserId || myInvites.includes(s.id)));
            break;
    }

    return res.status(200).json(filtered);
  },

  async updateStream(req: any, res: any) {
      const { id } = req.params;
      const index = db.streamers.findIndex((s: any) => s.id === id);
      if (index === -1) return res.status(404).json({ error: "Stream not found" });

      const updatedStream = { ...db.streamers[index], ...req.body };
      db.streamers[index] = updatedStream;
      saveDb();
      
      if (req.body.isPrivate !== undefined) {
          webSocketServerInstance.broadcastRoomUpdate(id);
      }
      
      return res.status(200).json({ success: true, stream: updatedStream });
  },

  async endStreamSession(req: any, res: any) {
      const { id } = req.params;
      const { session } = req.body;
      
      const stream = db.streamers.find((s: any) => s.id === id); 
      db.streamers = db.streamers.filter((s: any) => s.id !== id);
      
      const hostId = stream ? stream.hostId : CURRENT_USER_ID; 
      const host = db.users.get(hostId);
      if (host) {
          host.isLive = false;
          host.earnings += (session?.coins || 0);
          host.fans += (session?.newFans || 0);
          db.users.set(hostId, host);
          webSocketServerInstance.broadcastUserUpdate(host);
      }

      db.liveSessions.delete(id);
      db.streamRooms.delete(id);
      db.kickedUsers.delete(id);
      db.moderators.delete(id);
      db.pkBattles.delete(id);

      saveDb();
      return res.status(200).json({ success: true, user: host });
  },

  async addHistory(req: any, res: any) {
      const entry: StreamHistoryEntry = req.body;
      db.streamHistory.unshift(entry);
      saveDb();
      return res.status(201).json({ success: true });
  },

  async getOnlineUsers(req: any, res: any) {
      const { id } = req.params;
      const roomUserIds = db.streamRooms.get(id);
      if (!roomUserIds) return res.status(200).json([]);

      const session = db.liveSessions.get(id);
      const giftSenders = session?.giftSenders;

      const users = Array.from(roomUserIds).map((uid: string) => {
          const u = db.users.get(uid);
          if (!u) return null;
          const contribution = giftSenders?.get(uid)?.sessionContribution || 0;
          return { ...u, value: contribution };
      }).filter(Boolean);

      users.sort((a: any, b: any) => b.value - a.value);
      return res.status(200).json(users);
  },

  async checkAccess(req: any, res: any) {
      const { id } = req.params;
      const { userId } = req.query;
      const stream = db.streamers.find((s: any) => s.id === id);

      if (!stream) return res.status(404).json({ error: "Stream not found" });

      if (!stream.isPrivate || stream.hostId === userId) {
          return res.status(200).json({ canJoin: true });
      }

      const hasInvite = db.invitations.some((i: any) => i.inviteeId === userId && i.roomId === id);
      return res.status(200).json({ canJoin: hasInvite });
  },

  async getManual(req: any, res: any) {
      // Fix: Changed from db.liveStreamManual to db.streamManuals
      return res.status(200).json(db.streamManuals);
  },

  async getEffects(req: any, res: any) {
      return res.status(200).json(db.beautyEffects);
  },

  async inviteFriendForCoHost(req: any, res: any) {
      const { streamId, inviteeId } = req.body;
      const inviter = db.users.get(CURRENT_USER_ID);
      const invitee = db.users.get(inviteeId);
      const stream = db.streamers.find((s: any) => s.id === streamId);
      
      if (inviter && invitee && stream) {
          webSocketServerInstance.sendCoHostInvite(inviteeId, { inviter, stream });
          return res.status(200).json({ success: true, message: `Convite enviado para ${invitee.name}.` });
      }
      return res.status(404).json({ error: "Usuário ou stream não encontrado." });
  },

  // --- Logic for StreamReminder (Model: StreamReminder) ---
  async toggleReminder(req: any, res: any) {
      const { streamerId, userId } = req.body;
      const existingIndex = db.streamReminders.findIndex((r: StreamReminder) => r.userId === userId && r.streamerId === streamerId);
      
      if (existingIndex > -1) {
          // Logic: If exists, remove it
          db.streamReminders.splice(existingIndex, 1);
          saveDb();
          return res.status(200).json({ success: true, status: 'removed' });
      } else {
          // Logic: If not exists, create it
          const reminder: StreamReminder = {
              id: `rem_${Date.now()}`,
              userId,
              streamerId,
              reminderType: 'always',
              status: 'pending'
          };
          db.streamReminders.push(reminder);
          saveDb();
          return res.status(200).json({ success: true, status: 'added' });
      }
  },
  
  // --- Logic for StreamResolution (Model: StreamResolution) ---
  async getResolutions(req: any, res: any) {
      const activeResolutions = db.streamResolutions.filter((r: any) => r.isActive).sort((a: any, b: any) => a.order - b.order);
      return res.status(200).json(activeResolutions);
  }
};
