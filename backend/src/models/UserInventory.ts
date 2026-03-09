import mongoose, { Schema, Document } from 'mongoose';

export interface IUserInventory extends Document {
  userId: string;
  itemId: string;
  itemType: 'mochila' | 'quadro' | 'carro' | 'bolha' | 'anel' | 'avatar';
  purchaseDate: Date;
  expirationDate?: Date;
  isActive: boolean;
  isEquipped: boolean;
}

const UserInventorySchema = new Schema<IUserInventory>({
  userId: { type: String, required: true },
  itemId: { type: String, required: true },
  itemType: { type: String, required: true, enum: ['mochila', 'quadro', 'carro', 'bolha', 'anel', 'avatar'] },
  purchaseDate: { type: Date, default: Date.now },
  expirationDate: { type: Date },
  isActive: { type: Boolean, default: true },
  isEquipped: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Índices compostos para performance
UserInventorySchema.index({ userId: 1, itemType: 1 });
UserInventorySchema.index({ userId: 1, isEquipped: 1 });

export const UserInventory = mongoose.model<IUserInventory>('UserInventory', UserInventorySchema);
