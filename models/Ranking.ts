import mongoose from 'mongoose';

const RankingSchema = new mongoose.Schema({
    type: { type: String, enum: ['daily', 'weekly', 'monthly', 'all-time'], required: true, index: true },
    userId: { type: String, required: true, index: true },
    score: { type: Number, required: true },
    rank: { type: Number, required: true },
    date: { type: String, index: true }
}, { timestamps: true });

RankingSchema.index({ type: 1, date: 1, rank: 1 });

export const RankingModel = mongoose.model('Ranking', RankingSchema);
