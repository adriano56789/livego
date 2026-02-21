import mongoose, { Schema, Document } from 'mongoose';

export interface ICountry extends Document {
  name: string;
  code: string; // ISO code used for flag URL construction in RegionModal
  isActive: boolean;
}

const CountrySchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.Country || mongoose.model<ICountry>('Country', CountrySchema);