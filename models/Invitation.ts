
import mongoose, { Schema, Document } from 'mongoose';

export interface IInvitation extends Document {
  inviterId: mongoose.Types.ObjectId;
  inviteeId: mongoose.Types.ObjectId;
  roomId: string; // The stream/room ID
  type: 'co-host' | 'private-watch'; // Distinguishes the purpose of the invitation
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema: Schema = new Schema({
  inviterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  inviteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  roomId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['co-host', 'private-watch'], 
    required: true,
    default: 'private-watch' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined'], 
    default: 'pending' 
  }
}, {
  timestamps: true
});

// Compound index to quickly find specific types of invites for a user in a room
InvitationSchema.index({ inviteeId: 1, roomId: 1, type: 1 });

export default mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', InvitationSchema);
