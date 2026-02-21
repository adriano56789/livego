
import { db, saveDb, levelProgression } from '../services/database';
import { webSocketServerInstance } from '../services/websocket';
import { User, EligibleUser } from '../types';

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

export const GiftController = {
  async getGifts(req: any, res: any) {
      return res.status(200).json(db.gifts);
  },

  async sendGift(req: any, res: any) {
      const { fromUserId, streamId, giftName, amount } = req.body;
      const stream = db.streamers.find(s => s.id === streamId);
      const gift = db.gifts.find(g => g.name === giftName);
      const sender = db.users.get(fromUserId);
      
      if (!stream || !gift || !sender) return res.status(404).json({ error: "Not found" });
      const receiver = db.users.get(stream.hostId);
      if (!receiver) return res.status(404).json({ error: "Receiver not found" });

      const totalCost = gift.price * amount;
      if (sender.diamonds < totalCost) return res.status(400).json({ error: "Not enough diamonds" });

      // Transação
      sender.diamonds -= totalCost;
      sender.enviados += totalCost;
      sender.xp = (sender.xp || 0) + totalCost * 10; // 10 XP per diamond
      
      receiver.earnings += totalCost;
      receiver.receptores += totalCost;
      receiver.xp = (receiver.xp || 0) + totalCost * 5; // Receiver gets less XP usually

      const updatedSender = updateUserLevel(sender);
      const updatedReceiver = updateUserLevel(receiver);

      // Update Session
      const session = db.liveSessions.get(streamId);
      if (session) {
          session.coins += totalCost;
          if (!session.giftSenders) session.giftSenders = new Map();
          
          let senderStats = session.giftSenders.get(sender.id);
          if (!senderStats) {
               // Clone sender basic info
               senderStats = { ...updatedSender, giftsSent: [], sessionContribution: 0 } as EligibleUser;
          }
          senderStats.sessionContribution += totalCost;
          
          const existingGift = senderStats.giftsSent.find(g => g.name === gift.name);
          if (existingGift) {
              existingGift.quantity += amount;
          } else {
              senderStats.giftsSent.push({ name: gift.name, icon: gift.icon, quantity: amount, component: gift.component });
          }
          session.giftSenders.set(sender.id, senderStats);
      }

      // Update Receiver Gift Inventory
      const receivedList = db.receivedGifts.get(receiver.id) || [];
      const existingRec = receivedList.find(g => g.name === giftName);
      if (existingRec) {
          existingRec.count += amount;
      } else {
          receivedList.push({ ...gift, count: amount });
      }
      db.receivedGifts.set(receiver.id, receivedList);

      // Stats globais
      db.contributions.set(sender.id, (db.contributions.get(sender.id) || 0) + totalCost);

      saveDb();
      
      // Broadcasts
      webSocketServerInstance.broadcastUserUpdate(updatedSender);
      webSocketServerInstance.broadcastUserUpdate(updatedReceiver);
      webSocketServerInstance.broadcastRoomUpdate(streamId);

      return res.status(200).json({ success: true, updatedSender, updatedReceiver });
  },
  
  async getReceivedGifts(req: any, res: any) {
      const { userId } = req.params;
      const gifts = db.receivedGifts.get(userId) || [];
      return res.status(200).json(gifts);
  }
};