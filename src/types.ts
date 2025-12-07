import React, { ReactNode, ReactElement, SVGProps } from "react";

export interface Streamer {
  [x: string]: string | string[] | boolean | number | undefined;
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

export interface Gift {
  name: string;
  price?: number;
  icon: string;
  component?: ReactElement<SVGProps<SVGSVGElement>>;
  category: 'Popular' | 'Luxo' | 'Atividade' | 'VIP' | 'Efeito' | 'Entrada';
  triggersAutoFollow?: boolean;
  videoUrl?: string;
}

export interface Obra {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  description?: string;
  caption?: string;
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
  isLive?: boolean;
  isFollowed?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  lastConnected?: string;
  connectedClients?: string[];
  diamonds: number;
  earnings: number;
  earnings_withdrawn: number;
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
  isVIP?: boolean;
  vipSubscriptionDate?: string;
  vipExpirationDate?: string;
  isAvatarProtected?: boolean;
  activeFrameId?: string | null;
  ownedFrames: { frameId: string; expirationDate: string; }[];
  // FIX: Add fanClub property to User type.
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
  adminWithdrawalMethod?: { email: string; };
  frameExpiration?: string | null;
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

export interface Message {
  id: string;
  chatId: string;
  from: string;
  to: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'sending' | 'failed';
  type?: 'system-friend-notification';
  // FIX: Add translatedText and fanClub properties to Message type.
  translatedText?: string;
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
  isPrivate?: boolean;
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

type NomeEfeitoBeleza = 'suavidade' | 'clareamento' | 'afinamento' | 'olhosGrandes' | 'narizAjuste' | 'queixo' | 'bochechas';

export type BeautySettings = {
  [K in NomeEfeitoBeleza]?: number;
};

export interface PurchaseRecord {
  id: string;
  userId: string;
  type: 'purchase_diamonds' | 'withdraw_earnings' | 'withdraw_platform_earnings' | 'purchase_frame' | 'vip_subscription';
  description: string;
  amountBRL: number;
  amountCoins: number;
  status: 'Concluído' | 'Pendente' | 'Cancelado';
  timestamp: string;
}

export interface FeedPhoto {
  id: string;
  photoUrl: string; // Will hold image OR video url
  type: 'image' | 'video';
  thumbnailUrl?: string;
  user: User;
  likes: number;
  isLiked: boolean;
  commentCount?: number;
  description?: string;
  caption?: string;
  musicId?: string;
  musicTitle?: string;
  musicArtist?: string;
  audioUrl?: string;
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