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
 * Retorna status detalhado para tratamento no frontend
 */
router.get('/status', async (req, res) => {
    try {
        const result = await srsApiService.checkConnection();
        
        if (result.success) {
            // SRS online - retornar informações reais
            res.json({
                success: true,
                online: true,
                version: result.version,
                server: result.server,
                timestamp: new Date().toISOString(),
                apiEndpoint: srsApiService.getBaseUrl(),
                message: 'SRS está online e acessível'
            });
        } else {
            // SRS offline - retornar erro detalhado
            const statusCode = result.code === 500 || result.code === 503 ? 503 : 500;
            
            res.status(statusCode).json({
                success: false,
                online: false,
                error: result.error,
                code: result.code,
                apiEndpoint: srsApiService.getBaseUrl(),
                timestamp: new Date().toISOString(),
                message: 'SRS não está acessível - verifique se o servidor está rodando',
                suggestions: [
                    'Verifique se o SRS está rodando no endpoint configurado',
                    'Confirme se o firewall não está bloqueando a conexão',
                    'Verifique se a URL do SRS_API_URL está correta no .env'
                ]
            });
        }
    } catch (error: any) {
        console.error('[SRS ROUTES] Erro crítico ao verificar status:', error);
        
        // Erro de conexão ou timeout
        res.status(503).json({
            success: false,
            online: false,
            error: error.message || 'Erro de conexão com SRS',
            code: 503,
            apiEndpoint: srsApiService.getBaseUrl(),
            timestamp: new Date().toISOString(),
            message: 'Falha crítica na conexão com SRS',
            suggestions: [
                'SRS pode estar offline',
                'Problemas de rede',
                'Endpoint configurado incorretamente'
            ]
        });
    }
});

/**
 * GET /api/srs/summaries
 * Obtém estatísticas completas do sistema SRS
 * Retorna erro detalhado quando SRS está offline
 */
router.get('/summaries', async (req, res) => {
    try {
        const result = await srsApiService.getSummaries();
        
        if (result.success) {
            // Dados reais do SRS
            res.json({
                success: true,
                data: result.data,
                server: result.server,
                serverRestarted: result.serverRestarted || false,
                timestamp: new Date().toISOString(),
                source: 'SRS Official API /api/v1/summaries'
            });
        } else {
            // SRS offline ou erro
            const statusCode = result.code || 500;
            
            res.status(statusCode).json({
                success: false,
                error: result.error,
                code: result.code,
                apiEndpoint: srsApiService.getBaseUrl(),
                timestamp: new Date().toISOString(),
                message: statusCode === 503 ? 
                    'SRS não está acessível no momento' : 
                    'Erro ao obter estatísticas do SRS'
            });
        }
    } catch (error: any) {
        console.error('[SRS ROUTES] Erro ao obter sumários:', error);
        
        // Erro de conexão
        res.status(503).json({
            success: false,
            error: error.message || 'Falha na conexão com SRS',
            code: 503,
            apiEndpoint: srsApiService.getBaseUrl(),
            timestamp: new Date().toISOString(),
            message: 'Não foi possível conectar ao SRS para obter estatísticas'
        });
    }
});

/**
 * POST /api/srs/callback
 * Endpoint para receber callbacks do SRS (on_publish, on_play, etc.)
 * Segue especificação oficial: https://ossrs.io/lts/en-us/docs/v6/doc/http-callback#response
 * 
 * Resposta obrigatória: HTTP 200 + code: 0 (sucesso) ou code != 0 (rejeitar)
 * Se response não for 200 ou code != 0, SRS desconecta o cliente
 */
