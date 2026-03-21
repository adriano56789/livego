// Teste completo do fluxo de saque real com Mercado Pago
const axios = require('axios');

async function testRealWithdrawal() {
    try {
        console.log('🧪 [TEST] Iniciando teste de saque REAL...');
        
        // Configuração
        const BASE_URL = 'http://localhost:3000';
        const TEST_USER_ID = '10755083'; // ID de usuário existente
        const WITHDRAWAL_AMOUNT = 100; // 100 diamantes
        
        // 1. Verificar configuração do Mercado Pago
        console.log('\n🔧 [CONFIG] Verificando configuração...');
        const configResponse = await axios.get(`${BASE_URL}/api/payments/config`);
        console.log('Configuração:', configResponse.data);
        
        if (!configResponse.data.configured) {
            console.log('❌ [TEST] Mercado Pago não está configurado');
            return;
        }
        
        // 2. Verificar saldo atual do usuário
        console.log('\n💰 [BALANCE] Verificando saldo...');
        const balanceResponse = await axios.get(`${BASE_URL}/api/wallet/earnings/get/${TEST_USER_ID}`);
        console.log('Saldo atual:', balanceResponse.data);
        
        if (balanceResponse.data.available_diamonds < WITHDRAWAL_AMOUNT) {
            console.log(`❌ [TEST] Saldo insuficiente. Disponível: ${balanceResponse.data.available_diamonds}, Solicitado: ${WITHDRAWAL_AMOUNT}`);
            return;
        }
        
        // 3. Verificar método de saque configurado
        console.log('\n🏦 [METHOD] Verificando método de saque...');
        if (!balanceResponse.data.withdrawal_method) {
            console.log('❌ [TEST] Método de saque não configurado');
            console.log('Configure o método de saque primeiro via POST /api/wallet/earnings/method/set/:id');
            return;
        }
        console.log('Método configurado:', balanceResponse.data.withdrawal_method);
        
        // 4. Calcular valores do saque
        console.log('\n🧮 [CALC] Calculando valores...');
        const calcResponse = await axios.post(`${BASE_URL}/api/wallet/earnings/calculate`, {
            amount: WITHDRAWAL_AMOUNT
        });
        console.log('Cálculo do saque:', calcResponse.data);
        
        // 5. Realizar saque REAL
        console.log('\n💸 [WITHDRAW] Realizando saque REAL...');
        console.log(`ATENÇÃO: Este será um saque REAL de ${WITHDRAWAL_AMOUNT} diamantes!`);
        console.log('Valor líquido a receber:', calcResponse.data.net_brl);
        
        // Confirmar com o usuário
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
            rl.question('Deseja prosseguir com o saque REAL? (s/N): ', resolve);
        });
        rl.close();
        
        if (answer.toLowerCase() !== 's') {
            console.log('❌ [TEST] Teste cancelado pelo usuário');
            return;
        }
        
        // Executar saque
        const withdrawResponse = await axios.post(`${BASE_URL}/api/wallet/withdraw/${TEST_USER_ID}`, {
            amount: WITHDRAWAL_AMOUNT
        });
        
        console.log('✅ [WITHDRAW] Saque realizado com sucesso!');
        console.log('Resposta:', withdrawResponse.data);
        
        // 6. Verificar status do pagamento (se tiver ID)
        if (withdrawResponse.data.mp_payment_id) {
            console.log('\n🔍 [STATUS] Verificando status do pagamento...');
            const statusResponse = await axios.get(`${BASE_URL}/api/payments/status/${withdrawResponse.data.mp_payment_id}`);
            console.log('Status do pagamento:', statusResponse.data);
        }
        
        // 7. Verificar saldo após saque
        console.log('\n💰 [AFTER] Verificando saldo após saque...');
        const afterBalanceResponse = await axios.get(`${BASE_URL}/api/wallet/earnings/get/${TEST_USER_ID}`);
        console.log('Saldo após saque:', afterBalanceResponse.data);
        
        console.log('\n🎉 [TEST] Teste de saque REAL concluído!');
        console.log('Resumo:');
        console.log(`- Diamantes sacados: ${WITHDRAWAL_AMOUNT}`);
        console.log(`- Valor líquido: R$ ${calcResponse.data.net_brl}`);
        console.log(`- Taxa plataforma: R$ ${calcResponse.data.platform_fee_brl}`);
        console.log(`- ID Pagamento MP: ${withdrawResponse.data.mp_payment_id}`);
        console.log(`- Saldo restante: ${afterBalanceResponse.data.available_diamonds} diamantes`);
        
    } catch (error) {
        console.error('❌ [TEST] Erro no teste:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', error.response.data);
        }
    }
}

// Executar teste
testRealWithdrawal();
