import mongoose, { Document, Schema } from 'mongoose';

export interface IInvitation extends Document {
    id: string;
    fromUserId: string;
    toUserId: string;
    type: string; // 'stream', 'friend', 'private_chat', etc.
    message: string;
    data: any;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    createdAt: Date;
    updatedAt: Date;
}

const InvitationSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    fromUserId: { type: String, required: true, index: true },
    toUserId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    message: { type: String, default: '' },
    data: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);
