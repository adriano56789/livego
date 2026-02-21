
import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSettings extends Document {
  userId: mongoose.Types.ObjectId; // The user who owns these settings
  partnerId: mongoose.Types.ObjectId; // The other user in the chat
  isMuted: boolean;
  isPinned: boolean;
  backgroundImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSettingsSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  partnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isMuted: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  backgroundImageUrl: { type: String }
}, {
  timestamps: true
});

// Unique settings per pair
ChatSettingsSchema.index({ userId: 1, partnerId: 1 }, { unique: true });

export default mongoose.models.ChatSettings || mongoose.model<IChatSettings>('ChatSettings', ChatSettingsSchema);
