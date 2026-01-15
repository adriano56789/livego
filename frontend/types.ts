export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  diamonds?: number;
  earnings?: number;
  isLive?: boolean;
  followers?: number;
  following?: number;
  bio?: string;
  isVerified?: boolean;
  isFollowing?: boolean;
  lastSeen?: string;
  status?: 'online' | 'offline' | 'live';
  isOnline?: boolean;
  uiSettings?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sound?: boolean;
    };
    [key: string]: any;
  };
}

export interface Streamer extends User {
  hostId: any;
  title?: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  viewers?: number;
  isPrivate?: boolean;
  streamKey?: string;
  rtmpUrl?: string;
  playbackUrl?: string;
  hlsUrl?: string;
}

export interface Gift {
  id: string;
  name: string;
  price: number;
  image: string;
  animation?: string;
  category?: string;
  isSpecial?: boolean;
}

export interface RankedUser extends User {
  rank: number;
  score: number;
  progress?: number;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: number;
  url: string;
  genre?: string;
  bpm?: number;
}

export interface FeedPhoto {
  id: string;
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  caption?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRecord {
  id: string;
  userId: string;
  amountBRL: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: string;
  timestamp: string;
  description?: string;
  paymentMethod?: string;
  transactionId?: string;
  receiptUrl?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
  isGift?: boolean;
  gift?: Gift;
  isSubscriber?: boolean;
  isModerator?: boolean;
  isStreamer?: boolean;
  isHighlighted?: boolean;
  isPinned?: boolean;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}