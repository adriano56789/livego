// Basic types
export type AppView = 'login' | 'upload' | 'edit' | 'feed' | 'profile' | 'go-live-setup' | 'messages' | 'diamond-purchase' | 'video' | 'protectors' | 'blocked-list' | 'withdrawal' | 'withdrawal-method-setup' | 'withdrawal-confirmation' | 'customer-service' | 'backpack' | 'help-article' | 'live-support-chat' | 'report-and-suggestion' | 'event-center' | 'event-detail' | 'settings' | 'copyright' | 'earnings-info' | 'connected-accounts' | 'search' | 'app-version' | 'live-ended' | 'my-level' | 'daily-rewards' | 'developer-tools' | 'ranking' | 'documentation' | 'purchase-history' | 'notification-settings' | 'push-settings' | 'private-live-invite-settings' | 'followers' | 'following' | 'visitors' | 'live-stream-viewer' | 'chat' | 'purchase-confirmation' | 'ranking-list';
export type Gender = 'male' | 'female';
export type Category = 'Popular' | 'Seguindo' | 'Perto' | 'Privada' | 'PK' | 'Novo' | 'Música' | 'Dança';
export type CameraStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error' | 'not-found' | 'in-use' | 'insecure';
export type EventStatus = 'ongoing' | 'upcoming' | 'past';
export type InventoryCategory = 'gift' | 'decoration';
export type InventorySubType = 'profile_frame' | 'entry_effect';
export type PaymentMethod = 'transfer' | 'card';
export type FacingMode = 'user' | 'environment';
export type SoundEffectName = 'riso' | 'aplausos' | 'animar' | 'beijar' | 'estranho' | 'resposta_errada' | 'sorriso';
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | null;
export type UserListRankingPeriod = 'daily' | 'weekly' | 'total';


// User and Profile types
export interface WithdrawalMethod {
    method: 'pix' | 'mercado_pago';
    account: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  nickname: string | null;
  gender: Gender | null;
  birthday: string | null;
  age: number | null;
  has_uploaded_real_photo: boolean;
  has_completed_profile: boolean;
  invite_code?: string | null;
  following: number[];
  followers: number;
  visitors: number;
  wallet_earnings: number;
  wallet_diamonds: number;
  paid_stream_ids?: number[];
  withdrawal_method: WithdrawalMethod | null;
  equipped_entry_effect_id?: string | null;
  level: number;
  xp: number;
  last_camera_used?: FacingMode;
  last_selected_category?: Category;
  country: 'BR' | 'US' | 'PT' | 'JP' | 'IT' | 'AR' | null;
  personalSignature?: string;
  personalityTags?: { id: string, label: string }[];
  achievements?: string[];
}

export interface AchievementFrame {
    type: 'pink-octagon' | 'silver-winged' | 'bronze-ornate' | 'purple-glowing' | 'golden-winged' | 'golden-star' | 'green-winged';
}

export interface Achievement {
    id: string;
    name: string;
    imageUrl: string;
    frameType: AchievementFrame['type'];
}

export interface ProfileBadgeType {
    text: string;
    type: 'gender_age' | 'level' | 'status' | 'regular' | 'top';
    icon?: 'female' | 'male' | 'fire' | 'play';
}

export interface PublicProfile {
  id: number;
  name: string;
  nickname: string;
  avatarUrl: string;
  age: number | null;
  gender: Gender | null;
  birthday: string | null;
  isLive: boolean;
  isFollowing: boolean;
  coverPhotoUrl: string;
  stats: {
    value: number;
    icon: 'coin' | 'moon' | 'crown';
  };
  badges: ProfileBadgeType[];
  protectors: ProtectorDetails[];
  achievements: Achievement[];
  personalityTags: { id: string, label: string }[];
  personalSignature: string;
}

// Stream-related types

// This is the single source of truth for a live stream in the database
export interface LiveStreamRecord {
  id: number;
  user_id: number;
  titulo: string;
  nome_streamer: string;
  thumbnail_url?: string;
  espectadores: number;
  categoria: Category;
  ao_vivo: boolean;
  em_pk: boolean;
  is_private: boolean;
  entry_fee: number | null;
  meta: string | null;
  inicio: string;
  permite_pk: boolean;
  invited_users?: number[];
  received_gifts_value?: number;
  latitude?: number;
  longitude?: number;
  camera_facing_mode?: FacingMode;
  voice_enabled?: boolean;
}

