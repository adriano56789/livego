
import mongoose, { Schema, Document } from 'mongoose';

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId; // Reference to the User
  diamonds: number; // Balance of purchased currency
  earnings: number; // Balance of earned currency (from gifts)
  earningsWithdrawn: number; // Total amount withdrawn over time
  withdrawalMethod?: {
    method: 'pix' | 'mercado_pago';
    details: {
        pixKey?: string;
        email?: string;
    };
  };
  updatedAt: Date;
}

const WalletSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  diamonds: { type: Number, default: 0, min: 0 },
  earnings: { type: Number, default: 0, min: 0 },
  earningsWithdrawn: { type: Number, default: 0, min: 0 },
  withdrawalMethod: {
    method: { type: String, enum: ['pix', 'mercado_pago'] },
    details: {
      pixKey: { type: String },
      email: { type: String }
    }
  }
}, {
  timestamps: true
});

export default mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);
