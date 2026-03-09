import mongoose, { Schema, Document } from 'mongoose';

export interface IBeautySettings extends Document {
  userId: string;
  settings: Record<string, number>;
}

const BeautySettingsSchema = new Schema<IBeautySettings>({
  userId: { type: String, required: true, unique: true },
  settings: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true
});

export const BeautySettings = mongoose.model<IBeautySettings>('BeautySettings', BeautySettingsSchema);
