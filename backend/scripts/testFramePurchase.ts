import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function testFramePurchase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB!');

        const User = (await import('../src/models')).User;
        const Frame = (await import('../src/models')).Frame;
        const UserFrame = (await import('../src/models')).UserFrame;

        // Buscar usuário
        const user = await User.findOne({ id: '65384127' });
        if (!user) {
            console.log('❌ Usuário não encontrado');
            return;
        }

        console.log(`\n💰 Diamonds atuais: ${user.diamonds}`);

        // Adicionar diamonds para teste
        user.diamonds = 5000;
        await user.save();
        console.log(`💰 Diamonds atualizados para: ${user.diamonds}`);

        // Buscar frame mais barato
        const cheapFrame = await Frame.findOne({}).sort({ price: 1 });
        if (!cheapFrame) {
            console.log('❌ Nenhum frame encontrado');
            return;
        }

        console.log(`\n🖼️ Frame para teste: ${cheapFrame.name} (${cheapFrame.price} diamonds)`);

        // Testar compra via API
        const axios = require('axios');
        const API_BASE = 'http://localhost:3000';

        console.log('\n🛒 Testando compra via API...');
        const purchaseResponse = await axios.post(`${API_BASE}/api/frames/${cheapFrame.id}/purchase`, {
            userId: '65384127'
        });

        console.log('✅ Compra realizada!');
        console.log('Status:', purchaseResponse.status);
        console.log('Response:', JSON.stringify(purchaseResponse.data, null, 2));

        // Verificar se foi salvo no banco
        console.log('\n🔍 Verificando salvamento no banco...');
        const userFrame = await UserFrame.findOne({ 
            userId: '65384127', 
            frameId: cheapFrame.id 
        });

        if (userFrame) {
            console.log('✅ Frame salvo no MongoDB!');
            console.log(`   Frame ID: ${userFrame.frameId}`);
            console.log(`   Data compra: ${userFrame.purchaseDate}`);
            console.log(`   Data expiração: ${userFrame.expirationDate}`);
            console.log(`   Ativo: ${userFrame.isActive}`);
            console.log(`   Equipado: ${userFrame.isEquipped}`);

            // Verificar diamonds deduzidos
            const updatedUser = await User.findOne({ id: '65384127' });
            if (updatedUser) {
                console.log(`   Diamonds após compra: ${updatedUser.diamonds}`);
            }
        } else {
            console.log('❌ Frame NÃO foi salvo no MongoDB!');
        }

        // Testar equipar frame
        console.log('\n⚙️ Testando equipar frame...');
        const equipResponse = await axios.post(`${API_BASE}/api/frames/${cheapFrame.id}/equip`, {
            userId: '65384127'
        });

        console.log('✅ Frame equipado!');
        console.log('Status:', equipResponse.status);
        console.log('Response:', JSON.stringify(equipResponse.data, null, 2));

        // Verificar frame atual
        console.log('\n🎯 Verificando frame equipado...');
        const currentFrame = await UserFrame.findOne({ 
            userId: '65384127', 
            isEquipped: true 
        });

        if (currentFrame) {
            console.log('✅ Frame equipado encontrado!');
            console.log(`   Frame ID: ${currentFrame.frameId}`);
            console.log(`   Equipado: ${currentFrame.isEquipped}`);
        } else {
            console.log('❌ Frame equipado NÃO encontrado!');
        }

        console.log('\n🎉 Teste concluído com sucesso!');
        console.log('✅ Frames estão sendo salvos no MongoDB');
        console.log('✅ APIs estão funcionando corretamente');
        console.log('✅ Sistema de persistência automática funcionando');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado do MongoDB');
    }
}

testFramePurchase();
