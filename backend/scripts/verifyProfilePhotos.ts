import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, ProfilePhoto } from '../src/models/index';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const verifyProfilePhotos = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Verificar coleção ProfilePhoto
        console.log('\n🔍 Verificando coleção ProfilePhoto...');
        
        const totalPhotos = await ProfilePhoto.countDocuments();
        console.log(`📊 Total de fotos na coleção: ${totalPhotos}`);
        
        if (totalPhotos === 0) {
            console.log('❌ Coleção vazia! Por favor, execute: npm run create-profile-photos');
        } else {
            console.log('✅ Coleção já possui dados!');
        }

        // Verificar detalhes das fotos
        console.log('\n📋 Detalhes das fotos na coleção:');
        
        const photos = await ProfilePhoto.find({}).limit(10);
        
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            console.log(`  ${i + 1}. ID: ${photo.id}`);
            console.log(`     Usuário: ${photo.userId}`);
            console.log(`     Tipo: ${photo.photoType}`);
            console.log(`     URL: ${photo.photoUrl}`);
            console.log(`     Ativa: ${photo.isActive}`);
            console.log(`     Principal: ${photo.isMain}`);
            console.log('');
        }

        // Verificar por usuário
        console.log('\n👥 Fotos por usuário:');
        
        const users = await User.find({});
        
        for (const user of users) {
            const userPhotos = await ProfilePhoto.find({ userId: user.id });
            const avatar = userPhotos.find(p => p.photoType === 'avatar' && p.isMain);
            const cover = userPhotos.find(p => p.photoType === 'cover');
            const gallery = userPhotos.filter(p => p.photoType === 'gallery');
            
            console.log(`  📸 ${user.name}:`);
            console.log(`    - Avatar: ${avatar ? '✅' : '❌'} ${avatar ? avatar.photoUrl : 'Não encontrado'}`);
            console.log(`    - Capa: ${cover ? '✅' : '❌'} ${cover ? cover.photoUrl : 'Não encontrada'}`);
            console.log(`    - Galeria: ${gallery.length} fotos`);
            console.log('');
        }

        // Verificar estatísticas
        console.log('\n📈 Estatísticas da coleção:');
        
        const photosByType = await ProfilePhoto.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$photoType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log('Fotos por tipo:');
        for (const stat of photosByType) {
            console.log(`  ${stat._id}: ${stat.count} fotos`);
        }

        const activePhotos = await ProfilePhoto.countDocuments({ isActive: true });
        const inactivePhotos = await ProfilePhoto.countDocuments({ isActive: false });
        
        console.log(`\nStatus:`);
        console.log(`  ✅ Ativas: ${activePhotos}`);
        console.log(`  ❌ Inativas: ${inactivePhotos}`);

        // Verificar se há usuários sem avatar principal
        console.log('\n🔍 Verificando usuários sem avatar principal:');
        
        for (const user of users) {
            const mainAvatar = await ProfilePhoto.findOne({ 
                userId: user.id, 
                photoType: 'avatar', 
                isMain: true, 
                isActive: true 
            });
            
            if (!mainAvatar) {
                console.log(`  ⚠️ ${user.name} não tem avatar principal!`);
                
                // Criar avatar automaticamente
                console.log(`    🛠️ Criando avatar para ${user.name}...`);
                
                const newAvatar = await ProfilePhoto.create({
                    id: `profile_avatar_${user.id}_${Date.now()}`,
                    userId: user.id,
                    photoUrl: `https://picsum.photos/seed/avatar_${user.id}/400/400`,
                    photoType: 'avatar',
                    isActive: true,
                    isMain: true,
                    order: 0,
                    metadata: {
                        originalName: `avatar_${user.name}_${Date.now()}.jpg`,
                        size: 150000,
                        mimeType: 'image/jpeg',
                        width: 400,
                        height: 400,
                        uploadedAt: new Date()
                    }
                });
                
                console.log(`    ✅ Avatar criado: ${newAvatar.photoUrl}`);
            }
        }

        // Verificação final
        const finalCount = await ProfilePhoto.countDocuments();
        console.log(`\n🎉 Verificação final: ${finalCount} fotos na coleção`);
        
        if (finalCount > 0) {
            console.log('✅ Sistema de fotos de perfil está funcionando!');
            console.log('💡 As fotos aparecerão no app quando o usuário clicar no ícone de vídeo!');
        } else {
            console.log('❌ Ainda não há fotos na coleção!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar fotos de perfil:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar verificação
verifyProfilePhotos();
