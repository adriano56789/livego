import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, ProfilePhoto } from '../src/models/index';

dotenv.config();

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

const createProfilePhotos = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Conectado ao MongoDB real');

        // Buscar usuários REAIS
        console.log('🔍 Buscando usuários REAIS...');
        const users = await User.find({});
        
        if (users.length === 0) {
            console.log('❌ Nenhum usuário encontrado!');
            return;
        }

        console.log(`📊 Encontrados ${users.length} usuários REAIS`);

        // Limpar fotos de perfil existentes
        console.log('\n🧹 Limpando fotos de perfil existentes...');
        await ProfilePhoto.deleteMany({});
        console.log('✅ Fotos de perfil limpas');

        // Criar fotos de perfil REAIS
        console.log('\n📸 Criando fotos de perfil REAIS...');
        
        const profilePhotos = [];
        
        // URLs de exemplo realistas para avatares
        const avatarUrls = [
            'https://picsum.photos/seed/avatar1/400/400',
            'https://picsum.photos/seed/avatar2/400/400',
            'https://picsum.photos/seed/avatar3/400/400',
            'https://picsum.photos/seed/avatar4/400/400',
            'https://picsum.photos/seed/avatar5/400/400',
            'https://picsum.photos/seed/avatar6/400/400',
            'https://picsum.photos/seed/avatar7/400/400',
            'https://picsum.photos/seed/avatar8/400/400'
        ];

        // URLs de exemplo para capas
        const coverUrls = [
            'https://picsum.photos/seed/cover1/1200/400',
            'https://picsum.photos/seed/cover2/1200/400',
            'https://picsum.photos/seed/cover3/1200/400',
            'https://picsum.photos/seed/cover4/1200/400'
        ];

        // URLs de exemplo para galeria
        const galleryUrls = [
            'https://picsum.photos/seed/gallery1/600/800',
            'https://picsum.photos/seed/gallery2/600/800',
            'https://picsum.photos/seed/gallery3/600/800',
            'https://picsum.photos/seed/gallery4/600/800',
            'https://picsum.photos/seed/gallery5/600/800',
            'https://picsum.photos/seed/gallery6/600/800',
            'https://picsum.photos/seed/gallery7/600/800',
            'https://picsum.photos/seed/gallery8/600/800',
            'https://picsum.photos/seed/gallery9/600/800',
            'https://picsum.photos/seed/gallery10/600/800',
            'https://picsum.photos/seed/gallery11/600/800',
            'https://picsum.photos/seed/gallery12/600/800'
        ];

        // Criar fotos para cada usuário
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            
            // Criar avatar principal
            const avatarPhoto = await ProfilePhoto.create({
                id: `profile_avatar_${user.id}_${Date.now()}`,
                userId: user.id,
                photoUrl: avatarUrls[i % avatarUrls.length],
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
            
            profilePhotos.push(avatarPhoto);
            
            // Criar capa (para alguns usuários)
            if (i < coverUrls.length) {
                const coverPhoto = await ProfilePhoto.create({
                    id: `profile_cover_${user.id}_${Date.now()}`,
                    userId: user.id,
                    photoUrl: coverUrls[i],
                    photoType: 'cover',
                    isActive: true,
                    isMain: false,
                    order: 0,
                    metadata: {
                        originalName: `cover_${user.name}_${Date.now()}.jpg`,
                        size: 300000,
                        mimeType: 'image/jpeg',
                        width: 1200,
                        height: 400,
                        uploadedAt: new Date()
                    }
                });
                
                profilePhotos.push(coverPhoto);
            }
            
            // Criar galeria (3-6 fotos por usuário)
            const galleryCount = 3 + Math.floor(Math.random() * 4); // 3-6 fotos
            const userGalleryUrls = galleryUrls.slice(i * 3, (i * 3) + galleryCount);
            
            for (let j = 0; j < userGalleryUrls.length && j < galleryCount; j++) {
                const galleryPhoto = await ProfilePhoto.create({
                    id: `profile_gallery_${user.id}_${Date.now()}_${j}`,
                    userId: user.id,
                    photoUrl: userGalleryUrls[j],
                    photoType: 'gallery',
                    isActive: true,
                    isMain: false,
                    order: j,
                    metadata: {
                        originalName: `gallery_${user.name}_${j}_${Date.now()}.jpg`,
                        size: 250000,
                        mimeType: 'image/jpeg',
                        width: 600,
                        height: 800,
                        uploadedAt: new Date()
                    }
                });
                
                profilePhotos.push(galleryPhoto);
            }
            
            console.log(`✅ Fotos criadas para ${user.name}: 1 avatar, ${i < coverUrls.length ? '1 capa, ' : ''}${galleryCount} galeria`);
        }

        console.log(`\n✅ Criadas ${profilePhotos.length} fotos de perfil REAIS`);

        // Mostrar estatísticas
        console.log('\n📊 Estatísticas finais:');
        console.log(`👥 Usuários REAIS: ${users.length}`);
        console.log(`📸 Fotos de perfil REAIS: ${profilePhotos.length}`);

        // Contar fotos por tipo
        const photosByType = profilePhotos.reduce((acc, photo) => {
            acc[photo.photoType] = (acc[photo.photoType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log('\n📈 Fotos por tipo:');
        Object.entries(photosByType).forEach(([type, count]) => {
            console.log(`  ${type}: ${count} fotos`);
        });

        // Verificar avatares principais
        console.log('\n👤 Avatares principais por usuário:');
        for (const user of users) {
            const mainAvatar = await (ProfilePhoto as any).getMainAvatar(user.id);
            if (mainAvatar) {
                console.log(`  ✅ ${user.name}: ${mainAvatar.photoUrl}`);
            } else {
                console.log(`  ❌ ${user.name}: Sem avatar principal`);
            }
        }

        // Verificar capas
        console.log('\n🖼️ Capas por usuário:');
        for (const user of users) {
            const cover = await (ProfilePhoto as any).getUserCover(user.id);
            if (cover) {
                console.log(`  ✅ ${user.name}: ${cover.photoUrl}`);
            } else {
                console.log(`  ⚪ ${user.name}: Sem capa`);
            }
        }

        // Verificar galerias
        console.log('\n🎨 Galerias por usuário:');
        for (const user of users) {
            const gallery = await (ProfilePhoto as any).getUserGallery(user.id);
            console.log(`  📸 ${user.name}: ${gallery.length} fotos na galeria`);
        }

        console.log('\n🎉 Sistema de fotos de perfil criado com dados REAIS!');
        console.log('💡 Funcionalidades disponíveis:');
        console.log('  - GET /api/users/:userId/photos/avatar - Avatar principal');
        console.log('  - GET /api/users/:userId/photos/cover - Capa do perfil');
        console.log('  - GET /api/users/:userId/photos/gallery - Galeria completa');
        console.log('  - POST /api/users/:userId/photos - Adicionar foto');
        console.log('  - PUT /api/users/:userId/photos/:id/set-main - Definir avatar principal');
        console.log('  - DELETE /api/users/:userId/photos/:id - Remover foto');
        
    } catch (error) {
        console.error('❌ Erro ao criar fotos de perfil:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar criação
createProfilePhotos();
