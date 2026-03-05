import mongoose, { Document, Schema } from 'mongoose';

export interface IUserVideo extends Document {
    id: string;
    userId: string;
    videoUrl: string;
    thumbnailUrl: string;
    title: string;
    description?: string;
    duration: number;
    tags: string[];
    views: number;
    likes: number;
    comments: number;
    isPublic: boolean;
    postedAt: Date;
    updatedAt: Date;
}

const UserVideoSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    duration: { type: Number, required: true },
    tags: [{ type: String, default: [] }],
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    postedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

UserVideoSchema.index({ userId: 1, postedAt: -1 });
UserVideoSchema.index({ isPublic: 1, postedAt: -1 });

UserVideoSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const UserVideo = mongoose.model<IUserVideo>('UserVideo', UserVideoSchema);
