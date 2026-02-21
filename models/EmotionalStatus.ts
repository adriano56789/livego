import mongoose, { Schema, Document } from 'mongoose';

export interface IEmotionalStatus extends Document {
  name: string; // e.g., "Solteiro", "Casado", "Complicado"
  isActive: boolean;
}

const EmotionalStatusSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.EmotionalStatus || mongoose.model<IEmotionalStatus>('EmotionalStatus', EmotionalStatusSchema);