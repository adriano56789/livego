import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    identification: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    diamonds: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    avatarUrl: String,
    coverUrl: String,
    fans: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    followingIds: [{ type: String }],
    isOnline: { type: Boolean, default: false },
    activeFrameId: { type: String, default: null },
    ownedFrames: [{ frameId: String, expirationDate: String }],
    billingAddress: {
        street: String,
        number: String,
        district: String,
        city: String,
        zip: String
    },
    creditCardInfo: {
        last4: String,
        brand: String,
        expiry: String
    },
    fcmTokens: { type: [String], default: [] }
}, { 
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            delete (ret as any)._id;
            delete (ret as any).__v;
            delete (ret as any).password;
            return ret;
        }
    }
});

export const UserModel = mongoose.model('User', UserSchema);