import mongoose, { Schema, Document } from 'mongoose';

export interface IGiftNotificationSettings extends Document {
  userId: string;
  gifts: Record<string, boolean>;
}

const GiftNotificationSettingsSchema = new Schema<IGiftNotificationSettings>({
  userId: { type: String, required: true, unique: true },
  gifts: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true
});

export const GiftNotificationSettings = mongoose.model<IGiftNotificationSettings>('GiftNotificationSettings', GiftNotificationSettingsSchema);
