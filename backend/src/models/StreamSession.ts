import mongoose, { Document, Schema } from 'mongoose';

export interface StreamSession extends Document {
    streamId: string;
    hostId: string;
    viewers: number;
    coins: number;
    isStreamMuted: boolean;
    isAutoFollowEnabled: boolean;
    isAutoPrivateInviteEnabled: boolean;
    startTime: string;
    endTime?: string;
    giftsReceived: number;
    messagesCount: number;
}

const StreamSessionSchema = new Schema<StreamSession>({
    streamId: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    viewers: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    isStreamMuted: { type: Boolean, default: false },
    isAutoFollowEnabled: { type: Boolean, default: false },
    isAutoPrivateInviteEnabled: { type: Boolean, default: false },
    startTime: { type: String, required: true },
    endTime: { type: String },
    giftsReceived: { type: Number, default: 0 },
    messagesCount: { type: Number, default: 0 }
});

export const StreamSession = mongoose.models.StreamSession || mongoose.model<StreamSession>('StreamSession', StreamSessionSchema);
