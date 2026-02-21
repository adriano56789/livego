
import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveNotification extends Document {
  userId: mongoose.Types.ObjectId; // Receiver (Fan)
  streamerId: mongoose.Types.ObjectId; // Streamer
  streamId: string; // The Live Stream ID
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LiveNotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  streamerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  streamId: { type: String, required: true },
  message: { type: String },
  read: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.models.LiveNotification || mongoose.model<ILiveNotification>('LiveNotification', LiveNotificationSchema);
