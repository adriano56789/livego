
import mongoose, { Schema, Document } from 'mongoose';

export interface IGoogleAccount extends Document {
  googleId: string; // The unique ID from Google
  name: string;
  email: string;
  avatarUrl?: string;
  userId: mongoose.Types.ObjectId; // Link to the main User entity
  createdAt: Date;
  lastLogin: Date;
}

const GoogleAccountSchema: Schema = new Schema({
  googleId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  avatarUrl: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  lastLogin: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.GoogleAccount || mongoose.model<IGoogleAccount>('GoogleAccount', GoogleAccountSchema);
