
import mongoose, { Schema, Document } from 'mongoose';

export interface ILegalDocument extends Document {
  slug: string; // 'copyright', 'terms-of-service', 'privacy-policy'
  title: string;
  language: string; // 'pt-BR', 'en-US'
  content: string; // HTML or Markdown
  version: string;
  lastUpdated: Date;
}

const LegalDocumentSchema: Schema = new Schema({
  slug: { type: String, required: true, index: true },
  title: { type: String, required: true },
  language: { type: String, default: 'pt-BR' },
  content: { type: String, required: true },
  version: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound index for efficient lookup
LegalDocumentSchema.index({ slug: 1, language: 1 }, { unique: true });

export default mongoose.models.LegalDocument || mongoose.model<ILegalDocument>('LegalDocument', LegalDocumentSchema);
