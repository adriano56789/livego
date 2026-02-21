
import mongoose, { Schema, Document } from 'mongoose';

export interface IFan extends Document {
  userId: mongoose.Types.ObjectId; // The user who is being followed (the "idol")
  fanId: mongoose.Types.ObjectId; // The user who is the fan (the follower)
  createdAt: Date;
}

const FanSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fanId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Ensure a user is not listed as a fan of the same person twice
FanSchema.index({ userId: 1, fanId: 1 }, { unique: true });

export default mongoose.models.Fan || mongoose.model<IFan>('Fan', FanSchema);
