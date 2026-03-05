import mongoose, { Document, Schema } from 'mongoose';

export interface IFollowers extends Document {
    id: string;
    followerId: string; // ID de quem segue
    followingId: string; // ID de quem é seguido
    followedAt: Date;
    isActive: boolean;
    unfollowedAt?: Date;
}

const FollowersSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    followerId: { type: String, required: true, ref: 'User' },
    followingId: { type: String, required: true, ref: 'User' },
    followedAt: { type: Date, required: true, default: Date.now },
    isActive: { type: Boolean, required: true, default: true },
    unfollowedAt: { type: Date }
});

// Índices para performance
FollowersSchema.index({ followerId: 1, isActive: 1 });
FollowersSchema.index({ followingId: 1, isActive: 1 });
FollowersSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

FollowersSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const Followers = mongoose.model<IFollowers>('Followers', FollowersSchema);
