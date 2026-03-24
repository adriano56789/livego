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

        // Criar pagamento no Mercado Pago usando API REST diretamente
        const axios = require('axios');
        
        // Verificar se está configurado para produção
        if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
            throw new Error('Mercado Pago Access Token não configurado');
        }
        
        // Validar token antes de continuar
        if (process.env.MERCADO_PAGO_ACCESS_TOKEN.includes('TEST') || process.env.MERCADO_PAGO_ACCESS_TOKEN.length < 50) {
            console.error('[PIX ERROR] Token inválido ou de teste detectado');
            return res.status(500).json({ 
                error: 'Configuração do Mercado Pago inválida',
                details: 'Token de acesso inválido'
            });
        }
        
        console.log(`[PIX PRODUCTION] Criando PIX real para order ${orderId}: R$${order.amount} (${order.diamonds} diamantes)`);
        console.log(`[DEBUG] Token prefix: ${process.env.MERCADO_PAGO_ACCESS_TOKEN.substring(0, 20)}...`);
        console.log(`[DEBUG] Token length: ${process.env.MERCADO_PAGO_ACCESS_TOKEN.length}`);
        
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
            
            console.log('[MERCADO PAGO] Enviando requisição para API REST...');
            
            const response = await axios.post('https://api.mercadopago.com/v1/payments', paymentData, {
                headers: {
                    'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': `pix_${orderId}_${Date.now()}`
                }
            });
            
            const result = response.data;
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
            console.error('[PIX ERROR] Erro ao gerar PIX:', err);
            console.log('[DEBUG] Detalhes do erro:', {
                message: err.message,
                status: err.status,
                responseStatus: err.response?.status,
                responseData: err.response?.data,
                error: err.error
            });
            
            // Sem fallback - apenas retorna erro real para debugging
            if (err.response?.data?.message?.includes('without key enabled')) {
                return res.status(400).json({ 
                    error: 'Conta Mercado Pago sem chave PIX configurada',
                    details: 'Configure uma chave PIX na conta Mercado Pago para gerar pagamentos',
                    mpError: err.response?.data
                });
            }
            
            res.status(500).json({ 
                error: 'Erro ao gerar PIX',
                details: err.message,
                mpError: err.response?.data
            });
        }
    } catch (err: any) {
        console.error('[PIX ERROR] Erro ao gerar PIX:', err);
        res.status(500).json({ error: err.message });
    }
});
router.post('/credit-card', FraudDetectionMiddleware.detectFraud, async (req, res) => {
    try {
        const { orderId, cardToken, payerEmail, payerName, installments = 1 } = req.body;
        
        if (!cardToken) {
            return res.status(400).json({ error: 'Card token is required' });
        }
        
        // Verificar se a order existe
        const order = await Order.findOne({ id: orderId });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Gerar pagamento com cartão via Mercado Pago API REST
        const axios = require('axios');
        
        // Verificar se está configurado para produção
        if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
            throw new Error('Mercado Pago Access Token não configurado');
        }
        
        console.log(`[CREDIT CARD PRODUCTION] Processando cartão real para order ${orderId}: R$${order.amount} (${order.diamonds} diamantes)`);
        console.log(`[DEBUG] Token prefix: ${process.env.MERCADO_PAGO_ACCESS_TOKEN.substring(0, 20)}...`);
        console.log(`[DEBUG] Installments: ${installments}`);
        
        const cardData = {
            transaction_amount: order.amount,
            token: cardToken, // Token seguro gerado pelo frontend
            description: `LiveGo - Compra de ${order.diamonds} diamantes`,
            installments: parseInt(installments),
            payment_method_id: 'credit_card',
            external_reference: `purchase_${orderId}_${Date.now()}`,
            notification_url: process.env.NOTIFICATION_URL,
            payer: {
                email: payerEmail,
                first_name: payerName?.split(' ')[0] || 'Comprador',
                last_name: payerName?.split(' ').slice(1).join(' ') || 'LiveGo',
                identification: {
                    type: 'CPF',
                    number: req.body.payerCpf || '00000000000'
                }
            }
        };

        console.log('[MERCADO PAGO] Enviando requisição de cartão para API REST...');

        const response = await axios.post('https://api.mercadopago.com/v1/payments', cardData, {
            headers: {
                'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `card_${orderId}_${Date.now()}`
            }
        });
        
        const result = response.data;
        console.log('[MERCADO PAGO SUCCESS] Pagamento com cartão criado:', result.id);
        console.log(`[CREDIT CARD SUCCESS] Status: ${result.status} | Order: ${orderId} | Valor: R$${order.amount}`);
        
        // Atualizar ordem com dados do pagamento
        await Order.findOneAndUpdate(
            { id: orderId },
            {
                externalReference: `purchase_${orderId}`,
                mpPaymentId: result.id,
                paymentStatus: result.status,
                paymentMethod: 'credit_card',
                paymentData: {
                    status: result.status,
                    status_detail: result.status_detail,
                    payment_method_id: result.payment_method_id,
                    payment_type_id: result.payment_type_id,
                    installments: result.installments,
                    card: {
                        first_six_digits: result.card?.first_six_digits,
                        last_four_digits: result.card?.last_four_digits,
                        cardholder: result.card?.cardholder
                    }
                }
            }
        );
        
        res.json({ 
            success: true, 
            status: result.status,
            status_detail: result.status_detail,
            orderId: orderId,
            mpPaymentId: result.id,
            paymentMethod: 'credit_card',
            installments: result.installments,
            cardInfo: {
                firstSix: result.card?.first_six_digits,
                lastFour: result.card?.last_four_digits,
                cardholder: result.card?.cardholder?.name
            },
            message: result.status === 'approved' ? 'Pagamento aprovado' : 'Pagamento em processamento'
        });
    } catch (err: any) {
        console.error('[CREDIT CARD ERROR] Erro ao processar pagamento:', err);
        console.log('[DEBUG] Detalhes do erro:', {
            message: err.message,
            status: err.status,
            responseStatus: err.response?.status,
            responseData: err.response?.data,
            error: err.error
        });
        
        // Tratamento específico para erros comuns do cartão
        if (err.response?.data) {
            const mpError = err.response.data;
            
            if (mpError.message?.includes('card_token')) {
                return res.status(400).json({ 
                    error: 'Token do cartão inválido',
                    details: 'Gere um novo token do cartão no frontend',
                    mpError: mpError
                });
            }
            
            if (mpError.message?.includes('insufficient')) {
                return res.status(400).json({ 
                    error: 'Saldo insuficiente',
                    details: 'Cartão sem limite disponível',
                    mpError: mpError
                });
            }
            
            if (mpError.message?.includes('invalid')) {
                return res.status(400).json({ 
                    error: 'Dados do cartão inválidos',
                    details: 'Verifique os dados do cartão',
                    mpError: mpError
                });
            }
        }
        
        res.status(500).json({ 
            error: 'Erro ao processar pagamento com cartão',
            details: err.message,
            mpError: err.response?.data
        });
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
