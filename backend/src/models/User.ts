import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    id: string; // we will use string id to match frontend
    email?: string;
    password?: string;
    token?: string;
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
    followingList: string[]; // Array de IDs de usuários que segue
    followersList: string[]; // Array de IDs de usuários que seguem este usuário
    blockedUsers: string[]; // Array de IDs de usuários bloqueados
    friendsList: string[]; // Array de IDs de amigos
    messages: any[]; // Array de mensagens do usuário
    notifications: any[]; // Array de notificações do usuário  
    visitors: any[]; // Array de visitantes do perfil
    receptores: number;
    enviados: number;
    topFansAvatars?: string[];
    isLive?: boolean;
    isFollowed?: boolean;
    isOnline?: boolean;
    lastSeen?: string;
    currentStreamId?: string; // Stream atual do usuário
    diamonds: number;
    earnings: number;
    earnings_withdrawn: number;
    diamonds_purchased: number;
    withdrawal_method?: { method: string; details: any };
    bio?: string;
    obras?: any[];
    curtidas?: any[];
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
    ownedFrames: { frameId: string; expirationDate: string }[];
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
    withdrawal_requests?: Array<{
        external_reference: string;
        mp_payment_id?: string;
        amount: number;
        net_amount?: number;
        fee_amount?: number;
        status: 'pending' | 'approved' | 'rejected' | 'cancelled';
        created_at: string;
        approved_at?: string;
        description: string;
    }>;
    frameExpiration?: string | null;
    geoLocation?: {
        type: 'Point';
        coordinates: number[];
    };
    createdAt?: Date; // Timestamp automático do MongoDB
    updatedAt?: Date; // Timestamp automático do MongoDB
}

const UserSchema = new Schema<IUser>({
    id: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    token: { type: String },
    identification: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    coverUrl: { type: String },
    photos: [{ type: String }],
    country: { type: String },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'not_specified'] },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    rank: { type: Number },
    location: { type: String },
    distance: { type: String },
    fans: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    followingList: [{ type: String, default: [] }], // Array de IDs de usuários que segue
    followersList: [{ type: String, default: [] }], // Array de IDs de usuários que seguem este usuário
    blockedUsers: [{ type: String, default: [] }], // Array de IDs de usuários bloqueados
    friendsList: [{ type: String, default: [] }], // Array de IDs de amigos
    messages: [{ type: Schema.Types.Mixed, default: [] }], // Array de mensagens do usuário
    notifications: [{ type: Schema.Types.Mixed, default: [] }], // Array de notificações do usuário
    visitors: [{ type: Schema.Types.Mixed, default: [] }], // Array de visitantes do perfil
    receptores: { type: Number, default: 0 },
    enviados: { type: Number, default: 0 },
    topFansAvatars: [{ type: String }],
    isLive: { type: Boolean, default: false },
    isFollowed: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: String },
    currentStreamId: { type: String },
    diamonds: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    earnings_withdrawn: { type: Number, default: 0 },
    diamonds_purchased: { type: Number, default: 0 },
    withdrawal_method: { type: Schema.Types.Mixed },
    bio: { type: String },
    obras: [{ type: Schema.Types.Mixed }],
    curtidas: [{ type: Schema.Types.Mixed }],
    birthday: { type: String },
    residence: { type: String },
    emotional_status: { type: String },
    tags: { type: String },
    profession: { type: String },
    isVIP: { type: Boolean, default: false },
    vipSubscriptionDate: { type: String },
    vipExpirationDate: { type: String },
    isAvatarProtected: { type: Boolean, default: false },
    activeFrameId: { type: String, default: null },
    ownedFrames: [{
        frameId: { type: String },
        expirationDate: { type: String }
    }],
    chatPermission: { type: String, enum: ['all', 'followers', 'none'], default: 'all' },
    pipEnabled: { type: Boolean, default: true },
    locationPermission: { type: String, enum: ['granted', 'denied', 'prompt'], default: 'prompt' },
    showActivityStatus: { type: Boolean, default: true },
    showLocation: { type: Boolean, default: true },
    privateStreamSettings: {
        privateInvite: { type: Boolean, default: false },
        followersOnly: { type: Boolean, default: false },
        fansOnly: { type: Boolean, default: false },
        friendsOnly: { type: Boolean, default: false }
    },
    platformEarnings: { type: Number, default: 0 },
    adminWithdrawalMethod: {
        email: { type: String }
    },
    withdrawal_requests: [{
        external_reference: { type: String, required: true },
        mp_payment_id: { type: String },
        amount: { type: Number, required: true },
        net_amount: { type: Number },
        fee_amount: { type: Number },
        status: { 
            type: String, 
            enum: ['pending', 'approved', 'rejected', 'cancelled'], 
            default: 'pending' 
        },
        created_at: { type: String, required: true },
        approved_at: { type: String },
        description: { type: String, required: true }
    }],
    frameExpiration: { type: String, default: null },
    geoLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete (ret as any)._id;
            delete (ret as any).__v;
            return ret;
        }
    }
});

// Índice geoespacial para busca por proximidade
UserSchema.index({ geoLocation: '2dsphere' });

export const User = mongoose.model<IUser>('User', UserSchema);
