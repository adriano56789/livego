import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketFrame extends Document {
  price: number; // Preço da moldura em diamantes
  duration: number; // Duração da moldura em dias
  component: string; // Identificador do componente visual da moldura
  createdAt: Date;
  updatedAt: Date;
}

const MarketFrameSchema: Schema = new Schema({
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  component: { type: String, required: true }
}, {
  timestamps: true
});

export default mongoose.models.MarketFrame || mongoose.model<IMarketFrame>('MarketFrame', MarketFrameSchema);