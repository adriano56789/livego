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
    privateGiftId?: string; // ID do presente necessário para acessar sala privada
    isAutoPrivateInviteEnabled?: boolean; // Auto-convite para sala privada ativado
    diamonds?: number; // Diamantes acumulados durante a live
    createdAt?: Date; // Timestamp automático do MongoDB
    updatedAt?: Date; // Timestamp automático do MongoDB
}

const StreamerSchema = new Schema<IStreamer>({
    id: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: '' },
    location: { type: String, default: '' },
    time: { type: String, default: 'Live Now' },
    message: { type: String, default: '' },
    tags: [{ type: String }],
    isHot: { type: Boolean, default: false },
    icon: { type: String, default: '' },
    country: { type: String, default: '' },
    viewers: { type: Number, default: 0 },
    isPrivate: { type: Boolean, default: false },
    quality: { type: String, default: 'HD' },
    demoVideoUrl: { type: String, default: '' },
    rtmpIngestUrl: { type: String, default: '' },
    srtIngestUrl: { type: String, default: '' },
    streamKey: { type: String, default: '' },
    playbackUrl: { type: String, default: '' },
    isLive: { type: Boolean, default: false },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    streamStatus: { type: String, enum: ['active', 'ended', 'paused'], default: 'active' },
    category: { type: String, default: 'live' },
    language: { type: String, default: 'pt' },
    maxViewers: { type: Number, default: 1000 },
    recordingEnabled: { type: Boolean, default: false },
    chatEnabled: { type: Boolean, default: true },
    giftsEnabled: { type: Boolean, default: true },
    privateGiftId: { type: String, default: '' }, // ID do presente necessário para acessar sala privada
    isAutoPrivateInviteEnabled: { type: Boolean, default: false }, // Auto-convite para sala privada ativado
    diamonds: { type: Number, default: 0 }, // Diamantes acumulados durante a live
}, {
    timestamps: true, // createdAt e updatedAt automáticos
    toJSON: {
        transform: function (doc, ret) {
            delete (ret as any)._id;
            delete (ret as any).__v;
            return ret;
        }
    }
});

export const Streamer = mongoose.model<IStreamer>('Streamer', StreamerSchema);
