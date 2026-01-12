import mongoose from 'mongoose';
const SessionSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    ipAddress: String,
    userAgent: String
}, { timestamps: true });
export const SessionModel = mongoose.model('Session', SessionSchema);
