import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema({
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true }
}, { timestamps: true });

LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const LikeModel = mongoose.model('Like', LikeSchema);
