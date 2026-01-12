import mongoose from 'mongoose';

const MusicSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    url: { type: String, required: true },
    coverUrl: String,
    duration: Number
});

export const MusicModel = mongoose.model('Music', MusicSchema);
