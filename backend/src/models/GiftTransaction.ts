import mongoose, { Document, Schema } from 'mongoose';

export interface GiftTransaction extends Document {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar?: string;
    toUserId: string;
    toUserName: string;
    streamId: string;
    giftName: string;
    giftIcon: string;
    giftPrice: number;
    quantity: number;
    totalValue: number;
    createdAt: string;
}

const GiftTransactionSchema = new Schema<GiftTransaction>({
    id: { type: String, required: true, unique: true },
    fromUserId: { type: String, required: true },
    fromUserName: { type: String, required: true },
    fromUserAvatar: { type: String, default: '' },
    toUserId: { type: String, required: true },
    toUserName: { type: String, required: true },
    streamId: { type: String, required: true },
    giftName: { type: String, required: true },
    giftIcon: { type: String, required: true },
    giftPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalValue: { type: Number, required: true },
    createdAt: { type: String, required: true }
}, {
    timestamps: true
});

export const GiftTransaction = mongoose.models.GiftTransaction || mongoose.model<GiftTransaction>('GiftTransaction', GiftTransactionSchema);
