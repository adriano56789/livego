
import mongoose, { Schema, Document } from 'mongoose';

export interface IFrameBlazingSun extends Document {
  userId: mongoose.Types.ObjectId;
  isEquipped: boolean;
  isActive: boolean; // Soft delete or disabled status
  purchasedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FrameBlazingSunSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isEquipped: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  purchasedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

export default mongoose.models.FrameBlazingSun || mongoose.model<IFrameBlazingSun>('FrameBlazingSun', FrameBlazingSunSchema);
