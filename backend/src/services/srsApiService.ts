/**
 * Serviço de Integração com API HTTP do SRS
 * Seguindo documentação oficial: https://ossrs.io/lts/en-us/docs/v6/doc/http-api
 */

import axios from 'axios';

class SrsApiService {
    private baseUrl: string;
    private authToken?: string;

    constructor() {
        // Usar IP público para produção, IP local apenas para desenvolvimento
        this.baseUrl = process.env.SRS_API_URL || 'http://72.60.249.175:1985';
        this.authToken = process.env.SRS_API_TOKEN;
    }

    /**
     * Obtém estatísticas do sistema SRS
     * GET /api/v1/summaries
     */
    async getSummaries() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/summaries`, {
                headers: this.getHeaders(),
                timeout: 5000
            });
            
            return {
                success: true,
                data: response.data,
                server: response.data.server
            };
        } catch (error: any) {
            console.error('[SRS API] Erro ao obter sumários:', error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                code: error.response?.status || 500
            };
        }
    }

    /**
     * Lista todos os vhosts configurados
     * GET /api/v1/vhosts
     */
    async getVhosts() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/vhosts`, {
                headers: this.getHeaders(),
                timeout: 5000
            });
            
            return {
                success: true,
                data: response.data.vhosts,
                server: response.data.server
            };
        } catch (error: any) {
            console.error('[SRS API] Erro ao obter vhosts:', error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                code: error.response?.status || 500
            };
        }
    }

    /**
     * Lista todos os streams ativos
     * GET /api/v1/streams
     * Parâmetros opcionais: start, count
     */
    async getStreams(start: number = 0, count: number = 10) {
        try {
            const params = new URLSearchParams({
                start: start.toString(),
                count: count.toString()
            });

            const response = await axios.get(`${this.baseUrl}/api/v1/streams?${params}`, {
                headers: this.getHeaders(),
                timeout: 5000
            });
            
            return {
                success: true,
                data: response.data.streams,
                server: response.data.server,
                total: response.data.streams?.length || 0
            };
        } catch (error: any) {
            console.error('[SRS API] Erro ao obter streams:', error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                code: error.response?.status || 500
            };
        }
    }

    /**
     * Obtém detalhes de um stream específico
     * GET /api/v1/streams/{id}
     */
    async getStream(streamId: string) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/streams/${streamId}`, {
                headers: this.getHeaders(),
                timeout: 5000
            });
            
            return {
                success: true,
                data: response.data,
                server: response.data.server
            };
        } catch (error: any) {
            console.error(`[SRS API] Erro ao obter stream ${streamId}:`, error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                code: error.response?.status || 500
            };
        }
    }

    /**
     * Lista todos os clientes conectados
     * GET /api/v1/clients
     * Parâmetros opcionais: start, count
     */
    async getClients(start: number = 0, count: number = 10) {
        try {
            const params = new URLSearchParams({
                start: start.toString(),
                count: count.toString()
            });

            const response = await axios.get(`${this.baseUrl}/api/v1/clients?${params}`, {
                headers: this.getHeaders(),
                timeout: 5000
            });
            
            return {
                success: true,
                data: response.data.clients,
                server: response.data.server,
                total: response.data.clients?.length || 0
            };
        } catch (error: any) {
            console.error('[SRS API] Erro ao obter clientes:', error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                code: error.response?.status || 500
            };
        }
    }

    /**
     * Obtém detalhes de um cliente específico
     * GET /api/v1/clients/{id}
     */
    async getClient(clientId: string) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/clients/${clientId}`, {
                headers: this.getHeaders(),
                timeout: 5000
            });
            
            return {
                success: true,
                data: response.data,
                server: response.data.server
            };
        } catch (error: any) {
            console.error(`[SRS API] Erro ao obter cliente ${clientId}:`, error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                code: error.response?.status || 500
            };
        }
    }

    /**
     * Remove/desconecta um cliente
     * DELETE /api/v1/clients/{id}
     */
    async kickClient(clientId: string) {
        try {
            const response = await axios.delete(`${this.baseUrl}/api/v1/clients/${clientId}`, {
                headers: this.getHeaders(),
                timeout: 5000
            });
            
            return {
                success: true,
                data: response.data,
                server: response.data.server
            };
        } catch (error: any) {
            console.error(`[SRS API] Erro ao remover cliente ${clientId}:`, error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                code: error.response?.status || 500
            };
        }
    }

    /**
     * WebRTC Publish - WHIP (WebRTC-HTTP Ingestion Protocol)
     * POST /rtc/v1/whip/?app=live&stream=livestream
     */
    async publishWebRTC(app: string, stream: string, sdp: string) {
        try {
            const params = new URLSearchParams({
                app,
                stream
            });

            const response = await axios.post(
                `${this.baseUrl}/rtc/v1/whip/?${params}`,
                sdp,
                {
                    headers: {
                        ...this.getHeaders(),
                        'Content-Type': 'application/sdp'
                    },
                    timeout: 10000
                }
            );
            
            // WHIP specification usa status 201
            return {
                success: response.status === 201,
                data: response.data,
                status: response.status,
                server: response.data.server
            };
        } catch (error: any) {
            console.error(`[SRS API] Erro no WebRTC publish ${app}/${stream}:`, error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                code: error.response?.status || 500,
                status: error.response?.status
            };
        }
    }

    /**
     * WebRTC Play - WHEP (WebRTC-HTTP Egress Protocol)
     * POST /rtc/v1/whep/?app=live&stream=livestream
     */
    async playWebRTC(app: string, stream: string, sdp: string) {
        try {
            const params = new URLSearchParams({
                app,
                stream
            });

            const response = await axios.post(
                `${this.baseUrl}/rtc/v1/whep/?${params}`,
                sdp,
                {
                    headers: {
                        ...this.getHeaders(),
                        'Content-Type': 'application/sdp'
                    },
                    timeout: 10000
                }
            );
            
            // WHEP specification usa status 201
            return {
                success: response.status === 201,
                data: response.data,
                status: response.status,
                server: response.data.server
            };
        } catch (error: any) {
            console.error(`[SRS API] Erro no WebRTC play ${app}/${stream}:`, error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                code: error.response?.status || 500,
                status: error.response?.status
            };
        }
    }

    /**
     * Verifica se o SRS está online e acessível
     * GET /api/v1/versions
     */
    async checkConnection() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/versions`, {
                headers: this.getHeaders(),
                timeout: 3000
            });
            
            return {
                success: true,
                data: response.data,
                server: response.data.server,
                version: response.data.version
            };
        } catch (error: any) {
            console.error('[SRS API] SRS não está acessível:', error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                code: error.response?.status || 500
            };
        }
    }

    /**
     * Obtém informações de um stream específico pelo nome
     * Busca em todos os streams ativos
     */
    async findStreamByName(streamName: string) {
        try {
            // Primeiro tenta obter diretamente pelo ID
            const directResult = await this.getStream(streamName);
            if (directResult.success) {
                return directResult;
            }

            // Se não encontrar, busca em todos os streams
            const streamsResult = await this.getStreams(0, 100);
            if (!streamsResult.success) {
                return streamsResult;
            }

            const stream = streamsResult.data.find((s: any) => 
                s.name === streamName || 
                s.url?.includes(streamName) ||
                s.stream === streamName
            );

            if (stream) {
                return {
                    success: true,
                    data: stream,
                    server: streamsResult.server
                };
            }

            return {
                success: false,
                error: `Stream ${streamName} não encontrado`,
                code: 404
            };
        } catch (error: any) {
            console.error(`[SRS API] Erro ao buscar stream ${streamName}:`, error.message);
            return {
                success: false,
                error: error.message,
                code: 500
            };
        }
    }

    /**
     * Obtém estatísticas detalhadas de um stream
     * Inclui viewers, bitrate, etc.
     */
    async getStreamStats(streamId: string) {
        try {
            const streamResult = await this.getStream(streamId);
            if (!streamResult.success) {
                return streamResult;
            }

            const stream = streamResult.data;
            const clients = await this.getClients(0, 50);

            // Filtrar clientes conectados a este stream
            const streamClients = clients.success ? 
                clients.data.filter((client: any) => 
                    client.stream === streamId || 
                    client.url?.includes(streamId)
                ) : [];

            return {
                success: true,
                data: {
                    ...stream,
                    clients: streamClients,
                    viewerCount: streamClients.length,
                    bandwidth: stream.kbps || 0,
                    duration: stream.duration || 0
                },
                server: streamResult.server
            };
        } catch (error: any) {
            console.error(`[SRS API] Erro ao obter estatísticas do stream ${streamId}:`, error.message);
            return {
                success: false,
                error: error.message,
                code: 500
            };
        }
    }

    /**
     * Prepara headers para requisições à API
     */
    private getHeaders() {
        const headers: any = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Adicionar autenticação se configurada
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        return headers;
    }
}

export default new SrsApiService();
