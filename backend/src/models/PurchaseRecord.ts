import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseRecord extends Document {
    id: string;
    userId: string;
    type: 'purchase_diamonds' | 'withdraw_earnings' | 'withdraw_platform_earnings' | 'purchase_frame' | 'platform_fee_income';
    description: string;
    amountBRL: number;
    amountCoins: number;
    status: 'Concluído' | 'Pendente' | 'Cancelado';
}

const PurchaseRecordSchema = new Schema<IPurchaseRecord>({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    amountBRL: { type: Number, required: true },
    amountCoins: { type: Number, required: true },
    status: { type: String, enum: ['Concluído', 'Pendente', 'Cancelado'], default: 'Pendente' }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete (ret as any)._id;
            delete (ret as any).__v;
            return ret;
        }
    }
});

export const PurchaseRecord = mongoose.model<IPurchaseRecord>('PurchaseRecord', PurchaseRecordSchema);
