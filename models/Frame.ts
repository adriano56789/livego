import mongoose from 'mongoose';

const FrameSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: 'avatar' },
    duration: { type: Number, default: 30 },
    active: { type: Boolean, default: true }
});

export const FrameModel = mongoose.model('Frame', FrameSchema);
