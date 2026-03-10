import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

// Mapeamento dos novos frames ultra bonitos
const frames = [
    {
        id: 'FrameBlueCrystal',
        name: 'Blue Crystal',
        price: 500,
        duration: 7,
        description: 'Cristal azul ultra brilhante com diamantes',
        icon: '💎',
        image: 'https://picsum.photos/seed/frame_blue_crystal/200/200.jpg'
    },
    {
        id: 'FrameRoseGarden',
        name: 'Rose Garden',
        price: 750,
        duration: 7,
        description: 'Jardim de rosas com pétalas flutuantes',
        icon: '�',
        image: 'https://picsum.photos/seed/frame_rose_garden/200/200.jpg'
    },
    {
        id: 'FrameCopperPearls',
        name: 'Copper Pearls',
        price: 1000,
        duration: 14,
        description: 'Pérolas de cobre com brilho dourado',
        icon: '🦪',
        image: 'https://picsum.photos/seed/frame_copper_pearls/200/200.jpg'
    },
    {
        id: 'FrameOrnateMagenta',
        name: 'Ornate Magenta',
        price: 1250,
        duration: 14,
        description: 'Ornamentos magenta ultra detalhados',
        icon: '�',
        image: 'https://picsum.photos/seed/frame_ornate_magenta/200/200.jpg'
    },
    {
        id: 'FrameNeonFeathers',
        name: 'Neon Feathers',
        price: 1500,
        duration: 30,
        description: 'Penas neon vibrantes flutuantes',
        icon: '🪶',
        image: 'https://picsum.photos/seed/frame_neon_feathers/200/200.jpg'
    },
    {
        id: 'FrameMysticalWings',
        name: 'Mystical Wings',
        price: 1800,
        duration: 30,
        description: 'Asas místicas com aura mágica',
        icon: '🦋',
        image: 'https://picsum.photos/seed/frame_mystical_wings/200/200.jpg'
    },
    {
        id: 'FrameBaroqueElegance',
        name: 'Baroque Elegance',
        price: 2000,
        duration: 30,
        description: 'Elegância barroca ultra ornamentada',
        icon: '🏛️',
        image: 'https://picsum.photos/seed/frame_baroque_elegance/200/200.jpg'
    },
    {
        id: 'FrameCosmicFire',
        name: 'Cosmic Fire',
        price: 2200,
        duration: 30,
        description: 'Fogo cósmico com energia pulsante',
        icon: '🔥',
        image: 'https://picsum.photos/seed/frame_cosmic_fire/200/200.jpg'
    },
    {
        id: 'FrameCelestialCrown',
        name: 'Celestial Crown',
        price: 2500,
        duration: 30,
        description: 'Coroa celestial majestosa',
        icon: '👑',
        image: 'https://picsum.photos/seed/frame_celestial_crown/200/200.jpg'
    }
];

async function populateFrames() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB!');

        const Frame = (await import('../src/models')).Frame;

        // Limpar frames existentes
        await Frame.deleteMany({});
        console.log('🗑️ Frames existentes limpos');

        // Inserir novos frames
        await Frame.insertMany(frames);
        console.log(`✅ ${frames.length} frames criados com sucesso!`);

        // Mostrar categorias de preço
        console.log('\n💰 Frames por faixa de preço:');
        console.log('   🥉 Bronze (500-1000):', frames.filter(f => f.price <= 1000).length);
        console.log('   🥈 Prata (1250-2500):', frames.filter(f => f.price > 1000 && f.price <= 2500).length);
        console.log('   🥇 Ouro (2700-4500):', frames.filter(f => f.price > 2500).length);

        console.log('\n🎯 Endpoints disponíveis:');
        console.log('   GET /api/frames - Listar todos os frames');
        console.log('   POST /api/frames/:frameId/purchase - Comprar frame');
        console.log('   GET /api/frames/user/:userId - Frames do usuário');
        console.log('   POST /api/frames/:frameId/equip - Equipar frame');
        console.log('   GET /api/frames/current/:userId - Frame equipado atual');
        console.log('   POST /api/frames/cleanup-expired - Limpar frames expirados');

        console.log('\n⏰ Sistema de expiração automática ativado!');
        console.log('   Frames expiram automaticamente após o período de validade');
        console.log('   TTL index configurado para limpeza automática');

    } catch (error) {
        console.error('❌ Erro ao popular frames:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado do MongoDB');
    }
}

populateFrames();
