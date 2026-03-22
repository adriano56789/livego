import express from 'express';
import { Order } from '../models';
import crypto from 'crypto';

const router = express.Router();

// Webhook do Mercado Pago para receber notificações de pagamento
router.post('/mercadopago', async (req, res) => {
    try {
        console.log('[WEBHOOK] Notificação recebida do Mercado Pago:', JSON.stringify(req.body, null, 2));

        // Verificar se é uma notificação de pagamento
        if (req.body.type === 'payment') {
            const paymentId = req.body.data.id;
            console.log(`[WEBHOOK] Processando pagamento ${paymentId}`);

            // Buscar informações do pagamento no Mercado Pago
            const mercadopago = require('mercadopago');
            mercadopago.configure({
                access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
            });

            const payment = await mercadopago.payment.findById(paymentId);
            const paymentData = payment.body;

            console.log(`[WEBHOOK] Status do pagamento ${paymentId}: ${paymentData.status}`);

            // Procurar ordem associada a este pagamento
            const order = await Order.findOne({ mpPaymentId: paymentId });
            
            if (!order) {
                console.log(`[WEBHOOK] Ordem não encontrada para pagamento ${paymentId}`);
                return res.status(404).json({ error: 'Order not found' });
            }

            console.log(`[WEBHOOK] Ordem ${order.id} encontrada para pagamento ${paymentId}`);

            // Se o pagamento foi aprovado e a ordem ainda está pendente
            if (paymentData.status === 'approved' && order.status === 'pending') {
                console.log(`[WEBHOOK] Pagamento aprovado! Processando ordem ${order.id}`);

                // Atualizar status da ordem
                await Order.findOneAndUpdate(
                    { id: order.id },
                    { 
                        status: 'paid',
                        paymentConfirmationId: paymentId,
                        confirmedAt: new Date(),
                        paymentStatus: 'approved'
                    }
                );

                // Creditar diamantes para o usuário
                const User = (await import('../models')).User;
                const user = await User.findOneAndUpdate(
                    { id: order.userId },
                    { $inc: { diamonds: order.diamonds } },
                    { new: true }
                );

                if (!user) {
                    console.log(`[WEBHOOK] Usuário não encontrado: ${order.userId}`);
                    return res.status(404).json({ error: 'User not found' });
                }

                console.log(`[WEBHOOK] SUCESSO! Usuário ${user.name} recebeu ${order.diamonds} diamantes. Saldo atual: ${user.diamonds}`);

                // Registrar compra no histórico
                const PurchaseRecord = (await import('../models')).PurchaseRecord;
                await PurchaseRecord.create({
                    id: `purchase_${order.id}_${Date.now()}`,
                    userId: order.userId,
                    type: 'diamond_purchase',
                    description: `Compra de ${order.diamonds} diamantes - Pagamento confirmado: ${paymentId}`,
                    amountBRL: order.amount,
                    amountCoins: order.diamonds,
                    status: 'Concluído',
                    timestamp: new Date()
                });

                console.log(`[WEBHOOK] Compra registrada no histórico para usuário ${order.userId}`);

                // Emitir WebSocket para atualizar frontend em tempo real
                const io = require('../socket').getIO();
                if (io) {
                    io.to(order.userId).emit('diamonds_updated', {
                        userId: order.userId,
                        diamonds: user.diamonds,
                        change: order.diamonds,
                        source: 'purchase'
                    });
                    console.log(`[WEBHOOK] WebSocket emitido para usuário ${order.userId}`);
                }

            } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
                console.log(`[WEBHOOK] Pagamento rejeitado/cancelado: ${paymentId}`);
                
                await Order.findOneAndUpdate(
                    { id: order.id },
                    { 
                        status: 'cancelled',
                        paymentStatus: paymentData.status,
                        cancelledAt: new Date()
                    }
                );
            }

        } else if (req.body.type === 'merchant_order') {
            console.log(`[WEBHOOK] Merchant order recebido: ${req.body.data.id}`);
        }

        res.status(200).json({ received: true });

    } catch (error: any) {
        console.error('[WEBHOOK] Erro ao processar webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para testar webhook
router.post('/test', async (req, res) => {
    try {
        console.log('[WEBHOOK TEST] Notificação de teste recebida');
        res.status(200).json({ received: true, message: 'Webhook test received' });
    } catch (error: any) {
        console.error('[WEBHOOK TEST] Erro:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
