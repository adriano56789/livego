import express from 'express';
import axios from 'axios';
import { getUserIdFromToken } from '../middleware/auth';
import SrsApiService from '../services/srsApiService';

const router = express.Router();

// Configuração do SRS
const SRS_BASE_URL = process.env.SRS_API_URL || 'http://72.60.249.175:1985';
const SRS_WEBRTC_URL = process.env.SRS_WEBRTC_URL || 'http://72.60.249.175:1985';

/**
 * WebRTC Publish - WHIP (WebRTC-HTTP Ingestion Protocol)
 * POST /api/webrtc/publish
 * 
 * Corpo da requisição:
 * {
 *   "userId": "string", // ID real do usuário
 *   "sdp": "string"    // SDP offer do cliente
 * }
 * 
 * Resposta:
 * {
 *   "code": 0,
 *   "sdp": "string",   // SDP answer do SRS
 *   "streamUrl": "string" // URL do stream publicado
 * }
 */
router.post('/publish', async (req, res) => {
    try {
        const { userId, sdp } = req.body;
        
        if (!userId || !sdp) {
            return res.status(400).json({
                code: 400,
                message: 'userId e sdp são obrigatórios'
            });
        }

        // Validar token e obter usuário autenticado
        const tokenUserId = getUserIdFromToken(req);
        if (!tokenUserId || tokenUserId !== userId) {
            return res.status(401).json({
                code: 401,
                message: 'Não autorizado'
            });
        }

        // Construir URL WHIP seguindo padrão SRS
        // POST /rtc/v1/whip/?app=live&stream={userId_real}
        const whipUrl = `${SRS_WEBRTC_URL}/rtc/v1/whip/?app=live&stream=${userId}`;
        
        console.log(`[WebRTC] WHIP Publish - User: ${userId}, URL: ${whipUrl}`);

        // Enviar SDP offer para SRS
        const response = await axios.post(whipUrl, sdp, {
            headers: {
                'Content-Type': 'application/sdp'
            },
            timeout: 10000
        });

        // WHIP specification usa status 201
        if (response.status === 201) {
            const srsAnswer = response.data;
            
            // Retornar SDP answer do SRS para o cliente
            return res.json({
                code: 0,
                sdp: srsAnswer,
                streamUrl: `webrtc://72.60.249.175:8000/live/${userId}`,
                userId: userId
            });
        } else {
            throw new Error(`Status inesperado: ${response.status}`);
        }

    } catch (error: any) {
        console.error('[WebRTC] Erro no publish WHIP:', error.message);
        
        return res.status(500).json({
            code: 500,
            message: 'Erro ao publicar stream WebRTC',
            error: error.response?.data || error.message
        });
    }
});

/**
 * WebRTC Play - WHEP (WebRTC-HTTP Egress Protocol)
 * POST /api/webrtc/play
 * 
 * Corpo da requisição:
 * {
 *   "streamId": "string", // ID real do stream (userId do streamer)
 *   "sdp": "string"       // SDP offer do cliente
 * }
 * 
 * Resposta:
 * {
 *   "code": 0,
 *   "sdp": "string",      // SDP answer do SRS
 *   "streamUrl": "string" // URL do stream para playback
 * }
 */
router.post('/play', async (req, res) => {
    try {
        const { streamId, sdp } = req.body;
        
        if (!streamId || !sdp) {
            return res.status(400).json({
                code: 400,
                message: 'streamId e sdp são obrigatórios'
            });
        }

        // Validar token (usuário precisa estar autenticado para assistir)
        const tokenUserId = getUserIdFromToken(req);
        if (!tokenUserId) {
            return res.status(401).json({
                code: 401,
                message: 'Não autorizado'
            });
        }

        // Construir URL WHEP seguindo padrão SRS
        // POST /rtc/v1/whep/?app=live&stream={userId_real}
        const whepUrl = `${SRS_WEBRTC_URL}/rtc/v1/whep/?app=live&stream=${streamId}`;
        
        console.log(`[WebRTC] WHEP Play - Stream: ${streamId}, Viewer: ${tokenUserId}, URL: ${whepUrl}`);

        // Enviar SDP offer para SRS
        const response = await axios.post(whepUrl, sdp, {
            headers: {
                'Content-Type': 'application/sdp'
            },
            timeout: 10000
        });

        // WHEP specification usa status 201
        if (response.status === 201) {
            const srsAnswer = response.data;
            
            // Retornar SDP answer do SRS para o cliente
            return res.json({
                code: 0,
                sdp: srsAnswer,
                streamUrl: `webrtc://72.60.249.175:8000/live/${streamId}`,
                streamId: streamId
            });
        } else {
            throw new Error(`Status inesperado: ${response.status}`);
        }

    } catch (error: any) {
        console.error('[WebRTC] Erro no play WHEP:', error.message);
        
        // Se o stream não existir, retornar erro específico
        if (error.response?.status === 404) {
            return res.status(404).json({
                code: 404,
                message: 'Stream não encontrado ou offline'
            });
        }
        
        return res.status(500).json({
            code: 500,
            message: 'Erro ao reproduzir stream WebRTC',
            error: error.response?.data || error.message
        });
    }
});

