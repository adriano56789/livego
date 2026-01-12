import mongoose from 'mongoose';
const FollowerSchema = new mongoose.Schema({
    followerId: { type: String, required: true, index: true },
    followingId: { type: String, required: true, index: true }
}, { timestamps: true });
FollowerSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
export const FollowerModel = mongoose.model('Follower', FollowerSchema);
