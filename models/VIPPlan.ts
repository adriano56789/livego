import mongoose, { Schema, Document } from 'mongoose';

export interface IVIPPlan extends Document {
  title: string; // e.g. 'Mensal', 'Trimestral', 'Anual'
  price: number; // Value in BRL
  currency: string; // 'BRL'
  durationMonths: number; // 1, 3, 12
  isActive: boolean;
}

const VIPPlanSchema: Schema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'BRL' },
  durationMonths: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
});

// Index for sorting by price or duration
VIPPlanSchema.index({ price: 1 });

export default mongoose.models.VIPPlan || mongoose.model<IVIPPlan>('VIPPlan', VIPPlanSchema);