// This is the VIEW MODEL for the frontend, derived from LiveStreamRecord
export interface Stream {
  id: number;
  userId: number;
  titulo: string;
  nomeStreamer: string;
  thumbnailUrl?: string;
  espectadores: number;
  categoria: Category;
  aoVivo: boolean;
  emPK: boolean;
  isPrivate: boolean;
  entryFee: number | null;
  meta: string | null;
  inicio: string;
  permitePk: boolean;
  isParty?: boolean;
  cameraFacingMode?: FacingMode;
  voiceEnabled?: boolean;
}

// Listener function type for real-time stream updates.
export type StreamUpdateListener = (streams: Stream[]) => void;
export type MuteStatusListener = (update: { liveId: number; userId: number; isMuted: boolean; mutedUntil?: string }) => void;
export type UserKickedListener = (update: { liveId: number; kickedUserId: number }) => void;
export type SoundEffectListener = (update: { liveId: number; effectName: SoundEffectName; triggeredBy: number; }) => void;

export interface PkBattleStreamer {
  userId: number;
  streamId: number;
  name: string;
  score: number;
  avatarUrl: string;
  isVerified: boolean;
}

export interface PkBattle {
  id: number;
  title: string;
  streamer1: PkBattleStreamer;
  streamer2: PkBattleStreamer;
}

export interface ConvitePK {
  id: string;
  remetente_id: number;
  destinatario_id: number;
  status: 'pendente' | 'aceito' | 'recusado' | 'expirado' | 'cancelado';
  data_envio: string;
  data_expiracao: string;
  batalha_id?: number;
}

export interface PkInvitation extends ConvitePK {
    inviterName: string;
    inviterAvatarUrl: string;
}

export interface IncomingPrivateLiveInvite {
  stream: Stream;
  inviter: User;
  invitee: User;
}

export interface StartLiveResponse {
  live: Stream;
  urls: {
    rtmp: string;
    hls: string;
    webrtc: string;
    streamKey: string;
  };
}

export interface LiveDetails {
  streamerName: string;
  streamerAvatarUrl: string;
  streamerFollowers: number;
  viewerCount: number;
  totalVisitors: number;
  receivedGiftsValue: number;
  rankingPosition: string;
  status: 'ao vivo' | 'finalizada' | 'pausada';
  likeCount?: number;
  title?: string;
  meta?: string;
}

export interface LiveEndSummary {
  streamerId: number;
  streamerName: string;
  streamerAvatarUrl: string;
  durationSeconds: number;
  peakViewers: number;
  totalEarnings: number;
  newFollowers: number;
  newMembers: number;
  newFans: number;
}

// Chat & Message types
export interface TabelaConversa {
  id: string;
  participantes: number[];
  ultima_mensagem_texto: string;
  ultima_mensagem_timestamp: string;
  titulo_conversa?: string;
  avatar_conversa?: string;
}

export interface TabelaMensagem {
  id: string;
  conversa_id: string;
  remetente_id: number;
  conteudo: string;
  timestamp: string;
  tipo_conteudo: 'texto';
  status_leitura: { [userId: number]: boolean };
}

// This is a VIEW MODEL for the frontend. The API will construct this from the tables above.
export interface ConversationMessage {
  id: string; // From TabelaMensagem.id
  senderId: number; // From TabelaMensagem.remetente_id
  text: string; // From TabelaMensagem.conteudo
  timestamp: string; // From TabelaMensagem.timestamp
  status: 'sent' | 'seen';
  seenBy: number[]; // Derived from TabelaMensagem.status_leitura
}

// This is a VIEW MODEL for the frontend. The API will construct this from the tables above.
export interface Conversation {
  id: string; // From TabelaConversa.id
  participants: number[]; // From TabelaConversa.participantes
  otherUserId: number; // Derived
  otherUserName: string; // Derived from Users table
  otherUserAvatarUrl: string; // Derived from Users table
  unreadCount: number; // Calculated
  messages: ConversationMessage[]; // Assembled from TabelaMensagem
}

