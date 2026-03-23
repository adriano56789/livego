import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
    id: string;
    participants: string[]; // Array de IDs dos usuários participantes
    lastMessage?: {
        content: string;
        senderId: string;
        timestamp: Date;
        messageType: 'text' | 'image' | 'gift' | 'system';
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    participants: [{ type: String, required: true, ref: 'User' }],
    lastMessage: {
        content: { type: String, default: '' },
        senderId: { type: String },
        timestamp: { type: Date },
        messageType: { type: String, enum: ['text', 'image', 'gift', 'system'], default: 'text' }
    },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Índices para performance
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ 'lastMessage.timestamp': -1 });
ConversationSchema.index({ isActive: 1 });

ConversationSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
