
import mongoose, { Schema, Document } from 'mongoose';

export interface IGiftAnimationConfig extends Document {
  giftId: mongoose.Types.ObjectId; // Links to the Gift model
  animationType: 'lottie' | 'svga' | 'mp4' | 'canvas_particles';
  assetUrl: string; // URL to the .json, .svga, or .mp4 file
  fullScreen: boolean; // Does it cover the whole screen?
  durationMs: number; // How long the animation lasts
  
  // Specific config for canvas particles
  particleConfig?: {
    count: number;
    colors: string[];
    shape: 'circle' | 'star' | 'heart' | 'mixed';
    velocity: number;
  };
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GiftAnimationConfigSchema: Schema = new Schema({
  giftId: { type: Schema.Types.ObjectId, ref: 'Gift', required: true, unique: true },
  animationType: { 
    type: String, 
    enum: ['lottie', 'svga', 'mp4', 'canvas_particles'], 
    required: true 
  },
  assetUrl: { type: String, required: true },
  fullScreen: { type: Boolean, default: false },
  durationMs: { type: Number, default: 3000 },
  
  particleConfig: {
    count: Number,
    colors: [String],
    shape: { type: String, enum: ['circle', 'star', 'heart', 'mixed'] },
    velocity: Number
  },
  
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.GiftAnimationConfig || mongoose.model<IGiftAnimationConfig>('GiftAnimationConfig', GiftAnimationConfigSchema);
