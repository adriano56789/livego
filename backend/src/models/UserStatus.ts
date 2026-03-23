import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStatus extends Document {
  user_id: string;
  is_online: boolean;
  last_seen: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserStatusSchema = new Schema<IUserStatus>({
  user_id: { type: String, required: true },
  is_online: { type: Boolean, default: false },
  last_seen: { type: Date, default: Date.now }
}, {
  timestamps: true
});

UserStatusSchema.index({ user_id: 1 });
UserStatusSchema.index({ is_online: 1 });
UserStatusSchema.index({ last_seen: 1 });

export const UserStatus = mongoose.model<IUserStatus>('UserStatus', UserStatusSchema);
