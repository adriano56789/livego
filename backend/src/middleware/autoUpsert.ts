import { Request, Response, NextFunction } from 'express';
import { createWithUpsert } from '../scripts/initDatabase';

/**
 * Middleware Global de Upsert Automático
 * Intercepta requisições e garante criação/atualização automática de documentos
 */
export function autoUpsertMiddleware(model: any, uniqueField: string, dataField: string = 'body') {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            
            // Se não há dados, continuar normalmente
            if (!data || typeof data !== 'object') {
                return next();
            }

            // Verificar se o campo único existe nos dados
            const uniqueValue = data[uniqueField];
            if (!uniqueValue) {
                return next();
            }

            // Aplicar upsert automático
            const result = await createWithUpsert(model, uniqueField, data);
            
            // Adicionar resultado à requisição para uso posterior
            req.autoUpsertResult = result;
            
            next();
        } catch (error) {
            console.error('❌ [AUTO UPSERT] Erro:', error);
            next(error);
        }
    };
}

/**
 * Estender interface Request para incluir resultado do upsert
 */
declare global {
    namespace Express {
        interface Request {
            autoUpsertResult?: any;
        }
    }
}

/**
 * Middleware específico para usuários
 */
export const userAutoUpsert = autoUpsertMiddleware(
    require('../models').User,
    'id'
);

/**
 * Middleware específico para streams
 */
export const streamAutoUpsert = autoUpsertMiddleware(
    require('../models').Streamer,
    'id'
);

/**
 * Middleware específico para transações de presentes
 */
export const giftTransactionAutoUpsert = autoUpsertMiddleware(
    require('../models').GiftTransaction,
    'id'
);

/**
 * Middleware específico para status de usuário
 */
export const userStatusAutoUpsert = autoUpsertMiddleware(
    require('../models').UserStatus,
    'user_id'
);

/**
 * Middleware específico para visitantes
 */
export const visitorAutoUpsert = autoUpsertMiddleware(
    require('../models').Visitor,
    'id'
);

/**
 * Middleware específico para conversas
 */
export const conversationAutoUpsert = autoUpsertMiddleware(
    require('../models').Conversation,
    'id'
);

/**
 * Função utilitária para aplicar upsert automático em qualquer operação
 */
export async function applyAutoUpsert(
    model: any,
    uniqueField: string,
    data: any,
    additionalData: any = {}
) {
    const mergedData = { ...data, ...additionalData };
    return await createWithUpsert(model, uniqueField, mergedData);
}

/**
 * Wrapper para rotas que garantem upsert automático
 */
export function withAutoUpsertRoute(
    model: any,
    uniqueField: string,
    handler: (req: Request, res: Response, upsertResult: any) => Promise<void>
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            
            if (!data || !data[uniqueField]) {
                return handler(req, res, null);
            }

            const upsertResult = await createWithUpsert(model, uniqueField, data);
            await handler(req, res, upsertResult);
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware para garantir criação automática de documentos relacionados
 */
export function ensureRelatedDocuments(req: Request, res: Response, next: NextFunction) {
    const { userId, streamId } = req.body;
    
    // Lista de verificações automáticas
    const autoChecks = [];
    
    if (userId) {
        autoChecks.push(
            // Garantir que UserStatus exista
            require('../models').UserStatus.findOneAndUpdate(
                { user_id: userId },
                { user_id: userId, is_online: false, last_seen: new Date() },
                { upsert: true, new: true }
            )
        );
    }
    
    if (streamId) {
        autoChecks.push(
            // Garantir que Stream exista
            require('../models').Streamer.findOneAndUpdate(
                { id: streamId },
                { 
                    id: streamId,
                    isLive: false,
                    streamStatus: 'ended',
                    viewers: 0,
                    diamonds: 0
                },
                { upsert: true, new: true }
            )
        );
    }
    
    // Executar verificações em paralelo
    Promise.all(autoChecks)
        .then(() => next())
        .catch(next);
}

export default {
    autoUpsertMiddleware,
    userAutoUpsert,
    streamAutoUpsert,
    giftTransactionAutoUpsert,
    userStatusAutoUpsert,
    visitorAutoUpsert,
    conversationAutoUpsert,
    applyAutoUpsert,
    withAutoUpsertRoute,
    ensureRelatedDocuments
};
