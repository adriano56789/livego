import mongoose from 'mongoose';
const MessageSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    chatId: { type: String, required: true, index: true },
    fromUserId: { type: String, required: true, index: true },
    toUserId: { type: String, required: true, index: true },
    text: { type: String, required: true },
    imageUrl: String,
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }
}, { timestamps: true });
export const MessageModel = mongoose.model('Message', MessageSchema);
