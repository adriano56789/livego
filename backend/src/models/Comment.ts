import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
    id: string;
    userId: string;
    targetId: string; // ID do alvo (mensagem, chat, stream, etc.)
    targetType: 'message' | 'chat' | 'stream' | 'photo' | 'video' | 'profile';
    content: string;
    parentId?: string; // Para respostas aninhadas
    likes: number;
    isLiked?: boolean; // Para o usuário atual
    isActive: boolean;
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    targetId: { type: String, required: true }, // ID do conteúdo sendo comentado
    targetType: { 
        type: String, 
        required: true, 
        enum: ['message', 'chat', 'stream', 'photo', 'video', 'profile'] 
    },
    content: { type: String, required: true, maxlength: 500, trim: true },
    parentId: { type: String, ref: 'Comment', default: null }, // Para threaded comments
    likes: { type: Number, default: 0, min: 0 },
    isLiked: { type: Boolean, default: false }, // Cache para o usuário atual
    isActive: { type: Boolean, default: true },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Índices para performance
CommentSchema.index({ targetId: 1, targetType: 1, createdAt: -1 }); // Comentários por alvo
CommentSchema.index({ userId: 1, createdAt: -1 }); // Comentários por usuário
CommentSchema.index({ parentId: 1, createdAt: -1 }); // Respostas aninhadas
CommentSchema.index({ isActive: 1 });
CommentSchema.index({ createdAt: -1 }); // Para timeline global

// Virtual para respostas
CommentSchema.virtual('replies', {
    ref: 'Comment',
    localField: 'id',
    foreignField: 'parentId',
    options: { sort: { createdAt: 1 } }
});

// Middleware para atualizar updatedAt
CommentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    if (this.isModified('content') && !this.isNew) {
        this.isEdited = true;
        this.editedAt = new Date();
    }
    next();
});

// Método para adicionar/remover like
CommentSchema.methods.toggleLike = function(userId: string) {
    // Em uma implementação real, isso gerenciaria uma coleção de likes
    // Por agora, apenas incrementa/decrementa o contador
    this.likes += this.isLiked ? -1 : 1;
    this.isLiked = !this.isLiked;
    return this.save();
};

// Transformação JSON para remover campos internos
CommentSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
