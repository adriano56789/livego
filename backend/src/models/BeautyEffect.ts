import mongoose, { Document, Schema } from 'mongoose';

export interface IBeautyEffect extends Document {
  name: string;
  type: 'filter' | 'effect';
  icon?: string;
  img?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BeautyEffectSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['filter', 'effect']
  },
  icon: {
    type: String,
    required: false
  },
  img: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IBeautyEffect>('BeautyEffect', BeautyEffectSchema);
