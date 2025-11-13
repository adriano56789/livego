// Core Types
type Nullable<T> = T | null;

// User related types
export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  avatarUrl: string;
  coverUrl?: string;
  bio?: string;
  isLive?: boolean;
  isVerified?: boolean;
  isFollowing?: boolean;
  isBlocked?: boolean;
  followersCount?: number;
  followingCount?: number;
  fans?: number;
  level?: number;
  experience?: number;
  coins?: number;
  diamonds?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  birthday?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
  fanClub?: {
    level: number;
    name?: string;
    joinDate?: string;
    isMember?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// Stream related types
export interface Stream {
  id: string;
  streamer: User;
  title: string;
  description?: string;
  thumbnailUrl: string;
  streamUrl: string;
  hlsUrl?: string;
  viewerCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  giftCount: number;
  diamondEarned: number;
  isPrivate: boolean;
  isLive: boolean;
  startedAt: string;
  endedAt?: string;
  category?: string;
  tags?: string[];
  location?: string;
  streamKey?: string;
  streamStatus: 'idle' | 'connecting' | 'live' | 'ended' | 'error';
  moderators?: string[];
  bannedUsers?: string[];
  allowedUsers?: string[];
  currentViewers?: User[];
  topGifters?: { user: User; amount: number }[];
}

// Purchase related types
export interface PurchaseRecord {
  id: string;
  userId: string;
  type: 'coin_pack' | 'diamond_pack' | 'subscription' | 'gift' | 'other';
  itemId: string;
  itemName: string;
  description?: string;
  amount: number;
  price: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'crypto' | 'other';
  paymentId?: string;
  receiptUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Gift related types
export interface Gift {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  animationUrl?: string;
  gifUrl?: string;
  lottieUrl?: string;
  category?: string;
  isActive: boolean;
  isSpecial: boolean;
  isAnimated: boolean;
  effect?: 'fireworks' | 'hearts' | 'stars' | 'confetti' | 'rain' | 'snow' | 'custom';
  soundEffect?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GiftHistory {
  id: string;
  gift: Gift;
  sender: User;
  receiver: User;
  streamId?: string;
  message?: string;
  isPrivate: boolean;
  comboCount: number;
  totalAmount: number;
  createdAt: string;
}

// Country/Region types
export interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  currency: string;
  languages: string[];
  isActive: boolean;
}

// Live session state
export enum LiveSessionState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  ENDED = 'ended',
  BANNED = 'banned'
}

// Toast notification type
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Ranked user type
export interface RankedUser extends User {
  rank: number;
  points: number;
  level: number;
  progress: number;
  nextLevelPoints: number;
  isCurrentUser?: boolean;
}

// Gift payload for animations
export interface GiftPayload {
  id: string;
  giftId: string;
  gift: Gift;
  sender: User;
  receiver: User;
  streamId?: string;
  messageId?: string;
  count: number;
  comboCount: number;
  totalAmount: number;
  isComboEnd: boolean;
  timestamp: number;
}

// Chat message types
export interface BaseMessage {
  id: string;
  type: 'text' | 'gift' | 'system' | 'join' | 'follow' | 'share' | 'like' | 'custom';
  sender: User;
  content: string;
  timestamp: number;
  isDeleted: boolean;
  metadata?: Record<string, any>;
}

export interface TextMessage extends BaseMessage {
  type: 'text';
  mentions?: string[];
  replyTo?: string;
}

export interface GiftMessage extends BaseMessage {
  type: 'gift';
  gift: Gift;
  count: number;
  isPrivate: boolean;
}

export type Message = TextMessage | GiftMessage | BaseMessage;

// Stream stats
export interface StreamStats {
  totalViewers: number;
  uniqueViewers: number;
  averageWatchTime: number;
  peakViewers: number;
  newFollowers: number;
  totalLikes: number;
  totalGifts: number;
  totalDiamonds: number;
  totalShares: number;
  totalComments: number;
  viewerCountries: Record<string, number>;
  viewerDevices: Record<string, number>;
  viewerGenders: Record<string, number>;
  viewerAges: Record<string, number>;
  topGifters: { userId: string; username: string; amount: number }[];
  topChatters: { userId: string; username: string; messageCount: number }[];
  streamHealth: {
    bitrate: number;
    fps: number;
    droppedFrames: number;
    resolution: string;
    quality: 'good' | 'fair' | 'poor' | 'offline';
    timestamp: number;
  }[];
}
