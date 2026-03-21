// Teste simples para verificar se os tipos funcionam
require('dotenv').config({ path: '.env.production' });
console.log('Environment check:');
console.log('MERCADO_PAGO_ACCESS_TOKEN:', process.env.MERCADO_PAGO_ACCESS_TOKEN ? '✅ Loaded' : '❌ Not loaded');
console.log('MERCADO_PAGO_CLIENT_ID:', process.env.MERCADO_PAGO_CLIENT_ID ? '✅ Loaded' : '❌ Not loaded');
console.log('MERCADO_PAGO_CLIENT_SECRET:', process.env.MERCADO_PAGO_CLIENT_SECRET ? '✅ Loaded' : '❌ Not loaded');

const mercadoPagoService = require('./dist/mercadoPagoService').default;

async function testTypes() {
    try {
        console.log('🧪 [TEST] Testando tipos TypeScript...');
        
        // Testar configuração
        const config = mercadoPagoService.getConfigInfo();
        console.log('Config:', config);
        
        // Testar se está configurado
        const isConfigured = mercadoPagoService.isConfigured();
        console.log('Is configured:', isConfigured);
        
        console.log('✅ [TEST] Teste de tipos concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ [TEST] Erro:', error.message);
    }
}

testTypes();
