
import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentTransaction extends Document {
  orderId: mongoose.Types.ObjectId; // Reference to the Order
  gatewayTransactionId: string; // ID from external provider (Stripe, Mercado Pago, etc)
  gatewayStatus: string; // Raw status from gateway
  rawResponse: any; // JSON dump of gateway response for debugging
  paymentMethod: string;
  amountProcessed: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema: Schema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  gatewayTransactionId: { type: String, required: true, index: true },
  gatewayStatus: { type: String, required: true },
  rawResponse: { type: Schema.Types.Mixed }, // Flexible field
  paymentMethod: { type: String, required: true },
  amountProcessed: { type: Number, required: true },
  currency: { type: String, default: 'BRL' }
}, {
  timestamps: true
});

export default mongoose.models.PaymentTransaction || mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);
