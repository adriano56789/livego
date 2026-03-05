import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, UserPhoto, UserVideo, ProfileUpdate } from '../src/models';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const ensureRealIds = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Buscar todos os usuários REAIS
        console.log('🔍 Verificando IDs REAIS no sistema...');
        const realUsers = await User.find({});
        
        console.log(`📊 Encontrados ${realUsers.length} usuários com IDs REAIS:`);
        realUsers.forEach(user => {
            console.log(`  ✅ ID REAL: ${user.id} | Nome: ${user.name}`);
        });

        // Verificar se há algum dado fake nos registros
        console.log('\n🔍 Verificando registros de mídia...');
        
        // Verificar fotos
        const photos = await UserPhoto.find({});
        console.log(`📸 Fotos encontradas: ${photos.length}`);
        
        let fakePhotos = 0;
        for (const photo of photos) {
            const userExists = realUsers.some(u => u.id === photo.userId);
            if (!userExists) {
                console.log(`  ❌ Foto FAKE encontrada - userId: ${photo.userId} não existe!`);
                fakePhotos++;
            }
        }
        
        // Verificar vídeos
        const videos = await UserVideo.find({});
        console.log(`🎥 Vídeos encontrados: ${videos.length}`);
        
        let fakeVideos = 0;
        for (const video of videos) {
            const userExists = realUsers.some(u => u.id === video.userId);
            if (!userExists) {
                console.log(`  ❌ Vídeo FAKE encontrado - userId: ${video.userId} não existe!`);
                fakeVideos++;
            }
        }
        
        // Verificar atualizações de perfil
        const updates = await ProfileUpdate.find({});
        console.log(`📝 Atualizações de perfil encontradas: ${updates.length}`);
        
        let fakeUpdates = 0;
        for (const update of updates) {
            const userExists = realUsers.some(u => u.id === update.userId);
            if (!userExists) {
                console.log(`  ❌ Atualização FAKE encontrada - userId: ${update.userId} não existe!`);
                fakeUpdates++;
            }
        }

        // Limpar dados fake se encontrados
        if (fakePhotos > 0 || fakeVideos > 0 || fakeUpdates > 0) {
            console.log('\n🧹 Limpando dados FAKE...');
            
            if (fakePhotos > 0) {
                await UserPhoto.deleteMany({
                    userId: { $nin: realUsers.map(u => u.id) }
                });
                console.log(`✅ Removidas ${fakePhotos} fotos FAKE`);
            }
            
            if (fakeVideos > 0) {
                await UserVideo.deleteMany({
                    userId: { $nin: realUsers.map(u => u.id) }
                });
                console.log(`✅ Removidos ${fakeVideos} vídeos FAKE`);
            }
            
            if (fakeUpdates > 0) {
                await ProfileUpdate.deleteMany({
                    userId: { $nin: realUsers.map(u => u.id) }
                });
                console.log(`✅ Removidas ${fakeUpdates} atualizações FAKE`);
            }
        } else {
            console.log('\n✅ Nenhum dado FAKE encontrado - Todos os IDs são REAIS!');
        }

        // Mostrar estatística final
        console.log('\n📊 Estatística Final - Apenas IDs REAIS:');
        console.log(`👥 Usuários REAIS: ${realUsers.length}`);
        console.log(`📸 Fotos REAIS: ${photos.length - fakePhotos}`);
        console.log(`🎥 Vídeos REAIS: ${videos.length - fakeVideos}`);
        console.log(`📝 Atualizações REAIS: ${updates.length - fakeUpdates}`);
        
        console.log('\n🎉 Sistema garantido com apenas IDs REAIS!');
        
    } catch (error) {
        console.error('❌ Erro ao verificar IDs:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar verificação
ensureRealIds();
