import mongoose from 'mongoose';

const BlockSchema = new mongoose.Schema({
    blockerId: { type: String, required: true, index: true },
    blockedId: { type: String, required: true, index: true }
}, { timestamps: true });

BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export const BlockModel = mongoose.model('Block', BlockSchema);
