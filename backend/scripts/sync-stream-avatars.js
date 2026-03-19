const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

// Usar ts-node para carregar os modelos TypeScript
const path = require('path');

async function syncStreamAvatars() {
    try {
        console.log('🔧 Conectando ao MongoDB...');
        
        // Usar a string de conexão correta do ambiente
        const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado com sucesso!');

        // Definir schemas manualmente (versão simplificada)
        const UserSchema = new mongoose.Schema({
            id: { type: String, required: true, unique: true },
            name: { type: String, required: true },
            avatarUrl: { type: String },
            // outros campos...
        }, { collection: 'users' });

        const StreamerSchema = new mongoose.Schema({
            id: { type: String, required: true, unique: true },
            name: { type: String, required: true },
            hostId: { type: String, required: true },
            avatar: { type: String },
            isLive: { type: Boolean, default: false },
            // outros campos...
        }, { collection: 'streamers' });

        const User = mongoose.model('User', UserSchema);
        const Streamer = mongoose.model('Streamer', StreamerSchema);

        // Buscar todas as streams ativas
        const streams = await Streamer.find({ 
            isLive: true,
            hostId: { $exists: true, $ne: null }
        });

        console.log(`📺 Found ${streams.length} active streams`);

        for (const stream of streams) {
            // Buscar usuário correspondente
            const user = await User.findOne({ id: stream.hostId });
            
            if (user && user.avatarUrl) {
                // Atualizar avatar da stream se for diferente
                if (stream.avatar !== user.avatarUrl) {
                    await Streamer.updateOne(
                        { id: stream.id },
                        { 
                            avatar: user.avatarUrl,
                            updatedAt: new Date()
                        }
                    );
                    console.log(`🖼️ Updated stream ${stream.name}: ${stream.avatar} → ${user.avatarUrl}`);
                } else {
                    console.log(`✅ Stream ${stream.name} already has correct avatar`);
                }
            } else {
                console.log(`⚠️ No user or avatar found for stream ${stream.name} (hostId: ${stream.hostId})`);
            }
        }

        console.log('✅ All streams synchronized with user avatars!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

syncStreamAvatars();
