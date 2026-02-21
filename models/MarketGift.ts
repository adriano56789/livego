import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketGift extends Document {
  name: string; // Nome do presente
  price: number; // Preço do presente em diamantes
  duration?: number; // Duração (opcional, se aplicável a presentes temporários)
  iconUrl: string; // URL ou identificador do ícone do presente
  createdAt: Date;
  updatedAt: Date;
}

const MarketGiftSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number },
  iconUrl: { type: String, required: true }
}, {
  timestamps: true
});

export default mongoose.models.MarketGift || mongoose.model<IMarketGift>('MarketGift', MarketGiftSchema);