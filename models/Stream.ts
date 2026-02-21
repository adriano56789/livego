import mongoose, { Schema, Document } from 'mongoose';

export interface IStream extends Document {
  hostId: mongoose.Types.ObjectId;
  name: string; // Title
  avatar: string; // Cover
  message: string; // Description
  tags: string[];
  location: string;
  country: string;
  
  isLive: boolean;
  isPrivate: boolean;
  
  viewers: number;
  peakViewers: number;
  coins: number;
  
  streamType: 'WebRTC' | 'RTMP' | 'SRT';
  quality: string;
  
  // Ingest & Playback
  rtmpIngestUrl?: string;
  srtIngestUrl?: string;
  streamKey?: string;
  playbackUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

const StreamSchema: Schema = new Schema({
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: '' },
  avatar: { type: String, required: true },
  message: { type: String, default: '' },
  tags: [{ type: String }],
  location: { type: String },
  country: { type: String, default: 'br' },
  
  isLive: { type: Boolean, default: true },
  isPrivate: { type: Boolean, default: false },
  
  viewers: { type: Number, default: 0 },
  peakViewers: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  
  streamType: { type: String, enum: ['WebRTC', 'RTMP', 'SRT'], default: 'WebRTC' },
  quality: { type: String, default: '480p' },
  
  rtmpIngestUrl: String,
  srtIngestUrl: String,
  streamKey: String,
  playbackUrl: String
}, {
  timestamps: true
});

export default mongoose.models.Stream || mongoose.model<IStream>('Stream', StreamSchema);