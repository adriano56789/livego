import mongoose, { Schema, Document } from 'mongoose';

export interface IShopItem extends Document {
  id: string;
  name: string;
  category: 'mochila' | 'quadro' | 'carro' | 'bolha' | 'anel' | 'avatar';
  price: number;
  duration?: number; // em dias
  description: string;
  icon: string;
  image: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopItemSchema = new Schema<IShopItem>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ['mochila', 'quadro', 'carro', 'bolha', 'anel', 'avatar'] },
  price: { type: Number, required: true },
  duration: { type: Number }, // duração em dias, se aplicável
  description: { type: String, required: true },
  icon: { type: String, required: true },
  image: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const ShopItem = mongoose.model<IShopItem>('ShopItem', ShopItemSchema);
