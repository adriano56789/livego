// Hook para facilitar o uso do sistema de processamento de beleza
// Fornece uma interface simples para componentes React

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { videoProcessor, BeautyEffectSettings } from '../services/VideoProcessor';
import { beautyWebRTCIntegration } from '../services/BeautyWebRTCIntegration';

export interface UseBeautyProcessorOptions {
  autoInitialize?: boolean;
  onError?: (error: Error) => void;
  onInitialized?: () => void;
  onSettingsChanged?: (settings: BeautyEffectSettings) => void;
}

export interface UseBeautyProcessorReturn {
  // Estado
  isInitialized: boolean;
  isProcessing: boolean;
  isBeautyActive: boolean;
  currentSettings: BeautyEffectSettings;
  error: Error | null;
  
  // Ações
  initialize: (videoElement: HTMLVideoElement) => Promise<boolean>;
  startProcessing: () => Promise<MediaStream | null>;
  stopProcessing: () => void;
  updateSettings: (settings: Partial<BeautyEffectSettings>) => void;
  toggleBeauty: () => boolean;
  resetSettings: () => void;
  
  // Performance
  getPerformanceStats: () => Promise<any>;
  
  // Cleanup
  destroy: () => void;
}

export const useBeautyProcessor = (options: UseBeautyProcessorOptions = {}): UseBeautyProcessorReturn => {
  const {
    autoInitialize = false,
    onError,
    onInitialized,
    onSettingsChanged
  } = options;

  // Estado
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<BeautyEffectSettings>({
    whitening: 0,
    smoothing: 0,
    saturation: 0,
    contrast: 0
  });
  const [error, setError] = useState<Error | null>(null);

  // Refs para evitar race conditions
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const processedStreamRef = useRef<MediaStream | null>(null);

  // Inicializar processador
  const initialize = useCallback(async (videoElement: HTMLVideoElement): Promise<boolean> => {
    try {
      setError(null);
      videoRef.current = videoElement;

      const success = await videoProcessor.initialize(videoElement);
      if (!success) {
        throw new Error('Falha ao inicializar VideoProcessor');
      }

      setIsInitialized(true);
      onInitialized?.();
      
      console.log('✅ [BEAUTY_HOOK] Processador inicializado');
      return true;

    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      console.error('❌ [BEAUTY_HOOK] Erro na inicialização:', error);
      return false;
    }
  }, [onInitialized, onError]);

  // Iniciar processamento
  const startProcessing = useCallback(async (): Promise<MediaStream | null> => {
    if (!isInitialized) {
      const errorMsg = new Error('Processador não inicializado');
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    }

    try {
      setError(null);
      
      // Iniciar processamento no VideoProcessor
      const processedStream = videoProcessor.startProcessing();
      processedStreamRef.current = processedStream;
      setIsProcessing(true);

      // Configurar integração com WebRTC
      await beautyWebRTCIntegration.initialize(processedStream);
      
      console.log('✅ [BEAUTY_HOOK] Processamento iniciado');
      return processedStream;

    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      console.error('❌ [BEAUTY_HOOK] Erro ao iniciar processamento:', error);
      return null;
    }
  }, [isInitialized, onError]);

  // Parar processamento
  const stopProcessing = useCallback(() => {
    try {
      videoProcessor.stopProcessing();
      beautyWebRTCIntegration.stopBeautyProcessing();
      processedStreamRef.current = null;
      setIsProcessing(false);
      
      console.log('⏹️ [BEAUTY_HOOK] Processamento parado');
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      console.error('❌ [BEAUTY_HOOK] Erro ao parar processamento:', error);
    }
  }, [onError]);

  // Atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<BeautyEffectSettings>) => {
    try {
      const updatedSettings = { ...currentSettings, ...newSettings };
      setCurrentSettings(updatedSettings);
      
      // Atualizar no processador
      videoProcessor.updateBeautySettings(updatedSettings);
      
      // Notificar callback
      onSettingsChanged?.(updatedSettings);
      
      console.log('🎨 [BEAUTY_HOOK] Configurações atualizadas:', updatedSettings);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      console.error('❌ [BEAUTY_HOOK] Erro ao atualizar configurações:', error);
    }
  }, [currentSettings, onSettingsChanged, onError]);

  // Alternar beleza
  const toggleBeauty = useCallback((): boolean => {
    try {
      const isActive = beautyWebRTCIntegration.toggleBeauty();
      
      if (isActive && !isProcessing) {
        // Se ativou e não está processando, iniciar processamento
        startProcessing();
      } else if (!isActive && isProcessing) {
        // Se desativou e está processando, parar
        stopProcessing();
      }
      
      console.log('🔄 [BEAUTY_HOOK] Beleza alternada:', isActive);
      return isActive;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      console.error('❌ [BEAUTY_HOOK] Erro ao alternar beleza:', error);
      return false;
    }
  }, [isProcessing, startProcessing, stopProcessing, onError]);

  // Resetar configurações
  const resetSettings = useCallback(() => {
    const defaultSettings: BeautyEffectSettings = {
      whitening: 0,
      smoothing: 0,
      saturation: 0,
      contrast: 0
    };
    
    updateSettings(defaultSettings);
    console.log('🔄 [BEAUTY_HOOK] Configurações resetadas');
  }, [updateSettings]);

  // Obter estatísticas de performance
  const getPerformanceStats = useCallback(async () => {
    try {
      return await beautyWebRTCIntegration.getPerformanceStats();
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      console.error('❌ [BEAUTY_HOOK] Erro ao obter estatísticas:', error);
      return null;
    }
  }, [onError]);

  // Verificar se beleza está ativa
  const isBeautyActive = beautyWebRTCIntegration.isBeautyActive();

  // Cleanup ao desmontar
  const destroy = useCallback(() => {
    stopProcessing();
    videoProcessor.destroy();
    beautyWebRTCIntegration.destroy();
    
    setIsInitialized(false);
    setIsProcessing(false);
    setError(null);
    videoRef.current = null;
    processedStreamRef.current = null;
    
    console.log('🗑️ [BEAUTY_HOOK] Recursos liberados');
  }, [stopProcessing]);

  // Auto-inicialização se solicitado
  useEffect(() => {
    if (autoInitialize && videoRef.current && !isInitialized) {
      initialize(videoRef.current);
    }
  }, [autoInitialize, isInitialized, initialize]);

  // Cleanup automático
  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return {
    // Estado
    isInitialized,
    isProcessing,
    isBeautyActive,
    currentSettings,
    error,
    
    // Ações
    initialize,
    startProcessing,
    stopProcessing,
    updateSettings,
    toggleBeauty,
    resetSettings,
    
    // Performance
    getPerformanceStats,
    
    // Cleanup
    destroy
  };
};

// Hook simplificado para casos básicos
export const useSimpleBeauty = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const beauty = useBeautyProcessor({
    onInitialized: () => {
      console.log('🎨 [SIMPLE_BEAUTY] Sistema pronto');
    },
    onError: (error) => {
      console.error('❌ [SIMPLE_BEAUTY] Erro:', error);
    }
  });

  // Auto-inicializar quando o vídeo estiver disponível
  useEffect(() => {
    if (videoRef.current && !beauty.isInitialized) {
      beauty.initialize(videoRef.current);
    }
  }, [videoRef.current, beauty.isInitialized, beauty.initialize]);

  return {
    isReady: beauty.isInitialized,
    isActive: beauty.isBeautyActive,
    settings: beauty.currentSettings,
    updateSettings: beauty.updateSettings,
    toggle: beauty.toggleBeauty,
    reset: beauty.resetSettings
  };
};
