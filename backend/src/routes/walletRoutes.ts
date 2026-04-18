import express from 'express';
import { PurchaseRecord, GiftTransaction, User, Streamer, BannedEntity } from '../models';
import { standardizeUserResponse } from '../utils/userResponse';
import { calculateBRLFromDiamonds } from '../utils/diamondConversion';
import FraudDetectionMiddleware from '../middleware/fraudDetection';
import mercadoPagoService from '../services/mercadoPagoService';

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

        console.log(`💳 [EARNINGS] Usuário ${user.name} (${req.params.id}) - Earnings: ${available_diamonds} diamantes`);

        res.json({ 
            available_diamonds, 
            brl_value,
            conversion_rate: 'Tabela de pacotes',
            withdrawal_method: user.withdrawal_method || null
        });
    } catch (error: any) {
        console.error('❌ [EARNINGS] Erro ao buscar earnings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Calcular valores de saque
router.post('/earnings/calculate', async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valor inválido' });
        }
        
        // Calcular valores
        const brl_amount = calculateBRLFromDiamonds(amount);
        const platform_fee_brl = Math.round((brl_amount * 0.20) * 100) / 100;
        const net_brl = Math.round((brl_amount - platform_fee_brl) * 100) / 100;
        
        // ⚠️ REMOVIDO: Logs com dados sensíveis
        // console.log(`[CALCULATE] Valores do saque:`);
        // console.log(`[CALCULATE] - Valor bruto: R$ ${brl_amount.toFixed(2)}`);
        // console.log(`[CALCULATE] - Taxa plataforma (20%): R$ ${platform_fee_brl.toFixed(2)}`);
        // console.log(`[CALCULATE] - Valor líquido: R$ ${net_brl.toFixed(2)}`);
        
        console.log('[CALCULATE] Cálculo de saque processado para amount:', amount);
        
        res.json({
            diamonds: amount,
            gross_brl: brl_amount,
            platform_fee_brl: parseFloat(platform_fee_brl.toFixed(2)),
            net_brl: parseFloat(net_brl.toFixed(2)),
            breakdown: {
                conversion: `${amount} diamantes = R$ ${brl_amount.toFixed(2)}`,
                fee: `Taxa da plataforma (20%): R$ ${platform_fee_brl.toFixed(2)}`,
                final: `Valor líquido: R$ ${net_brl.toFixed(2)}`
            }
        });
    } catch (error: any) {
        console.error('❌ [CALCULATE] Erro ao calcular saque:', error);
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
        const sentTransactions = await (GiftTransaction.find({ fromUserId: userId }) as any);
        const receivedTransactions = await (GiftTransaction.find({ toUserId: userId }) as any);
        
        // Somar totais reais
        const realEnviados = sentTransactions.reduce((sum: number, transaction: any) => sum + (transaction.totalValue || 0), 0);
        const realReceptores = receivedTransactions.reduce((sum: number, transaction: any) => sum + (transaction.totalValue || 0), 0);
        
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
                sentTransactions: sentTransactions.map((t: any) => ({
                    giftName: t.giftName,
                    totalValue: t.totalValue,
                    createdAt: t.createdAt
                })),
                receivedTransactions: receivedTransactions.map((t: any) => ({
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
        const sentTransactions = await GiftTransaction.find({ fromUserId: userId }).exec();
        const receivedTransactions = await GiftTransaction.find({ toUserId: userId }).exec();
        
        const realEnviados = sentTransactions.reduce((sum: number, transaction: any) => sum + (transaction.totalValue || 0), 0);
        const realReceptores = receivedTransactions.reduce((sum: number, transaction: any) => sum + (transaction.totalValue || 0), 0);
        
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
                const sentTransactions = await GiftTransaction.find({ fromUserId: user.id }).exec();
                const receivedTransactions = await GiftTransaction.find({ toUserId: user.id }).exec();
                
                const realEnviados = sentTransactions.reduce((sum: number, transaction: any) => sum + (transaction.totalValue || 0), 0);
                const realReceptores = receivedTransactions.reduce((sum: number, transaction: any) => sum + (transaction.totalValue || 0), 0);
                
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
// API para realizar saque real via Mercado Pago
router.post('/withdraw/:userId', FraudDetectionMiddleware.detectFraud, async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.params.userId;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valor de saque inválido' });
        }
        
        console.log(`💸 [WITHDRAW] Processando saque REAL de ${amount} diamantes para usuário ${userId}`);
        
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
        
        // Verificar método de saque configurado
        if (!user.withdrawal_method) {
            return res.status(400).json({ error: 'Método de saque não configurado' });
        }
        
        // Calcular valores
        const brl_amount = calculateBRLFromDiamonds(amount);
        const platform_fee_brl = brl_amount * 0.20;
        const net_amount_brl = brl_amount - platform_fee_brl;
        
        // Verificar configuração do Mercado Pago
        if (!mercadoPagoService.isConfigured()) {
            console.error('❌ [WITHDRAW] Mercado Pago não está configurado');
            return res.status(500).json({ error: 'Serviço de pagamento não configurado' });
        }
        
        // Gerar referência externa única
        const external_reference = `withdraw_${userId}_${Date.now()}`;
        
        // Preparar requisição para Mercado Pago
        const withdrawalRequest = {
            amount: net_amount_brl,
            description: `LiveGo - Saque de ${amount} diamantes (Líquido: R$ ${net_amount_brl.toFixed(2)})`,
            external_reference,
            payer_email: user.withdrawal_method.details.pixKey || user.withdrawal_method.details.email || user.email
        };
        
        console.log(`🔄 [WITHDRAW] Enviando para Mercado Pago - Ref: ${external_reference}`);
        
        // Realizar saque no Mercado Pago
        const mpWithdrawal = await mercadoPagoService.makeWithdrawal(withdrawalRequest);
        
        // Atualizar saldo do usuário (após confirmação do Mercado Pago)
        const newEarnings = currentEarnings - amount;
        
        await User.findOneAndUpdate(
            { id: userId },
            { 
                $set: { earnings: newEarnings, diamonds: 0, receptores: 0 },
                $inc: { earnings_withdrawn: amount },
                $push: {
                    withdrawal_requests: {
                        external_reference,
                        mp_payment_id: mpWithdrawal.id,
                        amount: net_amount_brl,
                        net_amount: mpWithdrawal.net_amount,
                        fee_amount: mpWithdrawal.fee_amount,
                        status: mpWithdrawal.status,
                        created_at: new Date().toISOString(),
                        description: withdrawalRequest.description
                    }
                }
            }
        );
        
        // 🔧 CORREÇÃO: Zerar contador da live ativa
        await Streamer.findOneAndUpdate(
            { hostId: userId, isLive: true },
            { $set: { diamonds: 0 } }
        );
        
        // 🔧 SINCRONIZAÇÃO: Transferir taxa para carteira ADM
        const ADM_EMAIL = process.env.ADM_EMAIL || 'adrianomdk5@gmail.com';
        const admUser = await User.findOneAndUpdate(
            { email: ADM_EMAIL },
            { $inc: { platformEarnings: platform_fee_brl } },
            { new: true }
        );
        
        if (admUser) {
            console.log(`🏦 [WITHDRAW] Taxa de plataforma transferida para carteira ADM`);
            
            await PurchaseRecord.create({
                id: `fee_${Date.now()}_${userId}`,
                userId: admUser.id,
                type: 'platform_fee_income',
                description: `Taxa de saque (20%) de ${user.name}: R$ ${platform_fee_brl.toFixed(2)}`,
                amountBRL: platform_fee_brl,
                amountCoins: 0,
                status: 'Concluído'
            });
            
            const io = req.app.get('io');
            if (io) {
                io.emit('platform_earnings_updated', {
                    userId: admUser.id,
                    added_fee: platform_fee_brl,
                    total_platform_earnings: admUser.platformEarnings || 0,
                    from_user: user.name,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        // Registrar saque no histórico
        await PurchaseRecord.create({
            id: `withdraw_${Date.now()}_${userId}`,
            userId,
            type: 'withdraw_earnings',
            description: `Saque via Mercado Pago: ${amount} diamantes = R$ ${brl_amount.toFixed(2)} - 20% taxa = R$ ${net_amount_brl.toFixed(2)}`,
            amountBRL: net_amount_brl,
            amountCoins: amount,
            status: mpWithdrawal.status === 'approved' ? 'Concluído' : 'Processando',
            metadata: {
                mp_payment_id: mpWithdrawal.id,
                external_reference,
                status: mpWithdrawal.status
            }
        });
        
        console.log(`✅ [WITHDRAW] Saque REAL processado com sucesso - MP ID: ${mpWithdrawal.id}`);
        
        // Enviar WebSocket para atualização em tempo real
        const io = req.app.get('io');
        if (io) {
            io.to(userId).emit('earnings_withdrawn', {
                userId,
                amount,
                newEarnings,
                diamonds: 0,
                receptores: 0,
                streamDiamonds: 0,
                brl_amount: net_amount_brl,
                mp_payment_id: mpWithdrawal.id,
                external_reference,
                status: mpWithdrawal.status,
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({
            success: true,
            amount,
            newEarnings,
            brl_amount: net_amount_brl,
            platform_fee: platform_fee_brl,
            mp_payment_id: mpWithdrawal.id,
            external_reference,
            status: mpWithdrawal.status,
            message: `Sque de ${amount} diamantes (R$ ${net_amount_brl.toFixed(2)}) enviado para Mercado Pago`
        });
        
    } catch (error: any) {
        console.error('❌ [WITHDRAW] Erro ao processar saque REAL:', error);
        res.status(500).json({ error: error.message });
    }
});

// Buscar dados completos do usuário (fonte oficial)
router.get('/user/data/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        console.log(`📋 [USER_DATA] Buscando dados completos: User=${userId}`);
        
        // Buscar usuário com todos os dados relevantes
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Calcular valores adicionais
        const available_diamonds = Math.floor(user.earnings || 0);
        const brl_value = calculateBRLFromDiamonds(available_diamonds);
        
        // Retornar dados completos sem depender de localStorage
        const completeUserData = {
            id: user.id,
            name: user.name,
            email: user.email,
            diamonds: user.diamonds || 0,
            earnings: user.earnings || 0,
            available_diamonds,
            brl_value,
            withdrawal_method: user.withdrawal_method || null,
            diamonds_purchased: user.diamonds_purchased || 0,
            earnings_withdrawn: user.earnings_withdrawn || 0,
            enviados: user.enviados || 0,
            receptores: user.receptores || 0,
            lastSeen: user.lastSeen,
            createdAt: user.createdAt
        };
        
        console.log(`✅ [USER_DATA] Dados retornados com sucesso: User=${userId}`);
        
        res.json({
            success: true,
            user: completeUserData
        });
        
    } catch (error: any) {
        console.error('❌ [USER_DATA] Erro ao buscar dados:', error);
        res.status(500).json({ error: error.message });
    }
});

// Configurar método de saque do usuário
router.post('/earnings/method/set/:id', async (req, res) => {
    try {
        const { method, details } = req.body;
        const userId = req.params.id;
        
        console.log(`⚙️ [METHOD] Configurando método de saque: User=${userId}, Method=${method}`);
        
        // Buscar usuário
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Validar método
        if (!method || !details) {
            return res.status(400).json({ error: 'Método e detalhes são obrigatórios' });
        }
        
        // Atualizar método de saque
        await User.updateOne(
            { id: userId },
            { 
                withdrawal_method: { 
                    method, 
                    details,
                    configured_at: new Date().toISOString()
                } 
            }
        );
        
        // Buscar usuário atualizado para retornar
        const updatedUser = await User.findOne({ id: userId });
        
        console.log(`✅ [METHOD] Método de saque configurado: User=${userId}, Method=${method}`);
        
        res.json({
            success: true,
            message: 'Método de saque configurado com sucesso',
            user: updatedUser,
            withdrawal_method: { method, details }
        });
        
    } catch (error: any) {
        console.error('❌ [METHOD] Erro ao configurar método de saque:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
