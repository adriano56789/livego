
import mongoose, { Schema, Document } from 'mongoose';

export interface IPushNotificationConfig extends Document {
  userId: mongoose.Types.ObjectId;
  fcmToken?: string; // Firebase Cloud Messaging Token
  apnsToken?: string; // Apple Push Notification Service Token
  isEnabled: boolean; // Master switch
  preferences: {
    mentions: boolean;
    likes: boolean;
    newFollowers: boolean;
    liveStart: boolean;
    giftReceived: boolean;
  };
  deviceInfo?: string; // e.g. "iPhone 13 Pro"
  updatedAt: Date;
}

const PushNotificationConfigSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  fcmToken: { type: String },
  apnsToken: { type: String },
  isEnabled: { type: Boolean, default: true },
  preferences: {
    mentions: { type: Boolean, default: true },
    likes: { type: Boolean, default: true },
    newFollowers: { type: Boolean, default: true },
    liveStart: { type: Boolean, default: true },
    giftReceived: { type: Boolean, default: true }
  },
  deviceInfo: { type: String }
}, {
  timestamps: true
});

export default mongoose.models.PushNotificationConfig || mongoose.model<IPushNotificationConfig>('PushNotificationConfig', PushNotificationConfigSchema);