export interface ChatMessage {
  id: number;
  type: 'message' | 'entry' | 'gift' | 'special_entry' | 'levelup' | 'announcement';
  level?: number;
  username: string;
  userId: number;
  message: string;
  emojis?: string;
  color?: string;
  giftName?: string;
  giftValue?: number;
  giftAnimationUrl?: string;
  timestamp: string;
  badgeText?: string;
}

// Purchase and Wallet types
export interface Gift {
  id: number;
  name: string;
  price: number;
  valor_pontos: number;
  is_ativo: boolean;
  animationUrl: string;
}

export interface DiamondPackage {
  id: number;
  diamonds: number;
  price: number;
  currency: 'BRL';
}

export interface Address {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    postalCode: string;
}

export interface CardDetails {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
}

export interface PurchaseOrder {
    orderId: string;
    userId: number;
    package: DiamondPackage;
    address: Address;
    paymentDetails: {
        method: PaymentMethod;
        card?: CardDetails;
    };
    status: 'pending' | 'completed' | 'failed';
    timestamp: string;
}

export interface WithdrawalTransaction {
    id: string;
    userId: number;
    earnings_withdrawn: number;
    amount_brl: number;
    fee_brl: number;
    net_amount_brl: number;
    status: 'pending' | 'completed' | 'failed';
    timestamp: string;
    withdrawal_method: WithdrawalMethod;
}

export interface WithdrawalBalance {
    totalEarnings: number;
    pendingWithdrawals: number;
    availableBalance: number;
}

export interface LogPresenteEnviado {
    id: number;
    senderId: number;
    receiverId: number;
    liveId: number;
    giftId: number;
    giftValue: number;
    batalha_id?: number;
    timestamp: string;
}

export interface Viewer {
  id: number;
  name: string;
  avatarUrl: string;
  entryTime: string;
  contribution: number;
  level: number;
  level2: number;
}

export interface RankingContributor {
  rank: number;
  userId: number;
  name: string;
  avatarUrl: string;
  contribution: number;
  badgeIcon?: string;
  badgeNumber?: number;
  level: number;
  level2: number;
}

// New Universal Ranking Types
export interface UniversalRankingUser {
  rank: number | string;
  userId: number;
  avatarUrl: string;
  name: string;
  score: number;
  level: number;
  gender: Gender | null;
  badges: { type: 'flag' | 'v_badge' | 'gender' | 'level', value: string | number }[];
}

export interface UniversalRankingData {
  podium: UniversalRankingUser[];
  list: UniversalRankingUser[];
  currentUserRanking?: UniversalRankingUser;
  countdown?: string;
  footerButtons?: {
      primary: { text: string; value: string; };
      secondary: { text: string; value: string; };
  }
}


export interface Like {
  id: number;
  userId: number;
  liveId: number;
  timestamp: string;
}

// PK Event types
export interface PkLevelBadge {
  type: 'fire' | 'butterfly' | 'red-heart' | 'small-crown';
  level?: number;
}

export interface PkEventStreamer {
  userId: number;
  rank: number;
  name: string;
  avatarUrl: string;
  score: number;
  badges: PkLevelBadge[];
}

export interface PkEventDetails {
  totalPrize: number;
  endTime: string;
  streamerRanking: PkEventStreamer[];
  userRanking: {
    userId: number;
    rank: number;
    name: string;
    avatarUrl: string;
    score: number;
    level: number;
  }[];
}

export interface PkRankingData {
  totalPrize: number;
  currency: string;
  timeRemaining: string;
  streamerRanking: PkEventStreamer[];
  userRanking: { userId: number; rank: number; name: string; avatarUrl: string; score: number; level: number; }[];
}

// Other types
export interface ProtectorDetails {
  rank: number;
  userId: number;
  name: string;
  avatarUrl: string;
  protectionValue: number;
}

export interface InventoryItem {
    id: string;
    name: string;
    imageUrl: string;
    quantity: number;
    category: InventoryCategory;
    description: string;
    sub_type?: InventorySubType;
}

export interface AppEvent {
    id: string;
    title: string;
    description: string;
    bannerUrl: string;
    startTime: string;
    endTime: string;
    status: EventStatus;
    linkedCategory: Category | null;
}

