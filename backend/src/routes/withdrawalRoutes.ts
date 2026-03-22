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
        if (!user.withdrawal_method || user.withdrawal_method.method !== 'pix') {
            return res.status(400).json({ 
                error: 'Método de saque não configurado',
                details: 'Configure seu método de saque (Pix) no perfil'
            });
        }

        // Inicializar SDK do Mercado Pago
        const mercadopago = require('mercadopago');
        mercadopago.configure({
            access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
        });

        console.log(`[WITHDRAWAL PIX] Processando transferência: R$ ${amount} para ${pixKey}`);

        // Criar transferência (cash-out) via Pix
        const transferData = {
            amount: amount,
            description: `LiveGo - Saque de ${user.name || userId}`,
            pix: {
                key: pixKey,
                key_type: pixKeyType // 'cpf', 'cnpj', 'email', 'phone' ou 'evp'
            }
        };

        // Realizar transferência
        const transfer = await mercadopago.transfer.create(transferData);
        
        console.log(`[WITHDRAWAL SUCCESS] Transferência criada: ${transfer.body.id}`);

        // Deduzir saldo do usuário
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

        // Registrar no histórico
        const PurchaseRecord = (await import('../models')).PurchaseRecord;
        await PurchaseRecord.create({
            id: `withdrawal_${userId}_${Date.now()}`,
            userId: userId,
            type: 'withdrawal',
            description: `Saque via Pix - R$ ${amount.toFixed(2)} - Transferência: ${transfer.body.id}`,
            amountBRL: -amount,
            amountCoins: 0,
            status: 'Processando',
            timestamp: new Date(),
            metadata: {
                transferId: transfer.body.id,
                pixKey: pixKey,
                pixKeyType: pixKeyType
            }
        });

        // Emitir WebSocket para atualizar frontend em tempo real
        const io = getIO();
        if (io) {
            io.to(userId).emit('withdrawal_processed', {
                userId,
                amount: -amount,
                newBalance: updatedUser?.earnings || 0,
                transferId: transfer.body.id,
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
            transferId: transfer.body.id,
            amount: amount,
            status: 'processing',
            message: 'Saque iniciado com sucesso. O dinheiro será transferido para sua conta Pix em até 1 dia útil.',
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
