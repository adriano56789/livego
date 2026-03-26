// Serviço TURN - Traversal Using Relays around NAT
// Gerencia conexão com servidor TURN para relay de conexões

export interface TURNConfig {
  url: string;
  username: string;
  credential: string;
  timeout: number;
  retryAttempts: number;
  protocol: 'udp' | 'tcp' | 'tls';
}

export interface TURNResponse {
  relayIP: string;
  relayPort: number;
  protocol: 'udp' | 'tcp' | 'tls';
  allocatedPort: number;
  timestamp: number;
  expiresAt: number;
}

export class TURNService {
  private config: TURNConfig;
  private isInitialized = false;
  private currentAllocation: TURNResponse | null = null;

  constructor(config?: Partial<TURNConfig>) {
    this.config = {
      url: import.meta.env?.VITE_TURN_URL || 'turn:openrelay.metered.ca:80',
      username: import.meta.env?.VITE_TURN_USER || 'openrelayproject',
      credential: import.meta.env?.VITE_TURN_PASS || 'openrelayproject',
      timeout: 10000,
      retryAttempts: 3,
      protocol: 'udp',
      ...config
    };
  }

  /**
   * Inicializar serviço TURN - SEM TESTE DE CONEXÃO
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 [TURN] Inicializando serviço...');
      
      // Serviço configurado SEM teste de conexão
      this.isInitialized = true;
      console.log('✅ [TURN] Serviço inicializado (sem teste de conexão)');
      return true;
    } catch (error) {
      console.error('❌ [TURN] Erro na inicialização:', error);
      return false;
    }
  }

  /**
   * Testar conexão com servidor TURN
   */
  async testConnection(): Promise<TURNResponse | null> {
    try {
      console.log(`🔍 [TURN] Testando conexão com: ${this.config.url}`);
      
      // Criar conexão de teste usando WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [this.getIceServer()]
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          pc.close();
          resolve(null);
        }, this.config.timeout);

        pc.onicecandidate = (event) => {
          if (event.candidate && event.candidate.type === 'relay') {
            clearTimeout(timeout);
            pc.close();
            
            const response: TURNResponse = {
              relayIP: event.candidate.address || 'unknown',
              relayPort: event.candidate.port || 0,
              protocol: event.candidate.protocol as 'udp' | 'tcp' | 'tls',
              allocatedPort: event.candidate.port || 0,
              timestamp: Date.now(),
              expiresAt: Date.now() + (600 * 1000) // 10 minutos
            };
            
            this.currentAllocation = response;
            console.log('✅ [TURN] Conexão bem-sucedida:', response);
            resolve(response);
          }
        };

        pc.createDataChannel('test');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
      });
    } catch (error) {
      console.error('❌ [TURN] Erro no teste de conexão:', error);
      return null;
    }
  }

  /**
   * Obter configuração ICE para WebRTC
   */
  getIceServer(): RTCIceServer {
    return {
      urls: this.config.url,
      username: this.config.username,
      credential: this.config.credential
    };
  }

  /**
   * Obter múltiplas configurações ICE (com fallback)
   */
  getIceServers(): RTCIceServer[] {
    const servers: RTCIceServer[] = [
      {
        urls: this.config.url,
        username: this.config.username,
        credential: this.config.credential
      }
    ];

    // Adicionar TURN/TLS se disponível
    if (this.config.protocol === 'tls' || this.config.url.includes('turns:')) {
      const tlsUrl = this.config.url.replace('turn:', 'turns:');
      servers.push({
        urls: tlsUrl,
        username: this.config.username,
        credential: this.config.credential
      });
    }

    return servers;
  }

  /**
   * Verificar se alocação atual está válida
   */
  isAllocationValid(): boolean {
    if (!this.currentAllocation) return false;
    return Date.now() < this.currentAllocation.expiresAt;
  }

  /**
   * Renovar alocação TURN
   */
  async renewAllocation(): Promise<TURNResponse | null> {
    console.log('🔄 [TURN] Renovando alocação...');
    const result = await this.testConnection();
    return result;
  }

  /**
   * Obter alocação atual
   */
  getCurrentAllocation(): TURNResponse | null {
    return this.isAllocationValid() ? this.currentAllocation : null;
  }

  /**
   * Verificar se serviço está pronto
   */
  isReady(): boolean {
    return this.isInitialized && this.isAllocationValid();
  }

  /**
   * Obter configuração atual
   */
  getConfig(): TURNConfig {
    return { ...this.config };
  }

  /**
   * Atualizar configuração
   */
  updateConfig(newConfig: Partial<TURNConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 [TURN] Configuração atualizada:', this.config);
  }

  /**
   * Limpar alocação atual
   */
  clearAllocation(): void {
    this.currentAllocation = null;
    console.log('🧹 [TURN] Alocação limpa');
  }
}

// Instância global do serviço TURN
export const turnService = new TURNService();
