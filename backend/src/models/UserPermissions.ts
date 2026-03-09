import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPermissions extends Document {
  userId: string;
  camera: 'granted' | 'denied' | 'prompt';
  microphone: 'granted' | 'denied' | 'prompt';
}

const UserPermissionsSchema = new Schema<IUserPermissions>({
  userId: { type: String, required: true, unique: true },
  camera: { type: String, enum: ['granted', 'denied', 'prompt'], default: 'prompt' },
  microphone: { type: String, enum: ['granted', 'denied', 'prompt'], default: 'prompt' },
}, {
  timestamps: true
});

export const UserPermissions = mongoose.model<IUserPermissions>('UserPermissions', UserPermissionsSchema);
