
import mongoose, { Schema, Document } from 'mongoose';

export interface IInviteRestriction extends Document {
  streamId: string; // The room
  minLevelToInvite: number; // Minimum level required to send invites
  minLevelToJoin: number; // Minimum level required to be invited
  allowedRoles: string[]; // ['admin', 'moderator', 'vip', 'user']
  createdAt: Date;
  updatedAt: Date;
}

const InviteRestrictionSchema: Schema = new Schema({
  streamId: { type: String, required: true, unique: true, index: true },
  minLevelToInvite: { type: Number, default: 1 },
  minLevelToJoin: { type: Number, default: 1 },
  allowedRoles: [{ type: String, enum: ['admin', 'moderator', 'vip', 'user'] }]
}, {
  timestamps: true
});

export default mongoose.models.InviteRestriction || mongoose.model<IInviteRestriction>('InviteRestriction', InviteRestrictionSchema);
