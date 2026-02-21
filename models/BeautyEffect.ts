
import mongoose, { Schema, Document } from 'mongoose';

export interface IBeautyEffect extends Document {
  name: string; // e.g., "Musa", "Branquear"
  type: 'filter' | 'effect'; // Tab category: Recomendar (filter) or Beleza (effect)
  icon?: string; // Emoji or icon string
  imageUrl?: string; // Preview image URL (if applicable)
  defaultValue: number; // Default slider value (0-100)
  order: number;
  isActive: boolean;
}

const BeautyEffectSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['filter', 'effect'], required: true, index: true },
  icon: { type: String },
  imageUrl: { type: String },
  defaultValue: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

BeautyEffectSchema.index({ type: 1, order: 1 });

export default mongoose.models.BeautyEffect || mongoose.model<IBeautyEffect>('BeautyEffect', BeautyEffectSchema);
