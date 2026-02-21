
import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseRecord extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'purchase_diamonds' | 'withdraw_earnings' | 'withdraw_platform_earnings' | 'purchase_frame' | 'platform_fee_income';
  description: string;
  amountBRL: number;
  amountCoins: number;
  status: 'Concluído' | 'Pendente' | 'Cancelado';
  timestamp: Date;
}

const PurchaseRecordSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: ['purchase_diamonds', 'withdraw_earnings', 'withdraw_platform_earnings', 'purchase_frame', 'platform_fee_income'], 
    required: true 
  },
  description: { type: String, required: true },
  amountBRL: { type: Number, default: 0 },
  amountCoins: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Concluído', 'Pendente', 'Cancelado'], 
    default: 'Concluído' 
  },
  timestamp: { type: Date, default: Date.now, index: -1 }
}, {
  timestamps: true
});

export default mongoose.models.PurchaseRecord || mongoose.model<IPurchaseRecord>('PurchaseRecord', PurchaseRecordSchema);
