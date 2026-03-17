// Teste para verificar configuração de método de saque
const mongoose = require('mongoose');
const { User } = require('./dist/models');

async function testWithdrawalMethod() {
    try {
        console.log('🧪 [TEST] Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/livego');
        
        // Buscar usuário de teste
        const testUserId = '10755083'; // ID de usuário existente
        const user = await User.findOne({ id: testUserId });
        
        if (!user) {
            console.log('❌ [TEST] Usuário de teste não encontrado');
            return;
        }
        
        console.log('✅ [TEST] Usuário encontrado:', user.name);
        console.log('📋 [TEST] Método de saque atual:', user.withdrawal_method);
        
        // Teste 1: Salvar método PIX
        console.log('\n🔸 [TEST 1] Salvando método PIX...');
        const pixMethod = {
            method: 'pix',
            details: { pixKey: '12345678900' }
        };
        
        await User.findOneAndUpdate(
            { id: testUserId },
            { withdrawal_method: pixMethod },
            { new: true }
        );
        
        console.log('✅ [TEST] Método PIX salvo');
        
        // Verificar se foi salvo
        const userAfterPix = await User.findOne({ id: testUserId });
        console.log('📋 [TEST] Após salvar PIX:', userAfterPix.withdrawal_method);
        
        // Teste 2: Salvar método Mercado Pago
        console.log('\n🔸 [TEST 2] Salvando método Mercado Pago...');
        const mercadoPagoMethod = {
            method: 'mercado_pago',
            details: { email: 'usuario@mercado_pago.com.br' }
        };
        
        await User.findOneAndUpdate(
            { id: testUserId },
            { withdrawal_method: mercadoPagoMethod },
            { new: true }
        );
        
        console.log('✅ [TEST] Método Mercado Pago salvo');
        
        // Verificar se foi salvo
        const userAfterMP = await User.findOne({ id: testUserId });
        console.log('📋 [TEST] Após salvar Mercado Pago:', userAfterMP.withdrawal_method);
        
        // Teste 3: Simular requisição da API
        console.log('\n🔸 [TEST 3] Simulando requisição POST /api/wallet/earnings/method/set/:id');
        
        const response = await fetch('http://localhost:3000/api/wallet/earnings/method/set/' + testUserId, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mercadoPagoMethod)
        });
        
        const responseData = await response.json();
        console.log('📡 [TEST] Resposta da API:', responseData);
        
        if (responseData.success) {
            console.log('✅ [TEST] API funcionando corretamente');
            console.log('📋 [TEST] Usuário retornado:', responseData.user.withdrawal_method);
        } else {
            console.log('❌ [TEST] Falha na API');
        }
        
    } catch (error) {
        console.error('❌ [TEST] Erro no teste:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 [TEST] Desconectado do MongoDB');
    }
}

testWithdrawalMethod();
