
import mongoose, { Schema, Document } from 'mongoose';

export interface IGoogleRegistration extends Document {
  firstName: string;
  lastName?: string; // Optional field as per screen ("opcional")
  createdAt: Date;
  updatedAt: Date;
}

const GoogleRegistrationSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String }
}, {
  timestamps: true
});

export default mongoose.models.GoogleRegistration || mongoose.model<IGoogleRegistration>('GoogleRegistration', GoogleRegistrationSchema);
