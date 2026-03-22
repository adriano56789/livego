import mongoose, { Schema, Document } from 'mongoose';

export interface IZoomSettings extends Document {
  userId: string;
  zoomLevel: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ZoomSettingsSchema = new Schema<IZoomSettings>({
  userId: { type: String, required: true, unique: true },
  zoomLevel: { type: Number, default: 100, min: 50, max: 150 },
  isDefault: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ZoomSettingsSchema.pre('save', function() {
  this.updatedAt = new Date();
});

export const ZoomSettings = mongoose.model<IZoomSettings>('ZoomSettings', ZoomSettingsSchema);
