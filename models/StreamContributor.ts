
import mongoose, { Schema, Document } from 'mongoose';

export interface IStreamContributor extends Document {
  streamId: string; // Links to the specific Stream session
  userId: mongoose.Types.ObjectId; // The user who contributed
  score: number; // Total aggregated contribution value for this stream
  lastContributionAt: Date; // For sorting ties by recency
}

const StreamContributorSchema: Schema = new Schema({
  streamId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  score: { type: Number, default: 0, index: -1 }, // Index for sorting by score descending
  lastContributionAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound index to quickly find a specific user's contribution in a stream
StreamContributorSchema.index({ streamId: 1, userId: 1 }, { unique: true });

export default mongoose.models.StreamContributor || mongoose.model<IStreamContributor>('StreamContributor', StreamContributorSchema);
