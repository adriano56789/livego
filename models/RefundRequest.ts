
import mongoose, { Schema, Document } from 'mongoose';

export interface IRefundRequest extends Document {
  userId: mongoose.Types.ObjectId;
  purchaseRecordId: mongoose.Types.ObjectId; // The purchase being disputed
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefundRequestSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  purchaseRecordId: { type: Schema.Types.ObjectId, ref: 'PurchaseRecord', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: { type: String }
}, {
  timestamps: true
});

export default mongoose.models.RefundRequest || mongoose.model<IRefundRequest>('RefundRequest', RefundRequestSchema);
