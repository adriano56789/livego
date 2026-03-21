import mongoose, { Schema, Document } from 'mongoose';

export interface IBannedEntity extends Document {
    entityType: 'ip' | 'device' | 'user' | 'email';
    entityId: string;
    reason: string;
    evidence: any;
    bannedAt: Date;
    permanent: boolean;
    expiresAt?: Date;
    active: boolean;
    relatedEntities: {
        ips?: string[];
        devices?: string[];
        users?: string[];
        emails?: string[];
    };
}

const BannedEntitySchema = new Schema<IBannedEntity>({
    entityType: { type: String, required: true, enum: ['ip', 'device', 'user', 'email'] },
    entityId: { type: String, required: true },
    reason: { type: String, required: true },
    evidence: { type: Schema.Types.Mixed },
    bannedAt: { type: Date, required: true, default: Date.now },
    permanent: { type: Boolean, required: true, default: true },
    expiresAt: { type: Date },
    active: { type: Boolean, required: true, default: true },
    relatedEntities: {
        ips: [String],
        devices: [String],
        users: [String],
        emails: [String]
    }
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

export const BannedEntity = mongoose.model<IBannedEntity>('BannedEntity', BannedEntitySchema);
