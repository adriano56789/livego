import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sendSuccess, sendError } from '../utils/response.js';
import { UserModel } from '../models/User.js';
import { GiftModel } from '../models/Gift.js';
import { StreamerModel } from '../models/Streamer.js';
const ALL_REQUIRED_COLLECTIONS = [
    'users', 'streamers', 'gifts', 'transactions', 'conversations', 'messages',
    'posts', 'comments', 'likes', 'followers', 'notifications', 'frames',
    'music', 'sessions', 'settings', 'reports', 'blocks', 'payouts', 'rankings',
    'streamhistories', 'pkbattles', 'packages'
].sort();
export const dbController = {
    getRequiredCollections: async (req, res) => {
        return sendSuccess(res, ALL_REQUIRED_COLLECTIONS);
    },
    listCollections: async (req, res) => {
        try {
            if (!mongoose.connection.db) {
                return sendError(res, 'Database not connected.', 500);
            }
            const collections = await mongoose.connection.db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);
            return sendSuccess(res, collectionNames);
        }
        catch (err) {
            return sendError(res, 'Falha ao listar coleções do banco de dados.');
        }
    },
    setupDatabase: async (req, res) => {
        try {
            const appDb = mongoose.connection.db;
            if (!appDb) {
                return sendError(res, 'Database not connected.', 500);
            }
            const collections = await appDb.listCollections().toArray();
            const existingNames = collections.map(c => c.name);
            const createdCollections = [];
            for (const collectionName of ALL_REQUIRED_COLLECTIONS) {
                if (!existingNames.includes(collectionName)) {
                    await appDb.createCollection(collectionName);
                    createdCollections.push(collectionName);
                }
            }
            let userCreated = false;
            const adminEmail = 'adrianomdk5@gmail.com';
            const adminExists = await UserModel.findOne({ email: adminEmail });
            if (!adminExists) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('Adriano123', salt);
                const identification = '10000001';
                await UserModel.create({
                    id: `admin-${Date.now()}`,
                    identification,
                    name: 'Adriano Admin',
                    email: adminEmail,
                    password: hashedPassword,
                    avatarUrl: `https://picsum.photos/seed/${identification}/200`,
                    coverUrl: `https://picsum.photos/seed/${identification}-c/1080/1920`,
                    level: 99,
                    diamonds: 999999
                });
                userCreated = true;
            }
            let giftsSeeded = false;
            const giftCount = await GiftModel.countDocuments();
            if (giftCount === 0) {
                const GIFTS_TO_SEED = [
                    { id: 'gift-1', name: 'Coração', price: 1, icon: '❤️', category: 'Popular' },
                    { id: 'gift-4', name: 'Rosa', price: 5, icon: '🌷', category: 'Popular' },
                    { id: 'gift-99', name: 'Coroa', price: 5000, icon: '👑', category: 'Luxo', triggersAutoFollow: true },
                    { id: 'gift-126', name: 'Foguete', price: 500, icon: '🚀', category: 'VIP', triggersAutoFollow: true },
                ];
                await GiftModel.insertMany(GIFTS_TO_SEED);
                giftsSeeded = true;
            }
            let streamersSeeded = false;
            const streamerCount = await StreamerModel.countDocuments();
            if (streamerCount === 0) {
                const streamersToSeed = [
                    { id: '8827364', hostId: '9928374', name: 'Mirella Oficial', avatar: 'https://picsum.photos/seed/9928374/200', location: 'São Paulo', viewers: 12500, category: 'Popular', tags: ['Festa', 'Música'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_9928374/400/600' },
                    { id: '7721938', hostId: '2239485', name: 'DJ Arromba', avatar: 'https://picsum.photos/seed/2239485/200', location: 'Rio de Janeiro', viewers: 8300, category: 'Música', tags: ['Eletrônica'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_2239485/400/600' },
                    { id: '4455667', hostId: '1122334', name: 'Gamer Master', avatar: 'https://picsum.photos/seed/1122334/200', location: 'Curitiba', viewers: 2100, category: 'Jogos', tags: ['Ranked'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_1122334/400/600' },
                    { id: '1199228', hostId: '3344556', name: 'Alice Star', avatar: 'https://picsum.photos/seed/3344556/200', location: 'Miami', viewers: 3500, category: 'Popular', tags: ['Chat'], country: 'en', isLive: true, thumbnail: 'https://picsum.photos/seed/live_3344556/400/600' },
                    { id: '5566778', hostId: '4455667', name: 'Dance Queen', avatar: 'https://picsum.photos/seed/4455667/200', location: 'Salvador', viewers: 980, category: 'Dança', tags: ['Funk', 'Axé'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_4455667/400/600' },
                    { id: '9988776', hostId: '5566778', name: 'Voz da Noite', avatar: 'https://picsum.photos/seed/5566778/200', location: 'Belo Horizonte', viewers: 1540, category: 'Voz', tags: ['Sertanejo', 'Acústico'], country: 'pt', isLive: true, thumbnail: 'https://picsum.photos/seed/live_5566778/400/600' }
                ];
                await StreamerModel.insertMany(streamersToSeed);
                streamersSeeded = true;
            }
            const message = `Sincronização completa. ${createdCollections.length} coleções criadas. Usuário Admin: ${userCreated ? 'Criado' : 'Já existia'}. Presentes: ${giftsSeeded ? 'Semeado' : 'Já existiam'}. Streamers: ${streamersSeeded ? 'Semeado' : 'Já existiam'}.`;
            return sendSuccess(res, { userCreated, createdCollections, giftsSeeded, streamersSeeded, message });
        }
        catch (err) {
            console.error("Falha na configuração do banco de dados:", err);
            return sendError(res, `Falha na configuração do banco: ${err.message}`);
        }
    },
};
