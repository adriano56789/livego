
import mongoose, { Schema, Document } from 'mongoose';

export interface IRegion extends Document {
  name: string; // e.g., "América do Sul", "Europa"
  code: string; // e.g., "SA", "EU"
  countries: mongoose.Types.ObjectId[]; // List of Country IDs in this region
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RegionSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  countries: [{ type: Schema.Types.ObjectId, ref: 'Country' }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.Region || mongoose.model<IRegion>('Region', RegionSchema);
