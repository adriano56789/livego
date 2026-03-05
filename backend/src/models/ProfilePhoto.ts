import mongoose, { Document, Schema } from 'mongoose';

export interface IProfilePhoto extends Document {
    id: string;
    userId: string;
    photoUrl: string;
    photoType: 'avatar' | 'cover' | 'gallery';
    isActive: boolean;
    isMain: boolean; // Se é a foto principal do avatar
    order: number; // Ordem na galeria
    metadata?: {
        originalName: string;
        size: number;
        mimeType: string;
        width?: number;
        height?: number;
        uploadedAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

const ProfilePhotoSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    photoUrl: { type: String, required: true, trim: true },
    photoType: { 
        type: String, 
        required: true, 
        enum: ['avatar', 'cover', 'gallery'],
        default: 'avatar'
    },
    isActive: { type: Boolean, default: true },
    isMain: { type: Boolean, default: false }, // Para identificar o avatar principal
    order: { type: Number, default: 0 }, // Para ordenar na galeria
    metadata: {
        originalName: { type: String },
        size: { type: Number },
        mimeType: { type: String },
        width: { type: Number },
        height: { type: Number },
        uploadedAt: { type: Date, default: Date.now }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Índices para performance
ProfilePhotoSchema.index({ userId: 1, photoType: 1, isActive: 1 }); // Fotos por usuário e tipo
ProfilePhotoSchema.index({ userId: 1, isMain: 1, isActive: 1 }); // Avatar principal
ProfilePhotoSchema.index({ userId: 1, order: 1, isActive: 1 }); // Galeria ordenada
ProfilePhotoSchema.index({ isActive: 1 });
ProfilePhotoSchema.index({ createdAt: -1 });

// Middleware para garantir que só tenha um avatar principal por usuário
ProfilePhotoSchema.pre('save', async function(next) {
    if (this.isMain && this.isNew) {
        // Se esta foto é marcada como principal, desmarcar outras
        await ProfilePhoto.updateMany(
            { userId: this.userId, photoType: 'avatar', isMain: true, isActive: true },
            { isMain: false }
        );
    }
    next();
});

// Método para definir como avatar principal
ProfilePhotoSchema.methods.setAsMain = async function() {
    // Desmarcar outros avatares principais
    await ProfilePhoto.updateMany(
        { userId: this.userId, photoType: 'avatar', isMain: true, isActive: true },
        { isMain: false }
    );
    
    // Marcar este como principal
    this.isMain = true;
    return this.save();
};

// Método para obter avatar principal do usuário
ProfilePhotoSchema.statics.getMainAvatar = function(userId: string) {
    return this.findOne({ 
        userId, 
        photoType: 'avatar', 
        isMain: true, 
        isActive: true 
    });
};

// Método para obter galeria do usuário
ProfilePhotoSchema.statics.getUserGallery = function(userId: string) {
    return this.find({ 
        userId, 
        photoType: 'gallery', 
        isActive: true 
    }).sort({ order: 1, createdAt: -1 });
};

// Método para obter capa do usuário
ProfilePhotoSchema.statics.getUserCover = function(userId: string) {
    return this.findOne({ 
        userId, 
        photoType: 'cover', 
        isActive: true 
    });
};

// Transformação JSON para remover campos internos
ProfilePhotoSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const ProfilePhoto = mongoose.model<IProfilePhoto>('ProfilePhoto', ProfilePhotoSchema);
