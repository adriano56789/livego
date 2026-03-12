import express from 'express';
   import { PurchaseRecord, GiftTransaction, User } from '../models';
import { standardizeUserResponse } from '../utils/userResponse';
import { calculateBRLFromDiamonds } from '../utils/diamondConversion';

const router = express.Router();

router.get('/purchases/history/:id', async (req, res) => {
    const history = await PurchaseRecord.find({ userId: req.params.id }).sort({ timestamp: -1 });
    res.json(history);
});

router.get('/earnings/get/:id', async (req, res) => {
    try {
        const user = await import('../models').then(m => m.User).then(U => U.findOne({ id: req.params.id }));
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Garantir que earnings seja sempre um número inteiro
        const available_diamonds = Math.floor(user.earnings || 0);
        const brl_value = calculateBRLFromDiamonds(available_diamonds);

        console.log(`💳 [EARNINGS] Usuário ${user.name} (${req.params.id}) - Earnings: ${available_diamonds} diamantes (R$ ${brl_value.toFixed(2)})`);

        res.json({ 
            available_diamonds, 
            brl_value,
            conversion_rate: 'Tabela de pacotes'
        });
    } catch (error: any) {
        console.error('❌ [EARNINGS] Erro ao buscar earnings:', error);
        res.status(500).json({ error: error.message });
    }
});

// API para validar e sincronizar contadores de presentes do usuário
router.get('/gifts/validate/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        console.log(`🔍 [VALIDATE] Validando contadores de presentes para usuário: ${userId}`);
        
        // Buscar usuário atual
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Calcular valores reais baseados nas transações
        const sentTransactions = await GiftTransaction.find({ fromUserId: userId });
        const receivedTransactions = await GiftTransaction.find({ toUserId: userId });
        
        // Somar totais reais
        const realEnviados = sentTransactions.reduce((sum, transaction) => sum + (transaction.totalValue || 0), 0);
        const realReceptores = receivedTransactions.reduce((sum, transaction) => sum + (transaction.totalValue || 0), 0);
        
        // Valores atuais no perfil
        const currentEnviados = user.enviados || 0;
        const currentReceptores = user.receptores || 0;
        
        console.log(`📊 [VALIDATE] Usuário: ${userId}`);
        console.log(`📤 [VALIDATE] Enviados - Atual: ${currentEnviados}, Real: ${realEnviados}, Diff: ${realEnviados - currentEnviados}`);
        console.log(`📥 [VALIDATE] Receptores - Atual: ${currentReceptores}, Real: ${realReceptores}, Diff: ${realReceptores - currentReceptores}`);
        console.log(`📝 [VALIDATE] Transações enviadas: ${sentTransactions.length}, recebidas: ${receivedTransactions.length}`);
        
        // Verificar se há diferença
        const enviadosDiff = realEnviados - currentEnviados;
        const receptoresDiff = realReceptores - currentReceptores;
        const needsUpdate = enviadosDiff !== 0 || receptoresDiff !== 0;
        
        res.json({
            userId,
            current: {
                enviados: currentEnviados,
                receptores: currentReceptores
            },
            real: {
                enviados: realEnviados,
                receptores: realReceptores
            },
            differences: {
                enviados: enviadosDiff,
                receptores: receptoresDiff
            },
            needsUpdate,
            transactions: {
                sent: sentTransactions.length,
                received: receivedTransactions.length
            },
            details: {
                sentTransactions: sentTransactions.map(t => ({
                    giftName: t.giftName,
                    totalValue: t.totalValue,
                    createdAt: t.createdAt
                })),
                receivedTransactions: receivedTransactions.map(t => ({
                    giftName: t.giftName,
                    totalValue: t.totalValue,
                    createdAt: t.createdAt
                }))
            }
        });
        
    } catch (error: any) {
        console.error('❌ [VALIDATE] Erro ao validar contadores:', error);
        res.status(500).json({ error: error.message });
    }
});

