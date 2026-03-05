import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoto extends Document {
    id: string;
    userId: string;
    url: string;
    caption?: string;
    likes: number;
    isLiked?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PhotoSchema = new Schema<IPhoto>({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    url: { type: String, required: true },
    caption: { type: String },
    likes: { type: Number, default: 0 },
    isLiked: { type: Boolean, default: false }
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

export const Photo = mongoose.model<IPhoto>('Photo', PhotoSchema);
