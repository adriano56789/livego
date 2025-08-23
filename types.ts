

// Basic types
export type AppView = 'login' | 'upload' | 'edit' | 'feed' | 'profile' | 'go-live-setup' | 'messages' | 'diamond-purchase' | 'video' | 'protectors' | 'blocked-list' | 'withdrawal' | 'withdrawal-method-setup' | 'withdrawal-confirmation' | 'customer-service' | 'backpack' | 'help-article' | 'live-support-chat' | 'report-and-suggestion' | 'event-center' | 'event-detail' | 'settings' | 'copyright' | 'earnings-info' | 'connected-accounts' | 'search' | 'app-version' | 'live-ended' | 'my-level' | 'developer-tools' | 'ranking' | 'documentation' | 'purchase-history' | 'notification-settings' | 'push-settings' | 'private-live-invite-settings' | 'following' | 'visitors' | 'live-stream-viewer' | 'chat' | 'purchase-confirmation' | 'ranking-list' | 'profile-editor' | 'fans' | 'avatar-protection' | 'friend-requests' | 'privacy-settings';
export type Gender = 'male' | 'female';
export type Category = 'Popular' | 'Seguindo' | 'Perto' | 'Atualizado' | 'Privada' | 'PK' | 'Novo' | 'Música' | 'Dança';
export type CameraStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error' | 'not-found' | 'in-use' | 'insecure' | 'timeout';
export type EventStatus = 'ongoing' | 'upcoming' | 'past';
export type InventoryCategory = 'gift' | 'decoration';
export type InventorySubType = 'profile_frame' | 'entry_effect';
export type PaymentMethod = 'transfer' | 'card';
export type FacingMode = 'user' | 'environment';
export type SoundEffectName = 'riso' | 'aplausos' | 'animar' | 'beijar' | 'estranho' | 'resposta_errada' | 'sorriso' | 'gift';
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | null;
export type UserListRankingPeriod = 'daily' | 'weekly' | 'total';

export interface SelectableOption {
  id: string;
  label: string;
}

export interface Region {
  name: string;
  code: string;
}

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
  photo_gallery?: string[];
  nickname: string | null;
  gender: Gender | null;
  birthday: string | null;
  age: number | null;
  has_uploaded_real_photo: boolean;
  has_completed_profile: boolean;
  is_avatar_protected?: boolean;
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
  country: string | null;
  personalSignature?: string;
  personalityTags?: { id: string, label: string }[];
  achievements?: string[];
  coHostHistory?: string;
  profession: string | null;
  languages: string[] | null;
  height: number | null;
  weight: number | null;
  emotionalState: string | null;
  latitude?: number;
  longitude?: number;
  pk_enabled_preference?: boolean;
  last_visit_date?: string;
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
  is_avatar_protected?: boolean;
  privacy?: { protectionEnabled?: boolean };
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
  like_count?: number;
  country_code?: string;
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
  emPk: boolean;
  isPrivate: boolean;
  entryFee: number | null;
  meta: string | null;
  inicio: string;
  permitePk: boolean;
  isParty?: boolean;
  cameraFacingMode?: FacingMode;
  voiceEnabled?: boolean;
  countryCode?: string;
}

// Listener function type for real-time stream updates.
export type StreamUpdateListener = (streams: Stream[]) => void;

export interface MuteStatusUpdate {
  liveId: number;
  userId: number;
  isMuted: boolean;
  mutedUntil?: string;
}
export type MuteStatusListener = (update: MuteStatusUpdate) => void;

export interface UserKickedUpdate {
  liveId: number;
  kickedUserId: number;
}
export type UserKickedListener = (update: UserKickedUpdate) => void;

export interface SoundEffectUpdate {
  liveId: number;
  effectName: SoundEffectName;
  triggeredBy: number;
}
export type SoundEffectListener = (update: SoundEffectUpdate) => void;

