
import express from 'express';
import { User } from '../models';
import { getUserIdFromToken } from '../middleware/auth';

const router = express.Router();

// Atualizar localização do usuário
router.post('/update', async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const user = await User.findOneAndUpdate(
            { id: userId },
            {
                geoLocation: {
                    type: 'Point',
                    coordinates: [longitude, latitude] // MongoDB usa [longitude, latitude]
                },
                locationPermission: 'granted', // Assumimos que se enviou, permitiu
                showLocation: true
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error: any) {
        console.error('Error updating location:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Buscar usuários próximos
router.get('/nearby', async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const { latitude, longitude, maxDistance = 50000, limit = 20 } = req.query; // maxDistance em metros (padrão 50km)

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const lat = parseFloat(latitude as string);
        const lng = parseFloat(longitude as string);
        const maxDist = parseInt(maxDistance as string);
        const limitUsers = parseInt(limit as string);

        // Busca geoespacial
        const users = await User.find({
            geoLocation: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: maxDist
                }
            },
            id: { $ne: userId }, // Excluir o próprio usuário se estiver logado
            isOnline: true // Opcional: mostrar apenas online? Por enquanto vou deixar comentado se quiser todos
        })
        .limit(limitUsers)
        .select('id name avatarUrl distance location isLive isOnline level'); // Selecionar campos relevantes

        // Calcular distância aproximada para exibição (opcional, o $near já ordena)
        const usersWithDistance = users.map(u => {
            // Aqui poderíamos adicionar um campo virtual de distância se necessário
            return u.toObject();
        });

        res.json(usersWithDistance);
    } catch (error: any) {
        console.error('Error fetching nearby users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
