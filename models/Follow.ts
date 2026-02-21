
import mongoose, { Schema, Document } from 'mongoose';

export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId; // The user who initiates the follow
  followedId: mongoose.Types.ObjectId; // The user being followed
  createdAt: Date;
}

const FollowSchema: Schema = new Schema({
  followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  followedId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Compound index to ensure a user cannot follow the same person twice and to optimize lookups
FollowSchema.index({ followerId: 1, followedId: 1 }, { unique: true });

export default mongoose.models.Follow || mongoose.model<IFollow>('Follow', FollowSchema);
