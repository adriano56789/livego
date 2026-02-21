
import { db, saveDb, PushNotificationConfig, WatermarkConfig, LanguageConfig, ZoomConfig, PipConfig } from '../services/database';

export const SettingsController = {
  // ... (Existing Notification logic)
  async getNotificationSettings(req: any, res: any) {
      const { userId } = req.params;
      const settings = db.notificationSettings.get(userId) || { 
          newMessages: true, streamerLive: true, followedPosts: false, pedido: true, interactive: true 
      };
      return res.status(200).json(settings);
  },

  async updateNotificationSettings(req: any, res: any) {
      const { userId } = req.params;
      const current = db.notificationSettings.get(userId) || {};
      const updated = { ...current, ...req.body };
      db.notificationSettings.set(userId, updated);
      saveDb();
      return res.status(200).json({ settings: updated });
  },

  async getPrivateStreamSettings(req: any, res: any) {
      const { userId } = req.params;
      const user = db.users.get(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.status(200).json({ settings: user.privateStreamSettings });
  },

  async updatePrivateStreamSettings(req: any, res: any) {
      const { userId } = req.params;
      const user = db.users.get(userId);
      if (user) {
          user.privateStreamSettings = { ...user.privateStreamSettings, ...req.body.settings };
          saveDb();
          return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: "User not found" });
  },
  
  async updateGiftNotificationSettings(req: any, res: any) {
      const { userId } = req.params;
      const { settings } = req.body;
      db.giftNotificationSettings.set(userId, settings);
      saveDb();
      return res.status(200).json({ success: true });
  },

  async updateBeautySettings(req: any, res: any) {
      const { userId } = req.params;
      const { settings } = req.body;
      db.beautySettings.set(userId, settings);
      saveDb();
      return res.status(200).json({ success: true });
  },

  // --- Logic for Config Models ---

  async updatePipSettings(req: any, res: any) {
      const { userId } = req.params;
      const { enabled } = req.body;
      const user = db.users.get(userId);
      
      if (user) {
          user.pipEnabled = enabled;
          
          const existingConfig = db.pipConfigs.get(userId);
          const newConfig: PipConfig = {
              userId,
              isEnabled: enabled,
              autoEnter: existingConfig?.autoEnter || false
          };
          db.pipConfigs.set(userId, newConfig);

          saveDb();
          return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: "User not found" });
  },

  async getPipSettings(req: any, res: any) {
      const { userId } = req.params;
      const config = db.pipConfigs.get(userId) || { userId, isEnabled: false, autoEnter: false };
      return res.status(200).json(config);
  },

  async updateZoomSettings(req: any, res: any) {
      const { userId } = req.params;
      const { percentage } = req.body;
      
      const config: ZoomConfig = {
          userId,
          percentage,
          applyToStream: true 
      };
      db.zoomConfigs.set(userId, config);
      saveDb();
      return res.status(200).json({ success: true });
  },

  // --- Push Notification Config ---
  async getPushConfig(req: any, res: any) {
      const { userId } = req.params;
      const config = db.pushNotificationConfigs.get(userId) || { userId, isEnabled: true, preferences: { mentions: true, likes: true, newFollowers: true, liveStart: true, giftReceived: true }, updatedAt: new Date().toISOString() };
      return res.status(200).json(config);
  },

  async updatePushConfig(req: any, res: any) {
      const { userId } = req.params;
      const updates = req.body;
      const current = db.pushNotificationConfigs.get(userId) || { userId, isEnabled: true, preferences: { mentions: true, likes: true, newFollowers: true, liveStart: true, giftReceived: true } };
      
      const newConfig: PushNotificationConfig = {
          ...current,
          ...updates,
          updatedAt: new Date().toISOString()
      };
      
      db.pushNotificationConfigs.set(userId, newConfig);
      saveDb();
      return res.status(200).json({ success: true });
  },

  // --- Language Config ---
  async updateLanguage(req: any, res: any) {
      const { userId } = req.params;
      const { languageCode } = req.body;
      
      const config: LanguageConfig = {
          userId,
          languageCode,
          autoDetect: false
      };
      db.languageConfigs.set(userId, config);
      
      // Update legacy user pref if needed
      const user = db.users.get(userId);
      if (user) {
          user.preferences.language.code = languageCode;
          user.preferences.language.autoDetect = false;
      }
      
      saveDb();
      return res.status(200).json({ success: true });
  },

  // --- Watermark Config ---
  async updateWatermark(req: any, res: any) {
      const { userId } = req.params;
      const updates = req.body; // { isEnabled, position, etc }
      
      const current = db.watermarkConfigs.get(userId) || { userId, isEnabled: true, opacity: 0.5, position: 'top-left', showUserName: true, showUserId: true, showTimestamp: true };
      const newConfig: WatermarkConfig = { ...current, ...updates };
      
      db.watermarkConfigs.set(userId, newConfig);
      saveDb();
      return res.status(200).json({ success: true });
  }
};
