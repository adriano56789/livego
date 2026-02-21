
import mongoose, { Schema, Document } from 'mongoose';

export interface IGooglePassword extends Document {
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const GooglePasswordSchema: Schema = new Schema({
  password: { 
    type: String, 
    required: true,
    minlength: 8 
  }
}, {
  timestamps: true
});

export default mongoose.models.GooglePassword || mongoose.model<IGooglePassword>('GooglePassword', GooglePasswordSchema);
