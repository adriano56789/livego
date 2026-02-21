
import mongoose, { Schema, Document } from 'mongoose';

export interface IBlock extends Document {
  blockerId: mongoose.Types.ObjectId; // The user who is blocking
  blockedId: mongoose.Types.ObjectId; // The user who is being blocked
  createdAt: Date;
}

const BlockSchema: Schema = new Schema({
  blockerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  blockedId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: true, updatedAt: false } // No update needed for a block record
});

// Ensure a user can't block the same person twice
BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export default mongoose.models.Block || mongoose.model<IBlock>('Block', BlockSchema);
