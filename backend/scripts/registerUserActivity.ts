import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, ProfileUpdate } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const registerUserActivity = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Buscar todos os usuários reais
        console.log('🔍 Buscando usuários para registrar atividade...');
        const users = await User.find({});
        
        console.log(`📊 Encontrados ${users.length} usuários para registrar atividade`);

        // Registrar entrada de cada usuário
        for (const user of users) {
            console.log(`👤 Registrando atividade do usuário: ${user.name} (${user.id})`);
            
            // Atualizar último acesso
            await User.findOneAndUpdate(
                { id: user.id },
                { 
                    lastSeen: new Date().toISOString(),
                    isOnline: true
                }
            );
            
            // Registrar entrada no sistema
            await ProfileUpdate.create({
                id: `activity_${user.id}_${Date.now()}`,
                userId: user.id,
                updateType: 'settings',
                newValue: 'User logged in',
                updateReason: 'Entrada no aplicativo'
            });
        }

        console.log('✅ Atividade de todos os usuários registrada com sucesso!');
        
        // Mostrar estatísticas
        const totalUsers = await User.countDocuments();
        const onlineUsers = await User.countDocuments({ isOnline: true });
        const totalActivities = await ProfileUpdate.countDocuments();
        
        console.log('\n📊 Estatísticas:');
        console.log(`👥 Total de usuários: ${totalUsers}`);
        console.log(`🟢 Usuários online: ${onlineUsers}`);
        console.log(`📝 Total de atividades registradas: ${totalActivities}`);
        
    } catch (error) {
        console.error('❌ Erro ao registrar atividade:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar registro
registerUserActivity();
