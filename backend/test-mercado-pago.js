// Teste de integração real com Mercado Pago
const mercadoPagoService = require('./dist/services/mercadoPagoService').default;

async function testMercadoPagoIntegration() {
    try {
        console.log('🧪 [TEST] Iniciando teste de integração com Mercado Pago...');
        
        // 1. Verificar configuração
        console.log('\n🔧 [CONFIG] Verificando configuração...');
        const config = mercadoPagoService.getConfigInfo();
        console.log('Configuração:', config);
        
        if (!mercadoPagoService.isConfigured()) {
            console.log('❌ [TEST] Mercado Pago não está configurado');
            return;
        }
        
        console.log('✅ [TEST] Mercado Pago configurado corretamente');
        
        // 2. Testar criação de pagamento (simulação)
        console.log('\n💸 [WITHDRAW] Testando criação de pagamento...');
        
        const testWithdrawal = {
            amount: 10.00, // R$ 10,00
            description: 'LiveGo - Teste de saque real',
            external_reference: `test_${Date.now()}`,
            payer_email: 'adrianomdk5@gmail.com' // Email de teste
        };
        
        console.log('Dados do teste:', testWithdrawal);
        
        const payment = await mercadoPagoService.makeWithdrawal(testWithdrawal);
        
        console.log('✅ [WITHDRAW] Pagamento criado com sucesso:');
        console.log('   ID:', payment.id);
        console.log('   Status:', payment.status);
        console.log('   Valor:', payment.amount);
        console.log('   Valor líquido:', payment.net_amount);
        console.log('   Taxa:', payment.fee_amount);
        
        // 3. Verificar status do pagamento
        console.log('\n🔍 [STATUS] Verificando status do pagamento...');
        const status = await mercadoPagoService.getPaymentStatus(payment.id);
        
        console.log('Status atual:', status);
        
        // 4. Testar cancelamento (se estiver pendente)
        if (status.status === 'pending') {
            console.log('\n❌ [CANCEL] Cancelando pagamento de teste...');
            const cancelled = await mercadoPagoService.cancelPayment(payment.id);
            console.log('Cancelamento:', cancelled ? 'Sucesso' : 'Falha');
        }
        
        console.log('\n🎉 [TEST] Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ [TEST] Erro no teste:', error.message);
        if (error.response?.data) {
            console.error('Detalhes do erro:', error.response.data);
        }
    }
}

// Executar teste
testMercadoPagoIntegration();
