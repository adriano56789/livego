// Serviço STUN - Session Traversal Utilities for NAT
// Gerencia conexão com servidor STUN para descoberta de IP público

export interface STUNConfig {
  url: string;
  timeout: number;
  retryAttempts: number;
}

export interface STUNResponse {
  publicIP: string;
  port: number;
  protocol: 'udp' | 'tcp';
  timestamp: number;
}

export class STUNService {
  private config: STUNConfig;
  private isInitialized = false;

  constructor(config?: Partial<STUNConfig>) {
    this.config = {
      url: import.meta.env?.VITE_STUN_URL || 'stun:72.60.249.175:3478',
      timeout: 5000,
      retryAttempts: 3,
      ...config
    };
  }

  /**
   * Inicializar serviço STUN
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔥 [STUN] Inicializando serviço...');
      
      // Testar conexão com servidor STUN
      const testResult = await this.testConnection();
      
      if (testResult) {
        this.isInitialized = true;
        console.log('✅ [STUN] Serviço inicializado com sucesso');
        return true;
      } else {
        console.error('❌ [STUN] Falha ao inicializar serviço');
        return false;
      }
    } catch (error) {
      console.error('❌ [STUN] Erro na inicialização:', error);
      return false;
    }
  }

  /**
   * Testar conexão com servidor STUN
   */
  async testConnection(): Promise<STUNResponse | null> {
    try {
      console.log(`🔍 [STUN] Testando conexão com: ${this.config.url}`);
      
      // Criar conexão de teste usando WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: this.config.url }]
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          pc.close();
          resolve(null);
        }, this.config.timeout);

        pc.onicecandidate = (event) => {
          if (event.candidate && event.candidate.type === 'srflx') {
            clearTimeout(timeout);
            pc.close();
            
            const response: STUNResponse = {
              publicIP: event.candidate.address || 'unknown',
              port: event.candidate.port || 0,
              protocol: event.candidate.protocol as 'udp' | 'tcp',
              timestamp: Date.now()
            };
            
            console.log('✅ [STUN] Conexão bem-sucedida:', response);
            resolve(response);
          }
        };

        pc.createDataChannel('test');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
      });
    } catch (error) {
      console.error('❌ [STUN] Erro no teste de conexão:', error);
      return null;
    }
  }

  /**
   * Obter configuração ICE para WebRTC
   */
  getIceServer(): RTCIceServer {
    return {
      urls: this.config.url
    };
  }

  /**
   * Obter IP público atual
   */
  async getPublicIP(): Promise<string | null> {
    const response = await this.testConnection();
    return response ? response.publicIP : null;
  }

  /**
   * Verificar se serviço está pronto
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Obter URL do servidor STUN
   */
  getServerURL(): string {
    return this.config.url;
  }

  /**
   * Atualizar configuração
   */
  updateConfig(newConfig: Partial<STUNConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 [STUN] Configuração atualizada:', this.config);
  }
}

// Instância global do serviço STUN
export const stunService = new STUNService();
