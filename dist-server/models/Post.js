import mongoose from 'mongoose';
const PostSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    mediaUrl: { type: String, required: true },
    thumbnailUrl: String,
    caption: String,
    likesCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    musicId: String
}, { timestamps: true });
export const PostModel = mongoose.model('Post', PostSchema);
