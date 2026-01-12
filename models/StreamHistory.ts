import mongoose from 'mongoose';

const StreamHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    streamerId: { type: String, required: true, index: true },
    lastWatchedAt: { type: Date, required: true, index: true }
}, { timestamps: true });

StreamHistorySchema.index({ userId: 1, streamerId: 1 }, { unique: true });

export const StreamHistoryModel = mongoose.model('StreamHistory', StreamHistorySchema);
