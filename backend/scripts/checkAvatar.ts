import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function checkAvatar() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB!');

        // Importar modelo User
        const User = (await import('../src/models')).User;

        // Buscar usuário atual com ID 65384127
        const user = await User.findOne({ id: '65384127' });
        
        if (!user) {
            console.log('❌ Usuário 65384127 não encontrado!');
            return;
        }

        console.log('👤 Dados do usuário:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Nome: ${user.name}`);
        console.log(`   Avatar URL: "${user.avatarUrl}"`);
        console.log(`   Cover URL: "${user.coverUrl || 'N/A'}"`);
        console.log(`   Avatar está vazio? ${!user.avatarUrl || user.avatarUrl === ''}`);
        
        // Verificar outros usuários para comparação
        const otherUsers = await User.find({ id: { $ne: '65384127' } }).limit(3);
        
        console.log('\n👥 Outros usuários:');
        otherUsers.forEach(u => {
            console.log(`   ${u.name}: avatar="${u.avatarUrl || 'VAZIO'}"`);
        });

        // Atualizar avatar se estiver vazio
        if (!user.avatarUrl || user.avatarUrl === '') {
            console.log('\n🔧 Atualizando avatar...');
            await User.findOneAndUpdate(
                { id: '65384127' },
                { 
                    avatarUrl: 'https://picsum.photos/seed/user65384127/200/200.jpg'
                },
                { new: true }
            );
            
            const updatedUser = await User.findOne({ id: '65384127' });
            console.log(`✅ Avatar atualizado: ${updatedUser?.avatarUrl || 'ERRO'}`);
        } else {
            console.log('\n✅ Avatar já existe!');
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado do MongoDB');
    }
}

checkAvatar();
