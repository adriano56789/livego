import express from 'express';
import { User } from '../models';
import { getIO } from '../socket';

const router = express.Router();

// Endpoint para realizar saque via Pix (cash-out) do Mercado Pago
router.post('/pix', async (req, res) => {
    try {
        const { userId, amount, pixKey, pixKeyType } = req.body;

        console.log(`[WITHDRAWAL PIX] Iniciando saque: User=${userId}, Amount=${amount}, PixKey=${pixKey}`);

        // Validações básicas
        if (!userId || !amount || !pixKey || !pixKeyType) {
            return res.status(400).json({ 
                error: 'Dados incompletos',
                details: 'userId, amount, pixKey e pixKeyType são obrigatórios'
            });
        }

        if (amount < 5) {
            return res.status(400).json({ 
                error: 'Valor mínimo não atingido',
                details: 'O valor mínimo para saque é R$ 5,00'
            });
        }

        // Buscar usuário
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verificar se usuário tem saldo suficiente
        if (user.earnings < amount) {
            return res.status(400).json({ 
                error: 'Saldo insuficiente',
                details: `Saldo disponível: R$ ${user.earnings.toFixed(2)}`
            });
        }

        // Verificar método de saque configurado
        console.log(`[WITHDRAW] Debug - User withdrawal_method:`, JSON.stringify(user.withdrawal_method, null, 2));
        
        if (!user.withdrawal_method) {
            return res.status(400).json({ 
                error: 'Método de saque não configurado',
                details: 'Configure seu método de saque (Pix) no perfil'
            });
        }
        
        // Verificar se o método é Pix (case insensitive e null safe)
        const method = user.withdrawal_method.method;
        console.log(`[WITHDRAW] Debug - Extracted method:`, method, `Type:`, typeof method);
        
        if (!method || method.toString().toLowerCase() !== 'pix') {
            return res.status(400).json({ 
                error: 'Método de saque não suportado',
                details: `Método atual: ${method || 'não configurado'}. Use Pix.`
            });
        }

        // Inicializar SDK do Mercado Pago
        const { default: mercadopago } = require('mercadopago');
        const client = new mercadopago({
            access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
        });

        // Calcular valores (80% para streamer, 20% para app)
        const streamerAmount = amount * 0.8; // 80% para o streamer
        const appCommission = amount * 0.2; // 20% para o app
        
        console.log(`[WITHDRAWAL PIX] Distribuição: Streamer=R$ ${streamerAmount.toFixed(2)} (80%), App=R$ ${appCommission.toFixed(2)} (20%)`);

        // Criar transferência para o streamer (80%)
        const streamerTransferData = {
            amount: streamerAmount,
            description: `LiveGo - Pagamento para ${user.name || userId} (80% comissão)`,
            pix: {
                key: pixKey,
                key_type: pixKeyType
            }
        };

        // Realizar transferência para o streamer
        const streamerTransfer = await client.transfer.create({ body: streamerTransferData });
        console.log(`[WITHDRAWAL SUCCESS] Transferência streamer criada: ${streamerTransfer.id}`);

        // Criar transferência para o app (20% - comissão)
        const appTransferData = {
            amount: appCommission,
            description: `LiveGo - Comissão do app (20%) - Streamer: ${user.name || userId}`,
            pix: {
                key: process.env.APP_PIX_KEY || 'app@livego.store', // Chave PIX do app
                key_type: 'email'
            }
        };

        // Realizar transferência para o app
        const appTransfer = await client.transfer.create({ body: appTransferData });
        console.log(`[WITHDRAWAL SUCCESS] Transferência app criada: ${appTransfer.id}`);

        // Deduzir saldo total do usuário
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            { 
                $inc: { earnings: -amount },
                $set: { 
                    lastWithdrawalAt: new Date(),
                    lastWithdrawalAmount: amount
                }
            },
            { new: true }
        );

        // Registrar no histórico - transferência para o streamer
        const PurchaseRecord = (await import('../models')).PurchaseRecord;
        await PurchaseRecord.create({
            id: `withdrawal_streamer_${userId}_${Date.now()}`,
            userId: userId,
            type: 'withdrawal',
            description: `Saque via Pix - R$ ${streamerAmount.toFixed(2)} (80%) - Transferência: ${streamerTransfer.id}`,
            amountBRL: -streamerAmount,
            amountCoins: 0,
            status: 'Processando',
            timestamp: new Date(),
            metadata: {
                transferId: streamerTransfer.id,
                pixKey: pixKey,
                pixKeyType: pixKeyType,
                commissionType: 'streamer_payment',
                percentage: 80
            }
        });

        // Registrar no histórico - comissão do app
        await PurchaseRecord.create({
            id: `withdrawal_app_${userId}_${Date.now()}`,
            userId: 'system_app', // ID do sistema para comissões
            type: 'commission',
            description: `Comissão do app (20%) - Streamer: ${user.name || userId} - Transferência: ${appTransfer.id}`,
            amountBRL: appCommission,
            amountCoins: 0,
            status: 'Processando',
            timestamp: new Date(),
            metadata: {
                transferId: appTransfer.id,
                streamerId: userId,
                streamerName: user.name,
                commissionType: 'app_commission',
                percentage: 20
            }
        });

        // Emitir WebSocket para atualizar frontend em tempo real
        const io = getIO();
        if (io) {
            io.to(userId).emit('withdrawal_processed', {
                userId,
                totalAmount: amount,
                streamerAmount: streamerAmount,
                appCommission: appCommission,
                newBalance: updatedUser?.earnings || 0,
                transferId: streamerTransfer.id,
                status: 'processing'
            });
            
            // Também emitir earnings_updated para compatibilidade
            io.to(userId).emit('earnings_updated', {
                userId,
                available_diamonds: 0, // Saque zera diamantes disponíveis
                brl_value: updatedUser?.earnings || 0
            });
        }

        res.json({
            success: true,
            transferId: streamerTransfer.id,
            totalAmount: amount,
            streamerAmount: streamerAmount,
            appCommission: appCommission,
            status: 'processing',
            message: `Saque de R$ ${streamerAmount.toFixed(2)} iniciado com sucesso (80% do valor total). O dinheiro será transferido para sua conta Pix em até 1 dia útil.`,
            newBalance: updatedUser?.earnings || 0
        });

    } catch (error: any) {
        console.error('[WITHDRAWAL ERROR] Erro ao processar saque:', error);
        
        // Se for erro do Mercado Pago, retornar mensagem específica
        if (error.response && error.response.data) {
            return res.status(400).json({
                error: 'Erro na transferência',
                details: error.response.data.message || 'Erro ao processar transferência via Pix'
            });
        }

        res.status(500).json({ 
            error: 'Erro interno',
            message: 'Não foi possível processar o saque. Tente novamente.'
        });
    }
});

