import mongoose, { Document, Schema } from 'mongoose';

export interface IBlock extends Document {
    id: string;
    blockerId: string; // ID de quem bloqueia
    blockedId: string; // ID de quem é bloqueado
    blockedAt: Date;
    isActive: boolean;
    unblockedAt?: Date;
    reason?: string;
}

const BlockSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    blockerId: { type: String, required: true },
    blockedId: { type: String, required: true },
    blockedAt: { type: Date, required: true, default: Date.now },
    isActive: { type: Boolean, required: true, default: true },
    unblockedAt: { type: Date },
    reason: { type: String }
});

// Índices para performance
BlockSchema.index({ blockerId: 1, isActive: 1 });
BlockSchema.index({ blockedId: 1, isActive: 1 });
BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

BlockSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const Block = mongoose.model<IBlock>('Block', BlockSchema);
