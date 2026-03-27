import express from 'express';
import { User } from '../models/User';

const router = express.Router();

/**
 * POST /api/map/srs-streams
 * Mapeia streams do SRS com dados do banco
 * Body: { streams: SRSStreamData[] }
 * 
 * Esta API apenas cruza dados - não duplica lógica do SRS
 */
router.post('/srs-streams', async (req, res) => {
    try {
        const { streams } = req.body;
        
        if (!Array.isArray(streams)) {
            return res.status(400).json({
                success: false,
                error: 'streams deve ser um array'
            });
        }

        // Extrair userIds dos streams do SRS (usar identification)
        const userIds = streams
            .map(stream => stream.name)
            .filter(name => name && name.trim() !== '');

        if (userIds.length === 0) {
            return res.json({
                success: true,
                data: [],
                mapped: 0,
                timestamp: new Date().toISOString()
            });
        }

        // Buscar usuários no banco em lote usando o campo 'identification' (ID real)
        const users = await User.find({ 
            identification: { $in: userIds } 
        }).select('identification name avatarUrl coverUrl level fans isVIP bio country age gender diamonds earnings isLive chatPermission privateStreamSettings');

        // Criar mapa de identification → user
        const userMap = new Map();
        users.forEach(user => {
            userMap.set(user.identification, user);
        });

        // Mapear streams com dados dos usuários
        const mappedStreams = streams.map(stream => {
            const userId = stream.name;
            const user = userMap.get(userId);
            
            if (!user) {
                // Stream sem usuário correspondente no banco
                return {
                    ...stream,
                    user: null,
                    mapped: false
                };
            }

            return {
                ...stream,
                user: {
                    identification: user.identification,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    coverUrl: user.coverUrl,
                    level: user.level,
                    fans: user.fans,
                    isVIP: user.isVIP,
                    bio: user.bio,
                    country: user.country,
                    age: user.age,
                    gender: user.gender,
                    diamonds: user.diamonds,
                    earnings: user.earnings,
                    isLive: user.isLive,
                    chatPermission: user.chatPermission,
                    privateStreamSettings: user.privateStreamSettings
                },
                mapped: true
            };
        });

        const mappedCount = mappedStreams.filter(s => s.mapped).length;

        res.json({
            success: true,
            data: mappedStreams,
            mapped: mappedCount,
            total: streams.length,
            timestamp: new Date().toISOString(),
            info: {
                description: 'Streams do SRS mapeados com dados do banco',
                source: 'SRS streams + MongoDB users',
                mapping: 'stream.name → user.id'
            }
        });

    } catch (error: any) {
        console.error('[MAP ROUTES] Erro ao mapear streams:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao mapear streams com dados do banco',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/map/srs-clients
 * Mapeia clientes do SRS com dados do banco
 * Body: { clients: SRSClientData[] }
 */
router.post('/srs-clients', async (req, res) => {
    try {
        const { clients } = req.body;
        
        if (!Array.isArray(clients)) {
            return res.status(400).json({
                success: false,
                error: 'clients deve ser um array'
            });
        }

        // Para clientes, precisamos extrair informações de stream se disponível
        const streamIds = clients
            .map(client => client.stream?.name || client.stream)
            .filter(name => name && typeof name === 'string');

        if (streamIds.length === 0) {
            return res.json({
                success: true,
                data: clients.map(client => ({ ...client, user: null, mapped: false })),
                mapped: 0,
                timestamp: new Date().toISOString()
            });
        }

        // Buscar usuários correspondentes
        const users = await User.find({ 
            id: { $in: streamIds } 
        }).select('id name avatarUrl level fans');

        const userMap = new Map();
        users.forEach(user => {
            userMap.set(user.id, user);
        });

        // Mapear clientes com dados dos usuários
        const mappedClients = clients.map(client => {
            const streamName = client.stream?.name || client.stream;
            const user = streamName ? userMap.get(streamName) : null;
            
            return {
                ...client,
                user: user ? {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    level: user.level,
                    fans: user.fans
                } : null,
                mapped: !!user
            };
        });

        const mappedCount = mappedClients.filter(c => c.mapped).length;

        res.json({
            success: true,
            data: mappedClients,
            mapped: mappedCount,
            total: clients.length,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[MAP ROUTES] Erro ao mapear clientes:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao mapear clientes com dados do banco',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
