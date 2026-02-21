import mongoose, { Schema, Document } from 'mongoose';

export interface IStreamHistory extends Document {
  streamerId: mongoose.Types.ObjectId; // Reference to the user who streamed
  name: string; // Displayed name
  avatar: string; // Displayed avatar URL
  startTime: number; // Timestamp for "Início"
  endTime: number; // Timestamp for "Fim"
}

const StreamHistorySchema: Schema = new Schema({
  streamerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  avatar: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true }
}, {
  timestamps: true
});

// Index to sort history by start time descending (newest first)
StreamHistorySchema.index({ streamerId: 1, startTime: -1 });

export default mongoose.models.StreamHistory || mongoose.model<IStreamHistory>('StreamHistory', StreamHistorySchema);