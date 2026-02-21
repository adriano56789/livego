import mongoose, { Schema, Document } from 'mongoose';

export interface IUserMedia extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  type: 'image' | 'video';
  duration?: number; // Only for videos (max 30s as per UI)
  sortOrder: number; // 0-7, where 0 is 'Portrait' (Capa/Retrato)
  createdAt: Date;
}

const UserMediaSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  duration: { type: Number },
  sortOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Index to efficiently fetch a user's gallery in order
UserMediaSchema.index({ userId: 1, sortOrder: 1 });

export default mongoose.models.UserMedia || mongoose.model<IUserMedia>('UserMedia', UserMediaSchema);