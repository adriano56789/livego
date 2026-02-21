
import mongoose, { Schema, Document } from 'mongoose';

export interface IFriendRequest extends Document {
  fromUserId: mongoose.Types.ObjectId; // The user sending the request
  toUserId: mongoose.Types.ObjectId; // The user receiving the request
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const FriendRequestSchema: Schema = new Schema({
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, {
  timestamps: true
});

// Ensure unique request per pair to prevent duplicates
FriendRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export default mongoose.models.FriendRequest || mongoose.model<IFriendRequest>('FriendRequest', FriendRequestSchema);
