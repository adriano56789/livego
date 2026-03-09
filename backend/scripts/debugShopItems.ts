import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function debugShopItems() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB!');

        const ShopItem = (await import('../src/models')).ShopItem;

        // Listar todos os itens da loja
        const allItems = await ShopItem.find({});
        console.log(`\n📦 Total de itens na loja: ${allItems.length}`);
        
        // Agrupar por categoria
        const categories: Record<string, any[]> = {};
        allItems.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });

        console.log('\n🏪 Itens por categoria:');
        Object.entries(categories).forEach(([category, items]: [string, any[]]) => {
            console.log(`\n   ${category.toUpperCase()} (${items.length} itens):`);
            items.forEach(item => {
                console.log(`      - ${item.name} (${item.id}) - ${item.price} diamonds - Ativo: ${item.isActive}`);
            });
        });

        // Verificar itens específicos que podem ser "infames"
        console.log('\n🔍 Verificando itens específicos...');
        const suspiciousItems = allItems.filter(item => 
            item.name.toLowerCase().includes('infame') ||
            item.name.toLowerCase().includes('infames') ||
            item.id.toLowerCase().includes('infame') ||
            item.id.toLowerCase().includes('infames')
        );

        if (suspiciousItems.length > 0) {
            console.log('   Itens "infames" encontrados:');
            suspiciousItems.forEach(item => {
                console.log(`      - ${item.name} (${item.id})`);
            });
        } else {
            console.log('   Nenhum item "infame" encontrado');
        }

        // Testar cada endpoint da API
        console.log('\n🌐 Testando endpoints da API...');
        const axios = require('axios');
        const API_BASE = 'http://localhost:3000';

        for (const [category, items] of Object.entries(categories)) {
            try {
                const endpoint = `/api/shop/${category}`;
                console.log(`\n   Testando ${endpoint}...`);
                
                const response = await axios.get(`${API_BASE}${endpoint}`);
                console.log(`   ✅ Status: ${response.status}`);
                console.log(`   ✅ Content-Type: ${response.headers['content-type']}`);
                console.log(`   ✅ Itens retornados: ${Array.isArray(response.data) ? response.data.length : 'Não é array'}`);
                
                if (Array.isArray(response.data)) {
                    const apiItems = response.data;
                    const missingItems = items.filter((dbItem: any) => 
                        !apiItems.some((apiItem: any) => apiItem.id === dbItem.id)
                    );
                    
                    if (missingItems.length > 0) {
                        console.log(`   ⚠️  Itens no banco mas não na API:`);
                        missingItems.forEach((item: any) => {
                            console.log(`      - ${item.name} (${item.id})`);
                        });
                    }
                }
                
            } catch (error: any) {
                console.log(`   ❌ Erro em ${category}: ${error.message}`);
                if (error.response) {
                    console.log(`   Status: ${error.response.status}`);
                    console.log(`   Data: ${JSON.stringify(error.response.data)}`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado do MongoDB');
    }
}

debugShopItems();
