
import mongoose, { Schema, Document } from 'mongoose';

export interface IGift extends Document {
  name: string;
  price: number;
  icon: string; // URL or emoji
  category: 'Popular' | 'Luxo' | 'Atividade' | 'VIP' | 'Efeito' | 'Entrada';
  type: string; // 'emoji' | 'component' | 'video'
  videoUrl?: string;
  triggersAutoFollow: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GiftSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  icon: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Popular', 'Luxo', 'Atividade', 'VIP', 'Efeito', 'Entrada'], 
    required: true 
  },
  type: { type: String, default: 'emoji' },
  videoUrl: { type: String },
  triggersAutoFollow: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.Gift || mongoose.model<IGift>('Gift', GiftSchema);
