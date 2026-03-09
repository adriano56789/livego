import mongoose, { Schema, Document } from 'mongoose';

export interface IFrame extends Document {
  id: string;
  name: string;
  price: number;
  duration: number; // em dias
  description: string;
  icon: string;
  image: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FrameSchema = new Schema<IFrame>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true }, // duração em dias
  description: { type: String, required: true },
  icon: { type: String, required: true },
  image: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Frame = mongoose.model<IFrame>('Frame', FrameSchema);
