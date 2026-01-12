import mongoose from 'mongoose';

const StreamerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    hostId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    avatar: String,
    thumbnail: String,
    category: { type: String, default: 'popular' },
    viewers: { type: Number, default: 0 },
    location: String,
    isPrivate: { type: Boolean, default: false },
    quality: { type: String, default: '1080p' },
    tags: [String]
}, { timestamps: true });

export const StreamerModel = mongoose.model('Streamer', StreamerSchema);
