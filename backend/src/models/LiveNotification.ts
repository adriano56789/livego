import mongoose, { Document, Schema } from 'mongoose';

export interface ILiveNotification extends Document {
    id: string;
    userId: string; // Receiver
    streamerId: string;
    streamerName: string;
    streamerAvatar: string;
    streamId: string;
    read: boolean;
    createdAt: string;
    message?: string;
}

const LiveNotificationSchema = new Schema<ILiveNotification>({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    streamerId: { type: String, required: true },
    streamerName: { type: String, required: true },
    streamerAvatar: { type: String, required: true },
    streamId: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
    message: { type: String }
});

export const LiveNotification = mongoose.models.LiveNotification || mongoose.model<ILiveNotification>('LiveNotification', LiveNotificationSchema);
