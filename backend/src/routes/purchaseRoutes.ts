import express from 'express';
import { Order, User, PurchaseRecord } from '../models';
import FraudDetectionMiddleware from '../middleware/fraudDetection';

const router = express.Router();

// Confirmar compra de diamantes
router.post('/confirm', FraudDetectionMiddleware.detectFraud, async (req, res) => {
    try {
        const { orderId, paymentConfirmationId, paymentStatus } = req.body;
        
        console.log(`[PURCHASE CONFIRM] Confirmando compra: ${orderId}`);
        
        // VALIDAÇÃO OBRIGATÓRIA: Só processar se pagamento foi confirmado
        if (!paymentConfirmationId || paymentStatus !== 'approved') {
            console.log(`[FRAUD ATTEMPT] Tentativa de confirmação sem pagamento aprovado: Order=${orderId}, Status=${paymentStatus}`);
            
            // Banir tentativa de fraude
            const clientIp = req.ip || req.connection.remoteAddress;
            const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
            const order = await Order.findOne({ id: orderId });
            
            if (order && clientIp && deviceFingerprint) {
                await FraudDetectionMiddleware.banRelatedEntities(
                    clientIp,
                    deviceFingerprint,
                    order.userId,
                    '',
                    'Tentativa de confirmação de pagamento sem aprovação real',
                    { orderId, paymentStatus, timestamp: new Date() }
                );
            }
            
            return res.status(400).json({ 
                error: 'Pagamento não confirmado',
                details: 'Apenas pagamentos aprovados podem gerar diamantes'
            });
        }
        
        const order = await Order.findOne({ id: orderId });
        if (!order) {
            console.log(`[PURCHASE ERROR] Order não encontrada: ${orderId}`);
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // VERIFICAÇÃO DUPLA: Order já está paga?
        if (order.status === 'paid') {
            console.log(`[FRAUD ATTEMPT] Tentativa de confirmação duplicada: Order=${orderId}`);
            return res.status(400).json({
                error: 'Order já processada',
                details: 'Esta compra já foi confirmada anteriormente'
            });
        }
        
        // VALIDAÇÃO FINAL: Order deve estar 'pending' para ser confirmada
        if (order.status !== 'pending') {
            console.log(`[FRAUD ATTEMPT] Order com status inválido: Order=${orderId}, Status=${order.status}`);
            return res.status(400).json({
                error: 'Order inválida',
                details: 'Status da order não permite confirmação'
            });
        }

        console.log(`[PURCHASE CONFIRM] Order validada:`, {
            orderId: order.id,
            userId: order.userId,
            diamonds: order.diamonds,
            amount: order.amount,
            paymentConfirmationId
        });

        // ATUALIZAR STATUS PARA PAID (só após validação completa)
        const updatedOrder = await Order.findOneAndUpdate(
            { id: orderId }, 
            { 
                status: 'paid',
                paymentConfirmationId,
                confirmedAt: new Date()
            }, 
            { new: true }
        );

        const user = await User.findOneAndUpdate(
            { id: order.userId },
            { $inc: { diamonds: order.diamonds } },
            { new: true }
        );

        if (!user) {
            console.log(`[PURCHASE ERROR] Usuário não encontrado: ${order.userId}`);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[PURCHASE SUCCESS] Usuário ${user.name} recebeu ${order.diamonds} diamantes. Saldo atual: ${user.diamonds}`);

        // Registrar compra no histórico
        await PurchaseRecord.create({
            id: `purchase_${orderId}_${Date.now()}`,
            userId: order.userId,
            type: 'diamond_purchase',
            description: `Compra de ${order.diamonds} diamantes - Pagamento confirmado: ${paymentConfirmationId}`,
            amountBRL: order.amount,
            amountCoins: order.diamonds,
            status: 'Concluído',
            timestamp: new Date()
        });

        res.json({ success: true, user, order: updatedOrder });
    } catch (err: any) {
        console.error(`[PURCHASE ERROR] Erro ao confirmar compra:`, err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
