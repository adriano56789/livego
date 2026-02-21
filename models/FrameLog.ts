
import mongoose, { Schema, Document } from 'mongoose';

export interface IFrameLog extends Document {
  userId: mongoose.Types.ObjectId;
  frameId: string;
  componentName: string;
  action: 'purchase' | 'equip' | 'unequip' | 'expire' | 'gift_received';
  cost?: number; // Custo em diamantes (se aplicável)
  details?: string; // Metadados extras
  timestamp: Date;
}

const FrameLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  frameId: { type: String, required: true },
  componentName: { type: String, required: true },
  
  action: { 
    type: String, 
    enum: ['purchase', 'equip', 'unequip', 'expire', 'gift_received'], 
    required: true 
  },
  
  cost: { type: Number, default: 0 },
  details: { type: String },
  
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false }
});

// Índice para histórico do usuário
FrameLogSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.models.FrameLog || mongoose.model<IFrameLog>('FrameLog', FrameLogSchema);
