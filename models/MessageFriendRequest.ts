import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageFriendRequest extends Document {
  requester: mongoose.Types.ObjectId; // referência para User (MessageUser)
  createdAt: Date;
  updatedAt: Date;
}

const MessageFriendRequestSchema: Schema = new Schema({
  requester: { type: Schema.Types.ObjectId, ref: 'MessageUser', required: true }
}, {
  timestamps: true
});

export default mongoose.models.MessageFriendRequest || mongoose.model<IMessageFriendRequest>('MessageFriendRequest', MessageFriendRequestSchema);