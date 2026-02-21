import mongoose, { Schema, Document } from 'mongoose';

export interface ILoadingConfig extends Document {
  isActive: boolean; // se o spinner está rodando ou não
  color: string; // cor da borda, ex: 'purple'
  size: number; // tamanho, ex: 12
  createdAt: Date;
  updatedAt: Date;
}

const LoadingConfigSchema: Schema = new Schema({
  isActive: { type: Boolean, default: true },
  color: { type: String, default: 'purple' },
  size: { type: Number, default: 12 }
}, {
  timestamps: true
});

export default mongoose.models.LoadingConfig || mongoose.model<ILoadingConfig>('LoadingConfig', LoadingConfigSchema);