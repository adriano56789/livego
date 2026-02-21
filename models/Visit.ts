
import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
  visitorId: mongoose.Types.ObjectId; // The user who is visiting
  profileId: mongoose.Types.ObjectId; // The user profile being visited
  timestamp: Date;
}

const VisitSchema: Schema = new Schema({
  visitorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  profileId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  timestamp: { type: Date, default: Date.now }
}, {
  // We use timestamp as createdAt. Visits are generally immutable logs.
  timestamps: { createdAt: 'timestamp', updatedAt: false }
});

// Index for efficiently retrieving visitors of a specific profile sorted by time
VisitSchema.index({ profileId: 1, timestamp: -1 });

export default mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);
