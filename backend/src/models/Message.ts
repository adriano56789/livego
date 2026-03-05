import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    id: string;
    chatId: string;
    from: string;
    to: string;
    text: string;
    imageUrl?: string;
    status: 'sent' | 'delivered' | 'read' | 'sending' | 'failed';
    type?: 'system-friend-notification';
}

const MessageSchema = new Schema<IMessage>({
    id: { type: String, required: true, unique: true },
    chatId: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    text: { type: String, required: true },
    imageUrl: { type: String },
    status: { type: String, enum: ['sent', 'delivered', 'read', 'sending', 'failed'], default: 'sent' },
    type: { type: String }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete (ret as any)._id;
            delete (ret as any).__v;
            return ret;
        }
    }
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
