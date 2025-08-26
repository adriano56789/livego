const express = require('express');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');
const { handleApiRequest } = require('../services/api');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentar o limite para upload de imagens

const PORT = process.env.PORT || 3001;

// --- LiveKit Configuration ---
// These are now loaded from the config file to simulate environment variables.
const LIVEKIT_API_KEY = config.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = config.LIVEKIT_API_SECRET;
// ---

// Endpoint para gerar tokens do LiveKit
app.post('/api/livekit/token', (req, res) => {
    const { roomName, participantIdentity } = req.body;

    if (!roomName || !participantIdentity) {
        return res.status(400).json({ error: 'roomName e participantIdentity são obrigatórios' });
    }

    try {
        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: participantIdentity,
            // O nome do participante, opcional
            name: participantIdentity, 
        });

        // Permissões para o participante
        at.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
        });
        
        const token = at.toJwt();
        console.log(`[API Server] LiveKit token gerado para '${participantIdentity}' em '${roomName}'`);
        res.json({ token });
    } catch (e) {
        console.error('[API Server] Erro ao gerar token LiveKit:', e);
        res.status(500).json({ error: 'Não foi possível gerar o token do LiveKit' });
    }
});


// Roteador genérico para todas as outras chamadas da API simulada
app.all('/api/*', async (req, res) => {
    try {
        const method = req.method;
        const path = req.path;
        const body = req.body;
        const query = new URLSearchParams(req.query);

        console.log(`[API Server] Recebida: ${method} ${path}`);

        const result = await handleApiRequest(method, path, body, query);
        
        // Retorna 204 para respostas sem conteúdo
        if (result === null || result === undefined) {
            return res.status(204).send();
        }

        res.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no servidor';
        console.error(`[API Server] Erro em ${req.method} ${req.path}:`, errorMessage);
        const statusCode = errorMessage.includes('não encontrado') ? 404 : 500;
        res.status(statusCode).json({ error: errorMessage });
    }
});

app.listen(PORT, () => {
    console.log(`[API Server] Servidor Express real (com dados simulados) rodando na porta ${PORT}`);
    console.log(`[API Server] Frontend deve fazer requisições para http://localhost:${PORT}`);
    console.log(`[API Server] Chave LiveKit usada: ${LIVEKIT_API_KEY}`);
    console.log(`[API Server] Conexão com MongoDB simulada em: ${config.MONGO_URI}`);
});