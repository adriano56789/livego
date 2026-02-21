
import mongoose, { Schema, Document } from 'mongoose';

export interface IStreamReminder extends Document {
  userId: mongoose.Types.ObjectId; // User who wants the reminder
  streamerId: mongoose.Types.ObjectId; // Streamer to be reminded about
  reminderType: 'one-time' | 'always'; // Just next live or every live?
  status: 'pending' | 'sent' | 'cancelled';
  scheduledFor?: Date; // If it's a scheduled event
  createdAt: Date;
  updatedAt: Date;
}

const StreamReminderSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  streamerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reminderType: { type: String, enum: ['one-time', 'always'], default: 'always' },
  status: { type: String, enum: ['pending', 'sent', 'cancelled'], default: 'pending' },
  scheduledFor: { type: Date }
}, {
  timestamps: true
});

// Compound index to prevent duplicate active reminders
StreamReminderSchema.index({ userId: 1, streamerId: 1, status: 1 });

export default mongoose.models.StreamReminder || mongoose.model<IStreamReminder>('StreamReminder', StreamReminderSchema);
