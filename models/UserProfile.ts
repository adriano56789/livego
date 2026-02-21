
import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfile extends Document {
  userId: mongoose.Types.ObjectId; // Link to the main User identity
  nickname: string;
  gender: 'male' | 'female' | 'not_specified';
  birthday?: string;
  bio?: string;
  residence?: string;
  emotionalStatus?: string;
  tags?: string;
  profession?: string;
  obras: {
      id: string;
      url: string;
      createdAt: Date;
  }[];
  updatedAt: Date;
}

const UserProfileSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  nickname: { type: String, required: true }, // 'name' in User, mapped to 'nickname' in UI label
  gender: { type: String, enum: ['male', 'female', 'not_specified'], default: 'not_specified' },
  birthday: { type: String }, // Stored as string 'DD/MM/YYYY' per UI input
  bio: { type: String },
  residence: { type: String },
  emotionalStatus: { type: String },
  tags: { type: String },
  profession: { type: String },
  obras: [{
      id: { type: String, required: true },
      url: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

export default mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
