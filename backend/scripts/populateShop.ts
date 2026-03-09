import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function populateShop() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB!');

        const ShopItem = (await import('../src/models')).ShopItem;

        // Limpar itens existentes
        await ShopItem.deleteMany({});
        console.log('🗑️ Itens da loja limpos');

        // Dados dos itens da loja
        const shopItems = [
            // MOCHILAS
            {
                id: 'mochila_ninja',
                name: 'Mochila Ninja',
                category: 'mochila',
                price: 500,
                description: 'Mochila estilosa com design ninja',
                icon: '🎒',
                image: 'https://picsum.photos/seed/mochila_ninja/200/200.jpg'
            },
            {
                id: 'mochila_dourada',
                name: 'Mochila Dourada',
                category: 'mochila',
                price: 1000,
                description: 'Mochila premium dourada',
                icon: '👜',
                image: 'https://picsum.photos/seed/mochila_dourada/200/200.jpg'
            },
            {
                id: 'mochila_cosplay',
                name: 'Mochila Cosplay',
                category: 'mochila',
                price: 750,
                description: 'Mochila temática para cosplay',
                icon: '🎒',
                image: 'https://picsum.photos/seed/mochila_cosplay/200/200.jpg'
            },

            // QUADROS
            {
                id: 'quadro_moderno',
                name: 'Quadro Moderno',
                category: 'quadro',
                price: 800,
                description: 'Quadro decorativo moderno',
                icon: '🖼️',
                image: 'https://picsum.photos/seed/quadro_moderno/200/200.jpg'
            },
            {
                id: 'quadro_classico',
                name: 'Quadro Clássico',
                category: 'quadro',
                price: 600,
                description: 'Quadro com design clássico',
                icon: '🖼️',
                image: 'https://picsum.photos/seed/quadro_classico/200/200.jpg'
            },
            {
                id: 'quadro_abstrato',
                name: 'Quadro Abstrato',
                category: 'quadro',
                price: 900,
                description: 'Quadro abstrato colorido',
                icon: '🖼️',
                image: 'https://picsum.photos/seed/quadro_abstrato/200/200.jpg'
            },

            // CARROS
            {
                id: 'carro_esportivo',
                name: 'Carro Esportivo',
                category: 'carro',
                price: 2000,
                description: 'Carro esportivo vermelho',
                icon: '🏎️',
                image: 'https://picsum.photos/seed/carro_esportivo/200/200.jpg'
            },
            {
                id: 'carro_luxo',
                name: 'Carro de Luxo',
                category: 'carro',
                price: 3000,
                description: 'Carro de luxo preto',
                icon: '🚗',
                image: 'https://picsum.photos/seed/carro_luxo/200/200.jpg'
            },
            {
                id: 'carro_classico',
                name: 'Carro Clássico',
                category: 'carro',
                price: 1500,
                description: 'Carro clássico restaurado',
                icon: '🚙',
                image: 'https://picsum.photos/seed/carro_classico/200/200.jpg'
            },

            // BOLHAS
            {
                id: 'bolha_azul',
                name: 'Bolha Azul',
                category: 'bolha',
                price: 300,
                description: 'Bolha de chat azul',
                icon: '💬',
                image: 'https://picsum.photos/seed/bolha_azul/200/200.jpg'
            },
            {
                id: 'bolha_rosa',
                name: 'Bolha Rosa',
                category: 'bolha',
                price: 300,
                description: 'Bolha de chat rosa',
                icon: '💭',
                image: 'https://picsum.photos/seed/bolha_rosa/200/200.jpg'
            },
            {
                id: 'bolha_dourada',
                name: 'Bolha Dourada',
                category: 'bolha',
                price: 500,
                description: 'Bolha de chat dourada premium',
                icon: '💬',
                image: 'https://picsum.photos/seed/bolha_dourada/200/200.jpg'
            },

            // ANÉIS
            {
                id: 'anel_prata',
                name: 'Anel de Prata',
                category: 'anel',
                price: 400,
                description: 'Anel de prata elegante',
                icon: '💍',
                image: 'https://picsum.photos/seed/anel_prata/200/200.jpg'
            },
            {
                id: 'anel_ouro',
                name: 'Anel de Ouro',
                category: 'anel',
                price: 800,
                description: 'Anel de ouro 18k',
                icon: '💍',
                image: 'https://picsum.photos/seed/anel_ouro/200/200.jpg'
            },
            {
                id: 'anel_diamante',
                name: 'Anel de Diamante',
                category: 'anel',
                price: 1500,
                description: 'Anel com diamante',
                icon: '💎',
                image: 'https://picsum.photos/seed/anel_diamante/200/200.jpg'
            },

            // AVATARES (7 DIAS)
            {
                id: 'avatar_gamer',
                name: 'Avatar Gamer',
                category: 'avatar',
                price: 1000,
                duration: 7,
                description: 'Avatar estilo gamer válido por 7 dias',
                icon: '👤',
                image: 'https://picsum.photos/seed/avatar_gamer/200/200.jpg'
            },
            {
                id: 'avatar_anime',
                name: 'Avatar Anime',
                category: 'avatar',
                price: 1200,
                duration: 7,
                description: 'Avatar estilo anime válido por 7 dias',
                icon: '👤',
                image: 'https://picsum.photos/seed/avatar_anime/200/200.jpg'
            },
            {
                id: 'avatar_vip',
                name: 'Avatar VIP',
                category: 'avatar',
                price: 2000,
                duration: 7,
                description: 'Avatar VIP especial válido por 7 dias',
                icon: '👤',
                image: 'https://picsum.photos/seed/avatar_vip/200/200.jpg'
            },
            {
                id: 'avatar_cyber',
                name: 'Avatar Cyberpunk',
                category: 'avatar',
                price: 1500,
                duration: 7,
                description: 'Avatar cyberpunk válido por 7 dias',
                icon: '👤',
                image: 'https://picsum.photos/seed/avatar_cyber/200/200.jpg'
            },
            {
                id: 'avatar_fantasia',
                name: 'Avatar Fantasia',
                category: 'avatar',
                price: 1300,
                duration: 7,
                description: 'Avatar de fantasia válido por 7 dias',
                icon: '👤',
                image: 'https://picsum.photos/seed/avatar_fantasia/200/200.jpg'
            }
        ];

        // Inserir itens na loja
        await ShopItem.insertMany(shopItems);
        console.log(`✅ ${shopItems.length} itens criados na loja!`);

        // Mostrar categorias
        const categories = [...new Set(shopItems.map(item => item.category))];
        console.log('\n📦 Categorias disponíveis:');
        categories.forEach(cat => {
            const count = shopItems.filter(item => item.category === cat).length;
            console.log(`   ${cat}: ${count} itens`);
        });

        console.log('\n🎯 Endpoints disponíveis:');
        console.log('   GET /api/shop/mochilas - Listar mochilas');
        console.log('   POST /api/shop/mochilas/:itemId/purchase - Comprar mochila');
        console.log('   GET /api/shop/mochilas/user/:userId - Mochilas do usuário');
        console.log('   GET /api/shop/quadros - Listar quadros');
        console.log('   POST /api/shop/quadros/:itemId/purchase - Comprar quadro');
        console.log('   GET /api/shop/quadros/user/:userId - Quadros do usuário');
        console.log('   GET /api/shop/carros - Listar carros');
        console.log('   POST /api/shop/carros/:itemId/purchase - Comprar carro');
        console.log('   GET /api/shop/carros/user/:userId - Carros do usuário');
        console.log('   GET /api/shop/bolhas - Listar bolhas');
        console.log('   POST /api/shop/bolhas/:itemId/purchase - Comprar bolha');
        console.log('   GET /api/shop/bolhas/user/:userId - Bolhas do usuário');
        console.log('   GET /api/shop/aneis - Listar anéis');
        console.log('   POST /api/shop/aneis/:itemId/purchase - Comprar anel');
        console.log('   GET /api/shop/aneis/user/:userId - Anéis do usuário');
        console.log('   GET /api/shop/avatars - Listar avatares');
        console.log('   POST /api/shop/avatars/:itemId/purchase - Comprar avatar (7 dias)');
        console.log('   GET /api/shop/avatars/user/:userId - Avatares do usuário');
        console.log('   POST /api/shop/avatars/:avatarId/equip - Equipar avatar');
        console.log('   GET /api/shop/avatars/current/:userId - Avatar atual');

    } catch (error) {
        console.error('❌ Erro ao popular loja:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado do MongoDB');
    }
}

populateShop();
