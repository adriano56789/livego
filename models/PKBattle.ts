import mongoose, { Schema, Document } from 'mongoose';

export interface IPKBattle extends Document {
  streamId: string; // Reference to the active stream/room
  hostId: mongoose.Types.ObjectId; // The streamer
  opponentId: mongoose.Types.ObjectId; // The challenger
  
  hostScore: number; // Displayed on the PK bar
  opponentScore: number; // Displayed on the PK bar
  
  // Interactions shown in UI
  hostHearts: number;
  opponentHearts: number;
  
  duration: number; // in minutes, used for the timer
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'ended';
  
  createdAt: Date;
  updatedAt: Date;
}

const PKBattleSchema: Schema = new Schema({
  streamId: { type: String, required: true, index: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  opponentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  hostScore: { type: Number, default: 0 },
  opponentScore: { type: Number, default: 0 },
  hostHearts: { type: Number, default: 0 },
  opponentHearts: { type: Number, default: 0 },
  
  duration: { type: Number, default: 5 }, // Default derived from PKBattleTimerSettingsScreen
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ['active', 'ended'], default: 'active', index: true }
}, {
  timestamps: true
});

export default mongoose.models.PKBattle || mongoose.model<IPKBattle>('PKBattle', PKBattleSchema);