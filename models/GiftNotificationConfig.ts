
import mongoose, { Schema, Document } from 'mongoose';

export interface IGiftNotificationConfig extends Document {
  userId: mongoose.Types.ObjectId;
  minPriceToNotify: number; // Only show notifications for gifts above this price
  enabledCategories: string[]; // ['Popular', 'Luxo', 'VIP']
  disabledGiftIds: string[]; // Specific gifts to ignore
  showAnimation: boolean; // Play full screen animation?
  soundEnabled: boolean;
  updatedAt: Date;
}

const GiftNotificationConfigSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  minPriceToNotify: { type: Number, default: 0 },
  enabledCategories: [{ type: String }],
  disabledGiftIds: [{ type: String }],
  showAnimation: { type: Boolean, default: true },
  soundEnabled: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.GiftNotificationConfig || mongoose.model<IGiftNotificationConfig>('GiftNotificationConfig', GiftNotificationConfigSchema);
