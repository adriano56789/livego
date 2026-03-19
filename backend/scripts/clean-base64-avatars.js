const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

// Definir schemas manualmente
const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
}, { collection: 'users' });

const StreamerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    hostId: { type: String, required: true },
    avatar: { type: String },
    isLive: { type: Boolean, default: false },
}, { collection: 'streamers' });

const ProfilePhotoSchema = new mongoose.Schema({
    id: { type: String, required: true },
    userId: { type: String, required: true },
    photoUrl: { type: String, required: true },
    photoType: { type: String, required: true },
    isMain: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
}, { collection: 'profilephotos' });

const User = mongoose.model('User', UserSchema);
const Streamer = mongoose.model('Streamer', StreamerSchema);
const ProfilePhoto = mongoose.model('ProfilePhoto', ProfilePhotoSchema);

async function cleanBase64Avatars() {
    try {
        console.log('🔧 Conectando ao MongoDB...');
        
        // Usar a string de conexão correta do ambiente
        const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado com sucesso!');

        // Buscar usuários com avatarUrl em Base64
        const usersWithBase64 = await User.find({
            avatarUrl: { $regex: /^data:image\// }
        });

        console.log(`🔍 Found ${usersWithBase64.length} users with Base64 avatars`);

        let cleanedCount = 0;

        for (const user of usersWithBase64) {
            // Buscar avatar principal válido (não Base64)
            const validAvatar = await ProfilePhoto.findOne({
                userId: user.id,
                photoType: 'avatar',
                isMain: true,
                isActive: true,
                photoUrl: { $not: /^data:image\// }
            }).sort({ createdAt: -1 });

            if (validAvatar) {
                // Atualizar usuário com URL válida
                await User.updateOne(
                    { id: user.id },
                    { avatarUrl: validAvatar.photoUrl }
                );

                // Sincronizar com streams
                await Streamer.updateMany(
                    { hostId: user.id },
                    { 
                        avatar: validAvatar.photoUrl,
                        updatedAt: new Date()
                    }
                );

                console.log(`✅ Cleaned user ${user.name}: ${user.avatarUrl.substring(0, 50)}... → ${validAvatar.photoUrl}`);
                cleanedCount++;
            } else {
                // Se não encontrar avatar válido, definir como vazio
                await User.updateOne(
                    { id: user.id },
                    { avatarUrl: '' }
                );

                await Streamer.updateMany(
                    { hostId: user.id },
                    { 
                        avatar: '',
                        updatedAt: new Date()
                    }
                );

                console.log(`⚠️ No valid avatar found for ${user.name}, set to empty`);
                cleanedCount++;
            }
        }

        console.log(`✅ Cleaned ${cleanedCount} users with Base64 avatars!`);
        console.log('🎉 All avatars now use proper URLs instead of Base64!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

cleanBase64Avatars();
