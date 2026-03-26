import mongoose from 'mongoose';

const StreamLikeSchema = new mongoose.Schema({
    streamId: {
        type: String,
        required: true,
        ref: 'Streamer'
    },
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    timestamp: {
        type: String,
        default: () => new Date().toISOString()
    }
});

// Índices para performance
StreamLikeSchema.index({ streamId: 1, userId: 1 }, { unique: true }); // Evitar likes duplicados por usuário na mesma stream
StreamLikeSchema.index({ streamId: 1 }); // Para buscar todos os likes de uma stream
StreamLikeSchema.index({ userId: 1 }); // Para buscar todos os likes de um usuário

export default mongoose.model('StreamLike', StreamLikeSchema);
