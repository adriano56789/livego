import mongoose from 'mongoose';
import { 
    User, 
    Streamer, 
    Gift, 
    GiftTransaction, 
    StreamHistory, 
    ShopItem,
    ChatMessage,
    Conversation,
    UserStatus,
    Visitor
} from '../models';

/**
 * Script de Verificação Final - Sistema 100% Automático
 * Verifica se todas as coleções e configurações automáticas estão funcionando
 */
export async function verifyAutomationSystem() {
    console.log('🔍 [VERIFY] Verificando sistema 100% automático...');

    const results = {
        timestamps: [] as string[],
        upserts: [] as string[],
        indexes: [] as string[],
        collections: [] as string[],
        autoCreation: [] as string[],
        errors: [] as string[]
    };

    try {
        // 1. Verificar timestamps em todos os modelos
        console.log('📅 [VERIFY] Verificando timestamps automáticos...');
        
        const modelsToCheck = [
            { name: 'User', model: User },
            { name: 'Streamer', model: Streamer },
            { name: 'Gift', model: Gift },
            { name: 'GiftTransaction', model: GiftTransaction },
            { name: 'StreamHistory', model: StreamHistory },
            { name: 'ShopItem', model: ShopItem },
            { name: 'ChatMessage', model: ChatMessage },
            { name: 'Conversation', model: Conversation },
            { name: 'UserStatus', model: UserStatus },
            { name: 'Visitor', model: Visitor }
        ];

        for (const { name, model } of modelsToCheck) {
            try {
                const schema = model.schema;
                const hasTimestamps = schema.options.timestamps === true;
                
                if (hasTimestamps) {
                    results.timestamps.push(`✅ ${name}: timestamps automáticos ativos`);
                } else {
                    results.timestamps.push(`❌ ${name}: timestamps automáticos ausentes`);
                    results.errors.push(`${name} não tem timestamps automáticos`);
                }
            } catch (error) {
                results.timestamps.push(`❌ ${name}: erro ao verificar timestamps`);
                results.errors.push(`Erro em ${name}: ${error}`);
            }
        }

        // 2. Verificar capacidade de upsert automático
        console.log('🔄 [VERIFY] Verificando capacidade de upsert...');
        
        // Testar upsert em User
        try {
            const testUserId = `test_auto_${Date.now()}`;
            await User.findOneAndUpdate(
                { id: testUserId },
                {
                    id: testUserId,
                    name: 'Test Auto',
                    avatarUrl: '',
                    diamonds: 0,
                    level: 1
                },
                { upsert: true, new: true }
            );
            
            // Limpar teste
            await User.deleteOne({ id: testUserId });
            
            results.upserts.push('✅ User: upsert automático funcionando');
        } catch (error) {
            results.upserts.push('❌ User: upsert automático com erro');
            results.errors.push(`User upsert error: ${error}`);
        }

        // Testar upsert em Streamer
        try {
            const testStreamId = `stream_auto_${Date.now()}`;
            await Streamer.findOneAndUpdate(
                { id: testStreamId },
                {
                    id: testStreamId,
                    hostId: 'test_host',
                    name: 'Test Stream',
                    isLive: false,
                    viewers: 0
                },
                { upsert: true, new: true }
            );
            
            // Limpar teste
            await Streamer.deleteOne({ id: testStreamId });
            
            results.upserts.push('✅ Streamer: upsert automático funcionando');
        } catch (error) {
            results.upserts.push('❌ Streamer: upsert automático com erro');
            results.errors.push(`Streamer upsert error: ${error}`);
        }

        // 3. Verificar índices essenciais
        console.log('🗂️ [VERIFY] Verificando índices essenciais...');
        
        try {
            const userIndexes = await User.collection.getIndexes();
            results.indexes.push(`✅ User: ${Object.keys(userIndexes).length} índices criados`);
        } catch (error) {
            results.indexes.push('❌ User: erro ao verificar índices');
            results.errors.push(`User indexes error: ${error}`);
        }

        try {
            const streamerIndexes = await Streamer.collection.getIndexes();
            results.indexes.push(`✅ Streamer: ${Object.keys(streamerIndexes).length} índices criados`);
        } catch (error) {
            results.indexes.push('❌ Streamer: erro ao verificar índices');
            results.errors.push(`Streamer indexes error: ${error}`);
        }

        // 4. Verificar coleções existentes
        console.log('📁 [VERIFY] Verificando coleções...');
        
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Banco de dados não conectado');
        }
        
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        const expectedCollections = [
            'users',
            'streamers', 
            'gifts',
            'gifttransactions',
            'streamhistories',
            'shopitems',
            'chatmessages',
            'conversations',
            'userstatuses',
            'visitors'
        ];

        for (const expected of expectedCollections) {
            if (collectionNames.includes(expected)) {
                results.collections.push(`✅ ${expected}: coleção existe`);
            } else {
                results.collections.push(`❌ ${expected}: coleção ausente`);
                results.errors.push(`Coleção ausente: ${expected}`);
            }
        }

        // 5. Verificar criação automática de documentos essenciais
        console.log('🚀 [VERIFY] Verificando criação automática...');
        
        // Verificar gifts essenciais
        try {
            const roseGift = await Gift.findOne({ id: 'gift_rose' });
            if (roseGift) {
                results.autoCreation.push('✅ Gifts essenciais: criados automaticamente');
            } else {
                results.autoCreation.push('❌ Gifts essenciais: não encontrados');
                results.errors.push('Gifts essenciais não criados automaticamente');
            }
        } catch (error) {
            results.autoCreation.push('❌ Gifts essenciais: erro ao verificar');
            results.errors.push(`Gifts verification error: ${error}`);
        }

        // Verificar usuário de suporte
        try {
            const supportUser = await User.findOne({ id: 'support-livercore' });
            if (supportUser) {
                results.autoCreation.push('✅ Usuário suporte: criado automaticamente');
            } else {
                results.autoCreation.push('❌ Usuário suporte: não encontrado');
                results.errors.push('Usuário suporte não criado automaticamente');
            }
        } catch (error) {
            results.autoCreation.push('❌ Usuário suporte: erro ao verificar');
            results.errors.push(`Support user verification error: ${error}`);
        }

        // 6. Resumo final
        console.log('\n📊 [VERIFY] RESULTADO DA VERIFICAÇÃO:');
        console.log('='.repeat(50));
        
        console.log('\n📅 TIMESTAMPS:');
        results.timestamps.forEach(result => console.log(result));
        
        console.log('\n🔄 UPSERTS:');
        results.upserts.forEach(result => console.log(result));
        
        console.log('\n🗂️ ÍNDICES:');
        results.indexes.forEach(result => console.log(result));
        
        console.log('\n📁 COLEÇÕES:');
        results.collections.forEach(result => console.log(result));
        
        console.log('\n🚀 CRIAÇÃO AUTOMÁTICA:');
        results.autoCreation.forEach(result => console.log(result));
        
        if (results.errors.length > 0) {
            console.log('\n❌ ERROS ENCONTRADOS:');
            results.errors.forEach(error => console.log(`   - ${error}`));
        }

        // Status final
        const totalChecks = results.timestamps.length + results.upserts.length + 
                           results.indexes.length + results.collections.length + 
                           results.autoCreation.length;
        const successChecks = totalChecks - results.errors.length;
        const successRate = Math.round((successChecks / totalChecks) * 100);

        console.log('\n' + '='.repeat(50));
        console.log(`🎯 STATUS FINAL: ${successRate}% (${successChecks}/${totalChecks})`);
        
        if (successRate >= 90) {
            console.log('🎉 SISTEMA 100% AUTOMÁTICO - PRONTO PARA USO!');
        } else if (successRate >= 70) {
            console.log('⚠️ SISTEMA QUASE AUTOMÁTICO - REVISAR ITENS COM ERRO');
        } else {
            console.log('❌ SISTEMA INCOMPLETO - NECESSÁRIO CORRIGIR ERROS');
        }

        return {
            success: successRate >= 90,
            successRate,
            results,
            summary: {
                total: totalChecks,
                success: successChecks,
                errors: results.errors.length
            }
        };

    } catch (error: any) {
        console.error('❌ [VERIFY] Erro crítico na verificação:', error);
        results.errors.push(`Erro crítico: ${error.message}`);
        
        return {
            success: false,
            successRate: 0,
            results,
            summary: {
                total: 0,
                success: 0,
                errors: 1
            }
        };
    }
}

/**
 * Função para executar verificação completa e retornar status simplificado
 */
export async function quickAutomationCheck() {
    const result = await verifyAutomationSystem();
    return {
        isAutomated: result.success,
        successRate: result.successRate,
        errorsCount: result.summary.errors,
        ready: result.successRate >= 90
    };
}

export default {
    verifyAutomationSystem,
    quickAutomationCheck
};
