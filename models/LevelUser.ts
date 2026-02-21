import mongoose, { Schema, Document } from 'mongoose';

export interface ILevelUser extends Document {
  name: string; // nome do usuário
  avatarUrl: string; // URL da foto do avatar
  level: number; // nível atual
  xp: number; // experiência acumulada
  createdAt: Date;
  updatedAt: Date;
}

const LevelUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  level: { type: Number, required: true },
  xp: { type: Number, required: true }
}, {
  timestamps: true
});

export default mongoose.models.LevelUser || mongoose.model<ILevelUser>('LevelUser', LevelUserSchema);