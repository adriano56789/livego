import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[]; // References users in the chat
  lastMessage: string; // Displayed in the conversation list
  lastMessageAt: Date; // For sorting conversations by recency
  unreadCounts: Map<string, number>; // Map of userId -> unread count for badges
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadCounts: { 
    type: Map, 
    of: Number, 
    default: {} 
  }
}, {
  timestamps: true
});

// Index to find conversations for a specific user, sorted by recency
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });

export default mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);