router.post('/callback', async (req, res) => {
    try {
        const callbackData = req.body;
        const action = callbackData.action;
        
        console.log('[SRS CALLBACK] Evento recebido:', {
            action,
            client_id: callbackData.client_id,
            stream: callbackData.stream,
            param: callbackData.param,
            code: callbackData.code,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        let responseCode = 0; // 0 = permitir, != 0 = rejeitar
        let responseMessage = 'OK';

        // Processar diferentes tipos de eventos com validação
        switch (action) {
            case 'on_publish':
                // Validar stream publicado
                if (!callbackData.stream || !callbackData.client_id) {
                    responseCode = 1;
                    responseMessage = 'Stream ou client_id inválido';
                    console.error('[SRS CALLBACK] on_publish inválido:', callbackData);
                } else {
                    console.log(`[SRS CALLBACK] Stream publicado: ${callbackData.stream}`);
                    
                    // 🚀 CRÍTICO: Marcar stream como ativa no banco de dados
                    try {
                        const { Streamer } = require('../models');
                        const streamId = callbackData.stream; // O stream name do SRS
                        
                        // Extrair streamId do formato live/streamId
                        const cleanStreamId = streamId.includes('/') ? streamId.split('/').pop() : streamId;
                        
                        console.log(`[SRS CALLBACK] Atualizando stream ${cleanStreamId} para isLive: true (via SRS on_publish)`);
                        
                        const updatedStream = await Streamer.findOneAndUpdate(
                            { id: cleanStreamId },
                            {
                                $set: {
                                    isLive: true,
                                    streamStatus: 'active',
                                    startTime: new Date().toISOString(),
                                    updatedAt: new Date(),
                                    // 🚀 Registrar que SRS confirmou a publicação
                                    srsPublished: true,
                                    srsClientId: callbackData.client_id,
                                    srsPublishIp: req.ip
                                }
                            },
                            { new: true }
                        );
                        
                        if (updatedStream) {
                            console.log(`✅ [SRS CALLBACK] Stream ${cleanStreamId} marcada como ativa via SRS callback`);
                            
                            // Notificar WebSocket sobre stream ativa
                            try {
                                const socketService = require('../services/socket');
                                const socket = socketService.getSocket();
                                if (socket) {
                                    socket.emit('stream_started', {
                                        streamId: cleanStreamId,
                                        stream: updatedStream,
                                        source: 'srs_callback',
                                        data: callbackData
                                    });
                                    
                                    // Entrar na sala da stream para atualizações em tempo real
                                    socket.to(`stream_${cleanStreamId}`).emit('stream_status_updated', {
                                        isLive: true,
                                        streamStatus: 'active',
                                        streamId: cleanStreamId
                                    });
                                }
                            } catch (wsError) {
                                console.warn('[SRS CALLBACK] Erro ao notificar WebSocket:', wsError);
                            }
                        } else {
                            console.warn(`⚠️ [SRS CALLBACK] Stream ${cleanStreamId} não encontrada no banco`);
                        }
                    } catch (dbError) {
                        console.error('[SRS CALLBACK] Erro ao atualizar banco:', dbError);
                    }
                    
                    // Notificar WebSocket sobre novo stream (legado)
                    try {
                        const socketService = require('../services/socket');
                        const socket = socketService.getSocket();
                        if (socket) {
                            socket.emit('srs_stream_published', {
                                stream: callbackData.stream,
                                client_id: callbackData.client_id,
                                data: callbackData
                            });
                        }
                    } catch (wsError) {
                        console.warn('[SRS CALLBACK] Erro ao notificar WebSocket:', wsError);
                    }
                }
                break;

            case 'on_play':
                // Validar início de playback
                if (!callbackData.stream || !callbackData.client_id) {
                    responseCode = 1;
                    responseMessage = 'Stream ou client_id inválido';
                    console.error('[SRS CALLBACK] on_play inválido:', callbackData);
                } else {
                    console.log(`[SRS CALLBACK] Stream sendo assistido: ${callbackData.stream}`);
                    
                    // Notificar WebSocket sobre viewer
                    try {
                        const socketService = require('../services/socket');
                        const socket = socketService.getSocket();
                        if (socket) {
                            socket.emit('srs_stream_played', {
                                stream: callbackData.stream,
                                client_id: callbackData.client_id,
                                data: callbackData
                            });
                        }
                    } catch (wsError) {
                        console.warn('[SRS CALLBACK] Erro ao notificar WebSocket:', wsError);
                    }
                }
                break;

            case 'on_unpublish':
                // Stream parou de publicar
                console.log(`[SRS CALLBACK] Stream parado: ${callbackData.stream}`);
                
                // 🚀 CRÍTICO: Marcar stream como inativa no banco de dados
                try {
                    const { Streamer } = require('../models');
                    const streamId = callbackData.stream; // O stream name do SRS
                    
                    // Extrair streamId do formato live/streamId
                    const cleanStreamId = streamId.includes('/') ? streamId.split('/').pop() : streamId;
                    
                    console.log(`[SRS CALLBACK] Atualizando stream ${cleanStreamId} para isLive: false (via SRS on_unpublish)`);
                    
                    const updatedStream = await Streamer.findOneAndUpdate(
                        { id: cleanStreamId },
                        {
                            $set: {
                                isLive: false,
                                streamStatus: 'inactive',
                                endTime: new Date().toISOString(),
                                updatedAt: new Date(),
                                // 🚀 Registrar que SRS confirmou o unpublish
                                srsPublished: false,
                                srsUnpublishTime: new Date().toISOString()
                            }
                        },
                        { new: true }
                    );
                    
                    if (updatedStream) {
                        console.log(`✅ [SRS CALLBACK] Stream ${cleanStreamId} marcada como inativa via SRS callback`);
                        
                        // Notificar WebSocket sobre stream inativa
                        try {
                            const socketService = require('../services/socket');
                            const socket = socketService.getSocket();
                            if (socket) {
                                socket.emit('stream_ended', {
                                    streamId: cleanStreamId,
                                    stream: updatedStream,
                                    source: 'srs_callback',
                                    data: callbackData
                                });
                                
                                // Notificar sala da stream sobre mudança de status
                                socket.to(`stream_${cleanStreamId}`).emit('stream_status_updated', {
                                    isLive: false,
                                    streamStatus: 'inactive',
                                    streamId: cleanStreamId
                                });
                            }
                        } catch (wsError) {
                            console.warn('[SRS CALLBACK] Erro ao notificar WebSocket:', wsError);
                        }
                    } else {
                        console.warn(`⚠️ [SRS CALLBACK] Stream ${cleanStreamId} não encontrada no banco`);
                    }
                } catch (dbError) {
                    console.error('[SRS CALLBACK] Erro ao atualizar banco:', dbError);
                }
                
                try {
                    const socketService = require('../services/socket');
                    const socket = socketService.getSocket();
                    if (socket) {
                        socket.emit('srs_stream_unpublished', {
                            stream: callbackData.stream,
                            client_id: callbackData.client_id,
                            data: callbackData
                        });
                    }
                } catch (wsError) {
                    console.warn('[SRS CALLBACK] Erro ao notificar WebSocket:', wsError);
                }
                break;

            case 'on_stop':
                // Viewer parou de assistir
                console.log(`[SRS CALLBACK] Viewer parou: ${callbackData.stream}`);
                try {
                    const socketService = require('../services/socket');
                    const socket = socketService.getSocket();
                    if (socket) {
                        socket.emit('srs_stream_stopped', {
                            stream: callbackData.stream,
                            client_id: callbackData.client_id,
                            data: callbackData
                        });
                    }
                } catch (wsError) {
                    console.warn('[SRS CALLBACK] Erro ao notificar WebSocket:', wsError);
                }
                break;

            case 'on_dvr':
                // DVR file created
                console.log(`[SRS CALLBACK] DVR criado: ${callbackData.file}`);
                break;

            case 'on_hls':
                // HLS file created
                console.log(`[SRS CALLBACK] HLS criado: ${callbackData.file}`);
                break;

            default:
                console.warn(`[SRS CALLBACK] Evento não tratado: ${action}`);
                // Eventos desconhecidos são permitidos por padrão
                break;
        }

        // Responder conforme especificação SRS
        // HTTP 200 + code: 0 = sucesso
        // HTTP 200 + code != 0 = rejeitar cliente
        res.status(200).json({
            code: responseCode,
            msg: responseMessage
        });

        console.log(`[SRS CALLBACK] Resposta enviada: code=${responseCode}, msg="${responseMessage}"`);

    } catch (error: any) {
        console.error('[SRS CALLBACK] Erro crítico ao processar callback:', error);
        
        // Em caso de erro interno, rejeitar o cliente para manter segurança
        res.status(200).json({
            code: 1,
            msg: 'Internal Server Error'
        });
    }
});

/**
 * GET /api/srs/streams
 * Proxy para API oficial do SRS: GET /api/v1/streams
 * Query params: start, count
 * 
 * Retorna dados brutos do SRS para processamento no frontend
 * Trata offline/erro 500 corretamente
 */
router.get('/streams', async (req, res) => {
    try {
        const start = parseInt(req.query.start as string) || 0;
        const count = parseInt(req.query.count as string) || 50;
        
        // Usar API oficial do SRS diretamente
        const result = await srsApiService.getStreams(start, count);
        
        if (result.success) {
            // Dados reais do SRS
            res.json({
                success: true,
                data: result.data,
                total: result.total,
                server: result.server,
                serverRestarted: result.serverRestarted || false,
                pagination: {
                    start,
                    count,
                    total: result.total
                },
                timestamp: new Date().toISOString(),
                info: {
                    source: 'SRS Official API /api/v1/streams',
                    description: 'Dados brutos do SRS - processamento no frontend',
                    mapping: 'stream.name = userId (mapeado no cliente)',
                    note: 'Nenhum dado fake - tudo vem diretamente do SRS'
                }
            });
        } else {
            // SRS offline ou erro
            const statusCode = result.code || 500;
            
            res.status(statusCode).json({
                success: false,
                error: result.error,
                code: result.code,
                apiEndpoint: srsApiService.getBaseUrl(),
                timestamp: new Date().toISOString(),
                message: statusCode === 503 ? 
                    'SRS não está acessível para obter streams' : 
                    'Erro ao buscar streams do SRS',
                data: [], // Array vazio em vez de null
                total: 0
            });
        }
    } catch (error: any) {
        console.error('[SRS ROUTES] Erro ao buscar streams do SRS:', error);
        
        // Erro de conexão
        res.status(503).json({
            success: false,
            error: error.message || 'Falha na conexão com SRS',
            code: 503,
            apiEndpoint: srsApiService.getBaseUrl(),
            timestamp: new Date().toISOString(),
            message: 'Não foi possível conectar ao SRS para obter streams',
            data: [],
            total: 0
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
 * Retorna dados reais ou erro quando SRS offline
 */
router.get('/clients', async (req, res) => {
    try {
        const start = parseInt(req.query.start as string) || 0;
        const count = parseInt(req.query.count as string) || 10;
        
        const result = await srsApiService.getClients(start, count);
        
        if (result.success) {
            // Dados reais dos clientes conectados
            res.json({
                success: true,
                data: result.data,
                total: result.total,
                server: result.server,
                serverRestarted: result.serverRestarted || false,
                pagination: {
                    start,
                    count,
                    total: result.total
                },
                timestamp: new Date().toISOString(),
                source: 'SRS Official API /api/v1/clients'
            });
        } else {
            // SRS offline ou erro
            const statusCode = result.code || 500;
            
            res.status(statusCode).json({
                success: false,
                error: result.error,
                code: result.code,
                apiEndpoint: srsApiService.getBaseUrl(),
                timestamp: new Date().toISOString(),
                message: statusCode === 503 ? 
                    'SRS não está acessível para obter clientes' : 
                    'Erro ao listar clientes do SRS',
                data: [], // Array vazio
                total: 0
            });
        }
    } catch (error: any) {
        console.error('[SRS ROUTES] Erro ao listar clientes:', error);
        
        // Erro de conexão
        res.status(503).json({
            success: false,
            error: error.message || 'Falha na conexão com SRS',
            code: 503,
            apiEndpoint: srsApiService.getBaseUrl(),
            timestamp: new Date().toISOString(),
            message: 'Não foi possível conectar ao SRS para listar clientes',
            data: [],
            total: 0
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
