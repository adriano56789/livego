

import React from 'react';

export enum ToastType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
}

export interface ToastData {
  id: number;
  type: ToastType;
  message: string;
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
    description?: string;
    caption?: string;
    createdAt?: string;
    comments?: any[];
}

export interface ConnectedAccount {
    id: string;
    provider: 'google' | 'facebook';
    email: string;
    name: string;
    avatarUrl?: string;
}

export interface User {
  id: string;
  identification: string;
  name: string;
  username?: string; 
  avatarUrl: string;
  coverUrl: string;
  email?: string;
  diamonds: number;
  isVIP?: boolean;
  vipSince?: string;
  vipExpirationDate?: string;
  badges?: string[];
  level: number;
  xp: number;
  fanClub?: {
    streamerId: string;
    streamerName: string;
    level: number;
  };
  activeFrameId?: string | null;
  frameExpiration?: string | null;
  ownedFrames?: { frameId: string; expirationDate: string }[];
  ownedGifts?: { giftId: string; quantity: number }[];
  isLive: boolean;
  liveTitle?: string;
  liveCategory?: string;
  liveTags?: string[];
  thumbnailUrl?: string;
  viewerCount?: number;
  isOnline?: boolean;
  lastSeen?: string;
  lastConnected?: string;
  connectedClients?: string[];
  earnings: number;
  earnings_withdrawn: number;
  adminEarnings?: number;
  platformEarnings?: number; 
  following: number;
  followingIds?: string[];
  blockedIds?: string[];
  fans: number;
  followers?: string[]; 
  isFollowed?: boolean; 
  relationship?: 'none' | 'following' | 'friend';
  visitors?: number;
  gender: 'male' | 'female' | 'not_specified';
  age: number;
  location: string;
  distance?: string;
  bio?: string;
  obras?: Obra[];
  curtidas?: any[];
  topFansAvatars?: string[];
  receptores?: number;
  enviados?: number;
  country?: string;
  locationPermission?: 'prompt' | 'granted' | 'denied';
  showActivityStatus?: boolean;
  showLocation?: boolean;
  hideLikes?: boolean;
  pipEnabled?: boolean;
  chatPermission?: 'all' | 'followers' | 'none';
  privateInvitePermission?: 'all' | 'followers' | 'none';
  isAvatarProtected?: boolean;
  privateStreamSettings?: {
      allowedUsers?: string[];
      price?: number;
      isPrivate?: boolean;
  };
  withdrawal_method?: {
      method: string;
      details: any;
  };
  billingAddress?: {
      street: string;
      number: string;
      district: string;
      city: string;
      zip: string;
  };
  creditCardInfo?: {
      last4: string;
      brand: string;
      expiry: string;
  };
  notificationSettings?: NotificationSettings;
  birthday?: string;
  emotionalState?: string;
  tags?: string;
  profession?: string;
  createdAt?: string;
  connectedAccounts?: ConnectedAccount[];
  uiSettings?: {
    zoomLevel: number;
  };
}

export interface Streamer {
  id: string;
  hostId: string;
  name: string;
  avatar: string;
  location: string;
  viewers: number;
  quality?: string;
  isPrivate?: boolean;
  category?: string;
  description?: string;
  thumbnail?: string;
  time?: string; 
  startedAt?: string; 
  message?: string;
  tags: string[];
  country?: string;
  language?: string;
  isFollowed?: boolean;
  relationship?: 'none' | 'following' | 'friend';
  isLive?: boolean;
}

export interface Gift {
  id: string;
  name: string;
  price: number;
  icon: string;
  category: string;
  component?: React.ReactNode;
  triggersAutoFollow?: boolean;
  isFromBackpack?: boolean;
  ownedQuantity?: number;
}

export interface GiftSendPayload {
    id?: number;
    fromUser: User;
    toUser: { id: string; name: string };
    gift: Gift;
    quantity: number;
    roomId: string;
}

export interface GiftCategory {
  id: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  level?: number;
}

export interface Viewer {
  id: string;
  avatar: string;
}

export interface StreamSummaryData {
  viewers: number;
  duration: string;
  coins: number;
  followers: number;
  members: number;
  fans: number;
}

export interface LiveSessionState {
  viewers: number;
  peakViewers: number;
  coins: number;
  followers: number;
  members: number;
  fans: number;
  events: any[];
  isMicrophoneMuted: boolean;
  isStreamMuted: boolean;
  isAutoFollowEnabled: boolean;
  isAutoPrivateInviteEnabled: boolean;
  startTime: number;
  giftSenders?: Map<string, any>;
}

