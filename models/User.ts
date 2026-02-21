
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  identification: string; 
  name: string; 
  avatarUrl: string;
  coverUrl?: string;
  
  gender?: 'male' | 'female' | 'not_specified' | 'custom';
  birthday?: string;
  bio?: string;
  level: number;
  xp: number;
  diamonds: number;
  earnings: number;
  
  // --- INVENTORY ---
  activeFrameId?: string;
  ownedFrames: { 
      frameId: string; 
      obtainedAt: Date;
      expiresAt?: Date; 
  }[];

  // --- CONSOLIDATED SETTINGS ---
  preferences: {
      language: { code: string; autoDetect: boolean };
      display: {
          zoomPercentage: number;
          pipEnabled: boolean;
          watermark: boolean;
      };
      privacy: {
          showLocation: boolean;
          showActivityStatus: boolean;
          chatPermission: 'all' | 'followers' | 'none';
      };
      notifications: {
          newMessages: boolean;
          streamerLive: boolean;
          followedPosts: boolean;
          pedido: boolean;
          interactive: boolean;
      };
      giftNotifications: {
          minPriceToNotify: number;
          enabledCategories: string[];
          disabledGiftIds: string[];
      };
      stream: {
          beauty: Record<string, number>;
          private: {
              privateInvite: boolean;
              followersOnly: boolean;
              fansOnly: boolean;
              friendsOnly: boolean;
          };
      };
      permissions: {
          camera: 'granted' | 'denied' | 'prompt';
          microphone: 'granted' | 'denied' | 'prompt';
      };
  };

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  identification: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  coverUrl: { type: String },
  
  gender: { type: String, enum: ['male', 'female', 'not_specified', 'custom'], default: 'not_specified' },
  birthday: { type: String },
  bio: { type: String },
  
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  diamonds: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },

  activeFrameId: String,
  ownedFrames: [{
    frameId: String,
    obtainedAt: { type: Date, default: Date.now },
    expiresAt: Date
  }],

  preferences: {
      language: {
          code: { type: String, default: 'pt-BR' },
          autoDetect: { type: Boolean, default: true }
      },
      display: {
          zoomPercentage: { type: Number, default: 100 },
          pipEnabled: { type: Boolean, default: false },
          watermark: { type: Boolean, default: true }
      },
      privacy: {
          showLocation: { type: Boolean, default: true },
          showActivityStatus: { type: Boolean, default: true },
          chatPermission: { type: String, enum: ['all', 'followers', 'none'], default: 'all' }
      },
      notifications: {
          newMessages: { type: Boolean, default: true },
          streamerLive: { type: Boolean, default: true },
          followedPosts: { type: Boolean, default: false },
          pedido: { type: Boolean, default: true },
          interactive: { type: Boolean, default: true }
      },
      giftNotifications: {
          minPriceToNotify: { type: Number, default: 0 },
          enabledCategories: [{ type: String }],
          disabledGiftIds: [{ type: String }]
      },
      stream: {
          beauty: { type: Map, of: Number, default: {} },
          private: {
              privateInvite: { type: Boolean, default: true },
              followersOnly: { type: Boolean, default: true },
              fansOnly: { type: Boolean, default: false },
              friendsOnly: { type: Boolean, default: false }
          }
      },
      permissions: {
          camera: { type: String, enum: ['granted', 'denied', 'prompt'], default: 'prompt' },
          microphone: { type: String, enum: ['granted', 'denied', 'prompt'], default: 'prompt' }
      }
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
