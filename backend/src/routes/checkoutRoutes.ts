import express from 'express';
import { Order } from '../models';
import FraudDetectionMiddleware from '../middleware/fraudDetection';

const router = express.Router();

const diamondPackages = [
    { id: 'pack1', diamonds: 800, price: 7.00, bonus: 0, icon: 'gem' },
    { id: 'pack2', diamonds: 3000, price: 25.00, bonus: 0, icon: 'gem_stack' },
    { id: 'pack3', diamonds: 6000, price: 60.00, bonus: 0, icon: 'chest' },
    { id: 'pack4', diamonds: 20000, price: 180.00, bonus: 0, icon: 'treasure' },
    { id: 'pack5', diamonds: 36000, price: 350.00, bonus: 0, icon: 'crown' },
    { id: 'pack6', diamonds: 65000, price: 600.00, bonus: 0, icon: 'diamond_throne' }
];

router.get('/pack', async (req, res) => res.json(diamondPackages));
router.post('/order', FraudDetectionMiddleware.detectFraud, async (req, res) => {
    try {
        console.log(`[ORDER CREATE] Criando order:`, req.body);
        
        const order = await Order.create({ 
            ...req.body, 
            id: Date.now().toString(), 
            status: 'pending',
            timestamp: new Date()
        });
        
        console.log(`[ORDER SUCCESS] Order criada: ${order.id} para usuário ${order.userId}`);
        res.json(order);
    } catch (err: any) {
        console.error(`[ORDER ERROR] Erro ao criar order:`, err);
        res.status(500).json({ error: err.message });
    }
});
router.post('/pix', FraudDetectionMiddleware.detectFraud, async (req, res) => {
    try {
        const { orderId } = req.body;
        console.log(`[PIX PAYMENT] Gerando PIX para order: ${orderId}`);
        
        // Verificar se a order existe
        const order = await Order.findOne({ id: orderId });
        if (!order) {
            console.log(`[PIX ERROR] Order não encontrada: ${orderId}`);
            return res.status(404).json({ error: 'Order not found' });
        }

        const pixResponse = {
            success: true,
            pixCode: `test-pix-${orderId}-${Date.now()}`,
            expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
            orderId: orderId,
            amount: order.amount,
            diamonds: order.diamonds
        };

        console.log(`[PIX SUCCESS] PIX gerado para order ${orderId}: R$${order.amount} (${order.diamonds} diamantes)`);
        
        res.json(pixResponse);
    } catch (err: any) {
        console.error(`[PIX ERROR] Erro ao gerar PIX:`, err);
        res.status(500).json({ error: err.message });
    }
});
router.post('/credit-card', FraudDetectionMiddleware.detectFraud, async (req, res) => {
    res.json({ success: true, message: 'Pago', orderId: req.body.orderId });
});
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

        const user = await import('../models').then(m => m.User).then(U => U.findOneAndUpdate(
            { id: order.userId },
            { $inc: { diamonds: order.diamonds } },
            { new: true }
        ));

        if (!user) {
            console.log(`[PURCHASE ERROR] Usuário não encontrado: ${order.userId}`);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[PURCHASE SUCCESS] Usuário ${user.name} recebeu ${order.diamonds} diamantes. Saldo atual: ${user.diamonds}`);

        // Registrar compra no histórico
        const PurchaseRecord = (await import('../models')).PurchaseRecord;
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
