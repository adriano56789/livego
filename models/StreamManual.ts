
import mongoose, { Schema, Document } from 'mongoose';

export interface IStreamManual extends Document {
  title: string;
  content: string[]; // Array of paragraphs
  order: number; // To control display order of sections
  createdAt: Date;
  updatedAt: Date;
}

const StreamManualSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: [{ type: String }],
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Index to ensure manual sections are retrieved in the correct order
StreamManualSchema.index({ order: 1 });

export default mongoose.models.StreamManual || mongoose.model<IStreamManual>('StreamManual', StreamManualSchema);
