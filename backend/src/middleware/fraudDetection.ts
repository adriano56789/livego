import { Request, Response, NextFunction } from 'express';
import { BannedEntity } from '../models/BannedEntity';
import { User } from '../models';

interface FraudDetectionRequest extends Request {
    user?: any;
    userIp?: string;
    deviceFingerprint?: string;
    userId?: string;
}

export class FraudDetectionMiddleware {
    static async detectFraud(req: FraudDetectionRequest, res: Response, next: NextFunction) {
        try {
            const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
            const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
            const userId = req.body.userId || req.params.userId || req.user?.id;

            console.log(`🔍 [FRAUD DETECTION] Verificando acesso: IP=${clientIp}, Device=${deviceFingerprint?.substring(0, 10)}..., User=${userId}`);

            // Verificar se IP está banido
            const ipBanned = await BannedEntity.findOne({
                entityType: 'ip',
                entityId: clientIp,
                active: true,
                $or: [
                    { permanent: true },
                    { expiresAt: { $gt: new Date() } }
                ]
            });

            if (ipBanned) {
                console.log(`🚫 [FRAUD] IP banido detectado: ${clientIp} - Motivo: ${ipBanned.reason}`);
                return res.status(403).json({
                    error: 'Acesso bloqueado',
                    reason: 'IP restrito',
                    details: 'Seu endereço IP está restrito por violação dos termos de uso'
                });
            }

            // Verificar se dispositivo está banido
            if (deviceFingerprint) {
                const deviceBanned = await BannedEntity.findOne({
                    entityType: 'device',
                    entityId: deviceFingerprint,
                    active: true,
                    $or: [
                        { permanent: true },
                        { expiresAt: { $gt: new Date() } }
                    ]
                });

                if (deviceBanned) {
                    console.log(`🚫 [FRAUD] Dispositivo banido detectado: ${deviceFingerprint.substring(0, 10)}... - Motivo: ${deviceBanned.reason}`);
                    return res.status(403).json({
                        error: 'Acesso bloqueado',
                        reason: 'Dispositivo restrito',
                        details: 'Seu dispositivo está restrito por violação dos termos de uso'
                    });
                }
            }

            // Verificar se usuário está banido
            if (userId) {
                const userBanned = await BannedEntity.findOne({
                    entityType: 'user',
                    entityId: userId,
                    active: true,
                    $or: [
                        { permanent: true },
                        { expiresAt: { $gt: new Date() } }
                    ]
                });

                if (userBanned) {
                    console.log(`🚫 [FRAUD] Usuário banido detectado: ${userId} - Motivo: ${userBanned.reason}`);
                    return res.status(403).json({
                        error: 'Acesso bloqueado',
                        reason: 'Conta restrita',
                        details: 'Sua conta está restrita por violação dos termos de uso'
                    });
                }

                // Verificar se email do usuário está banido
                const user = await User.findOne({ id: userId });
                if (user?.email) {
                    const emailBanned = await BannedEntity.findOne({
                        entityType: 'email',
                        entityId: user.email.toLowerCase(),
                        active: true,
                        $or: [
                            { permanent: true },
                            { expiresAt: { $gt: new Date() } }
                        ]
                    });

                    if (emailBanned) {
                        console.log(`🚫 [FRAUD] Email banido detectado: ${user.email} - Motivo: ${emailBanned.reason}`);
                        return res.status(403).json({
                            error: 'Acesso bloqueado',
                            reason: 'Email restrito',
                            details: 'Seu email está restrito por violação dos termos de uso'
                        });
                    }
                }
            }

            // Adicionar informações ao request para uso posterior
            req.userIp = clientIp;
            req.deviceFingerprint = deviceFingerprint;

            console.log(`✅ [FRAUD DETECTION] Acesso liberado: IP=${clientIp}, Device=${deviceFingerprint?.substring(0, 10)}..., User=${userId}`);
            next();

        } catch (error: any) {
            console.error('❌ [FRAUD DETECTION] Erro na verificação:', error);
            // Em caso de erro no sistema antifraude, permitir acesso (fail-safe)
            next();
        }
    }

    static async banEntity(entityType: 'ip' | 'device' | 'user' | 'email', entityId: string, reason: string, evidence?: any, permanent: boolean = true) {
        try {
            // Verificar se já existe banimento ativo
            const existingBan = await BannedEntity.findOne({
                entityType,
                entityId,
                active: true
            });

            if (existingBan) {
                console.log(`⚠️ [FRAUD] Entidade ${entityType}:${entityId} já está banida`);
                return existingBan;
            }

            const ban = await BannedEntity.create({
                entityType,
                entityId,
                reason,
                evidence,
                permanent,
                expiresAt: permanent ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias se não for permanente
                active: true
            });

            console.log(`🚫 [FRAUD] Entidade banida: ${entityType}:${entityId} - Motivo: ${reason}`);
            return ban;

        } catch (error: any) {
            console.error(`❌ [FRAUD] Erro ao banir entidade ${entityType}:${entityId}:`, error);
            throw error;
        }
    }

    static async banRelatedEntities(ip: string, deviceFingerprint: string, userId: string, userEmail: string, reason: string, evidence?: any) {
        try {
            const bans = [];

            // Banir IP
            if (ip) {
                const ipBan = await this.banEntity('ip', ip, reason, evidence);
                bans.push(ipBan);
            }

            // Banir dispositivo
            if (deviceFingerprint) {
                const deviceBan = await this.banEntity('device', deviceFingerprint, reason, evidence);
                bans.push(deviceBan);
            }

            // Banir usuário
            if (userId) {
                const userBan = await this.banEntity('user', userId, reason, evidence);
                bans.push(userBan);
            }

            // Banir email
            if (userEmail) {
                const emailBan = await this.banEntity('email', userEmail.toLowerCase(), reason, evidence);
                bans.push(emailBan);
            }

            // Criar registro de banimento com entidades relacionadas
            const mainBan = bans[0];
            if (mainBan && ip && deviceFingerprint && userId && userEmail) {
                await BannedEntity.updateOne(
                    { _id: mainBan._id },
                    {
                        $set: {
                            relatedEntities: {
                                ips: [ip],
                                devices: [deviceFingerprint],
                                users: [userId],
                                emails: [userEmail.toLowerCase()]
                            }
                        }
                    }
                );
            }

            console.log(`🚫 [FRAUD] Banimento completo aplicado: ${bans.length} entidades bloqueadas`);
            return bans;

        } catch (error: any) {
            console.error('❌ [FRAUD] Erro ao banir entidades relacionadas:', error);
            throw error;
        }
    }
}

export default FraudDetectionMiddleware;
