
import mongoose, { Schema, Document } from 'mongoose';

export interface ILanguageConfig extends Document {
  userId: mongoose.Types.ObjectId;
  languageCode: string; // 'pt', 'en', 'es', etc.
  regionCode?: string; // 'BR', 'US'
  autoDetect: boolean;
  updatedAt: Date;
}

const LanguageConfigSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  languageCode: { type: String, default: 'pt' },
  regionCode: { type: String },
  autoDetect: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.LanguageConfig || mongoose.model<ILanguageConfig>('LanguageConfig', LanguageConfigSchema);
