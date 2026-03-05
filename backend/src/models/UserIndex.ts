import mongoose, { Document, Schema } from 'mongoose';

export interface UserIndex extends Document {
    id: string;
    userId: string;
    identification: string;
    name: string;
    displayName: string;
    avatarUrl: string;
    isFriend?: boolean;
    searchTerms: string[];
    isActive: boolean;
    lastUpdated: Date;
}

const UserIndexSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, unique: true, ref: 'User' },
    identification: { type: String, required: true },
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    isFriend: { type: Boolean },
    searchTerms: [{ type: String }], // Para busca mais eficiente
    isActive: { type: Boolean, required: true, default: true },
    lastUpdated: { type: Date, required: true, default: Date.now }
});

// Índices para performance de busca
UserIndexSchema.index({ userId: 1 }, { unique: true });
UserIndexSchema.index({ name: 1 });
UserIndexSchema.index({ displayName: 1 });
UserIndexSchema.index({ searchTerms: 1 }); // Para busca por partes do nome
UserIndexSchema.index({ isActive: 1 });

// Middleware para gerar searchTerms automaticamente
UserIndexSchema.pre('save', function(next) {
    const user = this as any; // Usar any para evitar problemas de tipo
    
    // Criar termos de busca a partir do nome
    const name = (user.name || '').toLowerCase();
    const displayName = (user.displayName || '').toLowerCase();
    
    // Adicionar nome completo, display name e partes do nome
    user.searchTerms = [
        name,
        displayName,
        ...name.split(' '),
        ...displayName.split(' ')
    ].filter((term: string, index: number, arr: string[]) => arr.indexOf(term) === index); // Remover duplicatas
    
    user.lastUpdated = new Date();
    next();
});

UserIndexSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret._id;
        delete (ret as any).__v;
        delete ret.searchTerms; // Não expor os termos de busca
        return ret;
    }
});

export const UserIndex = mongoose.model<UserIndex>('UserIndex', UserIndexSchema);
