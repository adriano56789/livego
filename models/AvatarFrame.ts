
import mongoose, { Schema, Document } from 'mongoose';

export interface IAvatarFrame extends Document {
  frameId: string; // Slug unique ID (e.g. 'blazing-sun')
  name: string; // Display Name
  description?: string;
  
  // Visualization Data
  componentName: string; // Name of the React Icon Component
  
  // Sales Data
  price: number;
  currency: 'diamonds' | 'coins';
  durationDays: number; // 0 = Permanent
  
  isActive: boolean;
}

const AvatarFrameSchema: Schema = new Schema({
  frameId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: String,
  
  componentName: { type: String, required: true },
  
  price: { type: Number, required: true },
  currency: { type: String, default: 'diamonds' },
  durationDays: { type: Number, default: 7 },
  
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.AvatarFrame || mongoose.model<IAvatarFrame>('AvatarFrame', AvatarFrameSchema);
