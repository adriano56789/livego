const { default: mercadopago, Payment } = require('mercadopago');
require('dotenv').config();

async function testCreditCardPayment() {
    try {
        console.log('[TEST] Iniciando teste de pagamento com cartão...');
        
        // Verificar se o token está configurado
        if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
            throw new Error('MERCADO_PAGO_ACCESS_TOKEN não está configurado');
        }
        
        console.log(`[TEST] Token configurado: ${process.env.MERCADO_PAGO_ACCESS_TOKEN.substring(0, 20)}...`);
        
        // Configurar SDK v2
        const client = new mercadopago({
            accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
        });
        
        // Testar criação de pagamento com cartão
        console.log('[TEST] Testando pagamento com cartão...');
        
        const payment = new Payment(client);
        
        const paymentData = {
            transaction_amount: 7.00,
            token: '5162926552027707', // Token do cartão (precisa ser gerado pelo frontend)
            description: 'LiveGo - Compra de 800 diamantes',
            installments: 1,
            payment_method_id: 'credit_card',
            external_reference: `test_card_${Date.now()}`,
            notification_url: process.env.NOTIFICATION_URL,
            payer: {
                email: 'adriano@livego.store',
                first_name: 'adriano',
                last_name: 's oliveira'
            }
        };
        
        console.log('[TEST] Dados do pagamento:', JSON.stringify(paymentData, null, 2));
        
        const result = await payment.create({ body: paymentData });
        
        console.log('[TEST SUCESSO] Pagamento com cartão processado!');
        console.log(`  - Payment ID: ${result.id}`);
        console.log(`  - Status: ${result.status}`);
        console.log(`  - Status Detail: ${result.status_detail}`);
        
        if (result.status === 'approved') {
            console.log('[TEST SUCESSO] Pagamento aprovado!');
        } else {
            console.log(`[TEST INFO] Pagamento com status: ${result.status} - ${result.status_detail}`);
        }
        
    } catch (error) {
        console.error('[TEST ERRO] Falha no pagamento:', error.message);
        console.error('[DEBUG] Detalhes:', error);
        
        if (error.cause) {
            console.error('[DEBUG] Causa do erro:', JSON.stringify(error.cause, null, 2));
        }
        
        // Verificar erros específicos comuns
        if (error.message.includes('token')) {
            console.log('[SUGESTÃO] O token do cartão precisa ser gerado pelo frontend usando o SDK do Mercado Pago');
        }
        
        if (error.message.includes('invalid')) {
            console.log('[SUGESTÃO] Dados do cartão inválidos ou expirados');
        }
    }
}

testCreditCardPayment();
