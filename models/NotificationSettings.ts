
import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationSettings extends Document {
  userId: mongoose.Types.ObjectId;
  newMessages: boolean;
  streamerLive: boolean;
  followedPosts: boolean;
  pedido: boolean;
  interactive: boolean;
}

const NotificationSettingsSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  newMessages: { type: Boolean, default: true },
  streamerLive: { type: Boolean, default: true },
  followedPosts: { type: Boolean, default: false },
  pedido: { type: Boolean, default: true },
  interactive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.NotificationSettings || mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema);
