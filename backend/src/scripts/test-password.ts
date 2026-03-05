import bcrypt from 'bcryptjs';

const hashedPassword = '$2b$10$IBfOHcmGwR7GiSS.L0oBx.la5548eLeKBaVaY1hnA8wXaV982rUn2';
const possiblePasswords = ['123456', 'senha', 'password', 'admin', 'adriano123', '123', 'adriano'];

async function checkPasswords(): Promise<void> {
    console.log('🔍 Testando senhas possíveis...\n');
    
    for (const test of possiblePasswords) {
        const match = await bcrypt.compare(test, hashedPassword);
        console.log(`Senha "${test}": ${match ? '✅ CORRETA!' : '❌ Incorreta'}`);
        
        if (match) {
            console.log(`\n🎉 SENHA ENCONTRADA: "${test}"`);
            return;
        }
    }
    
    console.log('\n❌ Nenhuma senha testada funcionou.');
    console.log('💡 Você pode resetar a senha com um novo hash.');
}

checkPasswords();
