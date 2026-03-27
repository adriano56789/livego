/**
 * Serviço Frontend para Dados do SRS
 * Consome dados reais via backend API com tratamento robusto de erros
 * Segue documentação oficial OSSRS
 */

import axios from 'axios';

// Função interna para fazer requisições HTTP
const callApi = async <T = any>(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', url: string, data?: any): Promise<T> => {
  try {
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : `${window.location.protocol}//${window.location.hostname}`;

    const config: any = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error: any) {
    console.error(`[SRS Data Service] ${method} ${url}:`, error);
    throw error;
  }
};

export interface SRSStream {
  id: string;
  name: string;
  url?: string;
  app?: string;
  stream?: string;
  client_id?: string;
  kbps?: {
    recv_30s: number;
    send_30s: number;
  };
  clients?: number;
  duration?: number;
  created?: number;
}

export interface SRSClient {
  id: string;
  ip: string;
  url?: string;
  stream?: string;
  app?: string;
  type?: string;
  kbps?: {
    recv_30s: number;
    send_30s: number;
  };
  created?: number;
}

export interface SRSStatus {
  success: boolean;
  online: boolean;
  version?: string;
  server?: string;
  apiEndpoint?: string;
  message?: string;
  error?: string;
  code?: number;
  suggestions?: string[];
}

export interface SRSSummaries {
  success: boolean;
  data?: any;
  server?: string;
  serverRestarted?: boolean;
  source?: string;
  error?: string;
  code?: number;
}

class SRSDataService {
  /**
   * Verifica status do SRS
   * Retorna dados reais ou erro detalhado quando offline
   */
  async getStatus(): Promise<SRSStatus> {
    try {
      const response = await callApi<any>('GET', '/srs/status');
      return response;
    } catch (error: any) {
      console.error('[SRS Data Service] Erro ao obter status:', error);
      
      // Retornar status offline claro
      return {
        success: false,
        online: false,
        error: error.response?.data?.error || error.message || 'Erro desconhecido',
        code: error.response?.status || 500,
        message: 'SRS não está acessível',
        suggestions: [
          'Verifique se o SRS está rodando',
          'Confirme a configuração de rede',
          'Verifique o endpoint SRS_API_URL'
        ]
      };
    }
  }

  /**
   * Obtém estatísticas completas do SRS
   * Dados reais ou erro quando offline
   */
  async getSummaries(): Promise<SRSSummaries> {
    try {
      const response = await callApi<any>('GET', '/srs/summaries');
      return response;
    } catch (error: any) {
      console.error('[SRS Data Service] Erro ao obter sumários:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro ao obter estatísticas',
        code: error.response?.status || 500
      };
    }
  }

  /**
   * Lista streams ativos do SRS
   * Retorna dados reais ou array vazio com erro
   */
  async getStreams(start: number = 0, count: number = 50): Promise<{
    success: boolean;
    data: SRSStream[];
    total: number;
    server?: string;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await callApi<any>('GET', `/srs/streams?start=${start}&count=${count}`);
      return response;
    } catch (error: any) {
      console.error('[SRS Data Service] Erro ao obter streams:', error);
      
      return {
        success: false,
        data: [], // Array vazio em vez de null
        total: 0,
        error: error.response?.data?.error || error.message || 'Erro ao listar streams',
        message: 'Não foi possível obter streams do SRS'
      };
    }
  }

  /**
   * Obtém detalhes de um stream específico
   * Dados reais do SRS ou erro detalhado
   */
  async getStream(streamId: string): Promise<{
    success: boolean;
    data?: SRSStream;
    server?: string;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await callApi<any>('GET', `/srs/streams/${streamId}`);
      return response;
    } catch (error: any) {
      console.error(`[SRS Data Service] Erro ao obter stream ${streamId}:`, error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Stream não encontrado',
        message: 'Não foi possível obter detalhes do stream'
      };
    }
  }

  /**
   * Obtém estatísticas detalhadas de um stream
   * Inclui viewers, bitrate, etc. - dados reais
   */
  async getStreamStats(streamId: string): Promise<{
    success: boolean;
    data?: any;
    server?: string;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await callApi<any>('GET', `/srs/streams/${streamId}/stats`);
      return response;
    } catch (error: any) {
      console.error(`[SRS Data Service] Erro ao obter estatísticas do stream ${streamId}:`, error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro ao obter estatísticas',
        message: 'Não foi possível obter estatísticas do stream'
      };
    }
  }

  /**
   * Lista clientes conectados ao SRS
   * Dados reais dos clientes ou array vazio
   */
  async getClients(start: number = 0, count: number = 10): Promise<{
    success: boolean;
    data: SRSClient[];
    total: number;
    server?: string;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await callApi<any>('GET', `/srs/clients?start=${start}&count=${count}`);
      return response;
    } catch (error: any) {
      console.error('[SRS Data Service] Erro ao obter clientes:', error);
      
      return {
        success: false,
        data: [], // Array vazio
        total: 0,
        error: error.response?.data?.error || error.message || 'Erro ao listar clientes',
        message: 'Não foi possível obter clientes do SRS'
      };
    }
  }

  /**
   * Obtém detalhes de um cliente específico
   * Dados reais ou erro quando não encontrado
   */
  async getClient(clientId: string): Promise<{
    success: boolean;
    data?: SRSClient;
    server?: string;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await callApi<any>('GET', `/srs/clients/${clientId}`);
      return response;
    } catch (error: any) {
      console.error(`[SRS Data Service] Erro ao obter cliente ${clientId}:`, error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Cliente não encontrado',
        message: 'Não foi possível obter detalhes do cliente'
      };
    }
  }

  /**
   * Remove/desconecta um cliente do SRS
   * Retorna sucesso ou erro da operação
   */
  async kickClient(clientId: string): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    server?: string;
    error?: string;
  }> {
    try {
      const response = await callApi<any>('DELETE', `/srs/clients/${clientId}`);
      return response;
    } catch (error: any) {
      console.error(`[SRS Data Service] Erro ao remover cliente ${clientId}:`, error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erro ao remover cliente',
        message: 'Não foi possível desconectar o cliente'
      };
    }
  }

  /**
   * Verifica se SRS está online rapidamente
   * Usado para verificações rápidas de conectividade
   */
  async isOnline(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.success && status.online;
    } catch (error) {
      return false;
    }
  }

  /**
   * Busca stream pelo nome
   * Usa API real do SRS via backend
   */
  async findStream(streamName: string): Promise<{
    success: boolean;
    data?: SRSStream;
    server?: string;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await callApi<any>('GET', `/srs/find-stream/${streamName}`);
      return response;
    } catch (error: any) {
      console.error(`[SRS Data Service] Erro ao buscar stream ${streamName}:`, error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Stream não encontrado',
        message: 'Não foi possível encontrar o stream'
      };
    }
  }
}

export const srsDataService = new SRSDataService();
