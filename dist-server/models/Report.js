import mongoose from 'mongoose';
const ReportSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    reporterId: { type: String, required: true, index: true },
    reportedId: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    context: {
        type: { type: String, enum: ['profile', 'post', 'comment', 'message'] },
        id: String
    },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' }
}, { timestamps: true });
export const ReportModel = mongoose.model('Report', ReportSchema);
