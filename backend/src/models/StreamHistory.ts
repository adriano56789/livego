import mongoose, { Schema, Document } from 'mongoose';

export interface IStreamHistory extends Document {
    id: string;
    streamId: string;
    hostId: string;
    hostName: string;
    hostAvatar: string;
    title: string;
    startTime: string;
    endTime: string;
    duration: string; // formatado como "HH:MM:SS"
    peakViewers: number;
    totalCoins: number;
    totalFollowers: number;
    totalMembers: number;
    totalFans: number;
    category?: string;
    tags: string[];
    country?: string;
    recordingUrl?: string;
    thumbnailUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const StreamHistorySchema = new Schema<IStreamHistory>({
    id: { type: String, required: true, unique: true },
    streamId: { type: String, required: true },
    hostId: { type: String, required: true },
    hostName: { type: String, required: true },
    hostAvatar: { type: String },
    title: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: String, required: true },
    peakViewers: { type: Number, default: 0 },
    totalCoins: { type: Number, default: 0 },
    totalFollowers: { type: Number, default: 0 },
    totalMembers: { type: Number, default: 0 },
    totalFans: { type: Number, default: 0 },
    category: { type: String },
    tags: [{ type: String }],
    country: { type: String },
    recordingUrl: { type: String },
    thumbnailUrl: { type: String },
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

// Índices para performance
StreamHistorySchema.index({ streamId: 1 });
StreamHistorySchema.index({ hostId: 1 });
StreamHistorySchema.index({ endTime: -1 });
StreamHistorySchema.index({ createdAt: -1 });

export const StreamHistory = mongoose.model<IStreamHistory>('StreamHistory', StreamHistorySchema);
