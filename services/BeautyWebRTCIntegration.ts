// Integração entre sistema de beleza e WebRTC
// Gerencia o fluxo de vídeo processado para transmissão

import { videoProcessor, BeautyEffectSettings } from './VideoProcessor';
import { webRTCService } from './webrtcService';

export interface WebRTCBeautyConfig {
  enableBeauty: boolean;
  settings: BeautyEffectSettings;
  quality: {
    width: number;
    height: number;
    frameRate: number;
  };
}

export class BeautyWebRTCIntegration {
  private originalStream: MediaStream | null = null;
  private processedStream: MediaStream | null = null;
  private isProcessing = false;
  private config: WebRTCBeautyConfig;
  
  // Event listeners
  private onProcessedStreamCallback?: (stream: MediaStream) => void;
  private onErrorCallback?: (error: Error) => void;

  constructor(config?: Partial<WebRTCBeautyConfig>) {
    this.config = {
      enableBeauty: false,
      settings: {
        whitening: 0,
        smoothing: 0,
        saturation: 0,
        contrast: 0
      },
      quality: {
        width: 1280,
        height: 720,
        frameRate: 30
      },
      ...config
    };
  }

  /**
   * Inicializar integração com stream original
   */
  async initialize(originalStream: MediaStream): Promise<boolean> {
    try {
      this.originalStream = originalStream;
      
      // Obter tracks de vídeo
      const videoTracks = originalStream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('Stream não contém tracks de vídeo');
      }

      // Obter constraints do vídeo
      const videoTrack = videoTracks[0];
      const settings = videoTrack.getSettings();
      
      // Atualizar configuração baseada no stream original
      this.config.quality = {
        width: settings.width || 1280,
        height: settings.height || 720,
        frameRate: settings.frameRate || 30
      };

      console.log('✅ [BEAUTY_WEBRTC] Integrado com stream original', this.config.quality);
      return true;

    } catch (error) {
      console.error('❌ [BEAUTY_WEBRTC] Erro na inicialização:', error);
      this.onErrorCallback?.(error as Error);
      return false;
    }
  }

  /**
   * Iniciar processamento de beleza
   */
  async startBeautyProcessing(videoElement: HTMLVideoElement): Promise<MediaStream | null> {
    try {
      if (!this.originalStream) {
        throw new Error('Stream original não inicializado');
      }

      // Inicializar processador de vídeo
      const success = await videoProcessor.initialize(videoElement);
      if (!success) {
        throw new Error('Falha ao inicializar VideoProcessor');
      }

      // Aplicar configurações atuais
      videoProcessor.updateBeautySettings(this.config.settings);

      // Iniciar processamento
      const processedStream = videoProcessor.startProcessing();
      this.processedStream = processedStream;
      this.isProcessing = true;

      // Notificar callback
      this.onProcessedStreamCallback?.(processedStream);

      console.log('✅ [BEAUTY_WEBRTC] Processamento de beleza iniciado');
      return processedStream;

    } catch (error) {
      console.error('❌ [BEAUTY_WEBRTC] Erro ao iniciar processamento:', error);
      this.onErrorCallback?.(error as Error);
      return null;
    }
  }

  /**
   * Parar processamento de beleza
   */
  stopBeautyProcessing(): void {
    if (this.isProcessing) {
      videoProcessor.stopProcessing();
      this.isProcessing = false;
      this.processedStream = null;
      
      console.log('⏹️ [BEAUTY_WEBRTC] Processamento de beleza parado');
    }
  }

  /**
   * Alternar processamento de beleza
   */
  toggleBeauty(): boolean {
    this.config.enableBeauty = !this.config.enableBeauty;
    
    if (this.config.enableBeauty) {
      console.log('🔄 [BEAUTY_WEBRTC] Beleza ativada');
    } else {
      this.stopBeautyProcessing();
      console.log('🔄 [BEAUTY_WEBRTC] Beleza desativada');
    }
    
    return this.config.enableBeauty;
  }

  /**
   * Atualizar configurações de beleza
   */
  updateBeautySettings(settings: Partial<BeautyEffectSettings>): void {
    this.config.settings = { ...this.config.settings, ...settings };
    
    if (this.isProcessing) {
      videoProcessor.updateBeautySettings(this.config.settings);
    }
  }

  /**
   * Obter stream ativo (processado ou original)
   */
  getActiveStream(): MediaStream | null {
    if (this.config.enableBeauty && this.processedStream) {
      return this.processedStream;
    }
    return this.originalStream;
  }

  /**
   * Configurar WebRTC para usar stream processado
   */
  async updateWebRTCStream(): Promise<boolean> {
    try {
      const activeStream = this.getActiveStream();
      if (!activeStream) {
        throw new Error('Nenhum stream ativo disponível');
      }

      // Se estiver em uma chamada WebRTC, atualizar o stream
      if (webRTCService.getState() === 'connected') {
        // Implementar atualização de stream no WebRTC
        // Isso depende da implementação específica do webRTCService
        console.log('🔄 [BEAUTY_WEBRTC] Atualizando stream WebRTC');
        
        // Aqui você precisaria implementar a lógica específica
        // para substituir o stream na conexão WebRTC existente
        // webRTCService.replaceVideoTrack(activeStream.getVideoTracks()[0]);
      }

      return true;

    } catch (error) {
      console.error('❌ [BEAUTY_WEBRTC] Erro ao atualizar WebRTC:', error);
      this.onErrorCallback?.(error as Error);
      return false;
    }
  }

  /**
   * Obter configuração atual
   */
  getConfig(): WebRTCBeautyConfig {
    return { ...this.config };
  }

  /**
   * Verificar se está processando
   */
  isBeautyActive(): boolean {
    return this.config.enableBeauty && this.isProcessing;
  }

  /**
   * Obter estatísticas de performance
   */
  async getPerformanceStats(): Promise<{
    isProcessing: boolean;
    fps: number;
    resolution: { width: number; height: number };
    quality: string;
  }> {
    const stats = {
      isProcessing: this.isProcessing,
      fps: this.config.quality.frameRate,
      resolution: this.config.quality,
      quality: this.getQualityLevel()
    };

    // Se possível, obter FPS real do processador
    if (this.isProcessing) {
      // Implementar medição de FPS real
      // stats.fps = await videoProcessor.getCurrentFPS();
    }

    return stats;
  }

  /**
   * Determinar nível de qualidade baseado na resolução
   */
  private getQualityLevel(): string {
    const { width, height } = this.config.quality;
    const pixels = width * height;

    if (pixels <= 640 * 480) return 'low';
    if (pixels <= 1280 * 720) return 'medium';
    if (pixels <= 1920 * 1080) return 'high';
    return 'ultra';
  }

  /**
   * Configurar listeners de eventos
   */
  onProcessedStream(callback: (stream: MediaStream) => void): void {
    this.onProcessedStreamCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Limpar recursos
   */
  destroy(): void {
    this.stopBeautyProcessing();
    
    // Limpar streams
    if (this.originalStream) {
      this.originalStream.getTracks().forEach(track => track.stop());
      this.originalStream = null;
    }
    
    if (this.processedStream) {
      this.processedStream.getTracks().forEach(track => track.stop());
      this.processedStream = null;
    }
    
    // Limpar callbacks
    this.onProcessedStreamCallback = undefined;
    this.onErrorCallback = undefined;
    
    // Limpar processador
    videoProcessor.destroy();
    
    console.log('🗑️ [BEAUTY_WEBRTC] Recursos liberados');
  }
}

// Instância global
export const beautyWebRTCIntegration = new BeautyWebRTCIntegration();

// Hook para React (opcional)
export const useBeautyWebRTC = () => {
  return beautyWebRTCIntegration;
};
