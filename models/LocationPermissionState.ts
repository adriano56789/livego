import mongoose, { Schema, Document } from 'mongoose';

export interface ILocationPermissionState extends Document {
  isOpen: boolean; // se o modal está aberto ou não
  status: 'granted' | 'denied' | 'prompt';
  createdAt: Date;
  updatedAt: Date;
}

const LocationPermissionStateSchema: Schema = new Schema({
  isOpen: { type: Boolean, default: false },
  status: { type: String, enum: ['granted', 'denied', 'prompt'], default: 'prompt' }
}, {
  timestamps: true
});

export default mongoose.models.LocationPermissionState || mongoose.model<ILocationPermissionState>('LocationPermissionState', LocationPermissionStateSchema);