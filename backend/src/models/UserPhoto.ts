import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPhoto extends Document {
    id: string;
    userId: string;
    photoUrl: string;
    caption?: string;
    tags: string[];
    likes: number;
    comments: number;
    isPublic: boolean;
    postedAt: Date;
    updatedAt: Date;
}

const UserPhotoSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    photoUrl: { type: String, required: true },
    caption: { type: String, default: '' },
    tags: [{ type: String, default: [] }],
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    postedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

UserPhotoSchema.index({ userId: 1, postedAt: -1 });
UserPhotoSchema.index({ isPublic: 1, postedAt: -1 });

UserPhotoSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const UserPhoto = mongoose.model<IUserPhoto>('UserPhoto', UserPhotoSchema);
