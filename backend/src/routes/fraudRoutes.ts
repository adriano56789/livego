import { Request, Response } from 'express';
import { BannedEntity } from '../models/BannedEntity';
import FraudDetectionMiddleware from '../middleware/fraudDetection';

export class FraudManagementRoutes {
    static setup(router: any) {
        // Banir entidade manualmente (admin)
        router.post('/ban/entity', async (req: Request, res: Response) => {
            try {
                const { entityType, entityId, reason, evidence, permanent } = req.body;
                
                if (!entityType || !entityId || !reason) {
                    return res.status(400).json({
                        error: 'Campos obrigatórios: entityType, entityId, reason'
                    });
                }

                const ban = await FraudDetectionMiddleware.banEntity(
                    entityType,
                    entityId,
                    reason,
                    evidence,
                    permanent !== false
                );

                res.json({
                    success: true,
                    ban: {
                        entityType: ban.entityType,
                        entityId: ban.entityId,
                        reason: ban.reason,
                        permanent: ban.permanent,
                        expiresAt: ban.expiresAt,
                        bannedAt: ban.bannedAt
                    }
                });

            } catch (error: any) {
                console.error('❌ [FRAUD ADMIN] Erro ao banir entidade:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Banir múltiplas entidades relacionadas (admin)
        router.post('/ban/related', async (req: Request, res: Response) => {
            try {
                const { ip, deviceFingerprint, userId, userEmail, reason, evidence } = req.body;
                
                if (!reason) {
                    return res.status(400).json({
                        error: 'Campo obrigatório: reason'
                    });
                }

                const bans = await FraudDetectionMiddleware.banRelatedEntities(
                    ip,
                    deviceFingerprint,
                    userId,
                    userEmail,
                    reason,
                    evidence
                );

                res.json({
                    success: true,
                    bansCount: bans.length,
                    bans: bans.map(ban => ({
                        entityType: ban.entityType,
                        entityId: ban.entityId,
                        reason: ban.reason,
                        permanent: ban.permanent,
                        expiresAt: ban.expiresAt
                    }))
                });

            } catch (error: any) {
                console.error('❌ [FRAUD ADMIN] Erro ao banir entidades relacionadas:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Listar entidades banidas (admin)
        router.get('/banned', async (req: Request, res: Response) => {
            try {
                const { entityType, active, page = 1, limit = 50 } = req.query;
                
                const filter: any = {};
                if (entityType) filter.entityType = entityType;
                if (active !== undefined) filter.active = active === 'true';

                const skip = (Number(page) - 1) * Number(limit);
                
                const bans = await BannedEntity.find(filter)
                    .sort({ bannedAt: -1 })
                    .skip(skip)
                    .limit(Number(limit));

                const total = await BannedEntity.countDocuments(filter);

                res.json({
                    success: true,
                    bans,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit))
                    }
                });

            } catch (error: any) {
                console.error('❌ [FRAUD ADMIN] Erro ao listar banimentos:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Desbanir entidade (admin)
        router.post('/unban/:entityType/:entityId', async (req: Request, res: Response) => {
            try {
                const { entityType, entityId } = req.params;
                
                const ban = await BannedEntity.findOneAndUpdate(
                    { entityType, entityId, active: true },
                    { active: false },
                    { new: true }
                );

                if (!ban) {
                    return res.status(404).json({
                        error: 'Banimento não encontrado ou já inativo'
                    });
                }

                console.log(`✅ [FRAUD ADMIN] Entidade desbanida: ${entityType}:${entityId}`);

                res.json({
                    success: true,
                    unbanned: {
                        entityType: ban.entityType,
                        entityId: ban.entityId,
                        reason: ban.reason,
                        bannedAt: ban.bannedAt,
                        unbannedAt: new Date()
                    }
                });

            } catch (error: any) {
                console.error('❌ [FRAUD ADMIN] Erro ao desbanir entidade:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Verificar se entidade está banida
        router.get('/check/:entityType/:entityId', async (req: Request, res: Response) => {
            try {
                const { entityType, entityId } = req.params;
                
                const ban = await BannedEntity.findOne({
                    entityType,
                    entityId,
                    active: true,
                    $or: [
                        { permanent: true },
                        { expiresAt: { $gt: new Date() } }
                    ]
                });

                const isBanned = !!ban;

                res.json({
                    success: true,
                    isBanned,
                    ban: isBanned ? {
                        entityType: ban.entityType,
                        entityId: ban.entityId,
                        reason: ban.reason,
                        permanent: ban.permanent,
                        expiresAt: ban.expiresAt,
                        bannedAt: ban.bannedAt
                    } : null
                });

            } catch (error: any) {
                console.error('❌ [FRAUD ADMIN] Erro ao verificar banimento:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Estatísticas de fraudes (admin)
        router.get('/stats', async (req: Request, res: Response) => {
            try {
                const stats = await BannedEntity.aggregate([
                    {
                        $match: { active: true }
                    },
                    {
                        $group: {
                            _id: '$entityType',
                            count: { $sum: 1 },
                            permanent: { $sum: { $cond: ['$permanent', 1, 0] } },
                            temporary: { $sum: { $cond: ['$permanent', 0, 1] } }
                        }
                    }
                ]);

                const totalBanned = await BannedEntity.countDocuments({ active: true });
                const totalPermanent = await BannedEntity.countDocuments({ active: true, permanent: true });
                const totalTemporary = totalBanned - totalPermanent;

                // Banimentos dos últimos 7 dias
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const recentBans = await BannedEntity.countDocuments({
                    bannedAt: { $gte: sevenDaysAgo }
                });

                res.json({
                    success: true,
                    stats: {
                        total: totalBanned,
                        permanent: totalPermanent,
                        temporary: totalTemporary,
                        recent7days: recentBans,
                        byType: stats.reduce((acc: any, stat: any) => {
                            acc[stat._id] = {
                                total: stat.count,
                                permanent: stat.permanent,
                                temporary: stat.temporary
                            };
                            return acc;
                        }, {})
                    }
                });

            } catch (error: any) {
                console.error('❌ [FRAUD ADMIN] Erro ao buscar estatísticas:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Limpar banimentos expirados (admin)
        router.post('/cleanup', async (req: Request, res: Response) => {
            try {
                const result = await BannedEntity.updateMany(
                    {
                        active: true,
                        permanent: false,
                        expiresAt: { $lt: new Date() }
                    },
                    { active: false }
                );

                console.log(`🧹 [FRAUD ADMIN] Limpeza de banimentos expirados: ${result.modifiedCount} atualizados`);

                res.json({
                    success: true,
                    cleaned: result.modifiedCount,
                    message: `${result.modifiedCount} banimentos expirados foram desativados`
                });

            } catch (error: any) {
                console.error('❌ [FRAUD ADMIN] Erro na limpeza de banimentos:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }
}

export default FraudManagementRoutes;
