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

        // Gerar PIX real via Mercado Pago
        const pixData = {
            transaction_amount: order.amount,
            description: `LiveGo - Compra de ${order.diamonds} diamantes`,
            payment_method_id: 'pix',
            external_reference: `purchase_${orderId}_${Date.now()}`,
            notification_url: process.env.NOTIFICATION_URL,
            payer: {
                email: req.body.payerEmail || 'comprador@livego.store',
                first_name: req.body.payerFirstName || 'Comprador',
                last_name: req.body.payerLastName || 'LiveGo',
                identification: {
                    type: 'CPF',
                    number: req.body.payerCpf || '00000000000'
                }
            }
        };

        // Criar pagamento no Mercado Pago usando SDK oficial v2
        const { default: mercadopago, Payment } = require('mercadopago');
        
        // Inicializar o SDK v2
        const client = new mercadopago({
            access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
        });
        
        console.log(`[PIX PRODUCTION] Criando PIX real para order ${orderId}: R$${order.amount} (${order.diamonds} diamantes)`);
        console.log(`[DEBUG] Token prefix: ${process.env.MERCADO_PAGO_ACCESS_TOKEN?.substring(0, 20)}...`);
        
        try {
            const paymentData = {
                transaction_amount: order.amount,
                description: `LiveGo - Compra de ${order.diamonds} diamantes`,
                payment_method_id: 'pix',
                external_reference: `purchase_${orderId}_${Date.now()}`,
                notification_url: process.env.NOTIFICATION_URL,
                payer: {
                    email: req.body.payerEmail || 'comprador@livego.store',
                    first_name: req.body.payerFirstName || 'Comprador',
                    last_name: req.body.payerLastName || 'LiveGo',
                    identification: {
                        type: 'CPF',
                        number: req.body.payerCpf || '00000000000'
                    }
                }
            };
            
            // Usar a API v2 correta
            const payment = new Payment(client);
            const result = await payment.create({ body: paymentData });
            
            console.log('[MERCADO PAGO SUCCESS] Pagamento criado:', result.id);
        
            // Extrair dados do PIX da resposta correta da API v2
            const pixCode = result.point_of_interaction?.transaction_data?.qr_code;
            const qrCodeBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64;

            if (!pixCode) {
                console.error('[PIX ERROR] Resposta do Mercado Pago (sem qr_code):', JSON.stringify(result, null, 2));
                throw new Error('Mercado Pago não retornou o código PIX (Copia e Cola). Verifique se a conta tem uma chave PIX configurada.');
            }
            
            if (!qrCodeBase64) {
                console.warn('[PIX WARNING] QR Code base64 ausente na resposta');
            }

            // Atualizar ordem com dados do pagamento
            const externalReference = result.external_reference;
            await Order.findOneAndUpdate(
                { id: orderId },
                {
                    externalReference: externalReference,
                    mpPaymentId: result.id,
                    pixCode: pixCode,
                    pixQrCode: qrCodeBase64,
                    pixExpiration: result.date_of_expiration
                }
            );
            
            const pixResponse = {
                success: true,
                pixCode: pixCode,
                qrCode: qrCodeBase64,
                expiration: result.date_of_expiration,
                orderId: orderId,
                amount: order.amount,
                diamonds: order.diamonds,
                mpPaymentId: result.id
            };

            console.log(`[PIX SUCCESS] PIX REAL gerado para order ${orderId}:`);
            console.log(`  - Valor: R$${order.amount} (${order.diamonds} diamantes)`);
            console.log(`  - PIX Code: ${pixCode?.substring(0, 50)}...`);
            console.log(`  - Expiração: ${result.date_of_expiration}`);
            console.log(`  - MP Payment ID: ${result.id}`);
            console.log(`  - External Reference: ${externalReference}`);
            
            res.json(pixResponse);
        } catch (err: any) {
            console.error('[PIX ERROR] Erro ao gerar PIX com SDK:', err);
            res.status(500).json({ error: err.message });
        }
    } catch (err: any) {
        console.error('[PIX ERROR] Erro ao gerar PIX:', err);
        res.status(500).json({ error: err.message });
    }
});
router.post('/credit-card', FraudDetectionMiddleware.detectFraud, async (req, res) => {
    try {
        const { orderId, cardToken, payerEmail, payerName, installments = 1 } = req.body;
        
        // Verificar se a order existe
        const order = await Order.findOne({ id: orderId });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Gerar pagamento com cartão via Mercado Pago
        const { default: mercadopago, Payment } = require('mercadopago');
        
        // Verificar se está configurado para produção
        if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
            throw new Error('Mercado Pago Access Token não configurado');
        }
        
        // Inicializar o SDK v2
        const client = new mercadopago({
            access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
        });
        
        console.log(`[CREDIT CARD PRODUCTION] Processando cartão real para order ${orderId}: R$${order.amount} (${order.diamonds} diamantes)`);
        
        const cardData = {
            transaction_amount: order.amount,
            token: cardToken,
            description: `LiveGo - Compra de ${order.diamonds} diamantes`,
            installments: parseInt(installments),
            payment_method_id: 'credit_card',
            external_reference: `purchase_${orderId}_${Date.now()}`,
            notification_url: process.env.NOTIFICATION_URL,
            payer: {
                email: payerEmail,
                name: payerName
            }
        };

        const payment = new Payment(client);
        const result = await payment.create({ body: cardData });
        
        res.json({ 
            success: true, 
            status: result.status,
            orderId: orderId,
            mpPaymentId: result.id,
            message: 'Pagamento processado'
        });
    } catch (err: any) {
        console.error(`[CREDIT CARD ERROR] Erro ao processar pagamento:`, err);
        res.status(500).json({ error: err.message });
    }
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
