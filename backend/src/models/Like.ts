import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    photoId: {
        type: String,
        required: true,
        ref: 'Photo'
    },
    timestamp: {
        type: String,
        default: () => new Date().toISOString()
    }
});

// Índices para performance
LikeSchema.index({ userId: 1, photoId: 1 }, { unique: true }); // Evitar likes duplicados
LikeSchema.index({ photoId: 1 }); // Para buscar todos os likes de uma foto
LikeSchema.index({ userId: 1 }); // Para buscar todos os likes de um usuário

export default mongoose.model('Like', LikeSchema);
