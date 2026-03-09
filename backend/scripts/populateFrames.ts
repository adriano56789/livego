import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

// Mapeamento dos frames baseado nos ícones existentes
const frames = [
    {
        id: 'FrameDiamondIcon',
        name: 'Diamond',
        price: 500,
        duration: 7,
        description: 'Frame brilhante com diamantes',
        icon: '💎',
        image: 'https://picsum.photos/seed/frame_diamond/200/200.jpg'
    },
    {
        id: 'FrameNeonPinkIcon',
        name: 'Neon Pink',
        price: 750,
        duration: 7,
        description: 'Frame neon rosa vibrante',
        icon: '🌸',
        image: 'https://picsum.photos/seed/frame_neon_pink/200/200.jpg'
    },
    {
        id: 'FrameFloralWreathIcon',
        name: 'Floral Wreath',
        price: 1000,
        duration: 14,
        description: 'Guirlanda floral elegante',
        icon: '🌺',
        image: 'https://picsum.photos/seed/frame_floral_wreath/200/200.jpg'
    },
    {
        id: 'FramePinkGemIcon',
        name: 'Pink Gem',
        price: 1250,
        duration: 14,
        description: 'Gema rosa preciosa',
        icon: '💖',
        image: 'https://picsum.photos/seed/frame_pink_gem/200/200.jpg'
    },
    {
        id: 'FrameGoldenFloralIcon',
        name: 'Golden Floral',
        price: 1500,
        duration: 30,
        description: 'Frame dourado com flores',
        icon: '🌻',
        image: 'https://picsum.photos/seed/frame_golden_floral/200/200.jpg'
    },
    {
        id: 'FramePurpleFloralIcon',
        name: 'Purple Floral',
        price: 2000,
        duration: 30,
        description: 'Frame roxo floral',
        icon: '🌷',
        image: 'https://picsum.photos/seed/frame_purple_floral/200/200.jpg'
    },
    {
        id: 'FrameBlueCrystalIcon',
        name: 'Blue Crystal',
        price: 1800,
        duration: 30,
        description: 'Cristal azul mágico',
        icon: '🔷',
        image: 'https://picsum.photos/seed/frame_blue_crystal/200/200.jpg'
    },
    {
        id: 'FrameBlueFireIcon',
        name: 'Blue Fire',
        price: 2200,
        duration: 30,
        description: 'Fogo azul intenso',
        icon: '🔥',
        image: 'https://picsum.photos/seed/frame_blue_fire/200/200.jpg'
    },
    {
        id: 'FrameSilverThornIcon',
        name: 'Silver Thorn',
        price: 2500,
        duration: 30,
        description: 'Espinhos de prata',
        icon: '🥀',
        image: 'https://picsum.photos/seed/frame_silver_thorn/200/200.jpg'
    },
    {
        id: 'FrameNeonDiamondIcon',
        name: 'Neon Diamond',
        price: 3000,
        duration: 30,
        description: 'Diamante neon cintilante',
        icon: '💠',
        image: 'https://picsum.photos/seed/frame_neon_diamond/200/200.jpg'
    },
    {
        id: 'FrameRoseHeartIcon',
        name: 'Rose Heart',
        price: 3500,
        duration: 30,
        description: 'Coração de rosas',
        icon: '🌹',
        image: 'https://picsum.photos/seed/frame_rose_heart/200/200.jpg'
    },
    {
        id: 'FrameOrnateBronzeIcon',
        name: 'Ornate Bronze',
        price: 2800,
        duration: 30,
        description: 'Bronze ornamentado',
        icon: '🏆',
        image: 'https://picsum.photos/seed/frame_ornate_bronze/200/200.jpg'
    },
    {
        id: 'FramePinkLaceIcon',
        name: 'Pink Lace',
        price: 3200,
        duration: 30,
        description: 'Renda rosa delicada',
        icon: '🎀',
        image: 'https://picsum.photos/seed/frame_pink_lace/200/200.jpg'
    },
    {
        id: 'FrameMagentaWingsIcon',
        name: 'Magenta Wings',
        price: 4000,
        duration: 30,
        description: 'Asas magenta poderosas',
        icon: '🦋',
        image: 'https://picsum.photos/seed/frame_magenta_wings/200/200.jpg'
    },
    {
        id: 'FrameSilverBeadedIcon',
        name: 'Silver Beaded',
        price: 2700,
        duration: 30,
        description: 'Contas de prata',
        icon: '📿',
        image: 'https://picsum.photos/seed/frame_silver_beaded/200/200.jpg'
    },
    {
        id: 'FrameRegalPurpleIcon',
        name: 'Regal Purple',
        price: 2900,
        duration: 30,
        description: 'Roxo real majestoso',
        icon: '👑',
        image: 'https://picsum.photos/seed/frame_regal_purple/200/200.jpg'
    },
    {
        id: 'FrameIcyWingsIcon',
        name: 'Icy Wings',
        price: 3800,
        duration: 30,
        description: 'Asas de gelo',
        icon: '❄️',
        image: 'https://picsum.photos/seed/frame_icy_wings/200/200.jpg'
    },
    {
        id: 'FrameBlazingSunIcon',
        name: 'Blazing Sun',
        price: 4500,
        duration: 30,
        description: 'Sol ardente',
        icon: '☀️',
        image: 'https://picsum.photos/seed/frame_blazing_sun/200/200.jpg'
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
