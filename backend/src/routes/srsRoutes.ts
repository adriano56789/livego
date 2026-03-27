/**
 * Rotas da API HTTP do SRS
 * Integração completa seguindo documentação oficial
 */

import express from 'express';
import srsApiService from '../services/srsApiService';
import { User } from '../models/User';

const router = express.Router();

/**
 * GET /api/srs/status
 * Verifica se o SRS está online e acessível
 */
router.get('/status', async (req, res) => {
    try {
        const result = await srsApiService.checkConnection();
        
        if (result.success) {
            res.json({
                success: true,
                online: true,
                version: result.version,
                server: result.server,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                success: false,
                online: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error('[SRS ROUTES] Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao verificar status do SRS',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/srs/summaries
 * Obtém estatísticas completas do sistema SRS
 */
router.get('/summaries', async (req, res) => {
    try {
        const result = await srsApiService.getSummaries();
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                server: result.server,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.code || 500).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error('[SRS ROUTES] Erro ao obter sumários:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao obter estatísticas do SRS',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/srs/callback
 * Endpoint para receber callbacks do SRS (on_publish, on_play, etc.)
 */
router.post('/callback', async (req, res) => {
    try {
        console.log('[SRS CALLBACK] Evento recebido:', {
            action: req.body.action,
            client_id: req.body.client_id,
            stream: req.body.stream,
            param: req.body.param,
            code: req.body.code,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        // Processar diferentes tipos de eventos
        switch (req.body.action) {
            case 'on_publish':
                console.log('[SRS CALLBACK] Stream publicado:', req.body.stream);
                // Notificar WebSocket sobre novo stream
                const socketService = require('../services/socket');
                const socket = socketService.getSocket();
                if (socket) {
                    socket.emit('srs_stream_published', {
                        stream: req.body.stream,
                        client_id: req.body.client_id,
                        data: req.body
                    });
                }
                break;

            case 'on_play':
                console.log('[SRS CALLBACK] Stream sendo assistido:', req.body.stream);
                // Notificar WebSocket sobre viewer
                const socketService2 = require('../services/socket');
                const socket2 = socketService2.getSocket();
                if (socket2) {
                    socket2.emit('srs_stream_played', {
                        stream: req.body.stream,
                        client_id: req.body.client_id,
                        data: req.body
                    });
                }
                break;

            case 'on_unpublish':
                console.log('[SRS CALLBACK] Stream parado:', req.body.stream);
                const socketService3 = require('../services/socket');
                const socket3 = socketService3.getSocket();
                if (socket3) {
                    socket3.emit('srs_stream_unpublished', {
                        stream: req.body.stream,
                        client_id: req.body.client_id,
                        data: req.body
                    });
                }
                break;

            case 'on_stop':
                console.log('[SRS CALLBACK] Stream parado:', req.body.stream);
                const socketService4 = require('../services/socket');
                const socket4 = socketService4.getSocket();
                if (socket4) {
                    socket4.emit('srs_stream_stopped', {
                        stream: req.body.stream,
                        client_id: req.body.client_id,
                        data: req.body
                    });
                }
                break;

            default:
                console.log('[SRS CALLBACK] Evento não tratado:', req.body.action);
                break;
        }

        // Responder conforme especificação SRS
        res.status(200).json({
            code: 0,
            msg: 'OK',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[SRS ROUTES] Erro ao processar callback:', error);
        res.status(500).json({
            code: 1,
            msg: 'Internal Server Error',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/srs/streams
 * Proxy para API oficial do SRS: GET /api/v1/streams
 * Query params: start, count
 * 
 * Retorna dados brutos do SRS para processamento no frontend
 */
router.get('/streams', async (req, res) => {
    try {
        const start = parseInt(req.query.start as string) || 0;
        const count = parseInt(req.query.count as string) || 50;
        
        // Usar API oficial do SRS diretamente
        const result = await srsApiService.getStreams(start, count);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                total: result.total,
                server: result.server,
                pagination: {
                    start,
                    count,
                    total: result.total
                },
                timestamp: new Date().toISOString(),
                info: {
                    source: 'SRS Official API /api/v1/streams',
                    description: 'Dados brutos do SRS - processamento no frontend',
                    mapping: 'stream.name = userId (mapeado no cliente)'
                }
            });
        } else {
            res.status(result.code || 500).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error('[SRS ROUTES] Erro ao buscar streams do SRS:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao acessar API do SRS',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/srs/streams/:id
 * Obtém detalhes de um stream específico
 */
router.get('/streams/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await srsApiService.getStream(id);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                server: result.server,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.code || 404).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error(`[SRS ROUTES] Erro ao obter stream ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao obter stream do SRS',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/srs/streams/:id/stats
 * Obtém estatísticas detalhadas de um stream
 */
router.get('/streams/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await srsApiService.getStreamStats(id);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                server: result.server,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.code || 404).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error(`[SRS ROUTES] Erro ao obter estatísticas do stream ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao obter estatísticas do stream',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/srs/clients
 * Lista todos os clientes conectados ao SRS
 * Query params: start, count
 */
router.get('/clients', async (req, res) => {
    try {
        const start = parseInt(req.query.start as string) || 0;
        const count = parseInt(req.query.count as string) || 10;
        
        const result = await srsApiService.getClients(start, count);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                total: result.total,
                server: result.server,
                pagination: {
                    start,
                    count,
                    total: result.total
                },
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.code || 500).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error('[SRS ROUTES] Erro ao listar clientes:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao listar clientes do SRS',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/srs/clients/:id
 * Obtém detalhes de um cliente específico
 */
router.get('/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await srsApiService.getClient(id);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                server: result.server,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.code || 404).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error(`[SRS ROUTES] Erro ao obter cliente ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao obter cliente do SRS',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * DELETE /api/srs/clients/:id
 * Remove/desconecta um cliente do SRS
 */
router.delete('/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await srsApiService.kickClient(id);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Cliente ${id} removido com sucesso`,
                data: result.data,
                server: result.server,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.code || 404).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error(`[SRS ROUTES] Erro ao remover cliente ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao remover cliente do SRS',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/srs/vhosts
 * Lista todos os vhosts configurados no SRS
 */
router.get('/vhosts', async (req, res) => {
    try {
        const result = await srsApiService.getVhosts();
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                server: result.server,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.code || 500).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error('[SRS ROUTES] Erro ao listar vhosts:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao listar vhosts do SRS',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/srtc/publish
 * WebRTC Publish - WHIP Protocol
 * Body: { app, stream, sdp }
 */
router.post('/webrtc/publish', async (req, res) => {
    try {
        const { app, stream, sdp } = req.body;
        
        if (!app || !stream || !sdp) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros obrigatórios: app, stream, sdp',
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await srsApiService.publishWebRTC(app, stream, sdp);
        
        if (result.success) {
            res.status(201).json({
                success: true,
                data: result.data,
                server: result.server,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.code || 400).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error('[SRS ROUTES] Erro no WebRTC publish:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno no WebRTC publish',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/srtc/play
 * WebRTC Play - WHEP Protocol
 * Body: { app, stream, sdp }
 */
router.post('/webrtc/play', async (req, res) => {
    try {
        const { app, stream, sdp } = req.body;
        
        if (!app || !stream || !sdp) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros obrigatórios: app, stream, sdp',
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await srsApiService.playWebRTC(app, stream, sdp);
        
        if (result.success) {
            res.status(201).json({
                success: true,
                data: result.data,
                server: result.server,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.code || 400).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error('[SRS ROUTES] Erro no WebRTC play:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno no WebRTC play',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/srs/find-stream/:name
 * Busca um stream pelo nome
 */
router.get('/find-stream/:name', async (req, res) => {
    try {
        const { name } = req.params;
        
        const result = await srsApiService.findStreamByName(name);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                server: result.server,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(result.code || 404).json({
                success: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error: any) {
        console.error(`[SRS ROUTES] Erro ao buscar stream ${req.params.name}:`, error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao buscar stream',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
