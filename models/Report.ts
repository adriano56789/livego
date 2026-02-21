
import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId; // The user who submits the report
  reportedId: mongoose.Types.ObjectId; // The user being reported
  reason: string; // Reason for the report (e.g., "Reported from profile modal")
  status: 'pending' | 'reviewed' | 'resolved'; // Administrative status
  createdAt: Date;
}

const ReportSchema: Schema = new Schema({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reportedId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: true, updatedAt: true }
});

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
