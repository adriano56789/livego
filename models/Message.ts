import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: string; // room ID or user-user key
  from: mongoose.Types.ObjectId;
  to: string; // Can be userId or streamId
  text: string;
  imageUrl?: string;
  status: 'sent' | 'delivered' | 'read' | 'sending' | 'failed';
  type: string; // 'chat', 'system-friend-notification'
  timestamp: Date;
}

const MessageSchema: Schema = new Schema({
  chatId: { type: String, required: true, index: true },
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: String, required: true },
  text: { type: String, default: '' },
  imageUrl: { type: String },
  status: { type: String, enum: ['sent', 'delivered', 'read', 'sending', 'failed'], default: 'sent' },
  type: { type: String, default: 'chat' },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);