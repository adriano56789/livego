import mongoose from 'mongoose';
const PackageSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    diamonds: { type: Number, required: true },
    price: { type: Number, required: true },
    label: String,
    active: { type: Boolean, default: true }
});
export const PackageModel = mongoose.model('Package', PackageSchema);
