import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketUser extends Document {
  avatarUrl: string; // URL da foto do avatar
  diamonds: number; // Quantidade de diamantes do usuário
  activeFrameId?: string; // ID da moldura ativa
  ownedFrames: { frameId: string; expirationDate: Date }[]; // Lista de molduras possuídas com data de expiração
  createdAt: Date;
  updatedAt: Date;
}

const MarketUserSchema: Schema = new Schema({
  avatarUrl: { type: String, required: true },
  diamonds: { type: Number, default: 0 },
  activeFrameId: { type: String },
  ownedFrames: [{
    frameId: { type: String, required: true },
    expirationDate: { type: Date, required: true }
  }]
}, {
  timestamps: true
});

export default mongoose.models.MarketUser || mongoose.model<IMarketUser>('MarketUser', MarketUserSchema);