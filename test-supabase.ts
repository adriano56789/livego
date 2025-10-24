/**
 * Script de teste para verificar conexão com Supabase
 *
 * Execute este arquivo para testar a conexão:
 * npx tsx test-supabase.ts
 */

import { supabase, supabaseHelpers } from './services/supabase';

async function testConnection() {
  console.log('🔌 Testando conexão com Supabase...\n');

  try {
    // Teste 1: Conexão básica
    console.log('1. Testando conexão básica...');
    const { data, error } = await supabase.from('users').select('count').single();
    if (error) throw error;
    console.log('✅ Conexão OK!\n');

    // Teste 2: Buscar presentes
    console.log('2. Buscando presentes...');
    const gifts = await supabaseHelpers.getGifts();
    console.log(`✅ ${gifts.length} presentes encontrados:`);
    gifts.slice(0, 5).forEach(g => {
      console.log(`   - ${g.name}: ${g.price} diamantes ${g.icon}`);
    });
    console.log();

    // Teste 3: Buscar usuários
    console.log('3. Buscando usuários...');
    const users = await supabaseHelpers.getAllUsers();
    console.log(`✅ ${users.length} usuários encontrados\n`);

    // Teste 4: Criar usuário de teste
    console.log('4. Criando usuário de teste...');
    try {
      const testUser = await supabaseHelpers.createUser({
        identification: `test-${Date.now()}`,
        name: 'Usuário Teste',
        avatar_url: 'https://i.pravatar.cc/150?img=1',
        country: 'br',
        age: 25,
        gender: 'not_specified'
      });
      console.log('✅ Usuário criado:', testUser.name);
      console.log(`   ID: ${testUser.id}\n`);

      // Teste 5: Atualizar usuário
      console.log('5. Atualizando usuário...');
      const updated = await supabaseHelpers.updateUser(testUser.id, {
        diamonds: 1000
      });
      console.log(`✅ Usuário atualizado! Diamantes: ${updated.diamonds}\n`);

    } catch (err: any) {
      if (err.code === '23505') {
        console.log('⚠️  Usuário já existe (isso é normal)\n');
      } else {
        throw err;
      }
    }

    console.log('🎉 Todos os testes passaram!\n');
    console.log('📝 Próximos passos:');
    console.log('   1. Leia o arquivo SUPABASE_SETUP.md');
    console.log('   2. Substitua o import da API no seu código');
    console.log('   3. Comece a usar o Supabase!\n');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    console.error('\n🔍 Verifique:');
    console.error('   - As variáveis no arquivo .env');
    console.error('   - Se o Supabase está acessível');
    console.error('   - As políticas RLS no dashboard\n');
  }
}

testConnection();
