import mongoose from 'mongoose';
import { 
    User, 
    Streamer, 
    Gift, 
    GiftTransaction, 
    StreamHistory, 
    ShopItem,
    ChatMessage,
    Conversation,
    UserStatus,
    Visitor
} from '../models';

/**
 * Script de Inicialização Automática do Banco de Dados
 * Garante que todas as coleções essenciais sejam criadas automaticamente
 * com documentos iniciais usando upsert para evitar duplicação
 */
export async function initializeDatabase() {
    console.log('🚀 [INIT] Inicializando banco de dados automático...');

    try {
        // 1. Criar gifts essenciais se não existirem
        const essentialGifts = [
            {
                id: 'gift_rose',
                name: 'Rosa',
                price: 1,
                icon: '🌹',
                category: 'Popular' as const,
                triggersAutoFollow: false
            },
            {
                id: 'gift_heart',
                name: 'Coração',
                price: 5,
                icon: '❤️',
                category: 'Popular' as const,
                triggersAutoFollow: false
            },
            {
                id: 'gift_diamond',
                name: 'Diamante',
                price: 20,
                icon: '💎',
                category: 'Luxo' as const,
                triggersAutoFollow: true
            },
            {
                id: 'gift_crown',
                name: 'Coroa',
                price: 100,
                icon: '👑',
                category: 'VIP' as const,
                triggersAutoFollow: true
            }
        ];

        for (const gift of essentialGifts) {
            await Gift.findOneAndUpdate(
                { id: gift.id },
                gift,
                { upsert: true, new: true }
            );
        }
        console.log('✅ [INIT] Gifts essenciais criados/atualizados');

        // 2. Criar itens da loja essenciais se não existirem
        const essentialShopItems = [
            {
                id: 'item_backpack_basic',
                name: 'Mochila Básica',
                category: 'mochila' as const,
                price: 50,
                duration: 30,
                description: 'Mochila estilosa para seu avatar',
                icon: '🎒',
                image: '/images/items/backpack_basic.png',
                isActive: true
            },
            {
                id: 'item_frame_gold',
                name: 'Frame Dourado',
                category: 'quadro' as const,
                price: 100,
                duration: 7,
                description: 'Frame dourado premium para seu perfil',
                icon: '🖼️',
                image: '/images/items/frame_gold.png',
                isActive: true
            }
        ];

        for (const item of essentialShopItems) {
            await ShopItem.findOneAndUpdate(
                { id: item.id },
                item,
                { upsert: true, new: true }
            );
        }
        console.log('✅ [INIT] Itens da loja criados/atualizados');

        // 3. Criar usuário de suporte automático se não existir
        await User.findOneAndUpdate(
            { id: 'support-livercore' },
            {
                id: 'support-livercore',
                name: 'Support',
                avatarUrl: '',
                diamonds: 0,
                level: 1,
                xp: 0,
                fans: 0,
                following: 0,
                isOnline: true,
                lastSeen: new Date().toISOString()
            },
            { upsert: true, new: true }
        );
        console.log('✅ [INIT] Usuário de suporte criado/atualizado');

        // 4. Verificar índices essenciais
        await ensureIndexes();
        console.log('✅ [INIT] Índices verificados/criados');

        console.log('🎉 [INIT] Banco de dados inicializado com sucesso!');
        return true;

    } catch (error: any) {
        console.error('❌ [INIT] Erro ao inicializar banco:', error);
        throw error;
    }
}

/**
 * Garante que todos os índices essenciais existam
 */
async function ensureIndexes() {
    // Índices de performance para User
    await User.createIndexes();
    
    // Índices de performance para Streamer
    await Streamer.createIndexes();
    
    // Índices de performance para GiftTransaction
    await GiftTransaction.createIndexes();
    
    // Índices de performance para StreamHistory
    await StreamHistory.createIndexes();
    
    // Índices de performance para ChatMessage
    await ChatMessage.createIndexes();
    
    // Índices de performance para Conversation
    await Conversation.createIndexes();
    
    // Índices de performance para UserStatus
    await UserStatus.createIndexes();
    
    // Índices de performance para Visitor
    await Visitor.createIndexes();
}

/**
 * Função para criar documento automaticamente com upsert
 * Pode ser usada em qualquer rota para garantir criação automática
 */
export async function createWithUpsert<T>(
    model: any,
    uniqueField: string,
    data: Partial<T>
): Promise<T> {
    const filter = { [uniqueField]: data[uniqueField as keyof T] };
    
    // Primeiro tenta encontrar o documento
    const existing = await model.findOne(filter);
    
    if (existing) {
        // Se existe, atualiza
        const result = await model.findOneAndUpdate(
            filter,
            { $set: data },
            { new: true }
        );
        return result;
    } else {
        // Se não existe, cria
        const result = await model.create(data);
        return result;
    }
}

/**
 * Middleware para garantir upsert automático em operações CRUD
 */
export function withAutoUpsert(model: any, uniqueField: string) {
    return async (data: any) => {
        return await createWithUpsert(model, uniqueField, data);
    };
}

// Exportar utilidades
export default {
    initializeDatabase,
    createWithUpsert,
    withAutoUpsert,
    ensureIndexes
};
