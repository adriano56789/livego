
import mongoose, { Schema, Document } from 'mongoose';

export interface IBeautySettings extends Document {
  userId: mongoose.Types.ObjectId;
  settings: Record<string, number>; // e.g., { "Branquear": 20, "Alisar": 30 }
  updatedAt: Date;
}

const BeautySettingsSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  settings: { type: Map, of: Number, default: {} }
}, {
  timestamps: true
});

export default mongoose.models.BeautySettings || mongoose.model<IBeautySettings>('BeautySettings', BeautySettingsSchema);
