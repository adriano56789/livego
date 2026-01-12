import mongoose from 'mongoose';
const GiftSchema = new mongoose.Schema({
    id: String,
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    icon: String,
    category: String,
    triggersAutoFollow: { type: Boolean, default: false }
});
export const GiftModel = mongoose.model('Gift', GiftSchema);
