import mongoose, { Schema, Document } from 'mongoose';

export interface IStreamer extends Document {
    id: string;
    hostId: string;
    name: string;
    avatar: string;
    location: string;
    time: string;
    message: string;
    tags: string[];
    isHot?: boolean;
    icon?: string;
    country?: string;
    viewers?: number;
    isPrivate?: boolean;
    quality?: string;
    demoVideoUrl?: string;
    rtmpIngestUrl?: string;
    srtIngestUrl?: string;
    streamKey?: string;
    playbackUrl?: string;
    isLive?: boolean;
    startTime?: string;
    endTime?: string;
    streamStatus?: 'active' | 'ended' | 'paused';
    category?: string;
    language?: string;
    maxViewers?: number;
    recordingEnabled?: boolean;
    chatEnabled?: boolean;
    giftsEnabled?: boolean;
}

const StreamerSchema = new Schema<IStreamer>({
    id: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String },
    location: { type: String },
    time: { type: String },
    message: { type: String },
    tags: [{ type: String }],
    isHot: { type: Boolean, default: false },
    icon: { type: String },
    country: { type: String },
    viewers: { type: Number, default: 0 },
    isPrivate: { type: Boolean, default: false },
    quality: { type: String },
    demoVideoUrl: { type: String },
    rtmpIngestUrl: { type: String },
    srtIngestUrl: { type: String },
    streamKey: { type: String },
    playbackUrl: { type: String },
    isLive: { type: Boolean, default: false },
    startTime: { type: String },
    endTime: { type: String },
    streamStatus: { type: String, enum: ['active', 'ended', 'paused'], default: 'active' },
    category: { type: String },
    language: { type: String },
    maxViewers: { type: Number, default: 1000 },
    recordingEnabled: { type: Boolean, default: false },
    chatEnabled: { type: Boolean, default: true },
    giftsEnabled: { type: Boolean, default: true },
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

export const Streamer = mongoose.model<IStreamer>('Streamer', StreamerSchema);
