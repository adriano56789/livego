// Teste para verificar se as variáveis de ambiente estão sendo carregadas
require('dotenv').config({ path: '.env.production' });

console.log('🔍 [ENV TEST] Verificando variáveis de ambiente:');
console.log(`MERCADO_PAGO_ACCESS_TOKEN: ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`);
console.log(`MERCADO_PAGO_PUBLIC_KEY: ${process.env.MERCADO_PAGO_PUBLIC_KEY}`);
console.log(`MERCADO_PAGO_CLIENT_ID: ${process.env.MERCADO_PAGO_CLIENT_ID}`);
console.log(`MERCADO_PAGO_CLIENT_SECRET: ${process.env.MERCADO_PAGO_CLIENT_SECRET?.substring(0, 10)}...`);
console.log(`WEBHOOK_URL: ${process.env.WEBHOOK_URL}`);
console.log(`NOTIFICATION_URL: ${process.env.NOTIFICATION_URL}`);

// Testar se o token é válido fazendo uma requisição simples
const axios = require('axios');

async function testToken() {
    try {
        console.log('\n🧪 [TOKEN TEST] Testando token...');
        
        const response = await axios.get('https://api.mercadopago.com/users/me', {
            headers: {
                'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
            }
        });
        
        console.log('✅ Token VÁLIDO!');
        console.log(`Usuário: ${response.data.first_name} ${response.data.last_name}`);
        console.log(`ID: ${response.data.id}`);
        
    } catch (error) {
        console.log('❌ Token INVÁLIDO:');
        console.log(`Status: ${error.response?.status}`);
        console.log(`Erro: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.status === 401) {
            console.log('\n🔧 [SOLUTION] O token está inválido. Verifique:');
            console.log('1. Se o token está correto no painel Mercado Pago');
            console.log('2. Se a aplicação está ativa para produção');
            console.log('3. Se as permissões estão configuradas');
        }
    }
}

testToken();
