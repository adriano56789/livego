
import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountDeletionRequest extends Document {
  userId: mongoose.Types.ObjectId;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  scheduledFor: Date; // Often there is a grace period (e.g. 30 days)
  completedAt?: Date;
  createdAt: Date;
}

const AccountDeletionRequestSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  scheduledFor: { type: Date, required: true },
  completedAt: { type: Date }
}, {
  timestamps: true
});

export default mongoose.models.AccountDeletionRequest || mongoose.model<IAccountDeletionRequest>('AccountDeletionRequest', AccountDeletionRequestSchema);
