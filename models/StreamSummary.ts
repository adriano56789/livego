
import mongoose, { Schema, Document } from 'mongoose';

export interface IStreamSummary extends Document {
  streamId: string; // Reference to the stream session ID
  hostId: mongoose.Types.ObjectId; // Reference to the User who streamed
  
  // Snapshot of user details at the time of summary
  hostName: string;
  hostAvatarUrl: string;

  // Statistics displayed in the UI
  viewers: number;
  duration: string; // Stored as formatted string (e.g., "02:15:00") as shown in UI
  coins: number;
  followersGained: number; // Corresponds to 'followers' in UI
  membersGained: number;   // Corresponds to 'members' in UI
  fansGained: number;      // Corresponds to 'fans' in UI
  
  endedAt: Date;
}

const StreamSummarySchema: Schema = new Schema({
  streamId: { type: String, required: true, index: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  hostName: { type: String, required: true },
  hostAvatarUrl: { type: String, required: true },

  viewers: { type: Number, default: 0 },
  duration: { type: String, required: true },
  coins: { type: Number, default: 0 },
  followersGained: { type: Number, default: 0 },
  membersGained: { type: Number, default: 0 },
  fansGained: { type: Number, default: 0 },
  
  endedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.StreamSummary || mongoose.model<IStreamSummary>('StreamSummary', StreamSummarySchema);
