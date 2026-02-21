
import { db, saveDb, createChatKey } from '../services/database';
import { Message } from '../types';
import { webSocketServerInstance } from '../services/websocket';

export const ChatController = {
  async sendMessage(req: any, res: any) {
    const { from, to, text, imageUrl, tempId } = req.body;
    
    if (!from || !to) return res.status(400).json({ error: "Invalid parameters" });

    // Check settings (e.g., if blocked, handled in User Controller, but muting check could be here)
    const settingsKey = `${to}-${from}`;
    const settings = db.chatSettings.get(settingsKey);
    // If receiver muted sender, we still save message but maybe don't notify? (Simulated logic: just save)

    const chatKey = createChatKey(from, to);
    const newMessage: Message = {
        id: tempId || `msg_${Date.now()}`,
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

    webSocketServerInstance.broadcastNewMessageToChat(chatKey, newMessage, tempId);

    return res.status(200).json({ success: true, messageId: newMessage.id });
  },

  async markRead(req: any, res: any) {
      const { messageIds } = req.body;
      messageIds.forEach((id: string) => {
          const msg = db.messages.get(id);
          if (msg) msg.status = 'read';
      });
      saveDb();
      return res.status(200).json({ success: true });
  },

  async getMessages(req: any, res: any) {
      const { otherUserId } = req.params;
      const { userId } = req.query; 
      
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const chatKey = createChatKey(userId as string, otherUserId);
      const messages = Array.from(db.messages.values())
        .filter((m: any) => m.chatId === chatKey)
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return res.status(200).json(messages);
  },

  // New methods for ChatSettings
  async getSettings(req: any, res: any) {
      const { userId, partnerId } = req.params;
      const key = `${userId}-${partnerId}`;
      const settings = db.chatSettings.get(key) || { isMuted: false, isPinned: false };
      return res.status(200).json(settings);
  },

  async updateSettings(req: any, res: any) {
      const { userId, partnerId } = req.params;
      const updates = req.body; // { isMuted, isPinned, backgroundImageUrl }
      const key = `${userId}-${partnerId}`;
      
      const current = db.chatSettings.get(key) || { userId, partnerId };
      db.chatSettings.set(key, { ...current, ...updates });
      saveDb();
      
      return res.status(200).json({ success: true });
  }
};
