
import mongoose, { Schema, Document } from 'mongoose';

export interface IAppVersion extends Document {
  version: string; // "1.0.0"
  buildNumber: number; // 100
  platform: 'ios' | 'android' | 'web';
  isMandatory: boolean; // Force update?
  releaseNotes: string;
  downloadUrl: string;
  releaseDate: Date;
  isActive: boolean;
}

const AppVersionSchema: Schema = new Schema({
  version: { type: String, required: true },
  buildNumber: { type: Number, required: true },
  platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
  isMandatory: { type: Boolean, default: false },
  releaseNotes: { type: String },
  downloadUrl: { type: String, required: true },
  releaseDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Index to find latest version by platform
AppVersionSchema.index({ platform: 1, buildNumber: -1 });

export default mongoose.models.AppVersion || mongoose.model<IAppVersion>('AppVersion', AppVersionSchema);
