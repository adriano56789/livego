import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    text: { type: String, required: true }
}, { timestamps: true });

export const CommentModel = mongoose.model('Comment', CommentSchema);
