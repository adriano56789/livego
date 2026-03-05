import mongoose, { Schema, Document } from 'mongoose';

export interface IFriendship extends Document {
    id: string;
    userId1: string; // ID do primeiro usuário
    userId2: string; // ID do segundo usuário
    initiatedBy: string; // ID do usuário que iniciou a amizade
    friendshipStartedAt: Date;
    isActive: boolean; // true se ainda são amigos
}

const FriendshipSchema = new Schema<IFriendship>({
    id: { type: String, required: true, unique: true },
    userId1: { type: String, required: true, index: true },
    userId2: { type: String, required: true, index: true },
    initiatedBy: { type: String, required: true },
    friendshipStartedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
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

// Índices compostos para consultas eficientes
FriendshipSchema.index({ userId1: 1, userId2: 1 });
FriendshipSchema.index({ userId2: 1, userId1: 1 });
FriendshipSchema.index({ isActive: 1 });

export const Friendship = mongoose.model<IFriendship>('Friendship', FriendshipSchema);
