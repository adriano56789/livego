import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageUser extends Document {
  name: string; // nome do usuário
  avatarUrl: string; // URL da foto do avatar
  gender: 'male' | 'female'; // Gênero
  age: number; // Idade
  level: number; // Nível
  identification: string; // ID exibido no perfil
  isOnline: boolean; // Se está online
  isFollowed: boolean; // Se é seguido
  createdAt: Date;
  updatedAt: Date;
}

const MessageUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  age: { type: Number, required: true },
  level: { type: Number, required: true },
  identification: { type: String, required: true },
  isOnline: { type: Boolean, default: false },
  isFollowed: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.models.MessageUser || mongoose.model<IMessageUser>('MessageUser', MessageUserSchema);