import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:adriano123@localhost:27017/api?authSource=admin';

async function debugFrames() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB!');

        const Frame = (await import('../src/models')).Frame;
        const UserFrame = (await import('../src/models')).UserFrame;

        // Verificar frames disponíveis
        const frames = await Frame.find({});
        console.log(`\n🖼️ Frames disponíveis no banco: ${frames.length}`);
        
        if (frames.length === 0) {
            console.log('❌ NENHUM FRAME encontrado no banco!');
            console.log('   Execute: npx ts-node scripts/populateFrames.ts');
            return;
        }

        frames.forEach(frame => {
            console.log(`   - ${frame.name} (${frame.id}) - ${frame.price} diamonds - ${frame.duration} dias`);
        });

        // Verificar frames do usuário
        const userFrames = await UserFrame.find({ userId: '65384127' });
        console.log(`\n👤 Frames do usuário 65384127: ${userFrames.length}`);
        
        userFrames.forEach(userFrame => {
            const expDate = new Date(userFrame.expirationDate);
            const now = new Date();
            const isExpired = expDate < now;
            const remainingDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            console.log(`   - Frame: ${userFrame.frameId}`);
            console.log(`     Comprado: ${userFrame.purchaseDate}`);
            console.log(`     Expira: ${userFrame.expirationDate}`);
            console.log(`     Dias restantes: ${Math.max(0, remainingDays)}`);
            console.log(`     Status: ${isExpired ? 'EXPIRADO' : 'ATIVO'}`);
            console.log(`     Equipado: ${userFrame.isEquipped ? 'SIM' : 'NÃO'}`);
            console.log('');
        });

        // Testar API de frames
        console.log('\n🌐 Testando APIs de frames...');
        const axios = require('axios');
        const API_BASE = 'http://localhost:3000';

        try {
            console.log('\n   Testando GET /api/frames...');
            const framesResponse = await axios.get(`${API_BASE}/api/frames`);
            console.log(`   ✅ Status: ${framesResponse.status}`);
            console.log(`   ✅ Content-Type: ${framesResponse.headers['content-type']}`);
            console.log(`   ✅ Frames retornados: ${Array.isArray(framesResponse.data) ? framesResponse.data.length : 'Não é array'}`);

            console.log('\n   Testando GET /api/frames/user/65384127...');
            const userFramesResponse = await axios.get(`${API_BASE}/api/frames/user/65384127`);
            console.log(`   ✅ Status: ${userFramesResponse.status}`);
            console.log(`   ✅ Frames do usuário: ${Array.isArray(userFramesResponse.data) ? userFramesResponse.data.length : 'Não é array'}`);

            console.log('\n   Testando GET /api/frames/current/65384127...');
            const currentFrameResponse = await axios.get(`${API_BASE}/api/frames/current/65384127`);
            console.log(`   ✅ Status: ${currentFrameResponse.status}`);
            console.log(`   ✅ Frame atual: ${currentFrameResponse.data ? 'ENCONTRADO' : 'NENHUM'}`);

            // Testar compra de frame
            if (frames.length > 0) {
                console.log('\n   Testando compra de frame...');
                try {
                    const testFrame = frames[0]; // Primeiro frame disponível
                    console.log(`   🛒 Tentando comprar: ${testFrame.name} (${testFrame.price} diamonds)`);
                    
                    const purchaseResponse = await axios.post(`${API_BASE}/api/frames/${testFrame.id}/purchase`, {
                        userId: '65384127'
                    });
                    console.log(`   ✅ Status: ${purchaseResponse.status}`);
                    console.log(`   ✅ Resposta: ${JSON.stringify(purchaseResponse.data)}`);
                } catch (purchaseError: any) {
                    console.log(`   ❌ Erro na compra: ${purchaseError.message}`);
                    if (purchaseError.response) {
                        console.log(`   Status: ${purchaseError.response.status}`);
                        console.log(`   Data: ${JSON.stringify(purchaseError.response.data)}`);
                    }
                }
            }

        } catch (apiError: any) {
            console.error('❌ Erro ao testar APIs:', apiError.message);
            if (apiError.response) {
                console.error('Status:', apiError.response.status);
                console.error('Data:', JSON.stringify(apiError.response.data));
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado do MongoDB');
    }
}

debugFrames();
