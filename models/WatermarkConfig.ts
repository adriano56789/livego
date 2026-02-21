
import mongoose, { Schema, Document } from 'mongoose';

export interface IWatermarkConfig extends Document {
  userId?: mongoose.Types.ObjectId; // If present, specific to a user, else global config
  isEnabled: boolean;
  opacity: number; // 0.0 to 1.0
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'floating';
  showUserName: boolean;
  showUserId: boolean;
  showTimestamp: boolean;
  customText?: string;
  updatedAt: Date;
}

const WatermarkConfigSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // Sparse index can be used here
  isEnabled: { type: Boolean, default: true },
  opacity: { type: Number, default: 0.5, min: 0, max: 1 },
  position: { 
    type: String, 
    enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'floating'], 
    default: 'top-left' 
  },
  showUserName: { type: Boolean, default: true },
  showUserId: { type: Boolean, default: true },
  showTimestamp: { type: Boolean, default: true },
  customText: { type: String }
}, {
  timestamps: true
});

export default mongoose.models.WatermarkConfig || mongoose.model<IWatermarkConfig>('WatermarkConfig', WatermarkConfigSchema);
