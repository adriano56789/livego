
import mongoose, { Schema, Document } from 'mongoose';

export interface ISearchHistory extends Document {
  userId: mongoose.Types.ObjectId; // User who performed the search
  query: string; // The search text
  clickedUserId?: mongoose.Types.ObjectId; // Optional: If they clicked a result, who was it?
  isActive: boolean; // Soft delete
  createdAt: Date;
  updatedAt: Date;
}

const SearchHistorySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  query: { type: String, required: true },
  clickedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Index to quickly find recent searches for a user
SearchHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.SearchHistory || mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema);
