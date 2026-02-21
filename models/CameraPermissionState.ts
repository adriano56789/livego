
import mongoose, { Schema, Document } from 'mongoose';

export interface ICameraPermissionState extends Document {
  userId: mongoose.Types.ObjectId;
  cameraStatus: 'granted' | 'denied' | 'prompt';
  microphoneStatus: 'granted' | 'denied' | 'prompt';
  deviceFingerprint?: string; // To distinguish per device
  lastPromptedAt: Date;
  updatedAt: Date;
}

const CameraPermissionStateSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cameraStatus: { 
    type: String, 
    enum: ['granted', 'denied', 'prompt'], 
    default: 'prompt' 
  },
  microphoneStatus: { 
    type: String, 
    enum: ['granted', 'denied', 'prompt'], 
    default: 'prompt' 
  },
  deviceFingerprint: { type: String },
  lastPromptedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Ensure one record per user (or per user+device if needed)
CameraPermissionStateSchema.index({ userId: 1, deviceFingerprint: 1 });

export default mongoose.models.CameraPermissionState || mongoose.model<ICameraPermissionState>('CameraPermissionState', CameraPermissionStateSchema);
