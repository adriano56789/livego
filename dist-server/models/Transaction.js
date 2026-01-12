import mongoose from 'mongoose';
const TransactionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['recharge', 'gift', 'withdrawal', 'bonus'] },
    amountDiamonds: Number,
    amountBRL: Number,
    status: { type: String, default: 'pending' },
    details: mongoose.Schema.Types.Mixed
}, { timestamps: true });
export const TransactionModel = mongoose.model('Transaction', TransactionSchema);
