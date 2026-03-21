const mongoose = require('mongoose');

// String de conexão do MongoDB
const MONGO_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

// Schema do User (simplificado para verificação)
const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: String,
    avatarUrl: String,
    diamonds: Number,
    level: Number,
    isOnline: Boolean
});

const User = mongoose.model('User', userSchema);

async function checkUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado ao MongoDB!');

        // Buscar todos os usuários
        const users = await User.find({}).limit(10);
        
        console.log(`📊 Encontrados ${users.length} usuários:`);
        users.forEach(user => {
            console.log(`- ID: ${user.id}, Nome: ${user.name}, Online: ${user.isOnline}`);
        });

        if (users.length === 0) {
            console.log('⚠️ Nenhum usuário encontrado. Criando usuário de teste...');
            
            // Criar usuário de teste
            const testUser = await User.create({
                id: 'test-user-123',
                name: 'Usuário Teste',
                email: 'test@example.com',
                avatarUrl: 'https://i.pravatar.cc/150?img=5',
                diamonds: 1000,
                level: 5,
                isOnline: true
            });
            
            console.log('✅ Usuário de teste criado:', testUser);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

checkUsers();
