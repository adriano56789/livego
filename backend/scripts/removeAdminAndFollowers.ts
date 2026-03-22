import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Followers } from '../src/models';
import { User } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const removeAdminAndFollowers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Encontrar usuário administrador
        const adminUser = await User.findOne({ 
            $or: [
                { id: /admin/i },
                { name: /admin/i },
                { email: /admin/i }
            ]
        });

        if (!adminUser) {
            console.log('✅ Nenhum usuário administrador encontrado');
            return;
        }

        console.log(`👤 Administrador encontrado: ${adminUser.name} (${adminUser.id})`);

        // Encontrar todos que seguem o administrador
        const adminFollowers = await Followers.find({ 
            followingId: adminUser.id,
            isActive: true 
        });

        console.log(`📊 ${adminFollowers.length} pessoas seguem o administrador`);

        if (adminFollowers.length === 0) {
            console.log('✅ Ninguém está seguindo o administrador');
        } else {
            console.log('🔍 Pessoas que seguem o administrador:');
            for (const follower of adminFollowers) {
                const followerUser = await User.findOne({ id: follower.followerId });
                console.log(`  - ${followerUser?.name || 'Desconhecido'} (${follower.followerId})`);
            }

            // Confirmar remoção
            console.log('\n⚠️  ATENÇÃO: Isso removerá os registros de seguidores do administrador.');
            console.log('Deseja continuar? (Ctrl+C para cancelar)');
            
            // Aguardar 3 segundos
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Remover seguidores do administrador
            console.log('🧹 Removendo seguidores do administrador...');
            const deleteResult = await Followers.deleteMany({
                followingId: adminUser.id
            });

            console.log(`✅ Removidos ${deleteResult.deletedCount} registros de seguidores`);
        }

        // Perguntar se também deve remover o usuário administrador
        console.log('\n❓ Deseja também remover o usuário administrador do sistema?');
        console.log('Isso removerá permanentemente o usuário admin@livego.com');
        console.log('Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...');
        
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Remover usuário administrador
        console.log('🗑️  Removendo usuário administrador...');
        await User.deleteOne({ id: adminUser.id });
        console.log('✅ Usuário administrador removido com sucesso');

        // Verificação final
        const remainingAdmins = await User.findOne({ 
            $or: [
                { id: /admin/i },
                { name: /admin/i },
                { email: /admin/i }
            ]
        });

        const remainingFollowers = await Followers.find({ 
            followingId: adminUser.id 
        });

        if (!remainingAdmins && remainingFollowers.length === 0) {
            console.log('\n🎉 SUCESSO! Sistema limpo:');
            console.log('✅ Nenhum usuário administrador restante');
            console.log('✅ Nenhum seguidor de administrador restante');
            console.log('✅ Banco de dados agora está consistente');
        } else {
            console.log('\n⚠️  Verificação final:');
            console.log(`- Admins restantes: ${remainingAdmins ? 1 : 0}`);
            console.log(`- Seguidores restantes: ${remainingFollowers.length}`);
        }

    } catch (error) {
        console.error('❌ Erro durante remoção:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar remoção
removeAdminAndFollowers();
