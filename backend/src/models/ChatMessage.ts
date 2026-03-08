import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    messageType: 'text' | 'image' | 'gift' | 'system';
    isRead: boolean;
    readAt?: Date;
    sentAt: Date;
    metadata?: {
        imageUrl?: string;
        giftId?: string;
        giftValue?: number;
        systemType?: string;
    };
}

const ChatMessageSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    conversationId: { type: String, required: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'image', 'gift', 'system'], default: 'text' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    sentAt: { type: Date, required: true, default: Date.now },
    metadata: {
        imageUrl: { type: String },
        giftId: { type: String },
        giftValue: { type: Number },
        systemType: { type: String }
    }
});

// Índices para performance
ChatMessageSchema.index({ conversationId: 1, sentAt: -1 });
ChatMessageSchema.index({ senderId: 1, sentAt: -1 });
ChatMessageSchema.index({ receiverId: 1, isRead: 1 });
ChatMessageSchema.index({ sentAt: -1 });

ChatMessageSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