export interface RankedUser extends User {
  value?: number;
  contribution?: number;
  rank?: number;
  position?: number;
  period?: 'daily' | 'weekly' | 'monthly';
}

export interface Conversation {
  id: string;
  friend: User;
  lastMessage: string;
  timestamp: string;
  lastMessageAt?: string;
  updatedAt?: string;
  unreadCount: number;
}

export interface Country {
  code: string;
  name: string;
  flag?: string;
}

export interface NotificationSettings {
  newMessages: boolean;
  streamerLive: boolean;
  newFollower?: boolean;
  newMessage?: boolean;
  followedPosts?: boolean;
  pedido?: boolean;
  interactive?: boolean;
  push?: boolean;
  followerPost?: boolean;
  order?: boolean;
  giftAlertsOnScreen?: boolean;
  giftSoundEffects?: boolean;
  giftLuxuryBanners?: boolean;
}

export interface BeautySettings {
  smooth: number;
  whiten: number;
  rosy: number;
  thinFace: number;
  bigEye: number;
}

export interface FeedPhoto {
  id: string;
  photoUrl: string;
  url?: string; // Alias
  type: 'image' | 'video';
  thumbnailUrl?: string;
  likes: number;
  isLiked?: boolean;
  userId?: string;
  user: User;
  description?: string;
  caption?: string;
  commentCount: number;
  musicId?: string;
  musicTitle?: string;
  musicArtist?: string;
  audioUrl?: string;
  timestamp?: string;
  likedBy?: string[];
  comments?: any[];
  content?: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
}

export interface StreamHistoryEntry {
  id: string;
  streamerId: string;
  name: string;
  avatar: string;
  status: string;
  isLive: boolean;
  lastWatchedAt?: string;
  userId?: string;
  content?: string;
  mediaType?: string;
  mediaUrl?: string;
  timestamp?: string;
  likes?: number;
  likedBy?: string[];
  comments?: any[];
}

export interface Visitor extends User {
  visitedAt: number | string;
  visitTimestamp?: string;
}

export interface PurchaseRecord {
  id: string;
  userId: string;
  amountBRL: number;
  amountCoins?: number;
  diamonds?: number;
  status: 'Concluído' | 'Cancelado' | 'Pendente' | 'Processando' | 'Falhou';
  type: string;
  date?: string;
  timestamp: string;
  description?: string;
  item?: string; 
  currency?: string;
  isAdminTransaction?: boolean;
  relatedTransactionId?: string;
  relatedUserName?: string;
  method?: string;
  net_value?: number;
  platform_fee?: number;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverUrl?: string;
  duration?: number;
}

export interface Message {
  id: string;
  chatId?: string;
  text: string;
  from: string;
  fromUserId?: string;
  to: string;
  timestamp: string;
  imageUrl?: string;
  tempId?: string;
  status?: 'sent' | 'delivered' | 'read';
  isMe?: boolean;
  isAck?: boolean;
  avatarUrl?: string;
  username?: string;
  badgeLevel?: number;
}

export interface EligibleUser {
    id: string;
    name: string;
    avatarUrl: string;
    contribution: number;
}

export interface LevelInfo {
    level: number;
    xp: number;
    currentLevel?: number;
    currentXp?: number;
    xpForCurrentLevel?: number;
    nextLevelXp?: number;
    xpForNextLevel?: number;
    progress?: number;
    levelName?: string;
    privileges?: string[];
    nextRewards?: string[];
}

export interface GoogleAccount {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    connectedAt?: number;
}

export interface Comment {
    id: string;
    user: User;
    userId?: string;
    text: string;
    timestamp: string;
    photoId?: string;
}

export interface Wallet {
    userId: string;
    balance: number;
    currency: string;
    diamonds: number;
    beans: number;
}

export interface QuickCompleteFriend {
    id: string;
    name: string;
    status: 'concluido' | 'pendente';
}

export interface WithdrawalSummary {
    total_earned: number;
    already_withdrawn: number;
    available_for_withdrawal: number;
    currency: string;
}

export interface WithdrawalPreview {
    gross_value: number;
    platform_fee: number;
    net_value: number;
    currency: string;
}

export interface WithdrawalMethod {
    id: string;
    label: string;
    fields: { name: string; label: string; placeholder: string; required: boolean }[];
}