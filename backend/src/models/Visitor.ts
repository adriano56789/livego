import mongoose, { Document, Schema } from 'mongoose';

export interface IVisitor extends Document {
    id: string;
    visitorId: string;
    visitedId: string;
    visitedAt: Date;
}

const VisitorSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    visitorId: { type: String, required: true, index: true },
    visitedId: { type: String, required: true, index: true },
    visitedAt: { type: Date, default: Date.now }
});

// Create a compound index to quickly find visitors for a user
VisitorSchema.index({ visitedId: 1, visitedAt: -1 });

export const Visitor = mongoose.model<IVisitor>('Visitor', VisitorSchema);
