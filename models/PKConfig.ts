import mongoose, { Schema, Document } from 'mongoose';

export interface IPKConfig extends Document {
  userId: mongoose.Types.ObjectId; // Reference to the streamer setting the config
  duration: number; // Preferred duration in minutes (e.g., 5, 7, 12, 20)
  updatedAt: Date;
}

const PKConfigSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  duration: { type: Number, default: 5 },
}, {
  timestamps: true
});

export default mongoose.models.PKConfig || mongoose.model<IPKConfig>('PKConfig', PKConfigSchema);