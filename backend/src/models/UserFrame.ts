import mongoose, { Schema, Document } from 'mongoose';

export interface IUserFrame extends Document {
  userId: string;
  frameId: string;
  purchaseDate: Date;
  expirationDate: Date;
  isActive: boolean;
  isEquipped: boolean;
}

const UserFrameSchema = new Schema<IUserFrame>({
  userId: { type: String, required: true },
  frameId: { type: String, required: true },
  purchaseDate: { type: Date, default: Date.now },
  expirationDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  isEquipped: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Índices compostos para performance
UserFrameSchema.index({ userId: 1, isActive: 1 });
UserFrameSchema.index({ userId: 1, isEquipped: 1 });
UserFrameSchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 }); // TTL para expiração automática

export const UserFrame = mongoose.model<IUserFrame>('UserFrame', UserFrameSchema);
