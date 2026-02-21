import mongoose, { Schema, Document } from 'mongoose';

export interface IDiamondPackage extends Document {
  diamonds: number;
  price: number; // Value in BRL displayed in WalletScreen
  bonus?: number;
  isActive: boolean;
}

const DiamondPackageSchema: Schema = new Schema({
  diamonds: { type: Number, required: true },
  price: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

// Index for sorting packages by price in the store
DiamondPackageSchema.index({ price: 1 });

export default mongoose.models.DiamondPackage || mongoose.model<IDiamondPackage>('DiamondPackage', DiamondPackageSchema);