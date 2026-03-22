const mercadopago = require('mercadopago');
require('dotenv').config();

async function testMercadoPagoConfig() {
    try {
        console.log('[TEST] Iniciando teste da configuração do Mercado Pago...');
        
        // Verificar se o token está configurado
        if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
            throw new Error('MERCADO_PAGO_ACCESS_TOKEN não está configurado no .env');
        }
        
        console.log(`[TEST] Token configurado: ${process.env.MERCADO_PAGO_ACCESS_TOKEN.substring(0, 20)}...`);
        
        // Configurar SDK
        mercadopago.configure({
            access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
        });
        
        // Testar criação de pagamento PIX (valor mínimo R$1,00)
        console.log('[TEST] Testando criação de pagamento PIX...');
        
        const paymentData = {
            transaction_amount: 1.00,
            description: 'Teste de integração - LiveGo',
            payment_method_id: 'pix',
            external_reference: `test_${Date.now()}`,
            payer: {
                email: 'test@livego.store',
                first_name: 'Test',
                last_name: 'User',
                identification: {
                    type: 'CPF',
                    number: '00000000000'
                }
            }
        };
        
        const result = await mercadopago.payment.create(paymentData);
        
        console.log('[TEST SUCESSO] Pagamento PIX criado com sucesso!');
        console.log(`  - Payment ID: ${result.id}`);
        console.log(`  - Status: ${result.status}`);
        console.log(`  - QR Code: ${result.point_of_interaction?.transaction_data?.qr_code?.substring(0, 50)}...`);
        
        if (result.point_of_interaction?.transaction_data?.qr_code) {
            console.log('[TEST SUCESSO] QR Code gerado corretamente!');
        } else {
            console.log('[TEST AVISO] QR Code não encontrado na resposta');
            console.log('[DEBUG] Resposta completa:', JSON.stringify(result, null, 2));
        }
        
        // Testar buscar pagamento
        console.log('[TEST] Testando busca de pagamento...');
        const payment = await mercadopago.payment.get(result.id);
        console.log(`[TEST SUCESSO] Pagamento encontrado: Status ${payment.body.status}`);
        
        console.log('[TEST CONCLUÍDO] Integração com Mercado Pago está funcionando!');
        
    } catch (error) {
        console.error('[TEST ERRO] Falha na integração:', error.message);
        console.error('[DEBUG] Detalhes:', error);
        
        if (error.cause) {
            console.error('[DEBUG] Causa do erro:', JSON.stringify(error.cause, null, 2));
        }
    }
}

testMercadoPagoConfig();
