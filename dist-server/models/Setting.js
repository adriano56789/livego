import mongoose from 'mongoose';
const SettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, index: true },
    value: mongoose.Schema.Types.Mixed
}, { timestamps: true });
export const SettingModel = mongoose.model('Setting', SettingSchema);
