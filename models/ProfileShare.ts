
import mongoose, { Schema, Document } from 'mongoose';

export interface IProfileShare extends Document {
  sharerId: mongoose.Types.ObjectId; // User who shared
  profileId: mongoose.Types.ObjectId; // Profile shared
  platform: string; // 'whatsapp', 'facebook', 'twitter', 'copy_link'
  createdAt: Date;
}

const ProfileShareSchema: Schema = new Schema({
  sharerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  profileId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  platform: { type: String, required: true }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.models.ProfileShare || mongoose.model<IProfileShare>('ProfileShare', ProfileShareSchema);
