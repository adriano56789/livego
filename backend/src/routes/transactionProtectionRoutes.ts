import express from 'express';
import { User, PurchaseRecord } from '../models';

const router = express.Router();

/**
 * Verifica se há transações pendentes ou situações de risco
 * que devem impedir o bloqueio entre usuários
 */
router.get('/check-block-status/:userId/:targetUserId', async (req, res) => {
    try {
        const { userId, targetUserId } = req.params;

        // Buscar dados dos dois usuários
        const [user, targetUser] = await Promise.all([
            User.findOne({ id: userId }),
            User.findOne({ id: targetUserId })
        ]);

        if (!user || !targetUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const blockRestrictions = {
            canBlock: true,
            reason: '',
            restrictions: [] as string[]
        };

        // 1. Verificar transações pendentes (saques recentes)
        const recentWithdrawals = await PurchaseRecord.find({
            userId: userId,
            type: 'withdrawal',
            status: { $in: ['Processando', 'pending'] },
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Últimos 7 dias
        });

        if (recentWithdrawals.length > 0) {
            blockRestrictions.canBlock = false;
            blockRestrictions.reason = 'Transações financeiras pendentes';
            blockRestrictions.restrictions.push('withdrawal_pending');
        }

        // 2. Verificar se o usuário alvo tem saques pendentes
        const targetRecentWithdrawals = await PurchaseRecord.find({
            userId: targetUserId,
            type: 'withdrawal',
            status: { $in: ['Processando', 'pending'] },
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        if (targetRecentWithdrawals.length > 0) {
            blockRestrictions.canBlock = false;
            blockRestrictions.reason = 'Transações financeiras pendentes do outro usuário';
            blockRestrictions.restrictions.push('target_withdrawal_pending');
        }

        // 3. Verificar histórico de disputas ou problemas
        const recentDisputes = await PurchaseRecord.find({
            $or: [
                { userId, type: 'dispute' },
                { userId: targetUserId, type: 'dispute' }
            ],
            timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Últimos 30 dias
        });

        if (recentDisputes.length > 0) {
            blockRestrictions.canBlock = false;
            blockRestrictions.reason = 'Disputas recentes detectadas';
            blockRestrictions.restrictions.push('recent_disputes');
        }

        // 4. Verificar se há múltiplas tentativas de bloqueio recentes
        const recentBlocks = await PurchaseRecord.find({
            userId,
            type: 'block_attempt',
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
        });

        if (recentBlocks.length >= 3) {
            blockRestrictions.canBlock = false;
            blockRestrictions.reason = 'Múltiplas tentativas de bloqueio recentes';
            blockRestrictions.restrictions.push('excessive_blocks');
        }

        // 5. Proteção especial para novos usuários (menos de 7 dias)
        const userAge = Date.now() - new Date(user.createdAt || Date.now()).getTime();
        const targetUserAge = Date.now() - new Date(targetUser.createdAt || Date.now()).getTime();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

        if (userAge < sevenDaysInMs || targetUserAge < sevenDaysInMs) {
            blockRestrictions.canBlock = false;
            blockRestrictions.reason = 'Usuário muito recente';
            blockRestrictions.restrictions.push('new_user_protection');
        }

        // Registrar tentativa de verificação para auditoria
        await PurchaseRecord.create({
            id: `block_check_${userId}_${targetUserId}_${Date.now()}`,
            userId,
            type: 'block_check',
            description: `Verificação de bloqueio: ${userId} → ${targetUserId}`,
            amountBRL: 0,
            amountCoins: 0,
            status: blockRestrictions.canBlock ? 'allowed' : 'blocked',
            timestamp: new Date(),
            metadata: {
                targetUserId,
                restrictions: blockRestrictions.restrictions,
                reason: blockRestrictions.reason
            }
        });

        res.json({
            success: true,
            canBlock: blockRestrictions.canBlock,
            reason: blockRestrictions.reason,
            restrictions: blockRestrictions.restrictions,
            message: blockRestrictions.canBlock 
                ? 'Bloqueio permitido' 
                : `Bloqueio temporariamente desabilitado: ${blockRestrictions.reason}`
        });

    } catch (error: any) {
        console.error('[TRANSACTION_PROTECTION] Erro ao verificar status de bloqueio:', error);
        res.status(500).json({ 
            error: 'Erro interno',
            message: 'Não foi possível verificar o status de bloqueio'
        });
    }
});

/**
 * Registra uma tentativa de bloqueio para auditoria
 */
router.post('/register-block-attempt', async (req, res) => {
    try {
        const { userId, targetUserId, reason, success } = req.body;

        if (!userId || !targetUserId) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        // Registrar tentativa de bloqueio
        await PurchaseRecord.create({
            id: `block_attempt_${userId}_${targetUserId}_${Date.now()}`,
            userId,
            type: 'block_attempt',
            description: `Tentativa de bloqueio: ${userId} → ${targetUserId}`,
            amountBRL: 0,
            amountCoins: 0,
            status: success ? 'success' : 'failed',
            timestamp: new Date(),
            metadata: {
                targetUserId,
                reason: reason || 'Não especificado',
                userAgent: req.get('User-Agent'),
                ip: req.ip
            }
        });

        res.json({ success: true });

    } catch (error: any) {
        console.error('[TRANSACTION_PROTECTION] Erro ao registrar tentativa de bloqueio:', error);
        res.status(500).json({ 
            error: 'Erro interno',
            message: 'Não foi possível registrar tentativa de bloqueio'
        });
    }
});

export default router;
