
import mongoose, { Schema, Document } from 'mongoose';

export interface IStreamViewer extends Document {
  streamId: string; // The stream session ID
  userId: mongoose.Types.ObjectId; // The viewer
  joinedAt: Date;
  leftAt?: Date; // Null if currently online
  device?: string; // 'mobile', 'desktop', etc.
  isGhost: boolean; // For bot/simulated viewers
  createdAt: Date;
  updatedAt: Date;
}

const StreamViewerSchema: Schema = new Schema({
  streamId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
  device: { type: String },
  isGhost: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index to quickly count current online viewers (leftAt is null)
StreamViewerSchema.index({ streamId: 1, leftAt: 1 });

export default mongoose.models.StreamViewer || mongoose.model<IStreamViewer>('StreamViewer', StreamViewerSchema);
