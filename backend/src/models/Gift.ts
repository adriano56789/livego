import mongoose, { Schema, Document } from 'mongoose';

export interface IGift extends Document {
    name: string;
    price?: number;
    icon: string;
    category: 'Popular' | 'Luxo' | 'Atividade' | 'VIP' | 'Efeito' | 'Entrada';
    triggersAutoFollow?: boolean;
    videoUrl?: string;
}

const GiftSchema = new Schema<IGift>({
    name: { type: String, required: true, unique: true },
    price: { type: Number, default: 0 },
    icon: { type: String, required: true },
    category: { type: String, enum: ['Popular', 'Luxo', 'Atividade', 'VIP', 'Efeito', 'Entrada'], required: true },
    triggersAutoFollow: { type: Boolean, default: false },
    videoUrl: { type: String }
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

export const Gift = mongoose.model<IGift>('Gift', GiftSchema);