// API para sincronizar contadores com valores reais
router.post('/gifts/sync/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        console.log(`🔄 [SYNC] Sincronizando contadores de presentes para usuário: ${userId}`);
        
        // Buscar usuário
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Calcular valores reais
        const sentTransactions = await GiftTransaction.find({ fromUserId: userId });
        const receivedTransactions = await GiftTransaction.find({ toUserId: userId });
        
        const realEnviados = sentTransactions.reduce((sum, transaction) => sum + (transaction.totalValue || 0), 0);
        const realReceptores = receivedTransactions.reduce((sum, transaction) => sum + (transaction.totalValue || 0), 0);
        
        // Atualizar contadores
        const oldEnviados = user.enviados || 0;
        const oldReceptores = user.receptores || 0;
        
        user.enviados = realEnviados;
        user.receptores = realReceptores;
        await user.save();
        
        console.log(`✅ [SYNC] Contadores atualizados para usuário ${userId}:`);
        console.log(`📤 Enviados: ${oldEnviados} → ${realEnviados} (diff: ${realEnviados - oldEnviados})`);
        console.log(`📥 Receptores: ${oldReceptores} → ${realReceptores} (diff: ${realReceptores - oldReceptores})`);
        
        res.json({
            success: true,
            userId,
            updated: {
                enviados: realEnviados,
                receptores: realReceptores
            },
            previous: {
                enviados: oldEnviados,
                receptores: oldReceptores
            },
            changes: {
                enviados: realEnviados - oldEnviados,
                receptores: realReceptores - oldReceptores
            },
            transactions: {
                sent: sentTransactions.length,
                received: receivedTransactions.length
            }
        });
        
    } catch (error: any) {
        console.error('❌ [SYNC] Erro ao sincronizar contadores:', error);
        res.status(500).json({ error: error.message });
    }
});

