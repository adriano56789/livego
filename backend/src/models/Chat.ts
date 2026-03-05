import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
    id: string;
    participants: string[]; // IDs dos participantes
    type: 'private' | 'group' | 'stream';
    title?: string; // Para chats em grupo
    lastMessage?: {
        content: string;
        senderId: string;
        timestamp: Date;
        messageType: 'text' | 'image' | 'gift' | 'system';
    };
    isActive: boolean;
    metadata?: {
        streamId?: string; // Para chats de stream
        groupId?: string; // Para grupos
        isPinned?: boolean; // Chat fixado
        isMuted?: boolean; // Chat silenciado
    };
    createdAt: Date;
    updatedAt: Date;
}

const ChatSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    participants: [{ type: String, required: true, ref: 'User' }],
    type: { 
        type: String, 
        required: true, 
        enum: ['private', 'group', 'stream'],
        default: 'private'
    },
    title: { type: String, trim: true, maxlength: 100 },
    lastMessage: {
        content: { type: String, default: '' },
        senderId: { type: String },
        timestamp: { type: Date },
        messageType: { type: String, enum: ['text', 'image', 'gift', 'system'], default: 'text' }
    },
    isActive: { type: Boolean, default: true },
    metadata: {
        streamId: { type: String },
        groupId: { type: String },
        isPinned: { type: Boolean, default: false },
        isMuted: { type: Boolean, default: false }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Índices para performance
ChatSchema.index({ participants: 1, isActive: 1 }); // Chats por usuário
ChatSchema.index({ 'lastMessage.timestamp': -1 }); // Chats recentes primeiro
ChatSchema.index({ type: 1, isActive: 1 }); // Por tipo
ChatSchema.index({ isActive: 1 });
ChatSchema.index({ updatedAt: -1 });

// Middleware para atualizar updatedAt
ChatSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Método estático para encontrar chats de um usuário
ChatSchema.statics.findByUser = function(userId: string) {
    return this.find({ 
        participants: userId, 
        isActive: true 
    }).sort({ 'lastMessage.timestamp': -1 });
};

// Método estático para encontrar chat privado entre dois usuários
ChatSchema.statics.findPrivateChat = function(userId1: string, userId2: string) {
    return this.findOne({ 
        participants: { $all: [userId1, userId2] }, 
        type: 'private',
        isActive: true 
    });
};

// Método para verificar se usuário participa do chat
ChatSchema.methods.hasParticipant = function(userId: string) {
    return this.participants.includes(userId);
};

// Método para adicionar participante
ChatSchema.methods.addParticipant = function(userId: string) {
    if (!this.participants.includes(userId)) {
        this.participants.push(userId);
    }
    return this.save();
};

// Transformação JSON
ChatSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);
