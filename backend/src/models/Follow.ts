import mongoose, { Schema, Document } from 'mongoose';

export interface IFollow extends Document {
    id: string;
    followerId: string; // ID do usuário que segue
    followingId: string; // ID do usuário sendo seguido
    followedAt: Date;
    unfollowedAt?: Date;
    isActive: boolean; // true se ainda está seguindo, false se deu unfollow
}

const FollowSchema = new Schema<IFollow>({
    id: { type: String, required: true, unique: true },
    followerId: { type: String, required: true, index: true },
    followingId: { type: String, required: true, index: true },
    followedAt: { type: Date, default: Date.now },
    unfollowedAt: { type: Date },
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
FollowSchema.index({ followerId: 1, followingId: 1 });
FollowSchema.index({ followingId: 1, followerId: 1 });
FollowSchema.index({ isActive: 1 });

export const Follow = mongoose.model<IFollow>('Follow', FollowSchema);