// API para sincronizar todos os usuários (admin)
router.post('/gifts/sync-all', async (req, res) => {
    try {
        console.log(`🔄 [SYNC-ALL] Iniciando sincronização de todos os usuários`);
        
        // Buscar todos os usuários
        const users = await User.find({});
        let totalUpdated = 0;
        let totalEnviadosDiff = 0;
        let totalReceptoresDiff = 0;
        
        for (const user of users) {
            try {
                // Calcular valores reais
                const sentTransactions = await GiftTransaction.find({ fromUserId: user.id });
                const receivedTransactions = await GiftTransaction.find({ toUserId: user.id });
                
                const realEnviados = sentTransactions.reduce((sum, transaction) => sum + (transaction.totalValue || 0), 0);
                const realReceptores = receivedTransactions.reduce((sum, transaction) => sum + (transaction.totalValue || 0), 0);
                
                const oldEnviados = user.enviados || 0;
                const oldReceptores = user.receptores || 0;
                
                // Atualizar se houver diferença
                if (realEnviados !== oldEnviados || realReceptores !== oldReceptores) {
                    user.enviados = realEnviados;
                    user.receptores = realReceptores;
                    await user.save();
                    
                    const enviadosDiff = realEnviados - oldEnviados;
                    const receptoresDiff = realReceptores - oldReceptores;
                    
                    totalUpdated++;
                    totalEnviadosDiff += enviadosDiff;
                    totalReceptoresDiff += receptoresDiff;
                    
                    console.log(`✅ [SYNC-ALL] Usuário ${user.id}: ${oldEnviados}→${realEnviados} enviados, ${oldReceptores}→${realReceptores} receptores`);
                }
                
            } catch (userError: any) {
                console.error(`❌ [SYNC-ALL] Erro ao sincronizar usuário ${user.id}:`, userError.message);
            }
        }
        
        console.log(`🎉 [SYNC-ALL] Sincronização concluída: ${totalUpdated} usuários atualizados`);
        console.log(`📊 [SYNC-ALL] Diferenças totais: ${totalEnviadosDiff} enviados, ${totalReceptoresDiff} receptores`);
        
        res.json({
            success: true,
            totalUsers: users.length,
            updated: totalUpdated,
            totalDifferences: {
                enviados: totalEnviadosDiff,
                receptores: totalReceptoresDiff
            }
        });
        
    } catch (error: any) {
        console.error('❌ [SYNC-ALL] Erro na sincronização geral:', error);
        res.status(500).json({ error: error.message });
    }
});
// API para realizar saque (diminui earnings)
router.post('/withdraw/:userId', async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.params.userId;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valor de saque inválido' });
        }
        
        console.log(`💸 [WITHDRAW] Processando saque de ${amount} diamantes para usuário ${userId}`);
        
        // Buscar usuário
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        const currentEarnings = Math.floor(user.earnings || 0);
        
        if (amount > currentEarnings) {
            return res.status(400).json({ 
                error: 'Saldo insuficiente', 
                available: currentEarnings,
                requested: amount 
            });
        }
        
        // Realizar saque
        const newEarnings = currentEarnings - amount;
        await User.findOneAndUpdate(
            { id: userId },
            { earnings: newEarnings }
        );
        
        // Calcular valor em BRL
        const brl_amount = calculateBRLFromDiamonds(amount);
        const platform_fee = brl_amount * 0.20;
        const net_amount = brl_amount - platform_fee;
        
        console.log(`✅ [WITHDRAW] Saque realizado: ${amount} diamantes (R$ ${net_amount.toFixed(2)})`);
        console.log(`💳 [WITHDRAW] Saldo atualizado: ${currentEarnings} → ${newEarnings} diamantes`);
        
        // Enviar WebSocket sobre saque
        const io = req.app.get('io');
        if (io) {
            io.emit('earnings_withdrawn', {
                userId,
                amount,
                newEarnings,
                brl_amount: net_amount,
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({
            success: true,
            amount,
            newEarnings,
            brl_amount: net_amount,
            platform_fee,
            message: `Saque de ${amount} diamantes (R$ ${net_amount.toFixed(2)}) realizado com sucesso`
        });
        
    } catch (error: any) {
        console.error('❌ [WITHDRAW] Erro ao processar saque:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/earnings/calculate', async (req, res) => {
    const amount = req.body.amount || 0;
    
    // Converter diamantes para BRL usando tabela específica
    const brl_amount = calculateBRLFromDiamonds(amount);
    
    // Aplicar taxa de 20% da plataforma
    const platform_fee = brl_amount * 0.20;
    const net_amount = brl_amount - platform_fee;
    
    res.json({ 
        diamonds: amount,
        gross_brl: brl_amount,
        platform_fee_brl: platform_fee,
        net_brl: net_amount,
        breakdown: {
            conversion: `${amount} diamantes = R$${brl_amount.toFixed(2)}`,
            fee: `Taxa da plataforma (20%): R$${platform_fee.toFixed(2)}`,
            final: `Valor a receber: R$${net_amount.toFixed(2)}`
        }
    });
});
router.post('/earnings/withdraw/:id', async (req, res) => {
    try {
        const amount = req.body.amount || 0;
        const user = await import('../models').then(m => m.User).then(U => U.findOne({ id: req.params.id }));
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.earnings < amount) return res.status(400).json({ error: 'Insufficient earnings' });

        // Converter diamantes para BRL usando tabela
        const brl_amount = calculateBRLFromDiamonds(amount);
        
        // Aplicar taxa de 20% da plataforma apenas no saque
        const platform_fee = brl_amount * 0.20;
        const net_amount = brl_amount - platform_fee;

        user.earnings -= amount;
        user.earnings_withdrawn = (user.earnings_withdrawn || 0) + net_amount;

        await user.save();

        await PurchaseRecord.create({
            id: Date.now().toString(),
            userId: user.id,
            amount: -amount,
            diamonds: amount,
            brl_amount: brl_amount,
            platform_fee: platform_fee,
            net_amount: net_amount,
            type: 'withdrawal',
            timestamp: new Date().toISOString(),
            status: 'completed',
            description: `Withdrawal: ${amount} diamonds = R$${brl_amount.toFixed(2)} - 20% fee = R$${net_amount.toFixed(2)}`
        });

        res.json({ 
            success: true, 
            user: standardizeUserResponse(user),
            withdrawal: {
                diamonds: amount,
                brl_amount,
                platform_fee,
                net_amount
            }
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/earnings/method/set/:id', async (req, res) => {
    const user = await import('../models').then(m => m.User).then(U => U.findOneAndUpdate(
        { id: req.params.id },
        { withdrawal_method: { method: req.body.method, details: req.body.details } },
        { new: true }
    ));
    res.json({ success: !!user, user: standardizeUserResponse(user) || {} as any });
});

export default router;
