// Serviço ICE Unificado - STUN + TURN
// Gerencia configurações ICE completas para WebRTC

import { stunService, STUNService, STUNResponse } from './stunService';
import { turnService, TURNService, TURNResponse } from './turnService';

export interface ICEConfig {
  stunServers: RTCIceServer[];
  turnServers: RTCIceServer[];
  fallbackServers: RTCIceServer[];
  iceTransportPolicy: 'all' | 'relay';
  bundlePolicy: 'max-bundle' | 'balanced' | 'max-compat';
}

export interface ICEStatus {
  stunConnected: boolean;
  turnConnected: boolean;
  publicIP: string | null;
  relayIP: string | null;
  lastUpdate: number;
}

export class ICEManagerService {
  private stunService: STUNService;
  private turnService: TURNService;
  private isInitialized = false;
  private status: ICEStatus = {
    stunConnected: false,
    turnConnected: false,
    publicIP: null,
    relayIP: null,
    lastUpdate: 0
  };

  constructor() {
    this.stunService = stunService;
    this.turnService = turnService;
  }

  /**
   * Inicializar todos os serviços ICE
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🧊 [ICE] Inicializando gerenciador ICE...');
      
      // Inicializar STUN
      const stunResult = await this.stunService.initialize();
      
      // Inicializar TURN
      const turnResult = await this.turnService.initialize();
      
      // Atualizar status
      this.status.stunConnected = stunResult;
      this.status.turnConnected = turnResult;
      this.status.lastUpdate = Date.now();
      
      if (stunResult || turnResult) {
        this.isInitialized = true;
        console.log('✅ [ICE] Gerenciador inicializado');
        console.log(`   STUN: ${stunResult ? '✅' : '❌'}`);
        console.log(`   TURN: ${turnResult ? '✅' : '❌'}`);
        return true;
      } else {
        console.error('❌ [ICE] Falha ao inicializar gerenciador');
        return false;
      }
    } catch (error) {
      console.error('❌ [ICE] Erro na inicialização:', error);
      return false;
    }
  }

  /**
   * Obter configuração ICE completa
   */
  getICEConfig(): RTCConfiguration {
    const servers: RTCIceServer[] = [];
    
    // Adicionar servidores STUN
    servers.push(this.stunService.getIceServer());
    
    // Adicionar múltiplos STUNs do Google para redundância
    servers.push(
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    );
    
    // Adicionar servidores TURN se disponível
    if (this.turnService.isReady()) {
      servers.push(...this.turnService.getIceServers());
    }

    return {
      iceServers: servers,
      iceTransportPolicy: this.getOptimalTransportPolicy(),
      bundlePolicy: 'max-bundle'
    };
  }

  /**
   * Obter política de transporte ótima baseada no ambiente
   */
  private getOptimalTransportPolicy(): 'all' | 'relay' {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Verificar se TURN está disponível
    const hasTurn = this.turnService.isReady();
    
    // Se for mobile E tiver TURN disponível, usar relay
    if (isMobile && hasTurn) {
      console.log('📱 [ICE] Mobile com TURN disponível - usando relay policy');
      return 'relay';
    }
    
    // Para desktop ou mobile sem TURN, usar todos os transportes
    console.log(`💻 [ICE] ${isMobile ? 'Mobile sem TURN' : 'Desktop'} - usando all policy`);
    return 'all';
  }

  /**
   * Testar todas as conexões
   */
  async testConnections(): Promise<{ stun: STUNResponse | null; turn: TURNResponse | null }> {
    console.log('🧪 [ICE] Testando conexões...');
    
    const stunResponse = await this.stunService.testConnection();
    const turnResponse = await this.turnService.testConnection();
    
    // Atualizar status
    this.status.stunConnected = !!stunResponse;
    this.status.turnConnected = !!turnResponse;
    this.status.publicIP = stunResponse?.publicIP || null;
    this.status.relayIP = turnResponse?.relayIP || null;
    this.status.lastUpdate = Date.now();
    
    console.log('📊 [ICE] Resultados dos testes:');
    console.log(`   STUN: ${stunResponse ? '✅' : '❌'} (IP: ${this.status.publicIP})`);
    console.log(`   TURN: ${turnResponse ? '✅' : '❌'} (Relay: ${this.status.relayIP})`);
    
    return { stun: stunResponse, turn: turnResponse };
  }

  /**
   * Obter status atual
   */
  getStatus(): ICEStatus {
    return { ...this.status };
  }

  /**
   * Verificar se sistema está pronto
   */
  isReady(): boolean {
    return this.isInitialized && (this.status.stunConnected || this.status.turnConnected);
  }

  /**
   * Renovar alocações
   */
  async renewAllocations(): Promise<boolean> {
    console.log('🔄 [ICE] Renovando alocações...');
    
    // Renovar TURN se necessário
    if (!this.turnService.isAllocationValid()) {
      const turnResult = await this.turnService.renewAllocation();
      this.status.turnConnected = !!turnResult;
      this.status.relayIP = turnResult?.relayIP || null;
    }
    
    // Testar STUN novamente
    const stunResult = await this.stunService.testConnection();
    this.status.stunConnected = !!stunResult;
    this.status.publicIP = stunResult?.publicIP || null;
    
    this.status.lastUpdate = Date.now();
    
    console.log('✅ [ICE] Alocações renovadas');
    return this.status.stunConnected || this.status.turnConnected;
  }

  /**
   * Obter diagnóstico completo
   */
  getDiagnostic(): any {
    return {
      initialized: this.isInitialized,
      ready: this.isReady(),
      status: this.status,
      stun: {
        url: this.stunService.getServerURL(),
        connected: this.status.stunConnected
      },
      turn: {
        config: this.turnService.getConfig(),
        connected: this.status.turnConnected,
        allocation: this.turnService.getCurrentAllocation()
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Limpar recursos
   */
  cleanup(): void {
    console.log('🧹 [ICE] Limpando recursos...');
    this.turnService.clearAllocation();
    this.isInitialized = false;
    this.status = {
      stunConnected: false,
      turnConnected: false,
      publicIP: null,
      relayIP: null,
      lastUpdate: 0
    };
  }
}

// Instância global do gerenciador ICE
export const iceManager = new ICEManagerService();
