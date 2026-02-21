import mongoose, { Schema, Document } from 'mongoose';

export interface IProfession extends Document {
  name: string; // e.g., "Modelo", "Estudante", "Influencer"
  isActive: boolean;
}

const ProfessionSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.Profession || mongoose.model<IProfession>('Profession', ProfessionSchema);