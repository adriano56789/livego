
import mongoose, { Schema, Document } from 'mongoose';

export interface IStreamResolution extends Document {
  label: string; // e.g., "720p (HD)"
  value: string; // e.g., "720p"
  bitrate: number; // e.g., 2500 (kbps)
  isPremium: boolean; // Requires VIP?
  isActive: boolean;
  order: number; // Sort order
  createdAt: Date;
  updatedAt: Date;
}

const StreamResolutionSchema: Schema = new Schema({
  label: { type: String, required: true },
  value: { type: String, required: true, unique: true },
  bitrate: { type: Number, required: true },
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.models.StreamResolution || mongoose.model<IStreamResolution>('StreamResolution', StreamResolutionSchema);
