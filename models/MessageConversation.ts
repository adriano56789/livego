import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageConversation extends Document {
  friend: mongoose.Types.ObjectId; // referência para User (MessageUser)
  lastMessage: string; // Última mensagem da conversa
  timestamp: Date; // Timestamp da última mensagem
  unreadCount: number; // Contagem de mensagens não lidas
  createdAt: Date;
  updatedAt: Date;
}

const MessageConversationSchema: Schema = new Schema({
  friend: { type: Schema.Types.ObjectId, ref: 'MessageUser', required: true },
  lastMessage: { type: String, required: true },
  timestamp: { type: Date, required: true },
  unreadCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.models.MessageConversation || mongoose.model<IMessageConversation>('MessageConversation', MessageConversationSchema);