export interface PkBattleStreamer {
  userId: number;
  streamId: number;
  name: string;
  score: number;
  avatarUrl: string;
  isVerified: boolean;
  winMultiplier?: number;
  status?: 'win' | 'lose';
  countryCode?: string;
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
  streamerIsAvatarProtected?: boolean;
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
  conteudo: string; // Can be text or an image URL
  timestamp: string;
  tipo_conteudo: 'texto' | 'imagem' | 'sistema'; // Expanded type
  status_leitura: { [userId: number]: boolean };
}

// This is a VIEW MODEL for the frontend. The API will construct this from the tables above.
export interface ConversationMessage {
  id: string;
  senderId: number;
  type: 'text' | 'image' | 'system';
  text: string | null;
  imageUrl: string | null;
  timestamp: string;
  status: 'sent' | 'seen';
  seenBy: number[];
}

// This is a VIEW MODEL for the frontend. The API will construct this from the tables above.
export interface Conversation {
  id: string; // From TabelaConversa.id
  type?: 'chat' | 'friend_requests_summary';
  participants: number[]; // From TabelaConversa.participantes
  otherUserId: number; // Derived
  otherUserName: string; // Derived from Users table
  otherUserAvatarUrl: string; // Derived from Users table
  unreadCount: number; // Calculated
  messages: ConversationMessage[]; // Assembled from TabelaMensagem
}

export interface ChatMessage {
  id: number;
  type: 'message' | 'entry' | 'gift' | 'special_entry' | 'levelup' | 'announcement' | 'image';
  level?: number;
  username: string;
  userId: number;
  message: string;
  imageUrl?: string;
  emojis?: string;
  color?: string;
  // Gift-specific properties
  giftId?: number; // For combo detection
  giftName?: string;
  giftValue?: number;
  giftAnimationUrl?: string;
  giftImageUrl?: string; // Static image for chat
  recipientName?: string; // Who received the gift
  //
  timestamp: string;
  badgeText?: string;
  avatarUrl?: string;
  age?: number;
  gender?: Gender | null;
}

// Purchase and Wallet types
export interface Gift {
  id: number;
  name: string;
  price: number;
  valor_pontos: number;
  is_ativo: boolean;
  animationUrl: string;
  imageUrl: string;
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
    acceptOnlyFriendPkInvites?: boolean;
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

export interface TabelaBatalhaPK {
  id: string | number;
  streamer_A_id: number;
  streamer_B_id: number;
  pontuacao_A: number;
  pontuacao_B: number;
  multiplicador_A?: number;
  multiplicador_B?: number;
  status: 'ativa' | 'finalizada' | 'cancelada';
  resultado?: 'vitoria_A' | 'vitoria_B' | 'empate' | null;
  data_inicio: string;
  data_fim: string;
  duracao_segundos: number;
  liga?: string;
  tipo_batalha?: 'convite_direto' | 'matchmaking';
  data_comemoracao_fim?: string | null; // Custom field for frontend logic
  vencedor_id?: number | null; // Custom field for frontend logic
  round_number?: number;
  next_battle_id?: number | string;
}

export interface TabelaRankingApoiadores {
  id: number;
  batalha_id: string | number;
  streamer_id: number;
  apoiador_id: number;
  total_pontos_enviados: number;
  posicao_ranking: number;
  avatar_url?: string;
}

export interface PkBattleState extends TabelaBatalhaPK {
  streamer_A: User & { streamId: number; winMultiplier?: number; status?: 'win' | 'lose'; };
  streamer_B: User & { streamId: number; winMultiplier?: number; status?: 'win' | 'lose'; };
  top_supporters_A: TabelaRankingApoiadores[];
  top_supporters_B: TabelaRankingApoiadores[];
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

export interface UserBlockedUpdate {
    blockerId: number;
    targetId: number;
}
export type UserBlockedListener = (data: UserBlockedUpdate) => void;

export interface UserUnblockedUpdate {
    unblockerId: number;
    targetId: number;
}
export type UserUnblockedListener = (data: UserUnblockedUpdate) => void;

export interface PrivacySettings {
  userId: number;
  showLocation: boolean;
  showActiveStatus: boolean;
  showInNearby: boolean;
  protectionEnabled: boolean;
}
