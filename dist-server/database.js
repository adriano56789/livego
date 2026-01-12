import mongoose from 'mongoose';
import config from './config/settings.js';
import { ensureAllCollectionsExist } from './utils/dbInitializer.js';
export const connectDB = async (retries = 5, delay = 5000) => {
    while (retries > 0) {
        try {
            await mongoose.connect(config.mongoUri);
            console.log(`✅ Conectado ao MongoDB Real em: ${config.mongoUri.replace(/:([^:]+)@/, ':***@')}`);
            await ensureAllCollectionsExist();
            console.log('🌱 Banco de dados pronto para operações.');
            return;
        }
        catch (err) {
            retries--;
            console.error(`❌ Falha na conexão com o banco de dados. Tentativas restantes: ${retries}`, err);
            if (retries === 0) {
                throw err;
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
};