// Endpoint para consultar status da transferência
router.get('/status/:transferId', async (req, res) => {
    try {
        const { transferId } = req.params;

        const mercadopago = require('mercadopago');
        mercadopago.configure({
            access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
        });

        const transfer = await mercadopago.transfer.findById(transferId);
        
        res.json({
            success: true,
            transfer: transfer.body
        });

    } catch (error: any) {
        console.error('[WITHDRAWAL STATUS ERROR] Erro ao consultar status:', error);
        res.status(500).json({ 
            error: 'Erro ao consultar status',
            message: 'Não foi possível obter o status da transferência'
        });
    }
});

// Endpoint para listar saques do usuário
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10, offset = 0 } = req.query;

        const PurchaseRecord = (await import('../models')).PurchaseRecord;
        const withdrawals = await PurchaseRecord.find({
            userId: userId,
            type: 'withdrawal'
        })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string));

        const total = await PurchaseRecord.countDocuments({
            userId: userId,
            type: 'withdrawal'
        });

        res.json({
            success: true,
            withdrawals,
            total,
            hasMore: (parseInt(offset as string) + withdrawals.length) < total
        });

    } catch (error: any) {
        console.error('[WITHDRAWAL HISTORY ERROR] Erro ao buscar histórico:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar histórico',
            message: 'Não foi possível carregar o histórico de saques'
        });
    }
});

export default router;
