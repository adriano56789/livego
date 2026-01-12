import mongoose from 'mongoose';
const ConversationSchema = new mongoose.Schema({
    participants: [{ type: String, required: true }],
    lastMessage: { type: String, default: "" },
    unreadCount: { type: Map, of: Number, default: {} },
}, { timestamps: true });
export const ConversationModel = mongoose.model('Conversation', ConversationSchema);
