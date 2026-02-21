import mongoose, { Schema, Document } from 'mongoose';

export interface IProfileTag extends Document {
  name: string; // The tag text (e.g., "Gamer", "Fitness")
  usageCount: number; // For popularity sorting
  isActive: boolean;
}

const ProfileTagSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.ProfileTag || mongoose.model<IProfileTag>('ProfileTag', ProfileTagSchema);