import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAvatar extends Document {
  userId: string;
  avatarId: string;
  imageUrl: string;
  purchaseDate: Date;
  expirationDate: Date;
  isActive: boolean;
  isCurrent: boolean;
}

const UserAvatarSchema = new Schema<IUserAvatar>({
  userId: { type: String, required: true },
  avatarId: { type: String, required: true },
  imageUrl: { type: String, required: true },
  purchaseDate: { type: Date, default: Date.now },
  expirationDate: { type: Date, required: true }, // 7 dias após compra
  isActive: { type: Boolean, default: true },
  isCurrent: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Índices
UserAvatarSchema.index({ userId: 1, isCurrent: 1 });
UserAvatarSchema.index({ userId: 1, expirationDate: 1 });

export const UserAvatar = mongoose.model<IUserAvatar>('UserAvatar', UserAvatarSchema);
