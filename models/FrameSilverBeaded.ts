
import mongoose, { Schema, Document } from 'mongoose';

export interface IFrameSilverBeaded extends Document {
  userId: mongoose.Types.ObjectId;
  isEquipped: boolean;
  isActive: boolean;
  purchasedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FrameSilverBeadedSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isEquipped: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  purchasedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

export default mongoose.models.FrameSilverBeaded || mongoose.model<IFrameSilverBeaded>('FrameSilverBeaded', FrameSilverBeadedSchema);
