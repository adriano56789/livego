
import mongoose, { Schema, Document } from 'mongoose';

export interface IZoomConfig extends Document {
  userId: mongoose.Types.ObjectId;
  percentage: number; // e.g., 90, 100, 120
  applyToStreamVideo: boolean; // Does it affect the video player?
  applyToInterface: boolean; // Does it affect UI text/buttons?
  updatedAt: Date;
}

const ZoomConfigSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  percentage: { type: Number, default: 100, min: 50, max: 200 },
  applyToStreamVideo: { type: Boolean, default: true },
  applyToInterface: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.ZoomConfig || mongoose.model<IZoomConfig>('ZoomConfig', ZoomConfigSchema);
