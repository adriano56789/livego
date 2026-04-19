// ============================================
// LiveKit Routes — Geração de Token JWT
// Substitui STUN/TURN manual + WebRTC separado
// ============================================
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { User, Streamer } from '../models';
import { getUserIdFromToken } from '../middleware/auth';

const router = express.Router();

// Configuração LiveKit (self-hosted)
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APILiveGoKey2024';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'APILiveGoSecret2024xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL || 'ws://72.60.249.175:7880';

/**
 * POST /api/livekit/token
 * 
 * Gera token JWT para conectar ao LiveKit Room.
 * O LiveKit já inclui WebRTC + STUN + TURN — não precisa de nada separado.
 * 
 * Body:
 *   - roomName: string (obrigatório) — nome/ID da sala
 *   - participantName: string (opcional) — nome de exibição
 *   - canPublish: boolean (opcional, default: false) — true = broadcaster, false = viewer
 * 
 * Headers:
 *   - Authorization: Bearer <JWT do usuário>
 */
router.post('/token', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { roomName, participantName, canPublish = false } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Token inválido' });
    }

    if (!roomName) {
      return res.status(400).json({ error: 'roomName é obrigatório' });
    }

    // Verificar se usuário existe
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se é broadcaster, verificar/criar stream no banco
    if (canPublish) {
      const existingStream = await Streamer.findOne({ 
        hostId: userId, 
        isLive: true,
        streamStatus: 'active'
      });

      if (!existingStream) {
        console.log(`🎬 [LiveKit] Host ${userId} sem stream ativa — crie via POST /api/streams primeiro`);
      } else {
        console.log(`🎬 [LiveKit] Host ${userId} tem stream ativa: ${existingStream.id}`);
      }
    }

    // Criar AccessToken do LiveKit
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      name: participantName || user.name || 'Usuário',
      ttl: '6h', // Token válido por 6 horas
    });

    // Definir permissões (grants)
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: canPublish,        // true = pode enviar vídeo/áudio (broadcaster)
      canSubscribe: true,            // todos podem assistir
      canPublishData: true,          // chat/dados em tempo real
    });

    // Gerar JWT
    const token = await at.toJwt();

    console.log(`🔑 [LiveKit] Token gerado: user=${userId}, room=${roomName}, publish=${canPublish}`);

    res.json({
      success: true,
      token,
      wsUrl: LIVEKIT_WS_URL,
      roomName,
      identity: userId,
      canPublish,
    });

  } catch (error: any) {
    console.error('❌ [LiveKit] Erro ao gerar token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/livekit/token/viewer
 * 
 * Atalho simplificado para viewers (sem autenticação obrigatória)
 * Usado quando o viewer clica para assistir uma live
 * 
 * Body:
 *   - roomName: string (obrigatório)
 *   - viewerName: string (opcional)
 */
router.post('/token/viewer', async (req, res) => {
  try {
    const { roomName, viewerName } = req.body;

    if (!roomName) {
      return res.status(400).json({ error: 'roomName é obrigatório' });
    }

    // Tentar pegar userId do token (se tiver), senão gerar ID anônimo
    let userId: string;
    let displayName: string;

    try {
      const tokenUserId = getUserIdFromToken(req);
      if (tokenUserId) {
        userId = tokenUserId;
        const user = await User.findOne({ id: userId });
        displayName = viewerName || user?.name || 'Viewer';
      } else {
        throw new Error('No token');
      }
    } catch {
      // Viewer anônimo
      userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      displayName = viewerName || 'Visitante';
    }

    // Verificar se a room/stream existe
    const stream = await Streamer.findOne({
      $or: [
        { id: roomName },
        { roomId: roomName }
      ],
      isLive: true
    });

    if (!stream) {
      return res.status(404).json({ error: 'Live não encontrada ou offline' });
    }

    // Criar token de viewer (sem permissão de publish)
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      name: displayName,
      ttl: '6h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: false,     // viewer não publica
      canSubscribe: true,    // viewer assiste
      canPublishData: true,  // pode enviar chat/presentes
    });

    const token = await at.toJwt();

    console.log(`👁️ [LiveKit] Viewer token: user=${userId}, room=${roomName}`);

    res.json({
      success: true,
      token,
      wsUrl: LIVEKIT_WS_URL,
      roomName,
      identity: userId,
      canPublish: false,
      streamInfo: {
        id: stream.id,
        name: stream.name,
        hostId: stream.hostId,
        viewers: stream.viewers,
      }
    });

  } catch (error: any) {
    console.error('❌ [LiveKit] Erro ao gerar viewer token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/livekit/rooms
 * Lista rooms/streams ativas (para debug e admin)
 */
router.get('/rooms', async (req, res) => {
  try {
    const activeStreams = await Streamer.find({
      isLive: true,
      streamStatus: 'active'
    }).select('id hostId name viewers roomId country startTime');

    res.json({
      success: true,
      rooms: activeStreams.map(s => ({
        roomName: s.roomId || s.id,
        streamId: s.id,
        hostId: s.hostId,
        name: s.name,
        viewers: s.viewers,
        country: s.country,
        startTime: s.startTime,
      })),
      count: activeStreams.length,
      server: {
        wsUrl: LIVEKIT_WS_URL,
        turnEnabled: true,
      }
    });
  } catch (error: any) {
    console.error('❌ [LiveKit] Erro ao listar rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/livekit/health
 * Health check do LiveKit
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    livekit: {
      wsUrl: LIVEKIT_WS_URL,
      keyConfigured: !!LIVEKIT_API_KEY,
      secretConfigured: !!LIVEKIT_API_SECRET,
      turnEnabled: true,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
