
import mongoose, { Schema, Document } from 'mongoose';

export interface IEarningsPolicy extends Document {
  version: string;
  effectiveDate: Date;
  conversionRate: number; // e.g. 100 diamonds = 1 BRL
  streamerSharePercentage: number; // e.g. 80
  platformFeePercentage: number; // e.g. 20
  minimumWithdrawalAmount: number;
  policyContent: string; // Markdown or HTML content
  isActive: boolean;
}

const EarningsPolicySchema: Schema = new Schema({
  version: { type: String, required: true, unique: true },
  effectiveDate: { type: Date, default: Date.now },
  conversionRate: { type: Number, required: true },
  streamerSharePercentage: { type: Number, required: true },
  platformFeePercentage: { type: Number, required: true },
  minimumWithdrawalAmount: { type: Number, default: 50 },
  policyContent: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.EarningsPolicy || mongoose.model<IEarningsPolicy>('EarningsPolicy', EarningsPolicySchema);
