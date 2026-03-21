import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    id: string;
    userId: string;
    packageId: string;
    amount: number;
    diamonds: number;
    status: 'pending' | 'paid' | 'failed' | 'cancelled';
    paymentMethod?: 'pix' | 'credit_card';
    pixCode?: string;
    pixExpiration?: string;
    paymentConfirmationId?: string;
    confirmedAt?: Date;
}

const OrderSchema = new Schema<IOrder>({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    packageId: { type: String, required: true },
    amount: { type: Number, required: true },
    diamonds: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending' },
    paymentMethod: { type: String, enum: ['pix', 'credit_card'] },
    pixCode: { type: String },
    pixExpiration: { type: String },
    paymentConfirmationId: { type: String },
    confirmedAt: { type: Date }
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

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