/**
 * Parar stream WebRTC
 * DELETE /api/webrtc/stop
 * 
 * Corpo da requisição:
 * {
 *   "streamUrl": "string" // URL do stream para parar
 * }
 */
router.delete('/stop', async (req, res) => {
    try {
        const { streamUrl } = req.body;
        
        if (!streamUrl) {
            return res.status(400).json({
                code: 400,
                message: 'streamUrl é obrigatório'
            });
        }

        const tokenUserId = getUserIdFromToken(req);
        if (!tokenUserId) {
            return res.status(401).json({
                code: 401,
                message: 'Não autorizado'
            });
        }

        // Extrair userId da URL para validação
        const userIdMatch = streamUrl.match(/\/([^\/]+)$/);
        const streamUserId = userIdMatch ? userIdMatch[1] : null;
        
        if (!streamUserId || streamUserId !== tokenUserId) {
            return res.status(403).json({
                code: 403,
                message: 'Apenas o dono pode parar o stream'
            });
        }

        console.log(`[WebRTC] Stop Stream - User: ${tokenUserId}, URL: ${streamUrl}`);

        // O SRS não tem endpoint explícito para parar WebRTC
        // A conexão é encerrada quando o cliente desconecta
        // Aqui podemos apenas registrar o encerramento
        
        return res.json({
            code: 0,
            message: 'Stream encerrado com sucesso'
        });

    } catch (error: any) {
        console.error('[WebRTC] Erro ao parar stream:', error.message);
        
        return res.status(500).json({
            code: 500,
            message: 'Erro ao parar stream WebRTC',
            error: error.message
        });
    }
});

/**
 * Verificar status do stream no SRS
 * GET /api/webrtc/status/:streamId
 */
router.get('/status/:streamId', async (req, res) => {
    try {
        const { streamId } = req.params;
        
        if (!streamId) {
            return res.status(400).json({
                code: 400,
                message: 'streamId é obrigatório'
            });
        }

        // Usar SRS API para verificar se stream está ativo
        const srsService = SrsApiService;
        const streamInfo = await srsService.findStreamByName(streamId);
        
        if (streamInfo.success) {
            return res.json({
                code: 0,
                active: true,
                stream: streamInfo.data
            });
        } else {
            return res.json({
                code: 0,
                active: false,
                message: 'Stream não encontrado'
            });
        }

    } catch (error: any) {
        console.error('[WebRTC] Erro ao verificar status:', error.message);
        
        return res.status(500).json({
            code: 500,
            message: 'Erro ao verificar status do stream',
            error: error.message
        });
    }
});

/**
 * Gerar URLs WebRTC para um usuário
 * GET /api/webrtc/urls/:userId
 */
router.get('/urls/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                code: 400,
                message: 'userId é obrigatório'
            });
        }

        const tokenUserId = getUserIdFromToken(req);
        if (!tokenUserId || tokenUserId !== userId) {
            return res.status(401).json({
                code: 401,
                message: 'Não autorizado'
            });
        }

        // Gerar URLs seguindo padrão SRS
        const publishUrl = `${SRS_WEBRTC_URL}/rtc/v1/whip/?app=live&stream=${userId}`;
        const playUrl = `${SRS_WEBRTC_URL}/rtc/v1/whep/?app=live&stream=${userId}`;
        const streamUrl = `webrtc://72.60.249.175:8000/live/${userId}`;
        
        return res.json({
            code: 0,
            userId: userId,
            urls: {
                publish: publishUrl,      // URL para publicar (WHIP)
                play: playUrl,           // URL para reproduzir (WHEP)
                stream: streamUrl        // URL do stream WebRTC
            }
        });

    } catch (error: any) {
        console.error('[WebRTC] Erro ao gerar URLs:', error.message);
        
        return res.status(500).json({
            code: 500,
            message: 'Erro ao gerar URLs WebRTC',
            error: error.message
        });
    }
});

export default router;
