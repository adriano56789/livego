
import mongoose, { Schema, Document } from 'mongoose';

export interface IPipConfig extends Document {
  userId: mongoose.Types.ObjectId;
  isEnabled: boolean;
  autoEnter: boolean; // Auto-enter PiP when backgrounding app
  restoreOnForeground: boolean;
  updatedAt: Date;
}

const PipConfigSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  isEnabled: { type: Boolean, default: false },
  autoEnter: { type: Boolean, default: false },
  restoreOnForeground: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.PipConfig || mongoose.model<IPipConfig>('PipConfig', PipConfigSchema);
