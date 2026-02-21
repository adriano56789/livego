import mongoose, { Schema, Document } from 'mongoose';

export interface ILevelInfo extends Document {
  level: number; // nível atual
  xp: number; // experiência atual
  xpForCurrentLevel: number; // XP mínimo para o nível atual
  xpForNextLevel: number; // XP necessário para o próximo nível
  progress: number; // porcentagem de progresso no nível atual
  privileges: string[]; // lista de privilégios do nível atual
  nextRewards: string[]; // recompensas do próximo nível
  createdAt: Date;
  updatedAt: Date;
}

const LevelInfoSchema: Schema = new Schema({
  level: { type: Number, required: true },
  xp: { type: Number, required: true },
  xpForCurrentLevel: { type: Number, required: true },
  xpForNextLevel: { type: Number, required: true },
  progress: { type: Number, required: true },
  privileges: [{ type: String }],
  nextRewards: [{ type: String }]
}, {
  timestamps: true
});

export default mongoose.models.LevelInfo || mongoose.model<ILevelInfo>('LevelInfo', LevelInfoSchema);