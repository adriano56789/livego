
import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedPhoto extends Document {
  user: mongoose.Types.ObjectId; // Reference to the User who posted the photo
  photoUrl: string; // The URL of the image or video
  likes: number; // Cached count of likes for display
  likedBy: mongoose.Types.ObjectId[]; // List of user IDs who liked this photo (determines isLiked)
  createdAt: Date;
  updatedAt: Date;
}

const FeedPhotoSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  photoUrl: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

// Index to efficiently query photos for the feed, typically sorted by newest
FeedPhotoSchema.index({ createdAt: -1 });

export default mongoose.models.FeedPhoto || mongoose.model<IFeedPhoto>('FeedPhoto', FeedPhotoSchema);
