import mongoose, { Schema, Document } from 'mongoose';

export interface IMainScreenStreamer extends Document {
  name: string; // nome do streamer
  avatar: string; // URL da foto
  isPrivate: boolean; // se a live é privada
  country: string; // código do país para bandeira
  icon: string; // ícone extra exibido ao lado do nome
  viewers: number; // quantidade de espectadores
  message: string; // mensagem exibida
  location: string; // localização exibida
  createdAt: Date;
  updatedAt: Date;
}

const MainScreenStreamerSchema: Schema = new Schema({
  name: { type: String, required: true },
  avatar: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  country: { type: String },
  icon: { type: String },
  viewers: { type: Number, default: 0 },
  message: { type: String },
  location: { type: String }
}, {
  timestamps: true
});

export default mongoose.models.MainScreenStreamer || mongoose.model<IMainScreenStreamer>('MainScreenStreamer', MainScreenStreamerSchema);