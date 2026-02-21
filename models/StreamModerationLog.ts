
import mongoose, { Schema, Document } from 'mongoose';

export interface IStreamModerationLog extends Document {
  streamId: string;
  moderatorId: mongoose.Types.ObjectId; // Who performed the action
  targetUserId: mongoose.Types.ObjectId; // Who was affected
  action: 'kick' | 'mute' | 'unmute' | 'block' | 'warn';
  reason?: string;
  durationMinutes?: number; // For temporary mutes
  createdAt: Date;
}

const StreamModerationLogSchema: Schema = new Schema({
  streamId: { type: String, required: true, index: true },
  moderatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    enum: ['kick', 'mute', 'unmute', 'block', 'warn'], 
    required: true 
  },
  reason: { type: String },
  durationMinutes: { type: Number }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.models.StreamModerationLog || mongoose.model<IStreamModerationLog>('StreamModerationLog', StreamModerationLogSchema);
