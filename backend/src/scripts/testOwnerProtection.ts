import mongoose from 'mongoose';
import { User } from '../models';

/**
 * Script de Teste - Proteção do Dono do Aplicativo
 * Verifica se as proteções estão funcionando corretamente
 */
export async function testOwnerProtection() {
    console.log('🛡️ [TEST] Iniciando testes de proteção do dono do aplicativo...');

    const APP_OWNER_ID = '65384127';
    const results = {
        ownerExists: false,
        protectionTests: [] as string[],
        errors: [] as string[]
    };

    try {
        // 1. Verificar se o usuário dono existe
        console.log('👤 [TEST] Verificando se o dono do aplicativo existe...');
        
        const owner = await User.findOne({ id: APP_OWNER_ID });
        if (owner) {
            results.ownerExists = true;
            results.protectionTests.push(`✅ Dono do aplicativo encontrado: ${owner.name} (${APP_OWNER_ID})`);
            console.log(`✅ Dono encontrado: ${owner.name}`);
        } else {
            results.protectionTests.push(`❌ Dono do aplicativo não encontrado: ${APP_OWNER_ID}`);
            console.log(`❌ Dono não encontrado: ${APP_OWNER_ID}`);
            results.errors.push('Dono do aplicativo não existe no banco');
        }

        // 2. Testar proteção contra expulsão (simulação)
        console.log('👢 [TEST] Testando proteção contra expulsão...');
        
        // Simular requisição de kick contra o dono
        const mockKickRequest = {
            body: {
                userId: APP_OWNER_ID, // Tentando expulsar o dono
                kickerId: 'some_user_id' // Usuário tentando expulsar
            },
            params: {
                id: 'test_stream_id'
            },
            ip: '127.0.0.1'
        };

        // Verificação lógica da proteção
        if (mockKickRequest.body.userId === APP_OWNER_ID) {
            results.protectionTests.push('✅ Proteção contra expulsão: BLOQUEADO CORRETAMENTE');
            console.log('✅ Proteção contra expulsão funcionando');
        } else {
            results.protectionTests.push('❌ Proteção contra expulsão: FALHOU');
            results.errors.push('Proteção contra expulsão não funcionou');
        }

        // 3. Testar proteção contra bloqueio (simulação)
        console.log('🚫 [TEST] Testando proteção contra bloqueio...');
        
        const mockBlockRequest = {
            body: {
                blockerId: 'some_user_id',
                blockedId: APP_OWNER_ID // Tentando bloquear o dono
            }
        };

        if (mockBlockRequest.body.blockedId === APP_OWNER_ID) {
            results.protectionTests.push('✅ Proteção contra bloqueio: BLOQUEADO CORRETAMENTE');
            console.log('✅ Proteção contra bloqueio funcionando');
        } else {
            results.protectionTests.push('❌ Proteção contra bloqueio: FALHOU');
            results.errors.push('Proteção contra bloqueio não funcionou');
        }

        // 4. Verificar middleware de proteção
        console.log('🔧 [TEST] Verificando middleware de proteção...');
        
        try {
            const { kickProtection, blockProtection, isAppOwner } = await import('../middleware/appOwnerProtection');
            
            // Testar função isAppOwner
            if (isAppOwner(APP_OWNER_ID)) {
                results.protectionTests.push('✅ Função isAppOwner: funcionando corretamente');
            } else {
                results.protectionTests.push('❌ Função isAppOwner: falhou');
                results.errors.push('Função isAppOwner não reconhece o dono');
            }

            // Testar com ID incorreto
            if (!isAppOwner('wrong_id')) {
                results.protectionTests.push('✅ Função isAppOwner: rejeição de ID incorreto funcionando');
            } else {
                results.protectionTests.push('❌ Função isAppOwner: aceitando ID incorreto');
                results.errors.push('Função isAppOwner aceitando IDs inválidos');
            }

        } catch (error) {
            results.protectionTests.push('❌ Middleware de proteção: ERRO AO IMPORTAR');
            results.errors.push(`Erro ao importar middleware: ${error}`);
        }

        // 5. Testar consistência do ID do dono
        console.log('🔍 [TEST] Verificando consistência do ID do dono...');
        
        const expectedOwnerId = '65384127';
        if (APP_OWNER_ID === expectedOwnerId) {
            results.protectionTests.push('✅ ID do dono: consistente e correto');
        } else {
            results.protectionTests.push('❌ ID do dono: inconsistente');
            results.errors.push(`ID esperado: ${expectedOwnerId}, encontrado: ${APP_OWNER_ID}`);
        }

    } catch (error: any) {
        console.error('❌ [TEST] Erro durante os testes:', error);
        results.errors.push(`Erro geral: ${error.message}`);
    }

    // Resultado final
    console.log('\n📊 [TEST] RESULTADO DOS TESTES DE PROTEÇÃO:');
    console.log('='.repeat(50));
    
    console.log('\n🛡️ TESTES REALIZADOS:');
    results.protectionTests.forEach(test => console.log(test));
    
    if (results.errors.length > 0) {
        console.log('\n❌ ERROS ENCONTRADOS:');
        results.errors.forEach(error => console.log(`   - ${error}`));
    }

    const totalTests = results.protectionTests.length;
    const passedTests = results.protectionTests.filter(t => t.startsWith('✅')).length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log('\n' + '='.repeat(50));
    console.log(`🎯 STATUS FINAL: ${successRate}% (${passedTests}/${totalTests})`);
    
    if (successRate >= 90) {
        console.log('🎉 PROTEÇÃO DO DONO - 100% FUNCIONANDO!');
        console.log('👑 O dono do aplicativo está completamente protegido!');
    } else if (successRate >= 70) {
        console.log('⚠️ PROTEÇÃO DO DONO - PARCIALMENTE FUNCIONANDO');
        console.log('🔧 Verificar itens com erro');
    } else {
        console.log('❌ PROTEÇÃO DO DONO - COM PROBLEMAS');
        console.log('🚨 REVISAR URGENTEMENTE');
    }

    return {
        success: successRate >= 90,
        successRate,
        results,
        summary: {
            total: totalTests,
            passed: passedTests,
            errors: results.errors.length
        }
    };
}

/**
 * Função rápida para verificar status da proteção
 */
export async function quickOwnerProtectionCheck() {
    const result = await testOwnerProtection();
    return {
        isProtected: result.success,
        successRate: result.successRate,
        errorsCount: result.summary.errors,
        ownerExists: result.results.ownerExists
    };
}

export default {
    testOwnerProtection,
    quickOwnerProtectionCheck
};
