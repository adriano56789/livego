

import React, { ReactNode, ReactElement, SVGProps } from "react";

export interface Streamer {
  id: string;
  hostId: string;
  name: string;
  avatar: string;
  location: string;
  time: string;
  message: string;
  tags: string[];
  isHot?: boolean;
  icon?: string;
  country?: string;
  viewers?: number;
  isPrivate?: boolean;
  quality?: string;
}

export interface Country {
  name:string;
  code: string;
}

export enum ToastType {
  Error = 'error',
  Success = 'success',
  Info = 'info'
}

export interface ToastData {
  id: number;
  type: ToastType;
  message: string;
}

export interface Like {
    id: string;
    fan: {
        id: string;
        name: string;
        avatarUrl: string;
    };
    obra: {
        id: string;
        title: string;
    };
    timestamp: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
}

export interface Gift {
  id: string;
  name: string;
  price?: number;
  icon: string;
  component?: ReactElement<SVGProps<SVGSVGElement>>;
  category: 'Popular' | 'Luxo' | 'Atividade' | 'VIP' | 'Efeito' | 'Entrada';
  triggersAutoFollow?: boolean;
  videoUrl?: string;
}

export interface ReceivedGift extends Omit<Gift, 'component'> {
  count: number;
  viewed: boolean;
  lastReceived: string;
  senders: Array<{
    userId: string;
    name: string;
    avatarUrl: string;
    count: number;
    lastSent: string;
    viewed: boolean;
  }>;
}

export interface Obra {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  musicId?: string;
  musicTitle?: string;
  musicArtist?: string;
  audioUrl?: string;
}

export interface User {
  id: string;
  identification: string;
  name: string;
  avatarUrl: string;
  coverUrl?: string;
  photos?: string[];
  country?: string;
  age?: number;
  gender?: 'male' | 'female' | 'not_specified';
  level: number;
  xp?: number;
  rank?: number;
  location?: string;
  distance?: string;
  fans: number;
  following: number;
  receptores: number;
  enviados: number;
  topFansAvatars?: string[];
  isVIP?: boolean;
  vipSince?: string;
  vipSubscriptionDate?: string;
  vipExpirationDate?: string;
  badges?: string[];
  diamonds: number;
  earnings: number;
  earnings_withdrawn: number;
  isLive?: boolean;
  isFollowed?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  lastConnected?: string;
  connectedClients?: string[];
  withdrawal_method?: {
    method: string;
    details: any;
  };
  bio?: string;
  obras?: Obra[];
  curtidas?: Like[];
  birthday?: string;
  residence?: string;
  emotional_status?: string;
  tags?: string;
  profession?: string;
  isAvatarProtected?: boolean;
  activeFrameId?: string | null;
  ownedFrames: { frameId: string; expirationDate: string; }[];
  fanClub?: {
    streamerId: string;
    streamerName: string;
    level: number;
  };
  chatPermission?: 'all' | 'followers' | 'none';
  pipEnabled?: boolean;
  locationPermission?: 'granted' | 'denied' | 'prompt';
  showActivityStatus?: boolean;
  showLocation?: boolean;
  privateStreamSettings?: {
      privateInvite: boolean;
      followersOnly: boolean;
      fansOnly: boolean;
      friendsOnly: boolean;
  };
  platformEarnings?: number;
  adminEarnings?: number;
  adminWithdrawalMethod?: { email: string; };
  frameExpiration?: string | null;
  transactions?: Array<{
    type: string;
    amount: number;
    fee?: number;
    status?: string;
    timestamp: number;
  }>;
}

export interface LevelInfo {
  level: number;
  xp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number;
  privileges: string[];
  nextRewards: string[];
}

export type Visitor = User & { visitTimestamp: string };

export interface EligibleUser extends User {
  giftsSent: {
    name: string;
    icon: string;
    quantity: number;
    component?: ReactElement<SVGProps<SVGSVGElement>>;
  }[];
  sessionContribution: number;
}

export interface Conversation {
  id: string;
  friend: User;
  lastMessage: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  from: string;
  to: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'sending' | 'failed';
  type?: 'system-friend-notification';
  translatedText?: string;
  fanClub?: {
    streamerId: string;
    streamerName: string;
    level: number;
  };
}

export interface Message {
  id: string | number;
  avatarUrl: string;
  username: string;
  badgeLevel: number;
  text: string;
  status?: 'sent' | 'delivered' | 'read' | 'sending' | 'failed';
  chatId?: string;
  from?: string;
  to?: string;
  imageUrl?: string;
  timestamp: string;
  translatedText?: string;
  type?: 'system-friend-notification';
  fanClub?: {
    streamerId: string;
    streamerName: string;
    level: number;
  };
}

export type RankedUser = User & { contribution: number; gender: 'male' | 'female' | 'not_specified'; age: number; };

export interface StreamSummaryData {
  viewers: number;
  duration: string;
  coins: number;
  followers: number;
  members: number;
  fans: number;
  user: {
    name: string;
    avatarUrl: string;
  };
}

export interface LiveSessionState {
  startTime: number;
  viewers: number;
  peakViewers: number;
  coins: number;
  followers: number;
  members: number;
  fans: number;
  events: any[];
  isMicrophoneMuted?: boolean;
  isStreamMuted?: boolean;
  isAutoFollowEnabled?: boolean;
  isAutoPrivateInviteEnabled?: boolean;
}

export interface NotificationSettings {
  newMessages: boolean;
  streamerLive: boolean;
  followedPosts: boolean;
  pedido: boolean;
  interactive: boolean;
}

export interface BeautySettings {
    [effectName: string]: number;
}

export interface PurchaseRecord {
  id: string;
  userId: string;
  type: 'purchase_diamonds' | 'withdraw_earnings' | 'withdraw_platform_earnings' | 'purchase_frame' | 'vip_subscription' | 'admin_fee';
  description: string;
  amountBRL: number;
  amountCoins: number;
  status: 'Concluído' | 'Pendente' | 'Cancelado';
  timestamp: string;
  isAdminTransaction?: boolean;
  relatedTransactionId?: string;
}

export interface FeedPhoto {
  id: string;
  photoUrl: string; // Will hold image OR video url
  type: 'image' | 'video';
  thumbnailUrl?: string;
  user: User;
  likes: number;
  isLiked: boolean;
  commentCount: number;
  musicId?: string;
  musicTitle?: string;
  musicArtist?: string;
  audioUrl?: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
}

export interface GoogleAccount {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface StreamHistoryEntry {
  id: string;
  streamerId: string;
  name: string;
  avatar: string;
  startTime: number;
  endTime: number;
}

export interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  isBlocked: boolean;
  blockedAt?: string;
  blockedBy?: string;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
}
