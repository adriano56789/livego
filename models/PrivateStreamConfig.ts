
import mongoose, { Schema, Document } from 'mongoose';

export interface IPrivateStreamConfig extends Document {
  userId: mongoose.Types.ObjectId;
  defaultMode: 'invite_only' | 'password' | 'pay_per_view';
  price?: number; // If pay_per_view
  password?: string; // If password mode
  allowFollowers: boolean;
  allowFans: boolean; // Top fans only?
  allowFriends: boolean;
  autoAcceptRequests: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PrivateStreamConfigSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  defaultMode: { 
    type: String, 
    enum: ['invite_only', 'password', 'pay_per_view'], 
    default: 'invite_only' 
  },
  price: { type: Number, default: 0 },
  password: { type: String },
  allowFollowers: { type: Boolean, default: true },
  allowFans: { type: Boolean, default: false },
  allowFriends: { type: Boolean, default: true },
  autoAcceptRequests: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.models.PrivateStreamConfig || mongoose.model<IPrivateStreamConfig>('PrivateStreamConfig', PrivateStreamConfigSchema);
