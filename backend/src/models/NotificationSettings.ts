import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationSettings extends Document {
  userId: string;
  newMessages: boolean;
  streamerLive: boolean;
  followedPosts: boolean;
  pedido: boolean;
  interactive: boolean;
}

const NotificationSettingsSchema = new Schema<INotificationSettings>({
  userId: { type: String, required: true, unique: true },
  newMessages: { type: Boolean, default: true },
  streamerLive: { type: Boolean, default: true },
  followedPosts: { type: Boolean, default: true },
  pedido: { type: Boolean, default: true },
  interactive: { type: Boolean, default: true },
}, {
  timestamps: true
});

export const NotificationSettings = mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema);
