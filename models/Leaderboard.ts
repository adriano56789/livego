
import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboard extends Document {
  period: 'daily' | 'weekly' | 'monthly';
  type: 'contribution' | 'receiving'; // Support for both sender and receiver leaderboards
  referenceDate: Date; // The date representing the start of the period
  entries: {
    user: mongoose.Types.ObjectId; // Reference to User to get name, avatar, level, gender, age
    score: number; // The contribution amount displayed
    rank: number; // 1, 2, 3...
  }[];
  updatedAt: Date;
}

const LeaderboardSchema: Schema = new Schema({
  period: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly'], 
    required: true,
    index: true 
  },
  type: { 
    type: String, 
    enum: ['contribution', 'receiving'], 
    default: 'contribution',
    index: true 
  },
  referenceDate: { type: Date, required: true, index: true },
  entries: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true },
    rank: { type: Number, required: true }
  }]
}, {
  timestamps: true
});

// Index to quickly fetch a specific leaderboard
LeaderboardSchema.index({ period: 1, type: 1, referenceDate: -1 });

export default mongoose.models.Leaderboard || mongoose.model<ILeaderboard>('Leaderboard', LeaderboardSchema);
