import mongoose, { Document, Schema } from 'mongoose';

export interface IVisitor extends Document {
    id: string;
    visitorId: string;
    visitedId: string;
    visitedAt: Date;
    visitorName?: string;
    visitorAvatar?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const VisitorSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    visitorId: { type: String, required: true },
    visitedId: { type: String, required: true },
    visitedAt: { type: Date, default: Date.now },
    visitorName: { type: String, default: null },
    visitorAvatar: { type: String, default: null }
}, {
    timestamps: true
});

// Create a compound index to quickly find visitors for a user
VisitorSchema.index({ visitedId: 1, visitedAt: -1 });

export const Visitor = mongoose.model<IVisitor>('Visitor', VisitorSchema);
