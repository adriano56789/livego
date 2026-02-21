
import mongoose, { Schema, Document } from 'mongoose';

export interface ILevelPrivilege extends Document {
  levelRequirement: number; // Minimum level to unlock
  title: string; // e.g., "Badge de Nível Exclusivo"
  description: string;
  iconUrl: string; // URL for the privilege icon
  type: 'badge' | 'effect' | 'feature' | 'gift';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LevelPrivilegeSchema: Schema = new Schema({
  levelRequirement: { type: Number, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  iconUrl: { type: String, required: true },
  type: { type: String, enum: ['badge', 'effect', 'feature', 'gift'], required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.LevelPrivilege || mongoose.model<ILevelPrivilege>('LevelPrivilege', LevelPrivilegeSchema);
