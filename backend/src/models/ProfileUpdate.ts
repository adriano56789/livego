import mongoose, { Document, Schema } from 'mongoose';

export interface IProfileUpdate extends Document {
    id: string;
    userId: string;
    updateType: 'avatar' | 'cover' | 'info' | 'settings';
    oldValue?: string;
    newValue: string;
    updateReason?: string;
    updatedAt: Date;
}

const ProfileUpdateSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    updateType: { 
        type: String, 
        required: true, 
        enum: ['avatar', 'cover', 'info', 'settings'] 
    },
    oldValue: { type: String },
    newValue: { type: String, required: true },
    updateReason: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

ProfileUpdateSchema.index({ userId: 1, updatedAt: -1 });

ProfileUpdateSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const ProfileUpdate = mongoose.model<IProfileUpdate>('ProfileUpdate', ProfileUpdateSchema);
