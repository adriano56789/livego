import mongoose from 'mongoose';

const PayoutSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    amountBRL: { type: Number, required: true },
    amountDiamonds: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending', index: true },
    methodDetails: mongoose.Schema.Types.Mixed,
    transactionId: String
}, { timestamps: true });

export const PayoutModel = mongoose.model('Payout', PayoutSchema);
