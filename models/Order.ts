
import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  packageId: string;
  amount: number; // Value in BRL
  diamonds: number; // Quantity of diamonds
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paymentMethod?: 'pix' | 'credit_card';
  
  // Pix specific fields populated after processPixPayment
  pixCode?: string; 
  pixExpiration?: Date;

  // Transaction reference (from card gateway or internal ID)
  transactionId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  packageId: { type: String, required: true },
  amount: { type: Number, required: true },
  diamonds: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'cancelled'], 
    default: 'pending',
    index: true 
  },
  paymentMethod: { type: String, enum: ['pix', 'credit_card'] },
  pixCode: { type: String },
  pixExpiration: { type: Date },
  transactionId: { type: String }
}, {
  timestamps: true
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