export interface ArtigoAjuda {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: 'FAQ' | 'Artigos Úteis';
  ordem_exibicao: number;
  visualizacoes: number;
  is_ativo: boolean;
}

export interface CanalContato {
  id: string;
  nome: string;
  tipo: 'link_externo' | 'chat_interno' | 'email';
  destino: string;
  icone: 'headset' | 'envelope' | 'whatsapp';
  is_ativo: boolean;
  horario_funcionamento?: string;
}


export interface DailyReward {
    day: number;
    type: 'diamonds' | 'item';
    name: string;
    imageUrl: string;
    amount?: number;
    itemId?: string;
}

export interface UserRewardStatus {
    lastClaimedDay: number;
    streak: number;
    lastClaimTimestamp: string;
}

export interface VersionInfo {
    minVersion: string;
    latestVersion: string;
    updateUrl: string;
}

export interface ApiLogEntry {
    id: number;
    timestamp: string;
    title: string;
    data: object;
}

export interface SendGiftResponse {
    success: boolean;
    updatedUser: User | null;
    message: string;
}

export interface UserLevelInfo {
    currentLevel: number;
    currentXp: number;
    xpForNextLevel: number;
}

export interface GeneralRankingStreamer {
    rank: number;
    userId: number;
    username: string;
    avatarUrl: string;
    level: number;
    followers: number;
}

export interface GeneralRankingUser {
    rank: number;
    userId: number;
    username: string;
    avatarUrl: string;
    level: number;
    xp: number;
}

export interface LiveFollowUpdate {
    userId: number;
    isLive: boolean;
    stream: Stream | null;
}

export interface PrivateLiveInviteSettings {
    userId: number;
    privateInvites: boolean;
    onlyFollowing: boolean;
    onlyFans: boolean;
    onlyFriends: boolean;
}

export interface NotificationSettings {
    userId: number;
    newMessages: boolean;
    streamerLive: boolean;
    followedPost: boolean;
    order: boolean;
    interactive: boolean;
}

export interface PkSettings {
  userId: number;
  durationSeconds: number;
}

export interface SoundEffectLogEntry {
    id: number;
    liveId: number;
    effectName: SoundEffectName;
    triggeredBy: number;
    timestamp: string;
}

export interface TabelaUsuario {
  id: number;
  nome_completo: string;
  email: string;
  senha_hash: string;
  avatar_url?: string;
  provedor_login: 'google' | 'facebook' | 'email';
  id_provedor?: string | null;
  data_criacao: string;
  ultimo_login: string;
  is_streamer: boolean;
}

export interface LiveCategory {
  id: string;
  name: Category;
  slug: string;
}

export interface BatalhaPK {
  id: number;
  live_id_1: number;
  live_id_2: number;
  streamer_id_1: number;
  streamer_id_2: number;
  pontos_streamer_1: number;
  pontos_streamer_2: number;
  vencedor_id: number | null;
  data_inicio: string;
  data_fim: string | null;
  status: 'ativa' | 'finalizada';
  data_comemoracao_fim: string | null;
  top_supporters_1: RankingContributor[];
  top_supporters_2: RankingContributor[];
}

export interface Denuncia {
  id: string;
  usuario_denunciante_id: number;
  usuario_denunciado_id: string;
  motivo_denuncia: string;
  comentarios: string;
  contexto_id?: string | null;
  status_revisao: 'Pendente' | 'Analisando' | 'Resolvida';
  data_denuncia: string;
  acao_tomada?: string | null;
}

export interface Sugestao {
  id: string;
  usuario_id: number;
  texto_sugestao: string;
  status_revisao: 'Recebida' | 'Em análise' | 'Implementada';
  data_sugestao: string;
}

export interface ConfiguracaoNivel {
  nivel: number;
  xp_necessario_total: number;
  recompensa_id: string;
  recompensa_descricao: string;
  icone_url: string;
}

export interface SeguidorRelacionamento {
  seguidor_id: number;
  streamer_id: number;
  data_seguindo: string;
}

export interface VisitaPerfil {
  id: string;
  visitante_id: number;
  perfil_visitado_id: number;
  data_visita: string;
}

export interface FilaPK {
  streamer_id: number;
  data_entrada: string;
  status: 'aguardando' | 'em_pareamento';
}